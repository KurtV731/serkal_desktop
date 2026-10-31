'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto');
const protocol=require('../2 src/common/archive-calendar-copy'),scope=require('../2 src/common/calendar-scope'),copy=require('../2 src/common/archive-copy');
const {ArchiveSession}=require('../2 src/common/archive-session');
const year=new Date().getFullYear(),date=year+'-12-01';
const entry=id=>({tmdbId:id,title:'Series '+id,year,seasonLabel:'S01',activeDates:[date,date.slice(0,8)+'08'],seen:false});
const before=Array.from({length:150},(_,i)=>entry(i+1));
const projection=entries=>({target:'google|calendar',groups:protocol.projection(entries,year)});
const remote=protocol.plan(before,[],'original',year,true).map(o=>structuredClone(o.body));
for(const e of remote)e.description='Old unrelated Calendar text';
const after=before.filter(e=>e.tmdbId!==2).concat(entry(200));
const changed=scope.changes(projection(before),projection(after));assert.deepEqual(changed,['200:S01','2:S01']);
const ops=protocol.plan(after,remote,'new',year,true,changed);
assert.equal(ops.length,4);assert.equal(ops.filter(o=>o.method==='POST').length,2);assert.equal(ops.filter(o=>o.method==='DELETE').length,2);assert(!ops.some(o=>o.method==='PUT'));
assert.deepEqual(scope.changes(projection(before),projection(before.map(e=>({...e,seen:true})))),[]);
assert.deepEqual(protocol.plan(after,remote,'new',year,true,[]),[]);
const announced={...entry(300),announcementOnly:true,announcements:[{season:2,date,title:'Upcoming',language:'en',episodeCount:8,history:[]}]};
assert.deepEqual(Object.keys(protocol.projection([announced],year)),['300:S02']);
assert.equal(protocol.plan([announced],[],'r',year,true,['301:S02']).length,0);
assert.equal(protocol.plan([announced],[],'r',year,true,['300:S02']).length,1);
assert.equal(scope.changes(projection(before),{...projection(before),target:'google|another'}),null);
(async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'serkal-scopes-')),folder=path.join(root,'archive');fs.mkdirSync(folder);
 const files=entries=>{const content=JSON.stringify(entries);return [{name:'Archive.txt',content,sha256:copy.hash(content)}];};
 let cloud={schema:2,releaseNumber:copy.RELEASE,owner:'owner',revision:crypto.randomUUID(),parent:'',generatedAt:new Date().toISOString(),files:files(before),calendar:{mode:'google',id:'calendar'}};
 let uploads=0,network=0,fail=true,runs=[];
 const events=new Map(remote.map(e=>[e.id,e]));
 const opts={folder:()=>folder,calendar:()=>cloud.calendar,selectCalendar:()=>{},confirmedFile:path.join(root,'confirmed.json'),
  calendarProjection:r=>projection(JSON.parse(r.files[0].content)),connect:async()=>{network++;return {owner:'owner',load:async()=>structuredClone(cloud),save:async r=>{uploads++;cloud=structuredClone(r);}};},
  calendarSync:async(record,scopes,remaining)=>{
   runs.push(scopes);const work=protocol.plan(JSON.parse(record.files[0].content),[...events.values()],record.revision,year,true,scopes);
   const groups=new Map();for(const op of work){const k=protocol.group(op.body||events.get(op.id));if(!groups.has(k))groups.set(k,[]);groups.get(k).push(op);}
   remaining([...groups.keys()]);
   for(const [k,list] of groups){if(fail&&k==='200:S01')throw Error('Injected Calendar rate limit');for(const op of list){if(op.method==='DELETE')events.delete(op.id);else events.set(op.body.id||op.id,{...op.body,id:op.body.id||op.id});}groups.delete(k);remaining([...groups.keys()]);}
  }};
 try{
  let s=new ArchiveSession(opts);await s.start();assert.equal((await s.finish()).status,'unchanged');assert.equal(network,1);
  fs.writeFileSync(path.join(folder,'Archive.txt'),JSON.stringify(after));s.changed();let result=await s.finish();assert(result.warning);assert.equal(uploads,1);
  assert.deepEqual(JSON.parse(fs.readFileSync(opts.confirmedFile+'.calendar-pending')).scopes,['200:S01']);
  // Restart: completed deletion flag is gone; only unfinished insertion is retried.
  s=new ArchiveSession(opts);await s.start();fail=false;result=await s.finish();assert.equal(result.warning,'');assert.deepEqual(runs.at(-1),['200:S01']);assert.equal(uploads,1);assert(!fs.existsSync(opts.confirmedFile+'.calendar-pending'));
  const count=network;assert.equal((await s.finish()).status,'unchanged');assert.equal(network,count);
  assert.equal([...events.values()].filter(e=>protocol.group(e)==='2:S01').length,0);
  assert.equal([...events.values()].filter(e=>protocol.group(e)==='200:S01').length,2);
  assert.equal([...events.values()].find(e=>protocol.group(e)==='3:S01').description,'Old unrelated Calendar text');
  // A later edit after successful completion creates just its own flag.
  const next=after.map(e=>e.tmdbId===3?{...e,activeDates:[date]}:e);fs.writeFileSync(path.join(folder,'Archive.txt'),JSON.stringify(next));s.changed();await s.finish();assert.deepEqual(runs.at(-1),['3:S01']);
  console.log('Calendar scopes: 150 series / 300 divergent remote events, insertion+deletion only four writes; seen/no-op zero work; announcement isolation; successful flags cleared and failed scopes resumed after restart without another archive upload passed');
 }finally{fs.rmSync(root,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1;});

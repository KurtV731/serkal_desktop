'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),vm=require('node:vm'),crypto=require('node:crypto');
const {create,limited}=require('../2 src/common/calendar-rate-limit');
const {ArchiveSession}=require('../2 src/common/archive-session'),copy=require('../2 src/common/archive-copy');
const {prepareSessionClose}=require('../2 src/common/session-close');
const quota={ok:false,status:403,data:{error:{errors:[{domain:'usageLimits',reason:'rateLimitExceeded',message:'Rate Limit Exceeded'}],code:403,message:'Rate Limit Exceeded'}}};
(async()=>{
 let clock=0,delays=[],starts=[],active=0,maximum=0;
 const options={now:()=>clock,sleep:async ms=>{delays.push(ms);clock+=ms;},random:()=>0};
 const policy=create(options);let attempts=0;
 const result=await policy.run(async()=>{starts.push(clock);return ++attempts<3?quota:{ok:true};});
 assert(result.ok);assert.deepEqual(delays,[1000,2000]);assert.equal(attempts,3);
 await Promise.all(Array.from({length:12},()=>policy.run(async()=>{active++;maximum=Math.max(maximum,active);starts.push(clock);await Promise.resolve();active--;return {ok:true};})));
 assert.equal(maximum,1);for(let i=1;i<starts.length;i++)assert(starts[i]-starts[i-1]>=250);
 clock=0;let calls=0;const stop=create({...options,deadline:()=>1500});assert.equal(await stop.run(async()=>{calls++;return quota;}),quota);assert.equal(calls,2);
 assert.equal(await stop.run(async()=>{throw Error('must not send after quota exhausted');}),quota);
 assert(!limited({status:403,data:{error:{errors:[{reason:'forbidden'}]}}}));assert(limited({status:429}));
 let permanent=0;await create(options).run(async()=>{permanent++;return {status:403,data:{error:{errors:[{reason:'forbidden'}]}}};});assert.equal(permanent,1);
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'serkal-calendar-retry-')),folder=path.join(root,'archive');fs.mkdirSync(folder);
 let content='date=2027-01-01';let cloud={schema:2,releaseNumber:copy.RELEASE,owner:'owner',revision:crypto.randomUUID(),parent:'',generatedAt:new Date().toISOString(),files:[{name:'Series.txt',content,sha256:copy.hash(content)}],calendar:{mode:'google',id:'calendar'}};
 let uploads=0,runs=0,fail=true;
 const opts={folder:()=>folder,calendar:()=>({mode:'google',id:'calendar'}),selectCalendar:()=>{},confirmedFile:path.join(root,'confirmed.json'),calendarKey:r=>r.files[0].sha256,
  connect:async()=>({owner:'owner',load:async()=>structuredClone(cloud),save:async r=>{uploads++;cloud=structuredClone(r);}}),calendarSync:async()=>{runs++;if(fail)throw Error(JSON.stringify(quota.data));}};
 try{
  let s=new ArchiveSession(opts);await s.start();fs.writeFileSync(path.join(folder,'Series.txt'),'date=2027-02-01');s.changed();let status=await s.finish();assert.equal(uploads,1);assert(status.warning.includes('rateLimitExceeded'));assert(!status.dirty);assert(fs.existsSync(opts.confirmedFile+'.calendar-pending'));
  let kind;assert(await prepareSessionClose({read:async()=>({dirty:false}),save:async()=>true,finish:async()=>status,choose:async k=>{kind=k;return 'close';}}));assert.equal(kind,'calendarFailed');
  assert.equal(await prepareSessionClose({read:async()=>({dirty:false}),finish:async()=>status,choose:async()=>'cancel'}),false);
  s=new ArchiveSession(opts);await s.start();assert(s.view().calendarPending);assert(!s.hasChanges());fail=false;status=await s.finish();assert.equal(runs,2);assert.equal(uploads,1);assert.equal(status.warning,'');assert(!fs.existsSync(opts.confirmedFile+'.calendar-pending'));
  s=new ArchiveSession(opts);await s.start();assert.equal((await s.finish()).status,'unchanged');assert.equal(runs,2);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
 const source=fs.readFileSync(path.join(__dirname,'../2 src/backend/main.js'),'utf8');
 const link=source.match(/function googleCalendarUrl_\([\s\S]*?\n\}/)[0];const context={URL,Buffer,serkalLanguage_:v=>v==='en'?'en':'de'};vm.createContext(context);vm.runInContext(link,context);
 const url=new URL(context.googleCalendarUrl_('selected+calendar@group.calendar.google.com','en','person+test@example.com'));
 assert.equal(Buffer.from(url.searchParams.get('cid'),'base64').toString(),'selected+calendar@group.calendar.google.com');assert.equal(url.searchParams.get('authuser'),'person+test@example.com');assert.equal(url.searchParams.get('hl'),'en');assert(!url.toString().includes('token'));
 console.log('Calendar quota: serialized pacing, exponential retries, bounded exhaustion, no permission retries, archive saved independently, durable restart retry without second upload, accurate close choice and calendar/account link passed');
})().catch(error=>{console.error(error);process.exitCode=1;});

'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto');
const {ArchiveSession}=require('../2 src/common/archive-session'),copy=require('../2 src/common/archive-copy');
const {connect}=require('../2 src/common/archive-session-remote');
(async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'serkal-close-'));
 let connects=0,writes=0,prepares=0,calendars=0,failCalendar=false;
 let cloud={schema:2,releaseNumber:copy.RELEASE,owner:'user',revision:crypto.randomUUID(),parent:'',generatedAt:new Date().toISOString(),calendar:{mode:'google',id:'calendar'},files:[{name:'Series.txt',content:'seen=0|date=2027-03-01',sha256:copy.hash('seen=0|date=2027-03-01')}]};
 const events=[];const session=new ArchiveSession({folder:()=>root,calendar:()=>({mode:'google',id:'calendar'}),selectCalendar:()=>{},
  connect:async()=>{connects++;return {owner:'user',load:async()=>structuredClone(cloud),save:async record=>{writes++;cloud=structuredClone(record);}};},
  calendarKey:r=>r.files.map(f=>f.content.split('|')[1]).join('|'),calendarPrepare:async()=>{prepares++;},calendarSync:async()=>{calendars++;if(failCalendar)throw Error('Full Calendar failure');},onStatus:e=>events.push(e)});
 const edit=text=>{fs.writeFileSync(path.join(root,'Series.txt'),text);session.changed();};
 try{
  await session.start();let result=await session.finish();assert.equal(result.status,'unchanged');assert.equal(connects,1);assert.equal(writes,0);assert.equal(prepares,0);assert.equal(calendars,0);assert(!events.some(e=>e.status==='syncing'));
  session.changed();assert.equal((await session.finish()).status,'unchanged');assert.equal(connects,1);
  edit('seen=1|date=2027-03-01');await session.finish();assert.equal(writes,1);assert.equal(prepares,0);assert.equal(calendars,0);assert.equal(connects,2);
  edit('seen=0|date=2027-03-01');edit('seen=1|date=2027-03-01');assert.equal((await session.finish()).status,'unchanged');assert.equal(connects,2);
  edit('seen=1|date=2027-04-01');await session.finish();assert.equal(writes,2);assert.equal(prepares,1);assert.equal(calendars,1);
  failCalendar=true;edit('seen=1|date=2027-05-01');result=await session.finish();assert.equal(writes,3);assert.equal(result.dirty,false);assert.equal(result.warning,'Full Calendar failure');
  for(const phase of ['archive-connect','archive-upload','calendar-prepare','calendar-sync'])assert(events.some(e=>e.measurement?.phase===phase&&e.measurement.elapsedMs>=0));
  assert(events.some(e=>e.measurement?.phase==='calendar-sync'&&!e.measurement.ok));
  let network=0;await assert.rejects(connect('token',{deadline:Date.now()-1,fetchImpl:async()=>{network++;}}),/SESSION_CLOSE_TIMEOUT/);assert.equal(network,0);
  console.log('fast close: zero network on unchanged/reverted sessions, one watched upload without Calendar, actual Calendar changes only, measured phases and expired deadline passed');
 }finally{fs.rmSync(root,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1;});

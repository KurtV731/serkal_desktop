'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto');
const {ArchiveSession}=require('../2 src/common/archive-session');
const {connect,NAME}=require('../2 src/common/archive-session-remote');
const copy=require('../2 src/common/archive-copy');
(async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'serkal-complete-'));
 const record={schema:2,releaseNumber:32,owner:'user',revision:crypto.randomUUID(),parent:'',generatedAt:new Date().toISOString(),files:[{name:'Old.txt',content:'S01; tmdb=123\n',sha256:copy.hash('S01; tmdb=123\n')}],calendar:{mode:'google',id:'calendar'}};
 let queried=[];
 const remote=await connect('token',{fetchImpl:async url=>{
  queried.push(url);const body=url.includes('userinfo')?{sub:'user',email_verified:true}:url.includes('alt=media')?record:decodeURIComponent(url).includes(NAME)?{files:[]}:{files:[{id:'old',modifiedTime:'2026-10-27T10:00:00Z'}]};
  return {ok:true,text:async()=>JSON.stringify(body)};
 }});
 const loaded=await remote.load();assert.equal(loaded.files.length,1);assert(remote.migrated);assert(queried.some(u=>decodeURIComponent(u).includes(copy.PREFIX)));
 let uploads=0,calendarRuns=0,owner='user';
 const opts={confirmedFile:path.join(root,"confirmed.json"),folder:()=>root,calendar:()=>({mode:'google',id:'calendar'}),selectCalendar:()=>{},connect:async()=>({owner,migrated:true,load:async()=>record,save:async r=>{uploads++;assert.equal(r.files.length,1);}}),calendarSync:async()=>{calendarRuns++;throw Object.assign(new Error('FULL calendar permission error'),{code:'GOOGLE_HTTP_403'});}};
 try{
  const session=new ArchiveSession(opts);await session.start();assert(session.dirty);assert.equal(uploads,0);const result=await session.finish();assert.equal(uploads,1);assert.equal(calendarRuns,1);assert.equal(result.dirty,false);assert.equal(result.warning,'FULL calendar permission error');assert(result.writable);
  // Account changes are detected before any Calendar or archive write.
  session.changed();owner='another';await session.finish();assert.equal(session.view().code,'COPY_ACCOUNT_CHANGED');assert.equal(uploads,1);assert.equal(calendarRuns,1);
  fs.writeFileSync(path.join(root,'Old.txt'),'UNPUBLISHED AFTER CRASH');
  const offline=new ArchiveSession({...opts,connect:async()=>{throw Object.assign(new Error('Full Drive 403 error'),{code:'GOOGLE_HTTP_403'});}});await offline.start();assert(offline.view().writable);assert.equal(fs.readFileSync(path.join(root,'Old.txt'),'utf8'),record.files[0].content);offline.assertWrite();
  console.log('session release: old Google snapshot import, migration saved on exit, Calendar failure independent from archive, account check and 403 local editing passed');
 }finally{fs.rmSync(root,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1;});

'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {ArchiveSession}=require('../2 src/common/archive-session');
const {prepareSessionClose}=require('../2 src/common/session-close');
const copy=require('../2 src/common/archive-copy');
(async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'serkal-session-'));
 let cloud=null,calls=0,uploads=0,offline=false;
 const make=(name)=>{
  const folder=path.join(root,name);fs.mkdirSync(folder,{recursive:true});
  return new ArchiveSession({folder:()=>folder,calendar:()=>({mode:'',id:''}),selectCalendar:()=>{},connect:async()=>{
   calls++;if(offline)throw Object.assign(new Error('Google refused the request'),{code:'GOOGLE_HTTP_403'});
   return {owner:'user',load:async()=>structuredClone(cloud),save:async record=>{uploads++;cloud=structuredClone(record);}};
  }});
 };
 const edit=(session,name,text)=>{session.assertWrite();fs.writeFileSync(path.join(session.folder(),name),text);session.changed();};
 try{
  const a=make('A');fs.writeFileSync(path.join(a.folder(),'stale.txt'),'unsaved from previous process');
  assert.throws(()=>a.assertWrite(),/SESSION_NOT_LOADED/);
  await a.start();assert.equal(a.view().writable,true);assert(!fs.existsSync(path.join(a.folder(),'stale.txt')));assert.equal(uploads,0);
  const initialCalls=calls;
  edit(a,'Series.txt','S01; seen=0\n');edit(a,'Series.txt','S01; seen=1\n');
  await a.sync();await new Promise(resolve=>setTimeout(resolve,30));assert.equal(calls,initialCalls);assert.equal(uploads,0);assert(a.view().dirty);
  assert.equal((await a.finish()).status,'saved');assert.equal(uploads,1);assert.equal(cloud.files[0].content,'S01; seen=1\n');
  await a.finish();assert.equal(uploads,1);
  const b=make('B');await b.start();assert.equal(fs.readFileSync(path.join(b.folder(),'Series.txt'),'utf8'),'S01; seen=1\n');
  // Both load the same base; each may replace the whole archive. Last completed save wins.
  edit(a,'Series.txt','A replacement');edit(b,'Series.txt','B replacement');await a.finish();await b.finish();assert.equal(cloud.files[0].content,'B replacement');
  // An interrupted process leaves TXT, but a new session always replaces it from Google.
  edit(b,'Series.txt','crashed unsaved');const restart=make('B');await restart.start();assert.equal(fs.readFileSync(path.join(b.folder(),'Series.txt'),'utf8'),'B replacement');
  // A deletion stays deleted on the next device.
  fs.unlinkSync(path.join(restart.folder(),'Series.txt'));restart.changed();await restart.finish();
  const afterDelete=make('A');await afterDelete.start();assert.equal(fs.readdirSync(afterDelete.folder()).length,0);
  // Network failure during a session never prevents another local edit.
  edit(afterDelete,'Offline.txt','one');offline=true;const failed=await afterDelete.finish();assert.equal(failed.code,'GOOGLE_HTTP_403');assert(failed.dirty);assert(failed.writable);
  edit(afterDelete,'Offline.txt','two');
  const badStart=make('failure');const startResult=await badStart.start();assert.equal(startResult.status,'offline');assert.equal(startResult.busy,false);assert.equal(startResult.code,'GOOGLE_HTTP_403');assert.equal(startResult.writable,true);
  offline=false;assert(badStart.view().writable);
  const restored=make('A');await restored.start();assert.equal(fs.readdirSync(restored.folder()).length,0);
  // Normal close auto-saves UI, then uploads once; no confirmation on successful close.
  let dirty=true,finished=0,choices=0;
  const opts={read:async()=>({dirty,busy:false}),save:async()=>{dirty=false;return true;},finish:async()=>{finished++;return {dirty:false,busy:false};},choose:async()=>{choices++;return 'discard';},notify:async()=>{}};
  assert(await prepareSessionClose(opts));assert.equal(finished,1);assert.equal(choices,0);
  assert(await prepareSessionClose({...opts,finish:async()=>({dirty:true,busy:false,message:'403'})}));assert.equal(choices,1);
  assert.equal(await prepareSessionClose({...opts,finish:async()=>({dirty:true,busy:false}),choose:async()=>'cancel'}),false);
  assert.equal(await prepareSessionClose({...opts,read:async()=>({busy:true})}),false);
  // Never apply an invalid or wrong-owner snapshot to existing files.
  cloud={...cloud,owner:'another'};const invalid=make('invalid');fs.writeFileSync(path.join(invalid.folder(),'old.txt'),'keep until valid load');await invalid.start();assert.equal(invalid.error,'COPY_INVALID');assert(fs.existsSync(path.join(invalid.folder(),'old.txt')));
  console.log('archive sessions: startup replacement, no edit upload, close upload, crash loss, last save wins, deletion, offline edits and close policy passed');
 }finally{fs.rmSync(root,{recursive:true,force:true});}
})().catch(error=>{console.error(error);process.exitCode=1;});

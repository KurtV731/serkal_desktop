'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),vm=require('node:vm');
const {createRequire}=require('node:module');
(async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'serkal-session-ipc-')),appData=path.join(root,'appdata');fs.mkdirSync(appData);
 let userData=path.join(appData,'SerKal'),fetches=0;fs.mkdirSync(userData);
 fs.writeFileSync(path.join(userData,'settings.json'),JSON.stringify({archive:{folderPath:path.join(root,'REAL')},calendar:{mode:'google',googleCalendarId:'REAL-CALENDAR'}}));
 fs.mkdirSync(path.join(root,'REAL'));fs.writeFileSync(path.join(root,'REAL','Original.txt'),'DO NOT TOUCH');
 fs.writeFileSync(path.join(userData,'google_shared_key_token.json'),JSON.stringify({access_token:'test-secret',expiry_date:Date.now()+3600000}));
 const handles=new Map();const timers=[];
 const app={isPackaged:false,getPath:name=>name==='appData'?appData:name==='userData'?userData:root,setPath:(name,value)=>{if(name==='userData')userData=value;},
  getVersion:()=>require('../package.json').version,getAppPath:()=>root,whenReady:()=>({then(){}}),requestSingleInstanceLock:()=>true,on(){},quit(){},setAsDefaultProtocolClient(){throw Error('Protocol registration must not happen');}};
 const mainPath=path.resolve('2 src/backend/main.js'),realRequire=createRequire(mainPath),originalFetch=global.fetch;
 const fetchMock=async url=>{fetches++;return url.includes('userinfo')?{ok:true,text:async()=>JSON.stringify({sub:'user',email_verified:true})}:{ok:true,text:async()=>JSON.stringify({files:[]})};};
 global.fetch=fetchMock;
 const context={console,Buffer,URL,URLSearchParams,AbortSignal,process,fetch:fetchMock,
  setTimeout:(fn,ms)=>{timers.push(ms);return {unref(){}};},clearTimeout(){},__dirname:path.dirname(mainPath),
  require:id=>id==='../../serkal-session-test.json'?{enabled:true,session:true}:id==='electron'?{app,ipcMain:{handle:(key,fn)=>handles.set(key,fn)},BrowserWindow:function(){},dialog:{},shell:{}}:id==='electron-squirrel-startup'?false:realRequire(id)};
 vm.createContext(context);
 try{
  vm.runInContext('(function(){'+fs.readFileSync(mainPath,'utf8')+'\nglobalThis.api={installIpc_,copyManager_,scheduleSharedArchive_,readSettings_,googleCalendarJsonRequest_,googleCalendarApi_,sessionCalendarKey_};})();',context);
  const api=context.api;api.installIpc_();assert(userData.endsWith('SerKal-Session-Test-34'));
  assert.equal(api.readSettings_().calendar.mode,'none');assert.equal(api.readSettings_().archive.folderPath,path.join(userData,'Archiv'));
  const record={revision:'projection-test',generatedAt:new Date().toISOString(),calendar:{mode:'google',id:'calendar'},files:[{name:'Series (2027).txt',content:'S01; tmdb=42; eps=2; startOriginal=2027-03-01; dates=01.03.,08.03.; seen=0\n'}]};
  const initialCalendar=api.sessionCalendarKey_(record);record.files[0].content=record.files[0].content.replace('seen=0','seen=1');record.calendar={id:'calendar',mode:'google'};assert.equal(api.sessionCalendarKey_(record),initialCalendar);
  const manager=api.copyManager_();await manager.start();assert(manager.view().session);assert(manager.view().writable);
  const before=fetches;api.scheduleSharedArchive_();await handles.get('serkal:archive:sync')();assert.equal(fetches,before);assert.equal(timers.length,0);
  const archive=api.readSettings_().archive.folderPath;fs.writeFileSync(path.join(archive,'Local.txt'),'S01; seen=1\n');manager.changed();assert.equal(fetches,before);
  await manager.finish();assert.equal(manager.view().dirty,false);assert.equal(manager.view().status,'saved');
  const local=await handles.get('serkal:archive:load')();assert.equal(local.count,1);
  const blocked=await handles.get('serkal:calendar:createIcs')({},{});assert.equal(blocked.ok,false);
  assert.equal(fs.readFileSync(path.join(root,'REAL','Original.txt'),'utf8'),'DO NOT TOUCH');
  assert(!fs.existsSync(path.join(userData,'google_calendar_token.json')));
  // Exercise the actual Electron manager -> status callback -> on-disk Log path.
  const detail=JSON.stringify({error:{message:'Permission denied '+'.'.repeat(12000),details:[{reason:'SERVICE_DISABLED',service:'drive.googleapis.com'}]}});
  global.fetch=async url=>url.includes('userinfo')?{ok:true,text:async()=>JSON.stringify({sub:'user',email_verified:true})}:{ok:false,status:403,text:async()=>detail};
  fs.appendFileSync(path.join(archive,"Local.txt"),"S02; seen=1\n");manager.changed();await manager.finish();assert.equal(manager.view().code,'GOOGLE_HTTP_403');assert(manager.view().writable);
  const logs=fs.readdirSync(archive).filter(name=>name.startsWith('!!SERKAL_LOG_'));
  const rows=logs.flatMap(name=>fs.readFileSync(path.join(archive,name),'utf8').trim().split('\n').map(line=>JSON.parse(line)));
  assert(rows.some(row=>{const value=JSON.parse(row.objekt||'{}');return value.google?.responseText===detail;}));
  assert(!JSON.stringify(rows).includes('test-secret'));
  console.log('desktop session IPC: isolated profile/archive, no protocol changes, no edit/manual sync timer, local archive access and no real calendar export passed');
 }finally{global.fetch=originalFetch;fs.rmSync(root,{recursive:true,force:true});}
})().catch(error=>{console.error(error);process.exitCode=1;});

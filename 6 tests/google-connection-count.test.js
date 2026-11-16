'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../2 src/backend/main.js'),'utf8');
const production=source.slice(source.indexOf('async function googleSharedArchiveSync_()'),source.indexOf('\nasync function googleOauthAccessToken_'));
const html=fs.readFileSync(path.join(__dirname,'../2 src/frontend/index.html'),'utf8');
const message=html.slice(html.indexOf('  function message(result){'),html.indexOf('  async function connect(button)',html.indexOf('  function message(result){')));
(async()=>{
 for(const count of [92,0])for(const status of ['saved','pending']){
  const context={calendarLab_:false,copyLocalMode_:true,sessionMode_:true,Number,
   copyManager_:()=>({sync:async()=>({status})}),archiveLoad_:()=>({ok:true,count,daten:{entries:Array.from({length:count},()=>({}))}})};
  vm.createContext(context);vm.runInContext(production,context);const archive=await context.googleSharedArchiveSync_();assert.equal(archive.count,count);
  for(const en of [false,true]){
   const keys=Object.fromEntries([...html.matchAll(/\s+(SHAREDARCHIVE_(?:READY|LOADED|COUNT_UNKNOWN)):"([^"]+)"/g)].slice(en?3:0,en?6:3).map(m=>[m[1],m[2]]));
   const ui={Number,t:key=>keys[key]||key};vm.createContext(ui);vm.runInContext(message,ui);
   const text=ui.message({ok:true,configured:true,archive});assert(text.includes(String(count)+(en?' entries':' Einträge')));assert(!text.includes('undefined'));assert(!text.includes('Android'));
   const unknown=ui.message({ok:true,archive:{status:'ready',session:true}});assert(unknown.includes(keys.SHAREDARCHIVE_COUNT_UNKNOWN));assert(!unknown.includes('undefined'));
  }
 }
 const bad={calendarLab_:false,copyLocalMode_:true,sessionMode_:true,Number,copyManager_:()=>({sync:async()=>({status:'saved'})}),archiveLoad_:()=>({ok:false,count:0})};vm.createContext(bad);vm.runInContext(production,bad);assert.equal((await bad.googleSharedArchiveSync_()).status,'failed');
 console.log('Google connection: production backend/renderer show actual 92 or 0 archive entries in DE/EN, no undefined, no premature Android-publication claim, read errors do not fabricate zero');
})().catch(error=>{console.error(error);process.exitCode=1;});

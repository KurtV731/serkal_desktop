'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('2 src/backend/main.js','utf8');
const scopes = source.slice(source.indexOf('const GOOGLE_CALENDAR_SCOPES'),source.indexOf('function googleOauthTokenPath_'));
const resolver = source.slice(source.indexOf('async function googleResolveSerkalCalendar_'),source.indexOf('function googleCalendarIdForLog_'));
const prefix = 'https://www.googleapis.com/auth/';
async function run(items, status, saved='') {
 const requests=[]; let settings={calendar:{googleCalendarId:saved}}; let writes=0;
 const context={GOOGLE_CALENDAR_NAME:"SerKal",URL,Intl,Set,Error,logWrite_(){},bt_(key){return key;},googleCalendarIdForLog_(id){return id;},readSettings_(){return settings;},writeSettings_(){writes++;},
 async googleCalendarJsonRequest_(method,url){requests.push({method,url}); if(url.includes('/calendarList'))return {ok:true,data:{items}}; if(method==='POST')return {ok:true,data:{id:'new'}}; return {ok:status===200,status,data:{items:[]}};}};
 vm.createContext(context);vm.runInContext(scopes+resolver,context);
 assert.equal(context.googleOauthTokenHasRequiredScope_({scope:prefix+'calendar.app.created '+prefix+'calendar.calendarlist.readonly'}),true);
 assert.equal(context.googleOauthTokenHasRequiredScope_({scope:prefix+'calendar.events.owned '+prefix+'calendar.calendars '+prefix+'calendar.calendarlist.readonly'}),false);
 assert.equal(context.googleOauthTokenHasRequiredScope_({scope:prefix+'calendar.app.created '+prefix+'calendar.calendarlist.readonly '+prefix+'calendar.events.owned'}),false);
 let result,error;try{result=await context.googleResolveSerkalCalendar_();}catch(e){error=e;}
 return {requests,result,error,writes};
}
(async()=>{
 let r=await run([{id:'old',summary:'SerKal',accessRole:'owner'}],200);assert.equal(r.result.id,'old');assert.equal(r.requests.filter(x=>x.method==='POST').length,0);
 for(const status of [403,404,500]){r=await run([{id:'old',summary:'SerKal'}],status);assert.equal(r.error.code,'GOOGLE_APP_CALENDAR_ACCESS_FAILED');assert.equal(r.writes,0);assert.equal(r.requests.filter(x=>x.method==='POST').length,0);}
 r=await run([],403,'cached');assert.ok(r.error);assert.equal(r.requests.filter(x=>x.method==='POST').length,0);
 r=await run([],200,'cached');assert.equal(r.result.id,'cached');assert.equal(r.requests.filter(x=>x.method==='POST').length,0);
 r=await run([],200);assert.equal(r.result.id,'new');assert.equal(r.requests.filter(x=>x.method==='POST').length,1);
 console.log('Calendar app-created access and no-duplicate tests: OK');
})().catch(e=>{console.error(e);process.exitCode=1;});

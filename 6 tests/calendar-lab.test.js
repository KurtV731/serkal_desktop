'use strict';
const assert=require('node:assert/strict');const fs=require('node:fs');const os=require('node:os');const path=require('node:path');const vm=require('node:vm');
const {prepare}=require('../2 src/common/calendar-lab.js');
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'serkal-lab-test-'));
(async()=>{try{
 const normal=path.join(tmp,'SerKal');fs.mkdirSync(normal);fs.writeFileSync(path.join(normal,'tmdb.json'),'{"key":"test-only"}');fs.writeFileSync(path.join(normal,'settings.json'),'NORMAL SETTINGS');fs.writeFileSync(path.join(normal,'google_calendar_token.json'),'NORMAL TOKEN');
 const lab=prepare(tmp);const repeat=prepare(tmp);assert.equal(lab.calendarName,repeat.calendarName);assert.notEqual(lab.calendarName,'SerKal');assert.equal(fs.readFileSync(path.join(normal,'settings.json'),'utf8'),'NORMAL SETTINGS');assert.equal(fs.readFileSync(path.join(normal,'google_calendar_token.json'),'utf8'),'NORMAL TOKEN');assert.ok(!fs.existsSync(path.join(lab.root,'google_calendar_token.json')));assert.equal(fs.readFileSync(path.join(lab.root,'tmdb.json'),'utf8'),'{"key":"test-only"}');
 const source=fs.readFileSync('2 src/backend/main.js','utf8');const resolver=source.slice(source.indexOf('async function googleResolveSerkalCalendar_'),source.indexOf('function googleCalendarIdForLog_'));let posts=0,settings={calendar:{googleCalendarId:''}};
 const context={URL,Intl,GOOGLE_CALENDAR_NAME:lab.calendarName,logWrite_(){},bt_(x){return x;},readSettings_(){return settings;},writeSettings_(x){settings=x;},googleCalendarIdForLog_(x){return x;},async googleCalendarJsonRequest_(method,url,body){if(url.includes('/calendarList'))return {ok:true,data:{items:[{id:'real',summary:'SerKal',accessRole:'owner'}]}};assert.equal(method,'POST');assert.equal(body.summary,lab.calendarName);posts++;return {ok:true,data:{id:'lab-calendar'}};}};
 vm.createContext(context);vm.runInContext(resolver,context);const result=await context.googleResolveSerkalCalendar_();assert.equal(result.id,'lab-calendar');assert.equal(posts,1);assert.notEqual(settings.calendar.googleCalendarId,'real');
 for(const name of ['googleSharedKeySync_','googleSharedArchiveSync_']){const start=source.indexOf('async function '+name);assert.match(source.slice(start,start+260),/if \(calendarLab_\) return/);}
 assert.match(source,/if \(calendarLab_\) return calendarLab_\.archive/);
 console.log('Calendar lab isolation, persistence and real-calendar exclusion: OK');
 }finally{fs.rmSync(tmp,{recursive:true,force:true});}})().catch(e=>{console.error(e);process.exitCode=1;});

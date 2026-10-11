'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {rebuild}=require('../2 src/common/calendar-rebuild');
(async()=>{
 let state=null, creates=0, writes=0, selected='', fail=true;
 const deps={oldId:'old',read:()=>state,save:s=>{state=JSON.parse(JSON.stringify(s));},
 create:async()=>{creates++;return 'new';},check:async id=>assert.equal(id,'new'),select:id=>{selected=id;},
 insert:async()=>{writes++;return {ok:!fail,message:'write failed'};}};
 await assert.rejects(rebuild(deps,[{},{}]),/write failed/);
 assert.equal(state.phase,'copying');assert.equal(state.oldId,'old');assert.equal(selected,'new');
 fail=false;await rebuild(deps,[{},{}]);assert.equal(creates,1);assert.equal(state.phase,'complete');assert.equal(state.completed,2);
 await rebuild(deps,[{},{}]);assert.equal(creates,1);assert.equal(writes,3);
 state=null;deps.create=async()=>{creates++;throw Error('network ambiguous');};
 await assert.rejects(rebuild(deps,[{}]),/network ambiguous/);
 await assert.rejects(rebuild(deps,[{}]),/CALENDAR_REBUILD_UNCERTAIN/);assert.equal(creates,2);
 state={phase:'copying',newId:'old',oldId:'old'};
 await assert.rejects(rebuild(deps,[{}]),/INVALID_TARGET/);
 const source=fs.readFileSync('2 src/backend/main.js','utf8');
 const resolver=source.slice(source.indexOf('async function googleResolveSerkalCalendar_'),source.indexOf('function googleCalendarIdForLog_'));
 let checks=[];
 const ctx={calendarRebuildRead_:()=>state,calendarRebuildRunning_:false,bt_:k=>k,
 googleCalendarJsonRequest_:async(method,url)=>{checks.push({method,url});return {ok:true};},URL};
 vm.createContext(ctx);vm.runInContext(resolver,ctx);
 state={phase:'complete',newId:'new',oldId:'old'};
 assert.equal((await ctx.googleResolveSerkalCalendar_()).id,'new');assert.equal(checks.length,1);assert.ok(checks[0].url.includes('/new/events'));
 state.phase='copying';await assert.rejects(ctx.googleResolveSerkalCalendar_(),/RESUME/);
 console.log('Calendar rebuild interruption, resume and pinned target tests: OK');
})().catch(e=>{console.error(e);process.exitCode=1;});

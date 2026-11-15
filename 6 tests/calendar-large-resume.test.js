'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const protocol=require('../2 src/common/archive-calendar-copy');
const source=fs.readFileSync(path.join(__dirname,'../2 src/backend/main.js'),'utf8');
const production=source.slice(source.indexOf('async function copyCalendarSync_('),source.indexOf('\nlet sharedArchiveCursor_'));
const year=new Date().getFullYear();
const dates=Array.from({length:200},(_,n)=>new Date(Date.UTC(year,0,n+1)).toISOString().slice(0,10));
const entry={tmdbId:123,title:'Large season',year,seasonLabel:'S01',activeDates:dates};
let record={revision:'first',generatedAt:new Date().toISOString(),calendar:{mode:'google',id:'calendar'},files:[{name:'Series.txt',content:JSON.stringify(entry)}]};
let successes=0,requests=0,failAfter=70,remaining=[];const events=new Map();
const manager={report(){}};
const context={require:name=>{assert(name.endsWith('archive-calendar-copy.js'));return protocol;},Date,Map,JSON,sessionMode_:true,
 copyManager_:()=>manager,archiveEntryFromLine_:(_name,_meta,line)=>JSON.parse(line),logWrite_:()=>{},
 googleCalendarManagedEvents_:async()=>[...events.values()],
 googleCalendarApi_:async(method,_calendar,id,body)=>{
  requests++;if(successes===failAfter)return {ok:false,status:403,data:{error:{message:'Injected permanent denial'}}};
  if(method==='DELETE')events.delete(id);else events.set(body.id||id,{...body,id:body.id||id});successes++;return {ok:true};
 }};
vm.createContext(context);vm.runInContext(production,context);
(async()=>{
 // Actual production write loop: interruption within ONE season, not just between seasons.
 await assert.rejects(context.copyCalendarSync_(record,false,true,['123:S01'],r=>remaining=[...r]),/COPY_CALENDAR_FAILED/);
 assert.equal(successes,70);assert.equal(events.size,70);assert.deepEqual(remaining,['123:S01']);
 // A new close creates a new revision. Already accepted events must still be skipped.
 record={...record,revision:'after-restart'};failAfter=Infinity;
 await context.copyCalendarSync_(record,false,true,remaining,r=>remaining=[...r]);
 assert.equal(successes,200);assert.equal(requests,201);assert.equal(events.size,200);assert.deepEqual(remaining,[]);
 await context.copyCalendarSync_(record,false,true,['123:S01']);assert.equal(requests,201);
 // Maintenance marking an entire season must not rewrite 200 identical events.
 // Only one event is actually divergent; the other 199 stay identical.
 const first=events.values().next().value;events.set(first.id,{...first,summary:'Old title'});
 const plan=protocol.plan([entry],[...events.values()],'third',year,true,['123:S01']);
 assert.equal(plan.length,1);assert.equal(plan[0].method,'PUT');
 console.log('Large Calendar production loop: 200 events, interruption after 70, restart writes only remaining 130, no duplicate POST or unchanged PUT; 200 checked with one difference gives one write');
})().catch(error=>{console.error(error);process.exitCode=1;});

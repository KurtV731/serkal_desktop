"use strict";
const assert=require("node:assert/strict"),crypto=require("node:crypto");
const copy=require("../2 src/common/archive-copy"),release=require("../serkal-release.json");
const owner="123",local={files:[],calendar:{mode:"",id:""}};
function record(number=release.number){return {schema:2,releaseNumber:number,owner,revision:crypto.randomUUID(),parent:"",generatedAt:new Date().toISOString(),...local};}
function metadata(r){return {id:r.revision,name:copy.PREFIX+r.revision+".json",appProperties:{owner,revision:r.revision,parent:r.parent,...(r.releaseNumber===undefined?{}:{releaseNumber:String(r.releaseNumber)})}};}
function remote(r){return {records:[r],writes:0,identify:async()=>owner,list:async function(){return this.records.map(metadata);},load:async function(f){return this.records.find(r=>r.revision===f.id);},upload:async function(r){this.writes++;this.records.push(structuredClone(r));},archiveActive:async function(){this.writes++;this.records=[];}};}
(async()=>{
 assert.equal(copy.RELEASE,release.number);
 assert.equal(require("../package.json").version,release.version);
 copy.assertRelease(release.number);copy.assertRelease(String(release.number));copy.assertRelease(undefined);
 for(const number of [release.number+1,0,"", "30x"]){
  assert.throws(()=>copy.validate(record(number),owner),/COPY_VERSION_MISMATCH/);
  const other=record(number);assert.throws(()=>copy.head([metadata(other)],owner),/COPY_VERSION_MISMATCH/);
  for(const authority of [false,true]){
   const service=remote(other),state={owner,base:other.revision,dirty:true,...(authority?{adoption:record()}: {})};let calendars=0,applied=0;
   await assert.rejects(copy.synchronize({state,local,client:service,save:()=>{},apply:async()=>applied++,calendarSync:async()=>calendars++}),/COPY_VERSION_MISMATCH/);
   assert.equal(service.writes,0);assert.equal(calendars,0);assert.equal(applied,0);
  }
 }
 // A legacy archive is read as-is; its first new edit carries the shared release number.
 const legacy=record();delete legacy.releaseNumber;
 const service=remote(legacy),state={owner,base:"",dirty:false};let applied=0;
 assert.equal((await copy.synchronize({state,local,client:service,save:()=>{},apply:async()=>applied++})).status,"saved");
 assert.equal(applied,1);assert.equal(service.writes,0);
 state.dirty=true;
 assert.equal((await copy.synchronize({state,local,client:service,save:()=>{},apply:async()=>{throw Error("do not replace local edit");}})).status,"saved");
 assert.equal(service.records.at(-1).releaseNumber,release.number);
 // Upgrade a numbered older snapshot even when there are no new local edits.
 const older=record(release.number-1),upgrade=remote(older),upgradeState={owner,base:"",dirty:false};
 const upgradeArgs={state:upgradeState,local,client:upgrade,save:()=>{},apply:async()=>{}};
 assert.equal((await copy.synchronize(upgradeArgs)).status,"pending");
 assert.equal((await copy.synchronize(upgradeArgs)).status,"saved");
 assert.equal(upgrade.records.at(-1).releaseNumber,release.number);
 // A queued operation from another release must also stop before Calendar writes.
 state.dirty=true;state.pending=record(release.number+1);let calendars=0;
 await assert.rejects(copy.synchronize({state,local,client:service,save:()=>{},apply:async()=>{},calendarSync:async()=>calendars++}),/COPY_VERSION_MISMATCH/);
 assert.equal(calendars,0);assert.equal(service.writes,1);
 console.log("Shared release: matching versions, mismatch before archive/Calendar/override, legacy import and queued writes passed");
})().catch(error=>{console.error(error);process.exitCode=1;});

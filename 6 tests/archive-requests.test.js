'use strict';
const assert=require('node:assert/strict');
const {validate,processOne}=require('../2 src/common/archive-requests');
const snapshot={owner:'user',publisher:'source',generatedAt:'2026-10-12T00:00:00Z'};
const r={schema:1,id:'12345678-1234-1234-1234-123456789abc',owner:'user',publisher:'source',base:snapshot.generatedAt,action:'notes',payload:{tmdbId:1,seasonLabel:'S01',note:'OffsetDE: +1D'}};
(async()=>{
 assert.throws(()=>validate({...r,owner:'other'},'user','source'),/INVALID/);
 assert.throws(()=>validate({...r,publisher:'other'},'user','source'),/INVALID/);
 let applied=0,published=0;const journal={};const deps={request:r,snapshot,journal,save(){},apply:async()=>{applied++;return {ok:true};},publish:async()=>{published++;return {status:'ready'};}};
 assert.equal((await processOne(deps)).ok,true);assert.equal((await processOne(deps)).ok,true);assert.equal(applied,1);assert.equal(published,1);
 await assert.rejects(processOne({...deps,request:{...r,payload:{...r.payload,note:'changed'}}}),/CONFLICT/);
 const stale=await processOne({...deps,request:{...r,id:'abcdefab-1234-1234-1234-123456789abc',base:'2020-01-01T00:00:00Z'}});assert.equal(stale.code,'REQUEST_STALE');assert.equal(applied,1);
 const retry={...deps,request:{...r,id:'aaaaaaaa-1234-1234-1234-123456789abc'},publish:async()=>({status:'failed'})};await assert.rejects(processOne(retry),/PUBLISH_FAILED/);assert.ok(journal[retry.request.id].authorized);assert.equal(journal[retry.request.id].result,undefined);
 assert.equal((await processOne({...retry,publish:deps.publish})).ok,true);
 console.log('Android requests: ownership, stale snapshot, idempotency, conflict and publish recovery OK');
})().catch(e=>{console.error(e);process.exitCode=1;});

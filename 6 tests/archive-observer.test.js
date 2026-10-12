'use strict';
const assert=require('node:assert/strict');const {observe}=require('../2 src/common/archive-observer');
const record={schema:1,owner:'account',publisher:'source',generatedAt:'2026-10-12T00:00:00Z',entries:[{title:'Kept',dates:[]}]};let version='1',reads=0,owner='account';
async function fetchImpl(url){url=String(url);let data;
 if(url.includes('userinfo'))data={sub:owner,email_verified:true};
 else if(url.includes('fields=id%2Cversion')||url.includes('fields=id,version'))data={id:'file',version};
 else if(url.includes('alt=media')){reads++;data=record;}
 else data={files:[{id:'file',name:'serkal-archive-v1.json'}]};
 return {ok:true,status:200,text:async()=>JSON.stringify(data),json:async()=>data};}
(async()=>{
 let r=await observe({accessToken:'x',fetchImpl});assert.equal(r.changed,true);assert.equal(reads,1);
 r=await observe({accessToken:'x',fetchImpl,previous:r.cursor});assert.equal(r.changed,false);assert.equal(reads,1);
 version='2';record.entries=[];r=await observe({accessToken:'x',fetchImpl,previous:r.cursor});assert.equal(r.changed,true);assert.equal(r.snapshot.entries.length,0);assert.equal(reads,2);
 owner='other';await assert.rejects(observe({accessToken:'x',fetchImpl,previous:r.cursor}),/SHARED_ARCHIVE_INVALID/);
 console.log('Archive observer: metadata-only idle checks, deletion refresh and account isolation OK');
})().catch(e=>{console.error(e);process.exitCode=1;});

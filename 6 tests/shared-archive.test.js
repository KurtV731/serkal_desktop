'use strict';
const assert=require('node:assert/strict');
const {sync,validate,displayEntries}=require('../2 src/common/shared-archive');
const entry={title:'Reacher',seasonLabel:'S03',eps:8,activeDates:['2026-08-12'],descDE:'Beschreibung',descEN:'Description',note:'Offset +1D',raw:'secret',apiKey:'SECRET',fileName:'C:/private'};
const archive={ok:true,daten:{entries:[entry]}};
const record={schema:1,owner:'user',publisher:'pc',generatedAt:'2026-10-07T12:00:00.000Z',entries:displayEntries([entry])};
assert(!JSON.stringify(record).includes('SECRET'));assert(!JSON.stringify(record).includes('C:/private'));
assert.throws(()=>validate({...record,owner:'other'},'user'),/INVALID/);
assert.throws(()=>validate({...record,entries:[{title:'X',dates:['garbage']}]},'user'),/INVALID/);
async function scenario(remote, publisher='pc', duplicates=false) {
 let writes=[];let stored=remote;
 const fetchImpl=async(url,opts)=>{
  let response;
  if(url.includes('/userinfo')) response={sub:'user',email_verified:true};
  else if(url.includes('/upload/')) { writes.push(opts); stored=record;response={id:'id'}; }
  else if(url.includes('alt=media')) response=stored;
  else response={files:stored ? duplicates ? [{id:'id'},{id:'id2'}] : [{id:'id'}] : []};
  return {ok:true,text:async()=>JSON.stringify(response)};
 };
 const result=await sync({accessToken:'secret',publisher,archive,fetchImpl});return {result,writes};
}
(async()=>{
 let s=await scenario(record);assert.equal(s.result.status,'ready');assert.equal(s.writes.length,0);
 s=await scenario(record,'laptop');assert.equal(s.result.status,'other-desktop');assert.equal(s.writes.length,0);
 s=await scenario({...record,entries:[]});assert.equal(s.writes[0].method,'PATCH');assert.equal(s.result.count,1);
 s=await scenario(null);assert.equal(s.writes[0].method,'POST');assert(!s.writes[0].body.includes('secret'));assert.equal(s.result.count,1);
 await assert.rejects(scenario(record,'pc',true),/CONFLICT/);
 await assert.rejects(scenario({...record,owner:'someone-else'}),/INVALID/);
 console.log('Shared archive: owner, authority, duplicate conflict, display-only upload and update tests passed.');
})().catch(e=>{console.error(e);process.exitCode=1;});

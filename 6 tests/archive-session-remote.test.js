'use strict';
const assert=require('node:assert/strict'),crypto=require('node:crypto');
const {connect,TEST_NAME}=require('../2 src/common/archive-session-remote');
const copy=require('../2 src/common/archive-copy');
(async()=>{
 let files=[],payloads=new Map(),writes=0;const urls=[];
 const fetchImpl=async(url,opts)=>{
  urls.push(url);let value;
  if(url.includes('userinfo'))value={sub:'user',email_verified:true};
  else if(opts.method==='POST'){
   assert(opts.body.includes(TEST_NAME));assert(!opts.body.includes(copy.PREFIX));
   const parts=opts.body.split('Content-Type: application/json\r\n\r\n');const record=JSON.parse(parts.at(-1).split('\r\n--')[0]);
   const id='file'+(++writes);payloads.set(id,record);files.push({id,modifiedTime:String(writes).padStart(3,'0')});value={id};
  }else if(opts.method==='PATCH'){
   const id=url.split('/files/')[1].split('?')[0];payloads.set(id,JSON.parse(opts.body));files.find(f=>f.id===id).modifiedTime=String(++writes).padStart(3,'0');value={id};
  }else if(url.includes('alt=media'))value=payloads.get(url.split('/files/')[1].split('?')[0]);
  else {assert(decodeURIComponent(url).includes(TEST_NAME));assert(!url.includes(copy.PREFIX));value={files};}
  return {ok:true,text:async()=>JSON.stringify(value)};
 };
 const remote=await connect('secret',{fetchImpl});assert.equal(await remote.load(),null);assert.equal(writes,0);
 const record={schema:2,releaseNumber:copy.RELEASE,owner:'user',revision:crypto.randomUUID(),parent:'',generatedAt:new Date().toISOString(),calendar:{mode:'',id:''},files:[]};
 await remote.save(record);assert.equal(writes,1);assert.equal((await remote.load()).revision,record.revision);
 const updated={...record,revision:crypto.randomUUID()};await remote.save(updated);assert.equal(files.length,1);assert.equal((await remote.load()).revision,updated.revision);
 // Simultaneous creation: choose most recently modified file without graph/conflict checks.
 payloads.set('duplicate',record);files.push({id:'duplicate',modifiedTime:'999'});assert.equal((await remote.load()).revision,record.revision);
 const bad=await connect('secret',{fetchImpl:async url=>url.includes('userinfo')?{ok:true,text:async()=>JSON.stringify({sub:'user',email_verified:true})}:{ok:false,status:403,text:async()=>'Full error: permission denied'}});
 await assert.rejects(bad.load(),e=>e.google.operation==='archive-list'&&e.google.responseText==='Full error: permission denied');
 console.log('session remote: isolated namespace, no initial upload, whole snapshot PATCH, duplicate first-save ordering and full 403 response passed');
})().catch(error=>{console.error(error);process.exitCode=1;});

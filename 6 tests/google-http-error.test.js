'use strict';
const assert=require('node:assert/strict');
const {googleHttpError}=require('../2 src/common/google-http-error');
const copy=require('../2 src/common/archive-copy'),shared=require('../2 src/common/shared-key');
(async()=>{
 const secret='test-secret-access';
 const body=JSON.stringify({error:{code:403,message:'Forbidden – '.repeat(1000),errors:[{reason:'insufficientPermissions',domain:'global'}],details:[{reason:'SERVICE_DISABLED',metadata:{service:'drive.googleapis.com'}}]},access_token:secret});
 const response=()=>({ok:false,status:403,text:async()=>body});
 const error=await googleHttpError(response(),{url:'https://www.googleapis.com/drive/v3/files?access_token='+secret,operation:'archive-list',secrets:[secret]});
 assert.equal(error.code,'GOOGLE_HTTP_403');assert(error.google.responseText.length>10000);assert(error.google.responseText.includes('SERVICE_DISABLED'));assert(error.google.responseText.includes('insufficientPermissions'));assert(!JSON.stringify(error).includes(secret));assert.equal(error.google.endpoint,'https://www.googleapis.com/drive/v3/files');
 await assert.rejects(copy.client(secret,async()=>response()).list(),e=>e.google.responseText.includes('SERVICE_DISABLED')&&!e.message.includes(secret));
 await assert.rejects(shared.syncKey({accessToken:secret,validate:async()=>true,fetchImpl:async()=>response()}),e=>e.google.responseText.includes('SERVICE_DISABLED'));
 const html='<html><body>Service unavailable\nTry later</body></html>';
 const h=await googleHttpError({status:503,text:async()=>html},{url:'https://www.googleapis.com/drive/v3/files'});assert.equal(h.google.responseText,html);
 console.log('Google errors: complete JSON/text response, reason/details preserved, no truncation, credential redaction and transport propagation passed');
})().catch(error=>{console.error(error);process.exitCode=1;});

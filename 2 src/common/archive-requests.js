'use strict';
const crypto=require('node:crypto');
const PREFIX='serkal-request-v1-', RESULT='serkal-result-v1-';
function fail(code){throw Object.assign(new Error(code),{code});}
function validate(r,owner,publisher){
 if(!r||r.schema!==1||r.owner!==owner||r.publisher!==publisher||!/^[a-f0-9-]{36}$/.test(r.id||'')||!['insert','notes','delete'].includes(r.action)||typeof r.base!=='string'||!Number.isFinite(Date.parse(r.base)))fail('REQUEST_INVALID');
 const p=r.payload;
 if(!p||!Number.isInteger(p.tmdbId)||p.tmdbId<=0)fail('REQUEST_INVALID');
 if(r.action==='insert'){
  if(typeof p.titel!=='string'||!p.titel.trim()||p.titel.length>300||!/^\d{4}$/.test(String(p.jahr))||!Number.isInteger(p.staffelNummer)||p.staffelNummer<1||p.staffelNummer>999||!Array.isArray(p.termindaten)||!p.termindaten.length||p.termindaten.length>1000||p.termindaten.some(d=>typeof d!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(d)))fail('REQUEST_INVALID');
 }else if(typeof p.seasonLabel!=='string'||!/^S\d{2,3}$/.test(p.seasonLabel)||(r.action==='notes'&&(typeof p.note!=='string'||p.note.length>20000)))fail('REQUEST_INVALID');
 return r;
}
function fingerprint(r){return crypto.createHash('sha256').update(JSON.stringify(r)).digest('hex');}
async function processOne({request,snapshot,journal,save,apply,publish}){
 validate(request,snapshot.owner,snapshot.publisher);
 const digest=fingerprint(request);let state=journal[request.id];
 if(state&&state.digest!==digest)fail('REQUEST_CONFLICT');
 if(state&&state.result)return state.result;
 if(!state){
  if(request.base!==snapshot.generatedAt){const result={schema:1,id:request.id,owner:request.owner,ok:false,code:'REQUEST_STALE'};journal[request.id]={digest,result};save();return result;}
  journal[request.id]={digest,authorized:true};save();
 }
 // One designated source desktop executes operations under its physical archive lock.
 // Retrying after interruption is idempotent; successful request receipts are persisted.
 let applied=journal[request.id].applied;
 if(!applied){applied=await apply(request);journal[request.id].applied=applied;save();}
 if(applied&&applied.ok){const uploaded=await publish();if(!['published','ready'].includes(uploaded.status))fail('REQUEST_PUBLISH_FAILED');}
 const result={schema:1,id:request.id,owner:request.owner,ok:!!(applied&&applied.ok),code:applied&&applied.ok?'REQUEST_DONE':(applied&&applied.code||'REQUEST_FAILED')};
 journal[request.id]={digest,result};save();return result;
}
function client(accessToken,fetchImpl=fetch){
 async function request(url,method='GET',body,contentType='application/json'){
  const res=await fetchImpl(url,{method,headers:{Authorization:'Bearer '+accessToken,'Content-Type':contentType},body,signal:AbortSignal.timeout(20000)});
  if(!res.ok)throw await require('./google-http-error').googleHttpError(res,{url,method,operation:'archive-request',secrets:[accessToken]});const text=await res.text();if(Buffer.byteLength(text)>8*1024*1024)fail('REQUEST_TOO_LARGE');return JSON.parse(text);
 }
 async function list(name,contains=false){let page='',files=[];do{
  const u=new URL('https://www.googleapis.com/drive/v3/files');u.searchParams.set('spaces','appDataFolder');u.searchParams.set('q',`name ${contains?'contains':'='} '${name}' and trashed = false`);u.searchParams.set('fields','nextPageToken,files(id,name)');u.searchParams.set('pageSize','100');if(page)u.searchParams.set('pageToken',page);
  const r=await request(u);files.push(...r.files);if(files.length>2000)fail('REQUEST_TOO_MANY');page=r.nextPageToken||'';
 }while(page);return files;}
 async function load(id){return request('https://www.googleapis.com/drive/v3/files/'+encodeURIComponent(id)+'?alt=media');}
 async function receipt(result){const name=RESULT+result.id+'.json';if((await list(name)).length)return;
  const boundary='serkal-'+crypto.randomUUID();const meta={name,mimeType:'application/json',parents:['appDataFolder']};
  const body='--'+boundary+'\r\nContent-Type: application/json\r\n\r\n'+JSON.stringify(meta)+'\r\n--'+boundary+'\r\nContent-Type: application/json\r\n\r\n'+JSON.stringify(result)+'\r\n--'+boundary+'--\r\n';
  await request('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id','POST',body,'multipart/related; boundary='+boundary);
 }
 return {list,load,receipt,identify:()=>request('https://www.googleapis.com/oauth2/v3/userinfo')};
}
module.exports={PREFIX,RESULT,validate,processOne,client};

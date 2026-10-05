const assert=require("node:assert/strict");
const {syncKey,resolveRecords}=require("../2 src/common/shared-key.js");
const user={sub:"A",email:"test@example.com",email_verified:true};
const record=key=>({schema:1,owner:"A",apiKey:key});
function fixture(initial=[],delay=false){
 let records=initial.slice(), writes=0;
 const fetchImpl=async(url,options={})=>{
   let data;
   if(url.includes("userinfo"))data=user;
   else if(options.method==="POST"){
     writes++; const parts=options.body.split("\r\n"); const value=parts.find(p=>p.startsWith('{"schema"'));
     if(!delay)records.push(JSON.parse(value));
     data={id:String(writes)};
   } else if(url.includes("?alt=media")) data=records[Number(url.match(/files\/(\d+)/)[1])];
   else data={files:records.map((_,i)=>({id:String(i)}))};
   return {ok:true,json:async()=>data};
 };
 return {fetchImpl,writes:()=>writes};
}
(async()=>{
 assert.equal(resolveRecords([record("key"),record("key")],"A"),"key");
 assert.throws(()=>resolveRecords([record("one"),record("two")],"A"),/CONFLICT/);
 assert.throws(()=>resolveRecords([{...record("key"),owner:"B"}],"A"),/INVALID/);
 let f=fixture([record("key")]), seen=[];
 let r=await syncKey({accessToken:"token",validate:async k=>(seen.push(k),true),fetchImpl:f.fetchImpl});
 assert.equal(r.apiKey,"key");assert.deepEqual(seen,["key"]);assert.equal(f.writes(),0);
 f=fixture();
 r=await syncKey({accessToken:"token",localKey:"key",validate:async()=>true,fetchImpl:f.fetchImpl});
 assert.equal(r.status,"published");assert.equal(f.writes(),1);
 f=fixture();
 r=await syncKey({accessToken:"token",validate:async()=>true,fetchImpl:f.fetchImpl});
 assert.equal(r.status,"missing");assert.equal(f.writes(),0);
 f=fixture([record("remote")]);
 await assert.rejects(syncKey({accessToken:"token",localKey:"local",validate:async()=>true,fetchImpl:f.fetchImpl}),/CONFLICT/);
 assert.equal(f.writes(),0);
 f=fixture();
 await assert.rejects(syncKey({accessToken:"token",localKey:"key",validate:async()=>false,fetchImpl:f.fetchImpl}),/TMDB_KEY_INVALID/);
 assert.equal(f.writes(),0);
 f=fixture();
 await assert.rejects(syncKey({accessToken:"token",localKey:"key",validate:async()=>true,confirmPublish:async()=>false,fetchImpl:f.fetchImpl}),/CANCELLED/);
 assert.equal(f.writes(),0);
 f=fixture([],true);
 await assert.rejects(syncKey({accessToken:"token",localKey:"key",validate:async()=>true,fetchImpl:f.fetchImpl}),/SHARED_KEY_RETRY/);
 assert.equal(f.writes(),1);
 console.log("Shared TMDB key tests: OK");
})().catch(error=>{console.error(error);process.exitCode=1;});

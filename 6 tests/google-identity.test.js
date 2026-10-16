const assert=require('node:assert/strict');
const {verifyCalendarOwner}=require('../2 src/common/google-identity');
(async()=>{
 for(const [status,body,code] of [[403,{},'GOOGLE_IDENTITY_UNAVAILABLE'],[200,{},'GOOGLE_IDENTITY_INVALID'],[200,{sub:'other',email_verified:true},'COPY_ACCOUNT_CHANGED']])
  await assert.rejects(verifyCalendarOwner('token','owner',async()=>({ok:status===200,json:async()=>body})),e=>e.code===code);
 await verifyCalendarOwner('token','owner',async()=>({ok:true,json:async()=>({sub:'owner',email_verified:true})}));
 console.log('Google identity: denied lookup differs from actual account change: OK');
})().catch(e=>{console.error(e);process.exitCode=1;});

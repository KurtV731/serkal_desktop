'use strict';
async function verifyCalendarOwner(token,owner,fetchImpl=fetch){
    const response=await fetchImpl('https://www.googleapis.com/oauth2/v3/userinfo',{headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(20000)});
    const fail=code=>{throw Object.assign(new Error(code),{code});};
    if(!response.ok)fail('GOOGLE_IDENTITY_UNAVAILABLE');
    const identity=await response.json();
    if(!identity.sub || identity.email_verified!==true)fail('GOOGLE_IDENTITY_INVALID');
    if(identity.sub!==owner)fail('COPY_ACCOUNT_CHANGED');
}
module.exports={verifyCalendarOwner};

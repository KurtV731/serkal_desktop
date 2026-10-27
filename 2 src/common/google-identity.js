'use strict';
async function verifyCalendarOwner(token,owner,fetchImpl=fetch){
    const response=await fetchImpl('https://www.googleapis.com/oauth2/v3/userinfo',{headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(20000)});
    const fail=code=>{throw Object.assign(new Error(code),{code});};
    if(!response.ok){const error=await require('./google-http-error').googleHttpError(response,{url:'https://www.googleapis.com/oauth2/v3/userinfo',operation:'calendar-identity',secrets:[token]});error.code='GOOGLE_IDENTITY_UNAVAILABLE';throw error;}
    const identity=await response.json();
    if(!identity.sub || identity.email_verified!==true)fail('GOOGLE_IDENTITY_INVALID');
    if(identity.sub!==owner)fail('COPY_ACCOUNT_CHANGED');
}
module.exports={verifyCalendarOwner};

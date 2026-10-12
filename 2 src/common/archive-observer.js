'use strict';
const {NAME,validate}=require('./shared-archive');
const {client}=require('./archive-requests');
async function observe({accessToken,previous=null,fetchImpl=fetch}) {
 const api=client(accessToken,fetchImpl);const user=await api.identify();
 if(!user.sub || !user.email_verified)throw Error('GOOGLE_IDENTITY_INVALID');
 let id=previous&&previous.owner===user.sub ? previous.id : '';
 if(!id){const files=await api.list(NAME);if(files.length!==1)throw Error(files.length?'SHARED_ARCHIVE_CONFLICT':'SHARED_ARCHIVE_PENDING');id=files[0].id;}
 const url='https://www.googleapis.com/drive/v3/files/'+encodeURIComponent(id)+'?fields=id,version';
 const response=await fetchImpl(url,{headers:{Authorization:'Bearer '+accessToken},signal:AbortSignal.timeout(20000)});
 if(!response.ok)throw Error('GOOGLE_HTTP_'+response.status);
 const metadata=await response.json();if(!metadata.version)throw Error('SHARED_ARCHIVE_INVALID');
 if(previous && previous.owner===user.sub && previous.id===id && previous.version===String(metadata.version))return {changed:false,cursor:previous};
 const snapshot=validate(await api.load(id),user.sub);
 return {changed:true,snapshot,cursor:{id,owner:user.sub,version:String(metadata.version)}};
}
module.exports={observe};

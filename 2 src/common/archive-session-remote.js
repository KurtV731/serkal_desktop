'use strict';
const {googleHttpError}=require('./google-http-error');
const copy=require('./archive-copy');
// The test namespace cannot read, rename or overwrite the public v2 archive.
const NAME='serkal-session-v1.json';
const TEST_NAME='serkal-session-test-34.json';
async function connect(accessToken,{fetchImpl=fetch,name=NAME,importLegacy=true,deadline=0}={}){
    async function request(url,method='GET',body,contentType='application/json',operation=''){
        if(deadline&&Date.now()>=deadline)throw Object.assign(new Error('SESSION_CLOSE_TIMEOUT'),{code:'SESSION_CLOSE_TIMEOUT'});
        const response=await fetchImpl(url,{method,headers:{Authorization:'Bearer '+accessToken,'Content-Type':contentType},body,signal:AbortSignal.timeout(Math.max(1,Math.min(15000,deadline?deadline-Date.now():15000)))});
        if(!response.ok)throw await googleHttpError(response,{url,method,operation,secrets:[accessToken]});
        const text=await response.text();if(Buffer.byteLength(text)>64*1024*1024)throw Object.assign(new Error('COPY_TOO_LARGE'),{code:'COPY_TOO_LARGE'});
        return JSON.parse(text);
    }
    const identity=await request('https://www.googleapis.com/oauth2/v3/userinfo','GET',undefined,undefined,'identify');
    if(!identity.sub||identity.email_verified!==true)throw Object.assign(new Error('GOOGLE_IDENTITY_INVALID'),{code:'GOOGLE_IDENTITY_INVALID'});
    async function latest(){
        const files=[];let page='';
        do{
            const query=new URLSearchParams({spaces:'appDataFolder',q:"name = '"+name+"' and trashed = false",fields:'nextPageToken,files(id,modifiedTime)',pageSize:'100'});
            if(page)query.set('pageToken',page);
            const result=await request('https://www.googleapis.com/drive/v3/files?'+query,'GET',undefined,undefined,'archive-list');
            if(!Array.isArray(result.files))throw Object.assign(new Error('COPY_INVALID'),{code:'COPY_INVALID'});
            files.push(...result.files);page=result.nextPageToken||'';
        }while(page);
        // A simultaneous first save may create two files. Google's modification order decides.
        return files.sort((a,b)=>String(b.modifiedTime).localeCompare(String(a.modifiedTime))||String(b.id).localeCompare(String(a.id)))[0]||null;
    }
    const client={owner:identity.sub,migrated:false,
        async load(){let file=await latest();
            if(!file&&importLegacy){
                const query=new URLSearchParams({spaces:'appDataFolder',q:"name contains '"+copy.PREFIX+"' and trashed = false",fields:'nextPageToken,files(id,modifiedTime)',pageSize:'1000'});
                const files=[];let page='';do{if(page)query.set('pageToken',page);const result=await request('https://www.googleapis.com/drive/v3/files?'+query,'GET',undefined,undefined,'archive-import-list');files.push(...result.files);page=result.nextPageToken||'';}while(page);
                file=files.sort((a,b)=>String(b.modifiedTime).localeCompare(String(a.modifiedTime))||String(b.id).localeCompare(String(a.id)))[0];client.migrated=!!file;
            }
            if(!file)return null;
            return copy.validate(await request('https://www.googleapis.com/drive/v3/files/'+encodeURIComponent(file.id)+'?alt=media','GET',undefined,undefined,'archive-download'),identity.sub);},
        async save(record){
            copy.validate(record,identity.sub);const file=await latest();
            if(file)return request('https://www.googleapis.com/upload/drive/v3/files/'+encodeURIComponent(file.id)+'?uploadType=media&fields=id','PATCH',JSON.stringify(record),'application/json','archive-save');
            const boundary='serkal-session-boundary';
            const body='--'+boundary+'\r\nContent-Type: application/json\r\n\r\n'+JSON.stringify({name,parents:['appDataFolder'],mimeType:'application/json'})+
                '\r\n--'+boundary+'\r\nContent-Type: application/json\r\n\r\n'+JSON.stringify(record)+'\r\n--'+boundary+'--\r\n';
            return request('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id','POST',body,'multipart/related; boundary='+boundary,'archive-create');
        }};return client;
}
module.exports={connect,NAME,TEST_NAME};

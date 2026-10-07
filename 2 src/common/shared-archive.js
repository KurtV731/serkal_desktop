'use strict';
const NAME = 'serkal-archive-v1.json';
const LIMIT = 8 * 1024 * 1024;
function fail(code) { throw Object.assign(new Error(code), {code}); }
function validate(record, owner) {
    if (!record || record.schema !== 1 || record.owner !== owner ||
        typeof record.publisher !== 'string' || !record.publisher ||
        !Number.isFinite(Date.parse(record.generatedAt)) || !Array.isArray(record.entries) || record.entries.length > 20000)
        fail('SHARED_ARCHIVE_INVALID');
    for (const e of record.entries) {
        if (!e || typeof e.title !== 'string' || !e.title.trim() || !Array.isArray(e.dates) ||
            e.dates.some(d => typeof d !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(d))) fail('SHARED_ARCHIVE_INVALID');
    }
    return record;
}
// Export only display fields. Never upload raw files, paths, tokens or API credentials.
function displayEntries(entries) {
    return entries.map(e => ({title:String(e.title || e.titel || ''), year:e.year || null,
        seasonLabel:String(e.seasonLabel || ''), tmdbId:e.tmdbId || null,
        eps:Number(e.eps || 0), dates:Array.isArray(e.activeDates) ? e.activeDates : [],
        descDE:String(e.descDE || ''), descEN:String(e.descEN || ''), note:String(e.note || ''),
        seen:Number(e.seen || 0)}));
}
async function sync({accessToken, publisher, archive, fetchImpl=fetch, allowCreate=true}) {
    async function request(url, method='GET', body, contentType='application/json') {
        const response=await fetchImpl(url,{method,headers:{Authorization:'Bearer '+accessToken,'Content-Type':contentType},
            body,signal:AbortSignal.timeout(20000)});
        if(!response.ok) fail('GOOGLE_HTTP_'+response.status);
        const text=await response.text(); if(Buffer.byteLength(text)>LIMIT) fail('SHARED_ARCHIVE_TOO_LARGE');
        try { return JSON.parse(text); } catch(_) { fail('SHARED_ARCHIVE_INVALID'); }
    }
    if(!archive || !archive.ok || !archive.daten || !Array.isArray(archive.daten.entries)) fail('SHARED_ARCHIVE_UNAVAILABLE');
    const user=await request('https://www.googleapis.com/oauth2/v3/userinfo');
    if(!user.sub || !user.email_verified) fail('GOOGLE_IDENTITY_INVALID');
    const ids=[]; let page='';
    do {
        const url=new URL('https://www.googleapis.com/drive/v3/files');
        url.searchParams.set('spaces','appDataFolder'); url.searchParams.set('q',"name = '"+NAME+"' and trashed = false");
        url.searchParams.set('fields','nextPageToken,files(id)'); url.searchParams.set('pageSize','100');
        if(page) url.searchParams.set('pageToken',page);
        const list=await request(url.toString()); if(!Array.isArray(list.files)) fail('SHARED_ARCHIVE_INVALID');
        ids.push(...list.files.map(f=>f.id)); if(ids.length>1) fail('SHARED_ARCHIVE_CONFLICT');
        page=list.nextPageToken || '';
    } while(page);
    const entries=displayEntries(archive.daten.entries);
    const record=validate({schema:1,owner:user.sub,publisher,generatedAt:new Date().toISOString(),entries},user.sub);
    const json=JSON.stringify(record); if(Buffer.byteLength(json)>LIMIT) fail('SHARED_ARCHIVE_TOO_LARGE');
    if(ids.length) {
        const remote=validate(await request('https://www.googleapis.com/drive/v3/files/'+encodeURIComponent(ids[0])+'?alt=media'),user.sub);
        // Only the desktop which established this snapshot may update it.
        if(remote.publisher!==publisher) return {status:'other-desktop',count:remote.entries.length};
        if(JSON.stringify(remote.entries)===JSON.stringify(entries)) return {status:'ready',count:entries.length};
        await request('https://www.googleapis.com/upload/drive/v3/files/'+encodeURIComponent(ids[0])+'?uploadType=media&fields=id','PATCH',json);
    } else {
        if(!allowCreate) fail('SHARED_ARCHIVE_PENDING');
        const boundary='serkal-archive-'+require('node:crypto').randomUUID();
        const metadata=JSON.stringify({name:NAME,mimeType:'application/json',parents:['appDataFolder']});
        const body='--'+boundary+'\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n'+metadata+
            '\r\n--'+boundary+'\r\nContent-Type: application/json\r\n\r\n'+json+'\r\n--'+boundary+'--\r\n';
        await request('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id','POST',body,'multipart/related; boundary='+boundary);
        // Concurrent first publication creates two files rather than overwriting either.
        // Both clients detect that ambiguity on their next load.
        return await sync({accessToken,publisher,archive,fetchImpl,allowCreate:false});
    }
    return {status:'published',count:entries.length};
}
module.exports={NAME,validate,displayEntries,sync};

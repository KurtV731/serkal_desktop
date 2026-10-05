"use strict";
const SCOPES = ["https://www.googleapis.com/auth/drive.appdata", "openid", "https://www.googleapis.com/auth/userinfo.email"];
const NAME = "serkal-tmdb-key-v1.json";
function fail(code) { const e = new Error(code); e.code = code; throw e; }
function resolveRecords(records, owner) {
    const keys = new Set();
    for (const item of records) {
        if (item.schema !== 1 || item.owner !== owner || typeof item.apiKey !== "string" || !item.apiKey.trim())
            fail("SHARED_KEY_INVALID");
        keys.add(item.apiKey.trim());
    }
    if (keys.size > 1) fail("SHARED_KEY_CONFLICT");
    return keys.size ? [...keys][0] : "";
}
async function syncKey({accessToken, localKey="", validate, fetchImpl=fetch,allowPublish=true,confirmPublish=async()=>true}) {
    async function request(url, options={}) {
        const response = await fetchImpl(url, {...options,
            headers:{Authorization:"Bearer " + accessToken, ...(options.headers || {})},
            signal:AbortSignal.timeout(20000)});
        if (!response.ok) fail("GOOGLE_HTTP_" + response.status);
        return response.json();
    }
    const user = await request("https://www.googleapis.com/oauth2/v3/userinfo");
    if (!user.sub || !user.email || user.email_verified !== true) fail("GOOGLE_IDENTITY_INVALID");
    const files = [];
    let pageToken = "";
    do {
        const query = new URLSearchParams({spaces:"appDataFolder", q:"name = '" + NAME + "' and trashed = false",
            fields:"nextPageToken,files(id)", pageSize:"100"});
        if (pageToken) query.set("pageToken",pageToken);
        const page = await request("https://www.googleapis.com/drive/v3/files?" + query);
        if (!Array.isArray(page.files)) fail("SHARED_KEY_INVALID");
        files.push(...page.files);
        if (files.length > 1000) fail("SHARED_KEY_TOO_MANY");
        pageToken = page.nextPageToken || "";
    } while(pageToken);
    const records=[];
    for(const file of files) records.push(await request("https://www.googleapis.com/drive/v3/files/" + encodeURIComponent(file.id) + "?alt=media"));
    const remote=resolveRecords(records,user.sub);
    const local=String(localKey || "").trim();
    if(remote && local && remote!==local) fail("SHARED_KEY_CONFLICT");
    const key=remote || local;
    if(!key) return {status:"missing",email:user.email,owner:user.sub};
    if(!(await validate(key))) fail("TMDB_KEY_INVALID");
    if(!remote && !allowPublish) fail("SHARED_KEY_RETRY");
    if(!remote) {
        if(!(await confirmPublish(user))) fail("SHARED_KEY_CANCELLED");
        const boundary="serkal-key-config-boundary";
        const metadata={name:NAME,parents:["appDataFolder"],mimeType:"application/json"};
        const record={schema:1,owner:user.sub,apiKey:key};
        const body="--"+boundary+"\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n"+
            JSON.stringify(metadata)+"\r\n--"+boundary+"\r\nContent-Type: application/json\r\n\r\n"+
            JSON.stringify(record)+"\r\n--"+boundary+"--\r\n";
        await request("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id",
            {method:"POST",headers:{"Content-Type":"multipart/related; boundary="+boundary},body});
        // Immutable creation avoids overwriting another device's credential.
        // Read back to detect concurrent different initial credentials.
        const check = await syncKey({accessToken,localKey:key,validate,fetchImpl,allowPublish:false});
        return {...check,status:"published"};
    }
    return {status:"loaded",apiKey:key,email:user.email,owner:user.sub};
}
module.exports={SCOPES,NAME,resolveRecords,syncKey};

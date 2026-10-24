'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const PREFIX = 'serkal-copy-v2-';
const LIMIT = 64 * 1024 * 1024;
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
function fail(code) { throw Object.assign(new Error(code), {code}); }
function hash(text) { return crypto.createHash('sha256').update(text, 'utf8').digest('hex'); }
function safeName(name) {
    return typeof name === 'string' && name.length <= 240 && !/[\\/:*?"<>|\x00-\x1f]/.test(name) &&
        /\.txt$/i.test(name) && !/^(?:!!serkal_log_|fanal_|\.|con\.|prn\.|aux\.|nul\.|com[1-9]\.|lpt[1-9]\.)/i.test(name);
}
function validate(record, owner) {
    if (!record || record.schema !== 2 || record.owner !== owner || !UUID.test(record.revision) ||
        !(record.parent === '' || UUID.test(record.parent)) || record.parent === record.revision ||
        (record.authorityId!==undefined && record.authorityId!=='' && !UUID.test(record.authorityId)) ||
        !Number.isFinite(Date.parse(record.generatedAt)) || !Array.isArray(record.files) || record.files.length > 20000)
        fail('COPY_INVALID');
    const names = new Set(); let bytes = 0;
    for (const f of record.files) {
        if (!f || !safeName(f.name) || typeof f.content !== 'string' || f.content.includes('\u0000') ||
            f.sha256 !== hash(f.content) || names.has(f.name.toLowerCase())) fail('COPY_INVALID');
        names.add(f.name.toLowerCase()); bytes += Buffer.byteLength(f.content);
        if (bytes > LIMIT) fail('COPY_TOO_LARGE');
    }
    if (!record.calendar || !['', 'google', 'ics'].includes(record.calendar.mode) ||
        typeof record.calendar.id !== 'string' || record.calendar.id.length > 512) fail('COPY_INVALID');
    return record;
}
function digest(files, calendar) {
    return hash(JSON.stringify([files.map(f => [f.name, f.sha256]).sort((a,b) => a[0]<b[0] ? -1 : a[0]>b[0] ? 1 : 0),
        calendar.mode, calendar.id]));
}
function capture(folder, calendar) {
    const files = fs.readdirSync(folder).filter(safeName).sort().map(name => {
        const target = path.join(folder,name), st = fs.lstatSync(target);
        if (!st.isFile() || st.isSymbolicLink()) fail('COPY_INVALID');
        const content = fs.readFileSync(target,'utf8');
        return {name, content, sha256:hash(content)};
    });
    return {files, calendar:{mode:String(calendar.mode||''),id:String(calendar.googleCalendarId||calendar.id||'')}};
}
function writable(freeBytes, payloadBytes) { return freeBytes >= Math.max(10*1024*1024, payloadBytes*3+1024*1024); }
function writeAtomic(file, value) {
    fs.mkdirSync(path.dirname(file), {recursive:true});
    const temp = file+'.tmp'; const fd = fs.openSync(temp, 'w', 0o600);
    try {fs.writeFileSync(fd,JSON.stringify(value),'utf8');fs.fsyncSync(fd);} finally {fs.closeSync(fd);}
    fs.renameSync(temp,file);
}
// A backup contains every old TXT byte. Logs and unrelated files are never removed.
// Installation is synchronous under the caller's write lock; rollback is journalled.
function install(folder, record) {
    validate(record,record.owner);
    fs.mkdirSync(folder,{recursive:true});
    const free = fs.statfsSync(folder); const available = Number(free.bavail)*Number(free.bsize);
    const size = Buffer.byteLength(JSON.stringify(record));
    if (!writable(available,size)) fail('COPY_LOW_SPACE');
    const backup = path.join(folder,'.serkal-copy-backups',record.revision);
    fs.mkdirSync(backup,{recursive:true});
    const before = capture(folder,record.calendar).files;
    const journal = path.join(folder,'.serkal-copy-install.json');
    // Raw previous data remains recoverable even if the OS stops between file replacements.
    writeAtomic(path.join(backup,'archive.json'),{files:before});
    writeAtomic(journal,{backup,phase:'installing'});
    try {
        for (const f of before) fs.unlinkSync(path.join(folder,f.name));
        for (const f of record.files) {
            const temp = path.join(folder,f.name+'.serkal-copy-tmp');
            const fd=fs.openSync(temp,'w',0o600);try{fs.writeFileSync(fd,f.content,'utf8');fs.fsyncSync(fd);}finally{fs.closeSync(fd);}
            fs.renameSync(temp,path.join(folder,f.name));
        }
        fs.unlinkSync(journal);
    } catch(error) { recover(folder); throw error; }
}
function recover(folder) {
    const journal = path.join(folder,'.serkal-copy-install.json');
    if (!fs.existsSync(journal)) return;
    const saved = JSON.parse(fs.readFileSync(journal,'utf8'));
    const root = path.resolve(folder,'.serkal-copy-backups')+path.sep;
    if (!path.resolve(saved.backup).startsWith(root)) fail('COPY_INVALID');
    const old = JSON.parse(fs.readFileSync(path.join(saved.backup,'archive.json'),'utf8'));
    if (!Array.isArray(old.files) || old.files.some(f=>!safeName(f.name)||typeof f.content!=='string')) fail('COPY_INVALID');
    for (const f of old.files) fs.writeFileSync(path.join(folder,f.name),f.content,'utf8');
    const wanted=new Set(old.files.map(f=>f.name.toLowerCase()));
    for (const name of fs.readdirSync(folder).filter(safeName)) if(!wanted.has(name.toLowerCase()))fs.unlinkSync(path.join(folder,name));
    fs.unlinkSync(journal);
}
function head(files, owner) {
    const revisions = new Map();
    const authorityIds=new Set();let unmarked=0;
    for (const f of files) {
        const p = f.appProperties || {};if(p.parent==='root')p.parent='';
        if (p.owner !== owner || !UUID.test(p.revision) || !(p.parent === '' || UUID.test(p.parent)) ||
            f.name !== PREFIX+p.revision+'.json') fail('COPY_INVALID');
        if(p.authorityId){if(!UUID.test(p.authorityId))fail('COPY_INVALID');authorityIds.add(p.authorityId);}else unmarked++;
        const duplicate = revisions.get(p.revision);
        if (duplicate && (duplicate.md5Checksum !== f.md5Checksum || duplicate.appProperties.parent !== p.parent)) fail('COPY_CONFLICT');
        if (!duplicate) revisions.set(p.revision,f);
    }
    if(authorityIds.size>1||(authorityIds.size===1&&unmarked))fail('COPY_CONFLICT');
    if (!revisions.size) return null;
    const parents = new Set(); let roots = 0;
    for (const f of revisions.values()) {
        const parent=f.appProperties.parent;
        if (parent) {if(!revisions.has(parent))fail('COPY_HISTORY_MISSING');parents.add(parent);}
        else roots++;
    }
    const tips=Array.from(revisions.values()).filter(f=>!parents.has(f.appProperties.revision));
    if(roots!==1 || tips.length!==1)fail('COPY_CONFLICT');
    // Also reject detached cycles which happen to leave one valid tip.
    let cursor=tips[0], visited=new Set();
    while(cursor) {const rev=cursor.appProperties.revision;if(visited.has(rev))fail('COPY_INVALID');visited.add(rev);cursor=revisions.get(cursor.appProperties.parent);}
    if(visited.size!==revisions.size)fail('COPY_INVALID');
    return tips[0];
}
function client(accessToken, fetchImpl=fetch) {
    async function request(url, method='GET', body, contentType='application/json') {
        const r=await fetchImpl(url,{method,headers:{Authorization:'Bearer '+accessToken,'Content-Type':contentType},body,
            signal:AbortSignal.timeout(45000)});
        if(!r.ok)fail('GOOGLE_HTTP_'+r.status);
        const text=await r.text();if(Buffer.byteLength(text)>LIMIT)fail('COPY_TOO_LARGE');
        try{return JSON.parse(text);}catch(_){fail('COPY_INVALID');}
    }
    return {
        async identify(){const u=await request('https://www.googleapis.com/oauth2/v3/userinfo');if(!u.sub||!u.email_verified)fail('GOOGLE_IDENTITY_INVALID');return u.sub;},
        async list(){let files=[],page='';do {
            const u=new URL('https://www.googleapis.com/drive/v3/files');u.searchParams.set('spaces','appDataFolder');
            u.searchParams.set('q',"name contains '"+PREFIX+"' and trashed = false");
            u.searchParams.set('fields','nextPageToken,files(id,name,appProperties,md5Checksum)');u.searchParams.set('pageSize','1000');
            if(page)u.searchParams.set('pageToken',page);const r=await request(u.toString());
            if(!Array.isArray(r.files))fail('COPY_INVALID');files.push(...r.files);if(files.length>20000)fail('COPY_TOO_LARGE');page=r.nextPageToken||'';
        }while(page);return files;},
        async load(file,owner){const r=validate(await request('https://www.googleapis.com/drive/v3/files/'+encodeURIComponent(file.id)+'?alt=media'),owner);
            if(r.revision!==file.appProperties.revision || (r.parent||'')!==(file.appProperties.parent==='root'?'':(file.appProperties.parent||'')) ||
                (file.appProperties.authorityId||'')!==(r.authorityId||''))fail('COPY_INVALID');return r;},
        async archiveActive(files){
            for(const file of files) {
                const name='serkal-history-v2-'+String(file.appProperties.revision)+'-'+String(file.id)+'.json';
                await request('https://www.googleapis.com/drive/v3/files/'+encodeURIComponent(file.id)+'?fields=id,name','PATCH',JSON.stringify({name}));
            }
        },
        async upload(record){validate(record,record.owner);const json=JSON.stringify(record);if(Buffer.byteLength(json)>LIMIT)fail('COPY_TOO_LARGE');
            const boundary='serkal-'+crypto.randomUUID();const meta={name:PREFIX+record.revision+'.json',mimeType:'application/json',parents:['appDataFolder'],
                appProperties:{owner:record.owner,revision:record.revision,parent:record.parent||'root',...(record.authorityId?{authorityId:record.authorityId}:{})}};
            const body='--'+boundary+'\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n'+JSON.stringify(meta)+
                '\r\n--'+boundary+'\r\nContent-Type: application/json\r\n\r\n'+json+'\r\n--'+boundary+'--\r\n';
            return request('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id','POST',body,'multipart/related; boundary='+boundary);
        }
    };
}
async function synchronize({state, local, client:remote, save, apply, calendarSync=async()=>{}}) {
    const owner=await remote.identify();
    const current=typeof local==='function' ? local() : local;
    if(state.owner && state.owner!==owner)fail('COPY_ACCOUNT_CHANGED');
    let remoteFiles=await remote.list();
    if(state.adoption) {
        state.adoption.owner=owner;
        state.adoption.authorityId=state.adoption.authorityId||state.adoption.revision;
        validate(state.adoption,owner);
        save();
        await remote.archiveActive(remoteFiles.filter(file=>file.appProperties?.owner===owner));
        remoteFiles=await remote.list();
        if(remoteFiles.some(file=>file.appProperties?.owner===owner && file.appProperties.revision!==state.adoption.revision))fail('COPY_CONFLICT');
        const existing=remoteFiles.find(f=>f.appProperties.revision===state.adoption.revision);
        if(!existing) await remote.upload(state.adoption);
        remoteFiles=await remote.list();
        const adopted=remoteFiles.find(f=>f.appProperties.revision===state.adoption.revision);
        if(!adopted)fail('COPY_CONFLICT');
        const confirmed=await remote.load(adopted,owner);
        if(digest(confirmed.files,confirmed.calendar)!==digest(state.adoption.files,state.adoption.calendar))fail('COPY_CONFLICT');
        const same=digest(current.files,current.calendar)===digest(state.adoption.files,state.adoption.calendar);
        state.owner=owner;state.base=state.adoption.revision;state.clean=digest(state.adoption.files,state.adoption.calendar);
        state.authorityId=state.adoption.authorityId;
        state.dirty=!same;delete state.pending;delete state.pendingFileId;delete state.adoption;save();
        return {status:same?'saved':'pending'};
    }
    const tip=head(remoteFiles,owner), revision=tip ? tip.appProperties.revision : '';
    const authorityId=tip?.appProperties?.authorityId||'';
    if(tip && authorityId) {
        const record=await remote.load(tip,owner);
        const same=digest(current.files,current.calendar)===digest(record.files,record.calendar);
        const changed=state.base!==revision||!same||!!state.dirty;
        if(!same)await apply(record,true);
        state.owner=owner;state.base=revision;state.authorityId=authorityId;
        state.clean=digest(record.files,record.calendar);state.dirty=false;
        delete state.pending;delete state.pendingFileId;delete state.adoption;save();
        return {status:changed?'authority-applied':'saved'};
    }
    if(state.dirty) {
        // A lost response must be checked before a second upload; the same frozen body is reused.
        if(state.pending && (revision===state.pending.revision || state.pendingFileId)) {
            if(revision && revision!==state.base && revision!==state.pending.revision)fail('COPY_CONFLICT');
            const proof=revision===state.pending.revision ? tip : {id:state.pendingFileId,appProperties:{revision:state.pending.revision,parent:state.pending.parent}};
            const confirmed=await remote.load(proof,owner);
            if(digest(confirmed.files,confirmed.calendar)!==digest(state.pending.files,state.pending.calendar))fail('COPY_CONFLICT');
            state.base=state.pending.revision;state.owner=owner;
            state.authorityId=confirmed.authorityId||state.authorityId||'';
            const same=digest(current.files,current.calendar)===digest(state.pending.files,state.pending.calendar);
            state.clean=digest(state.pending.files,state.pending.calendar);
            state.dirty=!same;delete state.pending;delete state.pendingFileId;save();
            return {status:same?'saved':'pending'};
        }
        if(revision!==(state.base||''))fail('COPY_CONFLICT');
        if(!state.pending) {state.pending=validate({schema:2,owner,revision:crypto.randomUUID(),parent:revision,authorityId:state.authorityId||'',
            generatedAt:new Date().toISOString(),files:current.files,calendar:current.calendar},owner);state.owner=owner;save();}
        await calendarSync(state.pending);
        // Check again after network calendar work. Never publish onto an unseen new parent.
        const again=head(await remote.list(),owner);
        if((again ? again.appProperties.revision : '')!==revision)fail('COPY_CONFLICT');
        const uploaded=await remote.upload(state.pending);if(uploaded && uploaded.id){state.pendingFileId=uploaded.id;save();}
        return synchronize({state,local,client:remote,save,apply,calendarSync});
    }
    if(!tip) return {status:'missing'};
    if(revision!==(state.base||'')) {
        if(state.base && !remoteFiles.some(f=>f.appProperties.revision===state.base))fail('COPY_HISTORY_MISSING');
        const record=await remote.load(tip,owner); await apply(record);
        state.owner=owner;state.base=record.revision;state.clean=digest(record.files,record.calendar);save();
    }
    return {status:'saved'};
}
module.exports={PREFIX,LIMIT,hash,safeName,validate,digest,capture,writable,writeAtomic,install,recover,head,client,synchronize};

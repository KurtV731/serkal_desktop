'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const copy=require('./archive-copy');
const fail=code=>{throw Object.assign(new Error(code),{code});};

// One in-memory session, with no timer, local recovery state or revision graph.
class ArchiveSession {
    constructor({folder,calendar,selectCalendar,connect,bootstrap=()=>null,calendarSync=async()=>{},calendarPrepare=async()=>{},onChange=()=>{},onStatus=()=>{}}){
        Object.assign(this,{folder,calendar,selectCalendar,connect,bootstrap,calendarSync,calendarPrepare,onChange,onStatus});
        this.status='loading';this.error='';this.message='';this.busy=false;this.loaded=false;this.dirty=false;
        this.owner='';this.calendarPending=true;this.lastSynced='';this.progress=null;
    }
    view(){return {session:true,status:this.status,code:this.error,message:this.message,busy:this.busy,
        writable:this.loaded&&!this.busy,dirty:this.dirty,progress:this.progress,lastSynced:this.lastSynced,
        warning:this.warning||'',google:this.google||null,authorityPending:false,revision:this.revision||''};}
    report(phase){this.progress={phase,current:0,total:0};this.onStatus(this.view());}
    assertWrite(){if(this.busy)fail('SESSION_BUSY');if(!this.loaded)fail(this.error||'SESSION_NOT_LOADED');}
    changed(){this.assertWrite();this.dirty=true;this.status='pending';this.onStatus(this.view());}
    async start(){
        if(this.busy||this.loaded)return this.view();
        this.busy=true;this.error='';this.message='';this.google=null;this.status='loading';this.onStatus(this.view());
        try{
            this.report('identity');const remote=await this.connect();this.owner=remote.owner;
            this.report('archive-list');const record=await remote.load();
            // Validate everything before touching any TXT file. No old local session is imported.
            const seeded=record?null:this.bootstrap();
            const current=record||{schema:2,releaseNumber:copy.RELEASE,owner:remote.owner,revision:crypto.randomUUID(),parent:'',
                generatedAt:new Date().toISOString(),files:seeded?.files||[],calendar:seeded?.calendar||{mode:'',id:''}};
            if(current.calendar.mode==='none')current.calendar.mode='';
            copy.validate(current,remote.owner);
            const folder=this.folder();fs.mkdirSync(folder,{recursive:true});
            for(const name of fs.readdirSync(folder).filter(copy.safeName)){
                if(!fs.lstatSync(path.join(folder,name)).isFile())fail('COPY_INVALID');
            }
            for(const name of fs.readdirSync(folder).filter(copy.safeName))fs.unlinkSync(path.join(folder,name));
            for(const file of current.files)fs.writeFileSync(path.join(folder,file.name),file.content,'utf8');
            this.selectCalendar(current.calendar);this.owner=remote.owner;this.revision=current.revision;
            this.loaded=true;this.dirty=!!remote.migrated||!!seeded?.files?.length;this.status=this.dirty?'pending':'saved';this.onChange();
        }catch(error){this.failed(error);
            // A Google access failure never makes the user's local archive read-only.
            this.loaded=true;this.status='offline';this.onChange();
        }
        finally{this.busy=false;this.progress=null;this.onStatus(this.view());}
        return this.view();
    }
    failed(error){this.error=String(error.code||'SESSION_FAILED');this.message=String(error.message||error);this.status='error';this.google=error.google||null;}
    // Old IPC callers can only retry the initial load. They cannot overwrite an active session.
    sync(){return this.loaded?Promise.resolve(this.view()):this.start();}
    adoptLocal(){return this.sync();}
    async finish(){
        if(this.busy)return this.view();
        if(!this.loaded)return {...this.view(),busy:false};
        if(!this.dirty&&!this.calendarPending)return this.view();
        this.busy=true;this.error='';this.message='';this.google=null;this.status='syncing';this.onStatus(this.view());
        try{
            this.report('identity');const remote=await this.connect();
            if(this.owner&&remote.owner!==this.owner)fail('COPY_ACCOUNT_CHANGED');this.owner=remote.owner;
            const local=copy.capture(this.folder(),this.calendar());
            if(local.calendar.mode==='none')local.calendar.mode='';
            const record=copy.validate({schema:2,releaseNumber:copy.RELEASE,owner:this.owner,revision:crypto.randomUUID(),parent:'',
                generatedAt:new Date().toISOString(),files:local.files,calendar:local.calendar},this.owner);
            const before=JSON.stringify(record.calendar);let warning=null;
            try{await this.calendarPrepare(record);this.selectCalendar(record.calendar);}catch(error){warning=error;}
            if(this.dirty||before!==JSON.stringify(record.calendar)){this.report('archive-upload');await remote.save(record);}
            // Only update Calendar events once the archive write has succeeded.
            if(!warning)try{await this.calendarSync(record);}catch(error){warning=error;}
            this.calendarPending=!!warning;
            if(warning){this.warning=String(warning.message||warning);this.google=warning.google||null;}else this.warning='';
            this.revision=record.revision;this.dirty=false;this.status='saved';this.lastSynced=new Date().toISOString();
        }catch(error){this.failed(error);
            // A Google access failure never makes the user's local archive read-only.
            this.loaded=true;this.status='offline';this.onChange();
        }
        finally{this.busy=false;this.progress=null;this.onStatus(this.view());}
        return this.view();
    }
}
module.exports={ArchiveSession};

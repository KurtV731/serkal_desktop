'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const copy=require('./archive-copy'),scope=require('./calendar-scope');
const fail=code=>{throw Object.assign(new Error(code),{code});};

// One in-memory session, with no timer, local recovery state or revision graph.
class ArchiveSession {
    constructor({folder,calendar,selectCalendar,connect,confirmedFile=null,bootstrap=()=>null,calendarSync=async()=>{},calendarPrepare=async()=>{},calendarKey=record=>copy.digest(record.files,record.calendar),calendarProjection=null,onChange=()=>{},onStatus=()=>{}}){
        Object.assign(this,{folder,calendar,selectCalendar,connect,confirmedFile,bootstrap,calendarSync,calendarPrepare,calendarKey,calendarProjection,onChange,onStatus});
        this.status='loading';this.error='';this.message='';this.busy=false;this.loaded=false;this.dirty=false;
        this.owner='';this.confirmed=null;
        if(confirmedFile)try{const r=JSON.parse(fs.readFileSync(confirmedFile,'utf8'));this.confirmed=copy.validate(r,r.owner);}catch(_){}
        this.baseline=null;this.calendarBaseline=null;this.forceSave=false;this.calendarPending=false;
        this.pendingScopes=[];this.calendarBaselineProjection=null;
        if(confirmedFile)try{const flag=JSON.parse(fs.readFileSync(confirmedFile+'.calendar-pending','utf8'));this.pendingOwner=flag.owner;this.pendingScopes=scope.read(flag.scopes);}catch(_){}this.lastSynced='';this.progress=null;
    }
    view(){return {session:true,status:this.status,code:this.error,message:this.message,busy:this.busy,
        writable:this.loaded&&!this.busy,dirty:this.dirty,calendarPending:this.calendarPending,progress:this.progress?{...this.progress,elapsedMs:Date.now()-(this.phaseStart||Date.now())}:null,lastSynced:this.lastSynced,
        warning:this.warning||'',google:this.google||null,authorityPending:false,revision:this.revision||''};}
    report(phase,current=0,total=0){if(this.progress?.phase!==phase)this.phaseStart=Date.now();this.progress={phase,current,total};this.onStatus(this.view());}
    assertWrite(){if(this.busy)fail('SESSION_BUSY');if(!this.loaded)fail(this.error||'SESSION_NOT_LOADED');}
    local(){const r=copy.capture(this.folder(),this.calendar());if(r.calendar.mode==='none')r.calendar.mode='';return r;}
    hasChanges(){try{const r=this.local();return this.forceSave||copy.digest(r.files,r.calendar)!==this.baseline;}catch(_){return this.dirty;}}
    changed(){this.assertWrite();this.dirty=this.hasChanges();this.status=this.dirty?'pending':'saved';this.onStatus(this.view());}
    async measure(phase,operation){const start=Date.now();let ok=false;this.report(phase);try{const result=await operation();ok=true;return result;}finally{this.onStatus({...this.view(),measurement:{phase,elapsedMs:Date.now()-start,ok}});}}
    closeUnchanged(){this.onStatus({...this.view(),measurement:{phase:'close-unchanged',elapsedMs:0,ok:true}});return {...this.view(),status:'unchanged',code:'',message:'',dirty:false};}
    markCalendarPending(value,scopes=this.pendingScopes){
        this.calendarPending=value;this.pendingOwner=value?this.owner:null;this.pendingScopes=value?scopes:[];
        if(this.confirmedFile){const file=this.confirmedFile+'.calendar-pending';
            if(value)copy.writeAtomic(file,{owner:this.owner,scopes:this.pendingScopes});else fs.rmSync(file,{force:true});
        }
    }
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
            this.installLocal(current);this.confirm(current);
            this.selectCalendar(current.calendar);this.owner=remote.owner;this.revision=current.revision;
            this.calendarPending=this.pendingOwner===this.owner;
            this.loaded=true;this.baseline=copy.digest(current.files,current.calendar);this.calendarBaseline=this.calendarKey(current);this.calendarBaselineProjection=this.calendarProjection?.(current)||null;this.forceSave=!!remote.migrated||!!seeded?.files?.length;this.dirty=this.forceSave;this.status=this.dirty?'pending':'saved';this.onChange();
        }catch(error){this.failed(error);
            // A Google access failure never makes the user's local archive read-only.
            if(this.confirmed&&(!this.owner||this.confirmed.owner===this.owner))try{this.installLocal(this.confirmed);this.selectCalendar(this.confirmed.calendar);if(!this.owner)this.owner=this.confirmed.owner;}catch(_){}
            this.calendarPending=this.pendingOwner===this.owner;
            this.loaded=true;try{const r=this.local();this.baseline=copy.digest(r.files,r.calendar);const record={...r,revision:'local',generatedAt:new Date().toISOString()};this.calendarBaseline=this.calendarKey(record);this.calendarBaselineProjection=this.calendarProjection?.(record)||null;}catch(_){}this.status='offline';this.onChange();
        }
        finally{this.busy=false;this.progress=null;this.onStatus(this.view());}
        return this.view();
    }
    installLocal(record){
        const folder=this.folder();fs.mkdirSync(folder,{recursive:true});
        copy.validate(record,record.owner);
        for(const name of fs.readdirSync(folder).filter(copy.safeName))if(!fs.lstatSync(path.join(folder,name)).isFile())fail('COPY_INVALID');
        for(const name of fs.readdirSync(folder).filter(copy.safeName))fs.unlinkSync(path.join(folder,name));
        for(const file of record.files)fs.writeFileSync(path.join(folder,file.name),file.content,'utf8');
    }
    confirm(record){this.confirmed=JSON.parse(JSON.stringify(record));if(this.confirmedFile)copy.writeAtomic(this.confirmedFile,this.confirmed);}
    failed(error){this.error=['TimeoutError','AbortError'].includes(error.name)?'SESSION_CLOSE_TIMEOUT':String(error.code||'SESSION_FAILED');this.message=String(error.message||error);this.status='error';this.google=error.google||null;}
    // Old IPC callers can only retry the initial load. They cannot overwrite an active session.
    sync(){return this.loaded?Promise.resolve(this.view()):this.start();}
    adoptLocal(){return this.sync();}
    async finish(){
        if(this.busy)return this.view();
        if(!this.loaded)return {...this.view(),busy:false};
        this.dirty=this.hasChanges();if(!this.dirty&&!this.calendarPending)return this.closeUnchanged();
        this.deadline=Date.now()+45000;
        this.busy=true;this.error='';this.message='';this.google=null;this.status='syncing';this.onStatus(this.view());
        try{
            const remote=await this.measure('archive-connect',()=>this.connect({deadline:this.deadline}));
            if(this.owner&&remote.owner!==this.owner)fail('COPY_ACCOUNT_CHANGED');this.owner=remote.owner;
            const local=this.local();
            if(local.calendar.mode==='none')local.calendar.mode='';
            const record=copy.validate({schema:2,releaseNumber:copy.RELEASE,owner:this.owner,revision:crypto.randomUUID(),parent:'',
                generatedAt:new Date().toISOString(),files:local.files,calendar:local.calendar},this.owner);
            const before=JSON.stringify(record.calendar);let warning=null;
            const changedScopes=()=>this.calendarProjection?scope.changes(this.calendarBaselineProjection,this.calendarProjection(record)):(this.calendarKey(record)!==this.calendarBaseline?null:[]);
            let scopes=this.calendarPending?scope.union(this.pendingScopes,changedScopes()):changedScopes();
            const needsCalendar=scopes===null||scopes.length>0;
            try{if(needsCalendar)await this.measure('calendar-prepare',()=>this.calendarPrepare(record));this.selectCalendar(record.calendar);}catch(error){warning=error;}
            // The target may have been recovered/created during preparation.
            scopes=this.calendarPending?scope.union(this.pendingScopes,changedScopes()):changedScopes();
            if(needsCalendar)this.markCalendarPending(true,scopes);
            if(this.dirty||before!==JSON.stringify(record.calendar)){await this.measure('archive-upload',()=>remote.save(record));this.confirm(record);this.forceSave=false;this.baseline=copy.digest(record.files,record.calendar);}
            // Only update Calendar events once the archive write has succeeded.
            if(needsCalendar&&!warning)try{
                const projected=this.calendarProjection?.(record)||null;
                await this.measure('calendar-sync',()=>this.calendarSync(record,scopes,remaining=>{
                    this.markCalendarPending(remaining.length>0,remaining);
                    // Durable remaining scopes cover all outstanding work at this projection.
                    this.calendarBaselineProjection=projected;
                    this.onStatus({...this.view(),calendarWork:{remainingScopes:remaining.length}});
                }));
                this.calendarBaseline=this.calendarKey(record);this.calendarBaselineProjection=projected;
            }catch(error){warning=error;}
            this.markCalendarPending(!!warning);
            if(warning){this.warning=String(warning.message||warning);this.google=warning.google||null;}else this.warning='';
            this.revision=record.revision;this.dirty=false;this.status='saved';this.lastSynced=new Date().toISOString();
        }catch(error){this.failed(error);
            // A Google access failure never makes the user's local archive read-only.
            this.loaded=true;this.status='offline';this.onChange();
        }
        finally{this.busy=false;this.progress=null;this.deadline=0;this.onStatus(this.view());}
        return this.view();
    }
}
module.exports={ArchiveSession};

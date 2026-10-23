'use strict';
const fs=require('node:fs'),crypto=require('node:crypto'),path=require('node:path');
const copy=require('./archive-copy');
class DesktopCopy {
    constructor({folder,stateFile,calendar,selectCalendar,token,bootstrap,calendarSync,lock,onChange=()=>{},onStatus=()=>{}}) {
        Object.assign(this,{folder,stateFile,calendar,selectCalendar,token,bootstrap,calendarSync,lock,onChange,onStatus});
        this.state={base:'',owner:'',dirty:false};this.status='loading';this.error='';this.initialized=false;this.busy=false;
        try {this.state=JSON.parse(fs.readFileSync(stateFile,'utf8'));}catch(error){if(error.code!=='ENOENT')this.error='COPY_LOCAL_STATE_INVALID';}
    }
    save(){copy.writeAtomic(this.stateFile,this.state);}
    local(){return copy.capture(this.folder(),this.calendar());}
    available(){
        try{const folder=this.folder();fs.mkdirSync(folder,{recursive:true});const stat=fs.statfsSync(folder),bytes=Buffer.byteLength(JSON.stringify(this.local()));
            return copy.writable(Number(stat.bavail)*Number(stat.bsize),bytes);}catch(_){return false;}
    }
    view(){const available=this.available();return {status:this.status,code:available?this.error:"COPY_LOW_SPACE",busy:this.busy,writable:this.initialized && !this.fatal() && available,dirty:!!this.state.dirty,
        progress:this.progress||null,lastSynced:this.state.lastSynced||'',revision:this.state.base||''};}
    report(phase,current=0,total=0){this.progress={phase,current,total};this.onStatus(this.view());}
    fatal(){return /^(COPY_(CONFLICT|ACCOUNT_CHANGED|LOW_SPACE|LOCAL_STATE_INVALID|INVALID|HISTORY_MISSING|NEEDS_SOURCE|LEGACY_PENDING|CALENDAR_TARGET_MISSING|CALENDAR_AMBIGUOUS|CALENDAR_ACCESS_DENIED))$/.test(this.error);}
    assertWrite(){if(this.fatal())copyError(this.error);if(!this.initialized)copyError('COPY_LOADING');if(!this.available())copyError('COPY_LOW_SPACE');}
    changed(){
        if(!this.initialized)return;
        const local=this.local();
        if(copy.digest(local.files,local.calendar)===this.state.clean && !this.state.pending)return;
        this.state.dirty=true;this.save();this.status='pending';this.schedule();
    }
    schedule(){clearTimeout(this.timer);this.timer=setTimeout(()=>this.sync(),800);this.timer.unref?.();}
    async sync() {
        if(this.busy)return this.view();
        const previousError=this.error;
        this.busy=true;this.status='syncing';this.error='';this.progress=null;this.onStatus(this.view());
        try {
            if(previousError==='COPY_LOCAL_STATE_INVALID')copyError(previousError);
            this.report('identity');
            const access=await this.token();if(!access)copyError('COPY_CONNECT');
            const remote=copy.client(access),owner=await remote.identify();
            if(this.state.owner && this.state.owner!==owner)copyError('COPY_ACCOUNT_CHANGED');
            this.state.owner=owner;
            const folder=this.folder();fs.mkdirSync(folder,{recursive:true});await this.lock(()=>copy.recover(folder));
            if(!this.initialized && this.state.base && this.state.clean && copy.digest(this.local().files,this.local().calendar)!==this.state.clean) {
                this.state.dirty=true;this.save();
            }
            this.report('archive-list');
            const files=await remote.list();
            if(!files.length && !this.state.base && !this.state.dirty) {
                await this.bootstrap(owner,access);
                if(!this.available())copyError('COPY_LOW_SPACE');
                this.state.dirty=true;this.save();
            }
            const result=await copy.synchronize({state:this.state,local:()=>this.local(),client:remote,save:()=>this.save(),
                apply:record=>this.lock(()=>{
                    if(this.state.dirty)copyError('COPY_CONFLICT');
                    copy.install(folder,record);this.selectCalendar(record.calendar);this.onChange();
                }),calendarSync:record=>this.calendarSync(record)});
            if(result.status==='missing')copyError('COPY_MISSING');
            this.initialized=true;this.error='';this.status=result.status;
            if(result.status==='saved'){this.state.lastSynced=new Date().toISOString();this.save();}
            if(result.status==='pending')this.schedule();
        }catch(error){this.error=String(error.code||error.message||'COPY_FAILED');this.status='error';if(!this.fatal() && this.state.base)this.initialized=true;
            if(this.state.dirty && !this.fatal()){clearTimeout(this.timer);this.timer=setTimeout(()=>this.sync(),30000);this.timer.unref?.();}}
        finally{this.busy=false;this.progress=null;this.onStatus(this.view());}
        return this.view();
    }
}
function copyError(code){throw Object.assign(new Error(code),{code});}
module.exports={DesktopCopy};

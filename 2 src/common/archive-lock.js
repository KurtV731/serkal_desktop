'use strict';
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const crypto=require('node:crypto');
function fail(code){throw Object.assign(new Error(code),{code});}
function alive(pid){try{process.kill(pid,0);return true;}catch(e){return e.code!=='ESRCH';}}
// Atomic only on a real shared filesystem. A sync client's replicated directory is not a mutex.
function acquire(folder){
 const root=fs.realpathSync(folder), file=path.join(root,'.serkal-write-lock.json'), guard=path.join(root,'.serkal-write-guard');
 const token=crypto.randomUUID();
 function guarded(fn){
  try{fs.mkdirSync(guard);}catch(e){if(e.code==='EEXIST')fail('ARCHIVE_LOCK_BUSY');throw e;}
  try{return fn();}finally{fs.rmdirSync(guard);}
 }
 guarded(()=>{
  if(fs.existsSync(file)){
   let old;try{old=JSON.parse(fs.readFileSync(file,'utf8'));}catch(_){fail('ARCHIVE_LOCK_UNKNOWN');}
   if(!old || old.schema!==1 || !old.token || !Number.isInteger(old.pid) || old.pid<=0)fail('ARCHIVE_LOCK_UNKNOWN');
   // Never steal a remote machine's lock or an existing live process's lock.
   if(old.host!==os.hostname() || alive(old.pid))fail('ARCHIVE_LOCK_BUSY');
   fs.unlinkSync(file);
  }
  fs.writeFileSync(file,JSON.stringify({schema:1,token,pid:process.pid,host:os.hostname(),startedAt:new Date().toISOString()}),{flag:'wx',mode:0o600});
 });
 let released=false;
 return {release(){
  if(released)return;
  guarded(()=>{
   const owner=JSON.parse(fs.readFileSync(file,'utf8'));
   if(owner.token!==token)fail('ARCHIVE_LOCK_LOST');
   fs.unlinkSync(file);released=true;
  });
 }};
}
async function withWriteLock(folder,operation){
 const lock=acquire(folder);
 try{return await operation();}finally{lock.release();}
}
module.exports={acquire,withWriteLock};

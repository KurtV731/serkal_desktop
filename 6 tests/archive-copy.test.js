'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto');
const copy=require('../2 src/common/archive-copy');
const owner='123',calendar={mode:'google',id:'existing-calendar'},file={name:'Serie (2026).txt',content:'S01; startOriginal=2026-10-01; dates=01.10.,08.10.; offsetDE=1; note=OffsetDE%3A%20%2B1D; manualFlags=152\n'};
file.sha256=copy.hash(file.content);
function record(parent='',files=[file]) {return {schema:2,owner,revision:crypto.randomUUID(),parent,generatedAt:new Date().toISOString(),calendar,files};}
function metadata(r) {return {id:r.revision,name:copy.PREFIX+r.revision+'.json',md5Checksum:copy.hash(JSON.stringify(r)),appProperties:{owner,revision:r.revision,parent:r.parent}};}
function fakeRemote() {const records=[];return {records,identify:async()=>owner,list:async()=>records.map(metadata),load:async f=>records.find(r=>r.revision===f.id),upload:async r=>records.push(JSON.parse(JSON.stringify(r)))};}
(async()=>{
 const a=record(),b=record(a.revision),branch=record(a.revision);
 assert.equal(copy.head([metadata(a),metadata(b)],owner).id,b.revision);
 assert.throws(()=>copy.head([metadata(a),metadata(b),metadata(branch)],owner),/COPY_CONFLICT/);
 assert.throws(()=>copy.head([metadata(b)],owner),/COPY_HISTORY_MISSING/);
 assert.throws(()=>copy.validate({...a,files:[{...file,content:'corrupted'}]},owner),/COPY_INVALID/);
 assert.throws(()=>copy.validate({...a,files:[{...file,name:'../settings.txt'}]},owner),/COPY_INVALID/);
 assert.throws(()=>copy.validate(a,'other-user'),/COPY_INVALID/);
 assert.equal(copy.writable(9*1024*1024,10),false);assert.equal(copy.writable(10*1024*1024,2*1024*1024),true);
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'serkal-copy-'));fs.writeFileSync(path.join(dir,file.name),file.content);
 fs.writeFileSync(path.join(dir,'!!SERKAL_LOG_today.txt'),'private log');
 copy.install(dir,a);assert.equal(fs.readFileSync(path.join(dir,file.name),'utf8'),file.content);
 assert.equal(fs.readFileSync(path.join(dir,'!!SERKAL_LOG_today.txt'),'utf8'),'private log');
 const backup=path.join(dir,'.serkal-copy-backups',a.revision);
 copy.writeAtomic(path.join(dir,'.serkal-copy-install.json'),{backup,phase:'installing'});
 fs.writeFileSync(path.join(dir,file.name),'half-written');copy.recover(dir);
 assert.equal(fs.readFileSync(path.join(dir,file.name),'utf8'),file.content);fs.rmSync(dir,{recursive:true});
 const remote=fakeRemote(),state={owner,base:'',dirty:true},local={files:[file],calendar};let saves=0;
 const args={state,local,client:remote,save:()=>saves++,apply:async()=>{throw Error('dirty local must not be replaced');}};
 const upload=remote.upload;remote.upload=async r=>{await upload(r);throw Error('lost upload response');};
 await assert.rejects(copy.synchronize(args),/lost upload response/);assert(state.pending);assert.equal(remote.records.length,1);
 remote.upload=upload;assert.equal((await copy.synchronize(args)).status,'saved');assert.equal(remote.records.length,1);assert(!state.dirty);assert.equal(saves,2);
 const newer={...file,content:file.content+'S02; eps=2\n'};newer.sha256=copy.hash(newer.content);
 state.dirty=true;let current={files:[file],calendar};args.local=()=>current;
 remote.upload=async r=>{await upload(r);current={files:[newer],calendar};};
 assert.equal((await copy.synchronize(args)).status,'pending');assert(state.dirty);assert.equal(state.clean,copy.digest([file],calendar));
 remote.upload=upload;assert.equal((await copy.synchronize(args)).status,'saved');assert.equal(remote.records.at(-1).files[0].content,newer.content);
 state.dirty=true;const foreign=record(state.base);remote.records.push(foreign);
 await assert.rejects(copy.synchronize(args),/COPY_CONFLICT/);assert(state.dirty);assert.equal(remote.records.at(-1),foreign);
 // A successful upload can be fetched directly while the listing still lags.
 const lagged=fakeRemote(),lagState={owner,base:'',dirty:true};let listVisible=false;
 const lagUpload=lagged.upload;lagged.upload=async r=>{await lagUpload(r);return {id:r.revision};};
 const lagList=lagged.list;lagged.list=async()=>listVisible?lagList():[];
 const lagArgs={state:lagState,local,client:lagged,save:()=>{},apply:async()=>{throw Error('do not roll back');}};
 assert.equal((await copy.synchronize(lagArgs)).status,'saved');assert.equal(lagged.records.length,1);
 listVisible=true;assert.equal((await copy.synchronize(lagArgs)).status,'saved');
 console.log('archive-copy: full fidelity, interrupted transfer, new local edit, conflict and recovery passed');
})().catch(e=>{console.error(e);process.exitCode=1;});

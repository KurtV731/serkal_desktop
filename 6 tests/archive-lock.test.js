'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {spawnSync}=require('node:child_process');
const {acquire,withWriteLock}=require('../2 src/common/archive-lock');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'serkal-lock-'));
const file=path.join(dir,'.serkal-write-lock.json');
(async()=>{try{
 const first=acquire(dir);
 assert.throws(()=>acquire(dir),{code:'ARCHIVE_LOCK_BUSY'});
 const child=spawnSync(process.execPath,['-e',`try{require('./2 src/common/archive-lock').acquire(process.argv[1]);process.exit(2)}catch(e){process.exit(e.code==='ARCHIVE_LOCK_BUSY'?0:3)}`,dir]);assert.equal(child.status,0);
 first.release();first.release();
 await assert.rejects(withWriteLock(dir,async()=>{throw Error('operation failed');}),/operation failed/);assert.equal(fs.existsSync(file),false);
 const dead=spawnSync(process.execPath,['-e',`require('./2 src/common/archive-lock').acquire(process.argv[1]);`,dir]);assert.equal(dead.status,0);
 const recovered=acquire(dir);recovered.release();
 fs.writeFileSync(file,JSON.stringify({schema:1,token:'remote',pid:999999,host:'other-host'}));assert.throws(()=>acquire(dir),{code:'ARCHIVE_LOCK_BUSY'});assert.equal(JSON.parse(fs.readFileSync(file)).token,'remote');
 fs.writeFileSync(file,'broken');assert.throws(()=>acquire(dir),{code:'ARCHIVE_LOCK_UNKNOWN'});
 console.log('Archive lock: competing processes, release, crash recovery and remote-owner protection OK');
}finally{fs.rmSync(dir,{recursive:true,force:true});}})().catch(e=>{console.error(e);process.exitCode=1;});

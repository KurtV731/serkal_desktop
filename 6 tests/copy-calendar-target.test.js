const assert=require('node:assert/strict');const {resolve}=require('../2 src/common/copy-calendar-target');
(async()=>{
 const item=id=>({id,summary:'SerKal App',accessRole:'owner'});
 let calls=[];let options={id:'deleted',preferred:'current',check:async id=>{calls.push(id);return {ok:id==='current',status:id==='current'?200:404};},list:async()=>{throw Error('not needed');}};
 assert.equal((await resolve(options)).id,'current');assert.deepEqual(calls,['deleted','current']);
 options={id:'deleted',check:async id=>({ok:id!=='deleted',status:id==='deleted'?404:200}),list:async()=>[item('current')]};
 assert.equal((await resolve(options)).id,'current');
 await assert.rejects(resolve({...options,list:async()=>[item('one'),item('two')]}),e=>e.code==='COPY_CALENDAR_AMBIGUOUS');
 await assert.rejects(resolve({...options,list:async()=>[]}),e=>e.code==='COPY_CALENDAR_TARGET_MISSING');
 await assert.rejects(resolve({...options,check:async()=>({ok:false,status:403})}),e=>e.code==='COPY_CALENDAR_ACCESS_DENIED');
 await assert.rejects(resolve({...options,check:async()=>({ok:false,status:500})}),e=>e.code==='COPY_CALENDAR_CHECK_FAILED');
 assert.equal((await resolve({...options,id:'current',list:async()=>{throw Error('valid target must not be replaced');}})).recovered,false);
 console.log('Copy calendar target: stale pending ID, existing app calendar, ambiguity and denied access: OK');
})().catch(e=>{console.error(e);process.exitCode=1;});

'use strict';
const assert=require('node:assert/strict');const {prepareClose}=require('../2 src/common/close-guard');
(async()=>{
async function scenario(ui,choices,save=true,remote={dirty:false},sync={status:'saved',dirty:false,busy:false}){let n=0,notices=[];const result=await prepareClose({read:async()=>n?{dirty:false}:ui,save:async()=>{n++;return save;},choose:async()=>choices.shift(),status:async()=>remote,sync:async()=>sync,notify:async x=>notices.push(x)});return {result,notices};}
assert.equal((await scenario({dirty:false},[])).result,true);
assert.equal((await scenario({dirty:true},['cancel'])).result,false);
assert.equal((await scenario({dirty:true},['discard'])).result,true);
assert.equal((await scenario({dirty:true},['save'])).result,true);
assert.deepEqual(await scenario({dirty:true},['save'],false),{result:false,notices:['saveFailed']});
assert.equal((await scenario({busy:true},[])).result,false);
assert.equal((await scenario({dirty:false},['local'],true,{dirty:true})).result,true);
assert.equal((await scenario({dirty:false},['cancel'],true,{dirty:true})).result,false);
assert.equal((await scenario({dirty:false},['sync'],true,{dirty:true})).result,true);
assert.deepEqual(await scenario({dirty:false},['sync'],true,{dirty:true},{status:'error',dirty:true}),{result:false,notices:['syncFailed']});
console.log('Close guard: clean, save, discard, cancel, active work, pending Google and failed synchronization passed');
})();

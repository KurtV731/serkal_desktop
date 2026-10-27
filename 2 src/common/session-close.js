'use strict';
// No recurring sync and no questions on the next launch. Only a failed close is reported.
async function prepareSessionClose({read,save,finish,choose,notify}){
    const ui=await read();
    if(ui.busy){await notify('busy');return false;}
    if(ui.dirty){
        let saved=false;try{saved=!!await save();}catch(_){}
        const after=await read();
        if(!saved||after.dirty||after.busy)return await choose('saveFailed')==='discard';
    }
    const result=await finish();
    if(result.busy)return false;
    if(result.dirty)return await choose('syncFailed',result)==='discard';
    return true;
}
module.exports={prepareSessionClose};

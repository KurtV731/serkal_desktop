'use strict';
const fail=(code,status)=>{throw Object.assign(new Error(code),{code,status});};
// Repair only a missing target, using an already existing, accessible app calendar.
// Never create a replacement or guess between multiple calendars.
async function resolve({id,preferred='',check,list}){
    async function accessible(candidate){
        const result=await check(candidate);
        if(result.ok)return true;
        if([403,404,410].includes(result.status))return false;
        fail('COPY_CALENDAR_CHECK_FAILED',result.status);
    }
    if(id){const first=await check(id);if(first.ok)return {id,recovered:false};
        if(![404,410].includes(first.status))fail(first.status===403?'COPY_CALENDAR_ACCESS_DENIED':'COPY_CALENDAR_CHECK_FAILED',first.status);}
    if(preferred && preferred!==id && await accessible(preferred))return {id:preferred,recovered:true};
    const candidates=[];
    for(const item of await list()){
        const name=String(item.summaryOverride||item.summary||'').trim().toLowerCase();
        if(item.deleted || item.accessRole!=='owner' || !['serkal','serkal app','serkal-app'].includes(name) || item.id===id)continue;
        if(await accessible(item.id))candidates.push(item.id);
    }
    const unique=[...new Set(candidates)];
    if(unique.length!==1)fail(unique.length?'COPY_CALENDAR_AMBIGUOUS':'COPY_CALENDAR_TARGET_MISSING');
    return {id:unique[0],recovered:true};
}
module.exports={resolve};

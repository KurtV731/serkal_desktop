'use strict';
// Every close route uses this policy. A failed save never permits closing.
async function prepareClose({read,save,choose,sync,status,notify}) {
  let ui=await read();
  if(ui.busy){await notify('busy');return false;}
  if(ui.dirty){
    const action=await choose('dirty');
    if(action==='cancel')return false;
    if(action==='save'){
      if(!await save()){await notify('saveFailed');return false;}
      ui=await read();
      if(ui.dirty || ui.busy){await notify('saveFailed');return false;}
    } else if(action!=='discard')return false;
  }
  const remote=await status();
  if(remote.dirty || remote.busy){
    const action=await choose('sync');
    if(action==='cancel')return false;
    if(action==='sync'){
      const result=await sync();
      if(result.dirty || result.busy || result.status!=='saved'){await notify('syncFailed');return false;}
    } else if(action!=='local')return false;
  }
  return true;
}
module.exports={prepareClose};

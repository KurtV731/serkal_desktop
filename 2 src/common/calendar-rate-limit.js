'use strict';
// One Calendar request at a time, with bounded backoff. Drive is not involved.
function limited(result){
    const reasons=result?.data?.error?.errors||[];
    return result?.status===429 || (result?.status===403 && reasons.some(e=>['rateLimitExceeded','userRateLimitExceeded'].includes(e.reason)));
}
function create({deadline=()=>0,now=Date.now,sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms)),random=Math.random,onWait=()=>{}}={}){
    let queue=Promise.resolve(),lastStart=null,blocked=null;
    const expired=()=>{throw Object.assign(new Error('SESSION_CLOSE_TIMEOUT'),{code:'SESSION_CLOSE_TIMEOUT'});};
    async function wait(ms,result){
        const end=deadline();
        if(end && now()+ms>=end){if(result)return false;expired();}
        if(ms>0)await sleep(ms);
        return true;
    }
    return {run(request){
        const run=queue.then(async()=>{
            if(blocked)return blocked;
            if(deadline()&&now()>=deadline())expired();
            await wait(lastStart===null?0:Math.max(0,250-(now()-lastStart)));
            for(let attempt=0;;attempt++){
                lastStart=now();const result=await request();
                if(!limited(result))return result;
                const delay=Math.max(Number(result.retryAfterMs)||0,1000*2**attempt+Math.floor(random()*1000));
                if(attempt>=3 || (deadline()&&now()+delay>=deadline())){blocked=result;return result;}
                onWait({attempt:attempt+1,delayMs:delay,status:result.status});
                await wait(delay,result);
            }
        });
        queue=run.catch(()=>{});return run;
    }};
}
module.exports={create,limited};

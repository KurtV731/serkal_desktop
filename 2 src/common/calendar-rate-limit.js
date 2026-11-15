'use strict';
// One Calendar request at a time, with bounded backoff. Drive is not involved.
function limited(result){
    const reasons=result?.data?.error?.errors||[];
    return result?.status===429 || (result?.status===403 && reasons.some(e=>['rateLimitExceeded','userRateLimitExceeded'].includes(e.reason)));
}
function create({deadline=()=>0,now=Date.now,sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms)),random=Math.random,onWait=()=>{},batchSize=20,batchPauseMs=2000,maxRetries=7}={}){
    let queue=Promise.resolve(),lastStart=null,blocked=null,requests=0,writesSincePause=0;
    const expired=()=>{throw Object.assign(new Error('SESSION_CLOSE_TIMEOUT'),{code:'SESSION_CLOSE_TIMEOUT'});};
    async function wait(ms,result,detail=null){
        const end=deadline();
        if(end && now()+ms>=end){if(result)return false;expired();}
        let remaining=ms;
        while(remaining>0){
            if(deadline()&&now()>=deadline())expired();
            if(detail)onWait({...detail,delayMs:ms,remainingMs:remaining,requests});
            const step=Math.min(1000,remaining);await sleep(step);remaining-=step;
        }
        return true;
    }
    return {run(request,{write=false}={}){
        const run=queue.then(async()=>{
            if(blocked)return blocked;
            if(deadline()&&now()>=deadline())expired();
            await wait(lastStart===null?0:Math.max(0,250-(now()-lastStart)));
            for(let attempt=0;;attempt++){
                // Pace every HTTP attempt; take a batch pause after successful writes only.
                if(write&&batchSize>0&&writesSincePause>=batchSize){
                    await wait(batchPauseMs,null,{kind:'batch',attempt:0});writesSincePause=0;
                }
                if(deadline()&&now()>=deadline())expired();
                lastStart=now();requests++;const result=await request();
                if(!limited(result)){if(write&&(result.ok||[404,410].includes(result.status)))writesSincePause++;return result;}
                const delay=Math.max(Number(result.retryAfterMs)||0,Math.min(32000,1000*2**attempt)+Math.floor(random()*1000));
                if(attempt>=maxRetries || (deadline()&&now()+delay>=deadline())){blocked=result;return result;}
                await wait(delay,result,{kind:'retry',attempt:attempt+1,status:result.status});
            }
        });
        queue=run.catch(()=>{});return run;
    }};
}
module.exports={create,limited};

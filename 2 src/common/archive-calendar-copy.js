'use strict';
const crypto=require('node:crypto');
const sha=(type,text)=>crypto.createHash(type).update(text).digest('hex');
function signature(event) {
    const p=event.extendedProperties && event.extendedProperties.private || {};
    return sha('sha256',[String(event.summary||'').trim(),String(event.start && (event.start.date||event.start.dateTime)||'').slice(0,10),
        String(event.end && (event.end.date||event.end.dateTime)||'').slice(0,10),String(event.description||''),
        String(p.tmdbId||''),String(p.season||''),String(p.episodeFrom||''),String(p.episodeTo||'')].join('|'));
}
function key(event) {const p=event.extendedProperties && event.extendedProperties.private || {};return [p.tmdbId,p.season,p.episodeFrom,p.episodeTo].join(':');}
function plan(entries, events, revision, year=new Date().getFullYear()) {
    const desired=new Map(),past=new Set();
    for(const entry of entries) {
        const dates=entry.activeDates||entry.dates||[],season=entry.seasonLabel||entry.staffelLabel;
        if(!entry.tmdbId || !/^S\d{1,3}$/.test(season) || !dates.length)continue;
        if(dates.every(d=>d.slice(0,4)<String(year))){past.add(entry.tmdbId+':'+season);continue;}
        for(let i=0;i<dates.length;) {
            let last=i;while(last+1<dates.length && dates[last+1]===dates[i])last++;
            const date=dates[i],next=new Date(date+'T00:00:00Z');next.setUTCDate(next.getUTCDate()+1);
            const event={summary:entry.title+' ('+entry.year+') '+season+'E'+String(i+1).padStart(2,'0')+(last===i?'':'–E'+String(last+1).padStart(2,'0')),
                description:'SerKal',start:{date},end:{date:next.toISOString().slice(0,10)},transparency:'transparent',
                extendedProperties:{private:{serkal:'1',tmdbId:String(entry.tmdbId),season,episodeFrom:String(i+1),episodeTo:String(last+1)}}};
            event.extendedProperties.private.serkalSignature=signature(event);
            event.id='serkal'+sha('sha1',key(event)+':'+revision);
            desired.set(key(event),event);i=last+1;
        }
    }
    const operations=[],seen=new Set();
    for(const event of events) {
        const p=event.extendedProperties && event.extendedProperties.private || {};
        if(p.serkal!=='1' || event.status==='cancelled')continue;
        const k=key(event),target=desired.get(k);
        if(!target && past.has(p.tmdbId+':'+p.season))continue;
        const stored=p.serkalSignature;
        // Foreign events and manual Calendar changes remain protected.
        if(!stored || stored!==signature(event)) {
            if(!target || signature(target)!==signature(event))throw Object.assign(new Error('COPY_CALENDAR_PROTECTED'),{code:'COPY_CALENDAR_PROTECTED'});
            seen.add(k);continue;
        }
        if(!target || seen.has(k))operations.push({method:'DELETE',id:event.id});
        else {seen.add(k);if(signature(target)!==signature(event)){const body={...target};delete body.id;operations.push({method:'PUT',id:event.id,body});}}
    }
    for(const [k,body] of desired)if(!seen.has(k))operations.push({method:'POST',id:'',body});
    return operations;
}
module.exports={signature,key,plan};

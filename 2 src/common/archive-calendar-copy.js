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
function announcementPlan(entries,events,revision){
 const desired=new Map();
 for(const entry of entries)for(const a of entry.announcements||[]){
  const cardDate=a.date||[...(a.history||[])].reverse().find(h=>h.to)?.to;
  if(!/^\d{4}-\d{2}-\d{2}$/.test(cardDate||''))continue;
  const k=String(entry.tmdbId)+':S'+String(a.season).padStart(2,'0');
  const en=a.language==='en',next=new Date(cardDate+'T00:00:00Z');next.setUTCDate(next.getUTCDate()+1);
  const history=(a.history||[]).map(h=>en?'Recorded on '+h.capturedAt+': '+(h.from?'from '+h.from+' → ':'announced for ')+(h.to||'date unknown'):'Erfasst am '+h.capturedAt+': '+(h.from?'von '+h.from+' → ':'angekündigt für ')+(h.to||'Termin unbekannt'));
  const event={id:'serkal'+sha('sha1','announcement:'+k),summary:(en?'Announced season start: ':'Angekündigter Staffelstart: ')+a.title+' S'+String(a.season).padStart(2,'0'),description:[en?'Provisional start date. This card remains until you delete it.':'Vorläufiges Startdatum. Diese Karte bleibt bis zur manuellen Löschung bestehen.',...history].join('\n'),start:{date:cardDate},end:{date:next.toISOString().slice(0,10)},transparency:'transparent',extendedProperties:{private:{serkal:'announcement',announcementKey:k}}};
  desired.set(k,event);
 }
 const operations=[];
 for(const e of events){if(e.status==='cancelled'){for(const [k,t] of desired)if(t.id===e.id)desired.delete(k);continue;}const p=e.extendedProperties&&e.extendedProperties.private||{};if(p.serkal!=='announcement')continue;
  if(e.status==='cancelled'){desired.delete(p.announcementKey);continue;}
  const target=desired.get(p.announcementKey);if(!target)continue;desired.delete(p.announcementKey);
  // Only a changed announced date/history causes an update. Ordinary deletion never removes these cards.
  if(e.description!==target.description||e.start?.date!==target.start.date||e.summary!==target.summary){const body={...target};delete body.id;operations.push({method:'PUT',id:e.id,body});}
 }
 for(const body of desired.values())operations.push({method:'POST',id:'',body});return operations;
}
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
                description:['SerKal',require('./watch-providers').text(entry.watchProviders,entry.note,entry.calendarLanguage==='en')].filter(Boolean).join('\n'),start:{date},end:{date:next.toISOString().slice(0,10)},transparency:'transparent',
                extendedProperties:{private:{serkal:'1',tmdbId:String(entry.tmdbId),season,episodeFrom:String(i+1),episodeTo:String(last+1)}}};
            event.extendedProperties.private.serkalSignature=signature(event);
            event.id='serkal'+sha('sha1',key(event)+':'+revision);
            desired.set(key(event),event);i=last+1;
        }
    }
    const operations=announcementPlan(entries,events,revision),seen=new Set();
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

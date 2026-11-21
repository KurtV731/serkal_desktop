const assert=require('node:assert/strict');
const {build}=require('../2 src/common/maintenance-report');
const groups=[{tmdbId:1,entries:[{title:'Show',seasonLabel:'S01',datesOriginal:['2026-01-01']}]}];
const snapshot=new Map([['1',{ok:true,tv:{name:'Show'},seasons:{'1':{ok:true,data:{episodes:[{episode_number:1,air_date:'2026-02-01'},{episode_number:2,air_date:'2026-10-20'}]}},'2':{ok:true,data:{air_date:'2023-01-01',episodes:[]}},'3':{ok:true,data:{episodes:[{episode_number:1,air_date:null}]}}}}]]);
const report=build(groups,snapshot,'2026-10-16');
assert.equal(report.filter(r=>r.kind==='missing-season').length,1);
assert.ok(report.some(r=>r.kind==='changed-episode' && r.episode===1));
assert.ok(report.some(r=>r.kind==='new-episode' && r.episode===2));
assert.equal(groups[0].entries.length,1);
const later=[{tmdbId:2,entries:[{title:'Later start',seasonLabel:'S07',datesOriginal:['2026-11-01']},{title:'Later start',seasonLabel:'S09',datesOriginal:['2026-12-01']}]}];
const seasons={};for(let n=1;n<=10;n++)seasons[n]={ok:true,data:{episodes:[{episode_number:1,air_date:n===7?'2026-11-01':n===9?'2026-12-01':'2026-10-01'}]}};
const limited=build(later,new Map([['2',{ok:true,tv:{name:'Later start'},seasons}]]),'2026-10-17');
assert.deepEqual(limited.filter(r=>r.kind==='missing-season').map(r=>r.season).sort((a,b)=>a-b),[8,10]);
assert.equal(limited.length,2); // Unchanged future episodes and S01–S06 are silent.
console.log('Maintenance report: old missing seasons, gaps, future episodes, date changes, no auto insertion: OK');

const {outlook,markNew}=require('../2 src/common/maintenance-report');
const archived={title:'Show',seasonLabel:'S01',episoden:13,start:'2026-01-01',
    datesOriginal:['2026-01-01'],activeDates:['2026-01-01']};
const tracked={tmdbId:1,entries:[archived]};
const current={ok:true,tv:{name:'Show',status:'Returning Series',seasons:[
    {season_number:1},{season_number:2,air_date:'2027-07-08',episode_count:1}
]},seasons:{1:{data:{episodes:[
    {episode_number:7,air_date:'2026-11-29'},{episode_number:14,air_date:'2026-12-06'}
]}},2:{data:{episodes:[{episode_number:1,air_date:'2027-07-08'}]}}}};
const changes=build([tracked],new Map([['1',current]]),'2026-11-21');
assert.equal(changes.find(row=>row.episode===7).kind,'dated-episode');
assert.equal(changes.find(row=>row.episode===14).kind,'new-episode');
assert.equal(changes.some(row=>row.season===2),false);
const upcoming=outlook(tracked,current,'2026-11-21');
assert.equal(upcoming.status,'planned');
assert.deepEqual(upcoming.rows.filter(row=>row.season===2).map(({kind,date})=>[kind,date]),[['season','2027-07-08']]);
const withoutDate={...current,tv:{...current.tv,seasons:[{season_number:1},{season_number:2}]} ,seasons:{}};
const indeterminate=outlook(tracked,withoutDate,'2026-11-21');
assert.equal(indeterminate.status,'planned');
assert.equal(indeterminate.rows.find(row=>row.season===2).date,'');
const annotated=markNew(upcoming.rows,indeterminate.rows);
assert.equal(annotated.find(row=>row.season===2).newlyAnnounced,true);
assert.equal(markNew(upcoming.rows,upcoming.rows).some(row=>row.newlyAnnounced),false);
assert.equal(outlook(tracked,{ok:true,tv:{status:'Returning Series',seasons:[{season_number:1}]}},'2026-11-21').status,'unknown');
assert.equal(outlook(tracked,{ok:true,tv:{status:'Ended'}},'2026-11-21').status,'ended');
assert.equal(outlook(tracked,{ok:true,tv:{status:'Canceled'}},'2026-11-21').status,'ended');
console.log('Maintenance outlook: known episodes, added dates, real extra episodes, confirmed sequel and unknown dates: OK');

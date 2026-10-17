const assert=require('node:assert/strict');
const {build}=require('../2 src/common/maintenance-report');
const groups=[{tmdbId:1,entries:[{title:'Show',seasonLabel:'S01',datesOriginal:['2026-01-01']}]}];
const snapshot=new Map([['1',{ok:true,tv:{name:'Show'},seasons:{'1':{ok:true,data:{episodes:[{episode_number:1,air_date:'2026-02-01'},{episode_number:2,air_date:'2026-10-20'}]}},'2':{ok:true,data:{air_date:'2023-01-01',episodes:[]}},'3':{ok:true,data:{episodes:[{episode_number:1,air_date:null}]}}}}]]);
const report=build(groups,snapshot,'2026-10-16');
assert.equal(report.filter(r=>r.kind==='missing-season').length,2);
assert.ok(report.some(r=>r.kind==='changed-episode' && r.episode===1));
assert.ok(report.some(r=>r.kind==='new-episode' && r.episode===2));
assert.equal(groups[0].entries.length,1);
const later=[{tmdbId:2,entries:[{title:'Later start',seasonLabel:'S07',datesOriginal:['2026-11-01']},{title:'Later start',seasonLabel:'S09',datesOriginal:['2026-12-01']}]}];
const seasons={};for(let n=1;n<=10;n++)seasons[n]={ok:true,data:{episodes:[{episode_number:1,air_date:n===7?'2026-11-01':n===9?'2026-12-01':'2026-11-15'}]}};
const limited=build(later,new Map([['2',{ok:true,tv:{name:'Later start'},seasons}]]),'2026-10-17');
assert.deepEqual(limited.filter(r=>r.kind==='missing-season').map(r=>r.season).sort((a,b)=>a-b),[8,10]);
assert.equal(limited.length,2); // Unchanged future episodes and S01–S06 are silent.
console.log('Maintenance report: old missing seasons, gaps, future episodes, date changes, no auto insertion: OK');

"use strict";
const valid=d=>/^\d{4}-\d{2}-\d{2}$/.test(d||'');
function update(group,record,today=new Date().toISOString().slice(0,10),language='de'){
 const previous=new Map();for(const e of group.entries)for(const a of e.announcements||[])previous.set(Number(a.season),a);
 const existing=new Set(group.entries.map(e=>Number(String(e.seasonLabel||e.staffelLabel).replace(/\D/g,''))));
 const floor=Math.min(...[...existing].filter(n=>n>0));const changes=[];
 for(const [number,value] of Object.entries(record.seasons||{})){
  const season=Number(number);if(season<floor)continue;
  const data=value.data||{},date=data.air_date||(data.episodes||[]).find(e=>Number(e.episode_number)===1)?.air_date||((record.tv.seasons||[]).find(s=>s.season_number===season)||{}).air_date||'';
  const old=previous.get(season);
  if(!old && (existing.has(season)||(valid(date)&&date<=today)))continue;
  if(value.ok===false&&!value.pending)continue;
  const next=valid(date)?date:'';
  if(old && old.date===next){previous.set(season,{...old,title:String(record.tv.name||old.title),language});continue;}
  const history=old?[...(old.history||[])]:[];
  history.push({capturedAt:today,from:old?old.date:'',to:next});
  const a={season,date:next,title:String(record.tv.name||group.entries[0].title||group.entries[0].titel||''),language,history};
  previous.set(season,a);changes.push({fileName:group.entries[0].fileName,kind:old?'announcement-changed':'announced-season',tmdbId:group.tmdbId,title:a.title,season,date:next,previousDate:old?old.date:''});
 }
 return {announcements:[...previous.values()],changes};
}
module.exports={update};

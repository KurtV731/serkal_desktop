'use strict';
function build(groups,snapshot,today=new Date().toISOString().slice(0,10)) {
    const items=[];
    for(const group of groups){
        const r=snapshot.get(String(group.tmdbId));if(!r || !r.ok)continue;
        const title=String(r.tv.name||group.entries[0].title||group.entries[0].titel||'');
        const existing=new Map(group.entries.map(e=>[Number(String(e.seasonLabel||e.staffelLabel).replace(/\D/g,'')),e]));
        for(const [number,season] of Object.entries(r.seasons||{})){
            const entry=existing.get(Number(number)),data=season.data||{},episodes=data.episodes||[];
            if(!entry)items.push({kind:'missing-season',tmdbId:group.tmdbId,title,season:Number(number),date:String(data.air_date||''),episodes:episodes.length});
            for(const ep of episodes){
                const date=String(ep.air_date||'');if(!/^\d{4}-\d{2}-\d{2}$/.test(date))continue;
                const old=entry && (entry.datesOriginal||entry.dates||[])[Number(ep.episode_number)-1];
                if(date>=today || (entry && (!old || old!==date)))items.push({kind:date>=today?'upcoming-episode':old?'changed-episode':'new-episode',tmdbId:group.tmdbId,title,season:Number(number),episode:Number(ep.episode_number),date});
            }
        }
    }
    return items.sort((a,b)=>(a.date||'9999').localeCompare(b.date||'9999')||a.title.localeCompare(b.title)||a.season-b.season||(a.episode||0)-(b.episode||0));
}
module.exports={build};

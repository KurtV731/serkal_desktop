'use strict';
// Portable JSON in the TXT field watchProviders. Unknown is never "unavailable".
function normalize(data, country, checkedAt=new Date().toISOString()) {
    if(!/^[A-Z]{2}$/.test(country))throw new Error('PROVIDER_COUNTRY_INVALID');
    const region=data && data.results && data.results[country];
    const offers=[];
    for(const type of ['flatrate','free','ads','rent','buy'])for(const p of region && region[type] || []) {
        if(p && Number(p.provider_id)>0 && String(p.provider_name||'').trim())
            offers.push({id:Number(p.provider_id),name:String(p.provider_name).trim(),type});
    }
    const link=String(region && region.link || '');
    return {country,checkedAt,source:'JustWatch via TMDB',link:/^https:\/\/www\.themoviedb\.org\//.test(link)?link:'',offers};
}
function manual(note){const match=String(note||'').match(/^(?:Anbieter|Provider)\s*:\s*(.*)$/im);return match?match[1].trim():'';}
function text(value,note,english=false){
    const own=manual(note);if(own)return (english?'Provider (manual): ':'Anbieter (manuell): ')+own;
    if(!value)return '';
    const types=english?{flatrate:'subscription',free:'free',ads:'ads',rent:'rent',buy:'buy'}:{flatrate:'Abo',free:'kostenlos',ads:'Werbung',rent:'Leihe',buy:'Kauf'};
    const offers=(value.offers||[]).map(p=>p.name+' ('+types[p.type]+')');
    return (english?'Providers':'Anbieter')+' ['+value.country+']: '+(offers.join(', ')||(english?'No offers reported':'Keine Angebote gemeldet'))+
        ' · '+(english?'Checked: ':'Geprüft: ')+String(value.checkedAt||'').slice(0,10)+(english?' · Series availability; individual seasons may differ':' · Serienangebot; einzelne Staffeln können abweichen')+' · JustWatch via TMDB'+(value.link?'\n'+value.link:'');
}
function parse(raw){try{return JSON.parse(raw);}catch(_){return null;}}
module.exports={normalize,manual,text,parse};

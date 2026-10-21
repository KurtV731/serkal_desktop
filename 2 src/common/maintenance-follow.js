'use strict';
function season(e){return Number(String(e.seasonLabel||e.staffelLabel||'').replace(/\D/g,''));}
function eligible(entries,next){const last=Math.max(...entries.map(season));return Number(next)>last && entries.some(e=>season(e)===last && Number(e.seen??e.buttonPressed)===1);}
module.exports={eligible};

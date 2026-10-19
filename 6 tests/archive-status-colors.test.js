'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('2 src/frontend/index.html','utf8');
class Clock extends Date {constructor(...args){super(...(args.length?args:['2026-10-19T12:00:00']));}}
const context={Date:Clock,isFinite};vm.createContext(context);
for(const [start,end] of [['deriveStatus_','statusToLabel_'],['statusValueFromAny_','statusToCss_'],['archiveStatusPresentation_','renderArchivList']])vm.runInContext(source.slice(source.indexOf('function '+start+'('),source.indexOf('function '+end+'(')),context);
const colors={1:'#f2c94c',2:'#2367b6',3:'#bf293d',4:'#207b40'};
for(const theme of ['light','dark'])for(const n of [1,2,3,4]){
 const css=new Map();const e={style:{setProperty:(k,v,p)=>css.set(k,{v,p})},setAttribute(){}};
 context.applyArchiveStatusPresentation_(e,n);
 assert.equal(css.get('background').v,colors[n],theme+' state '+n);
 assert.equal(css.get('background').p,'important');assert.equal(css.get('color').p,'important');
 assert.equal(css.get('width').v,'18px');assert.equal(e.textContent,n===1?'':'✓');
}
for(const [start,end,expected] of [['2026-11-01','2026-11-10',1],['2026-10-01','2026-11-10',2],['2026-09-01','2026-09-10',3]]){
 const e={startDate:start,endDate:end,buttonPressed:0,seen:0,status:expected};assert.equal(context.deriveStatus_(e),expected);
 if(expected!==1){context.toggleWatched_(e);assert.equal(e.status,4);assert.equal(e.seen,1);}
}
const e={startDate:'2026-09-01',endDate:'2026-09-10',buttonPressed:0,seen:0,status:3,note:'Keep',tmdbId:42};
for(let n=0;n<50;n++){assert.equal(context.toggleWatched_(e).seen,1);assert.equal(e.status,4);assert.equal(context.toggleWatched_(e).seen,0);assert.equal(e.status,3);}
assert.equal(e.note,'Keep');assert.equal(e.tmdbId,42);
assert.match(source,/applyArchiveStatusPresentation_\(btnSeen,st\)/);assert.match(source,/applyArchiveStatusPresentation_\(symSpan,st\)/);
console.log('Four archive status colors survive theme styling; schedule, blue-to-green and repeated red/green toggles passed');

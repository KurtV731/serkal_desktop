'use strict';
const assert=require('node:assert/strict'),protocol=require('../2 src/common/archive-calendar-copy');
const entry={title:'Serie',year:2026,seasonLabel:'S01',tmdbId:42,activeDates:['2026-10-12','2026-10-19']},revision='12345678-1234-1234-1234-123456789abc';
const initial=protocol.plan([entry],[],revision,2026);assert.equal(initial.length,2);assert.equal(initial[0].body.summary,'Serie (2026) S01E01');
assert.equal(initial[0].body.end.date,'2026-10-13');
const existing=initial.map(o=>o.body);assert.deepEqual(protocol.plan([entry],existing,revision,2026),[]);
const shifted={...entry,activeDates:['2026-10-13','2026-10-20']};assert(protocol.plan([shifted],existing,revision,2026).every(o=>o.method==='PUT'));
assert(protocol.plan([],existing,revision,2026).every(o=>o.method==='DELETE'));
const manual=JSON.parse(JSON.stringify(existing));manual[0].summary='My own title';assert.throws(()=>protocol.plan([shifted],manual,revision,2026),/COPY_CALENDAR_PROTECTED/);
const grouped=protocol.plan([{...entry,activeDates:['2026-10-12','2026-10-12']}],[],revision,2026);assert.equal(grouped.length,1);assert.equal(grouped[0].body.summary,'Serie (2026) S01E01–E02');
const unrelated={id:'personal',summary:'Birthday',start:{date:'2026-10-12'}};assert.deepEqual(protocol.plan([], [unrelated],revision,2026),[]);
const providerEntry={...entry,watchProviders:{country:'DE',checkedAt:'2026-10-16',offers:[{id:8,name:'Netflix',type:'flatrate'}]}};
const providerUpdate=protocol.plan([providerEntry],existing,revision,2026);
assert.equal(providerUpdate[0].method,'PUT');assert.match(providerUpdate[0].body.description,/Netflix \(Abo\)/);
const own=protocol.plan([{...providerEntry,note:'Provider: Paramount+'}],existing,revision,2026);
assert.match(own[0].body.description,/Paramount\+/);assert.doesNotMatch(own[0].body.description,/Netflix/);
const providerEvents=providerUpdate.map(op=>({...op.body,id:op.id}));assert.deepEqual(protocol.plan([providerEntry],providerEvents,revision,2026),[]);
const past={...entry,activeDates:['2025-10-12']},pastEvents=protocol.plan([past],[],revision,2025).map(o=>o.body);assert.deepEqual(protocol.plan([past],pastEvents,revision,2026),[]);
console.log('archive calendar copy: create, update, delete, manual protection, grouped episodes and past seasons passed');

// A German archive filename must not leak into an English calendar when the English title is stored.
for(const [de,en] of [["Dark Winds - Der Wind des Bösen","Dark Winds"],["Der Herr der Ringe Die Ringe der Macht","The Lord of the Rings: The Rings of Power"],["Dark Matter - Der Zeitenläufer","Dark Matter"]]){
 const entry={tmdbId:900,title:de,year:2026,seasonLabel:"S01",activeDates:["2027-01-01"],calendarLanguage:"en"};
 const before=require('../2 src/common/archive-calendar-copy').plan([entry],[],"r1",2026)[0].body;
 const next=require('../2 src/common/archive-calendar-copy').plan([{...entry,titleEN:en}],[before],"r2",2026);
 assert.equal(next.length,1);assert.equal(next[0].method,"PUT");assert.equal(next[0].body.summary,en+" (2026) S01E01");
}
console.log("Calendar titles: stored English translation repairs German filename titles without duplicates");

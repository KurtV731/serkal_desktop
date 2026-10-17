'use strict';
const assert=require('node:assert/strict'),{update}=require('../2 src/common/season-announcements'),calendar=require('../2 src/common/archive-calendar-copy');
const group={tmdbId:42,entries:[{fileName:'Show.txt',title:'Show',seasonLabel:'S07'}]},record={tv:{name:'Show'},seasons:{1:{ok:true,data:{air_date:'2020-01-01'}},8:{ok:true,data:{air_date:'2027-01-01'}},9:{pending:true,ok:false}}};
const first=update(group,record,'2026-10-17','en');assert.deepEqual(first.changes.map(c=>c.kind),['announced-season','announced-season']);assert.equal(first.announcements.length,2);
const saved={...group,entries:[{...group.entries[0],announcements:first.announcements}]};
assert.equal(update(saved,record,'2026-10-18','en').changes.length,0);
const shifted=structuredClone(record);shifted.seasons[8].data.air_date='2027-01-07';
const changed=update(saved,shifted,'2026-11-01','en');assert.equal(changed.changes[0].previousDate,'2027-01-01');assert.equal(changed.announcements[0].history.length,2);
const entry={...saved.entries[0],tmdbId:42};const created=calendar.plan([entry],[],'r1',2026);assert.equal(created.length,1);const event=created[0].body;assert.match(event.description,/Recorded on 2026-10-17/);
assert.deepEqual(calendar.plan([entry],[event],'r2',2026),[]);
assert.deepEqual(calendar.plan([],[event],'r3',2026),[]); // Series removed, permanent card remains.
assert.deepEqual(calendar.plan([entry],[{id:event.id,status:'cancelled'}],'r4',2026),[]); // Manual deletion respected.
const revised={...entry,announcements:changed.announcements};const ops=calendar.plan([revised],[event],'r5',2026);assert.equal(ops[0].method,'PUT');assert.equal(ops[0].body.start.date,'2027-01-07');assert.match(ops[0].body.description,/from 2027-01-01/);
assert.deepEqual(calendar.plan([revised],ops.map(o=>({...o.body,id:o.id})),'r6',2028),[]); // Past announcement retained.
const undated=structuredClone(shifted);undated.seasons[8].data.air_date=null;const withdrawn=update({...group,entries:[{...entry,announcements:changed.announcements}]},undated,'2026-12-01','en');assert.equal(withdrawn.changes[0].date,'');assert.equal(withdrawn.announcements[0].history.length,3);
console.log('season announcements: tracked range, deduplication, history, permanent cards, manual deletion and shifted dates passed');

const withdrawnEntry={...entry,announcements:withdrawn.announcements};const withdrawnOps=calendar.plan([withdrawnEntry],ops.map(o=>({...o.body,id:o.id})),"r7",2026);assert.equal(withdrawnOps[0].body.start.date,"2027-01-07");assert.match(withdrawnOps[0].body.description,/date unknown/);

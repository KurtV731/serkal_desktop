const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

// Reuse the isolated archive fixture, with a controllable calendar boundary.
let fixture = fs.readFileSync('6 tests/archive-smoke.test.js', 'utf8');
fixture = fixture.slice(0, fixture.indexOf('const api = context.__archiveTest;'));
fixture = fixture.replace('globalThis.__archiveTest={archiveInsert_,archiveLoad_};',
    'globalThis.__archiveTest={archiveInsert_,archiveLoad_,archiveSaveChanges_,setSync(fn){maintenanceSyncCalendar_=fn;}};');
const harness = { require, console, process, setTimeout, clearTimeout, URL };
vm.createContext(harness);
vm.runInContext(fixture + '\nglobalThis.api=context.__archiveTest;', harness);
const api = harness.api;

(async () => {
    api.archiveInsert_({title:'Reacher', year:'2022', seasonNumber:4, tmdbId:108978,
        episodeCount:3, episodeDates:['2026-08-12','2026-08-12','2026-08-19']});
    const entry = api.archiveLoad_().daten.entries[0];
    const calls = [];
    api.setSync(async op => { calls.push(Array.from(op.payload.termindaten)); return {ok:true}; });
    const save = note => api.archiveSaveChanges_({one:{fileName:entry.fileName, staffelLabel:'S04', note}});
    for (const [note, date] of [['Offset +1D','2026-08-13'],['Offset +2D','2026-08-14'],['Offset -2D','2026-08-10'],['','2026-08-12']]) {
        assert.equal((await save(note)).ok, true);
        assert.equal(api.archiveLoad_().daten.entries[0].startDate, date);
        assert.equal(calls.at(-1)[0], date);
    }
    const before = calls.length;
    await save('Just a note');
    assert.equal(calls.length, before, 'free text does not touch calendar');
    api.setSync(async () => { throw new Error('Calendar unavailable'); });
    assert.equal((await save('Offset +2D')).ok, false);
    assert.equal(api.archiveLoad_().daten.entries[0].startDate, '2026-08-12', 'failed sync must not report archive success');
    api.setSync(async () => ({ok:true, protected:true}));
    assert.equal((await save('Offset +1D')).ok, false);
    assert.equal(api.archiveLoad_().daten.entries[0].startDate, '2026-08-12');
    const ui = fs.readFileSync('2 src/frontend/index.html','utf8');
    assert.equal((ui.match(/FILTER_DONE: '✅'/g)||[]).length, 2);
    console.log('SERKAL repeated offset/calendar synchronization: OK');
})().catch(error => { console.error(error); process.exitCode=1; });

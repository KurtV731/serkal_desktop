const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

let fixture = fs.readFileSync('6 tests/archive-smoke.test.js', 'utf8');
fixture = fixture.slice(0, fixture.indexOf('const api = context.__archiveTest;'));
fixture = fixture.replace('globalThis.__archiveTest={archiveInsert_,archiveLoad_};',
    'globalThis.__archiveTest={archiveResolveDriveFolder_,archiveFolderPath_,archiveLoad_,writeSettings_};');
const harness = {require, console, process, setTimeout, clearTimeout, URL};
vm.createContext(harness);
vm.runInContext(fixture + '\nglobalThis.api=context.__archiveTest;', harness);
const api = harness.api;
const de = 'G:\\Meine Ablage\\Serkal_Haupt\\Serkal-Archivdaten';
const en = 'G:\\My Drive\\Serkal_Haupt\\Serkal-Archivdaten';
const oldExists = fs.existsSync;
const oldStat = fs.statSync;
try {
    let directories = new Set([en]);
    fs.existsSync = p => /^[a-z]:[\\/]/i.test(p) ? directories.has(p) : oldExists(p);
    fs.statSync = p => {
        if (!/^[a-z]:[\\/]/i.test(p)) return oldStat(p);
        if (!directories.has(p)) throw new Error('missing');
        return {isDirectory:() => true};
    };
    assert.equal(api.archiveResolveDriveFolder_(de), en);
    api.writeSettings_({archive:{folderPath:de}});
    assert.equal(api.archiveFolderPath_(), en, 'all archive operations use the resolver');
    directories = new Set([de]);
    assert.equal(api.archiveResolveDriveFolder_(en), de);
    directories = new Set([de,en]);
    assert.equal(api.archiveResolveDriveFolder_(de), de, 'existing configured path wins');
    directories.clear();
    assert.equal(api.archiveResolveDriveFolder_(de), de, 'missing archive remains missing');
    assert.equal(api.archiveResolveDriveFolder_('G:\\Backup\\Meine Ablage\\Archive'),
        'G:\\Backup\\Meine Ablage\\Archive', 'only root label changes');
    directories.add(en);
    fs.statSync = p => p === en ? {isDirectory:() => false} : oldStat(p);
    assert.equal(api.archiveResolveDriveFolder_(de), de, 'a file is not an archive folder');
} finally {
    fs.existsSync = oldExists;
    fs.statSync = oldStat;
}
console.log('SERKAL localized Drive archive root: OK');

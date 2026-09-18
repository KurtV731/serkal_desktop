const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const flow = require(path.join(__dirname, '..', '2 src', 'common', 'entry-flow.js'));
const html = fs.readFileSync(path.join(__dirname, '..', '2 src', 'frontend', 'index.html'), 'utf8');
const backend = fs.readFileSync(path.join(__dirname, '..', '2 src', 'backend', 'main.js'), 'utf8');

const partial = {
  ok: true,
  partial: true,
  archiveSaved: true,
  calendarMode: 'google',
  calendar: { ok: false, code: 'GOOGLE_CALENDAR_UNAVAILABLE' }
};

assert.equal(flow.outcome(partial), 'archiveCalendarPartial');
assert.match(flow.outcomeText('de', partial), /im SerKal-Archiv gespeichert/);
assert.match(flow.outcomeText('de', partial), /Archiveintrag ist sicher gespeichert/);
assert.match(flow.outcomeText('en', partial), /saved in the SerKal archive/);
assert.match(flow.outcomeText('en', partial), /archive entry is safely stored/);
assert.doesNotMatch(flow.outcomeText('en', partial), /gespeichert|Kalender konnte/);

const googleSuccess = {
  ok: true,
  calendarMode: 'google',
  calendar: { ok: true, created: 2, updated: 1 }
};
assert.equal(flow.outcome(googleSuccess), 'archiveGoogle');
assert.match(flow.outcomeText('de', googleSuccess), /2 neu, 1 aktualisiert/);
assert.match(flow.outcomeText('en', googleSuccess), /2 new, 1 updated/);

assert.equal(flow.outcome({ ok: false }), 'archiveFailed');
assert.equal(flow.outcome({ ok: true, calendarMode: 'none' }), 'archiveOnly');
assert.equal(flow.outcome({ ok: true, calendarMode: 'ics' }), 'archiveIcs');

assert.match(html, /PV_EPISODES:\s*"Episodes in this season"/);
assert.match(html, /BTN_INSERT:\s*'📅 Insert into archive'/);
assert.match(html, /BTN_SAVE_DOCK:\s*'💾 Save edits'/);
assert.match(html, /script src="\.\.\/common\/entry-flow\.js"/);
assert.match(backend, /partial:true[\s\S]*archiveSaved:true[\s\S]*calendarMode:'google'/);
assert.doesNotMatch(backend, /message:'Archiv wurde gespeichert\./);

console.log('SERKAL entry flow DE/EN test: OK');

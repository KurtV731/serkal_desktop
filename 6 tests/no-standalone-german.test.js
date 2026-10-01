const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function withoutComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
}

function stringLiterals(source) {
  const values = [];
  const re = /(['"])((?:\\.|(?!\1)[^\\\r\n])*)\1/g;
  let match;
  while ((match = re.exec(source))) values.push({ value:match[2], offset:match.index });
  return values;
}

const german = /[äöüÄÖÜß]|\b(?:Abbrechen|Änderung|Anmeldung|Archivdatei|Archivordner|ausgewählt|Bitte|Datei|Eintrag|Einrichtung|eingerichtet|Einstellungen|Entwickler|Fehler|Fenster|Funktion|geladen|gespeichert|Hilfe|ist|Kalender|Keine|konnte|leer|Löschen|noch|nicht|Notiz|öffnen|Prüfung|Schließen|Staffel|Suche|Treffer|Übernahme|ungültig|Verbindung|verworfen|vorhanden|Wartung|Zurück|zuerst)\b/i;
const technicalAllow = /^(?:de|de-DE|SerKal|Archiv|SERKAL|ENTWICKLUNG|WARTUNG|FEHLER|fehler|auswertung|uebernahme|ende|warten|geplant|läuft|geschaut|suche|notiz|Eintrag)$/;

function audit(file, removeRanges) {
  let source = fs.readFileSync(path.resolve(file), 'utf8');
  for (const [start, end] of removeRanges || []) {
    const a = source.indexOf(start);
    const b = source.indexOf(end, a + start.length);
    assert.ok(a >= 0 && b > a, `catalogue markers missing in ${file}`);
    source = source.slice(0, a) + ' '.repeat(b + end.length - a) + source.slice(b + end.length);
  }
  source = withoutComments(source);
  return stringLiterals(source)
    .filter(item => german.test(item.value) && !technicalAllow.test(item.value) && !/^https?:\/\//.test(item.value))
    .map(item => `${file}:${source.slice(0, item.offset).split('\n').length}: ${item.value}`);
}

const findings = [
  ...audit('2 src/backend/main.js'),
  ...audit('2 src/frontend/index.html', [['var SETUP_I18N={', 'function setupT_'], ['const I18N = {', 'let LANG =']]),
  ...audit('2 src/common/preload.js'),
  ...audit('2 src/common/entry-flow.js', [['var TEXT = {', 'function language']])
];

let htmlMarkup = fs.readFileSync(path.resolve('2 src/frontend/index.html'), 'utf8')
  .replace(/<!--([\s\S]*?)-->/g, '')
  .replace(/<script\b[\s\S]*?<\/script>/gi, '')
  .replace(/<style\b[\s\S]*?<\/style>/gi, '');
for (const match of htmlMarkup.matchAll(/>([^<>]+)</g)) {
  const value = match[1].replace(/\s+/g, ' ').trim();
  if (value && german.test(value) && !technicalAllow.test(value)) {
    findings.push(`2 src/frontend/index.html:markup: ${value}`);
  }
}

assert.deepEqual(findings, [], `Standalone German user text found:\n${findings.join('\n')}`);
console.log('SERKAL standalone German text audit: OK');

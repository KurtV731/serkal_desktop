const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, '2 src/frontend/index.html'), 'utf8');
const backend = fs.readFileSync(path.join(root, '2 src/backend/main.js'), 'utf8');
const backendCatalog = require(path.join(root, '2 src/common/backend-i18n.js'));

function objectBetween(source, start, end) {
  const a = source.indexOf(start);
  const b = source.indexOf(end, a + start.length);
  assert.ok(a >= 0 && b > a, `missing catalogue boundary ${start}`);
  const literal = source.slice(a + start.length, b).replace(/;\s*$/, '');
  return vm.runInNewContext('(' + literal + ')');
}

const ui = objectBetween(html, 'const I18N = ', 'let LANG =');
const setup = objectBetween(html, 'var SETUP_I18N=', 'function setupT_');

function complete(name, catalogue) {
  assert.ok(catalogue.de && catalogue.en, `${name} needs de and en catalogues`);
  assert.deepEqual(Object.keys(catalogue.de).sort(), Object.keys(catalogue.en).sort(), `${name} DE/EN keys differ`);
  for (const key of Object.keys(catalogue.de)) {
    assert.ok(String(catalogue.de[key]).trim(), `${name}.${key}.de is empty`);
    assert.ok(String(catalogue.en[key]).trim(), `${name}.${key}.en is empty`);
  }
}

complete('UI', ui);
complete('setup', setup);
for (const [key, pair] of Object.entries(backendCatalog.PAIRS)) {
  assert.equal(pair.length, 2, `backend.${key} needs a DE/EN pair`);
  assert.ok(String(pair[0]).trim() && String(pair[1]).trim(), `backend.${key} contains an empty text`);
}

for (const match of html.matchAll(/\bt\(\s*['"]([A-Z][A-Z0-9_]*)['"]/g)) {
  assert.ok(Object.hasOwn(ui.de, match[1]), `unknown UI language key: ${match[1]}`);
}
for (const match of html.matchAll(/\bsetupT_\(\s*['"]([A-Z][A-Z0-9_]*)['"]/g)) {
  assert.ok(Object.hasOwn(setup.de, match[1]), `unknown setup language key: ${match[1]}`);
}
for (const match of backend.matchAll(/\bbt_\(\s*['"]([A-Z][A-Z0-9_]*)['"]/g)) {
  assert.ok(Object.hasOwn(backendCatalog.PAIRS, match[1]), `unknown backend language key: ${match[1]}`);
}
for (const match of backend.matchAll(/\bbridgeText_\(\s*['"]([A-Z][A-Z0-9_]*)['"]/g)) {
  assert.ok(Object.hasOwn(backendCatalog.PAIRS, match[1]), `unknown renderer-bridge language key: ${match[1]}`);
}

console.log('SERKAL DE/EN catalog completeness test: OK');

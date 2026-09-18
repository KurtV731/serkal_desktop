const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, '2 src', 'frontend', 'index.html'), 'utf8');
const preload = fs.readFileSync(path.join(root, '2 src', 'common', 'preload.js'), 'utf8');
const backend = fs.readFileSync(path.join(root, '2 src', 'backend', 'main.js'), 'utf8');

// Both first-run choices expose one switch, backed by SerKal's single persisted language.
assert.match(html, /id="skSetupLangDe"/);
assert.match(html, /id="skSetupLangEn"/);
assert.match(html, /localStorage\.setItem\('serkal_lang',next\)/);
assert.match(html, /window\.serkalSetLanguage = function\(lang\)/);
assert.match(html, /setLang_\(lang, true\)/);

// The same value reaches every external language consumer.
assert.match(html, /window\.serkal\.help\.tmdb\(lang\)/);
assert.match(html, /window\.serkal\.help\.tmdbCreate\(setupLang_\(\)\)/);
assert.match(html, /window\.serkal\.tmdb\.testKey\(key,setupLang_\(\)\)/);
assert.match(html, /window\.serkal\.calendar\.open\(settings, getLang_\(\)\)/);
assert.match(preload, /tmdbCreate:\(lang\).*serkal:help:tmdbCreate/);
assert.match(preload, /testKey:\(apiKey,lang\).*serkal:tmdb:testKey/);
assert.match(preload, /open:\(settings,lang\).*serkal:calendar:open/);
assert.match(backend, /language=" \+ encodeURIComponent\(locale\)/);
assert.match(backend, /url\.searchParams\.set\("hl", serkalLanguage_\(lang\)\)/);
assert.match(backend, /TMDB connection works\./);

// The setup itself must remain bilingual, including TMDB and calendar stages.
assert.match(html, /First enter your personal free TMDB API key/);
assert.match(html, /Choose what SerKal should do with your dates/);
assert.match(html, /Please review everything carefully/);
assert.match(html, /The TMDB API key could not be checked/);

console.log('SERKAL global DE/EN language test: OK');

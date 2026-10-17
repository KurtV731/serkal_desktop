const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const titles = require(path.join(__dirname, '..', '2 src', 'common', 'tmdb-title.js'));
const html = fs.readFileSync(path.join(__dirname, '..', '2 src', 'frontend', 'index.html'), 'utf8');

const koreanOriginal = {
  name:'나를 충전해줘',
  original_name:'나를 충전해줘',
  original_language:'ko',
  translations:{ translations:[
    { iso_639_1:'de', iso_3166_1:'DE', data:{ name:'Lade mein Herz auf' } },
    { iso_639_1:'en', iso_3166_1:'US', data:{ name:'Take Charge of My Heart' } }
  ] }
};
let result = titles.resolve(koreanOriginal, koreanOriginal, { name:'나를 충전해줘' }, 'de');
assert.equal(result.de, 'Lade mein Herz auf');
assert.equal(result.en, 'Take Charge of My Heart');
assert.equal(result.original, '나를 충전해줘');

const withRegionalAliases = {
  name:'나를 충전해줘',
  original_name:'나를 충전해줘',
  original_language:'ko',
  alternative_titles:{ results:[
    { iso_3166_1:'DE', title:'Dynamite Kiss' },
    { iso_3166_1:'US', title:'Take Charge of My Heart' }
  ] }
};
result = titles.resolve(withRegionalAliases, withRegionalAliases, null, 'de');
assert.equal(result.de, 'Dynamite Kiss');
assert.equal(result.en, 'Take Charge of My Heart');

const noGermanTitle = {
  name:'나를 충전해줘',
  original_name:'나를 충전해줘',
  original_language:'ko'
};
const englishDetails = {
  name:'Take Charge of My Heart',
  original_name:'나를 충전해줘',
  original_language:'ko'
};
result = titles.resolve(noGermanTitle, englishDetails, null, 'de');
assert.equal(result.de, 'Take Charge of My Heart');
assert.equal(result.en, 'Take Charge of My Heart');

const germanOnly = {
  name:'Deutscher Anzeigename', original_name:'Original series', original_language:'ko',
  translations:{translations:[{iso_639_1:'de', iso_3166_1:'DE', data:{name:'Deutscher Anzeigename'}}]}
};
result = titles.resolve(germanOnly, {name:'Original series', original_name:'Original series', original_language:'ko'}, null, 'en');
assert.equal(result.de, 'Deutscher Anzeigename');
assert.equal(result.en, 'Original series');
result = titles.resolve({translations:germanOnly.translations}, null, null, 'en');
assert.equal(result.en, '—');

// Reproducer for TMDB 287527: a regional French title must not win over
// an English original, even if an alternative translation is mislabeled.
const testaments={name:'The Testaments',original_name:'The Testaments',original_language:'en',
  alternative_titles:{results:[{iso_3166_1:'CA',title:'Les Testaments'}]},
  translations:{translations:[{iso_639_1:'en',iso_3166_1:'CA',data:{name:'Les Testaments'}}]}};
result=titles.resolve(null,testaments,{name:'The Testaments'},'en');
assert.equal(result.en,'The Testaments');
const translated={name:'English localized name',original_name:'원제',original_language:'ko',
  alternative_titles:{results:[{iso_3166_1:'CA',title:'Titre français'}]}};
assert.equal(titles.resolve(null,translated,null,'en').en,'English localized name');

assert.match(html, /inpTitle\.value\s*=\s*localizedTitleFromAny_\(state\.currentPreview/);

console.log('SERKAL TMDB localized title selection test: OK');


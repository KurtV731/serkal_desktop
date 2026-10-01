const assert = require('node:assert/strict');
const path = require('node:path');
const titles = require(path.join(__dirname, '..', '2 src', 'common', 'tmdb-title.js'));

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

console.log('SERKAL TMDB localized title selection test: OK');

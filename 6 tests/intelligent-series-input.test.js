const assert = require('node:assert/strict');
const fs = require('node:fs');
const backend = fs.readFileSync('2 src/backend/main.js', 'utf8');
const preload = fs.readFileSync('2 src/common/preload.js', 'utf8');
const html = fs.readFileSync('2 src/frontend/index.html', 'utf8');
assert.match(backend, /async function tmdbSuggestTv_/);
assert.match(backend, /results\.length >= 6/);
assert.match(backend, /serkal:tmdb:suggestTv/);
assert.match(preload, /suggestTv:\(query,lang\).*serkal:tmdb:suggestTv/);
assert.match(html, /id="titleSuggestions"/);
assert.match(html, /ARIA_TITLE_SUGGESTIONS/);
assert.match(html, /data-tmdb-id/);
assert.match(html, /selectedTmdbId \? \('#' \+ String\(selectedTmdbId\)\)/);
assert.match(html, /state\.lastQuery = q;/);
assert.match(html, /scheduleTitleSuggestions_/);
assert.match(html, /chooseTitleSuggestion_/);
assert.match(html, /ev\.key === 'ArrowDown'/);
assert.match(html, /removeAttribute\('data-tmdb-id'\)/);
assert.match(html, /resolvedTmdbId.*data-tmdb-id/s);
assert.match(html, /function closeTitleSuggestions_\(\) \{\s*titleSuggestionToken_\+\+/);
console.log('Intelligente Serieneingabe: Strukturtest OK');

const vm = require('node:vm');
const suggestionCode = backend.slice(backend.indexOf('async function tmdbSuggestTv_'), backend.indexOf('\nfunction calendarPad2_', backend.indexOf('async function tmdbSuggestTv_')));
async function suggest(query, responses) {
  const calls = [];
  const context = { tmdbLang_:lang => lang, yearFromDate_:date => String(date || '').slice(0, 4),
    tmdbRequest_:async (_path, params) => { calls.push(params); return responses(params); } };
  vm.createContext(context);
  vm.runInContext(suggestionCode, context);
  return { result:await context.tmdbSuggestTv_(query, 'de'), calls };
}
(async () => {
  const old = Array.from({length:20}, (_, i) => ({id:i + 1, name:'City ' + i, first_air_date:'1990-01-01'}));
  const city = await suggest('city', params => ({ok:true, data:{total_pages:2, results:params.page === '1' ? old : [{id:252107, name:'Star City', first_air_date:'2026-01-01'}]}}));
  assert.ok(city.result.results.some(row => row.id === 252107), 'Neue Serie von Seite 2 vor Begrenzung berücksichtigen');
  assert.equal(city.result.results.length, 6);
  const yellow = await suggest('yellow stone', params => ({ok:true, data:{results:params.query === 'yellow stone' ? [{id:19355, name:'Legendäre Wildnis', original_name:'Yellowstone', first_air_date:'2009-01-01'}] : [{id:73586, name:'Yellowstone', first_air_date:'2018-01-01'}, {id:19355, name:'Legendäre Wildnis', original_name:'Yellowstone', first_air_date:'2009-01-01'}]}}));
  assert.equal(yellow.result.results[0].id, 73586);
  assert.equal(yellow.result.results.length, 2, 'Doppelte TMDB-ID entfernen');
  assert.equal(yellow.calls[1].query, 'yellowstone');
  const exact = await suggest('Yellowstone', () => ({ok:true, data:{results:[{id:2,name:'Yellowstone Extras',first_air_date:'2026-01-01'},{id:1,name:'Yellowstone',first_air_date:'2018-01-01'}]}}));
  assert.equal(exact.result.results[0].id, 1);
  const empty = await suggest('x', () => { throw Error('Keine Anfrage bei einem Buchstaben'); });
  assert.equal(empty.calls.length, 0);
  const chooseCode = html.slice(html.indexOf('function chooseTitleSuggestion_'), html.indexOf('\nfunction moveTitleSuggestion_', html.indexOf('function chooseTitleSuggestion_')));
  let searches = 0;
  const attrs = {};
  const ui = {state:{busy:false}, titleSuggestionItems_:[{name:'Star City',id:252107,year:2026}],
    inpTitle:{setAttribute:(key,value)=>attrs[key]=value,focus:()=>{}}, document:{getElementById:()=>({value:''})},
    closeTitleSuggestions_:()=>{},setSearchMode_:()=>{},doSearch:()=>{searches++;}};
  vm.createContext(ui); vm.runInContext(chooseCode, ui); ui.chooseTitleSuggestion_(0);
  assert.equal(searches, 1); assert.equal(attrs['data-tmdb-id'], '252107');
  ui.state.busy = true; ui.chooseTitleSuggestion_(0); assert.equal(searches, 1);
  console.log('Intelligente Serieneingabe: Sortierung, Leerzeichen und direkte Suche OK');
})().catch(error => { console.error(error); process.exitCode = 1; });

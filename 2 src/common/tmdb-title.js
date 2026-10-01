'use strict';

function clean_(value) {
  return String(value || '').trim();
}

function same_(left, right) {
  const a = clean_(left).normalize('NFKC').toLocaleLowerCase();
  const b = clean_(right).normalize('NFKC').toLocaleLowerCase();
  return Boolean(a && b && a === b);
}

function appended_(details, key) {
  const value = details && details[key];
  if (!value || typeof value !== 'object') return [];
  if (Array.isArray(value.translations)) return value.translations;
  if (Array.isArray(value.results)) return value.results;
  return [];
}

function translationName_(detailsList, language, countries) {
  const wanted = String(language || '').toLowerCase();
  const countryOrder = Array.isArray(countries) ? countries : [];
  const all = [];
  for (const details of detailsList) {
    for (const item of appended_(details, 'translations')) {
      if (String(item && item.iso_639_1 || '').toLowerCase() !== wanted) continue;
      const name = clean_(item && item.data && item.data.name);
      if (name) all.push({ name, country:String(item.iso_3166_1 || '').toUpperCase() });
    }
  }
  all.sort((a, b) => {
    const ai = countryOrder.indexOf(a.country);
    const bi = countryOrder.indexOf(b.country);
    return (ai < 0 ? 999 : ai) - (bi < 0 ? 999 : bi);
  });
  return all.length ? all[0].name : '';
}

function alternativeName_(detailsList, countries) {
  const wanted = Array.isArray(countries) ? countries : [];
  for (const country of wanted) {
    for (const details of detailsList) {
      for (const item of appended_(details, 'alternative_titles')) {
        if (String(item && item.iso_3166_1 || '').toUpperCase() !== country) continue;
        const name = clean_(item && (item.title || item.name));
        if (name) return name;
      }
    }
  }
  return '';
}

function localizedDetailName_(details, language) {
  const name = clean_(details && details.name);
  const original = clean_(details && details.original_name);
  const originalLanguage = String(details && details.original_language || '').toLowerCase();
  if (!name) return '';
  if (!same_(name, original) || originalLanguage === language) return name;
  return '';
}

function resolve(detDE, detEN, fallback, searchLanguage) {
  const details = [detDE, detEN].filter(Boolean);
  const originalName = clean_((detDE && detDE.original_name) || (detEN && detEN.original_name) || (fallback && fallback.original_name));
  const fallbackName = clean_(fallback && fallback.name);
  const searched = String(searchLanguage || '').toLowerCase().startsWith('en') ? 'en' : 'de';

  const de = translationName_(details, 'de', ['DE', 'AT', 'CH']) ||
    alternativeName_(details, ['DE', 'AT', 'CH']) ||
    localizedDetailName_(detDE, 'de') ||
    (searched === 'de' && !same_(fallbackName, originalName) ? fallbackName : '');

  const en = translationName_(details, 'en', ['US', 'GB', 'AU', 'CA']) ||
    alternativeName_(details, ['US', 'GB', 'AU', 'CA']) ||
    localizedDetailName_(detEN, 'en') ||
    (searched === 'en' && !same_(fallbackName, originalName) ? fallbackName : '');

  const readableFallback = en || de || fallbackName || originalName || '—';
  return {
    de:de || readableFallback,
    en:en || de || fallbackName || originalName || '—',
    original:originalName
  };
}

module.exports = { resolve };

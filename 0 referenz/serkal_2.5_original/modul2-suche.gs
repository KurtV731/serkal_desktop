/*
  Modul2-suche
  Version: SK25_B01
  Stand: Aus aktiver Basis Code_Analysebutton_FanalDrive_2026-04-27.gs.txt extrahiert
/*
 ABHÄNGIGKEITEN:
 - benötigt: Modul 03 (TMDB)
 - liefert an: Modul 01 (UI API)

 STATUS:
 - stabil (ALT aktiv)
 - noch nicht zerlegt

  Zweck dieses Moduls:
  - Such-Einstieg aus UI/API
  - Such-Wrapper
  - bestehende ALT-Monsterfunktion als lauffähiger Sicherheitsanker
  - TMDB-Titel-/ID-/Jahr-/Staffel-Suchpfade, soweit sie derzeit in der Monsterfunktion gebündelt sind
  - YEARFILTER1: Jahresfeld arbeitet wieder robust mit String-/Zahlwerten
  - SPLIT1: bisherige Monsterfunktion in Hauptschritte plus benannte Teilfunktionen zerlegt
  - SPLIT2: aktiver Suchkern ohne ALT-Logikname; Trefferbewertung eigener Schritt; Titelsuche weiter in Lade-/Filter-/Detailphase getrennt
  - SPLIT3_SEASONCHECK1: reine Durchreicher entfernt; Staffel-Override erzeugt keine künstlichen Fantasiestaffeln mehr

  WICHTIG:
  - Diese Datei ist eine Modul-Arbeitsfassung.
  - Fachlogik wurde nur strukturell umgebaut, nicht fachlich gekürzt.
  - Die öffentliche Suchfunktion bleibt als kompatibler Einstieg erhalten; reine ALT-/Neu-Durchreicher wurden entfernt.
  - Ab SPLIT1 gilt: keine neuen anonymen/verschachtelten Teilfunktionen im Suchkern.
  - Ab SPLIT2 gilt zusätzlich: keine neuen inneren Funktionen; Callbacks möglichst als benannte Helfer oder einfache Schleifen.

  ID-Schema:
  M.GG.NNN
  M   = Modulnummer
  GG  = Gruppe im Modul
  NNN = laufende Funktionsnummer

  Gruppen in Modul 02:
  00 = UI/API-Übergabe Suche
  01 = Such-Einstieg / Wrapper / ALT-Sicherheitsanker
  02 = Titelsuche / Trefferaufbereitung / Legacy-Vorschläge
  03 = ID-Suche / ID-Erkennung
  04 = Jahr-Filter / Datumsvergleich
  05 = Staffel-Handling / Staffel-Eingaben

  Externe Abhängigkeiten, die absichtlich NICHT in diesem Modul stehen:
  - Modul 03 TMDB: tmdbSearchTv_, tmdbTvDetails_, fetchSeasonDetailsFromTMDB, tmdbApiFetchJson_, holeTmdbApiKey_, tmdbLang_
  - Modul 04 Staffel/Termine: analysiereStaffelDaten_, serkalPickSeasonWithDates_, pickSeasonEpisodeCount_
  - Modul 08 Logging: LOG_INFO, LOG_ERROR
  - Modul 98 Helfer: normalizeLang_, normTitle_, yearFromDate_, pad2_, skErr_
*/

/**
 * @id 2.00.001
 * @funktion apiSucheSerieKomplett
 * @modul 2 Suche
 * @gruppe UI-API / Suche
 * @eingabe titel:String, lang:String, opt:Object
 * @ausgabe Object { anzahl:Number, treffer:Array, daten:Array }
 * @zweck Übergabe von UI-Suchparametern an den Suchkern.
 * @status aktiv
 * @loeschung nein
 */
// const SK_ID = "2.00.001";
function apiSucheSerieKomplett(titel, lang, opt) {
  const o = opt || {};
  const res = serkalSucheSerieKomplett(titel, lang, {
    maxResults: 3,
    exactOnlyIfExists: true,
    yearOverride: (o.yearOverride || o.year || ''),
    seasonOverride: (o.seasonOverride || o.season || '')
  });

  try {
    LOG_INFO('UI', 'apiSucheSerieKomplett("' + titel + '", "' + lang + '") -> ' + (res && res.anzahl));
  } catch (_e) { }

  return res;
}

/**
 * @id 2.01.001
 * @funktion serkalSucheSerieKomplett
 * @modul 2 Suche
 * @gruppe Suche / Einstieg
 * @eingabe titel:String, lang:String, opt:Object
 * @ausgabe Object { anzahl:Number, treffer:Array, daten:Array }
 * @zweck Zentraler Einstieg für die interne Suchlogik.
 * @status aktiv
 * @loeschung nein
 */
// const SK_ID = "2.01.001";
function serkalSucheSerieKomplett(titel, lang, opt) {
  return serkalSucheSerieKern_(titel, lang, opt);
}

/**
 * @id 2.05.001
 * @funktion serkalParseSeasonOverride_
 * @modul 2 Suche
 * @gruppe Staffel-Handling
 * @eingabe v:String
 * @ausgabe Number|null
 * @zweck Normalisiert Staffel-Eingaben wie S01, S1, 01 oder 1 zu einer Staffelnummer.
 * @status aktiv
 * @hinweis Aus serkalSucheSerieKomplett_ALT herausgezogen; Logik unverändert.
 * @loeschung nein
 */
// const SK_ID = "2.05.001";
function serkalParseSeasonOverride_(v) {
  if (!v) return null;
  const s = String(v).trim();
  const m = s.match(/^(?:S)?\s*0*([1-9]\d*)$/i);
  if (!m) return null;
  const n = Number(m[1]);
  return (isFinite(n) && n > 0) ? n : null;
}


/**
 * @id 2.05.002
 * @funktion serkalSeasonExistsInList_
 * @modul 2 Suche
 * @gruppe Staffel-Handling
 * @eingabe seasons:Array, seasonNumber:Number
 * @ausgabe Boolean
 * @zweck Prüft, ob eine gewünschte Staffel in der TMDB-seasons-Liste tatsächlich vorhanden ist.
 * @status aktiv
 * @hinweis SPLIT3_SEASONCHECK1: Ein Staffel-Override darf keine künstliche S99/S05 erzeugen.
 * @loeschung nein
 */
// const SK_ID = "2.05.002";
function serkalSeasonExistsInList_(seasons, seasonNumber) {
  const sn = Number(seasonNumber || 0);
  if (!isFinite(sn) || sn <= 0) return true;
  const arr = Array.isArray(seasons) ? seasons : [];
  for (let i = 0; i < arr.length; i++) {
    const s = arr[i] || {};
    const n = Number(s.season_number != null ? s.season_number : s.seasonNumber);
    if (isFinite(n) && n === sn) return true;
  }
  return false;
}

/**
 * @id 2.05.003
 * @funktion serkalPruefeStaffelOverride_
 * @modul 2 Suche
 * @gruppe Staffel-Handling
 * @eingabe seasons:Array, seasonOverride:Number|null, kontext:String
 * @ausgabe Object { ok:Boolean, seasonOverride:Number|null, reason:String }
 * @zweck Prüft eine gewünschte Staffel vor der Detailauswahl, damit nicht vorhandene Staffeln keine Platzhalter erzeugen.
 * @status aktiv
 * @hinweis Wenn keine Staffel vorgegeben ist, bleibt die automatische Staffelwahl unverändert.
 * @loeschung nein
 */
// const SK_ID = "2.05.003";
function serkalPruefeStaffelOverride_(seasons, seasonOverride, kontext) {
  const sn = Number(seasonOverride || 0);
  if (!isFinite(sn) || sn <= 0) return { ok: true, seasonOverride: null, reason: '' };
  if (serkalSeasonExistsInList_(seasons, sn)) return { ok: true, seasonOverride: sn, reason: '' };

  try {
    LOG_INFO('SUCHE', 'Staffel-Override verworfen: S' + pad2_(sn) + ' existiert bei TMDB nicht', { kontext: String(kontext || '') });
  } catch (_e) { }

  return { ok: false, seasonOverride: sn, reason: 'SEASON_NOT_FOUND' };
}

/**
 * @id 2.03.001
 * @funktion serkalParseIdMode_
 * @modul 2 Suche
 * @gruppe ID-Suche
 * @eingabe q:String
 * @ausgabe Object|null { id:Number, season:Number|null }
 * @zweck Erkennt direkte TMDB-ID-Eingaben mit oder ohne #, optional mit Staffelzusatz.
 * @status aktiv
 * @hinweis Aus serkalSucheSerieKomplett_ALT herausgezogen; Logik unverändert.
 * @loeschung nein
 */
// const SK_ID = "2.03.001";
function serkalParseIdMode_(q) {
  const s = String(q || '').trim();
  const m = s.match(/^(?:#\s*)?(\d{5,8})\s*(?:[,;\s]+(?:S)?\s*0*([1-9]\d*))?\s*$/i);
  if (!m) return null;
  const id = Number(m[1]);
  if (!isFinite(id) || id <= 0) return null;
  const sn = m[2] ? Number(m[2]) : null;
  return { id: id, season: (sn && isFinite(sn) && sn > 0) ? sn : null };
}

/**
 * @id 2.04.001
 * @funktion serkalDateInt_
 * @modul 2 Suche
 * @gruppe Jahr-Filter / Datumsvergleich
 * @eingabe s:String im Format yyyy-mm-dd
 * @ausgabe Number
 * @zweck Wandelt ISO-Datum in vergleichbare Zahl yyyymmdd um; ungültig wird 0.
 * @status aktiv
 * @hinweis Aus serkalSucheSerieKomplett_ALT herausgezogen; Logik unverändert.
 * @loeschung nein
 */
// const SK_ID = "2.04.001";
function serkalDateInt_(s) {
  const m = String(s || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return 0;
  return Number(m[1] + m[2] + m[3]);
}

/**
 * @id 2.04.002
 * @funktion serkalParseYearOverride_
 * @modul 2 Suche
 * @gruppe Jahr-Filter / Datumsvergleich
 * @eingabe v:String|Number
 * @ausgabe String
 * @zweck Normalisiert eine Jahresvorgabe aus UI/API auf exakt vier Ziffern.
 * @status aktiv
 * @hinweis YEARFILTER1: vermeidet String/Zahl-Vergleichsfehler im bisherigen Filterpfad.
 * @loeschung nein
 */
// const SK_ID = "2.04.002";
function serkalParseYearOverride_(v) {
  const s = String(v == null ? '' : v).trim();
  const m = s.match(/^(\d{4})$/);
  return m ? m[1] : '';
}

/**
 * @id 2.04.003
 * @funktion serkalYearFromAnyDate_
 * @modul 2 Suche
 * @gruppe Jahr-Filter / Datumsvergleich
 * @eingabe s:String
 * @ausgabe String
 * @zweck Liefert das Jahr als String aus ISO-Datum oder ähnlichem Datumstext.
 * @status aktiv
 * @hinweis Bewusst lokal in Modul 2, damit der Jahrfilter nicht von Zahl/String-Details externer Helfer abhängt.
 * @loeschung nein
 */
// const SK_ID = "2.04.003";
function serkalYearFromAnyDate_(s) {
  const txt = String(s || '').trim();
  const m = txt.match(/^(\d{4})/);
  return m ? m[1] : '';
}

/**
 * @id 2.04.004
 * @funktion serkalYearMatchesCandidate_
 * @modul 2 Suche
 * @gruppe Jahr-Filter / Datumsvergleich
 * @eingabe candidate:Object, yearWanted:String
 * @ausgabe Boolean
 * @zweck Prüft, ob ein TMDB-Treffer zur eingegebenen Jahreszahl passt.
 * @status aktiv
 * @hinweis Nutzt zuerst first_air_date aus der Trefferliste; Detaildaten werden später zusätzlich nochmals geprüft.
 * @loeschung nein
 */
// const SK_ID = "2.04.004";
function serkalYearMatchesCandidate_(candidate, yearWanted) {
  const y = serkalParseYearOverride_(yearWanted);
  if (!y) return true;
  const h = candidate || {};
  const values = [
    h.first_air_date,
    h.release_date,
    h.year,
    h.jahr,
    h.start
  ];
  for (let i = 0; i < values.length; i++) {
    const cy = serkalYearFromAnyDate_(values[i]);
    if (cy && cy === y) return true;
  }
  return false;
}

/**
 * @id 2.04.005
 * @funktion serkalYearMatchesDetails_
 * @modul 2 Suche
 * @gruppe Jahr-Filter / Datumsvergleich
 * @eingabe detDE:Object, detEN:Object, fallback:Object, yearWanted:String
 * @ausgabe Boolean
 * @zweck Prüft die Jahresvorgabe nach dem Laden der Detaildaten erneut und robuster.
 * @status aktiv
 * @hinweis Verhindert falsche Treffer, falls die Suchliste unvollständige oder lokalisierte Datumswerte liefert.
 * @loeschung nein
 */
// const SK_ID = "2.04.005";
function serkalYearMatchesDetails_(detDE, detEN, fallback, yearWanted) {
  const y = serkalParseYearOverride_(yearWanted);
  if (!y) return true;
  const f = fallback || {};
  const values = [
    detDE && detDE.first_air_date,
    detEN && detEN.first_air_date,
    f && f.first_air_date,
    f && f.release_date,
    f && f.year,
    f && f.jahr,
    f && f.start
  ];
  for (let i = 0; i < values.length; i++) {
    const cy = serkalYearFromAnyDate_(values[i]);
    if (cy && cy === y) return true;
  }
  return false;
}


/**
 * @id 2.01.002
 * @funktion serkalSucheSerieKern_
 * @modul 2 Suche
 * @gruppe Suche / Kernablauf
 * @eingabe titel:String, lang:String, opt:Object
 * @ausgabe Object { anzahl:Number, treffer:Array, daten:Array }
 * @zweck Neuer klarer Suchkern: Eingabe erkennen, Auftrag bauen, Suche ausführen, Treffer bewerten, Antwort bauen.
 * @status aktiv
 * @hinweis SPLIT2: Diese Funktion ist bewusst nur Orchestrator; keine verschachtelten Funktionen, keine Detail-TMDB-Logik.
 * @loeschung nein
 */
// const SK_ID = "2.01.002";
function serkalSucheSerieKern_(titel, lang, opt) {
  const eingabe = serkalSucheEingabeErkennen_(titel, lang, opt);
  if (!eingabe.ok) return serkalSucheLeereAntwort_();

  const auftrag = serkalSucheAuftragBauen_(eingabe);
  const rohTreffer = serkalSucheAusfuehren_(auftrag);
  const bewerteteTreffer = serkalSucheTrefferBewerten_(rohTreffer, auftrag);
  return serkalSucheAntwortBauen_(bewerteteTreffer, auftrag);
}

/**
 * @id 2.01.010
 * @funktion serkalSucheEingabeErkennen_
 * @modul 2 Suche
 * @gruppe Suche / Einstieg
 * @eingabe titel:String, lang:String, opt:Object
 * @ausgabe Object
 * @zweck Normalisiert alle UI/API-Eingaben für den Suchablauf.
 * @status aktiv
 * @hinweis Schritt 1 der entkoppelten Suche; enthält keine TMDB-Abfrage.
 * @loeschung nein
 */
// const SK_ID = "2.01.010";
function serkalSucheEingabeErkennen_(titel, lang, opt) {
  const qRaw = String(titel || '').trim();
  if (!qRaw) return { ok: false, reason: 'EMPTY_QUERY' };

  const options = opt || {};
  const maxResults = Math.max(1, Number(options.maxResults || 3));
  const exactOnlyIfExists = (options.exactOnlyIfExists !== false);
  const yearOverride = serkalParseYearOverride_(options.yearOverride || '');
  const seasonOverrideRaw = String(options.seasonOverride || '').trim();
  const searchLang = normalizeLang_(lang);

  const todayInt = serkalDateInt_(
    Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd')
  );

  return {
    ok: true,
    qRaw: qRaw,
    qNorm: normTitle_(qRaw),
    lang: lang,
    searchLang: searchLang,
    options: options,
    maxResults: maxResults,
    exactOnlyIfExists: exactOnlyIfExists,
    yearOverride: yearOverride,
    seasonOverrideRaw: seasonOverrideRaw,
    seasonOverride: serkalParseSeasonOverride_(seasonOverrideRaw),
    idMode: serkalParseIdMode_(qRaw),
    todayInt: todayInt
  };
}

/**
 * @id 2.01.020
 * @funktion serkalSucheAuftragBauen_
 * @modul 2 Suche
 * @gruppe Suche / Auftrag
 * @eingabe eingabe:Object
 * @ausgabe Object
 * @zweck Baut aus der erkannten Eingabe einen klaren Suchauftrag für ID- oder Titelsuche.
 * @status aktiv
 * @hinweis Schritt 2 der entkoppelten Suche; entscheidet nur den Pfad, führt ihn aber nicht aus.
 * @loeschung nein
 */
// const SK_ID = "2.01.020";
function serkalSucheAuftragBauen_(eingabe) {
  const e = eingabe || {};
  const mode = e.idMode ? 'ID' : 'TITLE';
  return {
    mode: mode,
    qRaw: e.qRaw,
    qNorm: e.qNorm,
    searchLang: e.searchLang,
    maxResults: e.maxResults,
    exactOnlyIfExists: e.exactOnlyIfExists,
    yearOverride: e.yearOverride,
    seasonOverrideRaw: e.seasonOverrideRaw,
    seasonOverride: e.seasonOverride,
    idMode: e.idMode,
    todayInt: e.todayInt
  };
}

/**
 * @id 2.01.030
 * @funktion serkalSucheAusfuehren_
 * @modul 2 Suche
 * @gruppe Suche / Ausführung
 * @eingabe auftrag:Object
 * @ausgabe Object|Array
 * @zweck Führt den gewählten Suchpfad aus und liefert Rohdaten für die Antwortaufbereitung.
 * @status aktiv
 * @hinweis Schritt 3 der entkoppelten Suche; ID- und Titelsuche sind getrennte benannte Funktionen.
 * @loeschung nein
 */
// const SK_ID = "2.01.030";
function serkalSucheAusfuehren_(auftrag) {
  const a = auftrag || {};
  if (a.mode === 'ID') return serkalSucheFuehreIdSucheAus_(a);
  return serkalSucheFuehreTitelSucheAus_(a);
}

/**
 * @id 2.01.040
 * @funktion serkalSucheAntwortBauen_
 * @modul 2 Suche
 * @gruppe Suche / Antwort
 * @eingabe bewerteteTreffer:Object|Array, auftrag:Object
 * @ausgabe Object { anzahl:Number, treffer:Array, daten:Array }
 * @zweck Baut die UI-kompatible Suchantwort aus bereits bewerteten Treffern.
 * @status aktiv
 * @hinweis SPLIT2: Sortierung/Bewertung liegt nicht mehr hier, sondern in serkalSucheTrefferBewerten_.
 * @loeschung nein
 */
// const SK_ID = "2.01.040";
function serkalSucheAntwortBauen_(bewerteteTreffer, auftrag) {
  const a = auftrag || {};

  if (a.mode === 'ID') {
    if (bewerteteTreffer && bewerteteTreffer.id) return { anzahl: 1, treffer: [bewerteteTreffer], daten: [bewerteteTreffer] };
    return serkalSucheLeereAntwort_();
  }

  const tmp = Array.isArray(bewerteteTreffer) ? bewerteteTreffer : [];
  const out = [];
  const maxResults = Math.max(1, Number(a.maxResults || 3));

  for (let i = 0; i < tmp.length && out.length < maxResults; i++) {
    const x = tmp[i];
    if (!x) continue;
    delete x._rankGroup;
    delete x._rankKey;
    out.push(x);
  }

  return { anzahl: out.length, treffer: out, daten: out };
}

/**
 * @id 2.01.041
 * @funktion serkalSucheLeereAntwort_
 * @modul 2 Suche
 * @gruppe Suche / Antwort
 * @eingabe -
 * @ausgabe Object { anzahl:Number, treffer:Array, daten:Array }
 * @zweck Liefert die einheitliche leere Suchantwort.
 * @status aktiv
 * @loeschung nein
 */
// const SK_ID = "2.01.041";
function serkalSucheLeereAntwort_() {
  return { anzahl: 0, treffer: [], daten: [] };
}

/**
 * @id 2.03.010
 * @funktion serkalSucheFuehreIdSucheAus_
 * @modul 2 Suche
 * @gruppe ID-Suche
 * @eingabe auftrag:Object
 * @ausgabe Object
 * @zweck Führt den direkten TMDB-ID-Suchpfad aus.
 * @status aktiv
 * @hinweis Fachlogik aus der bisherigen Monsterfunktion herausgezogen; Rückgabeformat bleibt gleich.
 * @loeschung nein
 */
// const SK_ID = "2.03.010";
function serkalSucheFuehreIdSucheAus_(auftrag) {
  const a = auftrag || {};
  const idMode = a.idMode || {};
  const id = idMode.id;

  const detDE = tmdbTvDetails_(id, 'de');
  const detEN = tmdbTvDetails_(id, 'en');

  const seasons = serkalSucheWaehleSeasons_(detDE, detEN);
  const snOverride = idMode.season || a.seasonOverride || null;
  const seasonCheck = serkalPruefeStaffelOverride_(seasons, snOverride, 'ID ' + id);
  if (!seasonCheck.ok) return null;

  const pick = serkalPickSeasonWithDates_(id, seasons, seasonCheck.seasonOverride, a.searchLang);

  return serkalSucheBuildTrefferObjekt_(id, null, detDE, detEN, pick, a);
}

/**
 * @id 2.02.010
 * @funktion serkalSucheFuehreTitelSucheAus_
 * @modul 2 Suche
 * @gruppe Titelsuche
 * @eingabe auftrag:Object
 * @ausgabe Array<Object>
 * @zweck Führt den TMDB-Titelpfad aus, ohne Detailphasen in einer Monsterfunktion zu bündeln.
 * @status aktiv
 * @hinweis SPLIT2: Titelsuche besteht aus Laden, Vorfiltern/Jahrfilter und Detailaufbereitung.
 * @loeschung nein
 */
// const SK_ID = "2.02.010";
function serkalSucheFuehreTitelSucheAus_(auftrag) {
  const a = auftrag || {};
  const tmdbHits = serkalSucheLadeTmdbTitelTreffer_(a);
  const kandidaten = serkalSucheBereiteTitelKandidatenVor_(tmdbHits, a);
  return serkalSucheLadeTitelDetailTreffer_(kandidaten, a);
}

/**
 * @id 2.02.012
 * @funktion serkalSucheLadeTmdbTitelTreffer_
 * @modul 2 Suche
 * @gruppe Titelsuche
 * @eingabe auftrag:Object
 * @ausgabe Array<Object>
 * @zweck Lädt die rohe TMDB-Trefferliste für eine Titelsuche.
 * @status aktiv
 * @hinweis Keine Bewertung, kein Detail-Load, keine UI-Antwort; nur die externe Suchabfrage.
 * @loeschung nein
 */
// const SK_ID = "2.02.012";
function serkalSucheLadeTmdbTitelTreffer_(auftrag) {
  const a = auftrag || {};
  const searchRes = tmdbSearchTv_(a.qRaw, a.searchLang);
  return (searchRes && Array.isArray(searchRes.results)) ? searchRes.results : [];
}

/**
 * @id 2.02.013
 * @funktion serkalSucheBereiteTitelKandidatenVor_
 * @modul 2 Suche
 * @gruppe Titelsuche
 * @eingabe hits:Array, auftrag:Object
 * @ausgabe Array<Object>
 * @zweck Wendet Titel- und Jahresfilter auf die rohe TMDB-Trefferliste an.
 * @status aktiv
 * @hinweis Vorbereitung vor teuren Detailabfragen; verhindert unnötige TMDB-Detail-Loads.
 * @loeschung nein
 */
// const SK_ID = "2.02.013";
function serkalSucheBereiteTitelKandidatenVor_(hits, auftrag) {
  const a = auftrag || {};
  let kandidaten = serkalSucheFilterTitelTreffer_(hits, a);

  if (a.yearOverride) {
    const beforeYearFilter = kandidaten.length;
    kandidaten = serkalSucheFilterNachJahr_(kandidaten, a.yearOverride);
    try {
      LOG_INFO('SUCHE', 'Jahrfilter Trefferliste ' + a.yearOverride + ': ' + beforeYearFilter + ' -> ' + kandidaten.length);
    } catch (_e) { }
  }

  return kandidaten;
}

/**
 * @id 2.02.014
 * @funktion serkalSucheLadeTitelDetailTreffer_
 * @modul 2 Suche
 * @gruppe Titelsuche
 * @eingabe hits:Array, auftrag:Object
 * @ausgabe Array<Object>
 * @zweck Lädt Detaildaten für vorbereitete Titelkandidaten und baut daraus Trefferobjekte.
 * @status aktiv
 * @hinweis Enthält bewusst nur den Detail-Load-Teil der Titelsuche.
 * @loeschung nein
 */
// const SK_ID = "2.02.014";
function serkalSucheLadeTitelDetailTreffer_(hits, auftrag) {
  const a = auftrag || {};
  const arr = Array.isArray(hits) ? hits : [];
  const candidateLimit = Math.max(6, Number(a.maxResults || 3) * 4);
  const tmp = [];

  for (let i = 0; i < arr.length && i < candidateLimit; i++) {
    const h = arr[i];
    const id = h && h.id;
    if (!id) continue;

    const detDE = tmdbTvDetails_(id, 'de');
    const detEN = tmdbTvDetails_(id, 'en');

    if (!serkalYearMatchesDetails_(detDE, detEN, h, a.yearOverride)) {
      try { LOG_INFO('SUCHE', 'Jahrfilter Detail verwirft ID ' + id + ' für Jahr ' + a.yearOverride); } catch (_e2) { }
      continue;
    }

    const seasons = serkalSucheWaehleSeasons_(detDE, detEN);
    const seasonCheck = serkalPruefeStaffelOverride_(seasons, a.seasonOverride, 'Titel ' + id);
    if (!seasonCheck.ok) continue;

    const pick = serkalPickSeasonWithDates_(id, seasons, seasonCheck.seasonOverride, a.searchLang);
    const one = serkalSucheBuildTrefferObjekt_(id, h, detDE, detEN, pick, a);
    tmp.push(one);
  }

  return tmp;
}

/**
 * @id 2.02.011
 * @funktion serkalSucheFilterTitelTreffer_
 * @modul 2 Suche
 * @gruppe Titelsuche
 * @eingabe hits:Array, auftrag:Object
 * @ausgabe Array
 * @zweck Wendet die bisherige Exakt-/Beginnt-mit-Logik auf TMDB-Treffer an.
 * @status aktiv
 * @hinweis SPLIT1: noch keine neue intelligente Suche, nur alte Logik sauber ausgelagert.
 * @loeschung nein
 */
// const SK_ID = "2.02.011";
function serkalSucheFilterTitelTreffer_(hits, auftrag) {
  const arr = Array.isArray(hits) ? hits : [];
  const a = auftrag || {};
  if (!a.exactOnlyIfExists) return arr;

  const exact = [];
  for (let i = 0; i < arr.length; i++) {
    const h = arr[i];
    if (normTitle_(h && h.name) === a.qNorm) exact.push(h);
  }
  if (exact.length > 0) return exact;

  const begins = [];
  for (let j = 0; j < arr.length; j++) {
    const h2 = arr[j];
    const n = normTitle_(h2 && h2.name);
    if (n === a.qNorm || n.indexOf(a.qNorm + ' ') === 0) begins.push(h2);
  }
  return begins.length > 0 ? begins : arr;
}

/**
 * @id 2.04.010
 * @funktion serkalSucheFilterNachJahr_
 * @modul 2 Suche
 * @gruppe Jahr-Filter / Datumsvergleich
 * @eingabe hits:Array, yearOverride:String
 * @ausgabe Array
 * @zweck Filtert TMDB-Suchtreffer nach Jahresvorgabe.
 * @status aktiv
 * @hinweis Nutzt YEARFILTER1-Helfer, aber ohne verschachtelte Callback-Funktion.
 * @loeschung nein
 */
// const SK_ID = "2.04.010";
function serkalSucheFilterNachJahr_(hits, yearOverride) {
  const arr = Array.isArray(hits) ? hits : [];
  const out = [];
  for (let i = 0; i < arr.length; i++) {
    if (serkalYearMatchesCandidate_(arr[i], yearOverride)) out.push(arr[i]);
  }
  return out;
}

/**
 * @id 2.02.020
 * @funktion serkalSucheBuildTrefferObjekt_
 * @modul 2 Suche
 * @gruppe Trefferaufbereitung
 * @eingabe id:Number, fallback:Object, detDE:Object, detEN:Object, pick:Object, auftrag:Object
 * @ausgabe Object
 * @zweck Baut ein UI-kompatibles Trefferobjekt aus Details, Staffelwahl und Suchauftrag.
 * @status aktiv
 * @hinweis Gemeinsamer Baustein für ID- und Titelsuche.
 * @loeschung nein
 */
// const SK_ID = "2.02.020";
function serkalSucheBuildTrefferObjekt_(id, fallback, detDE, detEN, pick, auftrag) {
  const h = fallback || {};
  const p = pick || {};
  const a = auftrag || {};
  const seasonNumber = p.seasonNumber;
  const seasonStart = p.seasonStart;
  const episodeDates = p.episodeDates || [];
  const seasons = serkalSucheWaehleSeasons_(detDE, detEN);
  const episodeCount = p.episodeCount || pickSeasonEpisodeCount_(seasons, seasonNumber);
  const rank = serkalSucheBerechneTerminRang_(seasonStart, episodeDates, a.todayInt);

  return {
    _rankGroup: rank.group,
    _rankKey: rank.key,
    id: id,
    name: (detDE && detDE.name) || (detEN && detEN.name) || (h && h.name) || '—',
    year: yearFromDate_((detDE && detDE.first_air_date) || (detEN && detEN.first_air_date) || (h && h.first_air_date) || ''),
    posterPath: (detDE && detDE.poster_path) || (detEN && detEN.poster_path) || (h && h.poster_path) || '',
    seasonNumber: (seasonNumber != null ? seasonNumber : ''),
    seasonStart: seasonStart,
    episodeCount: episodeCount,
    episodeDates: episodeDates,
    dateFlag: p.dateFlag || '',
    placeholderStart: p.placeholderStart || '',
    futureSeasonsCount: p.futureSeasonsCount || 0,
    futureSeasons: Array.isArray(p.futureSeasons) ? p.futureSeasons : [],
    maxSeasonNumber: p.maxSeasonNumber || seasonNumber,
    seasonLabel: seasonNumber ? ('S' + pad2_(seasonNumber)) : '', 
    start: seasonStart,
    episodes: episodeCount,
    termindaten: episodeDates,
    descDE: serkalBuildSearchDesc_(detDE),
    descEN: serkalBuildSearchDesc_(detEN)
  };
}

/**
 * @id 2.05.010
 * @funktion serkalSucheWaehleSeasons_
 * @modul 2 Suche
 * @gruppe Staffel-Handling
 * @eingabe detDE:Object, detEN:Object
 * @ausgabe Array
 * @zweck Wählt die verfügbare seasons-Liste aus deutschen oder englischen Detaildaten.
 * @status aktiv
 * @loeschung nein
 */
// const SK_ID = "2.05.010";
function serkalSucheWaehleSeasons_(detDE, detEN) {
  if (detDE && Array.isArray(detDE.seasons) && detDE.seasons.length) return detDE.seasons;
  if (detEN && Array.isArray(detEN.seasons) && detEN.seasons.length) return detEN.seasons;
  return [];
}

/**
 * @id 2.02.030
 * @funktion serkalSucheBerechneTerminRang_
 * @modul 2 Suche
 * @gruppe Trefferbewertung
 * @eingabe seasonStart:String, episodeDates:Array, todayInt:Number
 * @ausgabe Object { group:Number, key:Number }
 * @zweck Berechnet die bisherige Termin-Rangfolge: zukünftige Termine zuerst, sonst jüngere Alttermine.
 * @status aktiv
 * @hinweis SPLIT1: alte Bewertungslogik nur ausgelagert; intelligente Titelsuche folgt später separat.
 * @loeschung nein
 */
// const SK_ID = "2.02.030";
function serkalSucheBerechneTerminRang_(seasonStart, episodeDates, todayInt) {
  let nextFuture = 0;
  let lastSeen = 0;

  if (Array.isArray(episodeDates) && episodeDates.length) {
    for (let k = 0; k < episodeDates.length; k++) {
      const di = serkalDateInt_(episodeDates[k]);
      if (!di) continue;
      if (di >= todayInt) {
        if (!nextFuture || di < nextFuture) nextFuture = di;
      }
      if (di > lastSeen) lastSeen = di;
    }
  }

  const seasonStartInt = serkalDateInt_(seasonStart);
  if (!nextFuture && seasonStartInt && seasonStartInt >= todayInt) nextFuture = seasonStartInt;
  if (!lastSeen && seasonStartInt) lastSeen = seasonStartInt;

  return {
    group: nextFuture ? 0 : 1,
    key: nextFuture ? nextFuture : (99999999 - lastSeen)
  };
}

/**
 * @id 2.02.033
 * @funktion serkalSucheTrefferBewerten_
 * @modul 2 Suche
 * @gruppe Trefferbewertung
 * @eingabe rohTreffer:Object|Array, auftrag:Object
 * @ausgabe Object|Array
 * @zweck Bewertet und sortiert Treffer zentral, bevor die UI-Antwort gebaut wird.
 * @status aktiv
 * @hinweis ID-Suche bleibt Einzelobjekt; Titelsuche wird nach vorhandener Ranglogik sortiert.
 * @loeschung nein
 */
// const SK_ID = "2.02.033";
function serkalSucheTrefferBewerten_(rohTreffer, auftrag) {
  const a = auftrag || {};
  if (a.mode === 'ID') return rohTreffer;

  const tmp = Array.isArray(rohTreffer) ? rohTreffer : [];
  return serkalSucheSortiereTreffer_(tmp);
}

/**
 * @id 2.02.031
 * @funktion serkalSucheSortiereTreffer_
 * @modul 2 Suche
 * @gruppe Trefferbewertung
 * @eingabe tmp:Array<Object>
 * @ausgabe Array<Object>
 * @zweck Sortiert Treffer nach bisheriger Rangfolge.
 * @status aktiv
 * @hinweis Enthält als einzige Stelle den notwendigen sort-Callback der Laufzeitbibliothek.
 * @loeschung nein
 */
// const SK_ID = "2.02.031";
function serkalSucheSortiereTreffer_(tmp) {
  if (!Array.isArray(tmp)) return [];
  tmp.sort(serkalSucheVergleicheTreffer_);
  return tmp;
}

/**
 * @id 2.02.032
 * @funktion serkalSucheVergleicheTreffer_
 * @modul 2 Suche
 * @gruppe Trefferbewertung
 * @eingabe a:Object, b:Object
 * @ausgabe Number
 * @zweck Vergleichsfunktion für Treffer-Sortierung.
 * @status aktiv
 * @hinweis Benannte externe Funktion statt anonymer Inline-Funktion.
 * @loeschung nein
 */
// const SK_ID = "2.02.032";
function serkalSucheVergleicheTreffer_(a, b) {
  const aa = a || {};
  const bb = b || {};
  if (aa._rankGroup !== bb._rankGroup) return aa._rankGroup - bb._rankGroup;
  if (aa._rankKey !== bb._rankKey) return aa._rankKey - bb._rankKey;
  return (bb.year || 0) - (aa.year || 0);
}


/**
 * @id 2.02.001
 * @funktion serkalBuildSearchDesc_
 * @modul 2 Suche
 * @gruppe Suche / Beschreibung
 * @eingabe det:Object
 * @ausgabe String
 * @zweck Holt im Suchpfad den Beschreibungstext aus TMDB-Detaildaten ohne frühes N.A.
 * @status aktiv
 * @loeschung nein
 */
// const SK_ID = "2.02.001";
function serkalBuildSearchDesc_(det) {
  var txt = String(
    (det && (det.desc || det.overview || '')) || ''
  ).trim();
  return txt;
}

/**
 * @id 2.02.050
 * @funktion ermittleAlleVorschlaege
 * @modul 2 Suche
 * @gruppe Suche / Legacy-Vorschläge
 * @eingabe titel:String, lang:String
 * @ausgabe Array<Object>
 * @zweck Legacy-Vorschlagsfunktion für TMDB-Titelsuche; bleibt vorerst erhalten.
 * @status aktiv
 * @loeschung nein
 */
// const SK_ID = "2.02.050";
/**   Versuchweise stilllegung
function ermittleAlleVorschlaege(titel, lang) {
  try {
    var q = String(titel || '').trim();
    if (!q) return [];

    var apiKey = holeTmdbApiKey_();
    var url = 'https://api.themoviedb.org/3/search/tv?api_key=' + encodeURIComponent(apiKey) +
      '&language=' + encodeURIComponent(tmdbLang_(lang)) + '&query=' + encodeURIComponent(q);

    var json = tmdbApiFetchJson_(url);
    var arr = (json && Array.isArray(json.results)) ? json.results : [];

    LOG_INFO('TMDB', 'ermittleAlleVorschlaege("' + q.toLowerCase() + '") ? ' + arr.length + ' Vorschläge.');

    var out = [];
    for (var i = 0; i < arr.length; i++) {
      out.push(serkalLegacyVorschlagZuUiObjekt_(arr[i]));
    }
    return out;
  } catch (e) {
    LOG_ERROR('TMDB', 'ermittleAlleVorschlaege Fehler: ' + skErr_(e));
    return [];
  }
}
*/
/**
 * @id 2.02.051
 * @funktion serkalLegacyVorschlagZuUiObjekt_
 * @modul 2 Suche
 * @gruppe Suche / Legacy-Vorschläge
 * @eingabe r:Object
 * @ausgabe Object
 * @zweck Wandelt einen TMDB-Vorschlag in das bisherige UI-kompatible Legacy-Format um.
 * @status aktiv
 * @hinweis Aus ermittleAlleVorschlaege ausgelagert, damit dort keine innere Funktion/Callback-Logik mehr steht.
 * @loeschung nein
 */
// const SK_ID = "2.02.051";
function serkalLegacyVorschlagZuUiObjekt_(r) {
  var row = r || {};
  var posterPath = row.poster_path ? String(row.poster_path) : '';
  return {
    tmdbId: row.id,
    titel: row.name || '',
    original: row.original_name || '',
    jahr: (row.first_air_date || '').slice(0, 4) || '',
    start: row.first_air_date || '',
    descDE: String(row.overview || '').trim(),
    descEN: '',
    desc: String(row.overview || '').trim(),
    posterPath: posterPath,
    posterUrl: posterPath ? ('https://image.tmdb.org/t/p/w342' + posterPath) : ''
  };
}


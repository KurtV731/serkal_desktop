/**
 * @id 1.00.003
 * @funktion serkalOeffneDialog_
 * @modul 1 Start / UI-Dialog
 * @gruppe Start / UI-Dialog
 * @zweck Funktions-ID automatisch vergeben; Zweck anhand Funktionsname/Modul später bei Bedarf verfeinern.
 * @status aktiv
 * @loeschung nein
 */
function serkalOeffneDialog_() {
  try {

    // var size = serkalDialogSize_();  // alte Config-Logik (derzeit deaktiviert)
    var size = { width: SERKAL_DIALOG_BREITE, height: SERKAL_DIALOG_HOEHE };

    var html = HtmlService.createHtmlOutputFromFile(SERKAL_UI_HTML_FILE)
      .setTitle(SERKAL_PROGRAM_NAME)
      .setWidth(size.width)
      .setHeight(size.height);

    SpreadsheetApp.getUi().showModelessDialog(html, SERKAL_PROGRAM_NAME);
    return { ok: true, uiFile: SERKAL_UI_HTML_FILE };

  } catch (e) {
    var errText = '';
    try {
      errText = skErr_(e);
    } catch (_) {
      errText = String(e);
    }

    var msg = 'UI konnte nicht geöffnet werden.\n\n' +
      'Aktuelle UI-Datei laut Konfiguration: "' + SERKAL_UI_HTML_FILE + '"\n\n' +
      'Technischer Fehler:\n' + errText + '\n\n' +
      'Hinweis:\n' +
      'Wenn dieser Fehler beim Start aus dem Apps-Script-Editor auftritt, ' +
      'liegt meist kein gültiger Sheet-UI-Kontext vor.\n' +
      'Bitte SerKal direkt aus der Tabelle über Menü oder Start-Button testen.';

    try { SpreadsheetApp.getUi().alert(msg); } catch (_) { }
    try { LOG_ERROR('UI', msg); } catch (_) { }

    return { ok: false, message: msg, error: errText };
  }
}
/**
 * Öffnet die Oberfläche als modeless Dialog.
 */
// STILLGELEGT 2026-04-20: doppelte Alt-Definition
/**
 * @id 99.00.001
 * @funktion serkalOeffneDialog__STILLGELEGT_20260420
 * @modul 99 Stillgelegt / Altbestand
 * @gruppe Stillgelegt / Altbestand
 * @zweck Stillgelegter oder historischer Pfad; ID vergeben, damit Fanal den Altbestand sauber verfolgen kann.
 * @status stillgelegt
 * @loeschung nein
 */
function serkalOeffneDialog__STILLGELEGT_20260420() {
  try {

    // var size = serkalDialogSize_();  // alte Config-Logik (derzeit deaktiviert)
    var size = { width: 1500, height: 900 };

    var html = HtmlService.createHtmlOutputFromFile(SERKAL_UI_HTML_FILE)
      .setTitle(SERKAL_PROGRAM_NAME)
      .setWidth(size.width)
      .setHeight(size.height);

    SpreadsheetApp.getUi().showModelessDialog(html, SERKAL_PROGRAM_NAME);
    return { ok: true, uiFile: SERKAL_UI_HTML_FILE };

  } catch (e) {
    var msg = 'UI konnte nicht geöffnet werden.\n\n' +
      'Fehler: ' + e.message;

    SpreadsheetApp.getUi().alert(msg);
  }
  var msg = 'UI konnte nicht geöffnet werden.\n\n' +
    'Erwartete HTML-Datei: "' + SERKAL_UI_HTML_FILE + '"\n\n' +
    'Bitte den Dateinamen im Apps-Script-Projekt prüfen (oder SERKAL_UI_HTML_FILE oben anpassen).';

  try { SpreadsheetApp.getUi().alert(msg); } catch (_) { }
  try { LOG_ERROR('UI', msg + ' | ' + skErr_(e)); } catch (_) { }

  return { ok: false, message: msg };
}

/**
 * Diese Funktion ermittelt Die Versions Bezeichnung und stellt sie als abrufbares Datenpaket bereit,
 * wird ausschließlich von der UI benötigt zur Anzeige entsprechender Daten.
 */
/**
 * @id 1.00.004
 * @funktion apiGetBuildInfo
 * @modul 1 Start / UI-Dialog
 * @gruppe Start / UI-Dialog
 * @zweck UI/API-Brücke für apiGetBuildInfo; automatisch mit Funktions-ID versehen, fachliche Detailbeschreibung später prüfen.
 * @status aktiv
 * @loeschung nein
 */
function apiGetBuildInfo() {
  return {
    ok: true,
    version: SERKAL_VERSION,
    uiFile: SERKAL_UI_HTML_FILE,
    generatedAt: Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss'),
    dialogTitle: SERKAL_PROGRAM_NAME
  };
}



/**
 * @id 3.00.002
 * @funktion serkalPickSeasonWithDates_
 * @modul 3 TMDB / Seriendaten
 * @gruppe TMDB / Seriendaten
 * Wählt eine Staffel so aus, dass bevorzugt eine Staffel MIT echten Terminen genutzt wird.
 * Gleichzeitig liefert sie Flags für "angekündigt/ohne Termin" und "künftige Staffeln vorhanden".
 *
 * Rückgabe:
 *   {
 *     seasonNumber,         // gewählte Staffel (ggf. runtergezählt)
 *     maxSeasonNumber,      // ursprünglich "neueste" Staffel (aus TMDB seasons-Liste)
 *     futureSeasonsCount,   // wie viele Staffeln oberhalb der gewählten existieren
 *     episodeCount,
 *     seasonStart,          // ISO-Start (oder Platzhalter)
 *     episodeDates,         // ISO-Array (kann leer sein)
 *     dateFlag,             // '' | 'ANNOUNCED' | 'FUTURE_SEASONS'
 *     placeholderStart      // ISO-Platzhalter (nur bei ANNOUNCED)
 *   }

 * @zweck Funktions-ID automatisch vergeben; Zweck anhand Funktionsname/Modul später bei Bedarf verfeinern.
 * @status aktiv
 * @loeschung nein
 */
function serkalPickSeasonWithDates_(tvOrId, seasonsMaybe, seasonOverrideMaybe, langMaybe) {
  var tvId = null;
  var seasonsArr = [];
  var seasonOverride = null;
  var lang = 'de';

  if (tvOrId && typeof tvOrId === 'object' && !Array.isArray(tvOrId)) {
    tvId = Number(tvOrId.id || 0);
    seasonsArr = Array.isArray(tvOrId.seasons) ? tvOrId.seasons : [];
    seasonOverride = (typeof seasonsMaybe === 'number') ? seasonsMaybe : Number(seasonsMaybe || 0);
    lang = normalizeLang_(seasonOverrideMaybe);
  } else {
    tvId = Number(tvOrId || 0);
    seasonsArr = Array.isArray(seasonsMaybe) ? seasonsMaybe : [];
    seasonOverride = Number(seasonOverrideMaybe || 0);
    lang = normalizeLang_(langMaybe);
  }

  if (!isFinite(tvId) || tvId <= 0) throw new Error('serkalPickSeasonWithDates_: tvId ungültig');
  if (!isFinite(seasonOverride) || seasonOverride <= 0) seasonOverride = 0;

  var seasonMeta = seasonsArr
    .map(function (s) {
      return {
        seasonNumber: (s && s.season_number != null) ? Number(s.season_number) : 0,
        episodeCount: (s && s.episode_count != null) ? Number(s.episode_count) : 0,
        airDate: (s && s.air_date) ? String(s.air_date) : ''
      };
    })
    .filter(function (s) { return isFinite(s.seasonNumber) && s.seasonNumber > 0; })
    .sort(function (a, b) { return a.seasonNumber - b.seasonNumber; });

  var newestSeason = seasonMeta.length ? seasonMeta[seasonMeta.length - 1].seasonNumber : 1;
  var scanList = seasonOverride > 0
    ? [seasonOverride]
    : seasonMeta.slice().sort(function (a, b) { return b.seasonNumber - a.seasonNumber; }).map(function (s) { return s.seasonNumber; });

  if (!scanList.length) scanList = [newestSeason];

  var picked = null;
  for (var i = 0; i < scanList.length; i++) {
    var sn = Number(scanList[i]);
    if (!isFinite(sn) || sn <= 0) continue;

    var seasonJson = null;
    try {
      seasonJson = fetchSeasonDetailsFromTMDB(tvId, sn, lang);
    } catch (e) {
      seasonJson = null;
    }

    var a = analysiereStaffelDaten_(seasonJson || {});
    if (a && Array.isArray(a.termindaten) && a.termindaten.length) {
      picked = {
        seasonNumber: sn,
        seasonLabel: 'S' + pad2_(sn),
        episodeCount: a.episoden || pickSeasonEpisodeCount_(seasonsArr, sn) || 0,
        seasonStart: a.start || a.termindaten[0] || '',
        episodeDates: a.termindaten || [],
        dateFlag: '',
        placeholderStart: ''
      };
      break;
    }
  }

  if (!picked) {
    var target = seasonOverride > 0 ? seasonOverride : newestSeason;
    var placeholderYear = (new Date()).getFullYear() + 1;
    var placeholderStart = placeholderYear + '-01-01';
    picked = {
      seasonNumber: target,
      seasonLabel: 'S' + pad2_(target),
      episodeCount: pickSeasonEpisodeCount_(seasonsArr, target) || 0,
      seasonStart: placeholderStart,
      episodeDates: [],
      dateFlag: 'ANNOUNCED',
      placeholderStart: placeholderStart
    };
  }

  var futureSeasons = seasonMeta
    .filter(function (s) { return s.seasonNumber > Number(picked.seasonNumber || 0); })
    .map(function (s) {
      return {
        seasonNumber: s.seasonNumber,
        seasonLabel: 'S' + pad2_(s.seasonNumber),
        status: 'ANNOUNCED',
        episodeCount: isFinite(s.episodeCount) ? s.episodeCount : 0,
        airDate: s.airDate || ''
      };
    });

  picked.maxSeasonNumber = newestSeason;
  picked.futureSeasonsCount = futureSeasons.length;
  picked.futureSeasons = futureSeasons;
  picked.operatingSeasonNumber = picked.seasonNumber;

  return picked;
}


/**
 * @id 3.00.003
 * @funktion pickSeasonEpisodeCount_
 * @modul 3 TMDB / Seriendaten
 * @gruppe TMDB / Seriendaten
 * @zweck Funktions-ID automatisch vergeben; Zweck anhand Funktionsname/Modul später bei Bedarf verfeinern.
 * @status aktiv
 * @loeschung nein
 */
function pickSeasonEpisodeCount_(seasons, seasonNumber) {
  const list = Array.isArray(seasons) ? seasons : [];
  for (let i = 0; i < list.length; i++) {
    const s = list[i];
    if (s && s.season_number === seasonNumber) return Number(s.episode_count || 0);
  }
  return 0;
}

// --- TMDB HTTP ---
/**
 * @id 3.00.004
 * @funktion tmdbKey_
 * @modul 3 TMDB / Seriendaten
 * @gruppe TMDB / Seriendaten
 * @zweck Teil der TMDB-Anbindung; automatisch mit Funktions-ID versehen.
 * @status aktiv
 * @loeschung nein
 */
function tmdbKey_() {
  const key = String(
    PropertiesService
      .getScriptProperties()
      .getProperty('TMDB_API_KEY') || ''
  ).trim();

  if (!key || key === 'to be filled') {
    const err = new Error(
      'TMDB ist noch nicht eingerichtet.\n' +
      'Bitte zuerst den TMDB API-Key eintragen.'
    );

    err.code = 'TMDB_KEY_MISSING';
    throw err;
  }

  return key;
}
/**
 * @funktion tmdbGet_
 * @bereich TMDB
 * @zweck Erfüllt im aktuellen Code-Stand eine klar abgegrenzte Teilaufgabe rund um tmdb.
 * @status aktiv
 * @hinweis Interner Helfer; Aufrufer möglichst sauber begrenzt halten.
 * @loeschung nein
 */
/**
 * @id 3.00.005
 * @funktion tmdbGet_
 * @modul 3 TMDB / Seriendaten
 * @gruppe TMDB / Seriendaten
 * @zweck Teil der TMDB-Anbindung; automatisch mit Funktions-ID versehen.
 * @status aktiv
 * @loeschung nein
 */
function tmdbGet_(path, params) {
  const base = 'https://api.themoviedb.org/3';
  const q = Object.assign({}, (params || {}), { api_key: tmdbKey_() });

  const qs = Object.keys(q)
    .map(k => encodeURIComponent(k) + '=' + encodeURIComponent(String(q[k])))
    .join('&');

  const url = base + path + (qs ? ('?' + qs) : '');
  const resp = UrlFetchApp.fetch(url, { muteHttpExceptions: true });

  const code = resp.getResponseCode();
  const text = resp.getContentText() || '';
  if (code < 200 || code >= 300) {
    throw new Error('TMDB HTTP ' + code + ' for ' + path + ' | ' + text.slice(0, 200));
  }
  return JSON.parse(text);
}

/**
 * @funktion tmdbSearchTv_
 * @bereich TMDB
 * @zweck Erfüllt im aktuellen Code-Stand eine klar abgegrenzte Teilaufgabe rund um tmdb.
 * @status aktiv
 * @hinweis Interner Helfer; Aufrufer möglichst sauber begrenzt halten.
 * @loeschung nein
 */
/**
 * @id 3.00.006
 * @funktion tmdbSearchTv_
 * @modul 3 TMDB / Seriendaten
 * @gruppe TMDB / Seriendaten
 * @zweck Teil des Suchpfads; automatisch mit Funktions-ID versehen.
 * @status aktiv
 * @loeschung nein
 */
function tmdbSearchTv_(query, lang) {
  const l = normalizeLang_(lang);
  const params = {
    query: query,
    language: (l === 'en' ? 'en-US' : 'de-DE'),
    include_adult: 'false',
    page: 1
  };
  const res = tmdbGet_('/search/tv', params);
  try { LOG_INFO('TMDB', 'search/tv("' + query + '") -> ' + (res && res.results ? res.results.length : 0), ''); } catch (_e) { }
  return res;
}

/**
 * @funktion tmdbTvDetails_
 * @bereich TMDB
 * @zweck Erfüllt im aktuellen Code-Stand eine klar abgegrenzte Teilaufgabe rund um tmdb.
 * @status aktiv
 * @hinweis Interner Helfer; Aufrufer möglichst sauber begrenzt halten.
 * @loeschung nein
 */
/**
 * @id 3.00.007
 * @funktion tmdbTvDetails_
 * @modul 3 TMDB / Seriendaten
 * @gruppe TMDB / Seriendaten
 * @zweck Teil der TMDB-Anbindung; automatisch mit Funktions-ID versehen.
 * @status aktiv
 * @loeschung nein
 */
function tmdbTvDetails_(tvId, lang) {
  const l = normalizeLang_(lang);
  const params = { language: (l === 'en' ? 'en-US' : 'de-DE') };
  return tmdbGet_('/tv/' + encodeURIComponent(String(tvId)), params);
}

/**
 * @funktion tmdbSeasonDetails_
 * @bereich TMDB
 * @zweck Erfüllt im aktuellen Code-Stand eine klar abgegrenzte Teilaufgabe rund um tmdb.
 * @status aktiv
 * @hinweis Interner Helfer; Aufrufer möglichst sauber begrenzt halten.
 * @loeschung nein
 */
/**
 * @id 3.00.008
 * @funktion tmdbSeasonDetails_
 * @modul 3 TMDB / Seriendaten
 * @gruppe TMDB / Seriendaten
 * @zweck Teil der TMDB-Anbindung; automatisch mit Funktions-ID versehen.
 * @status aktiv
 * @loeschung nein
 */
function tmdbSeasonDetails_(tvId, seasonNumber, lang) {
  const l = normalizeLang_(lang);
  const params = { language: (l === 'en' ? 'en-US' : 'de-DE') };
  return tmdbGet_('/tv/' + encodeURIComponent(String(tvId)) + '/season/' + encodeURIComponent(String(seasonNumber)), params);
}

/**
 * @funktion serkalBuildTitleVariants_
 * @bereich Archiv / Dateiverarbeitung
 * @zweck Trennt Originaltitel und dateisichere Variante sauber voneinander.
 * @eingabe titel (String) – Roh-Titel, wie er fachlich geführt werden soll.
 * @ausgabe { titelOriginal:String, fileSafeTitle:String }
 * @logik Entfernt nur technisch unzulässige Dateizeichen, reduziert Mehrfach-Leerzeichen und trimmt.
 * @wichtig titelOriginal bleibt unverändert und darf für Anzeige/Matching benutzt werden; fileSafeTitle nur für Dateinamen.
 * @status aktiv
 */
/**
 * @id 9.00.002
 * @funktion serkalBuildTitleVariants_
 * @modul 9 Helfer
 * @gruppe Allgemeine Helfer
 * @zweck Funktions-ID automatisch vergeben; Zweck anhand Funktionsname/Modul später bei Bedarf verfeinern.
 * @status aktiv
 * @loeschung nein
 */
function serkalBuildTitleVariants_(titel) {
  var raw = String(titel || '');
  var fileSafe = raw
    .replace(/[\\/:*?"<>|]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return {
    titelOriginal: raw,
    fileSafeTitle: fileSafe
  };
}

/**
 * @funktion normTitel_
 * @bereich Helfer
 * @zweck Liefert die dateisichere Titelvariante für bestehende Aufrufer.
 * @status aktiv
 * @hinweis Verwendet intern serkalBuildTitleVariants_ und gibt nur fileSafeTitle zurück.
 * @loeschung nein
 */
// [PRUEFKANDIDAT]
// fanal: keine erkannte Nutzung.
/**
 * @id 9.00.003
 * @funktion normTitel_
 * @modul 9 Helfer
 * @gruppe Allgemeine Helfer
 * @zweck Funktions-ID automatisch vergeben; Zweck anhand Funktionsname/Modul später bei Bedarf verfeinern.
 * @status aktiv
 * @loeschung nein
 *
 * function normTitel_(s) {
  return serkalBuildTitleVariants_(s).fileSafeTitle;
}
*/
/*
  [AUSGELAGERT NACH MODUL 4 – SK25_B005_MODUL4_AUS_CODEGS_1ZU1]
  @id 4.00.001
  @funktion baueFileName_
  Aktive Definition steht jetzt in modul4-archiv.gs.
  Originalblock wurde aus code.gs entfernt, damit keine doppelte Funktionsdefinition entsteht.
*/

/*
  [AUSGELAGERT NACH MODUL 4 – SK25_B005_MODUL4_AUS_CODEGS_1ZU1]
  @id 4.00.002
  @funktion holeArchivFolder_
  Aktive Definition steht jetzt in modul4-archiv.gs.
  Originalblock wurde aus code.gs entfernt, damit keine doppelte Funktionsdefinition entsteht.
*/


/* ============================== TMDB ============================== */

/**
 * @funktion holeTmdbApiKey_
 * @bereich TMDB
 * @zweck Erfüllt im aktuellen Code-Stand eine klar abgegrenzte Teilaufgabe rund um tmdb.
 * @status aktiv
 * @hinweis Interner Helfer; Aufrufer möglichst sauber begrenzt halten.
 * @loeschung nein
 */
/**
 * @id 3.00.010
 * @funktion holeTmdbApiKey_
 * @modul 3 TMDB / Seriendaten
 * @gruppe TMDB / Seriendaten
 * @zweck Teil der TMDB-Anbindung; automatisch mit Funktions-ID versehen.
 * @status aktiv
 * @loeschung nein
 */
function holeTmdbApiKey_() {
  var props = PropertiesService.getScriptProperties();
  var key = props.getProperty('TMDB_API_KEY');
  if (!key) throw new Error('TMDB_API_KEY fehlt.');
  return key;
}

/**
 * @funktion tmdbLang_
 * @bereich TMDB
 * @zweck Erfüllt im aktuellen Code-Stand eine klar abgegrenzte Teilaufgabe rund um tmdb.
 * @status aktiv
 * @hinweis Interner Helfer; Aufrufer möglichst sauber begrenzt halten.
 * @loeschung nein
 */
/**
 * @id 3.00.011
 * @funktion tmdbLang_
 * @modul 3 TMDB / Seriendaten
 * @gruppe TMDB / Seriendaten
 * @zweck Teil der TMDB-Anbindung; automatisch mit Funktions-ID versehen.
 * @status aktiv
 * @loeschung nein
 */
function tmdbLang_(lang) {
  // Erwartet: 'de' oder 'en' (tolerant). Fallback: de-DE.
  var l = String(lang || '').toLowerCase();
  if (l.indexOf('en') === 0) return 'en-US';
  return 'de-DE';
}

/**
 * @id 3.00.020
 * @funktion serkalPruefeTmdbApiKey_
 * @modul 3 TMDB / Seriendaten
 * @gruppe TMDB / Konfiguration
 * @zweck Prüft freundlich, ob ein TMDB_API_KEY vorhanden ist, bevor TMDB aufgerufen wird.
 * @status aktiv
 * @loeschung nein
 */
function serkalPruefeTmdbApiKey_() {
  var key = '';

  try {
    key = String(
      PropertiesService
        .getScriptProperties()
        .getProperty('TMDB_API_KEY') || ''
    ).trim();
  } catch (_) {
    key = '';
  }

  if (!key || key === 'to be filled') {
    return {
      ok: false,
      code: 'TMDB_KEY_MISSING',
      message:
        'TMDB ist noch nicht eingerichtet.\n' +
        'Bitte zuerst den TMDB API-Key eintragen.'
    };
  }

  return {
    ok: true,
    key: key
  };
}



/**
 * @funktion tmdbApiFetchJson_
 * @bereich TMDB
 * @zweck Erfüllt im aktuellen Code-Stand eine klar abgegrenzte Teilaufgabe rund um tmdb.
 * @status aktiv
 * @hinweis Interner Helfer; Aufrufer möglichst sauber begrenzt halten.
 * @loeschung nein
 */
/**
 * @id 3.00.012
 * @funktion tmdbApiFetchJson_
 * @modul 3 TMDB / Seriendaten
 * @gruppe TMDB / Seriendaten
 * @zweck Teil der TMDB-Anbindung; automatisch mit Funktions-ID versehen.
 * @status aktiv
 * @loeschung nein
 */
function tmdbApiFetchJson_(url) {
  // TMDB-Wrapper mit:
  //  - Cache (CacheService) zur Beschleunigung + Reduktion von Requests
  //  - respektvollem Retry bei HTTP 429 (Rate Limit / Burst-Schutz)
  //
  // Hinweis: Cache ist bewusst "best-effort". Bei Parse-Fehlern wird neu geladen.

  var u = String(url || '');
  if (!u) throw new Error('TMDB: URL leer');

  // --- Cache-Key (kurz & stabil) ---
  var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, u, Utilities.Charset.UTF_8);
  var key = 'TMDB:' + Utilities.base64EncodeWebSafe(digest).substring(0, 48);

  // --- TTL je nach Endpoint ---
  // Suche  -> kürzer (1h), Details -> länger (12–24h)
  var ttl = 3600; // default 1h
  if (u.indexOf('/tv/') !== -1 && u.indexOf('/season/') !== -1) ttl = 24 * 3600;      // Staffel-Details
  else if (u.indexOf('/tv/') !== -1) ttl = 12 * 3600;                                 // TV-Details
  else if (u.indexOf('/search/') !== -1) ttl = 3600;                                  // Suche

  // --- Cache read ---
  try {
    var cache = CacheService.getScriptCache();
    var cached = cache.get(key);
    if (cached) {
      try { return JSON.parse(cached); } catch (_e) { /* Cache korrupt -> weiter */ }
    }
  } catch (_e2) { /* Cache optional */ }

  // --- Fetch mit 429-Retry ---
  var attempt, resp, code, body;
  var waits = [250, 750, 1750, 3000]; // ms (steigend)
  for (attempt = 0; attempt < waits.length + 1; attempt++) {
    resp = UrlFetchApp.fetch(u, { muteHttpExceptions: true });
    code = resp.getResponseCode();
    body = resp.getContentText();

    if (code === 429) {
      // Rate limit: respektieren -> warten, dann retry
      if (attempt < waits.length) {
        var jitter = Math.floor(Math.random() * 200);
        Utilities.sleep(waits[attempt] + jitter);
        continue;
      }
      throw new Error('TMDB HTTP 429: zu viele Requests (bitte kurz langsamer blättern).');
    }

    if (code >= 200 && code < 300) {
      // OK -> parse + cache
      try {
        var json = JSON.parse(body);
        try {
          CacheService.getScriptCache().put(key, body, ttl);
        } catch (_e3) { }
        return json;
      } catch (eJson) {
        throw new Error('TMDB JSON Parse Error: ' + eJson);
      }
    }

    // Andere Fehler: kein retry (bewusst), aber klare Meldung
    throw new Error('TMDB HTTP ' + code + ': ' + body);
  }

  throw new Error('TMDB: unerwarteter Fehler (Retry-Loop).');
}



/**
 * Call 2a: TV Details
 */
/**
 * @id 3.00.013
 * @funktion fetchTvDetailsFromTMDB_
 * @modul 3 TMDB / Seriendaten
 * @gruppe TMDB / Seriendaten
 * @zweck Teil der TMDB-Anbindung; automatisch mit Funktions-ID versehen.
 * @status aktiv
 * @loeschung nein
 */
function fetchTvDetailsFromTMDB_(seriesId, lang) {
  var id = Number(seriesId);
  if (!isFinite(id) || id <= 0) throw new Error('fetchTvDetailsFromTMDB_: seriesId ungültig: ' + seriesId);

  var apiKey = holeTmdbApiKey_();
  var url = 'https://api.themoviedb.org/3/tv/' + encodeURIComponent(String(id)) +
    '?api_key=' + encodeURIComponent(apiKey) +
    '&language=' + encodeURIComponent(tmdbLang_(lang));

  return tmdbApiFetchJson_(url);
}

/**
 * Call 2b: Season Details
 */
/**
 * @id 3.00.014
 * @funktion fetchSeasonDetailsFromTMDB
 * @modul 3 TMDB / Seriendaten
 * @gruppe TMDB / Seriendaten
 * @zweck Teil der TMDB-Anbindung; automatisch mit Funktions-ID versehen.
 * @status aktiv
 * @loeschung nein
 */
function fetchSeasonDetailsFromTMDB(seriesId, seasonNumber, lang) {
  var id = Number(seriesId);
  if (!isFinite(id) || id <= 0) throw new Error('fetchSeasonDetailsFromTMDB: seriesId ungültig: ' + seriesId);

  var s = Number(seasonNumber);
  if (!isFinite(s) || s < 0) throw new Error('fetchSeasonDetailsFromTMDB: seasonNumber ungültig: ' + seasonNumber);

  var apiKey = holeTmdbApiKey_();
  var url = 'https://api.themoviedb.org/3/tv/' + encodeURIComponent(String(id)) +
    '/season/' + encodeURIComponent(String(s)) +
    '?api_key=' + encodeURIComponent(apiKey) +
    '&language=' + encodeURIComponent(tmdbLang_(lang));

  return tmdbApiFetchJson_(url);
}

/**
 * @funktion ermittleNeuesteStaffelnummer_
 * @bereich Helfer
 * @zweck Erfüllt im aktuellen Code-Stand eine klar abgegrenzte Teilaufgabe rund um helfer.
 * @status aktiv
 * @hinweis Interner Helfer; Aufrufer möglichst sauber begrenzt halten.
 * @loeschung nein
 */
// [KANDIDAT ALT]
// fanal: keine erkannte Nutzung.
// Vor Entfernen erst manuell gegen reale Aufrufer pruefen.
/**
 * @id 3.00.015
 * @funktion ermittleNeuesteStaffelnummer_
 * @modul 3 TMDB / Seriendaten
 * @gruppe TMDB / Seriendaten
 * @zweck Funktions-ID automatisch vergeben; Zweck anhand Funktionsname/Modul später bei Bedarf verfeinern.
 * @status aktiv
 * @loeschung nein
 */
function ermittleNeuesteStaffelnummer_(tvDetails) {

  // 1) Primär: seasons[] aus tvDetails nutzen (enthält episode_count pro Staffel)
  var seasons = (tvDetails && Array.isArray(tvDetails.seasons)) ? tvDetails.seasons : [];
  if (seasons.length) {
    var best = 1;
    seasons.forEach(function (s) {
      var sn = (s && s.season_number != null) ? Number(s.season_number) : 0;
      var ec = (s && s.episode_count != null) ? Number(s.episode_count) : 0;

      // Nur Staffeln akzeptieren, die wirklich "da" sind: episode_count > 0
      if (isFinite(sn) && sn > 0 && isFinite(ec) && ec > 0) {
        if (sn > best) best = sn;
      }
    });
    return best;
  }

  // 2) Fallback wie bisher (falls seasons[] fehlt)
  var n = (tvDetails && tvDetails.number_of_seasons != null) ? Number(tvDetails.number_of_seasons) : 0;
  if (isFinite(n) && n > 0) return n;

  var le = tvDetails && tvDetails.last_episode_to_air ? tvDetails.last_episode_to_air : null;
  var sn2 = (le && le.season_number != null) ? Number(le.season_number) : 0;
  if (isFinite(sn2) && sn2 > 0) return sn2;

  return 1;
}
/**
 * @funktion analysiereStaffelDaten_
 * @bereich Helfer
 * @zweck Erfüllt im aktuellen Code-Stand eine klar abgegrenzte Teilaufgabe rund um helfer.
 * @status aktiv
 * @hinweis Interner Helfer; Aufrufer möglichst sauber begrenzt halten.
 * @loeschung nein
 */
/**
 * @id 3.00.016
 * @funktion analysiereStaffelDaten_
 * @modul 3 TMDB / Seriendaten
 * @gruppe TMDB / Seriendaten
 * @zweck Funktions-ID automatisch vergeben; Zweck anhand Funktionsname/Modul später bei Bedarf verfeinern.
 * @status aktiv
 * @loeschung nein
 */
function analysiereStaffelDaten_(seasonJson) {
  var eps = (seasonJson && Array.isArray(seasonJson.episodes)) ? seasonJson.episodes : [];
  var termindaten = eps.map(function (e) { return e && e.air_date ? String(e.air_date) : ''; })
    .filter(function (d) { return /^\d{4}-\d{2}-\d{2}$/.test(d); });

  return {
    staffelNummer: (seasonJson && seasonJson.season_number != null) ? Number(seasonJson.season_number) : null,
    episoden: eps.length,
    start: termindaten.length ? termindaten[0] : '',
    termindaten: termindaten
  };
}
/**
 * @funktion verarbeiteTmdbAuswahl
 * @bereich Übernahme
 * @zweck Übernimmt eine bestätigte TMDB-Auswahl in das interne SerKal-Datenmodell.
 * @sttus aktiv
 * @hinweis Bei späterer Vereinfachung prüfen, ob diese Funktion noch getrennt nötig ist.
 * @loeschung nein
 */
/**
 * @id 3.00.017
 * @funktion verarbeiteTmdbAuswahl
 * @modul 3 TMDB / Seriendaten
 * @gruppe TMDB / Seriendaten
 * @zweck Teil der TMDB-Anbindung; automatisch mit Funktions-ID versehen.
 * @status aktiv
 * @loeschung nein
 */
function verarbeiteTmdbAuswahl(payload) {
  traceGS_('verarbeiteTmdbAuswahl EINGANG', payload || {});
  var result = verarbeiteAuswahlDaten(payload);
  traceGS_('verarbeiteTmdbAuswahl AUSGANG', result || {});
  return result;
}

/**
 * @funktion loescheArchivStaffel
 * @bereich Archiv
 * @zweck Erfüllt im aktuellen Code-Stand eine klar abgegrenzte Teilaufgabe rund um archiv.
 * @status aktiv
 * @hinweis Bei späterer Vereinfachung prüfen, ob diese Funktion noch getrennt nötig ist.
 * @loeschung nein
 */
/**
 * @id 3.00.018
 * @funktion loescheArchivStaffel
 * @modul 3 TMDB / Seriendaten
 * @gruppe TMDB / Seriendaten
 * @zweck Teil der Archivlogik; automatisch mit Funktions-ID versehen.
 * @status aktiv
 * @loeschung nein
 */
function loescheArchivStaffel(req) {
  try {
    var r = req || {};
    var fileName = String(r.fileName || '').trim();
    var staffelLabel = String(r.staffelLabel || '').trim().toUpperCase();

    if (!fileName || !/\.txt$/i.test(fileName)) {
      return { ok: false, message: 'fileName fehlt/ungültig.' };
    }

    var folder = holeArchivFolder_();
    var it = folder.getFilesByName(fileName);
    if (!it.hasNext()) return { ok: false, message: 'Datei nicht gefunden: ' + fileName };

    var file = it.next();
    var base = fileName.replace(/\.txt$/i, '');
    var mm = base.match(/^(.*)\s\((\d{4})\)$/);
    var titel = mm ? String(mm[1]) : base;
    var jahr = mm ? String(mm[2]) : '';

    if (!staffelLabel) {
      try { serkalLoescheKalenderEventsZurSerie_(titel, jahr); } catch (_e1) { }

      try {
        file.setTrashed(true);
      } catch (eTrash) {
        return { ok: false, message: 'Datei konnte nicht gelöscht werden: ' + skErr_(eTrash) };
      }

      serkalBaueArchivIndex_();
      LOG_INFO('ARCHIV', 'Serie gelöscht (Datei): ' + fileName);
      return { ok: true, message: 'Serie gelöscht: ' + titel + (jahr ? (' (' + jahr + ')') : '') };
    }

    var altLine = '';
    var altParsed = null;
    try {
      altLine = serkalLeseArchivZeile_(file, staffelLabel);
      altParsed = serkalParseArchivZeile_(altLine);
    } catch (_eAlt) { }

    try {
      serkalLoescheKalenderEventsZurStaffel_(titel, jahr, staffelLabel, (altParsed && Array.isArray(altParsed.termindaten)) ? altParsed.termindaten.slice() : []);
    } catch (_e2) { }

    var content = file.getBlob().getDataAsString('UTF-8') || '';
    var lines = content
      .split(/\r?\n/)
      .map(function (x) { return String(x || '').trim(); })
      .filter(Boolean);

    var rx = new RegExp('^' + serkalEscapeRegex_(staffelLabel) + '(?:\\b|;|\\|)', 'i');
    var out = lines.filter(function (ln) { return !rx.test(ln); });

    file.setContent(out.join('\n') + (out.length ? '\n' : ''));
    serkalBaueArchivIndex_();

    LOG_INFO('ARCHIV', 'Staffel gelöscht: ' + fileName + ' ' + staffelLabel);
    return { ok: true, message: 'Staffel gelöscht: ' + staffelLabel };
  } catch (e) {
    LOG_ERROR('ARCHIV', 'loescheArchivStaffel Fehler: ' + skErr_(e));
    return { ok: false, message: skErr_(e) };
  }
}

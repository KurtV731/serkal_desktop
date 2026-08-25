/*
  SerKal – Code.gs Master 2.5 SK25_B010_MODUL10_ZUKUNFTSPRUEFUNG_TEST1
  Version: SK25_B012_MODUL10_ZUKUNFTSPRUEFUNG_TEST1";
  Änderung: MODUL10_ZUKUNFTSPRUEFUNG_TEST1 – 10.03 Testlauf pruefen/bewerten/loggen; keine Schreib-/Kalenderaktionen
*/

const SERKAL_VERSION = "2026-07-31";

// Log-Modus:
// MINIMAL = nur Fehler
// NORMAL  = Fehler/Warnungen + wichtige Start-/Endpunkte
// DEBUG   = zusaetzliche Detailmeldungen
// TRACE   = komplette Ablaufverfolgung nur fuer gezielte Fehlersuche
const SERKAL_LOG_LEVEL = "NORMAL";  // MINIMAL | NORMAL | DEBUG | TRACE

/** =====================================================================
 * MODUL 1 – Start / Menü / UI-Dialog
 * =====================================================================
 *
 * Hinweis für Anwender:
 * Das Programm kann an individuelle Bedürfnisse angepasst werden.
 * Änderungen sollten – wenn überhaupt – ausschließlich an den unten
 * gekennzeichneten Positionen (Pos 1–5) erfolgen.
 *
 * Der übrige Code ist nur begrenzt gegen falsche Eingaben abgesichert.
 * Wer nicht genau weiß, was geändert wird, sollte diese Bereiche
 * besser unverändert lassen.
 */

/** ========================================================================
 * A -Definitionen für Ordner, die das Programm braucht
 * 
 * Es wird von folgender Struktur ausgegangen 
 * (bei Benutzung des Installationsscripts wird das alles genau so gesetzt)
 * "G:\Meine Ablage\SerKal\Archivdaten"
 * "G:\Meine Ablage\SerKal\FanalOutput"
 * "G:\Meine Ablage\SerKal\Installer":
 * "G:\Meine Ablage\SerKal\Logs"
 * "G:\Meine Ablage\SerKal\Pakete"
 * "G:\Meine Ablage\SerKal\PicCache"
 * ========================================================================
 */

/* Zahlenband-Ordner (Drive) – Ordner: SerKal_Archivdaten
   siehe ggf. Sonderanleitung */
var SERKAL_ARCHIV_FOLDER_ID = '1Flk8JhwaRViWx3NVlMyRIy_mG7cHaraS';
var SERKAL_ARCHIV_INDEX_NAME = 'serkal_archiv_index.json';

/* TXT-Logsystem – nutzt standardmäßig den Archivdaten-Ordner.
   Späterer Node.js-Umzug: nur Adapter austauschen, Logik bleibt gleich. */
var SERKAL_LOG_FOLDER_ID = SERKAL_ARCHIV_FOLDER_ID;
var SERKAL_LOG_FILE_PREFIX = '!!SerKal_LOG_';
var SERKAL_LOG_FILE_EXT = '.txt';
var SERKAL_LOG_KEEP_DAYS = 7;

/* Poster-Cache-Ordner (Drive) – Ordner: Serkal-PicCache
   speichert bereits geladene Archiv-Poster dauerhaft zwischen */
var SERKAL_PIC_CACHE_FOLDER_ID = '10GDFqdqXwIs7h1pbZ66qKvqawdrBf1lf';
var SERKAL_PIC_CACHE_IMAGE_SIZE = 'w185';

/* Fanal-Ausgabeordner (Drive) – Ordner: SerKal_Fanal_Output
   WICHTIG: reine Drive-Ordner-ID, kein führender Slash. */
var FANAL_OUTPUT_FOLDER_ID = '1AMn66KmEltEk361bKJ-3jbHUQCVTzFqG';

/* =====================================================================
  B1 – Programmname (zentrale Definition)
   ===================================================================== */

var SERKAL_PROGRAM_NAME = 'SerKal';
/* =====================================================================
   B2 – Kalendername im Google Kalender
   ===================================================================== */
var SERKAL_KALENDER_NAME = 'SerKal';
/* =====================================================================
   B3 – Name der HTML-Datei für die Benutzeroberfläche
   ===================================================================== */
var SERKAL_UI_HTML_FILE = 'ui';
/* =====================================================================
   B4 – Dialoggröße der Benutzeroberfläche
   Zielgröße: 1450 × 730
   ===================================================================== */
var SERKAL_DIALOG_BREITE = 1200;
var SERKAL_DIALOG_HOEHE = 780;
/* =============================== Ende Userconfig =====================*/
/**
   Einige Einstellungen erklären sich selbst.

   Für folgende Punkte gibt es separate Dokumentationen auf https://serkal.de :

   • Einrichtung der Google-Drive-Ordner
   • Einrichtung des TMDB API-Keys
   • Erweiterte Konfiguration

   ===================================================================== 
 * Beim Öffnen der Tabelle: Menü "Serienverwaltung" bereitstellen.
 */

function onOpen(e) {
  try {
    SpreadsheetApp.getUi()
      .createMenu('Serienverwaltung')
      .addItem('SerKal öffnen', 'serkalStarten')
      .addToUi();
  } catch (err) { }
}

/**
 * Startpunkt (für Sheet-Button und Menü).
 * Der Start-Button im Sheet kann direkt auf serkalStarten() zeigen.
 */
/**
 * @id 1.00.002
 * @funktion serkalStarten
 * @modul 1 Start / UI-Dialog
 * @gruppe Start / UI-Dialog
 * @zweck Funktions-ID automatisch vergeben; Zweck anhand Funktionsname/Modul später bei Bedarf verfeinern.
 * @status aktiv
 * @loeschung nein
 */
function serkalStarten() {
  try { LOG_INFO('BOOT', 'SerKal Start', { version: SERKAL_VERSION, uiFile: SERKAL_UI_HTML_FILE }); } catch (_) { }
  try { Logger.log('INFO\tBOOT\tSerKal Build\t' + SERKAL_VERSION); } catch (_) { }
  return serkalOeffneDialog_();
}



/**
 * @id 9.00.004
 * @funktion serkalHolePicCacheFolder_
 * @modul 9 Helfer
 * @gruppe Allgemeine Helfer
 * @zweck Funktions-ID automatisch vergeben; Zweck anhand Funktionsname/Modul später bei Bedarf verfeinern.
 * @status aktiv
 * @loeschung nein
 */
function serkalHolePicCacheFolder_() {
  return DriveApp.getFolderById(SERKAL_PIC_CACHE_FOLDER_ID);
}

/**
 * @funktion serkalPicCacheImageName_
 * @bereich Cache / Drive
 * @zweck Bilddateiname für den persistenten Poster-Cache.
 * @status aktiv
 * @hinweis Dateiname bewusst nur über tmdbId, damit Wiederverwendung stabil bleibt.
 * @loeschung nein
 */
/**
 * @id 9.00.005
 * @funktion serkalPicCacheImageName_
 * @modul 9 Helfer
 * @gruppe Allgemeine Helfer
 * @zweck Funktions-ID automatisch vergeben; Zweck anhand Funktionsname/Modul später bei Bedarf verfeinern.
 * @status aktiv
 * @loeschung nein
 */
function serkalPicCacheImageName_(tmdbId) {
  return 'tmdb_' + String(Number(tmdbId || 0)) + '_' + SERKAL_PIC_CACHE_IMAGE_SIZE + '.jpg';
}

/**
 * @funktion serkalPicCacheNoPicName_
 * @bereich Cache / Drive
 * @zweck Markerdatei für Serien ohne verfügbares Poster.
 * @status aktiv
 * @hinweis Spart wiederholte TMDB-Abfragen bei "No Pic Available".
 * @loeschung nein
 */
/**
 * @id 9.00.006
 * @funktion serkalPicCacheNoPicName_
 * @modul 9 Helfer
 * @gruppe Allgemeine Helfer
 * @zweck Funktions-ID automatisch vergeben; Zweck anhand Funktionsname/Modul später bei Bedarf verfeinern.
 * @status aktiv
 * @loeschung nein
 */
function serkalPicCacheNoPicName_(tmdbId) {
  return 'tmdb_' + String(Number(tmdbId || 0)) + '_nopic.txt';
}

/**
 * @funktion serkalBlobToDataUrl_
 * @bereich Cache / Bild
 * @zweck Wandelt einen Blob in eine direkt an die UI lieferbare Data-URL um.
 * @status aktiv
 * @hinweis Data-URL ist für die UI einfacher als Drive-Freigaben oder Web-Links.
 * @loeschung nein
 */
/**
 * @id 9.00.007
 * @funktion serkalBlobToDataUrl_
 * @modul 9 Helfer
 * @gruppe Allgemeine Helfer
 * @zweck Funktions-ID automatisch vergeben; Zweck anhand Funktionsname/Modul später bei Bedarf verfeinern.
 * @status aktiv
 * @loeschung nein
 */
function serkalBlobToDataUrl_(blob) {
  var mime = String(blob && blob.getContentType ? blob.getContentType() : 'image/jpeg');
  var b64 = Utilities.base64Encode(blob.getBytes());
  return 'data:' + mime + ';base64,' + b64;
}

/*
  [AUSGELAGERT NACH MODUL 4 – SK25_B005_MODUL4_AUS_CODEGS_1ZU1]
  @id 4.00.005
  @funktion apiHoleArchivPoster
  Aktive Definition steht jetzt in modul4-archiv.gs.
  Originalblock wurde aus code.gs entfernt, damit keine doppelte Funktionsdefinition entsteht.
*/


/* ============================== ARCHIV – Index & Daten ============================== */

/*
  [AUSGELAGERT NACH MODUL 4 – SK25_B005_MODUL4_AUS_CODEGS_1ZU1]
  @id 4.00.006
  @funktion serkalLeseArchivIndexDatei_
  Aktive Definition steht jetzt in modul4-archiv.gs.
  Originalblock wurde aus code.gs entfernt, damit keine doppelte Funktionsdefinition entsteht.
*/

/*
  [AUSGELAGERT NACH MODUL 4 – SK25_B005_MODUL4_AUS_CODEGS_1ZU1]
  @id 4.00.007
  @funktion serkalSchreibeArchivIndexDatei_
  Aktive Definition steht jetzt in modul4-archiv.gs.
  Originalblock wurde aus code.gs entfernt, damit keine doppelte Funktionsdefinition entsteht.
*/

/*
  [AUSGELAGERT NACH MODUL 4 – SK25_B005_MODUL4_AUS_CODEGS_1ZU1]
  @id 4.00.008
  @funktion deriveStatusFromDates_
  Aktive Definition steht jetzt in modul4-archiv.gs.
  Originalblock wurde aus code.gs entfernt, damit keine doppelte Funktionsdefinition entsteht.
*/


/*
  [AUSGELAGERT NACH MODUL 4 – SK25_B005_MODUL4_AUS_CODEGS_1ZU1]
  @id 4.00.009A
  @funktion serkalArchivDateiIgnorieren_
  Aktive Definition steht jetzt in modul4-archiv.gs.
  Originalblock wurde aus code.gs entfernt, damit keine doppelte Funktionsdefinition entsteht.
*/

/*
  [AUSGELAGERT NACH MODUL 4 – SK25_B005_MODUL4_AUS_CODEGS_1ZU1]
  @id 4.00.010
  @funktion serkalBaueArchivIndex_
  Aktive Definition steht jetzt in modul4-archiv.gs.
  Originalblock wurde aus code.gs entfernt, damit keine doppelte Funktionsdefinition entsteht.
*/

/*
  [AUSGELAGERT NACH MODUL 4 – SK25_B005_MODUL4_AUS_CODEGS_1ZU1]
  @id 4.00.011
  @funktion getArchivDaten
  Aktive Definition steht jetzt in modul4-archiv.gs.
  Originalblock wurde aus code.gs entfernt, damit keine doppelte Funktionsdefinition entsteht.
*//**
 * UI ruft: google.script.run.apiLadeArchivDaten()
 * Rückgabe (Master): {ok:true, daten:{entries:[...], meta:{...}}}
 */

/* ============================== MODUL 4 – API / Archiv / G1 ==============================
 * Stand: 2026-03-14_MODUL4_CLEAN
 * Änderung:
 * - doppelte Funktion serkalLoescheKalenderEventsZurStaffel_ entfernt
 * - Test-/Debug-Reste aus Modul 4 entfernt
 * - Titel-Normalisierung für Kalendervergleich gehärtet
 * - Kalender-Löschung für Serie/Staffel vereinheitlicht
 * - Logik für Archiv-Upsert / G1-Vergleich bereinigt
 * - Log-Menge auf sinnvolle Kernmeldungen reduziert
 */

/* ============================== API WRAPPER ============================== */
/**
 * @funktion serkalLoescheDoppelpunkteUndSonderzeichenNeutral_
 * @bereich Kalender / Titelvergleich
 * @zweck Normalisiert Titel tolerant für Vergleiche, ohne die fachliche Originalschreibweise zu verändern.
 * @eingabe s (String) – Anzeigetitel oder Kalendereintragstitel.
 * @ausgabe String – kleingeschriebene Vergleichsform ohne störende Sonderzeichen.
 * @logik Reduziert u.a. Doppelpunkt, Bindestriche und Mehrfach-Leerzeichen auf eine neutrale Vergleichsform.
 * @wichtig Nur für Matching verwenden, niemals für Anzeige oder Dateinamen.
 * @status aktiv
 */
/**
 * @id 9.00.008
 * @funktion serkalLoescheDoppelpunkteUndSonderzeichenNeutral_
 * @modul 9 Helfer
 * @gruppe Allgemeine Helfer
 * @zweck Funktions-ID automatisch vergeben; Zweck anhand Funktionsname/Modul später bei Bedarf verfeinern.
 * @status aktiv
 * @loeschung nein
 */
function serkalLoescheDoppelpunkteUndSonderzeichenNeutral_(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\`\-?]/g, '')
    .replace(/[\:\;\,\.\!\?"'\`\´\“\”\‘\’\(\)\[\]\{\}\/\_\-\–\—]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * @funktion serkalIstAehnlicherKalSerienTitel_
 * @bereich Kalender
 * @zweck Erfüllt im aktuellen Code-Stand eine klar abgegrenzte Teilaufgabe rund um kalender.
 * @status aktiv
 * @hinweis Interner Helfer; Aufrufer möglichst sauber begrenzt halten.
 * @loeschung nein
 */
/**
 * @id 9.00.009
 * @funktion serkalIstAehnlicherKalSerienTitel_
 * @modul 9 Helfer
 * @gruppe Allgemeine Helfer
 * @zweck Funktions-ID automatisch vergeben; Zweck anhand Funktionsname/Modul später bei Bedarf verfeinern.
 * @status aktiv
 * @loeschung nein
 */

function serkalIstAehnlicherKalSerienTitel_(eventTitle, titel, jahr) {
  var evNorm = serkalLoescheDoppelpunkteUndSonderzeichenNeutral_(eventTitle);
  var baseNorm = serkalLoescheDoppelpunkteUndSonderzeichenNeutral_(titel);
  var withYearNorm = serkalLoescheDoppelpunkteUndSonderzeichenNeutral_(titel + (jahr ? (' ' + jahr) : ''));

  if (!evNorm || !baseNorm) return false;
  if (evNorm.indexOf(withYearNorm) === 0) return true;
  if (evNorm.indexOf(baseNorm) === 0) return true;

  var tokens = baseNorm.split(' ').filter(function (tok) {
    return tok && tok.length >= 3;
  });
  if (!tokens.length) return false;

  var hitCount = 0;
  for (var i = 0; i < tokens.length; i++) {
    if (evNorm.indexOf(tokens[i]) !== -1) hitCount++;
  }

  return hitCount >= Math.max(2, tokens.length - 1);
}


/*
  [AUSGELAGERT NACH MODUL 4 – SK25_B005_MODUL4_AUS_CODEGS_1ZU1]
  @id 4.00.012
  @funktion serkalUpsertFieldInArchivZeile_
  Aktive Definition steht jetzt in modul4-archiv.gs.
  Originalblock wurde aus code.gs entfernt, damit keine doppelte Funktionsdefinition entsteht.
*/

/*
  [API-BRUECKE WIEDER AKTIV IN CODE.GS – SK25_B006_MODUL4_API_BRIDGE_FIX1]
  Grund: Diese Funktion wird direkt aus der UI per google.script.run aufgerufen.
  Die interne Archivlogik bleibt in modul4-archiv.gs.
*/
/**
 * @funktion apiSpeichereArchivAenderungen
 * @bereich Archiv / UI-API
 * @zweck Schreibt vorgemerkte Archivänderungen gesammelt und baut danach den Index neu.
 * @status aktiv
 * @hinweis Wird typischerweise indirekt aus der UI über google.script.run angesprochen.
 * @loeschung nein
 */

/**
 * @funktion apiSpeichereArchivAenderungen
 * @bereich Archiv / UI-API
 * @zweck Schreibt vorgemerkte Archivänderungen gesammelt, baut danach den Index neu und stößt Kalender-Sync an.
 * @status aktiv
 * @hinweis Wird typischerweise indirekt aus der UI über google.script.run angesprochen.
 * @loeschung nein
 */
/**
 * @id 4.00.013
 * @funktion apiSpeichereArchivAenderungen
 * @modul 4 Archiv
 * @gruppe Archiv / Datenhaltung
 * @zweck UI/API-Brücke für apiSpeichereArchivAenderungen; automatisch mit Funktions-ID versehen, fachliche Detailbeschreibung später prüfen.
 * @status aktiv
 * @loeschung nein
 */
function apiSpeichereArchivAenderungen(dirtyMap) {
  try {
    var map = dirtyMap || {};
    var keys = Object.keys(map);

    LOG_INFO('ARCHIV', 'apiSpeichereArchivAenderungen empfangen', {
      keyCount: keys.length,
      keys: keys,
      dirtyMap: map
    });

    if (!keys.length) {
      var empty = getArchivDaten();
      return { ok: true, savedCount: 0, daten: { entries: empty.entries || [], meta: empty.meta || {} } };
    }

    var folder = holeArchivFolder_();
    var savedCount = 0;
    var syncQueue = [];

    keys.forEach(function (key) {
      var patch = map[key] || {};
      var fileName = String(patch.fileName || '').trim();
      var staffelLabel = String(patch.staffelLabel || '').trim();
      if (!fileName || !staffelLabel) return;

      var files = folder.getFilesByName(fileName);
      if (!files.hasNext()) return;

      var file = files.next();
      var oldLine = serkalLeseArchivZeile_(file, staffelLabel);
      if (!oldLine) return;

      var oldParsed = serkalParseArchivZeile_(oldLine);
      var line = String(oldLine || '');

      if (Object.prototype.hasOwnProperty.call(patch, 'note')) {
        var noteText = String(patch.note || '');
        var encNote = noteText.trim() ? serkalEncodeField_(noteText) : '';
        line = serkalUpsertFieldInArchivZeile_(line, 'note', encNote);

        var deParsed = parseNotesForDE_(noteText, oldParsed ? oldParsed.startOriginal : '', oldParsed ? oldParsed.datesOriginal : []);
        if (deParsed && deParsed.startDE) {
          line = serkalUpsertFieldInArchivZeile_(line, 'startDE', deParsed.startDE);
        } else {
          line = serkalUpsertFieldInArchivZeile_(line, 'startDE', '');
        }
      }

      if (Object.prototype.hasOwnProperty.call(patch, 'seen')) {
        line = serkalUpsertFieldInArchivZeile_(line, 'seen', patch.seen ? '1' : '');
      }

      // Startfeld-Normalisierung
      var mLegacyStart = line.match(/(?:^|[;|]\s*)start=([^;|]+)/i);
      if (mLegacyStart && !/(?:^|[;|]\s*)startOriginal=/.test(line)) {
        line = serkalUpsertFieldInArchivZeile_(line, 'startOriginal', String(mLegacyStart[1] || '').trim());
        line = line.replace(/(?:^|[;|]\s*)start=[^;|]+/i, '');
        line = line.replace(/^\s*[;|]\s*/, '').replace(/\s*[;|]\s*[;|]\s*/g, '; ').trim();
      }

      // dates-Feld immer kompakt zurückschreiben
      var parsedNow = serkalParseArchivZeile_(line);
      if (parsedNow && Array.isArray(parsedNow.datesOriginal) && parsedNow.datesOriginal.length) {
        line = serkalUpsertFieldInArchivZeile_(line, 'dates', serkalCompressDateList_(parsedNow.datesOriginal).join(','));
      }

      serkalSchreibeArchivZeile_(file, staffelLabel, line);
      savedCount++;

      syncQueue.push({
        titel: (fileName || '').replace(/\.txt$/i, '').replace(/\s+\(\d{4}\)$/, ''),
        staffelLabel: staffelLabel,
        oldActiveDates: oldParsed && Array.isArray(oldParsed.activeDates) ? oldParsed.activeDates.slice() : []
      });
    });

    var rebuilt = serkalBaueArchivIndex_();

    syncQueue.forEach(function (item) {
      try {
        serkalSynchronisiereKalender_(item.titel, item.staffelLabel, item.oldActiveDates);
      } catch (eSync) {
        LOG_ERROR('KAL', 'apiSpeichereArchivAenderungen -> Sync Fehler: ' + skErr_(eSync));
      }
    });

    return { ok: true, savedCount: savedCount, daten: { entries: rebuilt.entries || [], meta: rebuilt.meta || {} } };
  } catch (e) {
    LOG_ERROR('ARCHIV', 'apiSpeichereArchivAenderungen Fehler: ' + skErr_(e));
    return { ok: false, message: skErr_(e), savedCount: 0, daten: { entries: [], meta: {} } };
  }
}



/*
  [API-BRUECKE WIEDER AKTIV IN CODE.GS – SK25_B006_MODUL4_API_BRIDGE_FIX1]
  Grund: Diese Funktion wird direkt aus der UI per google.script.run aufgerufen.
  Die interne Archivlogik bleibt in modul4-archiv.gs.
*/
/**
 * @id 4.00.014
 * @funktion apiMarkiereArchivAlsGeschaut
 * @modul 4 Archiv
 * @gruppe Archiv / Datenhaltung
 * @zweck UI/API-Brücke für apiMarkiereArchivAlsGeschaut; automatisch mit Funktions-ID versehen, fachliche Detailbeschreibung später prüfen.
 * @status aktiv
 * @loeschung nein
 */
function apiMarkiereArchivAlsGeschaut(req) {
  try {
    req = req || {};

    var fileName = String(req.fileName || '').trim();
    var staffelLabel = String(req.staffelLabel || '').trim();
    if (!fileName || !staffelLabel) {
      return { ok: false, message: 'fileName oder staffelLabel fehlt.' };
    }

    var folder = holeArchivFolder_();
    var files = folder.getFilesByName(fileName);
    if (!files.hasNext()) {
      return { ok: false, message: 'Archivdatei nicht gefunden: ' + fileName };
    }

    var file = files.next();
    var ln = serkalLeseArchivZeile_(file, staffelLabel);
    if (!ln) {
      return { ok: false, message: 'Archivzeile nicht gefunden: ' + staffelLabel };
    }

    var neu = String(ln)
      .replace(/([;|]\s*)(?:seen|buttonPressed)=\d+\b/ig, '')
      .replace(/[;|]\s*$/, '')
      .trim();

    neu += '; seen=1';

    serkalSchreibeArchivZeile_(file, staffelLabel, neu);
    var rebuilt = serkalBaueArchivIndex_();

    return {
      ok: true,
      message: 'Als geschaut markiert.',
      daten: { entries: rebuilt.entries || [], meta: rebuilt.meta || {} }
    };
  } catch (e) {
    LOG_ERROR('ARCHIV', 'apiMarkiereArchivAlsGeschaut Fehler: ' + skErr_(e));
    return { ok: false, message: skErr_(e) };
  }
}


/*
  [API-BRUECKE WIEDER AKTIV IN CODE.GS – SK25_B006_MODUL4_API_BRIDGE_FIX1]
  Grund: Diese Funktion wird direkt aus der UI per google.script.run aufgerufen.
  Die interne Archivlogik bleibt in modul4-archiv.gs.
*/
/**
 * @funktion apiLoescheArchivEintrag
 * @bereich Archiv / UI-API
 * @zweck Löscht einen gewählten Archiv-Eintrag inklusive zugehöriger Folgelogik.
 * @status aktiv
 * @hinweis Wird typischerweise indirekt aus der UI über google.script.run angesprochen.
 * @loeschung nein
 */
/**
 * @id 4.00.015
 * @funktion apiLoescheArchivEintrag
 * @modul 4 Archiv
 * @gruppe Archiv / Datenhaltung
 * @zweck UI/API-Brücke für apiLoescheArchivEintrag; automatisch mit Funktions-ID versehen, fachliche Detailbeschreibung später prüfen.
 * @status aktiv
 * @loeschung nein
 */
function apiLoescheArchivEintrag(req) {
  return loescheArchivStaffel(req);
}


/*
  [API-BRUECKE WIEDER AKTIV IN CODE.GS – SK25_B006_MODUL4_API_BRIDGE_FIX1]
  Grund: Diese Funktion wird direkt aus der UI per google.script.run aufgerufen.
  Die interne Archivlogik bleibt in modul4-archiv.gs.
*/
/**
 * @funktion apiLadeArchivDaten
 * @bereich Archiv / UI-API
 * @zweck Liefert der UI die aktuellen Archivdaten zur Darstellung in der rechten Liste.
 * @status aktiv
 * @hinweis Wird typischerweise indirekt aus der UI über google.script.run angesprochen.
 * @loeschung nein
 */
/**
 * @id 4.00.016
 * @funktion apiLadeArchivDaten
 * @modul 4 Archiv
 * @gruppe Archiv / Datenhaltung
 * @zweck UI/API-Brücke für apiLadeArchivDaten; automatisch mit Funktions-ID versehen, fachliche Detailbeschreibung später prüfen.
 * @status aktiv
 * @loeschung nein

function apiLadeArchivDaten() {
  try {
    LOG_INFO('ARCHIV', 'Laden START', { source: 'UI' });
    traceGS_('apiLadeArchivDaten EINGANG', { ok: true, source: 'UI' });

    var r = getArchivDaten();
    var entries = Array.isArray(r && r.entries) ? r.entries : [];
    var meta = (r && r.meta) ? r.meta : {};

    // Ein gültiger leerer Archivordner ist ein normaler Zustand.
    var result = {
      ok: true,
      daten: {
        entries: entries,
        meta: meta
      },
      count: entries.length
    };

    LOG_INFO('ARCHIV', 'Laden ENDE', { entryCount: entries.length, source: String(meta.source || '') });
    traceGS_('apiLadeArchivDaten AUSGANG', {
      ok: true,
      entryCount: entries.length,
      source: String(meta.source || ''),
      firstEntry: entries[0] || null
    });

    return result;
  } catch (e) {
    LOG_ERROR('ARCHIV', 'apiLadeArchivDaten Fehler: ' + skErr_(e));
    traceGS_('apiLadeArchivDaten FEHLER', { ok: false, message: skErr_(e) });
    return {
      ok: false,
      message: skErr_(e),
      daten: { entries: [], meta: { source: 'load-error', error: skErr_(e) } },
      count: 0
    };
  }
}*/


/**
 * @funktion apiUiLog
 * @bereich UI-API
 * @zweck Erfüllt im aktuellen Code-Stand eine klar abgegrenzte Teilaufgabe rund um ui-api.
 * @status aktiv
 * @hinweis Wird typischerweise indirekt aus der UI über google.script.run angesprochen.
 * @loeschung nein
 */
// [PRUEFKANDIDAT]
// fanal: keine erkannte Nutzung aus der UI erkannt.
/**
 * @id 1.90.001
 * @funktion apiUiLog
 * @modul 1 Start / UI-Dialog
 * @gruppe API / Bridge
 * @zweck UI/API-Brücke für apiUiLog; automatisch mit Funktions-ID versehen, fachliche Detailbeschreibung später prüfen.
 * @status aktiv
 * @loeschung nein
 */
function apiUiLog(msg, json) {
  try {
    var m = String(msg || '');
    // TRACE-Meldungen bleiben als Werkzeug erhalten, landen aber im Normalbetrieb nicht im LOG.
    if (m.toUpperCase().indexOf('TRACE') === 0) {
      if (String(SERKAL_LOG_LEVEL || 'NORMAL').toUpperCase() !== 'TRACE') return;
    }
    LOG_INFO('UI', m, json || '');
  } catch (_e) { }
}

/**
 * @funktion apiHoleLogZeilen__STILLGELEGT_SHEET_20260507
 * @bereich Logging / Altbestand
 * @zweck Alte Sheet-Version wurde durch Modul-8-TXT-Log ersetzt.
 * @status stillgelegt
 * @hinweis Nicht verwenden; aktive Funktion apiHoleLogZeilen steht im Modul 8.
 * @loeschung nein
 */
/**
 * @id 99.00.002
 * @funktion apiHoleLogZeilen__STILLGELEGT_SHEET_20260507
 * @modul 99 Stillgelegt / Altbestand
 * @gruppe Stillgelegt / Altbestand
 * @zweck Stillgelegter oder historischer Pfad; ID vergeben, damit Fanal den Altbestand sauber verfolgen kann.
 * @status stillgelegt
 * @loeschung nein
 */
function apiHoleLogZeilen__STILLGELEGT_SHEET_20260507(limit) {
  return { ok: false, message: 'Stillgelegt: LOG-Sheet wurde durch TXT-Log ersetzt.', lines: [], count: 0, source: 'SHEET_STILLGELEGT' };
}


/*
  [AUSGELAGERT NACH MODUL 10 – SK25_B007_MODUL10_WARTUNG_SPLIT1]
  @funktion apiStarteWartungMehrsprachig
  Aktive Definition steht jetzt in modul10-wartung.gs.
  Originalblock wurde aus code.gs entfernt, damit keine doppelte Funktionsdefinition entsteht.
*/

/* ============================== ARCHIV SCHREIBEN ============================== */

/**
 * @funktion serkalEscapeRegex_
 * @bereich Helfer
 * @zweck Erfüllt im aktuellen Code-Stand eine klar abgegrenzte Teilaufgabe rund um helfer.
 * @status aktiv
 * @hinweis Interner Helfer; Aufrufer möglichst sauber begrenzt halten.
 * @loeschung nein
 */
/**
 * @id 9.00.010
 * @funktion serkalEscapeRegex_
 * @modul 9 Helfer
 * @gruppe Allgemeine Helfer
 * @zweck Funktions-ID automatisch vergeben; Zweck anhand Funktionsname/Modul später bei Bedarf verfeinern.
 * @status aktiv
 * @loeschung nein
 */
function serkalEscapeRegex_(s) {
  return String(s || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/* ============================== EINTRAGEN ============================== */


/*
  [AUSGELAGERT NACH MODUL 4 – SK25_B005_MODUL4_AUS_CODEGS_1ZU1]
  @id 4.00.018
  @funktion verarbeiteAuswahlDaten
  Aktive Definition steht jetzt in modul4-archiv.gs.
  Originalblock wurde aus code.gs entfernt, damit keine doppelte Funktionsdefinition entsteht.
*/
/*
  [AUSGELAGERT NACH MODUL 4 – SK25_B005_MODUL4_AUS_CODEGS_1ZU1]
  @id 4.00.019
  @funktion serkalArchivHatSerienDateien_
  Aktive Definition steht jetzt in modul4-archiv.gs.
  Originalblock wurde aus code.gs entfernt, damit keine doppelte Funktionsdefinition entsteht.
*/
/* ============================== LÖSCHEN (ARCHIV + KALENDER) ============================== */

/* ============================== G1 – ARCHIV HELFER ============================== */

/**
 * @funktion serkalApplyOffsetDE_
 * @bereich Datum / DE
 * @zweck Verschiebt bestehende Originaltermine um einen festen Tagesoffset.
 * @status aktiv
 * @hinweis Für einfache DE-Versätze ohne manuelle Einzelliste.
 * @loeschung nein
 */
/**
 * @id 9.00.012
 * @funktion serkalApplyOffsetDE_
 * @modul 9 Helfer
 * @gruppe Allgemeine Helfer
 * @zweck Funktions-ID automatisch vergeben; Zweck anhand Funktionsname/Modul später bei Bedarf verfeinern.
 * @status aktiv
 * @loeschung nein
 */
function serkalApplyOffsetDE_(originalDates, offsetDays) {
  var src = Array.isArray(originalDates) ? originalDates : [];
  var off = parseInt(offsetDays, 10);
  if (!src.length || !isFinite(off)) return [];

  return src.map(function (d) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(d || ''))) return '';
    var dt = new Date(String(d) + 'T00:00:00');
    if (isNaN(dt.getTime())) return '';
    dt.setDate(dt.getDate() + off);
    return Utilities.formatDate(dt, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }).filter(Boolean);
}


/*
  [AUSGELAGERT NACH MODUL 5 – KALENDER-REPARATUR]
  @id 5.00.003
  @funktion holeSerkalKalender_
  Aktive Definition steht in modul5-kalender.gs.
  Die Definition wurde aus Code.gs entfernt, damit keine doppelte
  Funktionsdefinition entsteht.
*/


/**
 * @funktion serkalBaueStaffelBloecke_
 * @bereich Helfer
 * @zweck Erfüllt im aktuellen Code-Stand eine klar abgegrenzte Teilaufgabe rund um helfer.
 * @status aktiv
 * @hinweis Interner Helfer; Aufrufer möglichst sauber begrenzt halten.
 * @loeschung nein
 */
/**
 * @id 3.00.019
 * @funktion serkalBaueStaffelBloecke_
 * @modul 3 TMDB / Seriendaten
 * @gruppe TMDB / Seriendaten
 * @zweck Funktions-ID automatisch vergeben; Zweck anhand Funktionsname/Modul später bei Bedarf verfeinern.
 * @status aktiv
 * @loeschung nein
 */
function serkalBaueStaffelBloecke_(termindaten) {
  // termindaten: Array von YYYY-MM-DD pro Episode (in Reihenfolge)
  var blocks = [];
  var lastDate = null, from = 1, to = 1;

  for (var i = 0; i < termindaten.length; i++) {
    var dt = String(termindaten[i] || '').trim();
    if (!dt) continue;

    var ep = i + 1;
    if (lastDate === null) {
      lastDate = dt; from = ep; to = ep;
      continue;
    }

    if (dt === lastDate) {
      to = ep;
    } else {
      blocks.push({ date: lastDate, eFrom: from, eTo: to, count: (to - from + 1) });
      lastDate = dt; from = ep; to = ep;
    }
  }

  if (lastDate !== null) {
    blocks.push({ date: lastDate, eFrom: from, eTo: to, count: (to - from + 1) });
  }
  return blocks;
}




/**
* Liefert die Dialog-Größe zentral als Objekt zurück.
 * Nutzung: const size = serkalDialogSize_(); html.setWidth(size.width).setHeight(size.height)
 */
/**
 * @id 9.00.013
 * @funktion serkalDialogSize_
 * @modul 9 Helfer
 * @gruppe Allgemeine Helfer
 * @zweck Funktions-ID automatisch vergeben; Zweck anhand Funktionsname/Modul später bei Bedarf verfeinern.
 * @status aktiv
 * @loeschung nein
 */
function serkalDialogSize_() {
  return {
    width: SERKAL_DIALOG_BREITE,
    height: SERKAL_DIALOG_HOEHE
  };
}
// ==============================
// [TESTBEREICH]
// [KANDIDAT TESTARCHIV]
// Testlauf – nicht Produktivlogik.
// Bei Bedarf in separates Testarchiv auslagern.
// ==============================
var TRACE_BRIDGE = false;  // Intensiv-Trace vorerst reduziert

/**
 * @id 9.00.014
 * @funktion traceCompact_
 * @modul 9 Helfer
 * @gruppe Allgemeine Helfer
 * @zweck Funktions-ID automatisch vergeben; Zweck anhand Funktionsname/Modul später bei Bedarf verfeinern.
 * @status aktiv
 * @loeschung nein
 */
function traceCompact_(obj) {
  try {
    return {
      keys: obj ? Object.keys(obj) : [],
      titel: obj && (obj.titel || obj.title || obj.name || ''),
      fileName: obj && (obj.fileName || obj.datei || obj.filename || ''),
      tmdbId: obj && (obj.tmdbId || obj.id || obj.seriesId || ''),

      descDE: obj && obj.descDE ? String(obj.descDE).length : 0,
      descEN: obj && obj.descEN ? String(obj.descEN).length : 0,
      desc: obj && obj.desc ? String(obj.desc).length : 0
    };
  } catch (_e) {
    return { error: 'traceCompact failed' };
  }
}

/**
 * @id 9.00.015
 * @funktion traceGS_
 * @modul 9 Helfer
 * @gruppe Allgemeine Helfer
 * @zweck Funktions-ID automatisch vergeben; Zweck anhand Funktionsname/Modul später bei Bedarf verfeinern.
 * @status aktiv
 * @loeschung nein
 */
function traceGS_(label, obj) {
  if (!TRACE_BRIDGE) return;
  try {
    LOG_INFO('TRACE_GS', String(label || ''), traceCompact_(obj));
  } catch (e1) {
    try { Logger.log('TRACE GS ' + String(label || '') + ' ' + JSON.stringify(traceCompact_(obj))); } catch (e2) { }
  }
}

// [KANDIDAT TESTARCHIV]
// Debug-Bruecke – nur fuer Analyse/Test.
/**
 * @id 99.01.002
 * @funktion debugEcho_
 * @modul 99 Stillgelegt / Altbestand
 * @gruppe Test / Debug
 * @zweck Stillgelegter oder historischer Pfad; ID vergeben, damit Fanal den Altbestand sauber verfolgen kann.
 * @status aktiv
 * @loeschung nein
 */
function debugEcho_(daten) {
  traceGS_('debugEcho_ EINGANG', daten || {});
  return daten || {};
}



// Vorereitet zur Löschung


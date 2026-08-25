/*
  SerKal – Modul 4 Archiv / TXT-Dateien
  Datei: modul4-archiv.gs
  Build: SK25_B016_MODUL4_ARCHIV_REPAIR3
  Stand: 2026-06-13 – Reparatur 3

  Zweck:
  Dieses Modul kapselt die Archiv-/TXT-Dateilogik.
  Code.gs soll diese Fachlogik künftig nicht mehr aktiv enthalten.

  Funktionsübersicht:
  4.01  serkalArchivConfig_()                    – Archiv-Konfiguration lesen
  4.02  serkalArchivOrdner_()                    – Archivordner ermitteln
  4.03  serkalArchivDateiname_()                 – sicheren Dateinamen bilden
  4.04  serkalArchivDateiFinden_()               – Archivdatei suchen
  4.05  serkalArchivDateiHolenOderAnlegen_()     – Archivdatei holen/anlegen
  4.06  serkalArchivTextLesen_()                 – TXT-Inhalt lesen
  4.07  serkalArchivTextSchreiben_()             – TXT-Inhalt schreiben
  4.08  serkalArchivTextAnhaengen_()             – TXT-Inhalt ergänzen
  4.09  serkalArchivIndexLesen_()                – Archivordner als Index lesen
  4.10  serkalArchivIndexSort_()                 – Index nach Änderungsdatum sortieren
  4.11  serkalArchivStatusErmitteln_()           – einfachen Status aus TXT ermitteln
  4.12  serkalArchivMetadatenAusText_()          – einfache Schlüssel/Wert-Zeilen lesen
  4.13  serkalArchivMetawert_()                  – Metawert case-insensitive lesen
  4.14  serkalArchivDatensatzLesen_()            – Text + Metadaten + Status lesen
  4.15  serkalArchivDatensatzSchreiben_()        – Text + Metadaten zurückschreiben
  4.16  serkalArchivDatensatzAusDatei_()         – Indexeintrag mit Kurzinfo erzeugen
  4.17  serkalArchivAntwort_()                   – einheitliche Rückgabe für UI/GS
  4.18  serkalArchivSelbsttest_()                – kleiner Verbindungstest ohne Schreibzugriff

  Reparatur 3:
  - Rückgabe von apiLadeArchivDaten noch UI-toleranter.
  - Date-Objekte in Archiv-Einträgen werden nicht mehr direkt an die UI geliefert.
  - Zusätzlich entryCount/success/message ergänzt, damit die UI keinen leeren Fehler bekommt.

  Hinweise:
  - Keine verschachtelten Funktionen.
  - Keine UI-Änderungen.
  - Keine Zukunftsprüfung in diesem Modul.
  - Keine automatische Änderung von TMDB-IDs.
  - Keine Löschung alter Logik. Alte Code.gs-Funktionen werden dort stillgelegt.
*/

function serkalArchivConfig_() {
  var cfg = {};

  cfg.ordnerId = '';

  if (typeof SERKAL_ARCHIV_ORDNER_ID !== 'undefined') {
    cfg.ordnerId = String(SERKAL_ARCHIV_ORDNER_ID || '').trim();
  }

  if (!cfg.ordnerId && typeof SERKAL_ARCHIV_FOLDER_ID !== 'undefined') {
    cfg.ordnerId = String(SERKAL_ARCHIV_FOLDER_ID || '').trim();
  }

  if (!cfg.ordnerId && typeof ARCHIV_ORDNER_ID !== 'undefined') {
    cfg.ordnerId = String(ARCHIV_ORDNER_ID || '').trim();
  }

  if (!cfg.ordnerId && typeof SERKAL_CONFIG !== 'undefined' && SERKAL_CONFIG) {
    if (SERKAL_CONFIG.archivOrdnerId) {
      cfg.ordnerId = String(SERKAL_CONFIG.archivOrdnerId || '').trim();
    }

    if (!cfg.ordnerId && SERKAL_CONFIG.archivFolderId) {
      cfg.ordnerId = String(SERKAL_CONFIG.archivFolderId || '').trim();
    }
  }

  cfg.prefix = 'serkal_';
  cfg.suffix = '.txt';
  cfg.encoding = 'UTF-8';

  return cfg;
}

function serkalArchivOrdner_() {
  var cfg = serkalArchivConfig_();

  if (!cfg.ordnerId) {
    return serkalArchivAntwort_(false, 'Archivordner-ID fehlt in der Config.', null);
  }

  try {
    return serkalArchivAntwort_(true, '', DriveApp.getFolderById(cfg.ordnerId));
  } catch (err) {
    return serkalArchivAntwort_(false, 'Archivordner konnte nicht geöffnet werden: ' + err, null);
  }
}

/* =====================================================================
   MODUL 4 – Basisfunktionen aus alter Archivlogik
   Diese Funktionen waren laut Code.gs nach Modul 4 ausgelagert und werden
   von bestehenden Archivfunktionen weiterhin benötigt.
   ===================================================================== */

function baueFileName_(titel, jahr) {
  var t = '';

  if (typeof serkalBuildTitleVariants_ === 'function') {
    t = serkalBuildTitleVariants_(titel).fileSafeTitle;
  } else {
    t = String(titel || '')
      .replace(/[\\/:*?"<>|]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  var y = (jahr && isFinite(Number(jahr))) ? String(parseInt(jahr, 10)) : '';
  return t + (y ? (' (' + y + ')') : '') + '.txt';
}

function holeArchivFolder_() {
  var cfg = serkalArchivConfig_();

  if (!cfg.ordnerId) {
    throw new Error('SERKAL_ARCHIV_FOLDER_ID fehlt.');
  }

  return DriveApp.getFolderById(cfg.ordnerId);
}

function serkalDecodeField_(raw) {
  var s = String(raw || '').trim();
  if (!s) return '';

  try {
    return decodeURIComponent(s.replace(/\+/g, '%20'));
  } catch (_e) {
    return s;
  }
}

function serkalEncodeField_(raw) {
  return encodeURIComponent(String(raw || '').trim());
}

function deriveStatusFromDates_(dates) {
  var arr = Array.isArray(dates) ? dates : [];
  return serkalBestimmeStatus_({
    fileName: 'inline',
    startOriginal: arr.length ? arr[0] : '',
    datesOriginal: arr,
    datesDE: []
  });
}


function serkalArchivDateiname_(titel, tmdbId) {
  var cfg = serkalArchivConfig_();
  var rohTitel = String(titel || '').trim();
  var rohId = String(tmdbId || '').trim();
  var basis = rohTitel || rohId || 'unbenannt';

  basis = basis.toLowerCase();
  basis = basis.replace(/[ä]/g, 'ae');
  basis = basis.replace(/[ö]/g, 'oe');
  basis = basis.replace(/[ü]/g, 'ue');
  basis = basis.replace(/[ß]/g, 'ss');
  basis = basis.replace(/[^a-z0-9]+/g, '_');
  basis = basis.replace(/^_+|_+$/g, '');

  if (!basis) {
    basis = 'unbenannt';
  }

  if (rohId) {
    basis = basis + '_' + rohId.replace(/[^0-9a-zA-Z_-]/g, '');
  }

  return cfg.prefix + basis + cfg.suffix;
}

function serkalArchivDateiFinden_(titel, tmdbId) {
  var ordnerAntwort = serkalArchivOrdner_();
  if (!ordnerAntwort.ok) {
    return ordnerAntwort;
  }

  var dateiname = serkalArchivDateiname_(titel, tmdbId);
  var files = ordnerAntwort.daten.getFilesByName(dateiname);

  if (!files.hasNext()) {
    return serkalArchivAntwort_(false, 'Archivdatei nicht gefunden: ' + dateiname, null);
  }

  return serkalArchivAntwort_(true, '', files.next());
}

function serkalArchivDateiHolenOderAnlegen_(titel, tmdbId, startText) {
  var ordnerAntwort = serkalArchivOrdner_();
  if (!ordnerAntwort.ok) {
    return ordnerAntwort;
  }

  var dateiname = serkalArchivDateiname_(titel, tmdbId);
  var files = ordnerAntwort.daten.getFilesByName(dateiname);

  if (files.hasNext()) {
    return serkalArchivAntwort_(true, '', files.next());
  }

  try {
    var text = String(startText || '');
    var datei = ordnerAntwort.daten.createFile(dateiname, text, MimeType.PLAIN_TEXT);
    return serkalArchivAntwort_(true, '', datei);
  } catch (err) {
    return serkalArchivAntwort_(false, 'Archivdatei konnte nicht angelegt werden: ' + err, null);
  }
}

function serkalArchivTextLesen_(titel, tmdbId) {
  var cfg = serkalArchivConfig_();
  var dateiAntwort = serkalArchivDateiFinden_(titel, tmdbId);

  if (!dateiAntwort.ok) {
    return dateiAntwort;
  }

  try {
    return serkalArchivAntwort_(true, '', dateiAntwort.daten.getBlob().getDataAsString(cfg.encoding));
  } catch (err) {
    return serkalArchivAntwort_(false, 'Archivtext konnte nicht gelesen werden: ' + err, null);
  }
}

function serkalArchivTextSchreiben_(titel, tmdbId, text) {
  var dateiAntwort = serkalArchivDateiHolenOderAnlegen_(titel, tmdbId, '');

  if (!dateiAntwort.ok) {
    return dateiAntwort;
  }

  try {
    dateiAntwort.daten.setContent(String(text || ''));
    return serkalArchivAntwort_(true, '', dateiAntwort.daten);
  } catch (err) {
    return serkalArchivAntwort_(false, 'Archivtext konnte nicht geschrieben werden: ' + err, null);
  }
}

function serkalArchivTextAnhaengen_(titel, tmdbId, zusatzText) {
  var altAntwort = serkalArchivTextLesen_(titel, tmdbId);
  var altText = '';

  if (altAntwort.ok) {
    altText = String(altAntwort.daten || '');
  }

  var neuText = altText;

  if (neuText && neuText.slice(-1) !== '\n') {
    neuText += '\n';
  }

  neuText += String(zusatzText || '');

  return serkalArchivTextSchreiben_(titel, tmdbId, neuText);
}

function serkalArchivIndexLesen_() {
  var ordnerAntwort = serkalArchivOrdner_();

  if (!ordnerAntwort.ok) {
    return ordnerAntwort;
  }

  var cfg = serkalArchivConfig_();
  var liste = [];
  var files = ordnerAntwort.daten.getFiles();

  while (files.hasNext()) {
    var datei = files.next();
    var name = datei.getName();

    if (name.indexOf(cfg.prefix) === 0 && name.slice(-cfg.suffix.length) === cfg.suffix) {
      liste.push(serkalArchivDatensatzAusDatei_(datei));
    }
  }

  liste.sort(serkalArchivIndexSort_);
  return serkalArchivAntwort_(true, '', liste);
}

function serkalArchivIndexSort_(a, b) {
  var da = a && a.updated ? new Date(a.updated).getTime() : 0;
  var db = b && b.updated ? new Date(b.updated).getTime() : 0;
  return db - da;
}

function serkalArchivStatusErmitteln_(text) {
  var t = String(text || '').toLowerCase();

  if (!t) {
    return '⚪ leer';
  }

  if (t.indexOf('fehler') >= 0 || t.indexOf('error') >= 0) {
    return '🔴 fehler';
  }

  if (t.indexOf('warten') >= 0 || t.indexOf('wartet') >= 0) {
    return '⏳ warten';
  }

  if (t.indexOf('geplant') >= 0 || t.indexOf('kalender') >= 0 || t.indexOf('eingetragen') >= 0) {
    return '✅ geplant';
  }

  if (t.indexOf('archiv') >= 0) {
    return '🟡 archiv';
  }

  return '🟡 archiv';
}

function serkalArchivMetadatenAusText_(text) {
  var zeilen = String(text || '').split(/\r?\n/);
  var meta = {};
  var i;

  for (i = 0; i < zeilen.length; i++) {
    var zeile = String(zeilen[i] || '').trim();
    var pos = zeile.indexOf(':');

    if (pos > 0) {
      var key = zeile.substring(0, pos).trim();
      var wert = zeile.substring(pos + 1).trim();

      if (key) {
        meta[key] = wert;
      }
    }
  }

  return meta;
}

function serkalArchivMetawert_(meta, name) {
  var gesucht = String(name || '').toLowerCase();
  var key;

  if (!meta || !gesucht) {
    return '';
  }

  for (key in meta) {
    if (Object.prototype.hasOwnProperty.call(meta, key)) {
      if (String(key || '').toLowerCase() === gesucht) {
        return String(meta[key] || '');
      }
    }
  }

  return '';
}

function serkalArchivDatensatzLesen_(titel, tmdbId) {
  var textAntwort = serkalArchivTextLesen_(titel, tmdbId);

  if (!textAntwort.ok) {
    return textAntwort;
  }

  var text = String(textAntwort.daten || '');
  var meta = serkalArchivMetadatenAusText_(text);
  var status = serkalArchivStatusErmitteln_(text);

  return serkalArchivAntwort_(true, '', {
    titel: String(titel || ''),
    tmdbId: String(tmdbId || ''),
    dateiname: serkalArchivDateiname_(titel, tmdbId),
    status: status,
    meta: meta,
    text: text
  });
}

function serkalArchivDatensatzSchreiben_(datensatz) {
  if (!datensatz) {
    return serkalArchivAntwort_(false, 'Kein Archivdatensatz übergeben.', null);
  }

  var titel = String(datensatz.titel || datensatz.title || '').trim();
  var tmdbId = String(datensatz.tmdbId || datensatz.id || '').trim();
  var text = String(datensatz.text || '');

  if (!titel && !tmdbId) {
    return serkalArchivAntwort_(false, 'Archivdatensatz ohne Titel und ohne TMDB-ID.', null);
  }

  return serkalArchivTextSchreiben_(titel, tmdbId, text);
}

function serkalArchivDatensatzAusDatei_(datei) {
  var cfg = serkalArchivConfig_();
  var text = '';
  var meta = {};
  var status = '⚪ leer';

  try {
    text = datei.getBlob().getDataAsString(cfg.encoding);
    meta = serkalArchivMetadatenAusText_(text);
    status = serkalArchivStatusErmitteln_(text);
  } catch (err) {
    text = '';
    meta = { Fehler: String(err) };
    status = '🔴 fehler';
  }

  return {
    name: datei.getName(),
    id: datei.getId(),
    url: datei.getUrl(),
    updated: datei.getLastUpdated(),
    status: status,
    titel: serkalArchivMetawert_(meta, 'Titel'),
    tmdbId: serkalArchivMetawert_(meta, 'TMDB-ID'),
    staffel: serkalArchivMetawert_(meta, 'Staffel'),
    meta: meta
  };
}

function serkalArchivAntwort_(ok, fehler, daten) {
  return {
    ok: !!ok,
    fehler: String(fehler || ''),
    daten: daten || null
  };
}

function serkalArchivSelbsttest_() {
  var ordnerAntwort = serkalArchivOrdner_();

  if (!ordnerAntwort.ok) {
    return ordnerAntwort;
  }

  var indexAntwort = serkalArchivIndexLesen_();

  if (!indexAntwort.ok) {
    return indexAntwort;
  }

  return serkalArchivAntwort_(true, '', {
    ordner: ordnerAntwort.daten.getName(),
    anzahlArchivDateien: indexAntwort.daten.length,
    hinweis: 'Modul 4 Archiv ist erreichbar. Es wurde nichts geschrieben.'
  });
}
/* =====================================================================
   MODUL 4 – Archiv / UI-API / Kompatibilitätsblock
   Build: 2026-06-13_SK25_B014_MODUL4_ARCHIV_REPAIR1
   Zweck:
   - apiLadeArchivDaten liegt aktiv in Modul 4.
   - getArchivDaten liefert wieder ein UI-kompatibles {entries, meta}-Objekt.
   - serkalBaueArchivIndex_ baut echte Staffel-Einträge aus den TXT-Zahlenbanddateien.
   - Rückgabe bleibt tolerant: daten.entries UND direkte entries/list/data.
   ===================================================================== */

function apiLadeArchivDaten() {
  try {
    LOG_INFO('ARCHIV', 'Laden START', { source: 'UI' });
    traceGS_('apiLadeArchivDaten EINGANG', { ok: true, source: 'UI' });

    var r = getArchivDaten();
    var entries = serkalArchivExtractEntries_(r);
    var meta = serkalArchivExtractMeta_(r);

    var result = {
      ok: true,
      success: true,
      message: '',
      daten: {
        ok: true,
        entries: entries,
        meta: meta
      },
      entries: entries,
      list: entries,
      data: entries,
      meta: meta,
      count: entries.length,
      entryCount: entries.length
    };

    LOG_INFO('ARCHIV', 'Laden ENDE', {
      ok: true,
      entryCount: entries.length,
      source: String(meta.source || ''),
      hasEntries: Array.isArray(entries)
    });
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
      success: false,
      message: skErr_(e),
      daten: { ok: false, entries: [], meta: { source: 'load-error', error: skErr_(e) } },
      entries: [],
      list: [],
      data: [],
      meta: { source: 'load-error', error: skErr_(e) },
      count: 0,
      entryCount: 0
    };
  }
}

function getArchivDaten() {
  try {
    LOG_INFO('ARCHIV', 'getArchivDaten START', {});

    var rebuilt = serkalBaueArchivIndex_();
    var entries = serkalArchivExtractEntries_(rebuilt);
    var meta = serkalArchivExtractMeta_(rebuilt);

    LOG_INFO('ARCHIV', 'getArchivDaten ENDE', { anzahl: entries.length, source: String(meta.source || '') });

    return {
      entries: entries,
      meta: meta
    };
  } catch (e) {
    LOG_ERROR('ARCHIV', 'getArchivDaten Fehler: ' + skErr_(e));
    return {
      entries: [],
      meta: {
        ok: false,
        source: 'getArchivDaten-error',
        error: skErr_(e)
      }
    };
  }
}

function serkalArchivExtractEntries_(daten) {
  if (Array.isArray(daten)) return daten;
  if (daten && Array.isArray(daten.entries)) return daten.entries;
  if (daten && daten.daten && Array.isArray(daten.daten.entries)) return daten.daten.entries;
  if (daten && Array.isArray(daten.list)) return daten.list;
  if (daten && Array.isArray(daten.data)) return daten.data;
  return [];
}

function serkalArchivExtractMeta_(daten) {
  if (!daten || typeof daten !== 'object' || Array.isArray(daten)) {
    return { source: 'legacy-array' };
  }

  if (daten.meta && typeof daten.meta === 'object') {
    return daten.meta;
  }

  if (daten.daten && daten.daten.meta && typeof daten.daten.meta === 'object') {
    return daten.daten.meta;
  }

  return {
    source: String(daten.source || ''),
    generatedAt: String(daten.generatedAt || ''),
    version: String(daten.version || '')
  };
}

function serkalArchivDateiIgnorieren_(name) {
  var n = String(name || '');
  var lower = n.toLowerCase();
  var indexName = String(SERKAL_ARCHIV_INDEX_NAME || 'serkal_archiv_index.json').toLowerCase();
  var logPrefix = String(SERKAL_LOG_FILE_PREFIX || '!!SerKal_LOG_').toLowerCase();

  if (!n) return true;
  if (lower === indexName) return true;
  if (lower.indexOf(logPrefix) === 0) return true;
  if (lower.indexOf('fanal_') === 0) return true;
  if (lower === 'manifest.json') return true;
  if (lower.lastIndexOf('.txt') !== lower.length - 4) return true;

  return false;
}

function serkalBaueArchivIndex_() {
  var folder = holeArchivFolder_();
  var files = folder.getFiles();
  var entries = [];
  var tz = Session.getScriptTimeZone();

  while (files.hasNext()) {
    var f = files.next();
    var name = String(f.getName() || '');

    if (serkalArchivDateiIgnorieren_(name)) continue;

    var base = name.replace(/\.txt$/i, '');
    var m = base.match(/^(.*)\s\((\d{4})\)$/);
    var titel = m ? String(m[1] || '').trim() : base;
    var jahr = m ? Number(m[2]) : null;

    var content = '';
    try {
      content = f.getBlob().getDataAsString('UTF-8') || '';
    } catch (eRead) {
      LOG_WARN('ARCHIV', 'Archivdatei konnte nicht gelesen werden', { fileName: name, error: skErr_(eRead) });
      continue;
    }

    var lines = content
      .split(/\r?\n/)
      .map(function (x) { return String(x || '').trim(); })
      .filter(Boolean);

    for (var i = 0; i < lines.length; i++) {
      var ln = lines[i];
      if (!/^S\d{1,2}(?:\b|;|\|)/i.test(ln)) continue;

      var parsed = serkalParseArchivZeile_(ln);
      if (!parsed || !parsed.staffelLabel) continue;

      var startOriginal = parsed.startOriginal || parsed.originalStartDate || '';
      var startDE = parsed.startDE || parsed.deStartDate || '';
      var activeDates = serkalBestimmeAktiveTermine_(parsed);
      var startDate = activeDates.length ? activeDates[0] : startOriginal;
      var endDate = activeDates.length ? activeDates[activeDates.length - 1] : startOriginal;
      var status = serkalBestimmeStatus_(parsed);
      var updated = f.getLastUpdated();

      entries.push({
        fileName: name,
        name: name,
        id: f.getId(),
        url: f.getUrl(),
        titel: titel,
        title: titel,
        jahr: jahr,
        year: jahr,
        staffelLabel: parsed.staffelLabel,
        seasonLabel: parsed.staffelLabel,
        staffel: parsed.staffelLabel,
        tmdbId: parsed.tmdbId || null,
        start: startDate || '',
        startDate: startDate || '',
        endDate: endDate || '',
        startOriginal: startOriginal || '',
        originalStartDate: startOriginal || '',
        startDE: startDE || '',
        deStartDate: startDE || '',
        episoden: parsed.episoden || parsed.eps || 0,
        eps: parsed.eps || parsed.episoden || 0,
        termindaten: Array.isArray(activeDates) ? activeDates : [],
        dates: Array.isArray(activeDates) ? activeDates : [],
        datesOriginal: Array.isArray(parsed.datesOriginal) ? parsed.datesOriginal : [],
        datesDE: Array.isArray(parsed.datesDE) ? parsed.datesDE : [],
        activeDates: Array.isArray(activeDates) ? activeDates : [],
        termCount: Array.isArray(activeDates) ? activeDates.length : 0,
        descDE: String(parsed.descDE || '').trim(),
        descEN: String(parsed.descEN || '').trim(),
        desc: String(parsed.descDE || parsed.descEN || '').trim(),
        note: String(parsed.note || '').trim(),
        flags: Number(parsed.flags || 0) || 0,
        buttonPressed: Number(parsed.buttonPressed || parsed.seen || 0) || 0,
        seen: Number(parsed.seen || parsed.buttonPressed || 0) || 0,
        status: status,
        statusText: serkalArchivStatusText_(status),
        raw: ln,
        updated: updated ? updated.toISOString() : '',
        updatedMs: updated ? updated.getTime() : 0,
        updatedText: updated ? Utilities.formatDate(updated, tz, 'dd.MM.yyyy HH:mm:ss') : ''
      });
    }
  }

  entries.sort(serkalArchivEntrySort_);

  var meta = {
    ok: true,
    source: 'rebuild',
    generatedAt: new Date().toISOString(),
    count: entries.length
  };

  try {
    serkalSchreibeArchivIndexDatei_(folder, entries, meta);
  } catch (eWrite) {
    LOG_WARN('ARCHIV', 'Archivindex konnte nicht geschrieben werden', { error: skErr_(eWrite) });
  }

  return {
    entries: entries,
    meta: meta
  };
}

function serkalArchivEntrySort_(a, b) {
  var da = a && a.startDate ? String(a.startDate) : '';
  var db = b && b.startDate ? String(b.startDate) : '';
  if (da && db && da !== db) return da < db ? -1 : 1;
  var ua = Number(a && a.updatedMs || 0);
  var ub = Number(b && b.updatedMs || 0);
  return ub - ua;
}

function serkalArchivStatusText_(status) {
  var s = String(status || '').toUpperCase();
  if (s === 'OK') return 'ok';
  if (s === 'WARTEN') return 'warten';

  var n = Number(status || 0);
  if (n === 1) return 'geplant';
  if (n === 2) return 'läuft';
  if (n === 3) return 'ungesehen';
  if (n === 4) return 'geschaut';
  if (n === 5) return 'fehler';
  return 'warten';
}

function serkalLeseArchivIndexDatei_(folder) {
  try {
    var targetFolder = folder || holeArchivFolder_();
    var indexName = String(SERKAL_ARCHIV_INDEX_NAME || 'serkal_archiv_index.json');
    var it = targetFolder.getFilesByName(indexName);

    if (!it.hasNext()) return null;

    var f = it.next();
    var txt = '';
    try { txt = f.getBlob().getDataAsString('UTF-8') || ''; } catch (_) { txt = ''; }
    if (!String(txt || '').trim()) return null;

    try {
      return JSON.parse(txt);
    } catch (e) {
      LOG_WARN('ARCHIV', 'Archivindex ungültig -> rebuild', { file: indexName, error: skErr_(e) });
      return null;
    }
  } catch (e2) {
    LOG_WARN('ARCHIV', 'Archivindex konnte nicht gelesen werden -> rebuild', { error: skErr_(e2) });
    return null;
  }
}

function serkalSchreibeArchivIndexDatei_(folderOrIndex, entriesMaybe, metaMaybe) {
  var folder;
  var entries;
  var meta;

  if (folderOrIndex && typeof folderOrIndex.getFilesByName === 'function') {
    folder = folderOrIndex;
    entries = Array.isArray(entriesMaybe) ? entriesMaybe : [];
    meta = metaMaybe || {};
  } else {
    folder = holeArchivFolder_();
    entries = serkalArchivExtractEntries_(folderOrIndex);
    meta = serkalArchivExtractMeta_(folderOrIndex);
  }

  var indexName = String(SERKAL_ARCHIV_INDEX_NAME || 'serkal_archiv_index.json');
  var payload = {
    ok: true,
    meta: meta || {},
    entries: Array.isArray(entries) ? entries : []
  };
  var text = JSON.stringify(payload, null, 2);
  var it = folder.getFilesByName(indexName);

  if (it.hasNext()) {
    it.next().setContent(text);
  } else {
    folder.createFile(indexName, text, MimeType.PLAIN_TEXT);
  }

  return payload;
}

function serkalArchivLeererIndex_(source) {
  return {
    entries: [],
    meta: {
      ok: true,
      source: String(source || 'empty'),
      generatedAt: new Date().toISOString(),
      count: 0
    }
  };
}

function serkalArchivHatSerienDateien_() {
  try {
    var folder = holeArchivFolder_();
    var files = folder.getFiles();
    while (files.hasNext()) {
      var f = files.next();
      var name = String(f.getName() || '');
      if (!serkalArchivDateiIgnorieren_(name)) return true;
    }
    return false;
  } catch (_) {
    return false;
  }
}

function serkalParseArchivZeile_(ln) {
  try {
    if (!ln) return null;

    var s = String(ln || '').trim();
    if (!s) return null;

    var labelMatch = s.match(/^(S\d{1,2})\s*(?:;|\|)/i);
    var out = {
      staffelLabel: labelMatch ? String(labelMatch[1] || '').toUpperCase() : '',
      start: '',
      startOriginal: '',
      startDE: '',
      originalStartDate: '',
      deStartDate: '',
      episoden: 0,
      eps: 0,
      tmdbId: null,
      termindaten: [],
      dates: [],
      termCount: 0,
      descDE: '',
      descEN: '',
      flags: 0,
      buttonPressed: 0,
      seen: 0,
      note: '',
      datesCompact: [],
      datesOriginal: [],
      datesDE: [],
      activeDates: [],
      deRule: '',
      offsetDE: 0,
      titelOriginal: '',
      titleOriginal: ''
    };

    out.startOriginal = serkalArchivFeldWert_(s, 'startOriginal') || serkalArchivFeldWert_(s, 'start');
    out.startDE = serkalArchivFeldWert_(s, 'startDE');
    out.originalStartDate = out.startOriginal;
    out.deStartDate = out.startDE;
    out.start = out.startOriginal || out.startDE || '';

    out.eps = Number(serkalArchivFeldWert_(s, 'eps') || 0) || 0;
    out.episoden = out.eps;

    out.tmdbId = Number(serkalArchivFeldWert_(s, 'tmdb') || 0) || null;
    out.flags = Number(serkalArchivFeldWert_(s, 'flags') || 0) || 0;
    out.buttonPressed = Number(serkalArchivFeldWert_(s, 'buttonPressed') || serkalArchivFeldWert_(s, 'seen') || 0) || 0;
    out.seen = out.buttonPressed;
    out.offsetDE = Number(serkalArchivFeldWert_(s, 'offsetDE') || 0) || 0;

    out.descDE = serkalDecodeField_(serkalArchivFeldWert_(s, 'descDE') || serkalArchivFeldWert_(s, 'ov_de'));
    out.descEN = serkalDecodeField_(serkalArchivFeldWert_(s, 'descEN') || serkalArchivFeldWert_(s, 'ov_en'));
    out.note = serkalDecodeField_(serkalArchivFeldWert_(s, 'note'));
    out.titelOriginal = serkalDecodeField_(serkalArchivFeldWert_(s, 'titleOriginal') || serkalArchivFeldWert_(s, 'titelOriginal'));
    out.titleOriginal = out.titelOriginal;

    out.datesCompact = serkalArchivCsvFeld_(s, 'dates');
    out.datesOriginal = serkalExpandCompactDateList_(out.datesCompact, out.startOriginal);
    out.datesDE = serkalExpandCompactDateList_(serkalArchivCsvFeld_(s, 'datesDE'), out.startDE);

    if (!out.datesDE.length && out.offsetDE && out.datesOriginal.length) {
      out.datesDE = serkalBuildDETermineFromShortDates_(out.datesOriginal, out.offsetDE);
    }

    out.activeDates = serkalBestimmeAktiveTermine_(out);
    out.termindaten = out.activeDates.slice();
    out.dates = out.activeDates.slice();
    out.termCount = out.activeDates.length;

    return out;
  } catch (e) {
    LOG_WARN('ARCHIV', 'serkalParseArchivZeile_ Fehler', { message: skErr_(e), line: ln });
    return null;
  }
}

function serkalArchivFeldWert_(line, key) {
  var k = serkalEscapeRegex_(String(key || ''));
  var rx = new RegExp('(?:^|[;|]\\s*)' + k + '=([^;|]*)', 'i');
  var m = String(line || '').match(rx);
  return m ? String(m[1] || '').trim() : '';
}

function serkalArchivCsvFeld_(line, key) {
  var raw = serkalArchivFeldWert_(line, key);
  if (!raw) return [];
  return String(raw || '').split(',').map(function (x) { return String(x || '').trim(); }).filter(Boolean);
}

function serkalBestimmeAktiveTermine_(entry) {
  if (!entry) return [];
  if (Array.isArray(entry.datesDE) && entry.datesDE.length) return entry.datesDE.slice();
  if (Array.isArray(entry.datesOriginal) && entry.datesOriginal.length) return entry.datesOriginal.slice();
  if (entry.startDE) return [String(entry.startDE)];
  if (entry.startOriginal) return [String(entry.startOriginal)];
  return [];
}

function serkalBestimmeStatus_(entry) {
  try {
    if (!entry) return 0;
    if (Number(entry.buttonPressed || entry.seen || 0) === 1) return 4;

    var dates = serkalBestimmeAktiveTermine_(entry);
    if (!dates.length) return 0;

    var start = serkalParseIsoDate_(dates[0]);
    var end = serkalParseIsoDate_(dates[dates.length - 1]);
    if (!start || !end) return 0;

    var today = new Date();
    today.setHours(0, 0, 0, 0);

    if (start > today) return 1;
    if (start <= today && end >= today) return 2;
    if (end < today) return 3;

    return 0;
  } catch (_) {
    return 5;
  }
}

function serkalParseIsoDate_(iso) {
  var m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  var d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return isNaN(d.getTime()) ? null : d;
}

function serkalCompactDateToken_(isoDate) {
  var m = String(isoDate || '').trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return String(isoDate || '').trim();
  return m[3] + '.' + m[2] + '.';
}

function serkalCompressDateList_(dates) {
  var arr = Array.isArray(dates) ? dates : [];
  return arr.map(function (d) { return serkalCompactDateToken_(d); }).filter(Boolean);
}

function serkalExpandCompactDateList_(tokens, startIso) {
  var arr = Array.isArray(tokens) ? tokens : [];
  var year = serkalArchivJahrAusIso_(startIso) || (new Date()).getFullYear();
  var lastMonth = 0;
  var out = [];

  for (var i = 0; i < arr.length; i++) {
    var token = String(arr[i] || '').trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(token)) {
      out.push(token);
      lastMonth = Number(token.substring(5, 7));
      continue;
    }

    var m = token.match(/^(\d{1,2})\.(\d{1,2})\.?$/);
    if (!m) continue;

    var day = Number(m[1]);
    var month = Number(m[2]);
    if (lastMonth && month < lastMonth) year++;
    lastMonth = month;

    out.push(
      String(year) + '-' +
      String(month).padStart(2, '0') + '-' +
      String(day).padStart(2, '0')
    );
  }

  return out;
}

function serkalArchivJahrAusIso_(iso) {
  var m = String(iso || '').match(/^(\d{4})-/);
  return m ? Number(m[1]) : 0;
}

function serkalBuildDETermineFromShortDates_(src, offsetDays) {
  var arr = Array.isArray(src) ? src : [];
  var off = Number(offsetDays || 0) || 0;
  return arr.map(function (d) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(d || ''))) return '';
    var dt = new Date(String(d) + 'T00:00:00');
    if (isNaN(dt.getTime())) return '';
    dt.setDate(dt.getDate() + off);
    return Utilities.formatDate(dt, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }).filter(Boolean);
}

function serkalLeseArchivZeile_(file, staffelLabel) {
  try {
    if (!file || !staffelLabel) return '';

    var txt = file.getBlob().getDataAsString('UTF-8') || '';
    var lines = txt.split(/\r?\n/);
    var prefixSemi = String(staffelLabel || '').trim() + ';';
    var prefixPipe = String(staffelLabel || '').trim() + '|';

    for (var i = 0; i < lines.length; i++) {
      var ln = String(lines[i] || '').trim();
      if (!ln) continue;
      if (ln.indexOf(prefixSemi) === 0 || ln.indexOf(prefixPipe) === 0) return ln;
    }

    return '';
  } catch (e) {
    LOG_WARN('ARCHIV', 'serkalLeseArchivZeile_ Fehler', { staffelLabel: staffelLabel, message: skErr_(e) });
    return '';
  }
}

function serkalSchreibeArchivZeile_(file, staffelLabel, zeileNeu) {
  var content = file.getBlob().getDataAsString('UTF-8') || '';
  var lines = content
    .split(/\r?\n/)
    .map(function (x) { return String(x || '').trim(); })
    .filter(Boolean);

  var rx = new RegExp('^' + serkalEscapeRegex_(staffelLabel) + '(?:\\b|;|\\|)', 'i');
  var out = [];
  var replaced = false;

  for (var i = 0; i < lines.length; i++) {
    var ln = lines[i];
    if (rx.test(ln)) {
      out.push(zeileNeu);
      replaced = true;
    } else {
      out.push(ln);
    }
  }

  if (!replaced) out.push(zeileNeu);

  out.sort(serkalArchivStaffelZeilenSort_);
  file.setContent(out.join('\n') + '\n');
}

function serkalArchivStaffelZeilenSort_(a, b) {
  var ma = String(a).match(/^S(\d+)/i);
  var mb = String(b).match(/^S(\d+)/i);
  var na = ma ? parseInt(ma[1], 10) : 9999;
  var nb = mb ? parseInt(mb[1], 10) : 9999;
  return na - nb;
}

function serkalUpsertFieldInArchivZeile_(line, key, value) {
  var s = String(line || '').trim();
  var k = String(key || '').trim();
  if (!s || !k) return s;

  var rx = new RegExp('([;|]\\s*)' + serkalEscapeRegex_(k) + '=([^;|]*)', 'ig');
  s = s.replace(rx, '');
  s = s.replace(/[;|]\s*[;|]/g, '; ').replace(/[;|]\s*$/, '').trim();

  if (value === null || value === undefined || String(value) === '') return s;
  return s + '; ' + k + '=' + String(value);
}


function parseNotesForDE_(noteText, startDate, originalDates) {
  try {
    var out = {
      termineDECompact: [],
      offsetDE: null,
      datesDE: [],
      startDE: '',
      rule: ''
    };

    var txt = String(noteText || '');
    if (!txt.trim()) return out;

    var mTerm = txt.match(/Termine\s*DE\s*:\s*([^\n]+)/i);
    if (mTerm) {
      out.termineDECompact = String(mTerm[1] || '')
        .split(',')
        .map(function (x) { return String(x || '').trim(); })
        .filter(Boolean);
    }

    var mOff = txt.match(/Offset\s*DE\s*:\s*(-?\d+)\s*d?/i);
    if (mOff) out.offsetDE = parseInt(mOff[1], 10);

    if (out.termineDECompact.length) {
      out.datesDE = serkalExpandCompactDateList_(out.termineDECompact, startDate || '');
      if (out.datesDE.length) out.startDE = out.datesDE[0];
      out.rule = 'TermineDE';
    } else if (out.offsetDE !== null && Array.isArray(originalDates) && originalDates.length) {
      out.datesDE = serkalBuildDETermineFromShortDates_(originalDates, out.offsetDE);
      if (out.datesDE.length) out.startDE = out.datesDE[0];
      out.rule = 'OffsetDE';
    }

    LOG_INFO('NOTES', 'parseNotesForDE', {
      hasTermineDE: out.termineDECompact.length > 0,
      termineCount: out.termineDECompact.length,
      offsetDE: out.offsetDE,
      rule: out.rule,
      startDE: out.startDE || ''
    });

    return out;
  } catch (e) {
    LOG_WARN('NOTES', 'parseNotesForDE Fehler', { message: skErr_(e) });
    return { termineDECompact: [], offsetDE: null, datesDE: [], startDE: '', rule: '' };
  }
}

function apiHoleArchivPoster(tmdbId, lang) {
  try {
    var id = Number(tmdbId || 0);
    if (!isFinite(id) || id <= 0) return { ok: false, message: 'tmdbId ungültig' };

    var folder = serkalHolePicCacheFolder_();
    var imgName = serkalPicCacheImageName_(id);
    var noPicName = serkalPicCacheNoPicName_(id);

    var noPicIt = folder.getFilesByName(noPicName);
    if (noPicIt.hasNext()) {
      return { ok: true, nopic: true, source: 'cache', cacheHit: true };
    }

    var imgIt = folder.getFilesByName(imgName);
    if (imgIt.hasNext()) {
      return {
        ok: true,
        nopic: false,
        source: 'cache',
        cacheHit: true,
        dataUrl: serkalBlobToDataUrl_(imgIt.next().getBlob())
      };
    }

    var tv = fetchTvDetailsFromTMDB_(id, lang || 'de');
    var posterPath = tv && tv.poster_path ? String(tv.poster_path) : '';

    if (!posterPath) {
      folder.createFile(noPicName, 'NO_PIC_AVAILABLE\n' + id, MimeType.PLAIN_TEXT);
      return { ok: true, nopic: true, source: 'tmdb', cacheHit: false };
    }

    var url = 'https://image.tmdb.org/t/p/' + String(SERKAL_PIC_CACHE_IMAGE_SIZE || 'w185') + posterPath;
    var resp = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    var code = resp.getResponseCode();

    if (code < 200 || code >= 300) {
      return { ok: false, message: 'Poster HTTP ' + code, source: 'tmdb' };
    }

    var blob = resp.getBlob().setName(imgName);
    folder.createFile(blob);

    return {
      ok: true,
      nopic: false,
      source: 'tmdb',
      cacheHit: false,
      dataUrl: serkalBlobToDataUrl_(blob)
    };
  } catch (e) {
    LOG_WARN('ARCHIV', 'apiHoleArchivPoster Fehler', { tmdbId: tmdbId, message: skErr_(e) });
    return { ok: false, message: skErr_(e) };
  }
}

function verarbeiteAuswahlDaten(payload) {
  traceGS_('verarbeiteAuswahlDaten EINGANG', payload || {});

  try {
    var d = payload || {};
    var titel = String(d.titel || d.title || d.name || '').trim();
    if (!titel) return { ok: false, message: 'Titel fehlt.' };

    var jahr = (d.jahr != null && d.jahr !== '') ? Number(d.jahr) : '';
    if (!isFinite(jahr)) jahr = '';

    var staffelNummer = null;
    if (d.staffelNummer != null && d.staffelNummer !== '') {
      staffelNummer = Number(d.staffelNummer);
    } else if (d.staffelLabel != null && d.staffelLabel !== '') {
      var mLabel = String(d.staffelLabel).match(/(\d+)/);
      if (mLabel) staffelNummer = Number(mLabel[1]);
    } else if (d.staffel != null && d.staffel !== '') {
      var mStaffel = String(d.staffel).match(/(\d+)/);
      if (mStaffel) staffelNummer = Number(mStaffel[1]);
    }
    if (!isFinite(staffelNummer) || staffelNummer <= 0) staffelNummer = null;

    var staffelLabel = staffelNummer ? ('S' + pad2_(staffelNummer)) : 'S00';

    var episoden = null;
    if (d.episoden != null && d.episoden !== '') episoden = Number(d.episoden);
    else if (d.episodes != null && d.episodes !== '') episoden = Number(d.episodes);
    else if (d.episodeCount != null && d.episodeCount !== '') episoden = Number(d.episodeCount);
    else if (Array.isArray(d.episodesArr) && d.episodesArr.length) episoden = d.episodesArr.length;
    if (!isFinite(episoden) || episoden < 0) episoden = 0;

    var tmdbId = null;
    if (d.tmdbId != null && d.tmdbId !== '') tmdbId = Number(d.tmdbId);
    else if (d.id != null && d.id !== '') tmdbId = Number(d.id);
    else if (d.seriesId != null && d.seriesId !== '') tmdbId = Number(d.seriesId);
    if (!isFinite(tmdbId) || tmdbId <= 0) tmdbId = null;

    var termindaten = Array.isArray(d.termindaten) ? d.termindaten : [];
    termindaten = termindaten
      .map(function (x) { return String(x || ''); })
      .filter(function (x) { return /^\d{4}-\d{2}-\d{2}$/.test(x); });

    var start = termindaten.length ? termindaten[0] : '';
    var descDE = String(d.descDE || d.overviewDE || '').trim();
    var descEN = String(d.descEN || d.overviewEN || '').trim();

    if ((!descDE || !descEN) && tmdbId && typeof serkalHoleBeschreibungenMehrsprachigByTmdbId_ === 'function') {
      var descPackFill = serkalHoleBeschreibungenMehrsprachigByTmdbId_(tmdbId);
      if (!descDE) descDE = String(descPackFill && descPackFill.descDE || '').trim();
      if (!descEN) descEN = String(descPackFill && descPackFill.descEN || '').trim();
    }

    if (!jahr) {
      var jCand = String(d.jahr || d.year || d.seriesYear || d.firstAirYear || d.releaseYear || '').trim();
      if (!/^\d{4}$/.test(jCand)) {
        var fa = String(d.firstAirDate || d.first_air_date || d.seriesStart || d.start || '').trim();
        if (/^\d{4}-\d{2}-\d{2}$/.test(fa)) jCand = fa.slice(0, 4);
      }
      if (/^\d{4}$/.test(jCand)) jahr = Number(jCand);
    }

    if (!staffelNummer || (!termindaten.length && !episoden && String(d.dateFlag || '').trim() !== 'ANNOUNCED')) {
      var snapshot = {
        titel: titel,
        jahr: jahr || null,
        staffelNummer: staffelNummer,
        episoden: episoden ? episoden : '',
        staffelLabel: staffelLabel,
        termindaten: termindaten,
        tmdbId: tmdbId
      };
      LOG_ERROR('FLOW', 'Direkteintrag abgebrochen: eintrag unvollständig: ' + safeJson_(snapshot));
      return { ok: false, message: 'Eintrag unvollständig (Staffel/Termine/Episoden fehlen).' };
    }

    var fileName = baueFileName_(titel, jahr);
    var folder = holeArchivFolder_();
    var it = folder.getFilesByName(fileName);
    var file = it.hasNext() ? it.next() : folder.createFile(fileName, '', MimeType.PLAIN_TEXT);

    var alteZeile = serkalLeseArchivZeile_(file, staffelLabel);
    var alt = serkalParseArchivZeile_(alteZeile);
    var oldFlags = Number(alt && alt.flags || 0);
    var flags = oldFlags || 0;
    if (descDE && descEN) flags = flags | 32;

    var neu = {
      staffelLabel: staffelLabel,
      start: start,
      episoden: Number(episoden || 0),
      termindaten: termindaten.slice(),
      termCount: (typeof serkalBaueStaffelBloecke_ === 'function') ? serkalBaueStaffelBloecke_(termindaten).length : termindaten.length,
      tmdbId: tmdbId,
      descDE: descDE,
      descEN: descEN,
      flags: flags
    };

    var altDates = Array.isArray(alt && alt.termindaten) ? alt.termindaten.join(',') : '';
    var neuDates = Array.isArray(neu.termindaten) ? neu.termindaten.join(',') : '';
    var g1Changed = false;

    if (alt) {
      g1Changed = (
        String(alt.start || '') !== String(neu.start || '') ||
        Number((alt.episoden != null ? alt.episoden : alt.eps) || 0) !== Number(neu.episoden || 0) ||
        altDates !== neuDates
      );
    }

    LOG_INFO('G1', 'Änderungsprüfung: ' + titel + ' (' + jahr + ') ' + staffelLabel, {
      altExists: !!alt,
      oldStart: alt ? String(alt.start || '') : '',
      newStart: String(neu.start || ''),
      oldEpisodes: alt ? Number((alt.episoden != null ? alt.episoden : alt.eps) || 0) : 0,
      newEpisodes: Number(neu.episoden || 0),
      oldDates: altDates,
      newDates: neuDates,
      g1Changed: g1Changed
    });

    if (alt && g1Changed) {
      try {
        serkalLoescheKalenderEventsZurStaffel_(titel, jahr, staffelLabel, alt.termindaten || []);
      } catch (eDel) {
        LOG_WARN('G1', 'Kalender-Alteinträge konnten nicht gelöscht werden', { message: skErr_(eDel) });
      }
    }

    if (!alt || g1Changed) {
      try {
        trageStaffelDirektInKalenderEin({
          titel: titel,
          jahr: jahr,
          staffelNummer: staffelNummer,
          termindaten: termindaten
        });
        LOG_INFO('G1', 'Kalender-Neueintrag abgeschlossen: ' + titel + ' (' + jahr + ') ' + staffelLabel + ' / Blocktermine=' + neu.termCount);
      } catch (eCal) {
        LOG_ERROR('G1', 'Kalender-Sync Fehler: ' + skErr_(eCal));
      }
    }

    var parts = [];
    parts.push(staffelLabel);
    if (start) parts.push('startOriginal=' + start);
    if (episoden) parts.push('eps=' + episoden);
    if (tmdbId) parts.push('tmdb=' + tmdbId);
    if (titel) parts.push('titleOriginal=' + serkalEncodeField_(titel));
    if (termindaten.length) parts.push('dates=' + serkalCompressDateList_(termindaten).join(','));
    if (descDE) parts.push('descDE=' + serkalEncodeField_(descDE));
    if (descEN) parts.push('descEN=' + serkalEncodeField_(descEN));
    parts.push('flags=' + String(flags || 0));

    var zeile = parts.join('; ');
    serkalSchreibeArchivZeile_(file, staffelLabel, zeile);
    serkalBaueArchivIndex_();

    var logKurz = [
      staffelLabel,
      start ? ('startOriginal=' + start) : '',
      episoden ? ('eps=' + episoden) : '',
      tmdbId ? ('tmdb=' + tmdbId) : '',
      termindaten.length ? ('dates=' + serkalCompressDateList_(termindaten).join(',')) : '',
      'descDE=' + (descDE ? 'vorhanden' : 'fehlt'),
      'descEN=' + (descEN ? 'vorhanden' : 'fehlt'),
      'flags=' + String(flags || 0)
    ].filter(Boolean).join('; ');

    LOG_INFO('FLOW', 'Archiv upsert OK: ' + fileName + ' :: ' + logKurz);

    var result = {
      ok: true,
      message: 'OK: ' + titel + ' ' + staffelLabel,
      fileName: fileName,
      staffelLabel: staffelLabel
    };

    traceGS_('verarbeiteAuswahlDaten AUSGANG', result);
    return result;
  } catch (e) {
    LOG_ERROR('FLOW', 'verarbeiteAuswahlDaten Fehler: ' + skErr_(e));
    var errResult = { ok: false, message: skErr_(e) };
    traceGS_('verarbeiteAuswahlDaten FEHLER', errResult);
    return errResult;
  }
}

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

      var mLegacyStart = line.match(/(?:^|[;|]\s*)start=([^;|]+)/i);
      if (mLegacyStart && !/(?:^|[;|]\s*)startOriginal=/.test(line)) {
        line = serkalUpsertFieldInArchivZeile_(line, 'startOriginal', String(mLegacyStart[1] || '').trim());
        line = line.replace(/(?:^|[;|]\s*)start=[^;|]+/i, '');
        line = line.replace(/^\s*[;|]\s*/, '').replace(/\s*[;|]\s*[;|]\s*/g, '; ').trim();
      }

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

function apiLoescheArchivEintrag(req) {
  return loescheArchivStaffel(req);
}

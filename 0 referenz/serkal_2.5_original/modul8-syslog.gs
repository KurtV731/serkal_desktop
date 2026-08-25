/*
  modul8-syslog 
  SK25_B01
  Stand: 2026-05-19

  Herkunft:
    - Ziel: Modul 8 als eigenständiger, zusammenhängender Austauschblock

  Abhängigkeiten aus Userconfig / Modul 1:
  - SERKAL_VERSION
  - SERKAL_LOG_LEVEL
  - SERKAL_ARCHIV_FOLDER_ID
  - SERKAL_LOG_FOLDER_ID
  - SERKAL_LOG_FILE_PREFIX
  - SERKAL_LOG_FILE_EXT
  - FANAL_OUTPUT_FOLDER_ID

  Grundregeln:
  - Logging darf niemals den eigentlichen Programmablauf stoppen.
  - Sheet-Logging wird nicht weiter ausgebaut.
  - Google-spezifische Dateioperationen bleiben in Adapterfunktionen gekapselt.
  - Altwege bleiben stillgelegt, nicht gelöscht.
*/

/*
  Funktionsübersicht Modul 8

  8.00 Öffentliche Log-API / Basis
  - LOG_INFO(tag, msg, obj)
  - LOG_WARN(tag, msg, obj)
  - LOG_ERROR(tag, msg, obj)
  - apiLogUserAction(action, data)
  - skErr_(e)
  - safeJson_(obj)

  8.01 Zentrale Logsteuerung
  - skLog_(level, tag, msg, obj)
  - serkalShouldWriteLog_(level, tag, text)

  8.02 Log-Datenmodell
  - serkalLogBuildEntry_(level, tag, text, obj)
  - serkalLogEntryToLine_(entry)
  - serkalLogSanitizeCell_(value)

  8.03 TXT-Speicheradapter
  - serkalLogWrite_(entry)
  - serkalLogGetTodayFile_()
  - serkalLogGetOrCreateFileByName_(name)
  - serkalLogHeaderForDate_(isoDate)
  - serkalLogContentBelongsToDate_(content, isoDate)
  - serkalLogWeekdaySuffix_(dow)

  8.04 UI-API / Log lesen + Test
  - apiHoleLogZeilen(limit)
  - serkalLogReadAllTxtLines_()
  - serkalLogParseTxtContent_(content, fileName)
  - serkalLogSortKey_(datum, zeitOnly)
  - apiTesteTxtLogSystem()

  8.05 UI-API / Log schreiben
  - apiLoescheHeutigesLog()
  - apiSpeichereHeutigesLogText(text) – aktiv für UI-Logfenster-Rückschreiben

  8.06 Fanal / Diagnose
  - apiHoleFanalAnalyseStatus()
  - apiHoleFanalHtmlReport()
  - apiOeffneFanalHtmlDialog()
  - serkalFanalFindLatestKind_(files, kind)
  - serkalFanalFileKind_(name)
  - serkalSafeGetFileSize_(file)
*/

/* =====================================================================
   8.00 – Öffentliche Log-API / Basis
   ===================================================================== */

/**
 * @id 8.00.001
 * @funktion LOG_INFO
 * @modul 8 System / Logging / Diagnose
 * @gruppe Öffentliche Log-API
 * @zweck Schreibt einen INFO-Eintrag in das zentrale SerKal-TXT-Log.
 * @status aktiv
 * @hinweis Einziger öffentlicher INFO-Einstieg; intern an skLog_ delegiert.
 * @loeschung nein
 */
function LOG_INFO(tag, msg, obj) {
  skLog_('INFO', tag, msg, obj);
}

/**
 * @id 8.00.002
 * @funktion LOG_WARN
 * @modul 8 System / Logging / Diagnose
 * @gruppe Öffentliche Log-API
 * @zweck Schreibt einen WARN-Eintrag in das zentrale SerKal-TXT-Log.
 * @status aktiv
 * @hinweis Warnungen bleiben unabhängig vom Log-Level sichtbar.
 * @loeschung nein
 */
function LOG_WARN(tag, msg, obj) {
  skLog_('WARN', tag, msg, obj);
}

/**
 * @id 8.00.003
 * @funktion LOG_ERROR
 * @modul 8 System / Logging / Diagnose
 * @gruppe Öffentliche Log-API
 * @zweck Schreibt einen ERROR-Eintrag in das zentrale SerKal-TXT-Log.
 * @status aktiv
 * @hinweis Fehler bleiben unabhängig vom Log-Level sichtbar.
 * @loeschung nein
 */
function LOG_ERROR(tag, msg, obj) {
  skLog_('ERROR', tag, msg, obj);
}

/**
 * @id 8.00.004
 * @funktion apiLogUserAction
 * @modul 8 System / Logging / Diagnose
 * @gruppe UI-Aktionen
 * @eingabe action:String, data:Object
 * @ausgabe Object { ok:Boolean }
 * @zweck Protokolliert bewusste Nutzeraktionen aus der UI im zentralen TXT-Log.
 * @status aktiv
 * @hinweis UI-Logging bleibt zentral; kein Sheet- oder Logger-Sonderweg.
 * @loeschung nein
 */
function apiLogUserAction(action, data) {
  try {
    var act = String(action || '').trim();
    if (!act) act = 'Unbenannte Aktion';

    var payload = {};
    if (data && typeof data === 'object') {
      try {
        payload = JSON.parse(JSON.stringify(data));
      } catch (_) {
        payload = { value: String(data) };
      }
    } else if (data !== undefined && data !== null && data !== '') {
      payload = { value: String(data) };
    }

    payload.source = payload.source || 'UI';
    LOG_INFO('AKTION', act, payload);
    return { ok: true, action: act };

  } catch (e) {
    try {
      LOG_WARN('AKTION', 'apiLogUserAction fehlgeschlagen', {
        action: String(action || ''),
        error: skErr_(e)
      });
    } catch (_) {}

    return {
      ok: false,
      action: String(action || ''),
      error: skErr_(e)
    };
  }
}

/**
 * @id 8.00.090
 * @funktion skErr_
 * @modul 8 System / Logging / Diagnose
 * @gruppe Basishelfer / Fehlertext
 * @zweck Wandelt Fehlerobjekte robust in kurzen Text um; bewusst ohne externe Abhängigkeiten.
 * @status aktiv
 * @hinweis Muss im Logmodul selbst vorhanden sein, weil Fehlerausgaben sonst ausgerechnet beim Logging scheitern können.
 * @loeschung nein
 */
function skErr_(e) {
  try {
    if (!e) return 'unknown';
    if (typeof e === 'string') return e;

    var n = e.name ? String(e.name) : 'Error';
    var m = e.message ? String(e.message) : String(e);

    return n + ': ' + m;

  } catch (_) {
    return 'Error';
  }
}

/**
 * @id 8.00.091
 * @funktion safeJson_
 * @modul 8 System / Logging / Diagnose
 * @gruppe Basishelfer / JSON
 * @zweck Serialisiert Log-Zusatzdaten, ohne dass nicht serialisierbare Objekte das Logging abbrechen.
 * @status aktiv
 * @hinweis Kritisch für skLog_: fehlt diese Funktion, werden normale Logeinträge still verschluckt.
 * @loeschung nein
 */
function safeJson_(obj) {
  try {
    if (obj == null) return '';
    return JSON.stringify(obj);

  } catch (_) {
    return '"<unserializable>"';
  }
}

/* =====================================================================
   8.01 – Zentrale Logsteuerung
   ===================================================================== */

/**
 * @id 8.01.001
 * @funktion skLog_
 * @modul 8 System / Logging / Diagnose
 * @gruppe Zentrale Logsteuerung
 * @zweck Zentrale Sammelstelle für alle SerKal-Logmeldungen; entscheidet über Filterung und Weitergabe an den TXT-Adapter.
 * @status aktiv
 * @hinweis Schreibt bewusst nicht mehr regulär in LOG-Sheet oder Logger.log. Ziel ist ein einziger Logweg.
 * @loeschung nein
 */
function skLog_(level, tag, msg, obj) {
  try {
    var lvl = String(level || 'INFO').toUpperCase();
    var tg = String(tag || '');
    var text = String(msg || '');

    if (!serkalShouldWriteLog_(lvl, tg, text)) return;

    var entry = serkalLogBuildEntry_(lvl, tg, text, obj);
    serkalLogWrite_(entry);

  } catch (_) {
    // Logging darf niemals das eigentliche Programm stoppen.
  }
}

/**
 * @id 8.01.002
 * @funktion serkalShouldWriteLog_
 * @modul 8 System / Logging / Diagnose
 * @gruppe Zentrale Logsteuerung
 * @zweck Entscheidet zentral, welche Meldungen im normalen Betriebslog erscheinen.
 * @status aktiv
 * @hinweis TRACE bleibt als Werkzeug erhalten, ist aber im Normalbetrieb aus.
 * @loeschung nein
 */
function serkalShouldWriteLog_(level, tag, text) {
  try {
    var mode = String(typeof SERKAL_LOG_LEVEL !== 'undefined' ? SERKAL_LOG_LEVEL : 'NORMAL').toUpperCase();
    var lvl = String(level || 'INFO').toUpperCase();
    var tg = String(tag || '').toUpperCase();
    var tx = String(text || '');
    var txU = tx.toUpperCase();

    if (lvl === 'ERROR' || lvl === 'WARN') return true;

    if (tg.indexOf('TRACE') !== -1 || txU.indexOf('TRACE') !== -1) {
      return mode === 'TRACE';
    }

    if (mode === 'MINIMAL') return false;
    if (mode === 'TRACE') return true;
    if (mode === 'DEBUG') return true;

    if (tg === 'BOOT') return true;
    if (tg === 'AKTION') return true;

    if (tg === 'UI' && txU.indexOf('VIEWPORT') !== -1) return true;
    if (tg === 'UI' && txU.indexOf('ARCHIV LADEN') !== -1) return true;
    if (tg === 'UI' && txU.indexOf('START') !== -1) return true;

    if (txU.indexOf(' START') !== -1 || txU.indexOf('START ') !== -1 || txU === 'START') return true;
    if (txU.indexOf(' ENDE') !== -1 || txU.indexOf('ENDE ') !== -1 || txU === 'ENDE') return true;
    if (txU.indexOf('ABGESCHLOSSEN') !== -1) return true;
    if (txU.indexOf('GELADEN') !== -1 && (tg === 'ARCHIV' || tg === 'UI')) return true;

    return false;

  } catch (_) {
    return false;
  }
}

/* =====================================================================
   8.02 – Log-Datenmodell
   ===================================================================== */

/**
 * @id 8.02.001
 * @funktion serkalLogBuildEntry_
 * @modul 8 System / Logging / Diagnose
 * @gruppe Log-Datenmodell
 * @zweck Baut aus einer Logmeldung ein neutrales Datenobjekt, bevor ein Speicheradapter es schreibt.
 * @status aktiv
 * @hinweis Absichtlich frei von DriveApp/SpreadsheetApp, damit später Node.js-fähig.
 * @loeschung nein
 */
function serkalLogBuildEntry_(level, tag, text, obj) {
  var now = new Date();
  var tz = Session.getScriptTimeZone();

  return {
    date: Utilities.formatDate(now, tz, 'yyyy-MM-dd'),
    time: Utilities.formatDate(now, tz, 'HH:mm:ss'),
    displayDate: Utilities.formatDate(now, tz, 'dd.MM.yyyy'),
    displayTime: Utilities.formatDate(now, tz, 'HH:mm:ss'),
    level: String(level || 'INFO').toUpperCase(),
    tag: String(tag || ''),
    text: String(text || ''),
    objekt: obj ? safeJson_(obj) : ''
  };
}

/**
 * @id 8.02.002
 * @funktion serkalLogEntryToLine_
 * @modul 8 System / Logging / Diagnose
 * @gruppe Log-Datenmodell
 * @zweck Wandelt einen Logeintrag in eine tabgetrennte Textzeile um.
 * @status aktiv
 * @hinweis Format bleibt absichtlich schlicht: Datum/Zeit/Level/Tag/Text/Objekt.
 * @loeschung nein
 */
function serkalLogEntryToLine_(entry) {
  var e = entry || {};

  return [
    String(e.displayDate || ''),
    String(e.displayTime || ''),
    String(e.level || ''),
    String(e.tag || ''),
    serkalLogSanitizeCell_(e.text),
    serkalLogSanitizeCell_(e.objekt)
  ].join('\t');
}

/**
 * @id 8.02.003
 * @funktion serkalLogSanitizeCell_
 * @modul 8 System / Logging / Diagnose
 * @gruppe Log-Datenmodell
 * @zweck Entfernt Zeilenumbrüche aus einzelnen Logfeldern, damit jede Meldung genau eine Textzeile bleibt.
 * @status aktiv
 * @hinweis Tabs werden durch Leerzeichen ersetzt; das hält die UI-Auswertung stabil.
 * @loeschung nein
 */
function serkalLogSanitizeCell_(value) {
  return String(value == null ? '' : value)
    .replace(/[\r\n]+/g, ' ')
    .replace(/\t/g, ' ')
    .trim();
}

/* =====================================================================
   8.03 – TXT-Speicheradapter
   ===================================================================== */

/**
 * @id 8.03.001
 * @funktion serkalLogWrite_
 * @modul 8 System / Logging / Diagnose
 * @gruppe Log-Speicheradapter
 * @zweck Schreibt einen vorbereiteten Eintrag in die aktuelle Tages-TXT-Datei.
 * @status aktiv
 * @hinweis Google-Drive-Adapter; bei Node.js später durch fs-Adapter ersetzbar.
 * @loeschung nein
 */
function serkalLogWrite_(entry) {
  try {
    var lock = null;

    try {
      lock = LockService.getScriptLock();
      lock.waitLock(3000);
    } catch (_) {
      lock = null;
    }

    try {
      var file = serkalLogGetTodayFile_();
      var existing = '';

      try {
        existing = file.getBlob().getDataAsString('UTF-8');
      } catch (_) {
        existing = '';
      }

      var today = String(entry && entry.date || '');
      var line = serkalLogEntryToLine_(entry);
      var newContent = '';

      if (!serkalLogContentBelongsToDate_(existing, today)) {
        newContent = serkalLogHeaderForDate_(today) + '\n' + line + '\n';
      } else {
        newContent = String(existing || '').replace(/\s*$/g, '');
        newContent = (newContent ? newContent + '\n' : serkalLogHeaderForDate_(today) + '\n') + line + '\n';
      }

      file.setContent(newContent);

    } finally {
      try {
        if (lock) lock.releaseLock();
      } catch (_) {}
    }

  } catch (_) {
    // Logging darf niemals das eigentliche Programm stoppen.
  }
}

/**
 * @id 8.03.002
 * @funktion serkalLogGetTodayFile_
 * @modul 8 System / Logging / Diagnose
 * @gruppe Log-Speicheradapter
 * @zweck Ermittelt oder erzeugt die TXT-Logdatei für den aktuellen Wochentag.
 * @status aktiv
 * @hinweis Wochentagsdatei wird wiederverwendet; Rotation geschieht beim Schreiben über Datumsprüfung.
 * @loeschung nein
 */
function serkalLogGetTodayFile_() {
  var date = new Date();

  // JavaScript: 0=So, 1=Mo ... 6=Sa.
  var jsDow = date.getDay();
  var dow = (jsDow === 0) ? 7 : jsDow; // 1=Mo ... 7=So
  var suffix = serkalLogWeekdaySuffix_(dow);

  return serkalLogGetOrCreateFileByName_(SERKAL_LOG_FILE_PREFIX + suffix + SERKAL_LOG_FILE_EXT);
}

/**
 * @id 8.03.003
 * @funktion serkalLogGetOrCreateFileByName_
 * @modul 8 System / Logging / Diagnose
 * @gruppe Log-Speicheradapter
 * @zweck Sucht eine Logdatei im Logordner oder legt sie bei Bedarf neu an.
 * @status aktiv
 * @hinweis Der Logordner ist über SERKAL_LOG_FOLDER_ID gekapselt.
 * @loeschung nein
 */
function serkalLogGetOrCreateFileByName_(name) {
  var folder = serkalHoleLogFolder_();
  var files = folder.getFilesByName(name);

  if (files.hasNext()) return files.next();

  return folder.createFile(name, '', MimeType.PLAIN_TEXT);
}

/**
 * @id 8.03.004
 * @funktion serkalLogHeaderForDate_
 * @modul 8 System / Logging / Diagnose
 * @gruppe Log-Speicheradapter
 * @zweck Erzeugt den Kopf einer Tageslogdatei mit maschinenlesbarem Datum.
 * @status aktiv
 * @hinweis Die erste Zeile entscheidet, ob eine Wochentagsdatei zur aktuellen Woche gehört oder überschrieben wird.
 * @loeschung nein
 */
function serkalLogHeaderForDate_(isoDate) {
  return '# SerKal Log ' + String(isoDate || '') + ' | Format: Datum\\tZeit\\tLevel\\tTag\\tText\\tObjekt';
}

/**
 * @id 8.03.005
 * @funktion serkalLogContentBelongsToDate_
 * @modul 8 System / Logging / Diagnose
 * @gruppe Log-Speicheradapter
 * @zweck Prüft, ob eine vorhandene Tagesdatei bereits zum aktuellen Datum gehört.
 * @status aktiv
 * @hinweis Bei altem Datum wird ohne Rückfrage rotiert/überschrieben.
 * @loeschung nein
 */
function serkalLogContentBelongsToDate_(content, isoDate) {
  var txt = String(content || '');
  if (!txt.trim()) return true;

  var firstLine = txt.split(/\r?\n/)[0] || '';
  return firstLine.indexOf('# SerKal Log ' + String(isoDate || '')) === 0;
}

/**
 * @id 8.03.006
 * @funktion serkalLogWeekdaySuffix_
 * @modul 8 System / Logging / Diagnose
 * @gruppe Log-Speicheradapter
 * @zweck Liefert den deutschen Kurzsuffix für die sieben Logdateien.
 * @status aktiv
 * @hinweis 1=mo, 2=di, 3=mi, 4=do, 5=fr, 6=sa, 7=so.
 * @loeschung nein
 */
function serkalLogWeekdaySuffix_(dow) {
  var arr = ['mo', 'di', 'mi', 'do', 'fr', 'sa', 'so'];
  var n = Number(dow || 0);

  if (n < 1 || n > 7) n = 1;

  return arr[n - 1];
}


/**
 * @id 8.03.007
 * @funktion serkalIstGueltigeDriveFolderId_
 * @modul 8 System / Logging / Diagnose
 * @gruppe Log-Speicheradapter
 * @zweck Prüft, ob eine Drive-Ordner-ID gesetzt ist und nicht nur ein Installer-Platzhalter ist.
 * @status aktiv
 * @hinweis Verhindert DriveApp.getFolderById-Fehler bei noch nicht eingerichteten Installer-Ständen.
 * @loeschung nein
 */
function serkalIstGueltigeDriveFolderId_(id) {
  var s = String(id || '').trim();

  if (!s) return false;
  if (s.indexOf('/') !== -1) return false;
  if (/^enter\b/i.test(s)) return false;
  if (/to be filled/i.test(s)) return false;
  if (/gd code/i.test(s)) return false;
  if (/dd code/i.test(s)) return false;

  return /^[A-Za-z0-9_-]{20,}$/.test(s);
}

/**
 * @id 8.03.008
 * @funktion serkalHoleLogFolder_
 * @modul 8 System / Logging / Diagnose
 * @gruppe Log-Speicheradapter
 * @zweck Liefert den Logordner oder wirft eine freundliche, UI-taugliche Konfigurationsmeldung.
 * @status aktiv
 * @hinweis Logordner kann eigener Ordner oder Archivordner-Fallback sein.
 * @loeschung nein
 */
function serkalHoleLogFolder_() {
  var id = String(SERKAL_LOG_FOLDER_ID || SERKAL_ARCHIV_FOLDER_ID || '').trim();

  if (!serkalIstGueltigeDriveFolderId_(id)) {
    throw new Error(
      'Logordner ist noch nicht eingerichtet.\n' +
      'Bitte zuerst die Google-Drive-Ordner im Installer oder in der Userconfig einrichten.'
    );
  }

  try {
    return DriveApp.getFolderById(id);
  } catch (e) {
    throw new Error(
      'Logordner konnte nicht geöffnet werden.\n' +
      'Bitte die Log-/Archivordner-ID in der Userconfig prüfen.\n' +
      skErr_(e)
    );
  }
}

/**
 * @id 8.06.010
 * @funktion serkalHoleFanalOutputFolder_
 * @modul 8 System / Logging / Diagnose
 * @gruppe Fanal / Diagnose
 * @zweck Liefert den Fanal-Ausgabeordner oder eine freundliche Meldung bei fehlender Einrichtung.
 * @status aktiv
 * @hinweis Der Analyse-Button bleibt sichtbar; fehlende Einrichtung wird freundlich gemeldet.
 * @loeschung nein
 */
function serkalHoleFanalOutputFolder_() {
  var id = String(FANAL_OUTPUT_FOLDER_ID || '').trim();

  if (!serkalIstGueltigeDriveFolderId_(id)) {
    throw new Error(
      'Die Analyse-Funktion ist noch nicht eingerichtet.\n' +
      'Bitte Fanal-Zusatzpaket installieren.'
    );
  }

  try {
    return DriveApp.getFolderById(id);
  } catch (e) {
    throw new Error(
      'Fanal-Ausgabeordner konnte nicht geöffnet werden.\n' +
      'Bitte die FANAL_OUTPUT_FOLDER_ID prüfen.\n' +
      skErr_(e)
    );
  }
}

/* =====================================================================
   8.04 – UI-API / Log lesen + Test
   ===================================================================== */

/**
 * @id 8.04.001
 * @funktion apiHoleLogZeilen
 * @modul 8 System / Logging / Diagnose
 * @gruppe UI-API / Log lesen
 * @zweck Liefert Logzeilen aus genau einer Tageslogdatei an das UI-Logfenster.
 * @status aktiv
 * @hinweis Zweiter Parameter day: today|mo|di|mi|do|fr|sa|so. Ohne day wird weiterhin heute geladen.
 * @loeschung nein
 */
function apiHoleLogZeilen(limit, day) {
  try {
    var n = Math.max(10, Math.min(500, Number(limit || 120) || 120));
    var suffix = serkalLogResolveDaySuffix_(day);
    var lines = serkalLogReadTxtLinesForDay_(suffix);

    if (lines.length > n) {
      lines = lines.slice(lines.length - n);
    }

    return {
      ok: true,
      lines: lines,
      count: lines.length,
      source: 'TXT_DAY',
      day: suffix,
      fileName: SERKAL_LOG_FILE_PREFIX + suffix + SERKAL_LOG_FILE_EXT
    };

  } catch (e) {
    return {
      ok: false,
      message: skErr_(e),
      lines: [],
      source: 'TXT_DAY',
      day: String(day || '')
    };
  }
}

/**
 * @id 8.04.002
 * @funktion serkalLogReadAllTxtLines_
 * @modul 8 System / Logging / Diagnose
 * @gruppe UI-API / Log lesen
 * @zweck Kompatibilitätshelfer: liest weiterhin alle vorhandenen Tageslogs, wird aber vom UI nicht mehr standardmäßig genutzt.
 * @status aktiv
 * @hinweis Für Diagnose/Altpfade behalten; Logfenster nutzt apiHoleLogZeilen(limit, day).
 * @loeschung nein
 */
function serkalLogReadAllTxtLines_() {
  var out = [];
  var suffixes = ['mo', 'di', 'mi', 'do', 'fr', 'sa', 'so'];

  for (var i = 0; i < suffixes.length; i++) {
    var arr = serkalLogReadTxtLinesForDay_(suffixes[i]);
    for (var j = 0; j < arr.length; j++) {
      out.push(arr[j]);
    }
  }

  out.sort(function(a, b) {
    var ka = String(a.sortKey || '');
    var kb = String(b.sortKey || '');

    if (ka < kb) return -1;
    if (ka > kb) return 1;
    return 0;
  });

  return out;
}

/**
 * @id 8.04.006
 * @funktion serkalLogReadTxtLinesForDay_
 * @modul 8 System / Logging / Diagnose
 * @gruppe UI-API / Log lesen
 * @zweck Liest genau eine Wochentags-Logdatei und gibt UI-kompatible Zeilen zurück.
 * @status aktiv
 * @loeschung nein
 */
function serkalLogReadTxtLinesForDay_(day) {
  var suffix = serkalLogResolveDaySuffix_(day);
  var folder = serkalHoleLogFolder_();
  var name = SERKAL_LOG_FILE_PREFIX + suffix + SERKAL_LOG_FILE_EXT;
  var files = folder.getFilesByName(name);
  var out = [];

  while (files.hasNext()) {
    var file = files.next();
    var content = '';

    try {
      content = file.getBlob().getDataAsString('UTF-8');
    } catch (_) {
      content = '';
    }

    var arr = serkalLogParseTxtContent_(content, name);
    for (var j = 0; j < arr.length; j++) {
      out.push(arr[j]);
    }
  }

  out.sort(function(a, b) {
    var ka = String(a.sortKey || '');
    var kb = String(b.sortKey || '');

    if (ka < kb) return -1;
    if (ka > kb) return 1;
    return 0;
  });

  return out;
}

/**
 * @id 8.04.007
 * @funktion serkalLogResolveDaySuffix_
 * @modul 8 System / Logging / Diagnose
 * @gruppe UI-API / Log lesen
 * @zweck Normalisiert today|mo|di|mi|do|fr|sa|so auf den Dateisuffix.
 * @status aktiv
 * @loeschung nein
 */
function serkalLogResolveDaySuffix_(day) {
  var d = String(day || '').toLowerCase().trim();
  if (d === 'today' || d === 'heute' || d === '') {
    var jsDow = (new Date()).getDay();
    var dow = (jsDow === 0) ? 7 : jsDow;
    return serkalLogWeekdaySuffix_(dow);
  }

  if (d === 'montag' || d === 'monday') return 'mo';
  if (d === 'dienstag' || d === 'tuesday') return 'di';
  if (d === 'mittwoch' || d === 'wednesday') return 'mi';
  if (d === 'donnerstag' || d === 'thursday') return 'do';
  if (d === 'freitag' || d === 'friday') return 'fr';
  if (d === 'samstag' || d === 'saturday') return 'sa';
  if (d === 'sonntag' || d === 'sunday') return 'so';

  var allowed = { mo:true, di:true, mi:true, do:true, fr:true, sa:true, so:true };
  return allowed[d] ? d : serkalLogResolveDaySuffix_('today');
}

/**
 * @id 8.04.003
 * @funktion serkalLogParseTxtContent_
 * @modul 8 System / Logging / Diagnose
 * @gruppe UI-API / Log lesen
 * @zweck Wandelt TXT-Logzeilen zurück in das bisherige UI-Zeilenformat.
 * @status aktiv
 * @hinweis Format: Datum TAB Zeit TAB Level TAB Tag TAB Text TAB Objekt.
 * @loeschung nein
 */
function serkalLogParseTxtContent_(content, fileName) {
  var out = [];
  var lines = String(content || '').split(/\r?\n/);

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];

    if (!line || !line.trim()) continue;
    if (line.indexOf('#') === 0) continue;

    var p = line.split('\t');
    var datum = String(p[0] || '');
    var zeitOnly = String(p[1] || '');
    var level = String(p[2] || '');
    var tag = String(p[3] || '');
    var text = String(p[4] || '');
    var objekt = p.length > 5 ? p.slice(5).join(' ') : '';

    out.push({
      zeit: (datum && zeitOnly) ? (datum + ' ' + zeitOnly) : datum,
      level: level,
      tag: tag,
      text: text,
      objekt: objekt,
      file: String(fileName || ''),
      sortKey: serkalLogSortKey_(datum, zeitOnly)
    });
  }

  return out;
}

/**
 * @id 8.04.004
 * @funktion serkalLogSortKey_
 * @modul 8 System / Logging / Diagnose
 * @gruppe UI-API / Log lesen
 * @zweck Baut aus deutschem Datum und Uhrzeit einen sortierbaren Schlüssel.
 * @status aktiv
 * @hinweis Ungültige Werte bleiben am Anfang und stören die UI nicht.
 * @loeschung nein
 */
function serkalLogSortKey_(datum, zeitOnly) {
  var d = String(datum || '');
  var t = String(zeitOnly || '00:00:00');
  var m = d.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);

  if (!m) return '0000-00-00 ' + t;

  return m[3] + '-' + m[2] + '-' + m[1] + ' ' + t;
}

/**
 * @id 8.04.005
 * @funktion apiTesteTxtLogSystem
 * @modul 8 System / Logging / Diagnose
 * @gruppe UI-API / Log Test
 * @zweck Erzeugt gezielt eine Testzeile im TXT-Log und liefert Dateiname/Ordner zurück.
 * @status aktiv
 * @hinweis Nur Diagnose-API; erzeugt keine UI-Änderung und bleibt Node-freundlich gekapselt.
 * @loeschung nein
 */
function apiTesteTxtLogSystem() {
  try {
    var entry = serkalLogBuildEntry_('INFO', 'LOG', 'TXT-Logsystem Testeintrag', {
      version: SERKAL_VERSION
    });

    serkalLogWrite_(entry);

    var file = serkalLogGetTodayFile_();

    return {
      ok: true,
      message: 'TXT-Logtest geschrieben.',
      fileName: file.getName(),
      fileUrl: file.getUrl(),
      folderId: SERKAL_LOG_FOLDER_ID || SERKAL_ARCHIV_FOLDER_ID
    };

  } catch (e) {
    return {
      ok: false,
      message: skErr_(e),
      folderId: SERKAL_LOG_FOLDER_ID || SERKAL_ARCHIV_FOLDER_ID
    };
  }
}

/* =====================================================================
   8.05 – UI-API / Log schreiben
   ===================================================================== */

/**
 * @id 8.05.001
 * @funktion apiLoescheHeutigesLog
 * @modul 8 System / Logging / Diagnose
 * @gruppe UI-API / Log schreiben
 * @zweck Kompatibilitäts-API: leert die heutige Tageslogdatei dauerhaft und lässt einen neuen Tageskopf stehen.
 * @status aktiv
 * @hinweis Intern an apiLoescheLog('today') delegiert.
 * @loeschung nein
 */
function apiLoescheHeutigesLog() {
  return apiLoescheLog('today');
}

/**
 * @id 8.05.002
 * @funktion apiSpeichereHeutigesLogText
 * @modul 8 System / Logging / Diagnose
 * @gruppe UI-API / Log schreiben
 * @zweck Kompatibilitäts-API: überschreibt die heutige Tageslogdatei mit bearbeitetem UI-Text.
 * @status aktiv
 * @hinweis Intern an apiSpeichereLogText('today', text) delegiert.
 * @loeschung nein
 */
function apiSpeichereHeutigesLogText(text) {
  return apiSpeichereLogText('today', text);
}

/**
 * @id 8.05.003
 * @funktion apiLoescheLog
 * @modul 8 System / Logging / Diagnose
 * @gruppe UI-API / Log schreiben
 * @zweck Leert die ausgewählte Tageslogdatei dauerhaft und lässt einen Tageskopf stehen.
 * @status aktiv
 * @hinweis day: today|mo|di|mi|do|fr|sa|so.
 * @loeschung nein
 */
function apiLoescheLog(day) {
  try {
    var suffix = serkalLogResolveDaySuffix_(day);
    var file = serkalLogGetFileForSuffix_(suffix);
    var today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');

    file.setContent(serkalLogHeaderForDate_(today) + '\n');

    return {
      ok: true,
      message: 'TXT-Log geleert: ' + suffix,
      source: 'TXT_DAY',
      day: suffix,
      fileName: file.getName()
    };

  } catch (e) {
    return {
      ok: false,
      message: skErr_(e),
      source: 'TXT_DAY',
      day: String(day || '')
    };
  }
}

/**
 * @id 8.05.004
 * @funktion apiSpeichereLogText
 * @modul 8 System / Logging / Diagnose
 * @gruppe UI-API / Log schreiben
 * @zweck Überschreibt genau die ausgewählte Tageslogdatei mit bearbeitetem Text aus der UI.
 * @status aktiv
 * @hinweis Erwartet den sichtbaren UI-Text mit Pipe-Trennung und wandelt ihn zurück in TAB-Logzeilen.
 * @loeschung nein
 */
function apiSpeichereLogText(day, text) {
  try {
    var suffix = serkalLogResolveDaySuffix_(day);
    var file = serkalLogGetFileForSuffix_(suffix);
    var today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
    var content = serkalLogVisibleTextToFileContent_(text, today);

    file.setContent(content);

    return {
      ok: true,
      message: 'TXT-Log gespeichert: ' + suffix,
      source: 'TXT_DAY',
      day: suffix,
      fileName: file.getName()
    };

  } catch (e) {
    return {
      ok: false,
      message: skErr_(e),
      source: 'TXT_DAY',
      day: String(day || '')
    };
  }
}

/**
 * @id 8.05.005
 * @funktion serkalLogGetFileForSuffix_
 * @modul 8 System / Logging / Diagnose
 * @gruppe UI-API / Log schreiben
 * @zweck Ermittelt oder erzeugt die Logdatei für einen konkreten Wochentags-Suffix.
 * @status aktiv
 * @loeschung nein
 */
function serkalLogGetFileForSuffix_(suffix) {
  var s = serkalLogResolveDaySuffix_(suffix);
  return serkalLogGetOrCreateFileByName_(SERKAL_LOG_FILE_PREFIX + s + SERKAL_LOG_FILE_EXT);
}

/**
 * @id 8.05.006
 * @funktion serkalLogVisibleTextToFileContent_
 * @modul 8 System / Logging / Diagnose
 * @gruppe UI-API / Log schreiben
 * @zweck Wandelt den im Logfenster sichtbaren Pipe-Text zurück in das interne TAB-Logformat.
 * @status aktiv
 * @loeschung nein
 */
function serkalLogVisibleTextToFileContent_(text, fallbackIsoDate) {
  var raw = String(text || '');
  var lines = raw.split(/\r?\n/);
  var out = [];
  var isoDate = String(fallbackIsoDate || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd'));

  for (var i = 0; i < lines.length; i++) {
    var line = String(lines[i] || '').trim();
    if (!line) continue;
    if (line.indexOf('#') === 0) continue;

    var converted = serkalLogVisibleLineToTabLine_(line);
    if (converted) out.push(converted);
  }

  return serkalLogHeaderForDate_(isoDate) + '\n' + (out.length ? out.join('\n') + '\n' : '');
}

/**
 * @id 8.05.007
 * @funktion serkalLogVisibleLineToTabLine_
 * @modul 8 System / Logging / Diagnose
 * @gruppe UI-API / Log schreiben
 * @zweck Wandelt eine sichtbare Logzeile zurück in Datum/Zeit/Level/Tag/Text/Objekt.
 * @status aktiv
 * @loeschung nein
 */
function serkalLogVisibleLineToTabLine_(line) {
  var s = String(line || '').trim();
  if (!s) return '';

  if (s.indexOf('\t') !== -1) return s;

  var p = s.split(' | ');
  if (p.length < 4) {
    return ['', '', '', '', serkalLogSanitizeCell_(s), ''].join('\t');
  }

  var zeit = String(p[0] || '').trim();
  var m = zeit.match(/^(\d{2}\.\d{2}\.\d{4})\s+(\d{2}:\d{2}:\d{2})$/);
  var datum = m ? m[1] : '';
  var zeitOnly = m ? m[2] : '';
  var level = String(p[1] || '').trim();
  var tag = String(p[2] || '').trim();
  var msg = String(p[3] || '').trim();
  var obj = p.length > 4 ? p.slice(4).join(' | ').trim() : '';

  return [
    serkalLogSanitizeCell_(datum),
    serkalLogSanitizeCell_(zeitOnly),
    serkalLogSanitizeCell_(level),
    serkalLogSanitizeCell_(tag),
    serkalLogSanitizeCell_(msg),
    serkalLogSanitizeCell_(obj)
  ].join('\t');
}

/* =====================================================================
   8.06 – Fanal / Diagnose
   ===================================================================== */

/**
 * @id 8.06.001
 * @funktion apiHoleFanalAnalyseStatus
 * @modul 8 System / Logging / Diagnose
 * @gruppe Fanal / Diagnose
 * @zweck Liest den Google-Drive-Übergabeordner für Fanal-Ausgaben und liefert die aktuellsten Report-Dateien an die UI.
 * @status aktiv
 * @hinweis Fanal selbst läuft lokal unter C:\fanal. Apps Script liest nur die nach Drive kopierten Ergebnisse.
 * @loeschung nein
 */
function apiHoleFanalAnalyseStatus() {
  try {
    var folder = serkalHoleFanalOutputFolder_();
    var files = folder.getFiles();
    var out = [];

    while (files.hasNext()) {
      var f = files.next();
      var name = String(f.getName() || '');
      var lower = name.toLowerCase();

      if (
        lower === 'fanal_report.html' ||
        lower === 'fanal_report.txt' ||
        lower === 'fanal_report.json' ||
        lower === 'fanal_ergebnis.html' ||
        lower === 'fanal_ergebnis.txt' ||
        lower === 'fanal_ergebnis.json' ||
        lower.indexOf('fanal_') === 0
      ) {
        out.push({
          name: name,
          id: f.getId(),
          url: f.getUrl(),
          mimeType: f.getMimeType(),
          size: serkalSafeGetFileSize_(f),
          updatedMs: f.getLastUpdated().getTime(),
          updatedText: Utilities.formatDate(
            f.getLastUpdated(),
            Session.getScriptTimeZone(),
            'dd.MM.yyyy HH:mm:ss'
          ),
          kind: serkalFanalFileKind_(name)
        });
      }
    }

    out.sort(function(a, b) {
      return Number(b.updatedMs || 0) - Number(a.updatedMs || 0);
    });

    var latestHtml = serkalFanalFindLatestKind_(out, 'html');
    var latestTxt = serkalFanalFindLatestKind_(out, 'txt');
    var latestJson = serkalFanalFindLatestKind_(out, 'json');

    return {
      ok: true,
      folderId: FANAL_OUTPUT_FOLDER_ID,
      folderUrl: folder.getUrl(),
      count: out.length,
      latestHtml: latestHtml,
      latestTxt: latestTxt,
      latestJson: latestJson,
      files: out.slice(0, 20),
      message: out.length
        ? 'Fanal-Ausgaben gefunden: ' + out.length
        : 'Keine Fanal-Ausgaben im Drive-Ordner gefunden.'
    };

  } catch (e) {
    return {
      ok: false,
      folderId: FANAL_OUTPUT_FOLDER_ID,
      message: 'Fanal-Ausgabeordner konnte nicht gelesen werden.',
      error: skErr_(e)
    };
  }
}

/**
 * @id 8.06.002
 * @funktion apiHoleFanalHtmlReport
 * @modul 8 System / Logging / Diagnose
 * @gruppe Fanal / Diagnose
 * @zweck Liest die neueste Fanal-HTML-Ausgabe aus dem Drive-Übergabeordner und liefert sie als echten HTML-Text an die UI.
 * @status aktiv
 * @hinweis Umgeht die Google-Drive-Quelltextansicht; die UI rendert den Report in einem eigenen Fenster.
 * @loeschung nein
 */
function apiHoleFanalHtmlReport() {
  try {
    var status = apiHoleFanalAnalyseStatus();
    if (!status || !status.ok) {
      return status || { ok: false, message: 'Fanal-Status konnte nicht ermittelt werden.' };
    }

    var latest = status.latestHtml;
    if (!latest || !latest.id) {
      return {
        ok: false,
        configured: false,
        message: 'Die Analyse-Funktion ist noch nicht eingerichtet. Bitte Fanal-Zusatzpaket installieren.',
        count: status.count || 0,
        files: status.files || []
      };
    }

    var file = DriveApp.getFileById(latest.id);
    var html = '';
    try {
      html = file.getBlob().getDataAsString('UTF-8');
    } catch (_) {
      html = file.getBlob().getDataAsString();
    }

    if (!html || !String(html).trim()) {
      return {
        ok: false,
        message: 'Die gefundene Fanal-HTML-Datei ist leer.',
        file: latest
      };
    }

    return {
      ok: true,
      configured: true,
      html: String(html),
      file: latest,
      count: status.count || 0,
      folderUrl: status.folderUrl || '',
      message: 'Fanal-HTML-Ausgabe geladen: ' + latest.name
    };

  } catch (e) {
    return {
      ok: false,
      message: 'Fanal-HTML-Ausgabe konnte nicht gelesen werden.',
      error: skErr_(e)
    };
  }
}


/**
 * @id 8.06.003
 * @funktion apiOeffneFanalHtmlDialog
 * @modul 8 System / Logging / Diagnose
 * @gruppe Fanal / Diagnose
 * @zweck Öffnet die neueste Fanal-HTML-Ausgabe serverseitig als gerenderten modeless Dialog.
 * @status aktiv
 * @hinweis Ersatz für clientseitiges window.open/document.write; stabiler in der Apps-Script-Sandbox.
 * @loeschung nein
 */
function apiOeffneFanalHtmlDialog() {
  try {
    var res = apiHoleFanalHtmlReport();
    if (!res || !res.ok || !res.html) {
      return {
        ok: false,
        message: (res && (res.message || res.error)) || 'Keine Fanal-HTML-Ausgabe gefunden.'
      };
    }

    var title = 'SerKal Fanal';
    try {
      if (res.file && res.file.name) title = 'SerKal Fanal – ' + String(res.file.name);
    } catch (_) {}

    var html = HtmlService
      .createHtmlOutput(String(res.html || ''))
      .setTitle(title)
      .setWidth(1200)
      .setHeight(820);

    SpreadsheetApp.getUi().showModelessDialog(html, title);

    return {
      ok: true,
      fileName: (res.file && res.file.name) ? String(res.file.name) : '',
      message: 'Fanal-HTML-Dialog geöffnet.'
    };

  } catch (e) {
    return {
      ok: false,
      message: 'Fanal-HTML-Dialog konnte nicht geöffnet werden.',
      error: skErr_(e)
    };
  }
}

/**
 * @id 8.06.004
 * @funktion serkalFanalFindLatestKind_
 * @modul 8 System / Logging / Diagnose
 * @gruppe Fanal / Diagnose
 * @zweck Sucht in der vorbereiteten Dateiliste die neueste Datei eines Typs.
 * @status aktiv
 * @loeschung nein
 */
function serkalFanalFindLatestKind_(files, kind) {
  try {
    for (var i = 0; i < files.length; i++) {
      if (files[i] && files[i].kind === kind) return files[i];
    }
  } catch (_) {}

  return null;
}

/**
 * @id 8.06.005
 * @funktion serkalFanalFileKind_
 * @modul 8 System / Logging / Diagnose
 * @gruppe Fanal / Diagnose
 * @zweck Klassifiziert Fanal-Ausgabedateien nach Dateiendung.
 * @status aktiv
 * @loeschung nein
 */
function serkalFanalFileKind_(name) {
  var lower = String(name || '').toLowerCase();

  if (lower.lastIndexOf('.html') === lower.length - 5) return 'html';
  if (lower.lastIndexOf('.txt') === lower.length - 4) return 'txt';
  if (lower.lastIndexOf('.json') === lower.length - 5) return 'json';

  return 'other';
}

/**
 * @id 8.06.006
 * @funktion serkalSafeGetFileSize_
 * @modul 8 System / Logging / Diagnose
 * @gruppe Fanal / Diagnose
 * @zweck Liefert die Dateigröße, ohne bei nicht unterstützten Drive-Dateien abzubrechen.
 * @status aktiv
 * @hinweis Vorher als allgemeiner Helfer safeGetFileSize_ geführt; hier fachlich in Fanal/Diagnose integriert.
 * @loeschung nein
 */
function serkalSafeGetFileSize_(file) {
  try {
    return file.getSize();

  } catch (_) {
    return 0;
  }
}

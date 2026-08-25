/*
  SerKal – Modul 5 Kalender
  Version: SK25_B015
  Änderung: ICS-Export stabilisiert und vollständig in das Kalendermodul integriert.
*/

/* ============================== KALENDER-HILFEN ============================== */

/**
 * @funktion serkalNormKalTitel_
 * @bereich Kalender
 * @zweck Erfüllt im aktuellen Code-Stand eine klar abgegrenzte Teilaufgabe rund um kalender.
 * @status aktiv
 * @hinweis Interner Helfer; Aufrufer möglichst sauber begrenzt halten.
 * @loeschung nein
 */
/**
 * @id 9.00.011
 * @funktion serkalNormKalTitel_
 * @modul 9 Helfer
 * @gruppe Allgemeine Helfer
 * @zweck Funktions-ID automatisch vergeben; Zweck anhand Funktionsname/Modul später bei Bedarf verfeinern.
 * @status aktiv
 * @loeschung nein
 */
function serkalNormKalTitel_(s) {
  var v = String(s || '');

  try {
    if (typeof normTitle_ === 'function') {
      v = String(normTitle_(v) || v);
    }
  } catch (_e) { }

  return v
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\:\;\,\.\!\?\"\'\`\´\“\”\‘\’\(\)\[\]\{\}\/_\\\-\–\—]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}


/** Normalisiert Staffelwerte wie 1, S1 und S01 einheitlich zu S01. */
function serkalNormStaffelLabel_(staffel) {
  var raw = String(staffel || '').trim().toUpperCase();
  var n = parseInt(raw.replace(/^S/, ''), 10);
  if (!isFinite(n) || n <= 0) return '';
  return 'S' + pad2_(n);
}

/** Prüft eine Staffel im normalisierten Kalendertitel exakt, ohne S01 mit S010 zu verwechseln. */
function serkalKalTitelHatStaffel_(eventTitel, staffelLabel) {
  var s = serkalNormStaffelLabel_(staffelLabel).toLowerCase();
  if (!s) return false;

  var norm = serkalNormKalTitel_(eventTitel);
  var re = new RegExp('(?:^|\\s)' + s + '(?:e\\d+)?(?:\\s|$)', 'i');
  return re.test(norm);
}

/**
 * @funktion serkalLoescheKalenderEventsZurSerie_
 * @bereich Kalender
 * @zweck Erfüllt im aktuellen Code-Stand eine klar abgegrenzte Teilaufgabe rund um kalender.
 * @status aktiv
 * @hinweis Interner Helfer; Aufrufer möglichst sauber begrenzt halten.
 * @loeschung nein
 */
/**
 * @id 5.00.001
 * @funktion serkalLoescheKalenderEventsZurSerie_
 * @modul 5 Kalender
 * @gruppe Kalender / Synchronisierung
 * @zweck Teil der Kalenderlogik; automatisch mit Funktions-ID versehen.
 * @status aktiv
 * @loeschung nein
 */
function serkalLoescheKalenderEventsZurSerie_(titel, jahr) {
  var t = String(titel || '').trim();
  var y = String(jahr || '').trim();
  if (!t) return 0;

  var prefixRaw = t + (y ? (' (' + y + ')') : '');
  var prefixNorm = serkalNormKalTitel_(prefixRaw);

  var cal = holeSerkalKalender_();
  var yNum = parseInt(y, 10);
  if (!isFinite(yNum) || yNum < 1900) yNum = (new Date()).getFullYear();

  var start = new Date(yNum - 1, 0, 1);
  var end = new Date(yNum + 50, 11, 31);

  var events = [];
  try {
    events = cal.getEvents(start, end, { search: t });
  } catch (_e1) {
    try {
      events = cal.getEvents(start, end, { search: prefixRaw });
    } catch (_e2) {
      events = cal.getEvents(start, end);
    }
  }

  var delCount = 0;
  for (var i = 0; i < events.length; i++) {
    var ev = events[i];
    var evTitle = String(ev.getTitle() || '');
    var evNorm = serkalNormKalTitel_(evTitle);
    if (evNorm && evNorm.indexOf(prefixNorm) === 0) {
      try {
        ev.deleteEvent();
        delCount++;
      } catch (_e3) { }
    }
  }

  LOG_INFO('KAL', 'Kalender-Delete Serie: "' + prefixRaw + '" ? ' + delCount + ' Events gelöscht.');
  return delCount;
}

/**
 * @funktion serkalLoescheKalenderEventsZurStaffel_
 * @bereich Kalender
 * @zweck Erfüllt im aktuellen Code-Stand eine klar abgegrenzte Teilaufgabe rund um kalender.
 * @status aktiv
 * @hinweis Interner Helfer; Aufrufer möglichst sauber begrenzt halten.
 * @loeschung nein
 */
/**
 * @id 5.00.002
 * @funktion serkalLoescheKalenderEventsZurStaffel_
 * @modul 5 Kalender
 * @gruppe Kalender / Synchronisierung
 * @zweck Teil der Kalenderlogik; automatisch mit Funktions-ID versehen.
 * @status aktiv
 * @loeschung nein
 */
function serkalLoescheKalenderEventsZurStaffel_(titel, jahr, staffelLabel, altTermindaten) {
  var t = String(titel || '').trim();
  var y = String(jahr || '').trim();
  var s = serkalNormStaffelLabel_(staffelLabel);
  var oldDates = Array.isArray(altTermindaten) ? altTermindaten.slice() : [];

  if (!t || !s) return 0;

  var cal = holeSerkalKalender_();
  if (!cal) return 0;

  var yNum = parseInt(y, 10);
  if (!isFinite(yNum) || yNum < 1900) yNum = new Date().getFullYear();

  var start = new Date(yNum - 1, 0, 1);
  var end = new Date(yNum + 5, 11, 31);

  var events = [];
  try {
    events = cal.getEvents(start, end, { search: t });
  } catch (_e1) {
    events = cal.getEvents(start, end);
  }

  var tz = Session.getScriptTimeZone() || 'Europe/Berlin';
  var oldDateSet = {};
  for (var d = 0; d < oldDates.length; d++) {
    var key = String(oldDates[d] || '').trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(key)) oldDateSet[key] = true;
  }

  var delCount = 0;
  var hasOldDates = Object.keys(oldDateSet).length > 0;

  for (var i = 0; i < events.length; i++) {
    var ev = events[i];
    var evTitle = String(ev.getTitle() || '');
    var evNorm = serkalNormKalTitel_(evTitle);
    var evDate = Utilities.formatDate(ev.getStartTime(), tz, 'yyyy-MM-dd');

    var seriesMatch = serkalIstAehnlicherKalSerienTitel_(evTitle, t, y);
    var seasonMatch = serkalKalTitelHatStaffel_(evTitle, s);
    var dateMatch = !hasOldDates || !!oldDateSet[evDate];

    if (seriesMatch && seasonMatch && dateMatch) {
      try {
        ev.deleteEvent();
        delCount++;
      } catch (_e2) { }
    }
  }

  LOG_INFO('KAL', 'Kalender-Delete Staffel: "' + t + ' (' + y + ') ' + s + '" ? ' + delCount + ' Events gelöscht.');
  return delCount;
}


/**
 * @funktion holeSerkalKalender_
 * @bereich Kalender
 * @zweck Sucht oder erzeugt den Kalender "SerKal" als Ziel für Termine.
 * @status aktiv
 * @hinweis Interner Helfer; Aufrufer möglichst sauber begrenzt halten.
 * @loeschung nein
 */
/**
 * @id 5.00.003
 * @funktion holeSerkalKalender_
 * @modul 5 Kalender
 * @gruppe Kalender / Synchronisierung
 * @zweck Teil der Kalenderlogik; automatisch mit Funktions-ID versehen.
 * @status aktiv
 * @loeschung nein
 */
function holeSerkalKalender_() {
  var list = CalendarApp.getCalendarsByName(SERKAL_KALENDER_NAME);
  if (list && list.length) return list[0];

  // Kein Abbruch: Kalender fehlt => neu anlegen
  // (Name exakt: "SerKal")
  return CalendarApp.createCalendar(SERKAL_KALENDER_NAME);
}

/**
 * @funktion serkalLoescheKalenderEintraegeNachTerminen_
 * @bereich Kalender / DE
 * @zweck Löscht Kalendereinträge einer Serie datumsbasiert anhand einer Terminliste.
 * @status aktiv
 * @hinweis Nutzt Serienname + Datum und ist robuster als starre Titelformate.
 * @loeschung nein
 */
/**
 * @id 5.00.004
 * @funktion serkalLoescheKalenderEintraegeNachTerminen_
 * @modul 5 Kalender
 * @gruppe Kalender / Synchronisierung
 * @zweck Teil der Kalenderlogik; automatisch mit Funktions-ID versehen.
 * @status aktiv
 * @loeschung nein
 */
function serkalLoescheKalenderEintraegeNachTerminen_(serienName, terminListe) {
  try {
    var saubererName = String(serienName || '').trim();
    if (!saubererName) {
      LOG_WARN('KAL', 'Kalender-Delete abgebrochen: leerer Serientitel.');
      return 0;
    }

    var cal = holeSerkalKalender_();
    if (!cal) return 0;

    var titleNeedle = serkalLoescheDoppelpunkteUndSonderzeichenNeutral_(saubererName);
    if (!titleNeedle) {
      LOG_WARN('KAL', 'Kalender-Delete abgebrochen: Serientitel ergibt leeren Suchwert.', {
        titel: saubererName
      });
      return 0;
    }

    var geloescht = 0;

    (Array.isArray(terminListe) ? terminListe : []).forEach(function (raw) {
      var d = new Date(String(raw) + 'T00:00:00');
      if (isNaN(d.getTime())) return;

      var dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
      var dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

      var events = cal.getEvents(dayStart, dayEnd);
      var dayHits = 0;
      var dayDeleted = 0;

      events.forEach(function (ev) {
        var evTitle = serkalLoescheDoppelpunkteUndSonderzeichenNeutral_(ev.getTitle());
        if (evTitle.indexOf(titleNeedle) !== -1) {
          dayHits++;
          ev.deleteEvent();
          dayDeleted++;
          geloescht++;
        }
      });

      LOG_INFO('KAL', 'Kalender-Delete Tag geprüft', {
        titel: saubererName,
        datum: Utilities.formatDate(dayStart, Session.getScriptTimeZone(), 'yyyy-MM-dd'),
        eventsGesamt: events.length,
        serienTreffer: dayHits,
        geloescht: dayDeleted
      });
    });

    LOG_INFO('KAL', 'Kalender-Delete nach Terminliste abgeschlossen', {
      titel: saubererName,
      geloescht: geloescht,
      tage: Array.isArray(terminListe) ? terminListe.length : 0
    });

    return geloescht;
  } catch (e) {
    LOG_ERROR('KAL', 'serkalLoescheKalenderEintraegeNachTerminen_ Fehler: ' + skErr_(e));
    return 0;
  }
}

/**
 * @funktion serkalSynchronisiereKalender_
 * @bereich Kalender / DE
 * @zweck Synchronisiert die betroffene Staffel im SerKal-Kalender anhand der aktiven Terminreihe neu.
 * @status aktiv
 * @hinweis Löscht zuerst alte Kalendereinträge datumsbasiert und schreibt danach die neue Reihe.
 * @loeschung nein
 */
/**
 * @id 5.00.005
 * @funktion serkalSynchronisiereKalender_
 * @modul 5 Kalender
 * @gruppe Kalender / Synchronisierung
 * @zweck Teil der Kalenderlogik; automatisch mit Funktions-ID versehen.
 * @status aktiv
 * @loeschung nein
 */
function serkalSynchronisiereKalender_(name, staffel, alteTermineOverride) {
  try {
    var serienName = String(name || '').trim();
    var staffelLabel = String(staffel || '').trim().toUpperCase();

    if (!serienName || !staffelLabel) {
      LOG_WARN('KAL', 'serkalSynchronisiereKalender_: unvollstaendige Eingabe', {
        name: serienName,
        staffel: staffelLabel
      });
      return { ok: false, reason: 'missing_input' };
    }

    staffelLabel = serkalNormStaffelLabel_(staffelLabel);
    if (!staffelLabel) {
      LOG_WARN('KAL', 'serkalSynchronisiereKalender_: ungültige Staffel', {
        name: serienName,
        staffel: staffel
      });
      return { ok: false, reason: 'invalid_season' };
    }

    var archivData = getArchivDaten();
    var entries = Array.isArray(archivData && archivData.entries) ? archivData.entries : [];
    var target = null;

    for (var i = 0; i < entries.length; i++) {
      var it = entries[i] || {};
      var itName = String(it.titel || it.name || it.title || '').trim().toLowerCase();
      var itStaffel = serkalNormStaffelLabel_(it.staffelLabel || it.staffel);
      if (itName === serienName.toLowerCase() && itStaffel === staffelLabel) {
        target = it;
        break;
      }
    }

    if (!target) {
      LOG_WARN('KAL', 'serkalSynchronisiereKalender_: Archiv-Eintrag nicht gefunden', {
        name: serienName,
        staffel: staffelLabel
      });
      return { ok: false, reason: 'entry_not_found' };
    }

    var hatAlteTermine = Array.isArray(alteTermineOverride) && alteTermineOverride.length > 0;
    var alteReihe = hatAlteTermine ? alteTermineOverride.slice() : [];
    var neueReihe = Array.isArray(target.activeDates) ? target.activeDates.slice() : [];
    var jahr = String(target.jahr || target.year || '').trim();

    LOG_INFO('KAL', 'serkalSynchronisiereKalender_: Start', {
      titel: serienName,
      jahr: jahr,
      staffelLabel: staffelLabel,
      alteCount: alteReihe.length,
      neueCount: neueReihe.length,
      deRule: String(target.deRule || '')
    });

    // Wenn die vorherige Terminreihe bekannt ist, löschen wir gezielt nach Datum.
    // Fehlt sie, wird die betreffende Staffel vollständig entfernt und anschließend neu aufgebaut.
    var delCount = hatAlteTermine
      ? serkalLoescheKalenderEintraegeNachTerminen_(serienName, alteReihe)
      : serkalLoescheKalenderEventsZurStaffel_(serienName, jahr, staffelLabel, []);

    var writeResult = { ok: true, erstellt: 0, vorhanden: 0, ungueltig: 0, bloecke: 0 };
    if (neueReihe.length) {
      var staffelNum = Number(String(staffelLabel).replace(/^S/i, '')) || 0;
      writeResult = trageStaffelDirektInKalenderEin({
        titel: serienName,
        jahr: jahr,
        staffelNummer: staffelNum,
        termindaten: neueReihe.slice()
      });
    }
    var writeCount = Number(writeResult && writeResult.erstellt) || 0;

    LOG_INFO('KAL', 'serkalSynchronisiereKalender_: Staffel synchronisiert', {
      titel: serienName,
      jahr: jahr,
      staffelLabel: staffelLabel,
      geloescht: delCount,
      geschrieben: writeCount,
      bereitsVorhanden: Number(writeResult && writeResult.vorhanden) || 0,
      ungueltig: Number(writeResult && writeResult.ungueltig) || 0,
      deRule: String(target.deRule || '')
    });

    return {
      ok: true,
      geloescht: delCount,
      geschrieben: writeCount,
      bereitsVorhanden: Number(writeResult && writeResult.vorhanden) || 0,
      ungueltig: Number(writeResult && writeResult.ungueltig) || 0
    };
  } catch (e) {
    LOG_ERROR('KAL', 'serkalSynchronisiereKalender_ Fehler: ' + skErr_(e));
    return { ok: false, reason: 'exception', message: skErr_(e) };
  }
}

/**
 * @funktion trageStaffelDirektInKalenderEin
 * @bereich Kalender
 * @zweck Schreibt eine Staffel direkt als Terminserie in den SerKal-Kalender.
 * @status aktiv
 * @hinweis Bei späterer Vereinfachung prüfen, ob diese Funktion noch getrennt nötig ist.
 * @loeschung nein
 */
/**
 * @id 5.00.006
 * @funktion trageStaffelDirektInKalenderEin
 * @modul 5 Kalender
 * @gruppe Kalender / Synchronisierung
 * @zweck Teil der Kalenderlogik; automatisch mit Funktions-ID versehen.
 * @status aktiv
 * @loeschung nein
 */
function trageStaffelDirektInKalenderEin(_eintrag) {
  var e = _eintrag || {};
  var titel = String(e.titel || '').trim();
  var jahr = String(e.jahr || '').trim();
  var staffelNummer = Number(e.staffelNummer || e.staffel || 0);
  var termindaten = Array.isArray(e.termindaten) ? e.termindaten.slice() : [];
  var result = { ok: false, erstellt: 0, vorhanden: 0, ungueltig: 0, bloecke: 0 };

  // Kalender-Regel SerKal 2.1:
  // - Wenn die tatsächlich LETZTE Episode im Vorjahr liegt, keinen Kalendereintrag erzeugen.
  // - Liegt die LETZTE Episode im aktuellen Jahr (oder später), wird die komplette Staffel eingetragen.
  // - Idempotent: vorhandene gleichnamige Events am selben Tag werden nicht doppelt erzeugt.
  var currentYear = new Date().getFullYear();

  if (!titel || !/^[0-9]{4}$/.test(jahr) || !isFinite(staffelNummer) || staffelNummer <= 0) {
    result.reason = 'invalid_input';
    return result;
  }
  if (!termindaten.length) {
    result.reason = 'no_dates';
    return result;
  }

  var lastDate = null;
  var lastIso = '';
  for (var i = 0; i < termindaten.length; i++) {
    var iso = String(termindaten[i] || '').trim();
    var parsed = serkalParseIsoDate_(iso);
    if (!parsed || isNaN(parsed.getTime())) {
      result.ungueltig++;
      continue;
    }
    if (!lastDate || parsed.getTime() > lastDate.getTime()) {
      lastDate = parsed;
      lastIso = iso;
    }
  }

  if (!lastDate) {
    result.reason = 'no_valid_dates';
    return result;
  }
  if (lastDate.getFullYear() < currentYear) {
    LOG_INFO('KAL', 'Kalender-Eintrag übersprungen: letzte Episode liegt vor dem aktuellen Jahr.', {
      titel: titel,
      jahr: jahr,
      staffel: 'S' + pad2_(staffelNummer),
      lastDate: lastIso,
      currentYear: currentYear
    });
    result.ok = true;
    result.reason = 'past_season';
    return result;
  }

  var cal = holeSerkalKalender_();
  if (!cal) {
    result.reason = 'calendar_missing';
    return result;
  }

  var sLabel = 'S' + pad2_(staffelNummer);
  var baseTitlePrefix = titel + ' (' + jahr + ') ' + sLabel;
  var blocks = serkalBaueStaffelBloecke_(termindaten);
  result.bloecke = blocks.length;

  var lock = LockService.getScriptLock();
  var locked = false;
  try {
    lock.waitLock(30000);
    locked = true;
  } catch (_lockErr) {
    LOG_WARN('KAL', 'Kalender-Lock konnte nicht übernommen werden; Verarbeitung läuft ohne Lock.', {
      titel: titel,
      staffel: sLabel
    });
  }

  try {
    blocks.forEach(function (b) {
      var d = serkalParseIsoDate_(b.date);
      if (!d || isNaN(d.getTime())) {
        result.ungueltig++;
        return;
      }

      var dayEvents = cal.getEventsForDay(d);
      var t = baseTitlePrefix + 'E' + pad2_(b.eFrom) +
        (b.eTo && b.eTo !== b.eFrom ? ('–E' + pad2_(b.eTo)) : '');
      var tNorm = String(t).toLowerCase();
      var exists = dayEvents.some(function (ev) {
        return String(ev.getTitle() || '').toLowerCase() === tNorm;
      });

      if (exists) {
        result.vorhanden++;
        return;
      }

      var ev = cal.createAllDayEvent(t, d);
      ev.setDescription('SerKal');
      result.erstellt++;
    });

    result.ok = true;
    return result;
  } catch (err) {
    result.reason = 'exception';
    result.message = skErr_(err);
    LOG_ERROR('KAL', 'trageStaffelDirektInKalenderEin Fehler: ' + result.message);
    return result;
  } finally {
    if (locked) {
      try { lock.releaseLock(); } catch (_releaseErr) { }
    }
  }
}
/**
 * @funktion dbgEnsureSerkalKalender
 * @bereich Kalender
 * @zweck Erfüllt im aktuellen Code-Stand eine klar abgegrenzte Teilaufgabe rund um kalender.
 * @status aktiv
 * @hinweis Debug-/Analysefunktion; nur löschen, wenn Aufrufer und Bedarf wirklich geklärt sind.
 * @loeschung später prüfen
 */
// [KANDIDAT TESTARCHIV]
// Debugfunktion – nur fuer Analyse/Test.
/**
 * @id 5.00.007
 * @funktion dbgEnsureSerkalKalender
 * @modul 5 Kalender
 * @gruppe Kalender / Synchronisierung
 * @zweck Teil der Kalenderlogik; automatisch mit Funktions-ID versehen.
 * @status aktiv
 * @loeschung nein
 */
function dbgEnsureSerkalKalender() {
  var cal = holeSerkalKalender_();
  Logger.log('OK: ' + cal.getName() + ' / ID=' + cal.getId());
}


// ============================================================================
// ICS-EXPORT – zusätzliche Kalenderausgabe
// ============================================================================

/*
 * SerKal SK25 – Modul 5: ICS-Export
 * Erzeugt eine lokale .ics-Datei für Outlook, Apple Kalender und andere Kalender.
 * Die Datei wird nicht in Google Drive gespeichert.
 */

/**
 * @funktion apiErzeugeIcsFuerAuswahl
 * @modul 5 Kalender
 * @zweck Erzeugt aus der zuletzt erfolgreich verarbeiteten Auswahl eine herunterladbare ICS-Datei.
 * @status aktiv
 */
function apiErzeugeIcsFuerAuswahl(payload) {
  try {
    var d = payload || {};
    var titel = String(d.titel || d.title || d.name || '').trim();
    var jahr = String(d.jahrOverride || d.jahr || d.year || '').trim();
    var staffelNummer = Number(d.staffelOverride || d.staffelNummer || d.seasonNumber || 0);
    var tmdbId = Number(d.tmdbId || d.id || 0) || 0;
    var termindaten = Array.isArray(d.termindaten) ? d.termindaten.slice() :
      (Array.isArray(d.episodeDates) ? d.episodeDates.slice() : []);

    termindaten = termindaten.map(function (x) {
      return String(x || '').trim();
    }).filter(function (x) {
      return /^\d{4}-\d{2}-\d{2}$/.test(x);
    });

    if (!titel || !/^\d{4}$/.test(jahr) || !isFinite(staffelNummer) || staffelNummer <= 0) {
      return { ok: false, message: 'ICS: Titel, Jahr oder Staffel fehlt.' };
    }
    if (!termindaten.length) {
      return { ok: false, message: 'ICS: Keine gültigen Termine vorhanden.' };
    }

    var staffelLabel = 'S' + pad2_(staffelNummer);
    var blocks = serkalBaueStaffelBloecke_(termindaten);
    if (!blocks.length) return { ok: false, message: 'ICS: Keine Terminblöcke vorhanden.' };

    var nowStamp = Utilities.formatDate(new Date(), 'UTC', "yyyyMMdd'T'HHmmss'Z'");
    var lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//SerKal//SK25//DE',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-TIMEZONE:' + Session.getScriptTimeZone(),
      'X-WR-CALNAME:' + serkalIcsEscapeText_('SerKal – ' + titel + ' ' + staffelLabel)
    ];

    blocks.forEach(function (b) {
      var iso = String(b.date || '');
      var startCompact = iso.replace(/-/g, '');
      var endDate = serkalIcsNaechsterTag_(iso);
      var endCompact = endDate.replace(/-/g, '');
      var summary = titel + ' (' + jahr + ') ' + staffelLabel + 'E' + pad2_(b.eFrom) +
        (b.eTo && b.eTo !== b.eFrom ? ('–E' + pad2_(b.eTo)) : '');
      var uidBasis = tmdbId ? ('tmdb-' + tmdbId) : serkalIcsSlug_(titel + '-' + jahr);
      // UID bewusst ohne Datum: Wird ein Termin verschoben, bleibt seine Identität erhalten.
      var uid = 'serkal-sk25-' + uidBasis + '-' + staffelLabel.toLowerCase() + '-e' +
        pad2_(b.eFrom) + '-e' + pad2_(b.eTo || b.eFrom) + '@serkal.de';

      lines.push('BEGIN:VEVENT');
      lines.push('UID:' + uid);
      lines.push('DTSTAMP:' + nowStamp);
      lines.push('CREATED:' + nowStamp);
      lines.push('LAST-MODIFIED:' + nowStamp);
      lines.push('SEQUENCE:0');
      lines.push('DTSTART;VALUE=DATE:' + startCompact);
      lines.push('DTEND;VALUE=DATE:' + endCompact);
      lines.push('SUMMARY:' + serkalIcsEscapeText_(summary));
      lines.push('DESCRIPTION:SerKal');
      lines.push('TRANSP:TRANSPARENT');
      lines.push('END:VEVENT');
    });

    lines.push('END:VCALENDAR');
    var content = lines.map(serkalIcsFalteZeile_).join('\r\n') + '\r\n';
    var safeTitle = serkalIcsDateiname_(titel);
    var fileName = safeTitle + '_' + jahr + '_' + staffelLabel + '.ics';
    var blob = Utilities.newBlob(content, 'text/calendar; charset=utf-8', fileName);

    LOG_INFO('ICS', 'ICS-Datei erzeugt', {
      fileName: fileName,
      events: blocks.length,
      titel: titel,
      staffel: staffelLabel
    });

    return {
      ok: true,
      fileName: fileName,
      mimeType: 'text/calendar;charset=utf-8',
      base64: Utilities.base64Encode(blob.getBytes()),
      events: blocks.length
    };
  } catch (e) {
    LOG_ERROR('ICS', 'apiErzeugeIcsFuerAuswahl Fehler: ' + skErr_(e));
    return { ok: false, message: 'ICS-Erzeugung fehlgeschlagen: ' + skErr_(e) };
  }
}

/**
 * Faltet lange ICS-Zeilen nach RFC 5545. Fortsetzungszeilen beginnen mit einem Leerzeichen.
 */
function serkalIcsFalteZeile_(line) {
  var text = String(line == null ? '' : line);
  var out = [];
  while (text.length > 73) {
    out.push(text.substring(0, 73));
    text = ' ' + text.substring(73);
  }
  out.push(text);
  return out.join('\r\n');
}

function serkalIcsEscapeText_(value) {
  return String(value == null ? '' : value)
    .replace(/\\/g, '\\\\')
    .replace(/\r?\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

function serkalIcsNaechsterTag_(iso) {
  var d = serkalParseIsoDate_(iso);
  if (!d || isNaN(d.getTime())) return '';
  d.setDate(d.getDate() + 1);
  return Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

function serkalIcsSlug_(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[ä]/g, 'ae').replace(/[ö]/g, 'oe').replace(/[ü]/g, 'ue').replace(/[ß]/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'serie';
}

function serkalIcsDateiname_(value) {
  return String(value || 'SerKal')
    .replace(/[\\/:*?"<>|]/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 100) || 'SerKal';
}

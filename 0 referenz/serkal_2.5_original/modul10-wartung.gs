/*
  SerKal – modul10-wartung.gs
  Version: 2026-07-08_SK25_B019_MODUL10_LOOK_FOR_FUTURE_APPLY_DONE6Q_QUEUE_FIXED

  Kurzbericht B014:
  - "Look for future" / Zukunftsprüfung als nutzbarer Ergebnislauf fertiggestellt.
  - API-Aliasse apiLookForFuture() und apiStarteLookForFuture() ergänzt.
  - Ergebnis enthält jetzt sichtbare Trefferliste, Berichtstext und gespeicherten Report.
  - Feste Reportdatei im Archivordner: !!SerKal_LOOK_FOR_FUTURE_REPORT.txt.
  - Reportdateien/SerKal-Systemdateien werden bei Wartungsläufen übersprungen.
  - DONE2: Kalenderrelevante TMDB-Aenderungen an vorhandenen Staffeln werden direkt ins Archiv uebernommen und per Kalender-Sync neu eingetragen.
  - DONE3/APPLY: Zukunftspruefung ist jetzt ausdruecklich produktiv: Archiv wird aktualisiert, Kalender-Sync wird als Nachlauf markiert, wiederkehrende bereits uebernommene Meldungen verschwinden nach erfolgreicher Uebernahme.
  - DONE4/COUNTERS: Leichte Durchlaufzaehler je Funktion vorbereitet; Zaehler-ID = Funktions-ID, Wert erhoeht sich pro Aufruf innerhalb des aktuellen Laufs.
  - DONE5/ARCHIV_FIRST: Kalender-Sync wird im Look-for-Future-Hauptlauf nicht mehr inline ausgefuehrt. Grund: getArchivDaten/Kalender-Sync frisst Laufzeit und verursacht Timeouts/502. Archiv wird aktualisiert; Kalenderbedarf wird im Bericht markiert.
  - DONE6/CALENDAR_QUEUE: Kalenderbedarf wird zusätzlich als Queue-Datei gespeichert; separater API-Nachlauf apiLookForFutureKalenderNachlauf() arbeitet diese Einträge portioniert ab.
  - DONE6Q/FIX: Fehlende Queue-Hilfsfunktionen wirklich ergänzt: serkalZukunftSpeichereKalenderQueue_, apiLookForFutureKalenderNachlauf, serkalZukunftTitelOhneJahr_.
  - Neue vollstaendige Staffeln werden nur dann automatisch ergaenzt, wenn die bisherige letzte Staffel abgeschlossen wirkt; sonst Rueckfragefall im Report.

  Kurzbericht B013:
  - 10.03 Zukunftsprüfung als reiner Test-/Loglauf ergänzt.
  - TMDB-ID bleibt Identitätsanker; fehlende/ungültige ID wird nur gemeldet.
  - Statusbewertung: aktiv / neue Folge / fraglich / abgesetzt / abgeschlossen.
  - Alt-/Neu-Vergleich für Titel, Status, Staffel-/Episodenzahl, letzte/naechste Folge.

  - OVA-002 vorbereitet: Wartungsstatus wird in ScriptProperties geschrieben und per apiWartungStatus gelesen.
  - Logdateien (!!SerKal_LOG_*.txt) werden bei der Zukunftsprüfung übersprungen und nicht als Serien gezählt.
  - Lesbarer Befundtext je auffälliger Serie ergänzt, damit die Abschlusszahlen nachvollziehbar werden.
  - Archivdateien duerfen aktualisiert werden. Kalender-Sync wird nach relevanten Änderungen versucht.

  Arbeitsregel SK25:
  - Erst sortieren, dann verbessern.
  - Vorhandene Logik weitgehend 1:1 erhalten.
  - Neue Prüfungen zuerst als Log-/Aktualisierungslauf, erst später mit echten Aktionen.
*/

/* =====================================================================
 * MODUL 10 – Wartung
 * =====================================================================
 *
 * 10.01 Bestandsprüfung
 *      - reserviert für spätere Archiv-/Bestandsläufe
 *
 * 10.02 Beschreibungswartung
 *      - vorhandene mehrsprachige TMDB-Beschreibungswartung
 *
 * 10.03 Zukunftsprüfung
 *      - reiner Aktualisierungslauf: Archiv lesen, TMDB per gespeicherter ID prüfen, bewerten, loggen
 *      - keine Archiv-/Kalenderänderung
 *
 * 10.04 Änderungsklassifizierung
 *      - Platzhalter für spätere Bewertung von TMDB-/Archiv-Abweichungen
 *      - Grundlage für ManualFlags / Schutz manuell geänderter Felder
 *
 * 10.05 Wartungsbericht
 *      - Platzhalter für spätere zusammenfassende Berichte / Logausgaben
 *
 * Hinweis:
 * 10.03 ist bewusst nur ein Beobachtungs-/Loglauf.
 * Echte Übernahme, Löschung, Neueintrag und ManualFlags-Auswertung folgen später.
 * =====================================================================
 */


/* =====================================================================
 * 10.00 Durchlaufzähler / Laufdiagnose
 * =====================================================================
 * Leichtgewichtig: zählt zunächst nur innerhalb des aktuellen Apps-Script-Laufs.
 * Keine Properties-Schreiblast pro Funktionsaufruf.
 * Abfrage später über apiWartungDurchlaufZaehler(), falls im gleichen Lauf sinnvoll.
 */

var SERKAL_WARTUNG_DURCHLAUFZAEHLER_ = {};

/**
 * @id 10.00.001
 * @funktion serkalWartungZaehleDurchlauf_
 * @modul 10 Wartung
 * @gruppe Wartung / Diagnose
 * @zweck Erhöht einen leichten Durchlaufzähler je Funktions-ID.
 * @status aktiv
 * @loeschung nein
 */
function serkalWartungZaehleDurchlauf_(funktionsId, funktionsName) {
  try {
    var id = String(funktionsId || funktionsName || 'OHNE_ID').trim() || 'OHNE_ID';
    if (!SERKAL_WARTUNG_DURCHLAUFZAEHLER_) SERKAL_WARTUNG_DURCHLAUFZAEHLER_ = {};
    if (!SERKAL_WARTUNG_DURCHLAUFZAEHLER_[id]) {
      SERKAL_WARTUNG_DURCHLAUFZAEHLER_[id] = {
        id: id,
        name: String(funktionsName || ''),
        count: 0,
        first: new Date().toISOString(),
        last: ''
      };
    }
    SERKAL_WARTUNG_DURCHLAUFZAEHLER_[id].count++;
    SERKAL_WARTUNG_DURCHLAUFZAEHLER_[id].last = new Date().toISOString();
    return SERKAL_WARTUNG_DURCHLAUFZAEHLER_[id].count;
  } catch (_e) {
    return 0;
  }
}

/**
 * @id 10.00.002
 * @funktion apiWartungDurchlaufZaehler
 * @modul 10 Wartung
 * @gruppe Wartung / Diagnose
 * @zweck Gibt die aktuellen Durchlaufzähler des laufenden Script-Kontexts zurück.
 * @status aktiv
 * @loeschung nein
 */
function apiWartungDurchlaufZaehler() {
  serkalWartungZaehleDurchlauf_('10.00.002', 'apiWartungDurchlaufZaehler');
  return {
    ok: true,
    zaehler: SERKAL_WARTUNG_DURCHLAUFZAEHLER_ || {}
  };
}


/* =====================================================================
 * 10.01 Bestandsprüfung
 * =====================================================================
 * Platzhalter – noch keine aktive neue Logik in B009.
 */

/* =====================================================================
 * 10.02 Beschreibungswartung
 * =====================================================================
 */

/**
 * @funktion serkalHoleBeschreibungenMehrsprachigByTmdbId_
 * @bereich Wartung / TMDB
 * @zweck Erfüllt im aktuellen Code-Stand eine klar abgegrenzte Teilaufgabe rund um tmdb.
 * @status aktiv
 * @hinweis Interner Helfer; Aufrufer möglichst sauber begrenzt halten.
 * @loeschung nein
 */
/**
 * @id 10.02.001
 * @funktion serkalHoleBeschreibungenMehrsprachigByTmdbId_
 * @modul 10 Wartung
 * @gruppe Wartung / Mehrsprachigkeit
 * @zweck Teil der TMDB-Anbindung; automatisch mit Funktions-ID versehen.
 * @status aktiv
 * @loeschung nein
 */
function serkalHoleBeschreibungenMehrsprachigByTmdbId_(tmdbId) {
  serkalWartungZaehleDurchlauf_('10.02.001', 'serkalHoleBeschreibungenMehrsprachigByTmdbId_');
  var id = Number(tmdbId || 0);
  if (!isFinite(id) || id <= 0) {
    return { ok: false, descDE: '', descEN: '', message: 'tmdbId ungültig' };
  }

  try {
    var tvDE = fetchTvDetailsFromTMDB_(id, 'de');
    var tvEN = fetchTvDetailsFromTMDB_(id, 'en');

    return {
      ok: true,
      descDE: String(tvDE && tvDE.desc ? tvDE.desc : '').trim(),
      descEN: String(tvEN && tvEN.desc ? tvEN.desc : '').trim()
    };
  } catch (e) {
    LOG_WARN('TMDB', 'serkalHoleBeschreibungenMehrsprachigByTmdbId_ Fehler: ' + skErr_(e), {
      tmdbId: id
    });
    return {
      ok: false,
      descDE: '',
      descEN: '',
      message: skErr_(e)
    };
  }
}




/**
 * @id 10.02.002
 * @funktion apiStarteWartungMehrsprachig
 * @modul 10 Wartung
 * @gruppe Wartung / Mehrsprachigkeit
 * @zweck UI/API-Brücke für apiStarteWartungMehrsprachig; automatisch mit Funktions-ID versehen, fachliche Detailbeschreibung später prüfen.
 * @status aktiv
 * @loeschung nein
 */
function apiStarteWartungMehrsprachig() {
  serkalWartungZaehleDurchlauf_('10.02.002', 'apiStarteWartungMehrsprachig');
  return serkalWartungBeschreibungenMehrsprachig_();
}




/**
 * @funktion serkalWartungBeschreibungenMehrsprachig_
 * @bereich Wartung
 * @zweck Erfüllt im aktuellen Code-Stand eine klar abgegrenzte Teilaufgabe rund um wartung.
 * @status aktiv
 * @hinweis Interner Helfer; Aufrufer möglichst sauber begrenzt halten.
 * @loeschung nein
 */
/**
 * @id 6.00.008
 * @funktion serkalWartungBeschreibungenMehrsprachig_
 * @modul 10 Wartung
 * @gruppe Wartung / Mehrsprachigkeit
 * @zweck Funktions-ID automatisch vergeben; Zweck anhand Funktionsname/Modul später bei Bedarf verfeinern.
 * @status aktiv
 * @loeschung nein
 */
function serkalWartungBeschreibungenMehrsprachig_() {
  serkalWartungZaehleDurchlauf_('6.00.008', 'serkalWartungBeschreibungenMehrsprachig_');
  var geprueftDateien = 0;
  var geprueftStaffeln = 0;
  var geaendertDateien = 0;
  var geaendertStaffeln = 0;
  var uebersprungen = 0;
  var fehler = 0;

  try {
    var folder = holeArchivFolder_();
    var files = folder.getFiles();

    LOG_INFO('WARTUNG', 'Mehrsprachige Beschreibungen gestartet', '');

    while (files.hasNext()) {
      var f = files.next();
      var fileName = String(f.getName() || '');

      if (fileName === SERKAL_ARCHIV_INDEX_NAME) continue;
      if (!/\.txt$/i.test(fileName)) continue;

      geprueftDateien++;

      var content = f.getBlob().getDataAsString('UTF-8') || '';
      var lines = content.split(/\r?\n/);
      var out = [];
      var fileChanged = false;

      for (var i = 0; i < lines.length; i++) {
        var rawLine = String(lines[i] || '');
        var raw = rawLine.trim();
        if (!raw) continue;

        if (!/^S\d{1,2}(?:\b|;|\|)/i.test(raw)) {
          out.push(raw);
          continue;
        }

        geprueftStaffeln++;

        try {
          var parsed = serkalParseArchivZeile_(raw);
          if (!parsed) {
            out.push(raw);
            uebersprungen++;
            continue;
          }

          var tmdbId = Number(parsed.tmdbId || 0);
          var flags = Number(parsed.flags || 0);
          var hasDE = !!String(parsed.descDE || '').trim();
          var hasEN = !!String(parsed.descEN || '').trim();

          if (hasDE && hasEN) {
            if ((flags & 32) === 0) {
              flags = flags | 32;
            } else {
              out.push(raw);
              uebersprungen++;
              continue;
            }
          } else if (!tmdbId) {
            var fallbackDE = String(parsed.descDE || '').trim();
            var fallbackEN = String(parsed.descEN || '').trim();

            if (!fallbackDE) fallbackDE = 'N.A.';
            if (!fallbackEN) fallbackEN = 'N.A.';

            hasDE = (fallbackDE !== 'N.A.');
            hasEN = (fallbackEN !== 'N.A.');
            if (hasDE && hasEN) flags = flags | 32;

            parsed.descDE = fallbackDE;
            parsed.descEN = fallbackEN;

          } else {
            var fetched = serkalHoleBeschreibungenMehrsprachigByTmdbId_(tmdbId);

            parsed.descDE = String((fetched && fetched.descDE) || parsed.descDE || '').trim() || 'N.A.';
            parsed.descEN = String((fetched && fetched.descEN) || parsed.descEN || '').trim() || 'N.A.';

            if (parsed.descDE !== 'N.A.' && parsed.descEN !== 'N.A.') flags = flags | 32;
          }

          var rebuilt = [
            parsed.staffelLabel,
            parsed.start ? ('start=' + parsed.start) : '',
            parsed.episoden ? ('eps=' + parsed.episoden) : '',
            tmdbId ? ('tmdb=' + tmdbId) : '',
            (parsed.titelOriginal || parsed.titleOriginal) ? ('titleOriginal=' + serkalEncodeField_(parsed.titelOriginal || parsed.titleOriginal)) : '',
            (parsed.termindaten && parsed.termindaten.length) ? ('dates=' + serkalCompressDateList_(parsed.termindaten).join(',')) : '',
            parsed.descDE ? ('descDE=' + serkalEncodeField_(parsed.descDE)) : '',
            parsed.descEN ? ('descEN=' + serkalEncodeField_(parsed.descEN)) : '',
            'flags=' + String(flags || 0)
          ].filter(Boolean).join('; ');

          if (rebuilt != raw) {
            fileChanged = true;
            geaendertStaffeln++;
          } else {
            uebersprungen++;
          }

          out.push(rebuilt);

        } catch (eLine) {
          fehler++;
          LOG_WARN('WARTUNG', 'Zeile konnte nicht verarbeitet werden: ' + skErr_(eLine), {
            fileName: fileName,
            line: raw
          });
          out.push(raw);
        }
      }

      if (fileChanged) {
        f.setContent(out.join('\n') + (out.length ? '\n' : ''));
        geaendertDateien++;
        LOG_INFO('WARTUNG', 'Datei geändert: ' + fileName, '');
      } else {
        LOG_INFO('WARTUNG', 'Datei unverändert: ' + fileName, '');
      }
    }

    serkalBaueArchivIndex_();

    var result = {
      ok: true,
      geprueftDateien: geprueftDateien,
      geprueftStaffeln: geprueftStaffeln,
      geaendertDateien: geaendertDateien,
      geaendertStaffeln: geaendertStaffeln,
      uebersprungen: uebersprungen,
      fehler: fehler
    };

    LOG_INFO('WARTUNG', 'Mehrsprachige Beschreibungen abgeschlossen', result);
    return result;

  } catch (e) {
    LOG_ERROR('WARTUNG', 'serkalWartungBeschreibungenMehrsprachig_ Fehler: ' + skErr_(e));
    return { ok: false, message: skErr_(e) };
  }
}



/* =====================================================================
 * 10.03 Zukunftsprüfung
 * =====================================================================
 * Reiner Aktualisierungslauf:
 * - Archivdateien lesen
 * - gespeicherte TMDB-ID als Identitätsanker verwenden
 * - TMDB-Aktualdaten holen
 * - alte Archivwerte gegen neue TMDB-Werte vergleichen
 * - Status / Zukunftslage bewerten
 * - Ergebnis ins Log schreiben
 *
 * WICHTIG:
 * - keine Archivdatei wird geändert
 * - keine Kalendereinträge werden gelöscht oder neu erzeugt
 * - keine TMDB-ID wird automatisch geändert
 */

/**
 * @id 10.03.001
 * @funktion apiStarteZukunftspruefung
 * @modul 10 Wartung
 * @gruppe Wartung / Zukunftsprüfung
 * @zweck UI/API-Brücke für die produktive Zukunftsprüfung mit Archiv-/Kalenderaktualisierung.
 * @status aktiv
 * @loeschung nein
 */
function apiStarteZukunftspruefung() {
  serkalWartungZaehleDurchlauf_('10.03.001', 'apiStarteZukunftspruefung');
  return serkalWartungZukunftspruefung_();
}

/**
 * @id 10.03.001a
 * @funktion apiLookForFuture
 * @modul 10 Wartung
 * @gruppe Wartung / Zukunftsprüfung
 * @zweck Englischer API-Alias für "Look for future"; startet den produktiven Aktualisierungslauf.
 * @status aktiv
 * @loeschung nein
 */
function apiLookForFuture() {
  serkalWartungZaehleDurchlauf_('10.03.001a', 'apiLookForFuture');
  return serkalWartungZukunftspruefung_();
}

/**
 * @id 10.03.001b
 * @funktion apiStarteLookForFuture
 * @modul 10 Wartung
 * @gruppe Wartung / Zukunftsprüfung
 * @zweck Deutscher/englischer Hybrid-Alias für die UI-Schaltfläche "Look for future".
 * @status aktiv
 * @loeschung nein
 */
function apiStarteLookForFuture() {
  serkalWartungZaehleDurchlauf_('10.03.001b', 'apiStarteLookForFuture');
  return serkalWartungZukunftspruefung_();
}

/**
 * @id 10.03.001c
 * @funktion apiLookForFutureApply
 * @modul 10 Wartung
 * @gruppe Wartung / Zukunftspruefung
 * @zweck Expliziter API-Alias fuer den produktiven Look-for-Future-Aktualisierungslauf.
 * @status aktiv
 * @loeschung nein
 */
function apiLookForFutureApply() {
  serkalWartungZaehleDurchlauf_('10.03.001c', 'apiLookForFutureApply');
  return serkalWartungZukunftspruefung_();
}

/**
 * @id 10.03.001d
 * @funktion apiStarteZukunftspruefungMitAenderungen
 * @modul 10 Wartung
 * @gruppe Wartung / Zukunftspruefung
 * @zweck Deutscher API-Alias fuer den produktiven Lauf mit Archiv-/Kalenderaktualisierung.
 * @status aktiv
 * @loeschung nein
 */
function apiStarteZukunftspruefungMitAenderungen() {
  serkalWartungZaehleDurchlauf_('10.03.001d', 'apiStarteZukunftspruefungMitAenderungen');
  return serkalWartungZukunftspruefung_();
}


/**
 * @id 10.03.002
 * @funktion serkalWartungZukunftspruefung_
 * @modul 10 Wartung
 * @gruppe Wartung / Zukunftsprüfung
 * @zweck Prüft alle Archivdateien gegen TMDB und schreibt nur Log-/Berichtsdaten.
 * @status aktiv
 * @loeschung nein
 */
function serkalWartungZukunftspruefung_() {
  serkalWartungZaehleDurchlauf_('10.03.002', 'serkalWartungZukunftspruefung_');
  var result = {
    ok: true,
    modus: 'LOOK_FOR_FUTURE_AUTO_UPDATE',
    geprueftDateien: 0,
    geprueftSerien: 0,
    ohneTmdbId: 0,
    tmdbFehler: 0,
    aktiv: 0,
    neueFolge: 0,
    fraglich: 0,
    abgesetzt: 0,
    abgeschlossen: 0,
    geaendert: 0,
    treffer: [],
    uebersprungenSystemdateien: 0,
    fehler: 0,
    gestartet: new Date().toISOString(),
    berichtText: '',
    reportFileName: ''
  };

  try {
    var folder = holeArchivFolder_();
    var files = folder.getFiles();
    var archivFiles = [];

    while (files.hasNext()) {
      var f = files.next();
      var fileName = String(f.getName() || '');
      if (fileName === SERKAL_ARCHIV_INDEX_NAME) continue;
      if (!/\.txt$/i.test(fileName)) continue;
      if (serkalWartungIstLogdatei_(fileName)) {
        result.uebersprungenSystemdateien++;
        continue;
      }
      archivFiles.push(f);
    }

    archivFiles.sort(function (a, b) {
      return String(a.getName() || '').localeCompare(String(b.getName() || ''));
    });

    LOG_INFO('WARTUNG', 'Zukunftsprüfung START', {
      modus: 'AUTO_UPDATE_ARCHIV_KALENDER',
      dateien: archivFiles.length,
      hinweis: 'Produktivlauf: vorhandene Staffeldaten werden aktualisiert; Kalender-Sync wird als Nachlauf markiert; neue unklare Staffeln bleiben Rueckfragefall.'
    });

    serkalWartungSetStatus_('Zukunftsprüfung startet (' + archivFiles.length + ')', {
      phase: 'start',
      nr: 0,
      gesamt: archivFiles.length
    });

    for (var i = 0; i < archivFiles.length; i++) {
      var file = archivFiles[i];
      var name = String(file.getName() || '');
      result.geprueftDateien++;

      var statusName = name.replace(/\.txt$/i, '');
      serkalWartungSetStatus_('Prüfe: ' + statusName + ' (' + (i + 1) + '/' + archivFiles.length + ')', {
        phase: 'pruefe',
        datei: name,
        nr: i + 1,
        gesamt: archivFiles.length
      });

      LOG_INFO('WARTUNG', 'ZUKUNFT PRUEFE DATEI', {
        datei: name,
        nr: i + 1,
        gesamt: archivFiles.length
      });

      try {
        var serienBericht = serkalZukunftPruefeArchivdatei_(file, i + 1, archivFiles.length);
        serkalZukunftZaehleBericht_(result, serienBericht);
      } catch (eFile) {
        result.fehler++;
        LOG_WARN('WARTUNG', 'Zukunftsprüfung Datei Fehler: ' + skErr_(eFile), {
          datei: name,
          nr: i + 1,
          gesamt: archivFiles.length
        });
      }
    }

    result.beendet = new Date().toISOString();
    result.berichtText = serkalZukunftBaueBerichtText_(result);
    result.reportFileName = serkalZukunftSpeichereBericht_(result);
    result.kalenderQueueFileName = serkalZukunftSpeichereKalenderQueue_(result);

    serkalWartungSetStatus_('Look for future abgeschlossen: ' + result.treffer.length + ' Treffer', {
      phase: 'ende',
      nr: archivFiles.length,
      gesamt: archivFiles.length,
      ok: true,
      treffer: result.treffer.length,
      reportFileName: result.reportFileName
    });

    LOG_INFO('WARTUNG', 'Zukunftsprüfung ENDE', {
      ok: result.ok,
      modus: result.modus,
      geprueftDateien: result.geprueftDateien,
      geprueftSerien: result.geprueftSerien,
      treffer: result.treffer.length,
      reportFileName: result.reportFileName,
      fehler: result.fehler
    });
    return result;

  } catch (e) {
    serkalWartungSetStatus_('Zukunftsprüfung fehlgeschlagen', {
      phase: 'fehler',
      ok: false,
      message: skErr_(e)
    });
    LOG_ERROR('WARTUNG', 'serkalWartungZukunftspruefung_ Fehler: ' + skErr_(e));
    result.ok = false;
    result.message = skErr_(e);
    return result;
  }
}

/**
 * @id 10.03.003
 * @funktion serkalZukunftPruefeArchivdatei_
 * @modul 10 Wartung
 * @gruppe Wartung / Zukunftsprüfung
 * @zweck Prüft eine Archivdatei gegen TMDB und protokolliert die Entscheidung.
 * @status aktiv
 * @loeschung nein
 */
function serkalZukunftPruefeArchivdatei_(file, nr, gesamt) {
  serkalWartungZaehleDurchlauf_('10.03.003', 'serkalZukunftPruefeArchivdatei_');
  var fileName = String(file && file.getName ? file.getName() : '');
  var content = file.getBlob().getDataAsString('UTF-8') || '';
  var lines = content.split(/\r?\n/);
  var seasons = [];

  for (var i = 0; i < lines.length; i++) {
    var raw = String(lines[i] || '').trim();
    if (!raw) continue;
    if (!/^S\d{1,2}(?:\b|;|\|)/i.test(raw)) continue;

    var parsed = serkalParseArchivZeile_(raw);
    if (parsed) {
      parsed.__raw = raw;
      seasons.push(parsed);
    }
  }

  var first = seasons.length ? seasons[0] : null;
  var tmdbId = serkalZukunftErsteTmdbId_(seasons);
  var archivTitel = serkalZukunftArchivTitel_(fileName, seasons);

  var bericht = {
    fileName: fileName,
    nr: nr || 0,
    gesamt: gesamt || 0,
    titelArchiv: archivTitel,
    tmdbId: tmdbId || 0,
    staffelnArchiv: seasons.length,
    status: 'UNGEPRUEFT',
    entscheidung: 'UNGEPRUEFT',
    aenderungen: [],
    aktion: 'PRUEFEN',
    prioritaet: 0,
    kurztext: ''
  };

  if (!tmdbId) {
    bericht.status = 'ID_FEHLT';
    bericht.entscheidung = 'Neusuche/Zuordnung erforderlich';
    serkalZukunftLogBefund_(bericht);
    LOG_WARN('WARTUNG', 'Zukunftsprüfung: TMDB-ID fehlt', bericht);
    return bericht;
  }

  var tvDE = null;
  var tvEN = null;
  try {
    tvDE = fetchTvDetailsFromTMDB_(tmdbId, 'de');
    try {
      tvEN = fetchTvDetailsFromTMDB_(tmdbId, 'en');
    } catch (_eEN) {
      tvEN = null;
    }
  } catch (eTmdb) {
    bericht.status = 'ID_UNGUELTIG_ODER_TMDB_FEHLER';
    bericht.entscheidung = 'Identitätsproblem / später neu prüfen';
    bericht.error = skErr_(eTmdb);
    serkalZukunftLogBefund_(bericht);
    LOG_WARN('WARTUNG', 'Zukunftsprüfung: TMDB-Abfrage fehlgeschlagen', bericht);
    return bericht;
  }

  var tmdbStatus = String((tvDE && tvDE.status) || (tvEN && tvEN.status) || '').trim();
  var tmdbName = String((tvDE && tvDE.name) || (tvEN && tvEN.name) || '').trim();
  var tmdbOriginalName = String((tvDE && tvDE.original_name) || (tvEN && tvEN.original_name) || '').trim();
  var tmdbSeasonCount = Number((tvDE && tvDE.number_of_seasons) || (tvEN && tvEN.number_of_seasons) || 0) || 0;
  var tmdbEpisodeCount = Number((tvDE && tvDE.number_of_episodes) || (tvEN && tvEN.number_of_episodes) || 0) || 0;
  var lastAirDate = String((tvDE && tvDE.last_air_date) || (tvEN && tvEN.last_air_date) || '').trim();
  var nextEpisode = (tvDE && tvDE.next_episode_to_air) || (tvEN && tvEN.next_episode_to_air) || null;
  var nextAirDate = nextEpisode && nextEpisode.air_date ? String(nextEpisode.air_date) : '';

  bericht.status = serkalZukunftBewerteStatus_(tmdbStatus, lastAirDate, nextAirDate);
  bericht.entscheidung = serkalZukunftEntscheidungText_(bericht.status);
  bericht.tmdbStatus = tmdbStatus || 'unbekannt';
  bericht.tmdbTitel = tmdbName || tmdbOriginalName || '';
  bericht.tmdbOriginalTitel = tmdbOriginalName || '';
  bericht.staffelnTmdb = tmdbSeasonCount;
  bericht.episodenTmdb = tmdbEpisodeCount;
  bericht.letzteFolge = lastAirDate || '';
  bericht.naechsteFolge = nextAirDate || '';

  serkalZukunftVergleicheFeld_(bericht, 'Titel', archivTitel, tmdbName || tmdbOriginalName || '');

  if (tmdbSeasonCount && seasons.length && tmdbSeasonCount !== seasons.length) {
    bericht.aenderungen.push({
      feld: 'Staffelanzahl',
      alt: seasons.length,
      neu: tmdbSeasonCount,
      bewertung: tmdbSeasonCount > seasons.length ? 'moegliche neue Staffel' : 'TMDB meldet weniger Staffeln'
    });
  }

  var archivEpisodeSum = serkalZukunftArchivEpisodenSumme_(seasons);
  if (tmdbEpisodeCount && archivEpisodeSum && tmdbEpisodeCount !== archivEpisodeSum) {
    bericht.aenderungen.push({
      feld: 'Episodenanzahl gesamt',
      alt: archivEpisodeSum,
      neu: tmdbEpisodeCount,
      bewertung: 'Abweichung nur melden'
    });
  }

  var seasonCompare = serkalZukunftVergleicheStaffeln_(seasons, tvDE || tvEN || {});
  if (seasonCompare && seasonCompare.length) {
    bericht.aenderungen = bericht.aenderungen.concat(seasonCompare);
  }

  var autoUpdate = serkalZukunftFuehreAutoUpdateAus_(file, content, seasons, tvDE || tvEN || {}, bericht);
  if (autoUpdate && autoUpdate.aenderungen && autoUpdate.aenderungen.length) {
    bericht.aenderungen = bericht.aenderungen.concat(autoUpdate.aenderungen);
  }
  if (autoUpdate && autoUpdate.aktion) {
    bericht.aktion = autoUpdate.aktion;
  }
  if (autoUpdate && autoUpdate.kalender && autoUpdate.kalender.length) {
    bericht.kalender = autoUpdate.kalender;
  }
  if (autoUpdate && autoUpdate.rueckfragen && autoUpdate.rueckfragen.length) {
    bericht.rueckfragen = autoUpdate.rueckfragen;
  }

  if (bericht.aenderungen.length) {
    bericht.hatAenderungen = true;
  }

  serkalZukunftBewerteTreffer_(bericht);

  serkalZukunftLogBefund_(bericht);
  LOG_INFO('WARTUNG', 'Zukunftsprüfung: Serie bewertet', bericht);
  return bericht;
}

/**
 * @id 10.03.004
 * @funktion serkalZukunftVergleicheStaffeln_
 * @modul 10 Wartung
 * @gruppe Wartung / Zukunftsprüfung
 * @zweck Vergleicht gespeicherte Staffelangaben grob mit TMDB-Staffelmetadaten.
 * @status aktiv
 * @loeschung nein
 */
function serkalZukunftVergleicheStaffeln_(archivStaffeln, tvDetails) {
  serkalWartungZaehleDurchlauf_('10.03.004', 'serkalZukunftVergleicheStaffeln_');
  var out = [];
  var list = (tvDetails && Array.isArray(tvDetails.seasons)) ? tvDetails.seasons : [];
  if (!archivStaffeln || !archivStaffeln.length || !list.length) return out;

  var bySeason = {};
  for (var i = 0; i < list.length; i++) {
    var s = list[i] || {};
    var nr = Number(s.season_number || 0);
    if (nr > 0) bySeason[nr] = s;
  }

  for (var j = 0; j < archivStaffeln.length; j++) {
    var a = archivStaffeln[j] || {};
    var label = String(a.staffelLabel || '').toUpperCase();
    var m = label.match(/^S(\d{1,2})$/);
    if (!m) continue;

    var sn = Number(m[1] || 0);
    var tm = bySeason[sn];
    if (!tm) continue;

    var epsAlt = Number(a.episoden || a.eps || 0) || 0;
    var epsNeu = Number(tm.episode_count || 0) || 0;
    if (epsAlt && epsNeu && epsAlt !== epsNeu) {
      out.push({
        feld: 'Episoden ' + label,
        alt: epsAlt,
        neu: epsNeu,
        bewertung: 'Staffel-Episodenzahl abweichend'
      });
    }

    var startAlt = String(a.startOriginal || a.start || '').trim();
    var startNeu = String(tm.air_date || '').trim();
    if (startAlt && startNeu && startAlt !== startNeu) {
      out.push({
        feld: 'Start ' + label,
        alt: startAlt,
        neu: startNeu,
        bewertung: 'Staffelstart abweichend'
      });
    }
  }

  return out;
}


/* =====================================================================
 * 10.04 Änderungsklassifizierung
 * =====================================================================
 * Erste Konstanten/Funktionen für den Aktualisierungslauf. Die echten ManualFlags
 * werden erst mit der späteren Editierfunktion aktiv gesetzt/ausgewertet.
 */

var SERKAL_MANUAL_TITLE    = 1;
var SERKAL_MANUAL_DESC_DE  = 2;
var SERKAL_MANUAL_DESC_EN  = 4;
var SERKAL_MANUAL_START    = 8;
var SERKAL_MANUAL_DATES    = 16;
var SERKAL_MANUAL_EPISODES = 32;
var SERKAL_MANUAL_POSTER   = 64;
var SERKAL_MANUAL_NOTES    = 128;

/**
 * @id 10.04.001
 * @funktion serkalZukunftBewerteStatus_
 * @modul 10 Wartung
 * @gruppe Wartung / Änderungsklassifizierung
 * @zweck Ordnet TMDB-Status und Sendetermine in einen SerKal-Zukunftsstatus ein.
 * @status aktiv
 * @loeschung nein
 */
function serkalZukunftBewerteStatus_(tmdbStatus, lastAirDate, nextAirDate) {
  serkalWartungZaehleDurchlauf_('10.04.001', 'serkalZukunftBewerteStatus_');
  var st = String(tmdbStatus || '').toLowerCase();
  if (nextAirDate) return 'NEUE_FOLGE_ODER_STAFFEL';
  if (st === 'ended') return 'ABGESCHLOSSEN';
  if (st === 'canceled' || st === 'cancelled') return 'ABGESETZT';
  if (st === 'planned' || st === 'in production' || st === 'pilot') return 'AKTIV_GEPLANT';
  if (st === 'returning series') {
    if (serkalZukunftIstLangeStill_(lastAirDate, 730)) return 'FRAGLICH_SCHLAFEND';
    return 'AKTIV_BEOBACHTEN';
  }
  if (lastAirDate && serkalZukunftIstLangeStill_(lastAirDate, 1095)) return 'FRAGLICH_SCHLAFEND';
  return 'UNKLAR_BEOBACHTEN';
}

/**
 * @id 10.04.002
 * @funktion serkalZukunftEntscheidungText_
 * @modul 10 Wartung
 * @gruppe Wartung / Änderungsklassifizierung
 * @zweck Liefert einen verständlichen Entscheidungstext zum Zukunftsstatus.
 * @status aktiv
 * @loeschung nein
 */
function serkalZukunftEntscheidungText_(status) {
  serkalWartungZaehleDurchlauf_('10.04.002', 'serkalZukunftEntscheidungText_');
  switch (String(status || '')) {
    case 'NEUE_FOLGE_ODER_STAFFEL': return 'Neue Folge/Staffel möglich – später genauer prüfen';
    case 'ABGESCHLOSSEN': return 'Abgeschlossen – Kandidat für spätere Prüfung AUS';
    case 'ABGESETZT': return 'Abgesetzt – weiter nur selten/fraglich beobachten';
    case 'AKTIV_GEPLANT': return 'Aktiv/geplant – weiter beobachten';
    case 'AKTIV_BEOBACHTEN': return 'Aktiv – weiter beobachten';
    case 'FRAGLICH_SCHLAFEND': return 'Fraglich/schlafend – selten prüfen';
    default: return 'Unklar – weiter beobachten';
  }
}

/**
 * @id 10.04.003
 * @funktion serkalZukunftVergleicheFeld_
 * @modul 10 Wartung
 * @gruppe Wartung / Änderungsklassifizierung
 * @zweck Fügt eine Änderung hinzu, wenn zwei Werte normalisiert voneinander abweichen.
 * @status aktiv
 * @loeschung nein
 */
function serkalZukunftVergleicheFeld_(bericht, feld, alt, neu) {
  serkalWartungZaehleDurchlauf_('10.04.003', 'serkalZukunftVergleicheFeld_');
  var a = String(alt || '').replace(/\s+/g, ' ').trim();
  var n = String(neu || '').replace(/\s+/g, ' ').trim();
  if (!a || !n) return;
  if (a.toLowerCase() === n.toLowerCase()) return;
  bericht.aenderungen.push({
    feld: feld,
    alt: a,
    neu: n,
    bewertung: 'abweichend – nur melden'
  });
}

/**
 * @id 10.04.004
 * @funktion serkalZukunftIstLangeStill_
 * @modul 10 Wartung
 * @gruppe Wartung / Änderungsklassifizierung
 * @zweck Prüft, ob seit einem ISO-Datum mehr als N Tage vergangen sind.
 * @status aktiv
 * @loeschung nein
 */
function serkalZukunftIstLangeStill_(iso, tage) {
  serkalWartungZaehleDurchlauf_('10.04.004', 'serkalZukunftIstLangeStill_');
  var s = String(iso || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  var d = new Date(s + 'T00:00:00');
  if (isNaN(d.getTime())) return false;
  var diff = (new Date()).getTime() - d.getTime();
  return diff > (Number(tage || 0) * 24 * 60 * 60 * 1000);
}

/**
 * @id 10.04.005
 * @funktion serkalZukunftErsteTmdbId_
 * @modul 10 Wartung
 * @gruppe Wartung / Änderungsklassifizierung
 * @zweck Ermittelt die erste gespeicherte TMDB-ID aus den Archivstaffeln.
 * @status aktiv
 * @loeschung nein
 */
function serkalZukunftErsteTmdbId_(seasons) {
  serkalWartungZaehleDurchlauf_('10.04.005', 'serkalZukunftErsteTmdbId_');
  var list = Array.isArray(seasons) ? seasons : [];
  for (var i = 0; i < list.length; i++) {
    var id = Number(list[i] && list[i].tmdbId || 0);
    if (isFinite(id) && id > 0) return id;
  }
  return 0;
}

/**
 * @id 10.04.006
 * @funktion serkalZukunftArchivTitel_
 * @modul 10 Wartung
 * @gruppe Wartung / Änderungsklassifizierung
 * @zweck Ermittelt einen Anzeigetitel aus Archivdaten oder Dateiname.
 * @status aktiv
 * @loeschung nein
 */
function serkalZukunftArchivTitel_(fileName, seasons) {
  serkalWartungZaehleDurchlauf_('10.04.006', 'serkalZukunftArchivTitel_');
  var list = Array.isArray(seasons) ? seasons : [];
  for (var i = 0; i < list.length; i++) {
    var t = String((list[i] && (list[i].titelOriginal || list[i].titleOriginal)) || '').trim();
    if (t) return t;
  }
  return String(fileName || '').replace(/\.txt$/i, '').replace(/_/g, ' ').trim();
}

/**
 * @id 10.04.007
 * @funktion serkalZukunftArchivEpisodenSumme_
 * @modul 10 Wartung
 * @gruppe Wartung / Änderungsklassifizierung
 * @zweck Summiert gespeicherte Episodenzahlen aus Archivstaffeln.
 * @status aktiv
 * @loeschung nein
 */
function serkalZukunftArchivEpisodenSumme_(seasons) {
  serkalWartungZaehleDurchlauf_('10.04.007', 'serkalZukunftArchivEpisodenSumme_');
  var list = Array.isArray(seasons) ? seasons : [];
  var sum = 0;
  for (var i = 0; i < list.length; i++) {
    sum += Number(list[i] && (list[i].episoden || list[i].eps) || 0) || 0;
  }
  return sum;
}


/**
 * @id 10.04.008
 * @funktion serkalZukunftBewerteTreffer_
 * @modul 10 Wartung
 * @gruppe Wartung / Änderungsklassifizierung
 * @zweck Bewertet, ob ein Zukunftsprüfungsbericht in der sichtbaren Trefferliste erscheinen soll.
 * @status aktiv
 * @loeschung nein
 */
function serkalZukunftBewerteTreffer_(bericht) {
  serkalWartungZaehleDurchlauf_('10.04.008', 'serkalZukunftBewerteTreffer_');
  if (!bericht) return bericht;

  var status = String(bericht.status || '');
  var aenderungen = Array.isArray(bericht.aenderungen) ? bericht.aenderungen : [];
  var prioritaet = 0;
  var teile = [];

  if (!bericht.tmdbId) {
    prioritaet = Math.max(prioritaet, 80);
    teile.push('TMDB-ID fehlt');
  }

  if (status === 'ID_UNGUELTIG_ODER_TMDB_FEHLER') {
    prioritaet = Math.max(prioritaet, 90);
    teile.push('TMDB-Abfrage/ID prüfen');
  }

  if (status === 'NEUE_FOLGE_ODER_STAFFEL') {
    prioritaet = Math.max(prioritaet, 100);
    teile.push('Neue Folge/Staffel möglich');
  }

  if (status === 'AKTIV_GEPLANT' || status === 'AKTIV_BEOBACHTEN') {
    prioritaet = Math.max(prioritaet, 40);
    teile.push('Aktiv beobachten');
  }

  if (status === 'FRAGLICH_SCHLAFEND' || status === 'UNKLAR_BEOBACHTEN') {
    prioritaet = Math.max(prioritaet, 35);
    teile.push('Status unklar/schlafend');
  }

  if (status === 'ABGESETZT') {
    prioritaet = Math.max(prioritaet, 20);
    teile.push('Abgesetzt');
  }

  if (aenderungen.length) {
    prioritaet = Math.max(prioritaet, 70);
    teile.push(String(aenderungen.length) + ' Abweichung(en)');
  }

  if (bericht.naechsteFolge) {
    prioritaet = Math.max(prioritaet, 100);
    teile.push('nächste Folge: ' + bericht.naechsteFolge);
  }

  bericht.prioritaet = prioritaet;
  bericht.istTreffer = prioritaet >= 70 || status === 'NEUE_FOLGE_ODER_STAFFEL';
  bericht.kurztext = teile.join(' | ') || String(bericht.entscheidung || '');

  return bericht;
}

/**
 * @id 10.04.009
 * @funktion serkalZukunftKompaktTreffer_
 * @modul 10 Wartung
 * @gruppe Wartung / Änderungsklassifizierung
 * @zweck Erzeugt einen kompakten Treffer für Ergebnislisten und UI-Rückgaben.
 * @status aktiv
 * @loeschung nein
 */
function serkalZukunftKompaktTreffer_(bericht) {
  serkalWartungZaehleDurchlauf_('10.04.009', 'serkalZukunftKompaktTreffer_');
  var aenderungen = Array.isArray(bericht && bericht.aenderungen) ? bericht.aenderungen : [];
  return {
    titel: String((bericht && (bericht.titelArchiv || bericht.fileName)) || ''),
    datei: String((bericht && bericht.fileName) || ''),
    tmdbId: Number((bericht && bericht.tmdbId) || 0),
    status: String((bericht && bericht.status) || ''),
    tmdbStatus: String((bericht && bericht.tmdbStatus) || ''),
    entscheidung: String((bericht && bericht.entscheidung) || ''),
    kurztext: String((bericht && bericht.kurztext) || ''),
    prioritaet: Number((bericht && bericht.prioritaet) || 0),
    naechsteFolge: String((bericht && bericht.naechsteFolge) || ''),
    letzteFolge: String((bericht && bericht.letzteFolge) || ''),
    aenderungen: aenderungen
  };
}


/**
 * @id 10.04.020
 * @funktion serkalZukunftFuehreAutoUpdateAus_
 * @modul 10 Wartung
 * @gruppe Wartung / Look for future
 * @zweck Uebernimmt kalenderrelevante TMDB-Aenderungen fuer vorhandene Archivstaffeln direkt und synchronisiert danach den Kalender.
 * @status aktiv
 * @loeschung nein
 */
function serkalZukunftFuehreAutoUpdateAus_(file, originalContent, archivStaffeln, tvDetails, bericht) {
  serkalWartungZaehleDurchlauf_('10.04.020', 'serkalZukunftFuehreAutoUpdateAus_');
  var res = { ok: true, aenderungen: [], kalender: [], rueckfragen: [], aktion: '' };
  try {
    if (!file || !file.setContent || !archivStaffeln || !archivStaffeln.length || !tvDetails) return res;

    var tmdbId = Number((bericht && bericht.tmdbId) || serkalZukunftErsteTmdbId_(archivStaffeln) || 0);
    if (!tmdbId) return res;

    var tmdbSeasons = Array.isArray(tvDetails.seasons) ? tvDetails.seasons : [];
    var tmdbByNr = {};
    for (var i = 0; i < tmdbSeasons.length; i++) {
      var ts = tmdbSeasons[i] || {};
      var nr = Number(ts.season_number || 0);
      if (nr > 0) tmdbByNr[nr] = ts;
    }

    var lines = String(originalContent || '').split(/\r?\n/);
    var changed = false;
    var changedStaffeln = [];
    var oldDatesByStaffel = {};
    var newLines = [];

    for (var l = 0; l < lines.length; l++) {
      var rawLine = String(lines[l] || '');
      var raw = rawLine.trim();
      if (!raw) { newLines.push(rawLine); continue; }
      if (!/^S\d{1,2}(?:\b|;|\|)/i.test(raw)) { newLines.push(rawLine); continue; }

      var parsed = null;
      try { parsed = serkalParseArchivZeile_(raw); } catch (_eParse) { parsed = null; }
      if (!parsed) { newLines.push(rawLine); continue; }

      var label = String(parsed.staffelLabel || '').toUpperCase();
      var sn = serkalZukunftStaffelNummerAusLabel_(label);
      var tm = tmdbByNr[sn];
      if (!sn || !tm) { newLines.push(rawLine); continue; }

      var before = JSON.stringify({
        start: parsed.start || parsed.startOriginal || '',
        episoden: parsed.episoden || parsed.eps || '',
        dates: parsed.termindaten || [],
        descDE: parsed.descDE || '',
        descEN: parsed.descEN || ''
      });

      var altDates = Array.isArray(parsed.termindaten) ? parsed.termindaten.slice() : [];
      oldDatesByStaffel[label] = altDates;

      serkalZukunftAktualisiereStaffelAusTmdb_(parsed, tmdbId, sn, tm);

      var after = JSON.stringify({
        start: parsed.start || parsed.startOriginal || '',
        episoden: parsed.episoden || parsed.eps || '',
        dates: parsed.termindaten || [],
        descDE: parsed.descDE || '',
        descEN: parsed.descEN || ''
      });

      if (before !== after) {
        changed = true;
        changedStaffeln.push(label);
        res.aenderungen.push({
          feld: 'Archiv ' + label,
          alt: 'gespeicherte Staffelwerte',
          neu: 'TMDB-Werte uebernommen',
          bewertung: 'Archiv direkt aktualisiert; Kalender-Sync im Nachlauf offen'
        });
      }

      newLines.push(serkalZukunftBaueArchivZeileAusParsed_(parsed));
    }

    var neueStaffelInfo = serkalZukunftPruefeNeueVollstaendigeStaffel_(archivStaffeln, tvDetails, tmdbId, bericht);
    if (neueStaffelInfo && neueStaffelInfo.rueckfrage) {
      res.rueckfragen.push(neueStaffelInfo.rueckfrage);
    } else if (neueStaffelInfo && neueStaffelInfo.line) {
      changed = true;
      changedStaffeln.push(neueStaffelInfo.label);
      newLines.push(neueStaffelInfo.line);
      res.aenderungen.push({
        feld: 'Neue Staffel ' + neueStaffelInfo.label,
        alt: '-',
        neu: neueStaffelInfo.label,
        bewertung: 'vollstaendig bei TMDB gefunden und automatisch ergaenzt'
      });
    }

    if (!changed) return res;

    file.setContent(newLines.join('\n').replace(/\n+$/,'') + '\n');

    try {
      if (typeof serkalBaueArchivIndex_ === 'function') serkalBaueArchivIndex_();
    } catch (eIdx) {
      LOG_WARN('WARTUNG', 'Look for future: Archivindex konnte nicht aktualisiert werden: ' + skErr_(eIdx), { fileName: file.getName() });
    }

    for (var c = 0; c < changedStaffeln.length; c++) {
      var staffelLabel = String(changedStaffeln[c] || '').toUpperCase();

      /*
       * DONE5/ARCHIV_FIRST:
       * Der Kalender-Sync wird bewusst NICHT mehr im Hauptlauf ausgeführt.
       * Grund: serkalSynchronisiereKalender_ ruft mehrfach getArchivDaten/rebuild auf
       * und verursacht bei 63 Serien Timeouts bzw. HTTP 502.
       *
       * Die Archivdatei ist an dieser Stelle bereits aktualisiert.
       * Der Kalenderbedarf wird nur protokolliert und kann später in einem
       * eigenen, kleineren Nachlauf abgearbeitet werden.
       */
      res.kalender.push({
        staffel: staffelLabel,
        title: serkalZukunftTitelOhneJahr_(String((bericht && bericht.titelArchiv) || '')),
        titleArchiv: String((bericht && bericht.titelArchiv) || ''),
        fileName: (file && file.getName) ? String(file.getName() || '') : '',
        oldDates: oldDatesByStaffel[staffelLabel] || [],
        result: {
          ok: true,
          pending: true,
          reason: 'KALENDER_SYNC_NACHLAUF_OFFEN',
          alteCount: (oldDatesByStaffel[staffelLabel] || []).length
        }
      });
    }

    res.aktion = 'ARCHIV_AKTUALISIERT_KALENDER_NACHLAUF_OFFEN';
    LOG_INFO('WARTUNG', 'Look for future: Auto-Update ausgefuehrt', {
      datei: file.getName(),
      staffeln: changedStaffeln,
      kalender: res.kalender,
      rueckfragen: res.rueckfragen
    });
    return res;

  } catch (e) {
    res.ok = false;
    res.aktion = 'AUTO_UPDATE_FEHLER';
    res.message = skErr_(e);
    LOG_ERROR('WARTUNG', 'serkalZukunftFuehreAutoUpdateAus_ Fehler: ' + skErr_(e));
    return res;
  }
}

/**
 * @id 10.04.021
 * @funktion serkalZukunftAktualisiereStaffelAusTmdb_
 * @modul 10 Wartung
 * @gruppe Wartung / Look for future
 * @zweck Uebernimmt Start, Episodenzahl, reale Sendetermine und Beschreibung einer bestehenden Staffel aus TMDB, wenn vollwertige Daten vorliegen.
 * @status aktiv
 * @loeschung nein
 */
function serkalZukunftAktualisiereStaffelAusTmdb_(parsed, tmdbId, staffelNummer, seasonSummary) {
  serkalWartungZaehleDurchlauf_('10.04.021', 'serkalZukunftAktualisiereStaffelAusTmdb_');
  var summary = seasonSummary || {};
  var details = null;
  try {
    if (typeof fetchSeasonDetailsFromTMDB === 'function') {
      details = fetchSeasonDetailsFromTMDB(tmdbId, staffelNummer);
    } else if (typeof fetchSeasonDetailsFromTMDB_ === 'function') {
      details = fetchSeasonDetailsFromTMDB_(tmdbId, staffelNummer);
    }
  } catch (_e) { details = null; }

  var source = details || summary;
  var eps = Number((source && (source.episode_count || source.episodes_count)) || summary.episode_count || 0) || 0;
  var airDate = String((source && source.air_date) || summary.air_date || '').trim();

  if (airDate && /^\d{4}-\d{2}-\d{2}$/.test(airDate)) {
    parsed.start = airDate;
    parsed.startOriginal = airDate;
  }

  if (eps > 0) parsed.episoden = eps;

  var termine = serkalZukunftTermineAusSeasonDetails_(details || source, eps);
  if (termine.length) parsed.termindaten = termine;

  var overview = String((source && source.overview) || '').trim();
  if (overview) {
    if (!String(parsed.descDE || '').trim() || String(parsed.descDE).trim() === 'N.A.' || String(parsed.descDE).trim() === 'V.A.') parsed.descDE = overview;
  }

  if (parsed.tmdbId == null || !Number(parsed.tmdbId)) parsed.tmdbId = tmdbId;
}

/**
 * @id 10.04.022
 * @funktion serkalZukunftTermineAusSeasonDetails_
 * @modul 10 Wartung
 * @gruppe Wartung / Look for future
 * @zweck Baut eine Terminliste aus TMDB-Staffeldetails, wenn Episoden sauber nummeriert und datiert sind.
 * @status aktiv
 * @loeschung nein
 */
function serkalZukunftTermineAusSeasonDetails_(seasonDetails, expectedEpisodes) {
  serkalWartungZaehleDurchlauf_('10.04.022', 'serkalZukunftTermineAusSeasonDetails_');
  var eps = seasonDetails && Array.isArray(seasonDetails.episodes) ? seasonDetails.episodes : [];
  var expected = Number(expectedEpisodes || eps.length || 0) || 0;
  if (!eps.length || !expected) return [];

  var byNr = {};
  for (var i = 0; i < eps.length; i++) {
    var e = eps[i] || {};
    var nr = Number(e.episode_number || 0);
    var d = String(e.air_date || '').trim();
    if (nr > 0 && /^\d{4}-\d{2}-\d{2}$/.test(d)) byNr[nr] = d;
  }

  var out = [];
  for (var n = 1; n <= expected; n++) {
    if (!byNr[n]) return [];
    out.push(byNr[n]);
  }
  return out;
}

/**
 * @id 10.04.023
 * @funktion serkalZukunftPruefeNeueVollstaendigeStaffel_
 * @modul 10 Wartung
 * @gruppe Wartung / Look for future
 * @zweck Ergaenzt eine neue Staffel nur bei vollstaendigen TMDB-Terminen; bei laufender aktueller Staffel Rueckfrage statt Automatik.
 * @status aktiv
 * @loeschung nein
 */
function serkalZukunftPruefeNeueVollstaendigeStaffel_(archivStaffeln, tvDetails, tmdbId, bericht) {
  serkalWartungZaehleDurchlauf_('10.04.023', 'serkalZukunftPruefeNeueVollstaendigeStaffel_');
  var maxArchiv = 0;
  for (var i = 0; i < archivStaffeln.length; i++) {
    maxArchiv = Math.max(maxArchiv, serkalZukunftStaffelNummerAusLabel_(archivStaffeln[i].staffelLabel));
  }
  var maxTmdb = Number((tvDetails && tvDetails.number_of_seasons) || 0) || 0;
  if (!maxTmdb || maxTmdb <= maxArchiv) return null;

  var aktuelleLaeuftNoch = serkalZukunftArchivStaffelWirktLaufend_(archivStaffeln, maxArchiv);
  if (aktuelleLaeuftNoch) {
    return { rueckfrage: 'Neue Staffel S' + pad2_(maxTmdb) + ' gefunden, aber bisherige letzte Staffel wirkt noch laufend. Benutzerentscheidung erforderlich.' };
  }

  var summary = null;
  var list = Array.isArray(tvDetails.seasons) ? tvDetails.seasons : [];
  for (var s = 0; s < list.length; s++) {
    if (Number(list[s].season_number || 0) === maxTmdb) summary = list[s];
  }
  if (!summary) return null;

  var tmp = { staffelLabel: 'S' + pad2_(maxTmdb), tmdbId: tmdbId, flags: 0 };
  serkalZukunftAktualisiereStaffelAusTmdb_(tmp, tmdbId, maxTmdb, summary);

  var eps = Number(tmp.episoden || 0) || 0;
  var dates = Array.isArray(tmp.termindaten) ? tmp.termindaten : [];
  if (!eps || dates.length !== eps) return null;

  return { label: tmp.staffelLabel, line: serkalZukunftBaueArchivZeileAusParsed_(tmp) };
}

/**
 * @id 10.04.024
 * @funktion serkalZukunftArchivStaffelWirktLaufend_
 * @modul 10 Wartung
 * @gruppe Wartung / Look for future
 * @zweck Prueft grob, ob die bisher letzte Archivstaffel noch unvollstaendig oder zukunftsnah wirkt.
 * @status aktiv
 * @loeschung nein
 */
function serkalZukunftArchivStaffelWirktLaufend_(archivStaffeln, maxStaffel) {
  serkalWartungZaehleDurchlauf_('10.04.024', 'serkalZukunftArchivStaffelWirktLaufend_');
  for (var i = 0; i < archivStaffeln.length; i++) {
    var a = archivStaffeln[i] || {};
    if (serkalZukunftStaffelNummerAusLabel_(a.staffelLabel) !== maxStaffel) continue;
    var eps = Number(a.episoden || a.eps || 0) || 0;
    var dates = Array.isArray(a.termindaten) ? a.termindaten : [];
    if (eps && dates.length && dates.length < eps) return true;
    if (!dates.length) return true;
    var last = String(dates[dates.length - 1] || '').trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(last)) {
      var d = new Date(last + 'T00:00:00');
      if (!isNaN(d.getTime()) && d.getTime() >= (new Date()).getTime()) return true;
    }
  }
  return false;
}

/**
 * @id 10.04.025
 * @funktion serkalZukunftBaueArchivZeileAusParsed_
 * @modul 10 Wartung
 * @gruppe Wartung / Look for future
 * @zweck Baut eine Archivzeile aus parsed-Daten im kompakten TXT-Format neu auf.
 * @status aktiv
 * @loeschung nein
 */
function serkalZukunftBaueArchivZeileAusParsed_(parsed) {
  serkalWartungZaehleDurchlauf_('10.04.025', 'serkalZukunftBaueArchivZeileAusParsed_');
  var p = parsed || {};
  var flags = Number(p.flags || 0) || 0;
  return [
    String(p.staffelLabel || '').toUpperCase(),
    (p.start || p.startOriginal) ? ('start=' + String(p.start || p.startOriginal)) : '',
    (p.episoden || p.eps) ? ('eps=' + String(p.episoden || p.eps)) : '',
    p.tmdbId ? ('tmdb=' + String(p.tmdbId)) : '',
    (p.titelOriginal || p.titleOriginal) ? ('titleOriginal=' + serkalEncodeField_(p.titelOriginal || p.titleOriginal)) : '',
    (p.termindaten && p.termindaten.length) ? ('dates=' + serkalCompressDateList_(p.termindaten).join(',')) : '',
    p.descDE ? ('descDE=' + serkalEncodeField_(p.descDE)) : '',
    p.descEN ? ('descEN=' + serkalEncodeField_(p.descEN)) : '',
    'flags=' + String(flags)
  ].filter(Boolean).join('; ');
}

/**
 * @id 10.04.026
 * @funktion serkalZukunftStaffelNummerAusLabel_
 * @modul 10 Wartung
 * @gruppe Wartung / Look for future
 * @zweck Ermittelt eine Staffelnummer aus S01/S1/1.
 * @status aktiv
 * @loeschung nein
 */
function serkalZukunftStaffelNummerAusLabel_(label) {
  serkalWartungZaehleDurchlauf_('10.04.026', 'serkalZukunftStaffelNummerAusLabel_');
  var m = String(label || '').toUpperCase().match(/^(?:S)?(\d{1,2})$/);
  return m ? (Number(m[1]) || 0) : 0;
}



/**
 * @id 10.04.027
 * @funktion serkalZukunftTitelOhneJahr_
 * @modul 10 Wartung
 * @gruppe Wartung / Look for future
 * @zweck Entfernt ein angehängtes Jahr in Klammern, damit Kalender-Sync den Serientitel sauberer findet.
 * @status aktiv
 * @loeschung nein
 */
function serkalZukunftTitelOhneJahr_(titel) {
  serkalWartungZaehleDurchlauf_('10.04.027', 'serkalZukunftTitelOhneJahr_');
  return String(titel || '').replace(/\s*\(\d{4}\)\s*$/,'').trim();
}

/**
 * @id 10.04.028
 * @funktion serkalZukunftSpeichereKalenderQueue_
 * @modul 10 Wartung
 * @gruppe Wartung / Look for future
 * @zweck Speichert offene Kalender-Sync-Aufgaben aus dem Hauptlauf als Queue-Datei.
 * @status aktiv
 * @loeschung nein
 */
function serkalZukunftSpeichereKalenderQueue_(result) {
  serkalWartungZaehleDurchlauf_('10.04.028', 'serkalZukunftSpeichereKalenderQueue_');
  try {
    var list = [];
    var treffer = result && Array.isArray(result.treffer) ? result.treffer : [];

    for (var i = 0; i < treffer.length; i++) {
      var b = treffer[i] || {};
      var kal = Array.isArray(b.kalender) ? b.kalender : [];

      for (var k = 0; k < kal.length; k++) {
        var x = kal[k] || {};
        if (!x.result || !x.result.pending) continue;

        list.push({
          done: false,
          created: new Date().toISOString(),
          serie: serkalZukunftTitelOhneJahr_(x.title || b.titelArchiv || ''),
          titelArchiv: x.titleArchiv || b.titelArchiv || '',
          fileName: x.fileName || b.fileName || '',
          staffel: String(x.staffel || '').toUpperCase(),
          oldDates: Array.isArray(x.oldDates) ? x.oldDates : []
        });
      }
    }

    if (!list.length) {
      LOG_INFO('WARTUNG', 'Look for future: Keine Kalender-Queue nötig', {});
      return '';
    }

    var folder = holeArchivFolder_();
    var name = '!!SerKal_LOOK_FOR_FUTURE_KALENDER_QUEUE.json';
    var data = JSON.stringify({
      ok: true,
      created: new Date().toISOString(),
      count: list.length,
      open: list.length,
      items: list
    }, null, 2);

    var files = folder.getFilesByName(name);
    if (files.hasNext()) {
      files.next().setContent(data);
    } else {
      folder.createFile(name, data, MimeType.PLAIN_TEXT);
    }

    LOG_INFO('WARTUNG', 'Look for future: Kalender-Queue gespeichert', {
      fileName: name,
      count: list.length
    });
    return name;

  } catch (e) {
    LOG_WARN('WARTUNG', 'Look for future: Kalender-Queue konnte nicht gespeichert werden: ' + skErr_(e), {});
    return '';
  }
}

/**
 * @id 10.04.029
 * @funktion apiLookForFutureKalenderNachlauf
 * @modul 10 Wartung
 * @gruppe Wartung / Look for future
 * @zweck Arbeitet offene Kalender-Sync-Aufgaben aus der Queue portioniert ab.
 * @status aktiv
 * @loeschung nein
 */
function apiLookForFutureKalenderNachlauf(maxItems) {
  serkalWartungZaehleDurchlauf_('10.04.029', 'apiLookForFutureKalenderNachlauf');

  var limit = Number(maxItems || 5) || 5;
  var res = {
    ok: true,
    limit: limit,
    erledigt: 0,
    fehler: 0,
    offen: 0,
    items: []
  };

  try {
    var folder = holeArchivFolder_();
    var name = '!!SerKal_LOOK_FOR_FUTURE_KALENDER_QUEUE.json';
    var files = folder.getFilesByName(name);

    if (!files.hasNext()) {
      res.message = 'Keine Kalender-Queue vorhanden.';
      return res;
    }

    var file = files.next();
    var raw = file.getBlob().getDataAsString('UTF-8') || '';
    var q = JSON.parse(raw || '{}');
    var items = Array.isArray(q.items) ? q.items : [];

    for (var i = 0; i < items.length; i++) {
      var item = items[i] || {};
      if (item.done) continue;
      if (res.erledigt >= limit) break;

      var serie = serkalZukunftTitelOhneJahr_(item.serie || item.titelArchiv || '');
      var staffel = String(item.staffel || '').toUpperCase();
      var oldDates = Array.isArray(item.oldDates) ? item.oldDates : [];

      try {
        if (typeof serkalSynchronisiereKalender_ !== 'function') {
          throw new Error('serkalSynchronisiereKalender_ fehlt');
        }

        LOG_INFO('WARTUNG', 'Kalender-Nachlauf START', {
          serie: serie,
          staffel: staffel,
          alteCount: oldDates.length
        });

        var sync = serkalSynchronisiereKalender_(serie, staffel, oldDates);

        item.done = true;
        item.doneAt = new Date().toISOString();
        item.result = sync || {};

        res.erledigt++;
        res.items.push({
          serie: serie,
          staffel: staffel,
          ok: true,
          result: sync || {}
        });

        LOG_INFO('WARTUNG', 'Kalender-Nachlauf ENDE', {
          serie: serie,
          staffel: staffel,
          result: sync || {}
        });

      } catch (eItem) {
        item.error = skErr_(eItem);
        item.lastErrorAt = new Date().toISOString();

        res.fehler++;
        res.items.push({
          serie: serie,
          staffel: staffel,
          ok: false,
          error: item.error
        });

        LOG_WARN('WARTUNG', 'Kalender-Nachlauf Fehler: ' + item.error, {
          serie: serie,
          staffel: staffel
        });
      }
    }

    var offen = 0;
    for (var j = 0; j < items.length; j++) {
      if (!(items[j] || {}).done) offen++;
    }

    res.offen = offen;
    q.updated = new Date().toISOString();
    q.open = offen;
    file.setContent(JSON.stringify(q, null, 2));

    return res;

  } catch (e) {
    res.ok = false;
    res.message = skErr_(e);
    LOG_ERROR('WARTUNG', 'apiLookForFutureKalenderNachlauf Fehler: ' + skErr_(e));
    return res;
  }
}


/* =====================================================================
 * 10.05 Wartungsbericht
 * =====================================================================
 */

/**
 * @id 10.05.001
 * @funktion serkalZukunftZaehleBericht_
 * @modul 10 Wartung
 * @gruppe Wartung / Wartungsbericht
 * @zweck Aktualisiert die Summen des Zukunftsprüfungs-Aktualisierungslaufs.
 * @status aktiv
 * @loeschung nein
 */

/**
 * @id 10.05.001
 * @funktion serkalZukunftLogBefund_
 * @modul 10 Wartung
 * @gruppe Wartung / Wartungsbericht
 * @zweck Schreibt zu auffälligen Zukunftsprüfungsfällen einen lesbaren Befund ins Log.
 * @status aktiv
 * @loeschung nein
 */
function serkalZukunftLogBefund_(bericht) {
  serkalWartungZaehleDurchlauf_('10.05.001', 'serkalZukunftLogBefund_');
  try {
    if (!bericht) return;

    var aenderungen = Array.isArray(bericht.aenderungen) ? bericht.aenderungen : [];
    var status = String(bericht.status || '');
    var auffaellig = false;

    if (!bericht.tmdbId) auffaellig = true;
    if (status === 'ID_UNGUELTIG_ODER_TMDB_FEHLER') auffaellig = true;
    if (status === 'NEUE_FOLGE_ODER_STAFFEL') auffaellig = true;
    if (status === 'FRAGLICH_SCHLAFEND' || status === 'UNKLAR_BEOBACHTEN') auffaellig = true;
    if (aenderungen.length) auffaellig = true;

    // Unauffällige Standardfälle nicht aufblasen.
    if (!auffaellig) return;

    var gruende = [];
    if (!bericht.tmdbId) {
      gruende.push('TMDB-ID fehlt');
    }
    if (status === 'ID_UNGUELTIG_ODER_TMDB_FEHLER') {
      gruende.push('TMDB-ID ungültig oder TMDB-Abfrage fehlgeschlagen');
    }
    if (bericht.tmdbStatus) {
      gruende.push('TMDB-Status: ' + String(bericht.tmdbStatus));
    }
    if (bericht.letzteFolge) {
      gruende.push('Letzte Folge: ' + String(bericht.letzteFolge));
    }
    if (bericht.naechsteFolge) {
      gruende.push('Nächste Folge: ' + String(bericht.naechsteFolge));
    }

    for (var i = 0; i < aenderungen.length; i++) {
      var x = aenderungen[i] || {};
      var feld = String(x.feld || 'Feld');
      var alt = (x.alt === undefined || x.alt === null) ? '' : String(x.alt);
      var neu = (x.neu === undefined || x.neu === null) ? '' : String(x.neu);
      var bew = String(x.bewertung || '').trim();
      var zeile = feld + ': ' + alt + ' → ' + neu;
      if (bew) zeile += ' (' + bew + ')';
      gruende.push(zeile);
    }

    LOG_INFO('WARTUNG', 'Zukunftsprüfung BEFUND', {
      serie: String(bericht.titelArchiv || bericht.fileName || ''),
      datei: String(bericht.fileName || ''),
      nr: Number(bericht.nr || 0),
      gesamt: Number(bericht.gesamt || 0),
      status: status || 'UNBEKANNT',
      entscheidung: String(bericht.entscheidung || ''),
      gruende: gruende,
      aktion: String(bericht.aktion || 'KEINE (Aktualisierungslauf)')
    });
  } catch (e) {
    try {
      LOG_WARN('WARTUNG', 'Zukunftsprüfung Befundlog Fehler: ' + skErr_(e), {});
    } catch (_eLog) {}
  }
}

function serkalZukunftZaehleBericht_(result, bericht) {
  serkalWartungZaehleDurchlauf_('OHNE_ID', 'serkalZukunftZaehleBericht_');
  if (!result || !bericht) return;
  result.geprueftSerien++;

  if (!bericht.tmdbId) result.ohneTmdbId++;
  if (bericht.status === 'ID_UNGUELTIG_ODER_TMDB_FEHLER') result.tmdbFehler++;
  if (bericht.status === 'NEUE_FOLGE_ODER_STAFFEL') result.neueFolge++;
  if (bericht.status === 'AKTIV_GEPLANT' || bericht.status === 'AKTIV_BEOBACHTEN') result.aktiv++;
  if (bericht.status === 'FRAGLICH_SCHLAFEND' || bericht.status === 'UNKLAR_BEOBACHTEN') result.fraglich++;
  if (bericht.status === 'ABGESETZT') result.abgesetzt++;
  if (bericht.status === 'ABGESCHLOSSEN') result.abgeschlossen++;
  if (bericht.hatAenderungen || (bericht.aenderungen && bericht.aenderungen.length)) result.geaendert++;

  if (bericht.istTreffer) {
    result.treffer.push(serkalZukunftKompaktTreffer_(bericht));
    result.treffer.sort(function (a, b) {
      var pa = Number(a && a.prioritaet || 0);
      var pb = Number(b && b.prioritaet || 0);
      if (pb !== pa) return pb - pa;
      return String(a && a.titel || '').localeCompare(String(b && b.titel || ''));
    });
  }
}


/**
 * @id 10.05.002
 * @funktion serkalZukunftBaueBerichtText_
 * @modul 10 Wartung
 * @gruppe Wartung / Wartungsbericht
 * @zweck Baut einen lesbaren Bericht für "Look for future".
 * @status aktiv
 * @loeschung nein
 */
function serkalZukunftBaueBerichtText_(result) {
  serkalWartungZaehleDurchlauf_('10.05.002', 'serkalZukunftBaueBerichtText_');
  var r = result || {};
  var lines = [];
  var treffer = Array.isArray(r.treffer) ? r.treffer : [];

  lines.push('SerKal – Look for future');
  lines.push('Stand: ' + serkalZukunftZeitstempel_());
  lines.push('');
  lines.push('Modus: Auto-Update vorhandener Staffelwerte; Rueckfrage bei mehrdeutigen neuen Staffeln');
  lines.push('');
  lines.push('Zusammenfassung');
  lines.push('- geprüfte Dateien: ' + Number(r.geprueftDateien || 0));
  lines.push('- geprüfte Serien: ' + Number(r.geprueftSerien || 0));
  lines.push('- Treffer: ' + treffer.length);
  lines.push('- neue Folge/Staffel: ' + Number(r.neueFolge || 0));
  lines.push('- aktiv: ' + Number(r.aktiv || 0));
  lines.push('- fraglich: ' + Number(r.fraglich || 0));
  lines.push('- abgesetzt: ' + Number(r.abgesetzt || 0));
  lines.push('- abgeschlossen: ' + Number(r.abgeschlossen || 0));
  lines.push('- geändert/abweichend: ' + Number(r.geaendert || 0));
  lines.push('- ohne TMDB-ID: ' + Number(r.ohneTmdbId || 0));
  lines.push('- TMDB-Fehler: ' + Number(r.tmdbFehler || 0));
  lines.push('- Fehler: ' + Number(r.fehler || 0));
  lines.push('');

  if (!treffer.length) {
    lines.push('Trefferliste');
    lines.push('- keine auffälligen Zukunftskandidaten gefunden');
    return lines.join('\n') + '\n';
  }

  lines.push('Trefferliste');
  for (var i = 0; i < treffer.length; i++) {
    var t = treffer[i] || {};
    lines.push('');
    lines.push((i + 1) + '. ' + String(t.titel || t.datei || 'Unbekannt'));
    lines.push('   Datei: ' + String(t.datei || ''));
    lines.push('   TMDB-ID: ' + String(t.tmdbId || ''));
    lines.push('   Status: ' + String(t.status || '') + (t.tmdbStatus ? ' / TMDB: ' + String(t.tmdbStatus) : ''));
    lines.push('   Entscheidung: ' + String(t.entscheidung || ''));
    if (t.kurztext) lines.push('   Grund: ' + String(t.kurztext));
    if (t.naechsteFolge) lines.push('   Nächste Folge: ' + String(t.naechsteFolge));
    if (t.letzteFolge) lines.push('   Letzte Folge: ' + String(t.letzteFolge));

    var a = Array.isArray(t.aenderungen) ? t.aenderungen : [];
    for (var j = 0; j < a.length; j++) {
      var x = a[j] || {};
      lines.push('   Änderung: ' + String(x.feld || '') + ' | ' + String(x.alt || '') + ' -> ' + String(x.neu || '') + (x.bewertung ? ' (' + String(x.bewertung) + ')' : ''));
    }
  }

  return lines.join('\n') + '\n';
}

/**
 * @id 10.05.003
 * @funktion serkalZukunftSpeichereBericht_
 * @modul 10 Wartung
 * @gruppe Wartung / Wartungsbericht
 * @zweck Speichert den Look-for-future-Bericht als feste Datei im Archivordner.
 * @status aktiv
 * @loeschung nein
 */
function serkalZukunftSpeichereBericht_(result) {
  serkalWartungZaehleDurchlauf_('10.05.003', 'serkalZukunftSpeichereBericht_');
  var fileName = '!!SerKal_LOOK_FOR_FUTURE_REPORT.txt';
  try {
    var folder = holeArchivFolder_();
    var text = String(result && result.berichtText || '');
    var files = folder.getFilesByName(fileName);

    if (files.hasNext()) {
      files.next().setContent(text);
    } else {
      folder.createFile(fileName, text, MimeType.PLAIN_TEXT);
    }

    PropertiesService.getScriptProperties().setProperty('SERKAL_LOOK_FOR_FUTURE_REPORT_TEXT', text);
    PropertiesService.getScriptProperties().setProperty('SERKAL_LOOK_FOR_FUTURE_REPORT_JSON', JSON.stringify({
      ts: new Date().toISOString(),
      reportFileName: fileName,
      geprueftDateien: Number(result && result.geprueftDateien || 0),
      geprueftSerien: Number(result && result.geprueftSerien || 0),
      treffer: Array.isArray(result && result.treffer) ? result.treffer : []
    }));

    return fileName;
  } catch (e) {
    try {
      LOG_WARN('WARTUNG', 'Look-for-future-Bericht konnte nicht gespeichert werden: ' + skErr_(e), {});
    } catch (_eLog) {}
    return '';
  }
}

/**
 * @id 10.05.004
 * @funktion apiHoleLookForFutureReport
 * @modul 10 Wartung
 * @gruppe Wartung / Wartungsbericht
 * @zweck Liefert den letzten gespeicherten Look-for-future-Bericht für UI/Debug.
 * @status aktiv
 * @loeschung nein
 */
function apiHoleLookForFutureReport() {
  serkalWartungZaehleDurchlauf_('10.05.004', 'apiHoleLookForFutureReport');
  try {
    var props = PropertiesService.getScriptProperties();
    var text = props.getProperty('SERKAL_LOOK_FOR_FUTURE_REPORT_TEXT') || '';
    return {
      ok: true,
      text: text,
      json: props.getProperty('SERKAL_LOOK_FOR_FUTURE_REPORT_JSON') || ''
    };
  } catch (e) {
    return {
      ok: false,
      text: '',
      message: skErr_(e)
    };
  }
}

/**
 * @id 10.05.005
 * @funktion serkalZukunftZeitstempel_
 * @modul 10 Wartung
 * @gruppe Wartung / Wartungsbericht
 * @zweck Liefert einen lesbaren Zeitstempel für Berichte.
 * @status aktiv
 * @loeschung nein
 */
function serkalZukunftZeitstempel_() {
  serkalWartungZaehleDurchlauf_('10.05.005', 'serkalZukunftZeitstempel_');
  try {
    return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd.MM.yyyy HH:mm:ss');
  } catch (_e) {
    return new Date().toISOString();
  }
}


/* =====================================================================
 * 10.06 OVA-002 Wartungsstatus für UI
 * =====================================================================
 * Der Status wird bewusst in Modul 10 gehalten. code.gs bleibt draußen.
 * Die UI kann apiWartungStatus() per google.script.run abfragen.
 */

/**
 * @id 10.06.001
 * @funktion apiWartungStatus
 * @modul 10 Wartung
 * @gruppe Wartung / UI-Status
 * @zweck Liefert den aktuellen Wartungsstatus für die UI-Fußzeile.
 * @status aktiv
 * @loeschung nein
 */
function apiWartungStatus() {
  serkalWartungZaehleDurchlauf_('10.06.001', 'apiWartungStatus');
  try {
    var props = PropertiesService.getScriptProperties();
    var raw = props.getProperty('SERKAL_WARTUNG_STATUS_JSON') || '';
    if (raw) {
      try {
        var obj = JSON.parse(raw);
        if (obj && typeof obj === 'object') {
          obj.ok = true;
          obj.text = String(obj.text || '');
          return obj;
        }
      } catch (_eJson) {}
    }
    return {
      ok: true,
      text: props.getProperty('SERKAL_WARTUNG_STATUS') || ''
    };
  } catch (e) {
    return {
      ok: false,
      text: '',
      message: skErr_(e)
    };
  }
}

/**
 * @id 10.06.002
 * @funktion serkalWartungSetStatus_
 * @modul 10 Wartung
 * @gruppe Wartung / UI-Status
 * @zweck Speichert den aktuellen Wartungsschritt für spätere UI-Abfrage.
 * @status aktiv
 * @loeschung nein
 */
function serkalWartungSetStatus_(text, meta) {
  serkalWartungZaehleDurchlauf_('10.06.002', 'serkalWartungSetStatus_');
  try {
    var obj = meta && typeof meta === 'object' ? meta : {};
    obj.text = String(text || '');
    obj.ts = new Date().toISOString();

    var props = PropertiesService.getScriptProperties();
    props.setProperty('SERKAL_WARTUNG_STATUS', obj.text);
    props.setProperty('SERKAL_WARTUNG_STATUS_JSON', JSON.stringify(obj));
  } catch (e) {
    try {
      LOG_WARN('WARTUNG', 'Wartungsstatus konnte nicht gesetzt werden: ' + skErr_(e), {});
    } catch (_eLog) {}
  }
}

/**
 * @id 10.06.003
 * @funktion serkalWartungIstLogdatei_
 * @modul 10 Wartung
 * @gruppe Wartung / Filter
 * @zweck Erkennt SerKal-Logdateien, damit sie nicht als Serienarchiv geprüft werden.
 * @status aktiv
 * @loeschung nein
 */
function serkalWartungIstLogdatei_(fileName) {
  serkalWartungZaehleDurchlauf_('10.06.003', 'serkalWartungIstLogdatei_');
  var n = String(fileName || '');
  return /^!!SerKal_/i.test(n);
}

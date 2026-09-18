(function(root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.SerKalEntryFlow = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  'use strict';

  var TEXT = {
    de: {
      previewIncomplete: 'Eintrag blockiert (Vorschau unvollständig – bitte Treffer neu wählen).',
      unclearSeasonTitle: 'Achtung: Platzhalter / unklare Datierung',
      unclearSeasonBody: 'Diese Staffel wird nicht in das Archiv oder den Kalender eingetragen.',
      unclearSeasonStatus: 'Eintrag blockiert (unklare Staffel).',
      archiveFailed: 'Die Staffel konnte nicht im SerKal-Archiv gespeichert werden.',
      archiveCalendarPartial: 'Die Staffel wurde im SerKal-Archiv gespeichert. Google Kalender konnte nicht aktualisiert werden. Der Archiveintrag ist sicher gespeichert.',
      archivePast: 'Die Staffel wurde im SerKal-Archiv gespeichert. Es wurde kein Kalendereintrag angelegt, weil die letzte Episode vor dem aktuellen Jahr liegt.',
      archiveGoogle: 'Die Staffel wurde im SerKal-Archiv gespeichert und ihre Termine wurden in Google Kalender verwaltet ({created} neu, {updated} aktualisiert).',
      archiveOnly: 'Die Staffel wurde im SerKal-Archiv gespeichert. Kalendertermine werden auf Wunsch nicht verwaltet.',
      insertFailed: 'Der Eintrag ist fehlgeschlagen.',
      icsTitle: 'Verarbeitung abgeschlossen',
      icsQuestion: 'Möchten Sie zusätzlich eine ICS-Datei für Outlook, Apple Kalender oder andere Kalender speichern?',
      icsConfirm: 'ICS herunterladen',
      icsCancel: 'Nein, danke',
      icsCreating: 'ICS-Datei wird erstellt …',
      icsCreateFailed: 'ICS-Datei konnte nicht erstellt werden.',
      icsReady: 'ICS-Datei wurde zum Speichern bereitgestellt.',
      icsDownloadFailed: 'ICS-Download fehlgeschlagen.'
    },
    en: {
      previewIncomplete: 'Entry blocked (incomplete preview – please select the result again).',
      unclearSeasonTitle: 'Warning: placeholder or unclear release dates',
      unclearSeasonBody: 'This season will not be added to the archive or calendar.',
      unclearSeasonStatus: 'Entry blocked (unclear season).',
      archiveFailed: 'The season could not be saved in the SerKal archive.',
      archiveCalendarPartial: 'The season was saved in the SerKal archive. Google Calendar could not be updated. Your archive entry is safely stored.',
      archivePast: 'The season was saved in the SerKal archive. No calendar entry was created because the final episode is before the current year.',
      archiveGoogle: 'The season was saved in the SerKal archive and its dates were managed in Google Calendar ({created} new, {updated} updated).',
      archiveOnly: 'The season was saved in the SerKal archive. Calendar dates are not managed, as requested.',
      insertFailed: 'The entry failed.',
      icsTitle: 'Processing completed',
      icsQuestion: 'Would you also like to save an ICS file for Outlook, Apple Calendar, or another calendar app?',
      icsConfirm: 'Download ICS',
      icsCancel: 'No, thanks',
      icsCreating: 'Creating ICS file …',
      icsCreateFailed: 'The ICS file could not be created.',
      icsReady: 'The ICS file is ready to save.',
      icsDownloadFailed: 'ICS download failed.'
    }
  };

  function language(value) {
    return String(value || 'de').toLowerCase() === 'en' ? 'en' : 'de';
  }

  function text(lang, key, values) {
    var pack = TEXT[language(lang)];
    var result = String(pack[key] || TEXT.de[key] || key || '');
    Object.keys(values || {}).forEach(function(name) {
      result = result.replace(new RegExp('\\{' + name + '\\}', 'g'), String(values[name]));
    });
    return result;
  }

  function outcome(result) {
    var res = result || {};
    if (res.archiveSaved && (res.partial || res.ok === false || (res.calendar && res.calendar.ok === false))) {
      return 'archiveCalendarPartial';
    }
    if (res.ok === false) return 'archiveFailed';
    if (res.calendarMode === 'google') {
      if (res.calendar && res.calendar.skipped === true && res.calendar.reason === 'past_season') return 'archivePast';
      return 'archiveGoogle';
    }
    if (res.calendarMode === 'ics' || res.calendarMode === 'auto') return 'archiveIcs';
    return 'archiveOnly';
  }

  function outcomeText(lang, result) {
    var key = outcome(result);
    if (key === 'archiveIcs') return '';
    var calendar = result && result.calendar || {};
    return text(lang, key, {
      created: Number(calendar.created || 0),
      updated: Number(calendar.updated || 0)
    });
  }

  return {
    language: language,
    text: text,
    outcome: outcome,
    outcomeText: outcomeText
  };
});

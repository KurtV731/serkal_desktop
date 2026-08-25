/*
  SerKal – Modul 9 Helfer / Basisfunktionen
  Version: SK25_B01_MODUL9_HELFER1
  Stand: 2026-05-21

  Zweck:
  - gemeinsame kleine Helfer aus Code.gs bündeln
  - spätere Module 3/4/5/7 auf eine einheitliche Basis stellen
  - Code.gs schrittweise ausdünnen

  Hinweis:
  Diese Datei enthält nur neutrale Helfer ohne UI-Aufbau, ohne Archiv-IO
  und ohne direkte TMDB-Netzwerkabfrage.
*/

/* =====================================================================
   9.00 – Funktionsübersicht
   =====================================================================

   9.01 Rückgabeobjekte
   - skErfolg_(daten, meta)
   - skFehler_(fehler, meta)

   9.02 Text / String
   - skTrim_(wert)
   - skHatText_(wert)
   - skLeerOderNull_(wert)
   - normalizeLang_(lang)
   - normTitle_(s)
   - serkalBuildTitleVariants_(titel)
   - normTitel_(s)

   9.03 Zahlen / Datum
   - skParseIntSafe_(wert, fallback)
   - skIstZahl_(wert)
   - pad2_(n)
   - yearFromDate_(yyyy_mm_dd)
   - skJetzt_()
   - skHeuteIso_()

   9.04 TMDB-Basisprüfung
   - serkalTmdbApiKeyVorhanden_()
   - serkalTmdbApiKeyFehler_()

   ===================================================================== */

/**
 * @id 9.01.001
 * @funktion skErfolg_
 * @modul 9 Helfer
 * @gruppe Rückgabeobjekte
 * @zweck Baut ein einheitliches Erfolgsobjekt.
 * @status aktiv
 * @loeschung nein
 */
function skErfolg_(daten, meta) {
  var out = { ok: true };
  if (daten !== undefined) out.daten = daten;
  if (meta !== undefined) out.meta = meta;
  return out;
}

/**
 * @id 9.01.002
 * @funktion skFehler_
 * @modul 9 Helfer
 * @gruppe Rückgabeobjekte
 * @zweck Baut ein einheitliches Fehlerobjekt.
 * @status aktiv
 * @loeschung nein
 */
function skFehler_(fehler, meta) {
  var text = '';
  try {
    if (!fehler) text = 'Unbekannter Fehler';
    else if (typeof fehler === 'string') text = fehler;
    else if (fehler.message) text = String(fehler.message);
    else text = String(fehler);
  } catch (_) {
    text = 'Unbekannter Fehler';
  }

  var out = { ok: false, fehler: text };
  if (meta !== undefined) out.meta = meta;
  return out;
}

/**
 * @id 9.02.001
 * @funktion skTrim_
 * @modul 9 Helfer
 * @gruppe Text / String
 * @zweck Wandelt beliebige Eingabe sicher in getrimmten Text.
 * @status aktiv
 * @loeschung nein
 */
function skTrim_(wert) {
  return String(wert == null ? '' : wert).trim();
}

/**
 * @id 9.02.002
 * @funktion skHatText_
 * @modul 9 Helfer
 * @gruppe Text / String
 * @zweck Prüft, ob ein Wert nach trim() noch Text enthält.
 * @status aktiv
 * @loeschung nein
 */
function skHatText_(wert) {
  return skTrim_(wert) !== '';
}

/**
 * @id 9.02.003
 * @funktion skLeerOderNull_
 * @modul 9 Helfer
 * @gruppe Text / String
 * @zweck Gegenstück zu skHatText_ für besser lesbare Prüfungen.
 * @status aktiv
 * @loeschung nein
 */
function skLeerOderNull_(wert) {
  return !skHatText_(wert);
}

/**
 * @id 9.02.004
 * @funktion normalizeLang_
 * @modul 9 Helfer
 * @gruppe Sprache
 * @zweck Normalisiert Sprachwerte auf de/en.
 * @status aktiv
 * @loeschung nein
 */
function normalizeLang_(lang) {
  var l = String(lang || '').toLowerCase();
  return (l.indexOf('en') === 0) ? 'en' : 'de';
}

/**
 * @id 9.02.005
 * @funktion normTitle_
 * @modul 9 Helfer
 * @gruppe Text / String
 * @zweck Normalisiert Titel für Vergleiche, ohne Dateinamenlogik.
 * @status aktiv
 * @loeschung nein
 */
function normTitle_(s) {
  return String(s || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

/**
 * @id 9.02.006
 * @funktion - normalizeLanriants_
 * @modul 9 Helfer
 * @gruppe Text / Dateiname
 * @zweck Trennt Originaltitel und dateisichere Variante sauber voneinander.
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
 * @id 9.02.007
 * @funktion normTitel_
 * @modul 9 Helfer
 * @gruppe Text / Dateiname
 * @zweck Liefert die dateisichere Titelvariante für bestehende Aufrufer.
 * @status aktiv
 * @loeschung nein
 *
function normTitel_(s) {
  return serkalBuildTitleVariants_(s).fileSafeTitle;
}
*/

/**
 * @id 9.03.001
 * @funktion skParseIntSafe_
 * @modul 9 Helfer
 * @gruppe Zahlen / Datum
 * @zweck Sichere Integer-Konvertierung mit Fallback.
 * @status aktiv
 * @loeschung nein
 */
function skParseIntSafe_(wert, fallback) {
  var n = parseInt(wert, 10);
  if (!isFinite(n)) return (fallback !== undefined ? fallback : 0);
  return n;
}

/**
 * @id 9.03.002
 * @funktion skIstZahl_
 * @modul 9 Helfer
 * @gruppe Zahlen / Datum
 * @zweck Prüft, ob ein Wert eine endliche Zahl ergibt.
 * @status aktiv
 * @loeschung nein
 */
function skIstZahl_(wert) {
  var n = Number(wert);
  return isFinite(n);
}

/**
 * @id 9.03.003
 * @funktion pad2_
 * @modul 9 Helfer
 * @gruppe Zahlen / Datum
 * @zweck Formatiert Zahlen zweistellig, z. B. 1 -> 01.
 * @status aktiv
 * @loeschung nein
 */
function pad2_(n) {
  var x = parseInt(n, 10);
  if (!isFinite(x)) x = 0;
  return (x < 10 ? '0' : '') + String(x);
}

/**
 * @id 9.03.004
 * @funktion yearFromDate_
 * @modul 9 Helfer
 * @gruppe Zahlen / Datum
 * @zweck Liefert das Jahr aus einem ISO-Datum oder leer.
 * @status aktiv
 * @loeschung nein
 */
function yearFromDate_(yyyy_mm_dd) {
  var s = String(yyyy_mm_dd || '');
  if (s.length >= 4 && /^\d{4}/.test(s)) return s.slice(0, 4);
  return '';
}

/**
 * @id 9.03.005
 * @funktion skJetzt_
 * @modul 9 Helfer
 * @gruppe Zahlen / Datum
 * @zweck Zentraler Date-Erzeuger für spätere Testbarkeit.
 * @status aktiv
 * @loeschung nein
 */
function skJetzt_() {
  return new Date();
}

/**
 * @id 9.03.006
 * @funktion skHeuteIso_
 * @modul 9 Helfer
 * @gruppe Zahlen / Datum
 * @zweck Liefert das heutige Datum als yyyy-MM-dd.
 * @status aktiv
 * @loeschung nein
 */
function skHeuteIso_() {
  return Utilities.formatDate(skJetzt_(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

/**
 * @id 9.04.001
 * @funktion serkalTmdbApiKeyVorhanden_
 * @modul 9 Helfer
 * @gruppe TMDB-Basisprüfung
 * @zweck Prüft nur, ob TMDB_API_KEY technisch vorhanden ist. Kein Netzwerkzugriff.
 * @status aktiv
 * @loeschung nein
 */
function serkalTmdbApiKeyVorhanden_() {
  try {
    var key = PropertiesService.getScriptProperties().getProperty('TMDB_API_KEY');
    key = String(key || '').trim();
    return !!key && key !== 'to be filled' && key !== 'enter TMDB_API_KEY here';
  } catch (_) {
    return false;
  }
}

/**
 * @id 9.04.002
 * @funktion serkalTmdbApiKeyFehler_
 * @modul 9 Helfer
 * @gruppe TMDB-Basisprüfung
 * @zweck Einheitliches Fehlerobjekt für fehlenden TMDB-Key.
 * @status aktiv
 * @loeschung nein
 */
function serkalTmdbApiKeyFehler_() {
  return {
    ok: false,
    fehler: 'TMDB_API_KEY fehlt. Bitte zuerst den API-Key einrichten.'
  };
}

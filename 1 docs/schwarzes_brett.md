# Gemeinsames Schwarzes Brett – SerKal, HASA und Websites

Stand: 18.11.2026 · gekürzter Arbeitsstand auf Kurts Auftrag.

## 1. Start hier

Dies ist die **einzige aktive Übergabestelle** für CE SerKal, CE HASA, Installer,
Website, Anleitung und Hosting. Vor Projektarbeit dieses kurze Brett lesen.
Danach ausschließlich die für den konkreten Auftrag benötigten Fachunterlagen öffnen.

**Keine Pflichtlektüre des Archivs oder früherer vollständiger Nachfolgedokumente.**
Historische Anweisungen, Arbeitssperren und Versionsangaben im Archiv gelten nicht
als heutiger Arbeitsauftrag. Im Zweifel den letzten belegten Stand gezielt prüfen,
keine früheren offenen Meldungen ungeprüft reaktivieren.

- [Vollständiges, unverändertes Original bis 18.11.2026](Archiv/schwarzes-brett-bis-2026-11-18.md)
- [Frühere Ansicht am ursprünglichen Ort](https://github.com/KurtV731/serkal_desktop/blob/9dee76b36614f525a9753a5ef7801b2da847bd30/1%20docs/schwarzes_brett.md) – bei Bedarf für ursprüngliche relative Links.
- Historische Themen: Ersteinrichtung, Archiv/Sync, Kalender/Wartung, Darstellung,
  Sprache, Installer/Releases, Android/Play, Websites/Datenschutz/Hosting,
  HASA-Planung/Ereignisse/Adressbuch/Verwaltung und Handbücher.

| Zuständig | Aufgabe / Quelle |
|---|---|
| CE SerKal | Fachlogik, Desktop-/Androidquellen, Tests und freigegebener Quellstand in KurtV731/serkal_desktop. |
| Installer | Windows-Bau, Installation/Updates, Verknüpfungen, Artefakt-/Signaturprüfung; privater Windows-Bauplatz bei Kurt. |
| Website | SerKal-Seiten/Downloads in KurtV731/serkal-pages; HASA-Webgestaltung in KurtV731/hasa. |
| CE HASA | Userscript, API/Serverlogik, Datenbank-/Rechteverhalten und fachliche Anleitung in KurtV731/hasa. |
| Anleitung / Hosting | Handbuchredaktion beziehungsweise Server-/Domainbetrieb; Abstimmung weiterhin hier. |

## 2. Dauerhafte Entscheidungen von Kurt

- Bestehende SerKal-2.5-Fachlogik portieren, nicht durch neue Produktregeln ersetzen.
- GitHub-App zuerst verwenden; Änderungen vollständig übertragen und zurückprüfen.
  Ein gescheiterter Terminal-Push beendet den Auftrag nicht. Erst verfügbare Wege prüfen.
- Keine Geheimnisse, privaten Originaldaten oder Keystorekennwörter ins Repository.
- Kurt muss keine technischen Zwischenstände zwischen Chattys transportieren.
  Deutsch mit Kurt, englische Testertexte bei Bedarf. Diktatfehler aus dem Kontext lesen.
- Keine vermeidbaren Klicks, keine doppelten Angaben, keine sichtbaren ungeprüften Fehler.
  Screenshots anhand des tatsächlichen Bildschirms erklären.
- Keine Datenlöschung, Deinstallation oder Rücksetzung als beiläufige Reparatur.
  Öffentliche Dateien erst nach Prüfung und vorhandener Freigabe ersetzen.
- Ein eindeutiger freigegebener Quellstand je Bau, keine ungeprüfte Branch-Zusammenführung.
  Die alte pauschale Bindung an serkal-0.0.5-archiv-start ist überholt; aktuelle Pins siehe unten.
- Neue installierbare Änderungen erhalten grundsätzlich höhere eindeutige Kennungen.
  Ausnahme war Kurts ausdrücklich beauftragter Ersatzbau 1.2.6/Code50 vor Upload.
  Produktversion, Android-versionCode und gemeinsamer Archivstand sind verschiedene Kennungen.
- Desktop und Android funktional angleichen; für Android ist Kurt die **Play-Testfassung**
  maßgeblich. Website-APK und Play-Test dürfen nicht als derselbe Veröffentlichungsstand gelten.
- Erst geprüfte Datei, dann Veröffentlichung und Downloadlink. Bisherige Public bleibt
  bei Bau-/Prüffehlern verfügbar. Freigegebene Dateien unverändert übernehmen, nicht neu bauen.
- Windows: ein selbständiges lokales Programm, ein öffentliches Installationsangebot,
  Update statt unnötiger Neuinstallation; öffentlicher Name serkal-desktop.exe.
- Fehlerhinweise in Release Notes mit dem belegten öffentlichen Reporter-Namen würdigen,
  etwa „Thanks to VelcroFist“. Keine privaten Namen/Kontaktdaten dafür veröffentlichen.

### Geltender SerKal-Archiv-/Kalenderablauf

Start: Google-Gesamtstand in lokale Sitzung laden; während der Sitzung lokal arbeiten;
beim regulären Abschluss geänderten Gesamtstand einmal zurückschreiben.
Keine laufenden Cloudarchiv-Abfragen oder Einzeländerungsuploads.
Nicht gespeicherte Sitzungen dürfen verworfen werden; bei parallelen Sitzungen gewinnt
der letzte erfolgreich gespeicherte Gesamtstand. Keine Wiederbelebung alter Revisions-/
Live-Sync-Sicherungen ohne neuen Auftrag. Fehler konkret anzeigen und protokollieren.

Kalender getrennt behandeln: nur tatsächlich betroffene Bereiche und abweichende Termine
schreiben, identische überspringen; erfolgreiche Arbeit nicht wiederholen.
Aktuelle Stabilisierung: mindestens 250 ms zwischen Anfragen, 2 s Pause nach
20 erfolgreichen Schreibaktionen, passende Google-Limits mit wachsender Pause/Retry-After
wiederholen, Restarbeit erhalten, eigenes Kalenderzeitfenster und sichtbarer Countdown.
Unbekannte Termine bleiben unbekannt; manuelle Angaben und stärkere Ankündigungen schützen.

HASA: keine Spielentscheidungen oder Ressourcenverbrauch automatisieren.
Nachweise, Besitzer, Planeten und Runden sauber trennen; unbekannte Zuordnungen nicht raten.
Video-/Atommüll-Löschschutz nicht durch bloßes Gelesen-Markieren aufheben.

## 3. Letzter dokumentierter Produktstand

Diese Tabelle gibt den **belegten Übergabestand**, keine neu durchgeführte Liveprüfung wieder.

| Produkt / Kanal | Stand / Nachweis | Noch erforderlich |
|---|---|---|
| SerKal Windows öffentlich | Desktop 1.2.6, am 16.11. veröffentlicht und Live-Hash bestätigt; Quellstand 07903512a7ac2de4521182ec8b9a89e4cb030a86. | Bekannte Restpunkte für spätere Pflege, siehe Abschnitt 4. |
| SerKal Android Website | Öffentliche APK 1.2.4 / Code47; getrennt vom Play-Test. | Keine Aktualisierung allein wegen des neuen Play-Baus behaupten. |
| SerKal Android Play-Test | 1.2.6 / Code50 Edge; Bau-/Testquelle 2043721004a6bbba4faf1454a366c1c9e9d90608; am 18.11. privat signiert, geprüft und im bestehenden **Geschlossenen Test – Alpha** zur Überprüfung eingereicht. | Google-Prüfung/Verfügbarkeit und praktische Neuinstallation durch Tester noch bestätigen. Produktionszugang bleibt mangels 12 Testern gesperrt. |
| Gemeinsame SerKal-Daten | Archivstand 38 unverändert. | Produktversionsgleichheit nicht mit Datenformatwechsel verwechseln. |
| HASA öffentlich stabil | 1.2 separat von Entwicklungskanal. | Keine Alpha als neue stabile Public ausgeben. |
| HASA Entwicklung | 1.3.0 Alpha12, am 14.11. im Kanal dev-1.3-alpha1 veröffentlicht; Prüfquelle 43ca676594c21edc83497aded670cfadb5825eff, Kanalcommit 40281d7eb4d2a301d0bd8fa3632bd14ab3126192. | Reale Rückmeldungen, Server-/Handbuchstand getrennt führen. |
| SerKal Website | Deutsche Hauptadresse serkal.de, DE/EN-Navigation/Datenschutz überarbeitet. Vier Neuerungs-/Werkstattseiten am 16.11. in GitHub fortgeschrieben. | Für diese vier Seiten fehlt der abschließende Server-/Live-Nachweis. |
| HASA Website | hasa.li mit Anleitung/Hilfe/Aktualisierung; neues zusammenhängendes Handbuch 1.3 bis Alpha12 in Quellen ergänzt. | HTML-/Live-Übernahme des neuen Handbuchs nicht bestätigt. |

Desktop-Public: serkal-desktop.exe, **140893184 Bytes**,
SHA256 **4cd5128dce6c01771ecb0e80271b4a56b7b1047faa80eb0f72eabcab30aaef16**.
Play-Seite für bereits aufgenommene Tester: https://play.google.com/store/apps/details?id=de.serkal.android.preview.v005
Der maßgebliche Kanal für die derzeitige Testergruppe ist **Geschlossener Test – Alpha**, nicht der interne Test. Bestehende Teilnahmegruppe und Opt-in-Einstellungen unverändert weiterverwenden.

## 4. Aktive Übergaben und offene Arbeit

### P1 – Installer / Kurt: Android-Code50 im geschlossenen Alpha-Test abschließen

Am 18.11.2026 wurde die geprüfte **SerKal-Android-1.2.6-code50-edge.aab**
im bestehenden Kanal **Geschlossener Test – Alpha** als Version **50 (1.2.6)**
hochgeladen und zur Google-Überprüfung eingereicht. Version 49 (1.2.5) wurde nicht
einbezogen; Roll-out 100 %, Versionshinweise DE/EN. Die angezeigte Warnung zur
fehlenden R8/ProGuard-Offenlegungsdatei war nicht blockierend. Der endgültige
Google-Status „verfügbar/aktiv“ und die reale Installation sind noch zu bestätigen.

Verbindliches Artefakt: **2511304 Bytes**, SHA256
**b38881f1e582c43df33bc85494de49e02cab0e7027bdde16f47ba1e8c78197c3**.
Paket bleibt de.serkal.android.preview.v005; Uploadschlüssel/Alias serkal-preview
unverändert. Die ältere Code50-Datei ohne `edge` und ihre Ableitungen bleiben
uploadgesperrt. Keine neue Paketkennung, Testerliste, Teilnahme-URL oder Testspur anlegen.
Uploadzertifikat und Google-Play-App-Signierzertifikat für OAuth nicht verwechseln.

**Nächste Schritte für den Nachfolger:**

1. In Play Console den Status des geschlossenen Alpha-Releases prüfen.
2. Sobald Google Version 50 anbietet, Tester informieren beziehungsweise Verfügbarkeit
   bestätigen. Für Kurts praktische Abnahme alte App deinstallieren und Version 50 neu
   aus dem bestehenden Test installieren; damit wird auch der vollständige Ersteinstieg geprüft.
3. Installation, Google-/TMDB-Einrichtung, Archivzahl und Kalenderzugriff praktisch prüfen;
   Ergebnis knapp im Brett aktualisieren.
4. Öffentliches Google-Play-Produktionsrelease nicht behaupten: Kurt hat derzeit neun
   Tester. Für Produktionszugang verlangt Google mindestens zwölf ununterbrochen
   beigetretene Tester über 14 Tage; anschließend ist der Produktionszugang separat zu beantragen.

CE-Ersatzbau: Edge-to-Edge/Insets statt alter Farbaufrufe; Querformat auf Telefonen
bevorzugt, Tablets/Mehrfenster anpassbar; 96 Regressionstests und Android-15-/16-
Emulatorprüfungen bestanden. Das ersetzt die noch ausstehende reale Abnahme nicht.
[Exakte CE-Unterlagen](https://github.com/KurtV731/serkal_desktop/blob/f3850a199e6d758beac141f8be18e374a241e626/1%20docs/android/code50-edge-to-edge-ersatz.md).

### P2 – Website: ausstehende Übernahmen abschließen

- SerKal: Live-Übernahme/Prüfung von neu-in-1.2.html, whats-new-1.2.html,
  werkstatt.html und werkstatt-en.html bestätigen; Quelle am 16.11. fertig.
- Datenschutz: Nachtrag zu lokalen Desktop-Protokollen und Aufbewahrung bis Löschung
  ist seit 08.11. ohne Abschlussbeleg. Erst gezielt prüfen, nicht pauschal neu schreiben.
  Der Android-Datenschutzlink ist inzwischen im Play-Einstieg enthalten.
- HASA: zusammenhängendes Handbuch 1.3 einschließlich Adressbuch, Leerlaufsteuerung,
  Ascension, Flottenfenster und Atommüllkorrektur bis Alpha12 in HTML übernehmen;
  reale Live-Funktionen von bloßen Quellen/Planungen unterscheiden.
- Nach Veröffentlichung kurz melden: „Jetzt behoben/veröffentlicht“ und „Noch offen“;
  Quellcommit und geprüfte URLs nennen. Keine Programmdateien dabei still ersetzen.

### P3 – CE SerKal: bekannte Restpunkte / spätere Pflege

Keine neue Version allein durch diese Liste beauftragt; zuerst aktuellen Code/Abnahme prüfen.

| Thema | Noch offener beziehungsweise nicht abschließend belegter Punkt |
|---|---|
| Desktop-Googlefenster | Eigenes normales Fenster ist in 1.2.6 gelungen; es kann den kleinen SerKal-Hinweis verdecken. Bessere Anordnung für 1.2.7 vorgemerkt, kein rückwirkender Freigabestopper. |
| Desktop-Googleanzeige | Dauerhaft sichtbarer tatsächlicher Verbindungsstatus, möglichst mit verwendetem Konto. |
| Kalender öffnen | Browserkonto-/„Kalender hinzufügen“-Umweg nicht als zuverlässig behoben melden. Funktionierende API-Schreibzuordnung nicht dafür ändern. |
| Android-Einstieg | Samsung-Kontoauswahl/Spinner und unvollständige Abbruchlogs anhand konkreter Logs prüfen; Code50-Darstellungstest beweist diesen Fix nicht. |
| Android-Bedienung | Launcher-Dummysymbol, Wegwischen/Abschlussverhalten, später gewünschte direkte Leistenaktionen. Nicht pauschal durch Angleichung erledigt. |
| Sprache / Übersicht | Vollständige englische Tooltips/UI, feste Desktop-Statuszeile, Wartungsergebnis-/Menüangleichung: Abschlussbelege vor erneutem Auftrag prüfen. |
| Deutsche Veröffentlichungstermine | Zweite verlässliche Quelle; manuell geschützte deutsche Start-/Folgenangaben. Vorhandene Datenfelder zuerst prüfen; kein Storestart-Blocker. |
| Spätere Ideen | System-/Dateikartierung, Single-PC-Modus, Linux sowie [Ideenliste](ideenliste.md); keine automatische Erweiterung des laufenden Auftrags. |

### P4 – CE HASA / Website: fachliche und betriebliche Restpunkte

- Persönliche Ereignis-/Ressourcenlisten: eigene Planeten nicht allein aus Berichtsbesitz
  ableiten. Übergreifende Besitzer-/Rundenfilterkorrektur vom 07.11. nicht als verteilt belegt.
- Adressbuch-Automatik ist ab Alpha8 enthalten; eventuell ausstehende Servereinrichtung,
  aktuelle Freigaben und reale Übernahme getrennt bestätigen. Bewusst freigebbare Adressen
  von privaten Freund-/Feindmarkierungen und Suchverhalten trennen.
- Serveransichten/Ereignislisten: fehlende produktive Übernahmen gezielt abgleichen;
  ein erfolgreiches Userscript-Update beweist keinen PHP-/Datenbankupload.
- Atommüll: Alpha12 korrigiert Zuordnung und Gelesen-Löschschutz. Reaktorstufe2 mit
  200 ts Bauplatz pro Ladung ist nur Arbeitshypothese aus zwei Messungen; andere
  Stufen/Forschungseinflüsse und automatische Messkurve nicht bestätigt.
- Handels-/Modulkonzept ist gesichert, kein fertiges Handelsmodul.
  Detailauftrag: HASA, 03 Dokumentation/handelsmodul-konzept-2026-10-29.md.
- Zusammenhängendes Handbuch statt verstreuter Versionsnachträge; Quellen im HASA-Repo.
  Keine neue öffentliche HASA-Hauptversion allein aus diesen Vormerkungen ableiten.

### P5 – CE / Installer: dauerhafter Google-Play-Prüfauftrag

Vor Storeentscheidungen aktuelle offizielle Anforderungen gezielt aktualisieren.
Aus dem Auftrag vom 05.11. offen halten: fertiges Manifest/Ziel-API und Berechtigungen,
DEX-/Releaseoptimierung und reale Speicherprüfung (Fristen ab Februar2027),
Anmeldungswiederherstellung (Anwendbarkeit vor April2027 klären), Händler-/Monetarisierungs-
status, Zielgruppe und zutreffende Datensicherheit. Keine pauschale API-Umbaupflicht
oder abgeschlossene Konformität aus alten Meldungen ableiten.
Quellen und Details nur bei diesem Thema gezielt im Archiv-Eintrag
„CE SerKal – 05.11.2026: Google-Play-Richtlinien dauerhaft bei Entscheidungen berücksichtigen“
nachschlagen; dortige Fristen sind damaliger Prüfstand, keine neue Rechts-/Richtlinienprüfung.
Bestandene allgemeine Abnahmen nicht ohne neuen Befund vollständig wiederholen.

## 5. So bleibt dieses Brett kurz

- Pro aktivem Vorgang: Datum · Projekt · Verantwortlicher · Status · nächster Schritt
  und höchstens ein Link zu ausführlichen Nachweisen.
- Bestehenden Status aktualisieren, statt dieselbe Vorgeschichte erneut anzuhängen.
- Technische Details, Testprotokolle und komplette Hashlisten in Fach-/Releaseunterlagen.
  Im Brett nur die gerade verbindlichen Artefakte festhalten.
- „Quelltext fertig“, „gebaut“, „praktisch geprüft“, „freigegeben“ und „live“ unterscheiden.
  Fehlender Abschlussbeleg bedeutet „zu prüfen“, nicht automatisch „kaputt“ oder „erledigt“.
- Abgeschlossene Zwischenmeldungen aus dem aktiven Brett entfernen, sobald Ergebnis
  und Nachweis gesichert sind. Git-Geschichte und datierte Archive bleiben erhalten.
- Keine neue Dauer-Arbeitssperre aus einer historischen Meldung ableiten.
  Aktuelle Sperre immer mit konkretem Gegenstand und Aufhebungsbedingung.
- Neue Nachfolger lesen diesen Arbeitsstand und auftragsbezogene Quellen.
  Das vollständige Archiv ist ausdrücklich **kein obligatorischer Einstieg**.

## 6. Archivierung vom 18.11.2026

Kurt beauftragt Kürzung zur einfacheren und sparsameren Übergabe.
Das vollständige Original (6122 Zeilen) liegt unverändert unter
[Archiv/schwarzes-brett-bis-2026-11-18.md](Archiv/schwarzes-brett-bis-2026-11-18.md).
Original-Git-Blob: fdb75900d156d20e21dbb6c5e59f9265b529c3c4.
Diese Kurzfassung und das Originalarchiv wurden gemeinsam gespeichert.
Historische Details bleiben erhalten; alte Kommunikationsbretter werden nicht reaktiviert.

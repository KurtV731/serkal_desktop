# CE-Nachfolge SerKal – verbindliche Übergabe vom 23.10.2026

## 0. Zuerst lesen: Auftrag und Arbeitsstand

Kurt bittet ausdrücklich um eine detaillierte, dauerhafte Nachfolgeübergabe, nachdem ein Modell-/Chatfehler nur durch Neustart übergangen werden konnte. Diese Dokumentation dient der Kontinuität; der Fehler erlaubt keine verlässliche Aussage über die verbleibende Laufzeit des Chats. Keine angeblich fortlaufende Hintergrundarbeit nach einer Antwort versprechen.

Dies ist der **CE-/Chefentwickler-Stand**, keine Installer-Abnahme und keine öffentliche Freigabe. Datum dieser Bestandsaufnahme: 23.10.2026. Technische Angaben unten wurden im laufenden Auftrag aus GitHub und dem tatsächlich gebauten APK-Manifest geprüft. Nachfolge muss zuerst das gemeinsame Schwarze Brett und danach aktuelle Branch-Spitzen lesen, bevor sie Änderungen vornimmt.

**Unmittelbar aktiv:** Kurt testet Ahsoka nach absichtlich vollständiger Bereinigung. Testergebnis ist noch nicht eingegangen. Nicht behaupten, dieser Gerätetest sei bestanden. Nicht eigenmächtig weitere Daten löschen oder den Test durch ein neues Datenformat unterbrechen.

Einzige gemeinsame Kommunikationsstelle für CE, Installer, Website und HASA:
[1 docs/schwarzes_brett.md](schwarzes_brett.md) im Repository **KurtV731/serkal_desktop auf main**. Kein neues eigenes Brett anlegen. HASA-Programm und Website bleiben fachlich getrennt; das gemeinsame Brett bleibt gemeinsam.

## 1. Arbeitsweise mit Kurt

- Deutsch, direkt, freundlich, klare nächste Handlung. Diktatfehler anhand des Zusammenhangs entschlüsseln; bestätigte Namen nicht ungefragt umbenennen.
- Ein klarer Arbeitsauftrag ist ausreichend. Notwendige Umsetzung, Prüfung, Commit und konkrete Lieferung ausführen; nicht nur ankündigen oder wieder nach demselben Auftrag fragen.
- Fehlende Berechtigung/Information nur dann erfragen, wenn wirklich erforderlich. Bereits zugängliche Quellen selbst prüfen.
- Screenshots vom Smartphone zum PC zu übertragen belastet Kurt. Nur bei unumgänglicher Notwendigkeit verlangen; Fehlercode/Log als Text bevorzugen.
- Kurt testet auf **zwei Windows-Geräten (PC, Laptop), Pixel8 und Samsung-Tablet**. Meist nur ein Gerät aktiv benutzt. Den Laptop nicht dauerhaft als untergeordnetes Lesegerät behandeln.
- Klar unterscheiden: implementiert, automatisiert geprüft, gebaut, signiert, auf Nutzergerät geprüft, öffentlich veröffentlicht.
- Keine native Android-/Windows-Geräteabnahme vortäuschen. Hier wurden Quellcode, Node-Tests, GitHub-Actions-Build/JUnit, APK-Manifest und Signatur geprüft.
- Keine unaufgeforderten Mails oder Nachrichten versenden. Gemeinsames Brett darf innerhalb bestehender Projektaufträge aktualisiert werden.
- Neue Datei-/Ordnernamen mit **Bindestrichen**, ohne Leerzeichen/Unterstriche bevorzugen. Bestehende Pfade nicht bloß aus Stilgründen umbenennen.
- Private lokale Projektablage unter **ppd**. Nicht versehentlich pbd schreiben.
- Kurts Testbereinigung ist ausdrücklich beabsichtigt. Nicht nochmals wegen derselben Serienlöschung um Bestätigung bitten.

## 2. Repositories, Rollen und Branches

| Zweck | Repository / Branch | Am 23.10. bestätigter Stand |
|---|---|---|
| Gemeinsames Brett / CE-Dokumentation | KurtV731/serkal_desktop / main | Vor dieser Übergabe 6688b59917b08cab0edb5e5c7840603acea5b394; diese Übergabe erhält eigenen Commit |
| Desktop-Entwicklung | KurtV731/serkal_desktop / serkal-0.0.5-archiv-start | **4a3179a800413a07767291e8007878ba5ed5685b**, Paketversion **1.2.0-alpha.24** |
| Android | KurtV731/serkal_desktop / android-preview-0.0.5 | **63faec7cebfda4a5a1e311323bf96af09279b7d3**, **0.0.5a21**, versionCode **29** |
| Website | KurtV731/serkal-pages | Website-Chatty; aktuellen Stand im Brett lesen |
| Installer | im Desktop-Repository, eigener Installer-Arbeitszweig | Installer-Chatty; historisch installer-alpha-22-1. Aktuell selbst prüfen |
| HASA | KurtV731/hasa | eigener CE; Kommunikation ebenfalls am gemeinsamen Brett |

**main ist nicht automatisch der neueste Desktop-/Android-Quellstand.** Keine Codebranches aus einer älteren main-Datei überschreiben. Historische Dateien unter 1 docs/checkpoints/2026-10-14 sind Rettungsstände und **nicht** der aktuelle Implementierungsstand.

GitHub-App zuerst. Änderungen über create_tree → create_commit → update_ref mit expected_sha und force:false. Bei Konflikt aktuelle Spitze lesen und fremde Änderungen erhalten; kein blindes force. Nicht auf Shell-Push ausweichen. Nach Schreiben tatsächliche Remote-Blobs/Dateien prüfen, nicht nur Erfolgsmeldung wiederholen.

## 3. Letzte konkrete Lieferung

### Android a21

- Quelle: 63faec7cebfda4a5a1e311323bf96af09279b7d3.
- Erfolgreicher Actions-Lauf: **39919433453**, Artefakt **12485819069**.
- **47 JUnit-Tests**, 13 Testsuiten, 0 Fehler, 0 Fehlschläge, 0 übersprungen.
- Installierbare signierte Datei: **0.0.5a21-serkal-android.apk**.
- Größe: **2887431 Bytes**.
- SHA256: **9798819e8adda27a0e55bbf348590ea5763fbd926069c645694c9c61e02421d6**.
- Dauerhaft bereitgestellt: Library-ID **libfile_68c5ee876b1c8191bfd660cf0c3676bb**.
- Manifest unabhängig aus binärem AndroidManifest.xml gelesen:
  Paket **de.serkal.android.preview.v005**, Version **0.0.5a21**, Code **29**, minSdk24 / targetSdk35.
- Originalsignatur V2/V3 geprüft. APK ist als Update über a20/a19 usw. vorbereitet; **nicht deinstallieren**, um Archive nicht zu verlieren.
- Noch keine aktuelle Pixel-/Samsung-Abnahme von a21. Kein öffentlicher Website-Upload, keine Play-Store-Veröffentlichung durch diese Lieferung.

Vorherige a20: Quelle 7173d8e518fbe98e7d5588c322c8e50207e91b9d, Actions39854180671, 39 Tests, Code28. a20-Datei 2883335 Bytes, SHA256 8fae9cef908be730f3322e666eb30c65582f4590a65b4fc5cd099b9c26daa3ce, Library-ID libfile_d63b6d7f98188191865c6a3d11d0a3d7.

### Desktop Alpha24

Quelle **4a3179a800413a07767291e8007878ba5ed5685b**, package.json und package-lock.json auf 1.2.0-alpha.24 angepasst, keine neuen Abhängigkeiten. **31 Node-Testprogramme bestanden**, einschließlich zusätzlicher Szenarien in bestehenden Testprogrammen.

**Wichtig: Es wurde hier kein neuer Windows-Installer gebaut.** Installer-Chatty hat am Brett den konkreten Bauauftrag für diesen Quellstand. Übergabe ist keine bestätigte Ausführung durch ihn. Vor einer Testanweisung feststellen, ob Kurt per Entwicklungsstart oder neuem Installer wirklich Alpha24 verwendet. Keine pauschale Behauptung „beide Programme bereits aktualisiert“.

Relevante frühere Desktopspitze: 596425f03495104ec6a65ede7baf9ce85df86981. Erster Fixcommit vom 23.10.: ace50dd38823bd9c6685c17ef58f8aaa8decbf12; nachfolgender Schutz-/Versionscommit ist die oben genannte endgültige Spitze.

## 4. Aktuell laufender Ahsoka-Test – nicht als erledigt behandeln

Kurt hat gesagt:

1. Beide fehlerhaften Archiveinträge vollständig löschen. Dass dies die ganze Serie mit allen archivierten Staffeln betrifft, ist **Absicht**.
2. Mit der früher vorhandenen **Staffel1** neu beginnen.
3. S01 als **gesehen/grün** markieren; „archiviert“ allein ist nicht dasselbe wie „gesehen“.
4. Wartung starten, um S02 automatisch nachzuführen.
5. Falls das nicht funktioniert, S02 manuell aufnehmen.
6. Danach Rückmeldung an CE; noch kein Ergebnis vorhanden.

Keine erneute Warnschleife wegen ausdrücklich gewünschter Löschung starten. Bestehende dauerhafte Ankündigungskarten im Google-Kalender bleiben nach der Produktregel bei Serienlöschung bestehen; Kurt kann sie selbst löschen/ignorieren. Dadurch ist ein vollständig geleertes Archiv nicht automatisch ein vollständig geleerter Kalender. Vor einem Dublettenurteil die stabilen IDs/Karten prüfen.

### Wesentliche noch offene Gleichheit von Wartung und manueller Eingabe

**Manuelle Android-Eingabe a21** erzeugt bei bekanntem Start und unvollständigem Episodenplan eine echte eigene vorläufige [S02]-Archivzeile.

**Android-Wartung a21** erzeugt bei einer unvollständigen neuen Folgestaffel dagegen bisher **Ankündigungsmetadaten samt dauerhafter Kalenderkarte** an vorhandenen Archivzeilen. Ein insertPayload für eine eigene neue Staffelzeile wird dort weiterhin erst bei vollständigen Episodenterminen erzeugt. Desktop-Wartung besitzt ebenfalls getrennte Ankündigungs- und vollständige Staffelübernahmewege.

Das ist eine **bekannte noch zu vereinheitlichende Grenze**, keine bestandene automatische Aufnahme als eigene vorläufige Zeile. In der vorigen knappen Testantwort wurde „Staffel2 sollte als Ankündigung erscheinen“ gesagt; daraus darf die Nachfolge keine bereits getestete eigene S02-Zeile durch Wartung ableiten. Gerade dieser Punkt kann in Kurts aktuellem Test auffallen. Bei Bestätigung die Wartung gezielt an dieselbe vorläufige Aufnahme wie die manuelle Eingabe anbinden, mit Tests und ohne Verlust früherer Staffeln. Nicht Kurt erneut denselben Test ohne Diagnose wiederholen lassen.

## 5. Fehlerbild vom 23.10. und tatsächlich implementierter Fix

Kurt meldete:
- Android-Kalenderzugriff praktisch nicht auffindbar.
- Pixel lehnte Ahsoka S02 wegen unvollständiger Episodentermine ab; Desktop akzeptierte.
- Desktop zeigte S01 mit ursprünglichem 22.08.2023 und zusätzlich „S02:19.01.2027 (?)“ in der Datumsspalte.
- S02-Zeile zeigte 20.01.2027 und zusätzlich die Ankündigung 19.01.2027.
- Richtige Kalenderkarte: ein angekündigter Staffelstart, erwartete acht Folgen, genaue Folgetermine unbekannt.
- Staffeln ausschließlich als [Sxx] beim Namen, keine Staffellisten rechts neben Datum.

Ursache Anzeige: gemeinsame Ankündigungen derselben Serie wurden an **jede** Staffelzeile angehängt. Das beweist keine neue Ausstrahlung von S01. Frontend nun ohne diesen Suffix; eigener Ankündigungshinweis nur passend zur Staffel im Tooltip. Vorläufige eigene Zeile erhält (?) am Datum.

**Nicht als behoben behaupten:** Unterschied 19./20.01.2027 im vorhandenen Datensatz. Ohne Original-TXT/Offset ist die Ursache offen. Keine vorhandenen Original-/DE-Daten pauschal umschreiben. Kurts absichtlicher Neuaufbau kann diesen alten Datensatz ersetzen, belegt aber noch keine Analyse seiner ursprünglichen Ursache.

Android:
- Fester zusätzlicher „Kalender“-Knopf oben, außerhalb ZoomPanLayout; bisheriger unterer Knopf bleibt.
- Kopf zeigt kompakte Version, damit Platz für Kalender bleibt.
- Links zu vorhandenem Kalender und Konto über PublicLinks, keine neuen Scopes.
- SeasonInput.schedule trennt vollständige Termine von bloßer Startankündigung. Erwartete Folgenzahl aus Staffelübersicht/Staffeldetails. Fehlender Start wird nicht erfunden.
- Unvollständige Aufnahme: announcementOnly=true im Payload, angekündigter Start, leere termindaten. TXT speichert announcementOnly=1 und bekannte Startangabe; die Archivansicht kann sie anzeigen, normale Kalender-Episodenerzeugung überspringt sie.
- Ankündigung hat erwartete Folgenzahl und Historie; keine erfundenen E01–E08-Termine.
- Wiederholung derselben Eingabe erzeugt keine neue Staffel/Karte.
- Vollständige spätere Eingabe bzw. Wartungsdaten können den vorläufigen Zustand ablösen; Ankündigungskarte bleibt.
- Eine einzelne datierte Folge bei acht erwarteten darf nicht als komplette Staffel übernommen werden.
- Bestehende **vollständige** Staffel wird nicht durch unvollständige manuelle Daten ersetzt.
- Ältere bereits gespeicherte unvollständige Zeilen ohne announcementOnly-Markierung wurden nicht pauschal migriert. Nicht alle historischen Teilpläne als automatisch repariert behaupten.

Desktop:
- Backend liest announcementOnly und hält vorläufige Zeilen geplant/gelb.
- Gemeinsamer Kalenderplan überspringt sie bei regulären Episodenereignissen.
- Bei vollständiger späterer Wartungsübernahme Markierung löschen.
- Bei geänderter Ankündigung Start vorläufiger Zeile nachführen; Schutz von Original-/DE-Daten beachten.
- Ankündigungskarten verwenden dieselben stabilen IDs und erwartete-Folgenzahl-Texte wie Android.

Näheres: [Kalender / vorläufige Staffeln](kalender-vorlaeufige-staffeln-2026-10-23.md).

## 6. Fachliche Produktregeln – verbindlich erhalten

### Vier Statusformen

| Farbe | Bedeutung |
|---|---|
| Gelb | eingetragen, noch nicht begonnen / angekündigt |
| Blau | aktuell laufend |
| Rot | laut Terminplan vollständig verfügbar, noch nicht als gesehen markiert |
| Grün | manuell als vollständig gesehen markiert |

SerKal kann keine Gedanken lesen. Gesehen ist expliziter Nutzerzustand. Laufende Serie darf bereits grün sein; Rücknahme ergibt bei laufender Serie blau, bei abgeschlossener rot. DE/EN, Dark/Light und Sortierwechsel dürfen Farben/Zustände nicht verlieren. Desktop und a15 hatte Kurt zuvor positiv bestätigt; jede spätere Änderung muss Regression vermeiden.

### Wartung / Serienumfang

SerKal ist Kalender-Eingabetool, kein vollständiges Serienlexikon.
- Keine automatische Rückfüllung vor dem eigenen Einstieg.
- Beispiel EinstiegS07, S09 vorhanden: S08 darf als Lücke gemeldet werden, S01–S06 nicht.
- Neue Staffel oberhalb der höchsten eigenen Staffel automatisch weiterverfolgen, wenn bisher höchste eigene Staffel gesehen ist.
- Zukünftige Ankündigung ist nicht „fehlende alte Staffel“.
- Vorläufige Termine/Historie festhalten. Keine Meldung/Karten-Dublette bei unverändertem Datum.
- Änderungen der Startankündigung mit erfasst-am / von / auf nachvollziehbar.
- Dauerhafte Ankündigungskarte bleibt, bis Nutzer sie löscht oder ignoriert; nicht bei Serienlöschung automatisch entfernen.
- Erweiterte Wartung mit Zwischenfragen ist späterer Ausbau, nicht schon fertiger Funktionsumfang.

### Titel, Sprachen, Anbieter

- UI-Sprache und TMDB-/Kalenderdatensprache bewusst behandeln; lokalisierter Titel darf nicht nach Auswahl wieder durch falschen Original-/anderssprachigen Titel ersetzt werden.
- Englische Suche/Anzeige darf nicht blind auf deutsche/französische Titel zurückfallen, wenn korrekte Übersetzung/Original vorhanden.
- TMDB-ID sicht-/aufrufbar, konkrete Staffel auch ohne vorherige Aufnahme nachschlagbar.
- Anbieter nach Nutzerland (z.B.DE/AU), unter Beschreibung. Manuelle Anbieterangabe möglich; nicht als dauerhaft gültige Verfügbarkeit garantieren.
- Anbieterfunktion, Titelkorrekturen und Datumspflege sind bestehende Wartungsbereiche; Neuimplementierung nicht ohne Prüfung starten.

## 7. Architektur und zentrale Dateien

### Desktop

- **2 src/backend/main.js**: Electron, Einstellungen, OAuth, Archiv-TXT lesen/schreiben, TMDB, Wartung, Kalenderintegration, IPC.
  Wichtige Stellen/Funktionen: archiveEntryFromLine_, archiveInsert_, maintenanceAnalyse_, maintenanceBuildOperations_, maintenanceWriteArchive_, maintenanceWriteProviders_, analyseSeason_.
- **2 src/frontend/index.html**: Dreispaltenoberfläche, I18N, Archivzeilen/Sortierung/Status, Eingabefluss.
  Neu: archiveAnnouncementForSeason_, archiveDateCaption_. Nicht versehentlich große Teile der UI aus altem main-Stand ersetzen.
- **2 src/common/preload.js**: Electron-Brücke.
- **archive-copy.js / archive-copy-desktop.js**: vollständige lokale Archivkopie, Revisionen/Übernahme/Upload.
- **archive-calendar-copy.js**: idempotenter Plan regulärer und permanenter Ankündigungsereignisse.
- **season-announcements.js**: gemeinsame Ankündigungsstruktur/Verlauf.
- **maintenance-follow.js / maintenance-report.js**: Folge-/Melderegeln.
- **archive-lock.js / archive-observer.js**: Sperre und ältere Beobachtungslogik. Vor Einsatz prüfen, welcher Pfad noch aktiv ist; nicht alten Polling-Pfad und neue vollständige Kopie unkoordiniert aktivieren.
- **close-guard.js**: gemeinsamer Beenden-/X-/AltF4-Schutz.
- **calendar-window.js**: separates Kalenderfenster.
- **backend-i18n.js** und Frontend-I18N: DE/EN zentral, keine neuen deutschen Einzeltexte außerhalb Katalogen.

### Android

Wurzel **android-preview/**. Paketquellen:
android-preview/app/src/main/java/de/serkal/android/preview/

- **MainActivity.java**: UI, Suche, Staffelaufnahme, Archivaktionen, Google, Wartungsbericht, Kalender-/TMDB-Links.
- **SeasonInput.java**: neu a21, Terminplan versus bekannte Startankündigung.
- **AndroidArchiveCopy.java**: lokale Persistenz, Epochenschutz, Synchronisation, Hintergrundarbeit, Kalender-ID.
- **ArchiveCodec.java**: vollständige TXT-Dateien, Felder, Datumsformate, Änderungen und atomare Wartungsanwendung.
- **ArchiveCopyClient.java**: Google-Appdaten/Revisionen.
- **CalendarCopy.java**: reguläre Ereignisse, Signaturen, manuelle Kalenderschutzprüfung.
- **SeasonAnnouncements.java**: permanente Karten/Historie/stabile IDs.
- **Maintenance.java**: Abruf und Patch-/Berichtserzeugung.
- **ArchiveOrder.java**: Titel, Saisonkennung, Datumssortierung, Status.
- **PublicLinks.java**: Kalender/TMDB/Staffellinks, sicher kodierte Konto-/ID-Angaben.
- **TmdbClient/TmdbTitle/WatchProviders/PosterClient**: Daten, Sprache, Anbieter, Bilder.
- **KeyCache/SharedKeyClient/SharedArchiveClient**: Schlüssel bzw. ältere gemeinsame Ansicht; aktuelle Aufrufpfade prüfen.
- **ZoomPanLayout.java**: skalierbarer/verschiebbarer Inhalt. Feste Navigation außerhalb lassen.
- AndroidManifest: sensorLandscape, adjustResize, minSdk24; Tastaturfeld verlangt NO_EXTRACT_UI / NO_FULLSCREEN, Hersteller können sich unterschiedlich verhalten.

### Archiv und Synchronisation

Vollständige TXT-Inhalte sind maßgeblich, nicht bloße UI-Zeilen. Schema2-Record enthält owner, revision(UUID), parent, generatedAt, calendar{mode,id}, files{name,content,sha256}. Dateinamen/TXT, Hashes, Konto und Abstammung prüfen. Unbekannte TXT-Felder/Notizen/manuelle Flags bewahren.

Lokale Kopie je Gerät; Google als gemeinsamer bestätigter Stand. Neue Geräte zuerst gültigen Stand übernehmen; lokale Änderungen zunächst sicher speichern, Übertragung separat. Upload darf Bedienung/Suche/Bilder nicht blockieren. Ausstehende lokale Änderungen, eingefrorener Uploadstand und bestätigte Revision getrennt halten; älteres Gerät darf neueren Stand nicht still überschreiben. Abbruch muss wiederaufnehmbar sein.

Wenig Platz: unter 10MiB Lesen erlauben, Schreiben mit Hinweis sperren. „Jetzt synchronisieren“ und klarer Status. Kein dauerndes volles Archivdownload zur Beschäftigung. Alte v1-Ansicht ggf.einmal vom Quell-PC nach v2 migrieren; **ganz neuer Android-only-Nutzer kann mit eigenem TMDB-Key und Google leer starten, braucht keinen PC**. Reale Erstnutzerabnahme bleibt offen.

TXT enthält typischerweise S01; tmdb=…; eps=…; startOriginal=…; dates=…; datesDE=…; startDE=…; offsetDE=…; seen=…; manualFlags=…; note=…; descDE/EN; titleDE/EN; watchProviders; announcements; calendarLanguage; neu announcementOnly.
Archiv wird pro Serie mit ihren Staffelzeilen gehalten. „Serie löschen“ entfernt alle archivierten Staffeln, nicht nur markierte Zeile.

Datumsparser unterstützt ISO, TT.MM. und seit a19 TT.MM.JJJJ. COPY_INVALID_DATE: genaue damalige Nutzereingabe nicht reproduziert. Pro Staffel ungültige Terminübernahme isolieren; übrige gültige Metadaten nicht unnötig verwerfen. Den konkreten betroffenen Dateinamen/Staffel berichten.

Kalender:
- Bestehende ID zuerst prüfen/wiederfinden. Bei mehrdeutigen oder nicht zugänglichen Zielen abbrechen; keinen Ersatzkalender blind erzeugen.
- Normale Termine privat als serkal=1 markiert, Signatur schützt manuelle Google-Änderungen.
- Ankündigungen privat serkal=announcement und announcementKey=TMDB:Sxx.
- Stabile Karten-ID: „serkal“ + SHA1 von „announcement:“ + TMDB:Sxx.
- Manuell gelöschte/cancelled Ankündigung nicht automatisch wiederbeleben.
- Offset ist relativ zum Originaldatum, nicht zum zuletzt verschobenen Datum. 0D muss Original wiederherstellen.
- Der alte Kalendername SerKal darf bleiben; neue App-Kalender und engere Rechte nicht mit pauschaler Umbenennung verwechseln.

## 8. Signierung: niemals erneut Schlüssel verlieren oder ersetzen

Bestätigte private Datei bei Kurt:
**C:\\ppd\\serkal\\serkal-private\\android\\SerKal-Android-Preview-Signing.jks**

Nicht serkal_private. Nicht ins Repository, nicht in öffentliche Downloads. Zusätzlich getrennte private Sicherung sinnvoll.

Originaldatei dauerhaft verfügbar unter Library-ID **libfile_c7e15826939c819188317c9b128c6986**.
Größe **3000 Bytes**, Datei-SHA256 **015385be5e3eb412d6f4b9040c92eee56acb4c9b0922b9a37e4d732766885f31**.
Alias **serkal-preview**.
Zertifikat SHA256 **7e24902dd88ed80fb84e0ffc3b188a1e0c88e30cb2a84247a03cf4ba416667eb**.
Zertifikat SHA1 **0d63f508dc1fe14e976c221a0c2798d3a1515986**.

Das Passwort gehört **nicht in diese öffentlich lesbare Übergabe**. Es war im bisherigen privaten Signierablauf vorhanden. Bei neuer Umgebung sichere private Quelle prüfen und vorhandenen Schlüssel verwenden; nicht aus fehlender transienter Datei auf verlorenen Schlüssel schließen. Kein neuer Signierer ohne bewusste Migrationsentscheidung. Mit neuer Signatur wäre Drüberinstallation unmöglich.

CI baut **unsigned**. GitHub-Artefakt ist nicht automatisch die an Kurt zu liefernde installierbare signierte Datei.

## 9. Build und Verifikation für die Nachfolge

Desktop:
1. aktuellen Entwicklungszweig lesen/auschecken, Änderungen erhalten.
2. npm test: aktuell 31 Programme. Keine frischen Nutzerdaten in Tests verwenden.
3. Bei vollständigem Source-Export auch forge.config.js und scripts/ mitnehmen; sonst können Verpackungs-/Laborprüfungen nur wegen fehlender Testdateien scheitern.
4. Installer-Rolle baut aus bestätigter Spitze, nicht aus altem main. Versionsanzeige prüfen.

Android:
1. nächste gelieferte Version nach a21 ist **a22**, versionCode **30**, sofern zwischenzeitlich kein anderer Commit existiert.
2. app/build.gradle und Artefaktname im Workflow gemeinsam aktualisieren.
3. .github/workflows/android-preview.yml nutzt JDK17 / Gradle8.9, testDebugUnitTest assembleDebug, compileSdk35.
4. Nach Push richtigen Run anhand head_sha auswählen; nicht älteres erfolgreiches Artefakt liefern.
5. Artefakt-ZIPdigest prüfen, JUnit-XML wirklich auswerten.
6. Unsigned APK mit ORIGINAL-JKS/alias signieren; Passwort über privaten sicheren Ablauf, keine Geheimnisse ins Repo.
7. apksigner verify --verbose --print-certs, Originalfingerabdruck vergleichen.
8. Paket, versionName und versionCode im tatsächlichen Manifest prüfen, SHA256 und Größe bilden.
9. Signierte APK dauerhaft verfügbar machen, Downloadlink geben, Board mit Quelle/Run/Tests/Signer/Hash/Abnahmegrenze aktualisieren.
10. Wirkliche Installation/Sichtbarkeit auf Pixel/Samsung bleibt gesonderter Nutzertest.

## 10. Weitere offene Punkte / nächste Prioritäten

### Direkt

- Kurts Ahsoka-Test abwarten und ohne Wiederholungszwang auswerten.
- Installer-Bau Alpha24 aus dem oben genannten CE-Stand verifizieren.
- Fester Android-Kalenderknopf: auf beiden Geräten sichtbar? korrektes Konto/Kalender? Rückkehr zur App?
- Wartung versus manuelle vorläufige Aufnahme wie in Abschnitt4 vereinheitlichen, falls erwartet/Testergebnis bestätigt.
- S01 darf keine falsche S02-Ankündigung in Datumsspalte zeigen.
- Alte unmarkierte Teilpläne und 19./20.01.-Unterschied nicht ungeprüft als behoben melden.
- Nach erfolgreichem Test Gerätewechsel/Synchronisation mit identischer Anzahl Staffelzeilen/Karten prüfen.
- Kein öffentlicher APK-Download ohne konkrete bestätigte Freigabe des geprüften Stands.

### Öffentliche Desktop1.2 / Android Public

Bestehende Veröffentlichungsliste samt Checkboxen weiterführen, nicht neue abweichende Prioritätenliste erfinden. Druck-PDF: serkal-public-ablaufplan-checkliste.pdf, Library-ID libfile_41807d8195e08191b30fc7df1bdc695f (inhaltlich bei Verwendung erneut lesen).

Noch notwendige Abnahmen: Erstnutzer Android-only, Mehrgeräte-/Offline-/Abbruch-/Speicherfälle, verständlicher Syncfortschritt, Eingabe/Löschen/Gesehen/Sortieren/Log/Wartung/Kalender, DE/EN/Dark/Light, öffentliche Download-/Installationsanleitung, Datenschutzerklärung und Release-/Updateweg. Frühere a15-Erstnutzerunterlagen sind versionsgebunden und nicht automatisch a21-Anleitung.

Öffentliche Vorab-APK per Website/QR ist gewünschter Zwischenschritt; PlayStore separate spätere Veröffentlichung. Keine Garantie für Review-/Testdauer oder aktuelle Google-Vorgaben aus Erinnerung. Google-Mail/Console bei Bedarf wirklich lesen. Brand/OAuth-Prüfung war zuvor positiv gemeldet; das ist keine PlayStorefreigabe.

### Später vorgemerkt

- Zwei Updatekanäle: stabile öffentliche Releases und Kurts private Entwicklungsupdates. Noch nicht als fertig behaupten.
- Menü/Bedienung Desktop und Android einander annähern, bisherige kleine/lesbare Knöpfe nicht wieder zu riesigen blockierenden Flächen machen.
- Film-Erweiterung als mögliche spätere Idee.
- Erweiterte Wartung mit Rückfragen später.
- PLUS01 freie Fenster-/Bedienungsanordnung, PLUS02 zusätzliche selbst übersetzbare Sprache, PLUS03 frei konfigurierbare Wartungsentscheidungen: [Ideenliste](ideenliste.md). Noch keine zugesagte kostenpflichtige fertige Version.

## 11. Website / Infrastruktur – keine Verwechslungen

SerKal und HASA bekommen getrennte Websites serkal.de / hasa.li. Gemeinsames Brett bleibt im Desktoprepo. Website-Chatty ist für Layout/Navigation/öffentliche Downloadseite zuständig; CE liefert technische Fakten. ALL-INKL-Migration läuft, nicht ohne Brettprüfung schon als abgeschlossen melden. Alte INWX-Installation erst nach bestätigter Migration stilllegen.

Öffentliche HASA-Autorbezeichnung **Styl** statt privatem Kurt. HASA-Quellen nicht im SerKal-Produkt mitveröffentlichen. Keine Zugangsdaten in Repo/Übergabe.

## 12. Dokumente zum Nachlesen

- [Gemeinsames Brett](schwarzes_brett.md)
- [Kalender / vorläufige Staffeln 23.10.](kalender-vorlaeufige-staffeln-2026-10-23.md)
- [Android Kalender / TMDB a20](android-kalender-tmdb-2026-10-22.md)
- [Wartungsübernahme 21.10.](wartung-uebernahme-2026-10-21.md)
- [Abschluss / Android-only 21.10.](abschluss-2026-10-21.md)
- [Vier Statusformen](archive-status-contract-2026-10-19.md)
- [Ideenliste](ideenliste.md)

Historische Dokumente können durch neuere Brett-Einträge überholt sein. Bei Widerspruch aktuelle geprüfte Quelle und neueste ausdrückliche Nutzerentscheidung heranziehen.

## 13. Erster konkreter Schritt der Nachfolge

Nicht von vorn anfangen. Erst Board und dieses Dokument lesen, Branchspitzen prüfen, dann Kurts Rückmeldung zum laufenden Ahsoka-Test auswerten. Mit einem Satz den übernommenen Stand bestätigen und am konkreten offenen Punkt weiterarbeiten. Falls der Nutzer zuerst nur Bestätigung der Aufnahmebereitschaft möchte, diese knapp geben; keinen neuen umfangreichen Build ohne passenden Auftrag starten.

Diese Übergabe dokumentiert den Stand; sie beendet nicht Kurts bestehenden Entwicklungsauftrag. Alle Testergebnisse nach dieser Bestandsaufnahme separat am gemeinsamen Brett ergänzen.

## 14. Neueste Meldung während dieser Übergabe: Liste endet zu früh

Kurt meldet nach dem bisherigen Test: Liste zeigt nur ungefähr vier bis sechs Einträge, danach große schwarze ungenutzte Fläche unten. Noch offen, ob Desktop-/Android-Archiv oder eine andere Liste gemeint ist. Keine Screenshotpflicht daraus ableiten; kurze Textfrage nach Gerät und Liste reicht. Das ist keine bestätigte Datenlöschung.

Quell-Vorprüfung: Android-Archiv nutzt ScrollView mit Höhe0/Gewicht1 im rechten Panel; kein belegtes fixes Sechs-Zeilen-Limit gefunden. Nicht bereits „Ursache gefunden“ behaupten. Desktop hat mehrere responsive/feste Höhenregeln, deren tatsächliche Wirkung am betroffenen Listencontainer zu prüfen ist. Erst Zielgerät/Liste bestimmen, dann Höhen-/Flex-/Scroll-Aufteilung und Zoom/Tastaturzustand prüfen. Gewünschtes Verhalten: verfügbare Höhe sinnvoll nutzen, verbleibende Einträge erreichbar, keine großen leeren Flächen durch künstliche Begrenzung.

Dieser neue Punkt wurde noch nicht im Code verändert und ist vor einer öffentlichen Abnahme offen.


### Präzisierung von Kurt: Android-Listen links UND rechts

Kurt bestätigt: Suchvorschläge links und Archivliste rechts betroffen, ausschließlich Android. Auf dem Tablet etwas längerer, auf dem Smartphone kürzerer Listenbereich; ungefähr bei 50 Prozent der Bildschirmhöhe endet die Liste, darunter große schwarze Fläche. Die frühere Frage Desktop/Android ist damit beantwortet und darf nicht erneut gestellt werden. Gemeinsame Höhen-/Scrollaufteilung sowie Zustand nach Tastatur/Zoom prüfen. Aktuelle Quell-Vorprüfung: beide ScrollViews Höhe0/Gewicht1, Panels MATCH_PARENT; kein ausdrücklich auf 50 Prozent begrenzender Wert gefunden. Laufzeitursache und Reparatur bleiben offen; keinen Datenverlust oder erfolgreiche Korrektur behaupten.


## Dringender neuer Befund: Desktop-Archivkonflikt blockiert Löschen

Kurt meldet zuletzt nur seinen Desktop mit Alpha24 aktiv; andere Geräte laufen nach seiner Aussage nicht. Löschen im Archiv nicht mehr möglich, normales Beenden als problematisch beschrieben. Screenshot wörtlich: „77 Archiveinträge lokal geladen · Ein neuerer oder konkurrierender Archivstand liegt bei Google. Deine lokale Kopie bleibt erhalten; nichts wurde überschrieben.“ Lokale Ahsoka-Daten hat Kurt nach eigener Aussage bereits manuell gelöscht; welche Datei/auf welchem Weg ist offen. Viele JSON-Dateien vorhanden, ihre Funktion ist ihm unklar. Keine JSON-/Token-/Kalenderlöschung als pauschale Reparatur anweisen.

Quellbefund DesktopCopy.fatal/assertWrite: COPY_CONFLICT sperrt alle Schreiboperationen, also auch Löschen. Ein Konflikt braucht nicht gleichzeitig laufende Geräte; divergierende ältere lokale/Cloud-Revisionsstände reichen. Konkrete Divergenzursache mit Nutzerdaten noch nicht festgestellt. Screenshot beweist weder vollständigen Archivverlust noch erfolgreiche Auflösung. Aktueller vorhandener Schutz hat keinen ausreichend verständlichen Konfliktlösungsweg für Nutzer; das ist ein dringender offener Public-Blocker.

Beenden: close-guard sieht bei ausstehender Google-Übertragung „Lokal gesichert beenden“ vor; dies beendet ohne Upload, die vorhandenen lokalen Dateien bleiben. Ungespeicherte UI-Änderungen sind separat zu behandeln; keine pauschale Zusicherung, dass Beenden unbekannte Änderungen speichern würde. Wenn der Dialog nicht erreichbar ist, ist auch das gesondert zu untersuchen, nicht als bereits reproduziert behaupten.

Nächster Reparaturschritt: vor jeder Zustandsänderung lokalen Archivbestand UND Synchronisationsmetadaten getrennt sichern, erreichbare Cloudrevisionen sichern/analysieren, erst danach nachvollziehbare Auswahl/Abgleich zwischen erhaltenen Ständen ermöglichen. Nicht blind lokalen Stand erzwingen, keine Remotehistorie löschen, nicht fremde/nicht ausgewertete JSON-Dateien löschen. Kurts Wunsch nach normaler Weiterarbeit und Exit berücksichtigen, sichere Konfliktlösung darf keine Sackgasse sein. Dieser Befund folgt auf den PDF-Plan vom23.10.; dortige offenen Synchronisations-/Abnahmepunkte sind damit konkretisiert, keine allgemeine Public-Freigabe.

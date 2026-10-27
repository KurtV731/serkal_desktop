# Übergabe an Installer: isolierter SerKal-Sitzungstest 33
27.10.2026 · CE · Quellstand fertig, Windows-Artefakt und Praxisabnahme offen

## Festgeschriebener Quellstand
- Repository: KurtV731/serkal_desktop
- Testbranch: `ce-session-test-33`
- Commit: `553972d0008552333d4fba7781668ddd210206ac`
- Version: `1.2.1-alpha.33`, gemeinsamer Entwicklungsstand 33
- Paket-/Produktkennung absichtlich getrennt: `serkal_session_test_33` / `SerKal Session Test 33`
- Die Android-Metadaten reservieren versionCode 42; es wurde noch keine Android-Fassung mit neuem Sitzungsbetrieb implementiert oder gebaut.
- Nicht in den regulären Desktopzweig gemergt. Der normale git-pull-Weg und öffentliche 1.2-Dateien bleiben unverändert.

## Implementierter Umfang
Der Testzweig aktiviert den neuen Ablauf über serkal-session-test.json:
- Start liest eine vollständige Google-Kopie, ersetzt lokale TXT der letzten Sitzung und ignoriert alte ausstehende lokale Änderungen.
- Fehlende Google-Testdatei bedeutet beim ersten Teststart leeres Archiv. Das echte Archiv wird ausdrücklich nicht als Testbestand importiert.
- Eintragen, Gesehen-Umschalten, Löschen und Wartung arbeiten lokal. Keine geplanten Cloud-Uploads, kein Google-Archivpolling.
- Der noch vorhandene Sync-IPC kann nur einen fehlgeschlagenen Start erneut versuchen. Nach Laden der Sitzung überschreibt er keine lokale Arbeit.
- Reguläres Beenden speichert offene UI-Änderungen und schreibt eine vollständige Archivkopie zurück, sofern geändert.
- Fehlgeschlagener Abschluss zeigt den wirklichen Fehler und bietet „Ohne Speichern beenden“ / „Geöffnet lassen“. Kein Zwang zum Verbleib in der Anwendung.
- Nach Prozessabbruch wird beim Neustart Google gelesen. Alte Sitzungen werden nicht nachträglich hochgeladen.
- Letztes erfolgreiches Speichern gewinnt. Keine Revisionsketten oder Konfliktzusammenführung.
- Die untere Anzeige unterscheidet Laden, lokale Sitzung, ungespeicherte Änderungen, Speichern und tatsächlichen Fehler.
- In dieser eigenen Testprofil-Instanz gibt es keine persistente Archiv-Dateisperre mehr. Electron schützt weiterhin vor einer zweiten gleichzeitigen Instanz desselben lokalen Testprofils.

## Isolation
- Lokales Profil: `%APPDATA%\SerKal-Session-Test-33`
- Arbeitsarchiv: Unterordner `Archiv`
- Google appDataFolder: ausschließlich `serkal-session-test-33.json`
- Kein Lesen/Schreiben/Renamen der produktiven Archivdateien oder alten v2-Ketten.
- Der normale lokale TMDB-Key und vorhandene Google-Archivtoken dürfen ausschließlich lokal einmal in das Testprofil kopiert werden; keine privaten Daten im Repository.
- Echter Google-Kalender ist in diesem ersten Archivtest deaktiviert. Einstellungen werden auf keinen Kalender und den eigenen Archivordner begrenzt; direkte Calendar-API-Aufrufe und ICS-Export werden ebenfalls abgefangen.
- Keine Registrierung des normalen serkal://-Protokolls durch das Testprogramm.
- Andere Paket-, Produkt- und Squirrel-Kennung, damit der Bau nicht als reguläres Update ausgegeben wird.
- Der alte öffentliche Bau-BAT bricht auf diesem Testzweig sofort ab, sein bisheriger Inhalt bleibt darunter als Referenz.

## Google-Fehler: vollständiger Text
Neue gemeinsame Fehlererfassung liest den gesamten Google-Antwortbody ohne Kürzung.
Im Log enthalten: HTTP-Status, Operation/Schritt, Methode, Endpunkt ohne Querystring und kompletter Antworttext, einschließlich reason/domain/details und auch Nicht-JSON-Antworten.
Angewandt auf neue Sitzungsanfragen, vorhandenen Archivtransport, gemeinsamen TMDB-Key, OAuth-Tokenfehler, Calendar-HTTP-Antworten und ältere Archiv-Helfer.
Zugangstoken, bekannte übergebene Geheimnisse und übliche Credential-Felder werden geschwärzt; normale Google-Fehlerdetails werden erhalten.
Kein Requestbody und keine Authorization-Header werden protokolliert.
Der UI-Verbindungsdialog erhält die ausführliche Fehlermeldung ebenfalls.

Wichtig: Ein aussagekräftigerer Fehlerbericht behebt keinen von Google verweigerten Zugriff. VelcroFists konkrete 403-Ursache ist noch nicht geklärt. Den neuen vollständigen Antworttext aus einer echten betroffenen Verbindung zur Diagnose verwenden.

## Eigene Prüfung
- Vollständiges `npm test` lokal bestanden; zusätzliche Sitzungstests über `npm run test:session`.
- Neue Fälle: Start ersetzt alte Sitzung; kein Upload bei mehreren Bearbeitungen; ein Abschlussupload; unveränderter Abschluss ohne Upload; letzter Gesamtstand gewinnt; Prozessabbruch verwirft lokale Änderungen; Löschung bleibt weg; Offlinefehler sperrt weitere lokale Arbeit nicht; Startfehler endet als Fehler statt Ladeschleife; verwerfbarer Abschlussfehler.
- Remote-Test: eigener Dateiname, kein Startup-Upload, vollständiges PATCH, Auswahl der letzten Google-Änderung bei gleichzeitiger erstmaliger Erstellung.
- Vollständiger langer JSON- und HTML-Fehlertext mit reason/details geprüft, einschließlich Schwärzung von Testtokens.
- Echter Backend-IPC-/Manager-/Log-Pfad in einer simulierten Electron-Umgebung geprüft: isolierter Ordner, keine normale Protokollregistrierung, kein Edit-Timer, lokales Lesen und komplette 403-Antwort im geschriebenen Log.
- Alle fünf Frontend-Scriptblöcke syntaktisch geprüft.
- Keine praktische Windows-Oberflächenprüfung, keine echte Google-Verbindung in dieser Umgebung, kein Windows-Binärartefakt und keine Android-Abnahme behauptet.

## Konkreter Bauweg für Installer
1. Separaten Checkout des genannten Testbranchs unter einem Test-Bauordner verwenden; nicht Kurts aktuellen Arbeitscheckout umstellen.
2. Bestehende private Desktop-OAuth-Konfiguration für den Bau bereitstellen, wie beim öffentlichen Installer. Keine persönlichen Tokens in das Programmpaket aufnehmen.
3. `serkal-sitzungstest-33-bauen.bat` ausführen: npm ci → npm test → Forge package win32/x64.
4. Erwarteter kompletter Programmordner: `out\SerKal Session Test 33-win32-x64`.
5. Erwarteter Start: `SerKal Session Test 33.exe` aus diesem vollständigen Ordner.
6. Diesen Ordner als temporäre isolierte Testausgabe bereitstellen. Nicht eine einzelne Electron-EXE ohne Ressourcen weitergeben.
7. Falls ein temporärer Ein-Datei-Entpacker vorgesehen ist: nur diesen Testordner entpacken/starten; keine normale Installation, Verknüpfung oder öffentlichen Download ersetzen. Hash und Versionsprüfung der tatsächlich erzeugten Ausgabe dokumentieren.

## Kurts erster Praxistest
Erster Start darf leer sein. Eine Testserie eintragen, Gesehen umschalten, regulär beenden, neu starten: Eintrag und Status müssen wiederkommen.
Dann Eintrag ändern und Prozess ohne Beenden abbrechen: Neustart muss den vorherigen Google-Teststand zeigen.
Dann löschen, regulär beenden, neu starten: Eintrag bleibt gelöscht.
Danach denselben getrennten Teststand auf zweitem PC mit demselben Google-Konto prüfen.
Ein etwaiger 403 muss in dieser Ausgabe mit vollständiger Google-Antwort im Log stehen.

## Noch offen vor öffentlichem Ersatz
Windows-Bau und Praxisabnahme; Android-Umsetzung; Google-Kalenderabschluss in einem eigenen Testkalender; bewusste Übernahme des echten bestehenden Archivs beim späteren Produktwechsel; abschließende gemeinsame Versions-/Artefaktfreigabe.
Diese begrenzte Archiv-Testfassung ist noch kein Ersatz der öffentlichen 1.2.

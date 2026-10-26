# SerKal 1.2 – Prüfstand 32 und Übergabe

Stand: 26.10.2026. Auftraggeber: Kurt.

## Status

**32 ist an Kurt zum praktischen Abschlusstest geliefert. Noch keine öffentliche Finalfreigabe.**

Kurt hat die Sammlung weiterer Änderungen abgeschlossen und ausdrücklich die gebündelte 32 angefordert. Der vorherige APK-Stopp ist damit für diesen Prüfstand aufgehoben. Wenn Kurt den Test bestätigt, können Installer- und Website-Chatty mit dem hier benannten Stand weiterarbeiten. Bis dahin keine öffentliche Downloadverlinkung und kein eigenmächtiger Finalbuild.

## Verbindliche Quellstände

| Plattform | Regulärer Abrufstand | Geprüfte Übernahme |
| --- | --- | --- |
| Desktop | serkal-0.0.5-archiv-start | 9c26d8988ff778098d7eb37e2082a819590d4439 |
| Android | android-preview-0.0.5 | bf3c6003d9078b955f67eeb3a6b2f6d761aa5c13 |

Beide enthalten die identische gemeinsame Nummer **32**, technische Version **1.2.0-alpha.32**. Android versionCode **40**. Der gebaute Android-Quellstand ist 23b63af3cab33f6627375ebe81baaa6254612782, anschließend in den regulären Branch übernommen.

Für Kurt bleibt der Desktop-Abruf **git pull**, danach **npm start**. Er aktualisiert zuerst beide PCs und beide Android-Geräte und startet erst danach die Programme. Zuerst PC starten und Google-Abgleich abwarten.

## In 32 enthalten

- Gemeinsame kompakte Android-Fußzeile unter allen drei Spalten: deutsche und britische Flagge als feste Grafik, Hell/Dunkel, Kalender öffnen, Hilfe, freier Zwischenraum, SerKal beenden ganz rechts.
- Bearbeiten in der Mitte nimmt nur seine Textbreite ein. Reset, Suchen und Ins Archiv bleiben unter den Eingabefeldern.
- Der explizite Android-Beenden-Knopf verwendet finishAndRemoveTask(); die Android-Zurück-Taste bleibt eine getrennte Aktion. Bestehende Aufräumlogik beendet Beobachter und Worker beim Zerstören der Activity.
- Reset nach erfolgreicher Aufnahme und Löschung sowie per Reset-Knopf; ausstehende Suchantworten dürfen die geleerte Eingabe nicht wieder füllen. Fokus zum Serientitel. Fehlgeschlagene Speicherung erhält die Eingabe.
- Volle Archivlisten-Höhe weiterhin geprüft.
- Kalender nutzt auf beiden Plattformen den bereits gespeicherten Titel der Kalendersprache, statt immer den Dateinamentitel zu übernehmen. Der entsprechende konkrete Fehler aus VelcroFists Meldung ist im Code reproduziert und korrigiert. Tests prüfen deutsche Dateinamen mit englischen Titelmetadaten und ein Kalenderupdate ohne doppelte Termine.
- Titelauflöser und Wartung für bestehende titleEN/titleDE-Metadaten bleiben vorhanden. Bei alten fehlerhaften Titeln gegebenenfalls einen Wartungslauf in der gewünschten Sprache ausführen. Kein Live-TMDB- oder Nutzerkalender-Abgleich durch CE durchgeführt; keine Behauptung, dass VelcroFists persönliche Altbestände schon geändert wurden.
- Staffelregeln und Versionsschutz aus 30/31 bleiben enthalten. Ein neuer Programmstand kann den älteren gespeicherten Snapshot übernehmen und unter seiner aktuellen Nummer neu übertragen; ein altes Programm darf keinen neueren Archivstand schreiben.

## Prüfungen und Artefakt

Komplette lokale Desktop-Node-Suite bestanden. Android: **67 Tests, 0 Fehler, 0 Fehlschläge**, anschließend erfolgreicher APK-Bau. Darunter gemessene Fußzeile und Archivhöhe bei 1280×800, 960×600, 800×480; Flaggenwahl; Beenden auch während Google-Anmeldung; Reset nach echter lokaler Speicherung; Erhalt der Eingabe bei Ablehnung; Kalender-Sprachtitel.

Lauf: https://github.com/KurtV731/serkal_desktop/actions/runs/40383813910

APK: **032-SerKal-Android-1.2-Alpha32.apk**  
Größe: **2.895.623 Bytes**  
SHA-256: **c2727776302120643116bb6bff583bd2cd8caeb230bbdbe71a0fd19ecdda3c3f**

Mit demselben bisherigen privaten Schlüssel signiert; Signatur geprüft. Keine Schlüsseldateien oder Passwörter im Repository. APK an Kurt direkt bereitgestellt, noch kein öffentlicher Download.

Übertragene Quelländerungen über die GitHub-App zurückgelesen und inhaltlich verglichen. Beide regulären Versionsdateien und relevante Quellen nach den Merges kontrolliert. Keine persönlichen Archiv- oder Kalenderdaten durch CE verändert.

## Praktische Bestätigung durch Kurt

- Neue Fußzeile und Flaggen auf Tablet und Handy sichtbar; Kalender, Hilfe, Bearbeiten und Beenden erreichbar.
- Beenden schließt die Android-Oberfläche und entfernt den Task aus der Übersicht.
- Neue Serienaufnahme leert die Eingabe und setzt den Fokus zum Serientitel.
- Archiv und reguläre Änderungen werden auf allen vier aktualisierten Geräten abgeglichen.
- Bei englischer Nutzung Archiv- und Kalendertitel der gemeldeten Fälle nach Wartung prüfen.

## Nach Kurts ausdrücklicher Freigabe

Installer-Chatty übernimmt den hier genannten Desktop-Fachstand und erstellt/prüft das tatsächliche Windows-Artefakt nach der vorhandenen Versions- und Buildregel. Die technische Prüffassung alpha.32 ist nicht stillschweigend ein bereits gebauter öffentlicher 1.2-Windows-Installer. Für ein neues installierbares Finalartefakt gelten eindeutige Versionsnummer und der abgestimmte gemeinsame Desktop-/Android-Stand.

Website-Chatty verlinkt ausschließlich das vorhandene geprüfte und von Kurt freigegebene öffentliche Artefakt über den bestehenden Downloadweg. Keine Verlinkung auf eine nicht erzeugte Datei. Der gemeinsame Kommunikationsort bleibt 1 docs/schwarzes_brett.md.

Die weiter gewünschten Arbeiten an Wartungsergebnisdarstellung und Systemkartierung sind mit dieser UI-/Beenden-Korrektur nicht als erledigt markiert.

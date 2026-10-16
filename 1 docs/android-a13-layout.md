# Android a13 – kompaktere Oberfläche und Archivsortierung

16.10.2026. Auftrag Kurt: Smartphone-Archiv durch große feste Schaltflächen fast unsichtbar; Statuszeichen wie Desktop rechts; Datumssortierung zusätzlich zu A–Z.

Version 0.0.5a13, versionCode 21, Paket de.serkal.android.preview.v005. Android-Quellzweig android-preview-0.0.5. Desktop bleibt Alpha 17.

Archivkopf enthält nur noch zwei kompakte Knöpfe: Datum ↓ / A–Z und Menü. Menü bietet Jetzt synchronisieren, Archiv neu laden, Wartung, letztes Wartungsergebnis und Log. Archivliste erhält die übrige Höhe. Synchronisationsstatus unten auf zwei sichtbare Zeilen begrenzt; Antippen öffnet vollständigen Text. Eintragszahl kompakt ohne zusätzliche Zeitstempelzeile. Detailbereich unten nur noch eine Zeile mit Ins Archiv und Bearbeiten; Notizen/Offset/Anbieter, Gesehen und Löschen bleiben im Bearbeiten-Menü erreichbar.

Archivzeilen: Titel/Jahr/Staffel links, Datum und Statuszeichen rechts. Grünes Häkchen gesehen, rotes Häkchen ungesehen, Uhr geplant, Punkt laufend, Kreis ohne Termine. Vollständige Statusbedeutung bleibt für Screenreader verfügbar. Rote/grüne Häkchen rechts antippbar zum Umschalten; die Titelzeile öffnet weiterhin die Details.

Sortierung wie Desktop: fehlender Starttermin zuerst; danach aktives Startdatum absteigend, bei gleichem Datum Staffelnummer absteigend und Titel alphabetisch. Aktive DatesDE/Offsets stammen aus dem vorhandenen Archivcodec. A–Z verwendet den lokalisierten Titel mit Jahr und Staffel. Auswahl wird lokal gespeichert und übersteht Neustart, Sprach-/Themenwechsel und Zoom-Neuaufbau. Vorgabe Datum.

Zusätzliche Archivsortierungstests prüfen fehlende Daten, Reihenfolge, Staffelgleichstand, lokalisierten Titel, unveränderte Eingabeliste sowie die fünf Statuszustände. Das visuelle Verhalten auf Pixel/Samsung muss Kurt praktisch bestätigen; hier kein Android-Emulator verfügbar.

Testfolge: a13 über a12 installieren, nicht deinstallieren. Querformat öffnen; Archivliste muss sichtbar und scrollbar bleiben. Datum/A–Z mehrfach wechseln, App neu starten und Auswahl prüfen. Titel links und Datum/Häkchen rechts kontrollieren. Menüfunktionen Wartung/Ergebnis/Log erreichbar prüfen. Eine ungesehene Staffel rechts als gesehen markieren; Speicherung lokal und dann bei Google abwarten. Desktop nach Synchronisation muss denselben seen-Wert zeigen. Bestehende Such-/Archiv-/Kalender- und Synchronisationslogik ist unverändert.

## Verifikation und Auslieferung

Quellcommit a37dcc24928e6a7c18a742749d3ca2c54d214dae. GitHub Actions 38936898389: Build erfolgreich, 27 JUnit-Tests, 0 Fehler und 0 Fehlschläge. APK-Signatur v2/v3 erfolgreich geprüft; gleicher Signierer wie a8/a12. Tatsächliches Manifest: Version 0.0.5a13, Code 21, stabile Paketkennung. Größe 2871047 Bytes; SHA256 e8263945c6b533844dca7e923c4becf78dbdb6b29e0214ed61ca2783c3f4ebd6. Installierbare APK an Kurt ausgeliefert. Keine Website-/Play-Store-Freigabe; realer Smartphone-/Tablet-Layouttest bleibt offen.

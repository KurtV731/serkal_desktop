# Wartung: nur verfolgter Staffelbereich und Änderungen

17.10.2026. Kurts Klarstellung: SerKal ist ein Kalender-Eingabetool, kein vollständiges Serienlexikon. Beispiel: Archiv enthält S07 und S09; S08 darf als Lücke gemeldet werden, S01–S06 nicht. Neue S10 bleibt relevant.

Desktop Alpha 20 und Android a14 (Code 22): Untergrenze ist die kleinste positive reguläre Staffelnummer im eigenen Archiv je TMDB-ID. Nur ab dort bis zur aktuellen TMDB-Staffelzahl wird auf fehlende Staffeln geprüft. Bereits archivierte Staffeln bleiben weiterhin prüfbar. Vor diesem persönlichen Einstieg wird nicht nachgefragt, nichts automatisch nachgetragen und kein älterer Bestand angelegt. Wenn ältere Staffeln ausdrücklich im eigenen Archiv stehen, gehören sie entsprechend zum verfolgten Bereich. Specials S00 begründen keinen Einstieg bei Staffel 0.

Diese Grenze gilt bei Desktop-Datenabruf, Analyse und Berichterstellung sowie beim Android-Datenabruf/Bericht. Daher tauchen S01–S06 auch aus einem alten Desktop-TMDB-Cache nicht wieder auf. Bereits bekannte unveränderte zukünftige Episoden werden nicht erneut aufgezählt. Fehlende Staffel erscheint als eine Staffelzeile; nicht zusätzlich jede ihrer Episoden. Neue Episoden und geänderte Termine bereits geführter Staffeln bleiben im Bericht. Titelkorrekturen aus Alpha 19 bleiben erhalten.

Die automatische Gesamtübersicht aller Streaming-Anbieter wurde aus beiden Ergebnisanzeigen entfernt. Die eigentlichen Anbieterangaben werden weiterhin aktualisiert und beim jeweiligen Archiveintrag angezeigt; die Ergebnisliste enthält dafür nur einen kurzen Hinweis. Vorhandene historische letzte Berichte werden nicht rückwirkend umgeschrieben; für die neue Liste einen neuen Wartungslauf ausführen.

Tests: Desktop-Bericht gegen einen Alt-Cache S01–S10 mit Archiv S07/S09 meldet ausschließlich S08/S10, unveränderte zukünftige Episoden schweigen. Desktop-Analyse bei TMDB S09 meldet ausschließlich S08. Android-Test prüft zusätzlich die tatsächlich angefragten Staffeln: ausschließlich 7, 8, 9 und eine einzige Berichtszeile für S08. Keine Archivbestände oder Notizen gelöscht; Einschränkung betrifft automatische Abfragen und Meldungen.

Desktop: 27 Testprogramme bestanden; nach Ergänzung des direkten Analysefalls Wartungs-Smoke erneut bestanden. Vier Inline-Skripte syntaktisch geprüft. Android-Build/Signatur und APK-Prüfung werden in der zentralen Übergabe ergänzt. Bestehender Installer Alpha 17.1 bleibt unverändert; kein neuer Windows-Installer in diesem Schritt.

## Fertige Testartefakte

CE-Commit f4dd59080753c6832b5c49fc915c7240b4e89e04, Android-Commit 989fdd8e6855cddee61525e40139b6409003701b. Android Actions 39008008178: Build erfolgreich, 28 Tests, 0 Fehler/Fehlschläge. Signatur v2/v3 geprüft, gleicher Signierer wie a13. Tatsächliche Paketkennung de.serkal.android.preview.v005, Version 0.0.5a14, Code 22. APK 2871047 Bytes, SHA256 8279944acad6dc8d10dd82f7bfe940a50d5d3de4df093e539a012d6e4078d335. Installierbare APK an Kurt bereitgestellt. Über a13 installieren; danach Wartung erneut ausführen. Praktischer Gerätetest der kürzeren Liste noch offen. Kein neuer Windows-Installer gebaut; CE-Test über git pull und npm start.

# Desktop Alpha 22: gemeinsames Menü und passende Dialogfarben

Auftrag Kurt vom 17.10.2026: Desktop wie Android mit einem Menü statt vieler Knöpfe; Löschen eingeschlossen. Menü und Dialoge sollen die eingestellte helle oder dunkle Darstellung übernehmen.

## Umsetzung

- Archivkopf: Sortierknopf, Menü und Anzahl. Einzelknöpfe Synchronisieren, Neu laden und Löschen in das Menü verschoben.
- Menü: Änderungen speichern, jetzt synchronisieren, Archiv neu laden, Wartung, letztes Wartungsergebnis, Log, Kalender öffnen, TMDB/Google, Hell/Dunkel, Serie löschen.
- Bestehende tatsächliche Knöpfe und IDs versetzt: gleiche Ereignisbehandlung, Sperrzustände und vorhandene Löschbestätigung. Keine zweite Fachlogik und keine neue Löschfunktion.
- Menü schließt vor Ausführung der gewählten Aktion. Escape und Schließen möglich. Native modale Tastaturführung und Rückkehr zum Menüknopf.
- Sprachwahl, Speicherlampe und Änderungsstatus bleiben direkt sichtbar. Menüknopf wird bei ungespeicherten Änderungen hervorgehoben; Speichern befindet sich ganz oben im Menü.
- Gemeinsame Dialogfarben: warme helle Flächen bzw. dunkle Flächen mit heller Schrift, abgesetzte Ränder, lesbare Knöpfe und Fokusmarkierung. Gilt auch für Wartungsergebnis, Länderabfrage und eigene SerKal-Mitteilungen/Kalendereinrichtung. Externe Google-/Windows-Fenster werden nicht umgestaltet. Druck bleibt ein normales weißes Blatt.
- DE/EN-Beschriftung einschließlich Menü, letztem Wartungsergebnis und Darstellungsschalter.

## Prüfung / Übergabe

28 bestehende Desktop-Testprogramme bestanden; fünf Inline-Skripte syntaktisch geprüft, alle versetzten Aktions-IDs weiterhin eindeutig vorhanden. Echter Windows-Sicht- und Tastaturtest offen; hier kein laufender Browser verfügbar. Keine neue APK, kein Windows-Installer, kein öffentlicher Release.

Kurt: Desktop schließen, im CE-Zweig git pull, npm start. Alpha 22 prüfen. Menü öffnen, Schließen/Escape, Sprache und Hell/Dunkel wechseln. Ohne ausgewählte Serie bleibt Löschen wie bisher gesperrt. Mit Serie führt Menü → Löschen zuerst zur bestehenden Bestätigung; zum Prüfen dort abbrechen. Ungespeicherte Änderung muss sichtbar bleiben und über Menü → Speichern erreichbar sein.

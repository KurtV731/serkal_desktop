# Übergabe an Installer3 · SerKal Android 1.2.8

- Ziel: bestehender geschlossener Alpha-Test. Version 1.2.8, Code 52, Paket `de.serkal.android.preview.v005`, Archivformat 38.
- Änderung: veraltete direkte Farbaufrufe über den AndroidX-Helfer aus dem App-Pfad entfernt. Vollbild berücksichtigt sichtbare Systemleisten, Tastatur und Displayaussparungen. Nach dem Ausblenden steht die Fläche wieder zur Verfügung.
- CI: `Test and build SerKal Android App Bundle` baut das unsignierte AAB. Der Display-Workflow prüft Android 15 und 16, insbesondere Ein- und Ausblenden der Systemleisten sowie die Tastatur. Ergebnisse vor der Freigabe prüfen.
- Nur das erfolgreiche CI-Artefakt `SerKal-Android-1.2.8-code52-unsigned-aab` des Quellcommits verwenden. SHA-256 mit der mitgelieferten Datei vergleichen. Mit dem bisherigen Upload-Schlüssel signieren und in der vorhandenen Alpha-Spur einreichen. Testergruppe und Beitrittslink beibehalten.
- In der Play Console die Warnung zur randlosen Anzeige für Code 52 separat prüfen. Bibliothekscode kann weiterhin alte APIs enthalten. Das Ausbleiben der Warnung ist erst nach der Prüfung durch Google bestätigt.
- Kurt verschickt die Einladung selbst, sobald 1.2.8 im Alpha-Test verfügbar ist.

## Release-Text

DE: Vollbild nutzt wieder die freie Fläche, wenn die Android-Leisten ausgeblendet sind. Die Oberfläche berücksichtigt eingeblendete Leisten und die Bildschirmtastatur.

EN: Full-screen mode reclaims space when Android system bars are hidden. The layout adjusts to visible system bars and the on-screen keyboard.

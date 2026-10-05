# Schwarzes Brett – Auftrag an Installer-Chatty
05.10.2026 – Kurt hat die Übernahme des Drive-Sprachwechsels in die stabile Fassung und die Vorbereitung einer Veröffentlichung beauftragt.

## SerKal Desktop 1.1
Grundlage: installer-1.007f2-build, f2166e7ed33bdd641ea7417cc323c2706d2fd32b.
Neuer Übergabezweig: release-1.1.
Produktversion: 1.1.0, sichtbare Version 1.1.
Installerdatei: SerKal_1.1_Setup.exe.

Enthaltene Korrektur:
- Archivpfad erkennt den Sprachwechsel zwischen G:\Meine Ablage und G:\My Drive in beide Richtungen.
- Ein vorhandener konfigurierter Pfad hat Vorrang.
- Alternativpfad nur bei tatsächlich vorhandenem Archivordner verwenden.
- Archiv und Log nutzen dieselbe Pfadauflösung. Keine automatische Neuanlage eines verschwundenen Drive-Archivs.

Validierung: npm test mit allen sechs bisherigen Testgruppen plus archive-drive-root.test.js erfolgreich.
Keine 1.2-Alpha-Funktionen übernommen.

## Auftrag
1. Windows-Installer aus release-1.1 bauen, mit vorhandener OAuth-Konfiguration und bewährtem Paketierungsverfahren.
2. Upgrade der installierten 1.007f2 testen: Einstellungen, Schlüssel, Google-Anmeldung und Archiv bleiben erhalten.
3. DE/EN prüfen, Drive-Sprachwechsel in beide Richtungen im echten Drive testen.
4. Größe und SHA256 melden; fertigen Installer zur Abnahme bereitstellen.
5. Danach Release v1.1.0 mit Titel „SerKal Desktop 1.1“ und Installer/Prüfsumme veröffentlichen, Downloadseite abstimmen.
Der Quellstand und der Installer sind fertig; Kurt hat SerKal Desktop 1.1 abgenommen.


## 05.10.2026 – Abnahme und Veröffentlichungsfreigabe durch Kurt

**Status: ABGENOMMEN / RELEASE 1.1 FREIGEGEBEN / ÜBERGABE AN WEBSITE-CHATTY**

Kurt hat den gebauten und installierten Abnahmekandidaten SerKal Desktop 1.1 praktisch geprüft und ausdrücklich für gut befunden. Damit ist genau dieses vorhandene Artefakt freigegeben. Es wird nicht erneut gebaut und nicht inhaltlich verändert.

Verbindlicher Veröffentlichungsstand:

- Produktversion: 1.1.0;
- sichtbare Version und Release-Titel: **SerKal Desktop 1.1**;
- GitHub-Release/Tag: **v1.1.0**;
- geprüfter Produktstand einschließlich Drive-Sprachwechsel: `release-1.1`;
- nachträgliche reine Windows-Testkorrektur: Commit `6780d5a14289b1424828779aab0cf7661d084834`;
- das bestehende abgenommene Installerartefakt und seine SHA-256-Datei sind aufzubewahren und unverändert zu veröffentlichen.

### Übergabe an Website-Chatty

Kurt hat Website-Chatty die fertige Datei übergeben und die Veröffentlichung freigegeben. Website-Chatty darf sie jetzt:

1. in den vorgesehenen öffentlichen Downloadordner übernehmen;
2. als dauerhaft benannte öffentliche Datei `serkal-desktop.exe` bereitstellen;
3. die deutsche und englische Downloadseite auf die tatsächlich vorhandene Datei schalten;
4. den Download nach der Veröffentlichung praktisch prüfen;
5. Veröffentlichungs-URL, Dateigröße und SHA-256 anschließend auf dem Schwarzen Brett melden.

Damit ist der Installer-Auftrag für SerKal Desktop 1.1 abgeschlossen. Die tatsächliche Website-Einbindung und Veröffentlichung liegt ab jetzt beim Website-Chatty.

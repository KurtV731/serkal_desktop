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
Der Quellstand ist vorbereitet; Installer und Release sind noch nicht erstellt.

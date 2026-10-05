# Archivpfad nach Sprachwechsel – 05.10.2026

Kurt meldete einen fehlenden Archivordner: gespeichert war `G:\Meine Ablage\Serkal_Haupt\Serkal-Archivdaten`, das lokale Google-Drive-Laufwerk verwendete nach dem Sprachwechsel jedoch `My Drive`.

Die zentrale Archivpfad-Ermittlung prüft nun bei einem fehlenden konfigurierten Windows-Pfad den gleichen Unterordner unter dem jeweils anderen Drive-Wurzelnamen (`Meine Ablage` / `My Drive`). Nur ein existierendes Verzeichnis wird verwendet. Ein vorhandener konfigurierter Pfad hat Vorrang. Es werden keine Ordner angelegt, keine Dateien verschoben und keine Einstellungen überschrieben. Andere Laufwerksbuchstaben oder weitere Sprachen werden damit nicht automatisch erkannt.

Prüfung: `node "6 tests/archive-drive-root.test.js"` prüft beide Richtungen, den zentralen Zugriff, Vorrang bestehender Pfade, fehlende Verzeichnisse, Unterordner mit ähnlichem Namen und Ablehnung einer Datei als Archivverzeichnis. Zusätzlich die vorhandene Testsuite ausführen. Der Test simuliert Windows-Dateisystemantworten; Kurts echtes Drive-Laufwerk ist hier nicht erreichbar.

# Android a20 – Kalender und TMDB direkt öffnen
Stand: 22.10.2026. Quelle: 7173d8e518fbe98e7d5588c322c8e50207e91b9d. Testfassung, keine öffentliche Freigabe.

## Bedienung
- „Kalender öffnen“ unten in der Archivspalte. Öffnet Google Kalender über den Android-Linkhandler. Gespeicherte Kalender-ID wird ausgewählt, angemeldetes SerKal-Konto als authuser übergeben; ohne bekannte ID normale Kalenderansicht. Android entscheidet zwischen Browser/geeigneter App, eine dort nötige Google-Anmeldung bleibt möglich.
- Unter dem ausgewählten Serientitel steht „TMDB #Nummer ↗“, sowohl bei Suchtreffern als auch bei Archiveinträgen.
- Antippen öffnet Auswahl: Serie auf TMDB öffnen, Staffel öffnen (1–999 frei wählbar), Serienlink teilen.
- Für Ahsoka S02: Ahsoka auswählen, TMDB-Zeile antippen, „Staffel öffnen“, 2 eingeben. Funktioniert auch wenn nur S01 archiviert ist.
- Langes Drücken der TMDB-Zeile kopiert die numerische ID.
- Teilen öffnet die Android-Auswahl. Es wird nur ein öffentlicher Serienlink vorbereitet; Nutzer wählt selbst Empfänger/App und sendet.
- Eine neue Suche leert die alte Referenz sofort, damit kein veralteter Serienlink sichtbar bleibt.
- Links folgen DE/EN. Keine zusätzlichen Google-Rechte, keine Änderung an Archiv oder Kalender durch das Öffnen. Kein Google-/TMDB-Token im geteilten Link.

## Prüfung und Lieferung
Actions 39854180671 erfolgreich. 39 JUnit-Tests, null Fehler/Fehlschläge, darunter Serien-/Staffelzuordnung, Sprachcode, sichere Kodierung von Kalender-ID und Konto, Kalenderstart ohne vorhandene ID und ungültige Staffelnummer.
Sechs geänderte Dateien identisch von GitHub zurückgelesen.
Version 0.0.5a20, versionCode28, Paket de.serkal.android.preview.v005; mit ursprünglichem Schlüssel signiert, V2/V3-Verifikation und Zertifikatsfingerabdruck geprüft.
APK 0.0.5a20-serkal-android.apk, 2883335 Bytes, SHA256 8fae9cef908be730f3322e666eb30c65582f4590a65b4fc5cd099b9c26daa3ce.
Dauerhafte Datei-ID: libfile_d63b6d7f98188191865c6a3d11d0a3d7.

## Geräteabnahme durch Kurt
Über a19 installieren, nicht deinstallieren. Kalender öffnen: richtiges Konto und SerKal-Kalender prüfen. Ahsoka aus Archiv und Suchergebnis wählen: ID sichtbar, Serie/Staffel2 öffnen, Nummer kopieren, Teilen-Auswahl probeweise öffnen/abbrechen. Rückkehr zu SerKal, DE/EN, Pixel/Samsung und Platz in der Archivspalte prüfen. Browser-/Kalender-App-Verhalten und Teilen wurden hier nicht auf einem Androidgerät ausgeführt.
Die erfolgreiche technische Prüfung ist keine vollständige Freigabe der übrigen Public-Checkliste.

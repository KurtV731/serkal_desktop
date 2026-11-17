# Android Play-Test 1.2.6 / Code50 – Edge-to-Edge-Ersatz

Kurt hat ausdrücklich einen Ersatz unter derselben Version 1.2.6 und versionCode 50 beauftragt. Die bisherige AAB mit SHA256 14ddfe923a76a9cc608954d7e9ea9b27187de67ea4965ba09a924bfa68ad5f56 bleibt erhalten und darf nicht hochgeladen werden.

## Darstellung

- MainActivity verwendet WindowCompat.enableEdgeToEdge und WindowInsetsControllerCompat. Direkte Aufrufe von setStatusBarColor, setNavigationBarColor und die alten System-UI-Flags entfallen; ebenso die Farbvorgaben im Theme.
- Inhaltsränder berücksichtigen stabile Systemleisten und Displayaussparungen sowie die tatsächlich sichtbare Bildschirmtastatur. Wiederholte Insets-Anwendung addiert keine Ränder. Transiente Leisten überdecken keine Bedienelemente.
- Manifest: resizeableActivity=true, Orientierung unspecified. Auf normalen Telefonen bevorzugt die Laufzeit weiterhin SENSOR_LANDSCAPE; ab 600 dp kleinster Bildschirmbreite und im Mehrfenstermodus bleibt die Orientierung frei. Keine Android16-Kompatibilitätsausnahme.
- Breite Fenster behalten drei Spalten. Unter 700 dp beziehungsweise schmalem Hochkantfenster unter 840 dp werden Suche, Eintrag und Archiv über Reiter angezeigt. Header und Fußleiste sind bei knapper Breite horizontal erreichbar. Größe/Orientierung werden ohne Neuaufbau der Sitzung verarbeitet; Suche und Auswahl bleiben erhalten.
- API36-Toolchain: AGP8.10.1, Gradle8.11.1, AndroidXCore1.17.0. Release weiter unsigniert. Debug-Signatur ausschließlich für ausdrücklich angeforderte Gerätetests.

## Erhaltene Funktion

Die Google-/TMDB-Einrichtung, verschlüsselte Schlüsselablage und Kalenderstabilisierung aus dem vorherigen Code50-Stand bleiben erhalten. Paket de.serkal.android.preview.v005, gemeinsamer Archivstand38, compile/target36 bleiben unverändert. Keine Desktop- oder Website-APK-Veröffentlichung.

## Grenzen

Emulatortests prüfen Darstellung und Sitzungszustand ohne echtes Google-Konto. Sie ersetzen keine reale Google-/TMDB-/Archivabnahme auf Pixel und Samsung. Bekannte Launcher-, Wegwisch- und Anmelde-Restpunkte sind damit nicht pauschal behoben. Die Android-Systemhinweise zur Vollbildbedienung werden nur im Testgerät vorab bestätigt.

## Exakter Ersatzbau

- Anwendungsstand: `d3009c859efd19c60e613e86e6c0356455793f99`; abschließender Test-/Bauquellstand: `2043721004a6bbba4faf1454a366c1c9e9d90608`, Branch `ce-play-edge50`.
- [Regression und Releasebau](https://github.com/KurtV731/serkal_desktop/actions/runs/44100663424): 96 Tests, null Fehler, null übersprungen.
- Unsigned AAB: `SerKal-Android-1.2.6-code50-edge-unsigned.aab`, **2496084 Bytes**.
- SHA256: `4edd860ea8d1c9bee3133d0809f552ace9a71aa4994e9aec5f8361a6759d2d20`.
- CI-Artefakt `SerKal-Android-1.2.6-code50-unsigned-aab`, ID14336696122; zusätzlicher Sicherungscommit `022b24f52f46a0bbefd6b57312643b702d88a73c` unter play-build-output/.
- CE: CI-Hash verglichen; ZIP vollständig geprüft (141 Einträge, keine Fehler); binäres AAB-Manifest ausgelesen: Paket de.serkal.android.preview.v005, Version1.2.6, Code50, resizeableActivity=true, screenOrientation=unspecified. Keine JAR-Signatur im Release vorhanden.

## Übergabe

Alte AAB und altes Signierpaket weiterhin aufbewahren, aber nicht verwenden. Installer erstellt den Signierstarter ausschließlich für den neuen Eingabehash und obigen Quellstand neu. Alias serkal-preview und bekanntes Uploadzertifikat unverändert; nach Signierung Signatur, Zertifikat, unveränderte Nutzdaten und neuen signierten Hash nachweisen. Play-App-Signierfingerabdruck für OAuth bleibt getrennt. Kein CE-Upload. Die bisherige Code50-Freigabe einschließlich altem Signierpaket ist durch diesen Ersatz aufgehoben.

## Native Darstellungsprüfung – bestanden

[Gerätelauf](https://github.com/KurtV731/serkal_desktop/actions/runs/44100663551), Quellstand2043721004a6bbba4faf1454a366c1c9e9d90608:

- Android15 / API35 / Pixel7-Emulator: Job134099481342 erfolgreich, Instrumentation OK(1test), Artefakt14335344801.
- Android16 / API36 / PixelTablet-Emulator: Job134099481969 erfolgreich, Instrumentation OK(1test), Artefakt14336496381.
- Geprüft: echte Systemleisten-Insets, sichtbare untere Leiste, native Größenänderung per WindowManager auf1200x1800, erhaltene Sucheingabe, Panelabmessungen innerhalb der neuen Breite und tatsächlich geöffnete Bildschirmtastatur mit korrektem unterem Inhaltsrand.
- Robolectric ergänzt Telefon-Querformat760/900dp, Tablet-Hochkant800x1280dp, Querformat1280x800dp, schmales Fenster400x600dp, Reiterwechsel ohne Eingabeverlust sowie idempotente Systemleisten-/Aussparungs-/IME-Ränder.
- CE hat die stabilen Bildschirmaufnahmen nach Neuzeichnen angesehen: breite Dreispaltenansicht, kompakte Reiteransicht und untere Leiste oberhalb der Tastatur. Ein früherer Screenshot erfasste nur ein unvollständiges Übergangsbild; der Test wartet nun auf fertige Frames und überprüft zusätzlich die Panelgrenzen. Keine App-Codeänderung dafür.
- Der zweite Releasebau ist bytegleich mit dem ersten Ersatzbau. Keine echte Google-Anmeldung oder reale Kalenderübertragung in diesen Darstellungstests.
- Ersatzdatei separat bereitgestellt: [SerKal-Android-1.2.6-code50-edge-unsigned.aab](https://chatgpt.com/library?file_id=libfile_a6933fc0c61c819189ebdd2250b605a4&account_id=personal). Die alte Datei ist weiterhin vorhanden.

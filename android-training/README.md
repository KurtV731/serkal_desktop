# SerKal Android Training

Diese bewusst kleine App dient ausschließlich dazu, Kurts ersten Android-Ablauf zu üben:

1. APK auf dem Pixel 8 herunterladen und installieren.
2. Sprache Deutsch/Englisch umschalten.
3. Einen frei gewählten Serientitel als Übungseintrag speichern.
4. App vollständig schließen und erneut öffnen; der Eintrag muss erhalten bleiben.
5. Später Version 0.0.2 darüber installieren; der Eintrag muss erneut erhalten bleiben.

## Technische Abgrenzung

- Paketkennung: `de.serkal.android.training`
- Mindestversion: Android 8 (API 26)
- Zielversion: Android 15 / API 35
- Keine Netzwerk-, TMDB-, Kalender- oder Dateiberechtigung
- Keine Verbindung zur veröffentlichten Windows-Fassung
- Der mitgelieferte Signaturschlüssel ist ausschließlich für die öffentliche, wertlose
  Trainings-App bestimmt. Die spätere echte SerKal-Android-App erhält eine andere
  Paketkennung und einen privaten Veröffentlichungsschlüssel.
- SHA-256-Fingerabdruck des Trainingszertifikats:
  `32:D2:08:07:54:CA:4B:A1:46:E7:2B:C0:55:31:93:E6:14:09:23:5C:75:8B:F4:9F:7E:1B:2E:E3:5C:4B:ED:3E`

## Lokaler Build

Mit installiertem Android SDK 35 und Gradle 8.10.2:

```text
cd android-training
gradle assembleDebug
```

Die APK entsteht unter `app/build/outputs/apk/debug/app-debug.apk`.

## Automatischer GitHub-Build

Der Workflow `SerKal Android Training APK` baut die APK bei Änderungen auf dem
Trainingsbranch und stellt sie als herunterladbares Artefakt bereit.

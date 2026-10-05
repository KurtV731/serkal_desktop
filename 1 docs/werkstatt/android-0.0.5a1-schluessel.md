# Android 0.0.5a1 und Desktop 1.2 Alpha 02 – gemeinsamer TMDB-Schlüssel
05.10.2026

## Implementiert
- Android nutzt Google AuthorizationClient (Play Services), prüft Konto über Googles Userinfo-Endpunkt und übernimmt den Schlüssel aus appDataFolder.
- Desktop-Schaltfläche „TMDB · Google“ veröffentlicht den vorhandenen Schlüssel oder übernimmt einen vorhandenen gemeinsamen Schlüssel. Auch im Ersteinrichtungsdialog verfügbar.
- Extra Google-Zustimmung für drive.appdata, openid und userinfo.email. Kalenderberechtigungen und Kalendertoken bleiben getrennt.
- Beide Clients verwenden serkal-tmdb-key-v1.json, schema=1, owner=Google-sub, apiKey=TMDB-Zugang.
- Vor Übernahme oder Veröffentlichung echte TMDB-Prüfung.
- Unveränderliche Konfigurationsdateien: identische Mehrfacheinträge werden zusammengefasst; unterschiedliche Schlüssel ergeben einen Konflikt und werden nicht überschrieben.
- Android speichert bestätigte Schlüssel lokal verschlüsselt mit Android Keystore, gebunden an die verifizierte Konto-ID. Keine Google-Tokens im APK und keine Refresh-Tokens auf Android.
- Der gemeinsame Konfigurationsinhalt enthält den TMDB-Schlüssel im privaten Google-App-Datenbereich. Dies ist kein Ende-zu-Ende-Verschlüsselungsverfahren.
- PC fragt vor dem ersten Bereitstellen nach dem angezeigten Konto. Automatische Starts öffnen keine neue Desktop-Anmeldung.
- Desktop unterstützt API-Key und TMDB-Lesezugriffstoken.
- Neue APK-Kennung de.serkal.android.preview.v005, Version 0.0.5a1, versionCode 9, mindestens Android 7.
- Debug-Testsignatur wird über GitHub-Actions-Cache wiederverwendet. Keine Produktionssignatur; bei Cacheverlust muss der neue Fingerabdruck registriert werden.

## Google-Konfiguration vor Live-Abnahme
Im selben Google-Cloud-Projekt wie der SerKal-Desktop-OAuth-Client:
1. Google Drive API aktivieren.
2. Android-OAuth-Client mit Paketkennung de.serkal.android.preview.v005 und SHA-1 aus signing-report.txt dieser APK anlegen.
3. Zusätzlichen App-Daten-Zugriff und Identitätsberechtigungen in der OAuth-Konfiguration erlauben. Bestehende Kalender-Prüfung nicht blind neu einreichen.
Ein zusätzlicher Web-OAuth-Client oder Client-Secret im APK ist für diesen direkten Client-Zugriff nicht nötig.

## Kurts Testreihenfolge
1. Desktop im Entwicklungszweig serkal-0.0.5-archiv-start aktualisieren und starten. Kopfzeile 1.2 Alpha 02.
2. „TMDB · Google“ drücken, Konto auswählen, Zugriff erlauben, Bereitstellen für das angezeigte Konto bestätigen.
3. 0.0.5a1-APK installieren; eigene App-Kennung, bisherige Vorschau kann bleiben.
4. Dasselbe Google-Konto auswählen; Schlüssel muss automatisch übernommen werden. Suche Yellowstone/Reacher/asiatischer Titel und DE/EN prüfen.
5. App beenden und erneut starten; keine erneute Schlüsseleingabe.
6. Samsung mit demselben Konto: gleiche Übernahme.
7. Zweiter PC: gleicher Schlüssel wird übernommen. Bei einer neuen Desktop-Ersteinrichtung „TMDB · Google“ im Assistenten verwenden.
8. Anderes Konto: kein fremder Schlüssel. Unterschiedliche Schlüssel im selben Konto: Konfliktmeldung, kein Überschreiben.
9. In einem separaten Testkonto umgekehrt starten: Schlüssel zuerst Android über API-Key einfügen und Bereitstellen bestätigen; PC übernimmt ihn anschließend.

## Grenzen
- Noch kein gemeinsamer Archiv-/Kalenderzugriff auf Android; Eintragen weiter deaktiviert.
- Schlüsselrotation/gezielte Auflösung unterschiedlicher Schlüssel noch nicht implementiert.
- Offline-Start derzeit keine automatische Google-Übernahme; manuelle TMDB-Suche bleibt möglich.
- Geräteübergreifender Live-Test erst nach der Google-Registrierung. Build-/Fixture-Tests beweisen weder die Freischaltung des Google-Projekts noch den Zugriff auf Kurts Konto.
- APIs: https://developer.android.com/identity/authorization ; https://developers.google.com/workspace/drive/api/guides/appdata

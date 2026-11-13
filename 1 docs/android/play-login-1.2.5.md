# Android 1.2.5 – interner Play-Test

Ausgang: veröffentlichter Funktionsstand 1.2.4 (`aad44b929401d3c85c7bb9ec43405208249f53bb`), Installer-Bundlezweig. API 36 wie Code 48; neuer Versionsname 1.2.5, Code 49. Gemeinsames Archivformat/Release 38 bleibt kompatibel. Paketname unverändert. Keine neuen Google-Scopes.

## Enthalten

- Vor erster Google-Verbindung DE/EN-Erklärung von Drive-App-Daten, TMDB-Schlüssel, Kalenderliste, von SerKal angelegten Kalendern und Kontozuordnung. Weiter/Später/Datenschutz. Zustimmung zur Erläuterung ist keine Ersatz-Zustimmung zu Google-Scopes.
- Datenschutz ohne Anmeldung aus Hilfe und Willkommensdialog erreichbar.
- Lokales, im bestehenden Menü-Log sichtbares Login-Protokoll, auch bevor ein Archiv existiert: Version/Code, Android-Version und Gerätemodell, Zeitpunkt, Versuch, Schritt, Laufzeit. SDK-Fehler mit Statuscode; Rückgaben, Abbrüche, Task-Cancellation, Activity-Ende, Start nach unterbrochenem Versuch.
- Diagnoseereignisse enthalten keine Kontoadresse, Kontokennung, Schlüssel, Tokens oder Archivdaten. Bestehende HTTP-Fehlerprotokollierung bleibt erhalten und filtert bekannte Tokenfelder/Bearer. Diagnose wird bei 256 KiB rotiert (eine Vorgängerdatei). Keine automatische Übermittlung.
- Zeitlimit: SDK-Anfrage 45 s; Konto-/Berechtigungsdialog 120 s; nach Rückgabe 60 s für Identität/Drive-Schlüssel/TMDB-Prüfung. Timeout protokolliert, beendet den gestarteten Ergebnisdialog und verwirft verspätete Rückgaben. Bestehendes Archiv wird dabei nicht überschrieben.
- Nach Prozess-/Activity-Unterbrechung Hinweis und manuelle Wiederholung über Menü statt sofortiger automatischer Schleife.

## Nicht als bewiesen behaupten

Der beim Samsung A54 gemeldete Hänger nach Google-Zustimmung ist noch nicht auf einem realen betroffenen Gerät reproduziert und nicht als ursächlich repariert bestätigt. Der frühere fehlende Play-SHA-1 war ein separater, bereits korrigierter Konfigurationsfehler.

## Abnahme nach privater Signatur und Upload

1. Über bestehenden internen Play-Test updaten (keine Deinstallation/Archivlöschung).
2. Beim ersten Start Erläuterung DE/EN, Später und Datenschutz prüfen; Datenschutz auch über Hilfe ohne Anmeldung öffnen.
3. Anmeldung auf Kurt-Pixel und Samsung A54: vorhandenes sowie neues Konto testen. Erfolg, Abbruch, ausgebliebene Rückmeldung prüfen.
4. Unter Menü > Log die letzten Login-Ereignisse ablesen/kopieren. Vor Weitergabe vorhandene HTTP-/Archivlogs auf persönliche Inhalte prüfen.
5. Archiv laden, Suche und normales Beenden/Speichern testen. Keine Erfolgsgarantie aus Emulator-/Unit-Tests ableiten.

Die unsignierte AAB ist noch kein hochladbares Play-Artefakt. Privaten bestehenden Uploadschlüssel/Alias `serkal-preview` auf Kurts PC verwenden; Signatur und SHA-256 der fertigen Datei prüfen.

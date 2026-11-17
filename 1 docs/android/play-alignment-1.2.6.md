# Android-Play-Test 1.2.6 / Code 50 – Angleichung an Desktop 1.2.6

Kurt legt für die Angleichung ausschließlich die Android-Testfassung aus Google Play als Referenz fest. Keine Umstellung des öffentlichen Website-APK-Downloads als Vorbedingung. Anwendungs-/Testquelle `b29d4c4350019bbb9dc95b21290f8c699a4f97d8`, Branch `ce-play-alignment-1.2.6`, Basis Android 1.2.5/Code49 `d8f22dc08cb2b68b66d498882639405d204386c8`. Vergleich: Desktop 1.2.6 `07903512a7ac2de4521182ec8b9a89e4cb030a86`.

| Bereich | Android-Testfassung 1.2.6 |
| --- | --- |
| Google-Erklärung DE/EN vor Anmeldung | Vorhandene Erklärung zu Drive-App-Daten, Kalenderrechten, Konto-Zuordnung, Datenschutz, Weiter/Später erhalten |
| Google-Rechteprüfung | App-Daten sowie beide benötigten Kalenderrechte vor Fortsetzung prüfen; bei fehlenden Rechten verständlicher Hinweis auf Menü > Google-Konto |
| Google-Protokoll und Wartebegrenzungen | Vorhandenes lokales Anmeldeprotokoll und begrenzte Versuche aus Code49 erhalten; keine behauptete Lösung der noch ungeklärten Samsung-Anmeldeschleife |
| TMDB-Einrichtung | Erklärung zu Serien-/Staffel-/Folgendaten, persönlichem API-Key oder Lesezugriffstoken; ausdrücklich kein Google-Passwort; direkte TMDB-Schlüsselanforderung und DE/EN-SerKal-TMDB-Hilfe |
| TMDB-Prüfung | Leere Eingabe sichtbar markieren; abgewiesene/nicht prüfbare Eingabe im offenen Dialog korrigieren; bisher funktionierenden Schlüssel erst nach erfolgreicher Prüfung ersetzen |
| Schlüssel erhalten | Nach gültiger Eingabe im bestehenden kontogebundenen verschlüsselten Cache speichern, bevor eine optionale Google-Bereitstellung bestätigt wird; kein neuer Paketname/Cache-Alias und keine Deinstallation als Updateweg |
| Kalender-Schreiblast | Sequentiell, mindestens 250 ms Abstand; nach 20 erfolgreichen Schreibaktionen zwei Sekunden Pause; reine Leseanfragen zählen nicht zu den 20 |
| Google-Begrenzung | Passende 403-Rate-Limit-Gründe und 429 bis zu sieben Wiederholungen, wachsend bis 32 s plus Zufallsanteil, längeres Retry-After beachten; gewöhnliche Berechtigungsfehler nicht blind wiederholen |
| Kalender-Abschluss | Eigenes Fünf-Minuten-Fenster nach Archivschreiben, Countdown und bisheriger Fortschritt bei Pausen; vorhandene Scope-Abgrenzung/Restarbeit und Wiederanlauf erhalten |

Die Android-Anmeldung verwendet weiterhin den nativen Google-Kontodialog. Die Windows-Browserfenstersteuerung wird nicht auf Android kopiert. Produktversionen sind nach dem tatsächlichen Play-Update beide 1.2.6; gemeinsamer Archivstand bleibt 38. Das ist eine gezielte funktionale Angleichung von Einrichtung und Kalenderabschluss, keine Behauptung identischen Codes oder aller Oberflächen. Bekannte weitere Android-Restpunkte (z.B. Launcher-Symbol, Bedienung beim Wegwischen und ungeklärter Samsung-Hänger) sind damit nicht pauschal behoben. Unbenannte Wunschaktionen für die untere Leiste bleiben separat.

## Prüfung und AAB

CI: https://github.com/KurtV731/serkal_desktop/actions/runs/44048553706 — Test und Bundlebau erfolgreich. Komplette Android-Regression (94 deklarierte JUnit-Testmethoden) mit neuen Robolectric-Prüfungen zu DE/EN-Einrichtung, leerer/abgewiesener/korrigierter Eingabe, Hilfelinks ohne Eingabeverlust und fehlenden Google-Rechten. Fake-Clock-Kalenderprüfung: 200 Schreibvorgänge, neun Pausen, Lesen zählt nicht, Erholung nach über einer Minute und begrenztes Wiederholen. Vorhandene Scope-/Archivtests bleiben erhalten. Google-Antworten und Kalenderlast dabei simuliert; reale Geräteabnahme nach dem Play-Update offen.

Unsignierte Datei `SerKal-Android-1.2.6-code50-unsigned.aab`:
- Version 1.2.6, versionCode 50, compile/target SDK 36.
- Paket unverändert `de.serkal.android.preview.v005`.
- Größe 2.191.807 Byte.
- SHA256 `14ddfe923a76a9cc608954d7e9ea9b27187de67ea4965ba09a924bfa68ad5f56`.
- Aus den gesicherten Base64-Teilen rekonstruiert, Hash mit CI verglichen, ZIP-Prüfung ohne Fehler (126 Einträge).
- CI-Artefakt `SerKal-Android-1.2.6-code50-unsigned-aab`; zusätzlich `play-build-output/` auf demselben Branch.

## Verbindliche Installer-Übergabe

Die bereits gebaute, geprüfte AAB verwenden. Bestehenden lokalen privaten Upload-Signierweg auf Code50 und den obigen Eingabehash umstellen; alten Code49-Starter nicht ungeändert anwenden. Alias `serkal-preview`, gleicher Uploadschlüssel. Fertige Signatur, Nutzdatenvergleich und neuen SHA256 der signierten AAB prüfen und im gemeinsamen Schwarzen Brett protokollieren.

Danach als Update des BESTEHENDEN internen Google-Play-Tests bereitstellen. Kein neues Paket, kein neuer Testlink und keine Deinstallation. Bestehende Play-App-Signierung/OAuth-Konfiguration beibehalten. Erst ein tatsächlicher Upload macht die neue Testversion verfügbar. Test auf Pixel und betroffenem Samsung: vorhandener Schlüssel/Archiv bleiben erhalten, Erklärungen DE/EN, Hilfe zurück zur unveränderten Eingabe, leere/ungültige Eingabe korrigieren, Google neu verbinden und größere Kalenderübertragung mit Countdown. Signatur und Play-Upload sind noch nicht durch CE ausgeführt.

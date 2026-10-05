# Android 0.0.5: TMDB und gemeinsames Archiv
Stand: 05.10.2026. Entwicklungsstand, keine fertige 0.0.5.

## Bereits implementiert
- Echte TMDB-Suche (DE/US-EN), API-Key oder Lesetoken wird vor Nutzung geprüft.
- Autovervollständigung nach 450 ms, mindestens zwei Zeichen, maximal sechs Vorschläge.
- Bis zu drei Ergebnisseiten, Deduplizierung nach TMDB-ID, exakte/Präfix-Treffer vor anderen; danach Erstausstrahlung absteigend.
- Bei höchstens einem Ergebnis und mehreren Suchwörtern zusätzlicher Versuch ohne Leerzeichen.
- Klick lädt direkt die Serieninformationen über die TMDB-ID.
- Veraltete Antworten werden nach Eingabe, Sprachwechsel und Schließen verworfen.
- Keine festen Archivbeispiele mehr. Archiv-Schreiben bleibt deaktiviert.
- Schlüssel derzeit nur im Arbeitsspeicher, keine automatische Übernahme und kein persistenter Klartext.
- Sprachwechsel verwirft derzeit Eingabe/Auswahl; Poster, Termine, Staffelwahl und Titelfallback aus Übersetzungen fehlen noch.

## Befund und weiterer Weg
Desktop verwendet lokale TXT-Dateien im synchronisierten Drive-Laufwerk, Android bisher ausschließlich native Beispieloberfläche.
Android kann keinen Windows-Pfad wie G:\\My Drive verwenden.
Gemeinsames Archiv erfordert daher einen Drive-API-Adapter auch am Desktop; ein Android-Adapter allein reicht nicht.

1. Dauerhafte Paketkennung und Signatur festlegen. Android-OAuth-Client im bestehenden Google-Projekt mit Paket und SHA-1 registrieren. Bestehende Kalender-Einreichung nicht automatisch ändern.
2. Android AuthorizationClient anbinden und Google-Konto eindeutig auswählen. Keine Desktop-Token kopieren.
3. drive.file für explizit freigegebene/app-erstellte Archivdateien prüfen. Bestehende TXT-Dateien benötigen einen bewussten Import/Freigabeweg; Zugriff auf alle Dateien eines gewählten Ordners nicht unterstellen.
4. drive.appdata als Kandidat für gemeinsame Konfiguration im selben Projekt und Konto prüfen. Schlüssel nicht öffentlich ablegen. Automatische Übernahme erst nach Kontoabgleich und erfolgreicher TMDB-Prüfung.
5. TXT-Format und Desktop-Verhalten beibehalten: gemeinsame Identität über TMDB-ID, keine Dubletten bei unterschiedlichen Titeln. Korrektur erhält Identität.
6. Vor produktiven Schreibzugriffen Konfliktverfahren implementieren und testen. Eine synchronisierte Sperrdatei ist kein Nachweis atomarer Sperren. Noch kein Verfahren beschlossen: Drive-Versionsvergleich/bedingte Schreibzugriffe müssen belegt werden; andernfalls unveränderliche Änderungsaufträge mit expliziter Konfliktauflösung statt blindem Überschreiben.
7. Kalenderadapter getrennt anbinden; lokale Bestätigung darf erst nach erfolgreichem Archiv-Schreiben erfolgen, Kalenderfehler als erneut ausführbaren Auftrag festhalten.

## Strukturierte Abnahme mit vier Installationen
PC, zweiter PC, Pixel 8, Samsung – zuerst separates Testarchiv.
- Schlüssel zuerst PC, danach Handy; dann umgekehrte Reihenfolge. Falsches Konto darf keinen Schlüssel übernehmen.
- DE/EN und asiatischer/internationaler Titel: gleiche TMDB-ID, genau eine Serie.
- Gleichzeitig zwei Einträge, zwei Korrekturen derselben Serie, Löschen gegen Korrigieren.
- Offline/Timeout/Abbruch beim Schreiben; Wiederholung ohne Dubletten.
- Archiv und Kalender anschließend auf allen vier Geräten vergleichen.
- Erst danach reales Hauptarchiv freigeben.

## Validierung
GitHub Actions baut APK und führt JVM-Tests des Suchverhaltens aus.
Ein erfolgreicher Build ersetzt keinen Gerätetest und keinen Live-Test mit TMDB-Schlüssel.

## Offizielle Grundlagen
- https://developer.themoviedb.org/reference/search-tv
- https://developer.themoviedb.org/docs/authentication-application
- https://developer.android.com/identity/authorization
- https://developers.google.com/workspace/drive/api/guides/api-specific-auth
- https://developers.google.com/workspace/drive/api/guides/appdata


# Abschlussstand 21.10.2026: Beenden, Android-Anpassungen, Android-only
## Desktop
Quelle: 45c9ca48f8600893525e03f1aa64795fbbd73ed1 auf serkal-0.0.5-archiv-start.
Unten neben dem Kalenderknopf steht Programm beenden / Exit program.
Knopf, Fenster-Schließen und Alt+F4 laufen über denselben BrowserWindow-close-Handler.
Parallele Rückfragen werden unterdrückt. Bei laufender UI-Arbeit oder Wartung bleibt SerKal offen.
Ungespeichert: Speichern und beenden / Ohne Speichern beenden / Abbrechen.
Speicherfehler: offen bleiben. Erst erfolgreicher Speicherabschluss erlaubt Fortsetzung.
Google offen: Synchronisieren und beenden / Lokal gesichert beenden / Abbrechen.
Lokal gesichert bedeutet: persistente Kopie bleibt erhalten, Hintergrundübertragung wird beim nächsten Start wieder aufgenommen.
Bei bereits laufendem Abgleich bis zu 60 Sekunden auf dessen Ende warten; danach erneut prüfen/synchronisieren. Fehler oder weiter ausstehende Änderung verhindert „Synchronisieren und beenden“.
Betriebssystem-Zwangsbeendigung, Prozessabschuss oder Stromausfall können nicht durch einen Dialog verhindert werden.
30 Desktop-Testprogramme bestanden; fünf UI-Skriptblöcke syntaktisch geprüft. Windows-Klicktest noch offen: alle drei Schließwege, Abbrechen, erfolgreiches Speichern, Fehler, lokale Kopie/Google-Rückstand. Kein Windows-Installer gebaut. Reine Quelländerung, Programmversion weiterhin Alpha23.

## Android a16
Quelle: 85f44c9f02924ba4368fcb3576f1521abcd69c3a; versionName 0.0.5a16, versionCode 24; Paketidentität bleibt de.serkal.android.preview.v005.
- Native App-Dialoge verwenden dynamisch Material Dark/Light; eigene Eingabefelder sowie Log-/Wartungstexte erhalten passende Textfarbe. Google-Systemdialoge bleiben von Google gesteuert.
- Gemeinsame sprachabhängige Titelwahl für Detailabruf und Wartung: englischer Originaltitel vor regionalem Alias, passende Übersetzungen vor alternativen Titeln.
- Manuell geschützte Titel werden durch Wartung nicht überschrieben.
- Neuaufnahmen speichern Titel DE/EN und calendarLanguage; Wartung aktualisiert die Kalendersprache. Anbieterbeschreibung im Kalender nutzt diese Sprache.
- Neue Titeltests: englisches Original „The Testaments“ statt französischem Alias; koreanisches Original mit englischem Titel und explizite deutsche Übersetzung.
Noch offen aus dem größeren Public-Plan: vollständige Android-Ankündigungskarten/Datumshistorie/(?) und deren Abgleich mit Desktop; konkrete Geräteprüfung aller Dialoge.
Signierung: ursprünglicher privater JKS-Schlüssel ist im aktuellen Workspace nicht vorhanden. Keine Ersatzsignatur erzeugen. Benötigt wird derselbe zuvor privat aufbewahrte SerKal-Android-Preview-Signing.jks (Alias serkal-preview, bisheriges Passwort lokal verwenden). Zertifikats-SHA256 vor Auslieferung gegen 7e24902dd88ed80fb84e0ffc3b188a1e0c88e30cb2a84247a03cf4ba416667eb prüfen. Schlüssel nicht ins öffentliche Repository hochladen.
Der Buildstatus wird am Schwarzen Brett ergänzt; diese Datei behauptet keine fertige signierte APK.

## Android-only: tatsächlicher Ersteinrichtungsweg
Quellprüfung von MainActivity, AndroidArchiveCopy, SharedKeyClient, ArchiveCodec.
1. Frisch installieren und öffnen: Sprache zunächst Deutsch, dunkle Oberfläche, Querformat. Google-Anmeldung startet automatisch. DE/EN und Hell/Dunkel sind oben erreichbar.
2. Eigenes Google-Konto wählen und Berechtigungen bestätigen. Abbrechen ist möglich; ohne Google kann ein Neunutzer noch kein gemeinsames Archiv speichern.
3. Existiert für dieses Google-Konto bereits ein bereitgestellter TMDB-Schlüssel, wird er geprüft und übernommen.
4. Existiert kein Schlüssel, zeigt die App den Hinweis zur Eingabe über API-Key. Nutzer benötigt einen eigenen TMDB-Zugang und kann Schlüssel einfügen, statt Zeichen abzutippen. Nach Prüfung kann er ihn für seine eigenen SerKal-Geräte bereitstellen.
5. Existiert ein vollständiges aktuelles Google-Archiv, wird es übernommen. Existiert keines, erstellt Android selbst eine leere lokale Archivkopie und überträgt diese. Kein Desktop erforderlich.
6. Ausnahme: Nur altes v1-Archiv vorhanden -> COPY_NEEDS_SOURCE; bisheriger Quell-PC muss einmalig migrieren. Dies darf nicht als allgemeine Android-only-Voraussetzung erklärt werden.
7. Serie suchen, auswählen, Staffelnummer bestätigen. Aktuelle Eingaberoutine verlangt vollständige Episodentermine; unbekannte/fehlende Termine können die Aufnahme blockieren. Angekündigte Staffel ohne vollständige Termine ist noch kein abgeschlossener Android-only-Komfortweg.
8. Erste lokale Änderung mit Terminen veranlasst Kalenderauflösung/-anlage und Google-Abgleich. Leeres Archiv allein braucht noch keinen Kalender.
9. „Lokal gespeichert“ von „Bei Google gespeichert“ unterscheiden. Vor Gerätewechsel bestätigten Abschluss abwarten.
10. Bei späteren Starts kann die lokale Kopie wiederhergestellt werden; Google-Anmeldung/Token-Erneuerung ist vom Kontozustand abhängig.

## Abnahme mit echtem Android-Erstnutzer
- Ohne Desktop und ohne vorherige SerKal-Daten beginnen, eigenes Testkonto verwenden.
- Google abbrechen und erneut verbinden.
- Eigenen TMDB-Schlüssel einfügen; Annahme und Bereitstellen prüfen.
- Leeres Archiv erscheint ohne falsche Quell-PC-Anforderung.
- Eine Serie mit vollständigen Terminen aufnehmen; lokale Speicherung und bestätigten Google-Abgleich prüfen.
- Kalender im richtigen Google-Konto kontrollieren.
- App schließen/neustarten: Archiv, Sprache, Theme und Schlüsselverfügbarkeit prüfen.
- Optional zweites Androidgerät mit demselben Konto: automatische Schlüssel-/Archivübernahme.
Das ist eine strukturierte Quellprüfung plus Testauftrag, kein behaupteter realer Geräte-Erststart.

## Bestätigtes Build-Ergebnis
Android Actions-Lauf 39588562930 erfolgreich, Artefakt 12339593813; ZIP-SHA256 4a5bbd48c40bc1040d56d9d3ba659e86280b4ea2abd872c84fe1a59ffa4fb324 geprüft. Neun JUnit-Suites mit 30 Tests, null Fehler/Fehlschläge. APK weiterhin unsigned, nicht zur Installation ausgeben. Alle 16 geänderten Desktop-/Android-Quelldateien einschließlich Tests und Buildkonfiguration gegen GitHub-Blobhash geprüft. Signierschlüssel fehlt weiterhin.

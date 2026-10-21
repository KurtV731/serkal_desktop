# Wartung folgt geschauten Serien – 21.10.2026

## Neue Vorgabe von Kurt
Neue Staffeln einer schon verfolgten Serie direkt übernehmen, wenn die bisher neueste archivierte Staffel als gesehen markiert ist. Nur Staffeln oberhalb der bisherigen höchsten Staffel werden automatisch neu aufgenommen. Ältere Staffeln vor dem eigenen Einstieg werden nicht nachgetragen. Lücken innerhalb des vorhandenen Bereichs bleiben Hinweise, keine automatische Rückwärtsvervollständigung.

Vollständige Episodentermine (mehr als eine Episode, um vorläufige Ein-Episoden-Platzhalter zu vermeiden) werden als Staffel aufgenommen. Unvollständige/noch unbekannte Termine werden bei berechtigten Folgestaffeln als Ankündigung gespeichert. Bekannter Start erzeugt eine gesonderte dauerhafte Kalenderkarte. Keine erfundenen Episodentermine. Bereits erfasste Ankündigungen behalten Historie und werden bei Terminänderung aktualisiert; gleiche Daten erzeugen keinen neuen Verlaufseintrag. Karten bleiben nach Staffelstart/Serienlöschung bestehen, bis Nutzer sie manuell löscht. Desktop und Android verwenden dieselben Ankündigungsfelder, stabilen Karten-IDs und Google-Marker.

## Desktop
CE 596425f03495104ec6a65ede7baf9ce85df86981 auf serkal-0.0.5-archiv-start. Bisherige Sperre gegen alle neuen Staffeln in maintenanceBuildOperations aufgehoben, aber strikt an latest-seen-Regel gebunden. Vorherige Laufzeitprüfung blockiert die explizit als gesehen markierte letzte Staffel nicht mehr. Bericht kennzeichnet übernommene Staffeln. Bestehende Ankündigungskarten unverändert weitergeführt. 31 Testprogramme bestanden. Keine neue Windows-Installationsdatei gebaut, Quellfassung per git pull / npm start prüfbar.

## Android a18
Quelle e75d633fc6358cb0823221896c2ecde828fd7940; versionCode26, Paket/Signatur unverändert.
Neue SeasonAnnouncements-Klasse: interoperable Datumshistorie und dauerhafte Kalenderkarten. ArchiveCodec liest/schreibt das Feld, Wartung übernimmt vollständige neue Staffeln atomar in die lokale Kopie; Kalenderabgleich erfolgt anschließend im Hintergrund. Archivzeile zeigt angekündigte Starts mit (?).
Fehlende Termine erscheinen als „Termin unbekannt“, zukünftige Staffeln als Ankündigung statt pauschal „fehlend“. Bei fehlgeschlagener lokaler Übernahme wird applyError beibehalten und angezeigt. Generische Wiederholungsaufforderung entfernt; Archivschutz bei geänderter lokaler Version bleibt erhalten. Die genaue Ursache von Kurts vorigem konkreten Fehler ist ohne dessen Laufzeitcode weiterhin nicht nachgewiesen; nicht als reproduziert/behoben behaupten.

Actions 39609140970 erfolgreich; 33 JUnit-Tests, null Fehler/Fehlschläge. Signierte Test-APK 0.0.5a18-serkal-android.apk, 2879239 Bytes, SHA256 86849c19a1d0175a5fdbca6ec91b125ddabd41f2ce2c66f00f705ec4c122007c. Library-ID libfile_c5344f40370c8191ab8c1919e68c0f83. V2/V3-Signatur verifiziert, ursprünglicher Zertifikatsfingerabdruck gleich. Alle 15 geänderten Quellen/Tests/Builddateien exakt von GitHub zurückgelesen. Keine öffentliche Veröffentlichung.

## Gezielte Abnahme
1. Update über a17/a16 installieren, nicht deinstallieren.
2. Prüfen, ob die bisher neueste Ahsoka-Staffel tatsächlich als gesehen markiert ist. Keine falsche Gesehen-Markierung nur für den Test setzen.
3. Wartung starten. Eine berechtigte Folgestaffel mit unvollständigen Terminen muss als Ankündigung erscheinen; bekannte Termine mit (?).
4. „Bei Google gespeichert“ abwarten und Kalender kontrollieren. Datum stammt von TMDB und bleibt vorläufig.
5. Zweite Wartung ohne neue TMDB-Daten: keine zusätzliche Kalenderkarte/kein neuer Historieneintrag.
6. Neue vollständige Folgestaffel wird automatisch aufgenommen; ungesehene letzte Staffel und frühere Staffeln vor dem Einstieg werden nicht automatisch ergänzt.
7. Falls „Nicht übernommen“ bleibt, genügt zunächst der angezeigte Fehlercode als Text. Kein Screenshot als Standardanforderung.

## Später
Freie Entscheidungen über automatische Übernahme, beobachtete/ungesehene Serien, zurückliegende Lücken und reine Hinweise als PLUS-03 in der Ideenliste. Noch keine Einstellungsoberfläche dafür gebaut.

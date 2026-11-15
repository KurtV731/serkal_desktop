# Desktop 1.2.5 – Kalenderstabilisierung

Basis ist der freigegebene Desktop-1.2.4-Quellstand `52aafa693ec519de0e45bc235dcc870a1e9eec80`, nicht `main` und kein Entwicklungsstand 1.3. Gemeinsames Archivformat/Stand 38 bleibt unverändert; Android wird durch diesen Desktop-Auftrag nicht neu gebaut. Die Desktop-Versionsanzeige und Setup-Datei lauten 1.2.5.

## Verhalten

- Vorhandene Abgrenzung nach geänderten Serien/Staffeln und Signaturvergleich erhalten. Identische Kalendertermine werden übersprungen. Wartung kann dennoch viele echte Änderungen erzeugen; „200“ ist allein kein Fehlerbeleg.
- Alle Kalenderanfragen bleiben sequentiell mit mindestens 250 ms Startabstand.
- Nach 20 erfolgreichen Schreibaktionen pausiert die Verarbeitung vor der nächsten Schreibaktion zwei Sekunden. Leseanfragen und abgewiesene Schreibversuche zählen nicht zu diesen 20. Die Werte sind zentral einstellbare Policy-Vorgaben und müssen mit einer echten großen Wartung praktisch geprüft werden, keine zugesicherte Google-Quote.
- Bei 429 oder 403 mit `rateLimitExceeded` / `userRateLimitExceeded` maximal sieben Wiederholungen derselben Anfrage mit 1/2/4/8/16/32/32 Sekunden plus Zufallsanteil. Längeres `Retry-After` wird beachtet. Sonstige Berechtigungsfehler werden nicht blind wiederholt. Erschöpfter Versuch stoppt die wartende Anfragekette.
- Archivverbindung/-upload behalten die bisherige Zeitbegrenzung. Erst nach bestätigtem Archivschreiben erhält der Kalenderabgleich ein eigenes Fünf-Minuten-Fenster einschließlich Pausen. Danach bleiben offene Arbeit und Fehlermeldung erhalten; keine endlose Wiederholung.
- Pausen-/Retry-Anzeige DE/EN mit Countdown und bisherigem Fortschritt; Pause und Wiederholung im bestehenden Log.
- Bestehende Rest-Staffelmarkierungen bleiben dauerhaft erhalten. Innerhalb einer unvollständigen Staffel vergleicht der nächste Lauf die tatsächlich vorhandenen Google-Termine erneut. Erfolgreich geschriebene Einzeltermine werden dadurch nicht nochmals geschrieben. Dies ist kein neues lokales Einzeltermin-Journal. Kein erneuter Archivupload für reine Kalenderwiederholungen.

## Prüfung

`npm test`: 43 Testprogramme, einschließlich bestehender Scope-/Archiv-/Kompatibilitätsprüfungen. Neue Fake-Clock-Tests: 200 echte Anfragen mit neun Batchpausen, erfolgreiche Erholung nach über einer Minute, Retry-After 65 Sekunden, erschöpfte Wiederholungen und Ablauf vor einer Batchpause, reine Leseanfragen zählen nicht zur Schreibpause. Zusätzlich tatsächliche Produktions-Schreibschleife mit simuliertem Google: Abbruch nach 70 von 200 Terminen innerhalb EINER Staffel; neuer Lauf/neue Revision schreibt nur 130 offene Termine, keine doppelten POSTs, danach null Schreibvorgänge. Bei 200 geprüften Terminen und genau einer Abweichung genau ein PUT.

Die Tests nutzen simulierte Google-Antworten. Echter Windows-Build, Start-/Upgradeprüfung und große Wartung gegen Google stehen beim Installer/Kurt noch aus. Quellfreigabe zum Bau ist keine Public-Freigabe.

## Installer-Vertrag

Nur den im gemeinsamen Schwarzen Brett genannten unveränderlichen Quell-Commit aus `ce-desktop-1.2.5` bauen. Kein unbenanntes `git pull main`, kein Wechsel auf ältere Quellen bei einem Fehler. Der neue Starter wird separat auf diesen Commit festgeschrieben. Er erzeugt pro Versuch getrennte Bau-/Kandidatenordner, lässt bisherige Versuche sowie Public 1.2.4 unangetastet und liefert Hash und Quellnachweis. Scheitert ein Schritt: konkreten Fehler auswerten und denselben Quellstand in einem neuen Kandidatenordner erneut bauen. Keine Erfolgsmeldung aus einer alten EXE ableiten.

Installer prüft private OAuth-Grunddatei, vorhandenes SerKal-Symbol, komplette Tests, Paketinhalt, Start, sichtbare Version und Update einer bestehenden Installation. Keine persönlichen Tokens ausliefern. Erst denselben geprüften Kandidaten nach Kurts Abnahme unverändert veröffentlichen; Website/Release mit Hash abgleichen. Für Websiteersatz vorbereitete Datei erst vollständig hochladen und prüfen, dann serverseitig atomar umbenennen, bisherige Datei als Rückweg behalten. Kein Löschen der aktuellen Public als Vorbedingung.

Google-Grundlage: https://developers.google.com/workspace/calendar/api/guides/quota und https://developers.google.com/workspace/calendar/api/guides/errors (15.11.2026 gelesen).

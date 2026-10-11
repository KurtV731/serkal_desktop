# Desktop 1.2 Alpha 06: kontrollierter Kalender-Neuaufbau

Der Live-Test von Alpha 05 zeigte Anlegen, Verschieben, Löschen und erneutes Eintragen
im eigenen Testkalender. Der vorhandene Kalender lieferte mit dem engeren Recht HTTP404.
Das beweist keinen Datenverlust und keine automatische Übernahmemöglichkeit.

## Start unter Windows

Nur am Desktop mit dem vollständigen eingestellten Archiv starten. Laufende SerKal-
Entwicklungsfassung zuerst schließen; bei einer laufenden Instanz wird diese nur aktiviert.
Im CE-Zweig `serkal-0.0.5-archiv-start`:

```bat
git pull
npm run start:calendar-rebuild
```

Der Dialog nennt die Zahl der Staffeln. „Neuaufbau starten“ legt ausdrücklich einen
neuen Kalender **SerKal App** an; „Abbrechen“ verändert keinen Kalender.
Der Vorgang beendet sich anschließend. Danach normales `npm start`.
Im Google-Kalender den neuen Kalender prüfen; der alte kann zur Kontrolle ausgeblendet
werden, muss aber nicht gelöscht oder umbenannt werden.

## Was übernommen wird

Archivierte Staffeln mit Terminen im aktuellen Jahr oder später, einschließlich der
aktiven deutschen Termine/Offsets. Wie beim normalen Eintragen werden dann sämtliche
Termine dieser Staffel verarbeitet. Archivdateien werden nicht verändert. Es erfolgt
keine TMDB-Neuabfrage. Staffelzeilen ohne notwendige Titel/Jahr/ID/Staffel werden vor
Kalenderanlage abgewiesen. Rein vergangene Staffeln werden nicht neu eingetragen.

Dies ist ein Neuaufbau aus dem Archiv, keine Kopie des alten Google-Kalenders.
Handänderungen und fremde Termine, die nur dort existieren, werden nicht übernommen.
Der alte Kalender wird weder gelesen noch umbenannt oder gelöscht.

## Abbruch und Wiederholung

`calendar-rebuild.json` im lokalen Nutzerprofil speichert altes und neues Ziel sowie
den Zustand. Einstellungen werden vorab als `settings.json.before-calendar-rebuild.json`
gesichert. Das neue Ziel bleibt über normale Neustarts fest ausgewählt, auch wenn der
alte Kalender weiterhin sichtbar ist.

Bei unterbrochenem Schreiben denselben Befehl erneut starten. Vorhandene Termine werden
über die bestehenden deterministischen IDs und Abgleiche wiederverwendet. Ein vollständig
abgeschlossener Lauf erzeugt bei Wiederholung keinen weiteren Kalender.

Ist gerade die Kalenderanlage mit unbekanntem Ergebnis unterbrochen worden, wird keine
zweite Anlage versucht: Google-Kalender und Protokoll müssen geprüft und die tatsächliche
neue ID geklärt werden. Journal nicht auf Verdacht löschen.
Während eines unvollständigen Neuaufbaus blockiert der normale Kalenderzugriff und fordert
zur Fortsetzung auf. Ein Zugriffsfehler am neuen Ziel führt ebenfalls zu keinem Ersatz.

## Grenzen und Testreihe

Diese Fassung ist ein Entwicklungsstand; öffentliche 1.1 und Google-Console wurden nicht
verändert. Die neue Kalender-ID ist zunächst nur im ausführenden Desktop-Profil vorhanden.
Automatische Übernahme des Kalenderziels auf andere Rechner ist damit nicht implementiert.

Automatisch geprüft: Schreibabbruch/Fortsetzung, keine erneute Anlage, unklarer
Anlageausgang, Verbot des alten Ziels, feste Zielwahl und Sperre unvollständiger Läufe;
sowie die bisherige vollständige Testsuite. Echter Google-Livetest Alpha 06 noch offen.

Mit Kurt testen: Dialoganzahl, Anlage von genau einem neuen Kalender, Termine mit vorhandenem
Offset, Neustart und erneute Eintragung im selben neuen Kalender, anschließend Änderung und
Löschung einer einzelnen Teststaffel. Alten Kalender bei allen Schritten unverändert lassen.
Mehrrechnerbetrieb und Google-Verifizierungsentscheidung separat prüfen.

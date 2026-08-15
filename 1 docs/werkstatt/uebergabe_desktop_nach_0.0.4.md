# SERKAL Desktop – Übergabe nach 0.0.4

Stand: 15.08.2026
Repository: KurtV731/serkal_desktop

## 1. Grundsatz für die Weiterentwicklung

SERKAL Desktop wird **nicht neu erfunden**. Die fachliche Quelle ist die gewachsene SERKAL-2.5-Logik aus `Code.gs` und den Modulen 1 bis 10. Die vorhandene UI enthält das über lange Zeit erarbeitete optische und Bedien-Know-how.

Verbindliche Arbeitsregel:

1. Vor jeder neuen Routine zuerst prüfen, ob die passende Funktion in SERKAL 2.5 bereits existiert.
2. Reines JavaScript möglichst direkt übernehmen.
3. Nur Google-Apps-Script-Abhängigkeiten ersetzen (`google.script.run`, `PropertiesService`, `UrlFetchApp`, `DriveApp`, `CalendarApp`, `SpreadsheetApp`, `CacheService`, `Utilities`, `Session` usw.).
4. Fachlogik, Sonderfälle und Schutzmechanismen nicht vereinfachen, bevor die komplette Aufrufkette verstanden ist.
5. UI nicht unnötig neu bauen; vorhandene Darstellung und Bedienlogik erhalten.

Kurzform: **Portieren, nicht neu erfinden.**

## 2. Stand SERKAL Desktop 0.0.4

0.0.4 ist der erste brauchbare TMDB-/Such-Stand der Desktop-Portierung.

Vorhanden bzw. getestet:

- Electron-Desktop-Grundgerüst.
- Übernommene SERKAL-Oberfläche.
- TMDB-Key wird lokal gespeichert; fehlt er, wird er beim normalen Suchablauf abgefragt.
- TMDB-Anbindung funktioniert lokal über Node/Electron statt Apps Script.
- SERKAL-Suchlogik wurde aus der vorhandenen Modul-2-/Modul-3-Logik abgeleitet und portiert.
- Maximal drei sinnvolle Treffer statt einer ungefilterten TMDB-Trefferflut.
- Exakt-/Beginnt-mit-Logik, Jahresvorgabe, Staffelvorgabe und direkte TMDB-ID-Suche.
- Deutsche und englische Detaildaten werden getrennt geladen (`descDE`, `descEN`).
- Staffelwahl bevorzugt die neueste Staffel mit echten Terminen.
- Episodenzahl, Episodentermine, Startdatum und angekündigte spätere Staffeln werden an die UI geliefert.
- Posteranzeige funktioniert; große Posteransicht der bestehenden UI funktioniert ebenfalls.
- Eintragen ist in 0.0.4 bewusst gesperrt, solange das lokale Archiv noch nicht vollständig angeschlossen ist.

Solltest für die Suche: `Wednesday` / TMDB 119051. Erwartet wird sinngemäß die bereits bekannte SERKAL-Darstellung mit S02, 8 Episoden, Terminen und Hinweis auf S03 angekündigt.

## 3. Versionsnummer – tatsächlicher Endstand 0.0.4

Beim Installer-Test zeigte die Anwendung trotz Paketversion 0.0.4 sichtbar noch 0.0.3. Die entscheidende Ursache waren feste `0.0.3`-Angaben in der übernommenen `2 src/frontend/index.html`.

Der erfolgreiche praktische Fix für 0.0.4 war bewusst einfach: Kurt hat die verbliebenen `0.0.3`-Angaben in `index.html` auf `0.0.4` geändert und den funktionierenden Stand nach GitHub gepusht. `npm start` zeigte danach korrekt `SERKAL Desktop 0.0.4`.

Wichtig für den Nachfolger: Nicht erneut versuchen, solche Altangaben nur per CSS oder nachträglichem DOM-Trick zu überdecken. Bei Versionsproblemen zuerst projektweit nach der alten Versionszeichenfolge suchen und die tatsächlichen Quellen prüfen.

Die langfristig saubere Lösung bleibt: **eine einzige Versionsquelle**, vorzugsweise `package.json` bzw. Electron `app.getVersion()`, aus der Fenstertitel und alle ggf. sichtbaren Versionsangaben gespeist werden. `preload.js` enthält bereits einen Ansatz dazu; dieser ist vor weiterer Änderung zusammen mit der UI zu prüfen.

Noch offen: Die UI zeigt derzeit zusätzlich zur Electron-Titelleiste eine zweite interne Versions-/Build-Zeile. Kurt möchte keine doppelten Angaben. Diese zweite Zeile soll der Nachfolger sauber an ihrer Quelle entfernen; sie ist kein Grund, den funktionierenden 0.0.4-Stand erneut umzubauen.

## 4. Build / Installer

`npm run make` erzeugt den Windows-Squirrel-Installer unter ungefähr:

`out/make/squirrel.windows/x64/serkal_desktop-0.0.4 Setup.exe`

Ein früher Build war ca. 746 MB groß. Ursache war nicht SERKAL selbst, sondern ein viel zu großes `app.asar`, das Entwicklungsabhängigkeiten und Projektmaterial mit einpackte.

`forge.config.js` wurde deshalb verschlankt:

- ASAR bleibt aktiv.
- Pruning ist ausdrücklich aktiv.
- Entwicklungsbereiche wie Docs, Tools, Tests und sonstige nicht benötigte Build-Hilfsdateien werden ausgeschlossen.
- Das Verzeichnis `3 data` bleibt **bewusst enthalten**, insbesondere das bestehende Archiv als Ausgangsbasis für die nächste Portierungsstufe.

Danach lag der Installer bei ungefähr 133–134 MB. Das ist der derzeit akzeptierte Entwicklungsstand.

Windows SmartScreen warnt beim Start, weil die Entwicklungs-EXE noch nicht signiert bzw. reputationsbekannt ist. Code Signing/SmartScreen ist **noch kein Entwicklungsproblem**; das übernimmt der Installer-Chatty, sobald eine vertriebsfähige Version ansteht.

## 5. GitHub-Arbeitsweise

GitHub ist jetzt die gemeinsame technische Basis.

- Repository: `KurtV731/serkal_desktop`
- `main` ist der laufende Arbeitsstand.
- Kurt holt Änderungen mit `git pull`.
- Lokal wird mit `npm start` getestet.
- Fertige Entwicklungs-Builds entstehen mit `npm run make`.
- Quellcode gehört ins Repository; fertige Installer sollen künftig als GitHub-Releases/Assets verteilt werden und nicht als große Binärdateien in die normale Git-Historie.

Website-Chatty und Installer-Chatty können sich damit am tatsächlichen GitHub-Stand orientieren.

## 6. Nächster großer Schritt: Archiv + Kalender als Doppelpaket

Ursprünglich war 0.0.5 = Archiv und 0.0.6 = Kalender geplant. Fachlich sind beide aber eng gekoppelt und müssen gemeinsam betrachtet werden.

Grund: Nebenfunktionen des Archivs – vor allem **Aktualisieren** und **Löschen** – berühren direkt die Kalenderlogik. Eine Serie zu aktualisieren kann bestehende Termine verändern, ergänzen oder ersetzen; Löschen kann zugehörige Kalendereinträge betreffen.

Darum gilt für die nächste Phase:

- Archiv nicht als isolierten TXT-Leser bauen.
- Die komplette gewachsene SERKAL-2.5-Logik für Eintragen, Archiv, Aktualisieren, Löschen und Kalenderbezug untersuchen und portieren.
- Erst die Aufrufketten in `Code.gs` und den Modulen verstehen.
- Reines JS übernehmen, Google-spezifischen Unterbau ersetzen.

Ziel des Doppelpakets ist der funktionale Kern:

**Suchen → Eintragen → Archiv → Aktualisieren/Löschen → Kalender**

## 7. Kalender: Portierung plus spätere Architekturentscheidung

Die SERKAL-2.5-Fachlogik bleibt Referenz. Viele Kalenderfunktionen sind heute jedoch direkt auf Google Calendar zugeschnitten. Funktionen wie Verschieben, Aktualisieren und Löschen sind bei einer einfachen ICS-Datei nicht automatisch gleichwertig möglich.

Daher spätestens beim Kalender eine saubere Trennung vorsehen:

SERKAL-Fachlogik
→ kalenderneutrale Operationen (`anlegen`, `ändern`, `löschen`, `verschieben`)
→ Kalender-Adapter
→ Google Calendar / ICS / spätere weitere Ziele

Wichtig: Erst die vorhandene 2.5-Logik portieren und verstehen, dann dort weiterentwickeln, wo Desktop/ICS eine neue Architektur wirklich verlangt.

## 8. Fanal

Fanal ist ein eigenständiges Node.js-Analysewerkzeug, nicht bloß ein SERKAL-Modul. Es analysiert Funktionen, Referenzen, Aufrufketten, Erreichbarkeit usw. und soll beim späteren Aufräumen helfen, bevor Code als doppelt oder unbenutzt bewertet wird.

Fanal wird aus dem alten Website-/SKDEVHMB-Kontext herausgelöst. Der bisherige `Support`-Ordner soll zunächst neutral auf Projektebene neben `serkal_desktop` liegen. Noch keine vorschnelle Entscheidung, ob Fanal Bestandteil dieses Repositories, ein eigenes Repository oder ein lokales Entwicklerwerkzeug wird.

SKDEVHMB verliert seine bisherige Funktion; benötigte Einzelteile werden in ihre neuen Bereiche übernommen.

## 9. Zusammenarbeit der drei Chattys

- Desktop-Chatty: SERKAL-Desktop-Portierung und Fachlogik.
- Website-Chatty: serkal.de, Website und öffentliche Darstellung/Download-Verknüpfung.
- Installer-Chatty: Installer, Setup, spätere Signierung, SmartScreen, Release-/Verteilungsweg.

GitHub soll die gemeinsame technische Wahrheit sein, damit keine manuellen Zwischenstände zwischen den Werkstätten herumgereicht werden müssen.

## 10. Arbeitsweise mit Kurt

Für technische Änderungen möglichst vollständige Dateien/saubere GitHub-Commits statt Patch-Fragmente. Kleine, nachvollziehbare Schritte sind besser als große Umbauten. Bei bestehenden SERKAL-Funktionen zuerst Quellcode studieren, dann handeln.

Praktische Zusatzregel aus dem letzten 0.0.4-Test: Bei einem offensichtlich verbliebenen Textwert zuerst schlicht projektweit nach diesem exakten Wert suchen, bevor eine komplizierte technische Ursache konstruiert wird.

Kernregel für den Nachfolger:

> **Das wertvollste Material ist nicht der neu geschriebene Desktop-Code, sondern das über Jahre gewachsene SERKAL-2.5-Wissen. Dieses Wissen portieren wir.**

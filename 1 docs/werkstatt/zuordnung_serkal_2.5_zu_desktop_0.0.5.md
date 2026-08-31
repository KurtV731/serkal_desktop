# Zuordnung SerKal 2.5 zu SerKal Desktop 0.0.5

Stand: 31.08.2026  
Arbeitsbranch: `serkal-0.0.5-archiv-start`

## Verbindliche Regel

SerKal Desktop ist die technische Übertragung von SerKal 2.5. Fachliche Regeln werden aus den Originaldateien übernommen und nicht neu erfunden. Abweichungen sind ausdrücklich zu dokumentieren.

## Wo der Originalcode liegt

Die unveränderten Referenzdateien befinden sich unter:

`0 referenz/serkal_2.5_original/`

## Wohin die Bestandteile gelangt sind

| Originaldatei | Heutiger Zielbereich | Stand |
|---|---|---|
| `Code.gs` | überwiegend `2 src/backend/main.js`; Aufrufbrücke ebenfalls in `main.js` | teilweise übertragen |
| `ui.html` | nahezu vollständig in `2 src/frontend/index.html` | weitgehend übernommen und um Desktop-Brücken ergänzt |
| `modul2-suche.gs` | TMDB-/Suchbackend in `2 src/backend/main.js`; Bedienlogik in `2 src/frontend/index.html` | teilweise technisch übertragen |
| `modul3-tmdb.gs` | `2 src/backend/main.js` | teilweise technisch übertragen |
| `modul4-archiv.gs` | Dateizugriff in `2 src/backend/main.js`; Archivanzeige und Bedienung in `2 src/frontend/index.html` | teilweise übertragen |
| `modul5-kalender.gs` | Google-/ICS-Technik in `2 src/backend/main.js`; Bedienung und Meldungen in `2 src/frontend/index.html` | teilweise übertragen; fachliche Originalregeln müssen vollständig abgeglichen werden |
| `modul8-syslog.gs` | Dateilogik in `2 src/backend/main.js`; Logfenster in `2 src/frontend/index.html` | teilweise technisch übertragen |
| `modul9-helfer.gs` | Helfer verteilt auf `2 src/backend/main.js` und `2 src/frontend/index.html` | nicht als eigenes Modul erhalten |
| `modul10-wartung.gs` | alte UI-Anteile in `2 src/frontend/index.html`; vollständiges Desktop-Backend fehlt noch | noch nicht vollständig portiert |

## Antwort auf die Frage „Stehen alle GS-Dateien in index.html?“

Nein.

- Die alte Oberfläche und ein großer Teil ihrer JavaScript-Bedienlogik stehen in `2 src/frontend/index.html`.
- Datei-, TMDB-, Archiv-, Google-, ICS- und Logzugriffe stehen in `2 src/backend/main.js`.
- Die sichere Electron-Verbindung dazwischen steht in `2 src/common/preload.js`.
- Die früher klar getrennten GS-Module wurden beim bisherigen Desktop-Umbau leider nicht als entsprechend getrennte Desktop-Module erhalten.

## Kalenderkorrektur vom 31.08.2026

Aus `modul5-kalender.gs` wurde die ursprüngliche Reihenfolge wiederhergestellt:

1. Eingabe und Termindaten prüfen.
2. Tatsächlich letzten Episodentermin bestimmen.
3. Liegt die letzte Episode vor dem aktuellen Jahr, den Kalenderweg erfolgreich überspringen.
4. Erst danach Kalender-ID, OAuth und Google aufrufen.
5. Liegt die letzte Episode im aktuellen Jahr oder später, die komplette Staffel verarbeiten.

Kontrollfall: `Bonanza (1959) [S14]`.  
Erwartung: Archiv wird gespeichert; Google wird nicht aufgerufen.

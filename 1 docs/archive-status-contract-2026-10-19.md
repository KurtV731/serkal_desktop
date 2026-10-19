# Desktop Alpha 23: Statusfarben verbindlich sichtbar

Kurt meldet am 19.10.2026 anhand der installierten Alpha 221: Zukunft gelb sichtbar, übrige Häkchen im Dunkelmodus gleichfarbig. Keine Archivdaten zurücksetzen.

## Verbindliche Zustände

| Wert | Farbe | Bedeutung | Aktion |
| --- | --- | --- | --- |
| 1 | Gelb | Eingetragen, erster aktiver Termin noch in Zukunft | Noch keine Gesehen-Aktion an diesem Symbol |
| 2 | Blau | Nach Terminplan aktuell laufend | Schon manuell auf gesehen/Grün setzbar |
| 3 | Rot | Nach Terminplan vollständig erschienen, noch nicht als gesehen bestätigt | Manuell Grün setzen |
| 4 | Grün | Benutzer bestätigt gesehen | Bestätigung rücknehmbar; abgeschlossene Staffel wird Rot |

Gesehen bleibt eine manuelle Aussage, niemals aus Zeitablauf erschließen. Bei Rücknahme wird wie bisher der aktuelle Terminstatus berechnet; eine tatsächlich noch laufende Staffel wird wieder Blau, eine abgeschlossene Rot. Diese bestehende Zeitlogik wurde nicht durch einen neuen künstlichen Archivstatus ersetzt. Datum/Offset, Notizen und TMDB-ID bleiben unverändert.

## Ursache und Korrektur

Alte CSS-Zuordnungen enthielten Blau für geplant, Grün für laufend und Grau für gesehen. Später eingeführtes `body[data-theme=dark] .liMeta` setzte zusätzlich alle geerbten Symbolfarben auf ein einheitliches helles Grau. Die numerischen Zustände und das Umschalten waren damit nicht zuverlässig visuell unterscheidbar. Der frühere Toggle-Test prüfte nur Zustandswechsel, nicht die Farben.

Jetzt zentrale Zuordnung `archiveStatusPresentation_` und `applyArchiveStatusPresentation_`. Sichtbare Farbfläche direkt am Symbol statt nur geerbter Textfarbe; Gelb als Kreis, Blau/Rot/Grün mit weißem Häkchen. Schrift/Farbe/Deckkraft/Größe direkt mit Inline-Priorität fixiert, damit allgemeine Theme-Regeln sie nicht verdecken. Hintergrund und Datum bleiben separat gestaltet. Status 0/5 behalten neutrale Zeichen für unbekannt bzw. Fehler. Bestehende Tooltip-, Tastatur-, aria-pressed- und Speicherlogik erhalten.

## Absicherung

Neues regulär in npm test eingebundenes Regressionstestprogramm `6 tests/archive-status-colors.test.js`: alle vier Farbwerte und Lesbarkeitsattribute, Priorität gegenüber Themes, Terminableitung, Blau → Grün sowie 50 Rot/Grün-Rundläufe, Erhalt von ID/Notiz und Verwendung des gemeinsamen Formatierers in beiden Renderpfaden. 29 Testprogramme bestanden; fünf UI-Skripte syntaktisch geprüft. Keine echte grafische Windows-Prüfung hier vorhanden. Kurt muss die Farben in Hell und Dunkel praktisch kontrollieren.

## Lieferung

CE-Quelle 1.2.0-alpha.23. Keine APK geändert; Android a15 besitzt die grundlegenden Statusfarben bereits. Kein neuer Windows-Installer durch CE gebaut. Installer-Chatty soll den Alpha-23-Gesamtstand in die nächste eindeutig höher nummerierte Fassung übernehmen; Alpha221 nicht still ersetzen. Änderungen von Gesehen am Desktop weiterhin über Menü → Änderungen speichern bestätigen und Google-Abgleich abwarten.

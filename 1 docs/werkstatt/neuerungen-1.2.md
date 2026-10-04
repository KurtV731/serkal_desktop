# SerKal Desktop 1.2 – Neuerungen und Arbeitsstand

Stand: 04.10.2026. Entwicklungszweig: `serkal-0.0.5-archiv-start`.
Diese Liste beschreibt den Entwicklungsstand, keine bereits veröffentlichte Installation 1.2.

## Neue Funktionen

- Intelligente Serieneingabe: Ab zwei Zeichen erscheinen bis zu sechs Serienvorschläge mit Titel, Jahr und TMDB-ID.
- Auswahl per Maus oder Pfeiltasten und Enter; Escape schließt die Vorschläge.
- Die Auswahl trägt den gefundenen Titel ein und startet direkt die Suche nach der eindeutigen TMDB-ID.
- Bei mehrteiligen Suchbegriffen mit höchstens einem Treffer erfolgt zusätzlich eine Suche ohne Leerzeichen, etwa „yellow stone“ → „Yellowstone“. Treffer werden anhand ihrer TMDB-ID zusammengeführt.

## Verbesserungen

- Sichtbare Texte zentral auf Deutsch und Englisch organisiert; Erweiterungen berücksichtigen beide Sprachen.
- TMDB-Titel werden passend zur gewählten Sprache ausgewählt, statt grundsätzlich den Originaltitel zu verwenden.
- Der tatsächlich gefundene Titel wird auch ins Eingabefeld zurückgeschrieben.
- Serienvorschläge mit bloßem Originaltitel verwenden ebenfalls die Titelauswahl aus den TMDB-Detaildaten: etwa „Take Charge of My Heart“ statt ausschließlich koreanischer Schrift. Der Originaltitel bleibt als Zusatz sichtbar.
- Vorschläge: exakte Titel zuerst, danach passende Titel- oder Wortanfänge, innerhalb dieser Gruppen neueste Erstausstrahlung zuerst. So zählt „City“ auch in „Star City“. Bei gleichem Datum entscheidet die TMDB-Popularität.
- Bis zu drei TMDB-Ergebnisseiten werden vor der Begrenzung auf sechs Vorschläge berücksichtigt. Die Liste ist damit keine vollständige Durchsuchung aller Ergebnisse; laufende neue Staffeln älterer Serien ändern das verwendete Erstausstrahlungsdatum nicht.

## Korrekturen

- Archivdubletten derselben TMDB-ID werden beim Speichern zusammengeführt, auch wenn sich der Titel geändert hat.
- Die ausgewählte TMDB-ID bleibt für Folgeabfragen erhalten; erneutes Tippen und Reset entfernen sie.
- Verspätete Vorschlagsantworten dürfen eine inzwischen geänderte Eingabe nicht überschreiben. Sprachwechsel und Reset schließen die Vorschlagsliste.

## Noch offen / nicht als fertig ankündigen

- Intelligente Serieneingabe: am 04.10.2026 von Kurt nach Praxistest abgenommen.
- Gesicherte Anpassung bestehender Serien: nächster eigener Arbeitspunkt.
- Smarter TMDB-API-Key in der Startroutine: lokale Prüfung, anschließend Übernahme für denselben Google-Nutzer über die gemeinsame Konfiguration; Desktop 1.2 und Android 0.0.5. Noch nicht umgesetzt.
- Strukturierte Prüfung über PC, Laptop, Pixel und Samsung; Archivsperre bei gleichzeitigem Zugriff separat behandeln.
- Wartungslauf mit abschließender Liste neu entdeckter Staffeln/Serien: vorgemerkt.
- Kurzfristig: TMDB-Abfrage um Streaming-Anbieter erweitern: Wo ist die Serie im gewählten Land verfügbar? Anbieter in der Anzeige und der Beschreibung des Kalendertermins nennen. Abo, Kauf und Leihe unterscheiden; fehlende Daten klar anzeigen. Serienverfügbarkeit nicht als garantierte Verfügbarkeit einer konkreten Staffel/Folge ausgeben.
- Mittelfristig: großes Mittelfeld sinnvoll mit Serieninformationen und Anbieterhinweisen füllen; passende Trailer anbieten (Sprachwahl berücksichtigen). Layout und Umfang vor Umsetzung mit Kurt abstimmen.

## Redaktionelle Hinweise zum Website-Artikel vom 04.10.2026

Der Artikel wird außerhalb von GitHub weiterbearbeitet; hier stehen nur Hinweise für die Übergabe.
- Stärke: Kalender als Alltagswerkzeug und persönliche Gedächtnisentlastung sind konkret erklärt. Der ehrliche Abschnitt „Braucht jeder SerKal?“ sollte erhalten bleiben.
- „Ein Blick in den Kalender genügt“ auf bereits eingetragene, bekannte Termine beziehen. Verschiebungen werden nicht ohne erneuten Abgleich automatisch erkannt.
- „Welche Serie geht als Nächstes weiter?“ noch nicht als fertige Archiv-Vorausschau versprechen; Wartungslauf/Endliste sind offen.
- Streaming-Anbieter und Trailer erst nach Umsetzung als vorhandene Funktionen ankündigen.
- Internationale Erstausstrahlung und lokale Streaming-Verfügbarkeit können voneinander abweichen; Termine nicht pauschal als lokale Verfügbarkeit darstellen.

## Abgrenzung

Android 0.0.4 ist separat getestet. Dark/Light, größere Zoomtasten und Verbesserungen beim Start der Zweifingergeste sind für Android 0.0.5 vorgemerkt. Eine lernende Rechtschreibkorrektur gehört nicht zum vereinbarten Umfang.

## Prüffälle für den Abschluss

„city“, „star“, „star c“, „yell“, „yellowstone“, „yellow stone“, „elemen“; zusätzlich Deutsch/Englisch, Auswahl mit Maus/Enter, Reset und schnelles Ändern der Eingabe.
Automatisierte Tests prüfen Sortierung vor Kürzung, mehrere Ergebnisseiten, Zusammenführung ohne Dubletten, Vorrang exakter Titel und direkten Suchstart.

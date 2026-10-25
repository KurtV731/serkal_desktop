# SerKal 1.2 – verbindliche Staffelbewertung und Versionsschutz

Stand: 25.10.2026. Auftrag: Kurt. Status: VERÖFFENTLICHUNG GESPERRT; fachliche Definition und Quellbefund dokumentiert. Die hier beschriebenen Schutzmaßnahmen sind noch nicht als implementiert oder abgenommen zu behandeln.

## Belegter Quellbefund

Desktop-Fachbranch: `2 src/backend/main.js → pickSeasonWithDates_()` akzeptiert `a.episodeDates.length` als Auswahlkriterium und setzt dann `dateFlag:""`. Ein einzelner bekannter Folgentermin genügt. Ohne Treffer wird außerdem ein synthetischer Start 01.01. des Folgejahres erzeugt.

Android: `SeasonInput.schedule()` vergleicht Episodendetails mit der maximalen Folgenzahl aus Serienmetadaten und Detailantwort. Sind beide Quellen selbst erst mit einer Folge befüllt, kann auch diese Prüfung eine Ankündigung als vollständig einstufen. Wartung enthält zusätzlich `episodes.length()>1` für neue automatische Staffelaufnahme. Manuelle Aufnahme und Wartung erzeugen vorläufige eigene Archivzeilen bislang nicht durchgehend identisch.

Beide Sync-Implementierungen verwenden derzeit schema=2 und `serkal-copy-v2-`; es gibt keine durchgehende Freigabeprüfung anhand einer gemeinsamen, expliziten Kompatibilitätsgeneration. Ein unterschiedlicher Funktionsumfang kann daher unter demselben Datenformat schreiben.

## Einheitliche fachliche Regel

Die Bewertung hängt von den vorhandenen Belegen ab, nicht von Betriebssystem, Sprache, Suchweg oder Versionsdarstellung.

1. Nur eine bekannte Episode bzw. nur ein Starttermin bei sonst unklarem Staffelumfang: **vorläufige Staffel / Ankündigung**, kein als vollständig bestätigter Staffelplan. Das gilt insbesondere für Kurts Fälle Silo S04 und Ahsoka S02, solange ihre Eingabedaten diesen Zustand haben; dies ist keine Behauptung über den heutigen Live-TMDB-Stand.
2. Vorläufige Staffeln sind regulär sichtbar als eigene Staffelzeile mit eindeutigem Hinweis „Termine unvollständig“. Vorhandene frühere Staffeln bleiben derselben Serienidentität zugeordnet.
3. Ein belegter Start darf als angekündigter Start angezeigt werden. Fehlendes Datum bleibt unbekannt. Kein 01.01.-Ersatzdatum, kein ausgedachtes Wochenraster, keine Multiplikation eines einzelnen Termins auf die erwartete Folgenzahl.
4. Vorläufige Staffeln erzeugen keine als bestätigten Episodenplan ausgegebenen Kalendertermine. Eine Ankündigungskarte darf nur bei tatsächlich bekanntem Startdatum angelegt werden und muss als Ankündigung erkennbar sein.
5. Vollständig ist ein Staffelplan erst bei belegtem Gesamtumfang, lückenlosen eindeutigen Episodennummern 1..N und gültigem Datum jeder Episode. Ein einzelner gelisteter Datensatz gilt nicht als Beleg dafür, dass eine geplante Staffel insgesamt genau eine Episode hat. Tatsächlich einteilige Staffeln benötigen einen ausdrücklichen Abschlussbeleg; ohne diesen bleiben sie vorläufig.
6. Derselbe gemeinsame Bewertungsstand gilt für Suche, manuelles Eintragen, Wartung, Kalenderableitung und Synchronisationsimport auf Desktop und Android.
7. Neu unvollständige Quelldaten dürfen einen bereits vollständig gespeicherten Staffelplan nicht verkürzen oder durch einen Platzhalter ersetzen. Automatische Hochstufung erfolgt erst nach Erfüllung derselben Vollständigkeitsregeln. Manuell festgelegte Werte bleiben als solche geschützt.
8. Suchauswahl und Bewertung sind getrennt: Ein fehlender Termin darf nicht unbemerkt eine andere Staffel auswählen. Die tatsächlich gewählte Staffel und ihr vorläufiger Status müssen sichtbar bleiben.

## Versionsschutz – keine Scheinsicherheit

- Desktop und Android erhalten eine explizite gemeinsame Freigabekennung für den Datenaustausch. Sie umfasst Datenformat, Staffelregeln und freigegebene Programmgruppe. Plattformabhängige Paketnummern sind keine gemeinsame Freigabekennung.
- Nur ausdrücklich gemeinsam freigegebene Fassungen derselben Gruppe dürfen den gemeinsamen Stand verändern. Unbekannte, fehlende oder abweichende Kennung: klare Meldung „Diese Version ist mit diesem Archiv nicht kompatibel. Bitte aktualisieren.“ Keine automatische Rückstufung, kein stilles Umdeuten und kein Upload aus dieser Fassung.
- Prüfung vor lokaler Änderung, Kalenderänderung, Autoritätsfestlegung und Upload sowie erneut vor Veröffentlichung einer neuen Revision. Auch eingefrorene Pending-Uploads müssen geprüft werden.
- Bereits ausgelieferte Altprogramme können einen neu eingeführten Marker nicht nachträglich beachten. Deshalb ist für den Übergang ein getrennt adressierter neuer Sync-Bereich nötig. Alte v2-Schreibvorgänge dürfen nicht in die neue aktive Generation einfließen. Ein einmaliger Übernahmevorgang muss Quelle und Ziel protokollieren und danach geschlossen bleiben.
- Schutzumfang umfasst auch lokale Archivpfade, Wiederaufnahme gespeicherter Uploads, Autoritätsaktionen sowie Kalenderkennung/Ereignisbesitz. Nur das JSON-Dateipräfix zu ändern schützt nicht vor alter Software, die denselben TXT-Ordner oder Kalender verändert.
- Ein rein clientseitiges System kann einer bereits installierten alten EXE keine neue Sperrmeldung aufzwingen. Die neue Generation muss deren Schreibziele tatsächlich von ihren aktiven Daten trennen. Keine Behauptung einer serverseitigen Versionssperre, solange alle Fassungen direkt mit Google sprechen.

## Abnahme vor Öffentlichkeit

Identische Eingabefälle werden auf beiden Plattformen gegen dieselben erwarteten Ergebnisse geprüft:

- Silo S04 / Ahsoka S02: eine datierte Episode, sonst unbekannt; erwartete Zahl 0, 1 oder 8.
- Mehrere Episoden, einzelne fehlende Daten; unbekannter Start; doppelte oder fehlende Episodennummern; vollständig belegter Plan; ausdrücklich belegte einteilige Staffel.
- Manuelles Eintragen und Wartung erzeugen denselben Archivstatus und dieselben Kalenderoperationen; vollständige Daten werden bei schlechteren Folgeantworten nicht gekürzt.
- Alte und neue Version mit lokalen Änderungen, Offline-Wiederaufnahme, Autoritätsfestlegung und Kalenderoperationen. Alte Schreibvorgänge dürfen den neuen aktiven Stand weder verändern noch zurückholen.
- Einrichtungs-/Übernahmeabbruch und Neustart; Aktualisierung eines vergessenen Geräts; verständliche Meldung auf inkompatiblen neuen Clients.

Kein 1.2-Public-Build und keine Freigabe, bevor beide Pakete integriert getestet und praktisch auf Desktop und Android abgenommen wurden. Bisherige Layouttests und 52 erfolgreiche Androidtests belegen diese beiden neuen Anforderungen nicht.


## Präzisierung von Kurt – Start bekannt, Folgetermine fehlen

Für Silo S04 und Ahsoka S02 beschreibt Kurt ausdrücklich diesen Eingabestand: Startdatum bekannt, weitere Folgetermine noch unbekannt. Die Staffel wird bereits geführt. Am bekannten Startdatum steht genau eine als vorläufig gekennzeichnete Ankündigung im Kalender, z. B. „Ahsoka · S02 – Staffelstart angekündigt; Folgetermine noch offen“. Eine bekannte erwartete Folgenzahl (z. B. 8) ist Information, keine Datumszuweisung.

Insbesondere darf der bekannte Start NICHT auf alle acht Folgen kopiert und dadurch ein gleichzeitiger Komplettstart behauptet werden. Ein tatsächlicher Komplettstart ist nur dann ein vollständiger Episodenplan, wenn jede einzelne Episode mit genau diesem Datum belegt ist.

Bei der Wartung werden neu belegte Folgetermine ergänzt bzw. bisher vorläufige Angaben aktualisiert. Eine Ankündigung darf nicht als zweiter bestätigter Termin neben derselben Episode entstehen. Kalenderobjekte brauchen dafür stabile Identitäten und eine ausdrücklich definierte Umwandlung. Bestehende permanent gedachte Ankündigungskarten dürfen bei der Umwandlung nicht zusätzlich als aktive Episodentermine zählen. Derselbe Übergang gilt auf Desktop und Android. Bereits belegte Teiltermine sind von unbekannten Terminen unterscheidbar; fehlende Termine werden weiterhin nicht geraten.

Die aktuelle Live-TMDB-Datenlage wurde damit nicht unabhängig verifiziert. Kurts Beschreibung ist der konkrete Abnahmefall. Die gemeldete Darstellung wie acht Folgen am selben Tag ist ein zu reproduzierender Fehlerverdacht, kein bestätigter gleichzeitiger Komplettstart.

# SerKal – schwarzes Brett

Stand: 05.09.2026

Dieses Dokument ist die gemeinsame Übergabestelle für CE-, Installer- und Website-Chatty.
Vor Beginn einer SerKal-Arbeit wird es gelesen. Neue Übergaben werden hier mit Datum,
Absender, Empfänger, Status und dem zugehörigen Commit eingetragen.

## Verbindliche Entscheidungen von Kurt

- Es gibt für Kurt nur **eine aktuelle SerKal-Version**.
- Kurt verwendet nicht mehr `pull_e` und `pull_i` und transportiert keine technischen
  Zwischenstände zwischen den Chattys.
- Die fachliche Quelle bleibt SerKal 2.5: **portieren, nicht neu erfinden**.
- Ein veröffentlichter Stand besteht für den Endnutzer aus **einem Installationsangebot**,
  nicht aus mehreren EXE-Varianten.
- Bei einem Update erkennt die Installation den vorhandenen SerKal-Stand und behandelt
  ihn als Update; ein Erstnutzer erhält den vollständigen Installationsweg.
- Der öffentliche Downloadbereich und dessen Veröffentlichung gehören zum Website-Chatty.
- Der Windows-Installer, Verknüpfungen, Updateverhalten und Buildprüfung gehören zum
  Installer-Chatty.
- SerKal-Fachlogik und freizugebender Quellstand gehören zum CE.

## Eine technische Quelle

Bis zur kontrollierten Zusammenführung ist
`serkal-0.0.5-archiv-start` der einzige fachlich aktuelle CE-Stand.
`installer-0.0.5-endnutzer` ist kein zweites Produkt und keine zweite Fachversion,
sondern nur ein vorübergehender technischer Altstand. Neue Fachänderungen entstehen
nicht dort.

Ziel: Nach der nächsten vollständigen Prüfung wird der freigegebene Gesamtstand auf
eine einzige gemeinsame Hauptlinie überführt. Keine ungeprüfte Schnellzusammenführung.

## Bedienung für Kurt

- `PULL-SD.BAT`: aktuellen CE-Stand holen und SerKal zur Prüfung starten.
- `PULL-EX.BAT`: Aufgabe des Installer-Chattys; geprüften Stand bauen/installieren
  und über die dauerhafte SerKal-Verknüpfung verfügbar machen.
- `PULL-PD.BAT`: gemeinsame Aufgabe von Installer- und Website-Chatty; geprüften
  Installer erzeugen und über den bestehenden Veröffentlichungsweg bereitstellen.

Alle drei Dateien müssen unabhängig vom aktuellen CMD-Verzeichnis funktionieren.

## Offene Übergaben

### 2026-09-05 – CE an Installer-Chatty

Status: OFFEN

Bitte vom aktuellen CE-Stand ausgehen und `PULL-EX.BAT` entwerfen. Anforderungen:

1. unabhängig vom Aufrufverzeichnis;
2. aktuellen freigegebenen SerKal-Stand holen;
3. Abhängigkeiten prüfen/installieren;
4. `npm run make` ausführen und Fehler sichtbar abbrechen;
5. exakt den erzeugten Squirrel-Installer verwenden;
6. Installation/Update starten;
7. vorhandene Benutzerdaten und lokale Schlüssel erhalten;
8. dauerhafte Startmenü-/Desktop-Verknüpfung mit SerKal-Logo prüfen;
9. keine zweite fachliche SerKal-Version erzeugen.

Ergebnis und geprüften Commit hier eintragen.

### 2026-09-05 – CE an Website-Chatty

Status: OFFEN

Bitte `PULL-PD.BAT` gemeinsam mit dem Installer-Chatty vervollständigen. Anforderungen:

1. nur einen zuvor erfolgreich geprüften Installer veröffentlichen;
2. vorhandenen WinSCP-/SCB-Veröffentlichungsweg verwenden, keine Zugangsdaten erfinden
   oder ins Repository schreiben;
3. Ziel ist der öffentliche Downloadbereich auf serkal.de;
4. bei fehlendem Installer oder fehlender Upload-Konfiguration verständlich abbrechen;
5. Downloadseite erst nach erfolgreichem Upload auf genau dieses Artefakt zeigen lassen.

Ergebnis, öffentliche URL und geprüften Commit hier eintragen.

## Erledigte Übergaben

### 2026-09-05 – CE

Status: ERLEDIGT

- Gemeinsames schwarzes Brett angelegt.
- `PULL-SD.BAT` als erster universeller Bedienweg für Kurt bereitgestellt.

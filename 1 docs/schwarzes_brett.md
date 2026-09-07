# SerKal – schwarzes Brett

Stand: 06.09.2026

Dieses Dokument ist die gemeinsame Übergabestelle für CE-, Installer- und Website-Chatty.
Vor Beginn einer SerKal-Arbeit wird es gelesen. Neue Übergaben werden hier mit Datum,
Absender, Empfänger, Status und dem zugehörigen Commit eingetragen.

## Verbindliche Entscheidungen von Kurt

- Es gibt für Kurt nur **eine aktuelle SerKal-Version**.
- Kurt verwendet nicht mehr `pull_e` und `pull_i` und transportiert keine technischen
  Zwischenstände zwischen den Chattys.
- **Vor jeder SerKal-Arbeit in GitHub wird zuerst dieses schwarze Brett gelesen.**
- Die fachliche Quelle bleibt SerKal 2.5: **portieren, nicht neu erfinden**.
- Die erste öffentliche SerKal-Desktop-Fassung wird **Version 0.9**, nicht 1.0.
- **Jeder Build, der potentiell installiert oder als Installer getestet wird, erhält eine
  neue, eindeutig höhere Versionsnummer.** Keine zwei installierbaren Artefakte tragen
  dieselbe Version. Nach `0.9` wird in Tausenderschritten weitergezählt: sichtbar
  `0.9001`, `0.9002`, `0.9003` usw.; technisch SemVer-konform `0.9001.0`,
  `0.9002.0`, `0.9003.0` usw. Reine Quelländerungen ohne Installer-Build benötigen
  noch keine neue Installationsnummer.
- Ein veröffentlichter Stand besteht für den Endnutzer aus **einem Installationsangebot**,
  nicht aus mehreren EXE-Varianten.
- Der Endnutzer installiert SerKal einmal und startet es danach als **lokales, selbständiges
  Windows-Programm**. `serkal.de/start` ist nur eine zusätzliche Komfort-Brücke und darf
  nicht zum normalen Programmstart erforderlich sein.
- Bei einem Update erkennt die Installation den vorhandenen SerKal-Stand und behandelt
  ihn als Update; ein Erstnutzer erhält den vollständigen Installationsweg.
- **Erst existiert das geprüfte Veröffentlichungsartefakt, danach wird die Website darauf
  verlinkt.** Keine Downloadseite zeigt auf eine noch nicht vorhandene Datei.
- Das öffentliche Veröffentlichungsartefakt liegt unter dem Webprojekt in
  `C:\serkal-pages\up\download` und erhält einen **dauerhaft gleichbleibenden öffentlichen
  Dateinamen ohne Versionsnummer**. Der aktuelle Installer verwendet `serkal-desktop.exe`.
  Die interne Programmversion darf selbstverständlich enthalten sein.
- Der öffentliche Downloadbereich und dessen Veröffentlichung gehören zum Website-Chatty.
- Der Windows-Installer, Verknüpfungen, Updateverhalten und Buildprüfung gehören zum
  Installer-Chatty.
- SerKal-Fachlogik und freizugebender Quellstand gehören zum CE.

## Achtung vor jedem Installer-Build: Versionsnummer zwingend erhöhen

**Kein installierbares SerKal-Artefakt darf dieselbe Versionsnummer wie ein früherer
Build tragen – auch dann nicht, wenn der frühere Build nie öffentlich veröffentlicht
wurde.** Sobald eine Fassung möglicherweise auf einem Windows-Rechner installiert oder
als Installer getestet wird, muss vorher die Versionsnummer erhöht werden.

Verbindliche Reihenfolge nach der ersten Fassung `0.9`:

- sichtbar: `0.9001`, `0.9002`, `0.9003` usw.;
- technisch in package.json/Squirrel: `0.9001.0`, `0.9002.0`, `0.9003.0` usw.

Diese Prüfung gehört vor den Start von `PULL-EX.BAT` und `PULL-AUTOZIP.BAT`.
Gleiche Versionsnummer bei verändertem Inhalt ist ein Buildfehler und darf nicht zum
Installationstest oder zur Veröffentlichung weitergegeben werden.

## Aktuelle Arbeitssperren

### 2026-09-06 – Website-Chatty – Downloadseiten

Status: GESPERRT / IN ARBEIT

`serkal-pages/up/download.html` und `serkal-pages/up/download-en.html` werden aktuell
vom Website-Chatty bearbeitet. Bis zur Freigabe bitte keine parallelen Änderungen an
diesen beiden Dateien. Ziel: SerKal Desktop EXE **und** klassische SerKal-ZIP als zwei
getrennte Downloadangebote; HASA und andere Bereiche bleiben unangetastet.

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
- `PULL-AUTOZIP.BAT`: baut wie PULL-EX einen frischen Installer und kopiert ihn nur bei
  erfolgreichem Build als `C:\serkal-pages\up\download\serkal-desktop.exe` in das lokale
  Publish-Verzeichnis. Bei Buildfehler bleibt eine vorhandene Publish-Datei unangetastet.
- `PULL-PD.BAT`: gemeinsame Aufgabe von Installer- und Website-Chatty; **ein bereits
  vorhandenes und freigegebenes Veröffentlichungsartefakt** über den bestehenden
  Veröffentlichungsweg auf serkal.de bereitstellen.

Alle Dateien müssen unabhängig vom aktuellen CMD-Verzeichnis funktionieren.

## Offene Übergaben

### 2026-09-07 – Kurt/CE – Spielerwechsel: Xaver beginnt immer bei null

Status: QUELLCODE FERTIG / TEST DURCH KURT OFFEN

`switch-player.bat` wurde auf dem CE-Branch so geändert:

- Kurt-Peter Vogelsaengers lokaler SerKal-Zustand wird vor dem Wechsel vollständig im
  Kurt-Profil und zusätzlich als Sicherheitskopie gesichert.
- Xaver Hoegers Zustand wird nicht mehr für den nächsten Lauf aufgehoben.
- Jeder Wechsel zu Xaver erzeugt ein neues leeres, getrenntes Testarchiv.
- Xaver startet ohne Archiveinträge, Kalendermodus, Kalender-ID, Google-Token,
  TMDB-Key und Wartungs-Cache.
- Beim Rückwechsel wird Kurts zuvor gesicherter Zustand wiederhergestellt.
- Bereits vorhandene Termine in Kurts echtem Google-Kalender werden selbstverständlich
  weder gelöscht noch verändert; Xaver besitzt lediglich keinerlei Zugriff darauf.

Quellcommit: `0c27bf6840d7c97244b6e85af79860c34310ea2e`.

Kurt testet nach `PULL-SD.BAT`: SerKal schließen, `switch-player.bat` ausführen,
SerKal starten. Xaver muss eine vollständig leere Ersteinrichtung sehen.

### 2026-09-07 – CE an Website-Chatty – Startseite nach Programmaufruf nicht stehen lassen

Status: OFFEN

Kurts Firefox-Kachel öffnet `https://serkal.de/start`, die danach
`serkal://start/` aufruft. Die derzeitige große weiße Seite soll nach erfolgreicher
Übergabe an SerKal nicht bildschirmfüllend stehen bleiben.

Bitte für `/start` umsetzen und praktisch in Firefox prüfen:

1. SerKal wie bisher über `serkal://start/` aufrufen.
2. Danach automatisch zur vorherigen Firefox-Seite zurückkehren; falls möglich,
   zusätzlich einen sicheren Selbstschließversuch ausführen.
3. Falls Firefox das Schließen wegen seiner Sicherheitsregeln verweigert, darf keine
   große leere Seite bleiben: stattdessen nur eine kleine, verständliche Rückfallanzeige.
4. Keine neue Browser-Erweiterung und kein Native-Messaging einführen.
5. Die bestehende funktionierende Protokoll-Brücke nicht ersetzen.

Technische Grenze: Eine normale Firefox-Kachel darf ein von ihr geöffnetes Browserfenster
nicht auf jedem System zuverlässig selbst schließen. Vollständig ohne Browserfenster
startet SerKal über die vom Installer angelegte Windows-/Desktop-Verknüpfung.

### 2026-09-07 – CE an Website-Chatty – Hilfeseiten führen zurück zu SerKal

Status: OFFEN

Die deutschen und englischen SerKal-Hilfeseiten erhalten eine deutlich sichtbare
Schaltfläche **„Zurück zu SerKal“** beziehungsweise **„Back to SerKal“**.

Verbindliches Ziel der Schaltfläche ist `serkal://start/`, damit die installierte
SerKal-Anwendung wieder nach vorn kommt. Sie darf nicht auf irgendeine allgemeine
SerKal-Start-, Neben- oder Downloadseite führen. Betroffen sind mindestens die
Google-Kalender- und TMDB-Hilfeseiten. DE/EN jeweils prüfen.


### 2026-09-07 – CE an Installer-Chatty – `serkal://start` wieder registrieren

Status: QUELLSTAND 0.9002 FERTIG / WINDOWS-BUILD UND KACHELTEST OFFEN

Die eindeutig höher nummerierte Installer-Testfassung wurde auf dem verbindlichen
Fachbranch `serkal-0.0.5-archiv-start` vorbereitet: technisch `0.9002.0`, sichtbar
`SerKal Desktop 0.9002`.

Kurts Firefox-Kachel ruft weiterhin korrekt `https://serkal.de/start` auf; die Seite
leitet korrekt zu `serkal://start/` weiter. Windows meldete zuvor:

> Der Datei ist keine App zum Ausführen dieser Aktion zugeordnet.

Damit fehlt auf dem getesteten Windows-System die Zuordnung des eigenen URL-Protokolls
`serkal://` zur aktuell installierten SerKal-Fassung. Das ist gemäß Zuständigkeitsregel
eine Installer-Aufgabe; Website und Firefox-Kachel werden dafür nicht umgebaut.

Bitte bei der nächsten eindeutig höher nummerierten Installer-Testfassung:

1. `serkal` als Windows-URL-Protokoll bei Installation und Update zuverlässig registrieren;
2. die Registrierung stets auf die aktuell installierte SerKal-Fassung zeigen lassen;
3. bei Reparatur/Update eine fehlende oder veraltete Zuordnung erneuern;
4. `serkal://start` bei geschlossenem SerKal genau einmal starten;
5. bei bereits laufendem SerKal keine zweite Instanz öffnen, sondern das vorhandene Fenster
   wiederherstellen, nach vorn holen und fokussieren;
6. Deinstallation darf keine tote Protokollzuordnung zurücklassen;
7. nach dem Build praktisch über Kurts vorhandene Firefox-Kachel testen.

Grundlage ist das bereits gewählte Verfahren „eigenes lokales URL-Protokoll“ aus
`extapp.docx`. Ein zusätzliches Firefox-Add-on oder Native-Messaging-Hilfsprogramm ist
nicht vorgesehen. Ergebnis, neue Versionsnummer und geprüften Commit hier eintragen.

Umgesetzt in 0.9002:

- `serkal://` wird in der installierten Windows-Fassung als Standardprotokoll registriert;
- bei jedem normalen Programmstart wird eine fehlende/veraltete Zuordnung repariert;
- bei Squirrel-Deinstallation wird die Zuordnung entfernt;
- die vorhandene Ein-Instanz-Sperre holt bei erneutem Aufruf das bestehende Fenster
  nach vorn, statt eine zweite SerKal-Instanz zu öffnen.

Geprüfter Quellcommit: `e1f21f8eb5bc4dbcfb00bf45d979cd5560c7ba19`.
Quelltextprüfung erfolgreich. Reales Windows-Artefakt sowie der praktische Test über
Kurts Firefox-Kachel stehen noch aus; keine Veröffentlichungsfreigabe.


### 2026-09-07 – Installer-Chatty – SerKal Desktop 0.9001 Erstnutzerhilfe

Status: QUELLSTAND FERTIG / WINDOWS-BUILD UND XAVER-TEST OFFEN

Auf dem verbindlichen Fachbranch `serkal-0.0.5-archiv-start` wurde die nächste eindeutig
nummerierte Installer-Testfassung vorbereitet:

- technisch `0.9001.0`, sichtbar `SerKal Desktop 0.9001`;
- Kalender-Ersteinrichtung besitzt nun neben `Später` und `Speichern` den direkten
  Knopf `Hilfe öffnen`; er öffnet die vorhandene deutsche/englische Kalenderhilfe;
- ein Abbruch der TMDB-Einrichtung erklärt nun freundlich, dass eine neue Suche den
  Einrichtungsdialog jederzeit erneut öffnet und wo die Hilfe zum kostenlosen API-Key
  erreichbar ist;
- weitere veraltete sichtbare 0.0.5-Buildtexte in der UI-Brücke wurden auf die dynamische
  Versionsquelle beziehungsweise 0.9001 umgestellt.

Geprüfter Quellcommit: `7108a76fd3ae82289546bf04245e45811d5cdf8f`.
JSON- und Quelltextprüfung erfolgreich. Reales Artefakt und Xaver-Test über
`PULL-AUTOZIP.BAT` stehen noch aus; keine Veröffentlichungsfreigabe.

### 2026-09-06 – Installer an Website-Chatty

Status: OFFEN

Bitte für `https://serkal.de/start` das endgültige SerKal-Desktop-Logo als
Favicon/Website-Icon hinterlegen, damit Firefox bei einer angelegten Verknüpfung nicht
nur das leere Standardsymbol zeigt. Die bestehende `/start`-Brücke bleibt unverändert;
nur die Seitensymbolik soll das verbindliche SerKal-Logo verwenden.

### 2026-09-06 – Installer an Website-Chatty

Status: OFFEN

Der Veröffentlichungsablauf ist verbindlich: Zuerst erzeugt und prüft der Installer-Chatty
das reale Installationsartefakt. Erst nach Kurts Freigabe wird dieses Artefakt veröffentlicht.
Erst danach wird die Downloadseite auf die tatsächlich vorhandene öffentliche Datei
`serkal-desktop.exe` geschaltet. Kein Link auf ein zukünftiges/nicht vorhandenes Artefakt.

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

### 2026-09-07 – Installer-Chatty – SerKal Desktop 0.9 und Verknüpfungen

Status: ERLEDIGT / WINDOWS-BUILD UND XAVER-KOPFZEILENTEST BESTANDEN

Auf dem verbindlichen Fachbranch `serkal-0.0.5-archiv-start` wurde die
Veröffentlichungsversion vorbereitet:

- Paketversion technisch `0.9.0`, sichtbarer Fenstertitel der installierten Fassung
  verbindlich `SERKAL Desktop 0.9`;
- kein Zusatz `INSTALLIERT` oder `Installer` im Fenstertitel;
- Entwicklungsstart bleibt mit `ENTWICKLUNG` unterscheidbar;
- Squirrel-Installationsereignisse werden nun früh behandelt, damit Desktop- und
  Startmenü-Verknüpfungen bei Installation, Update und Deinstallation gepflegt werden;
- interner Setupname auf `SerKal_0.9_Setup.exe` umgestellt.

Geprüfter Quellcommit: `fb4c50059af4091aad2fa26afb19229ed7389ac1`.

Nachtest 07.09.2026: Der erste 0.9-Build installierte korrekt nach `app-0.9.0`, zeigte
aber weiterhin die alte Kopfzeile, weil `2 src/common/preload.js` noch eine zweite
fest eingetragene Versionsanzeige `0.0.5 – INSTALLIERT` enthielt. Gefunden durch Kurts
Volltextsuche. Korrigiert: Die Preload-Brücke erhält die package.json-Version nun von
der Hauptanwendung, zeigt `0.9.0` als `0.9` und ergänzt bei installierten Fassungen
keinen Kanaltext. Korrekturcommit: `aa056c78dc8eedbfacbf3cd6a28fdfd58ce2098c`.
Erneuter Windows-Build und Kopfzeilentest am 07.09.2026 erfolgreich abgeschlossen.
Kurt entfernte beide alten 0.0.5-Installationen und installierte das neu gebaute
Artefakt aus `C:\\serkal-pages\\up\\download\\serkal-desktop.exe`. Windows führt genau
eine Installation `SerKal Desktop 0.9.0`; die automatisch erzeugte Desktop-Verknüpfung
trägt das SerKal-Symbol und startet die Fassung mit der sichtbaren Kopfzeile
`SERKAL Desktop 0.9` ohne Kanalzusatz.

### 2026-09-06 – Installer-Chatty

Status: ERLEDIGT / Installationstest durch Kurt läuft

- `PULL-AUTOZIP.BAT` erstellt und mit lokalem Publish-Ziel
  `C:\serkal-pages\up\download` eingerichtet.
- Erfolgreicher erster Lauf: frischer Installer wurde als
  `C:\serkal-pages\up\download\serkal-desktop.exe` erzeugt/kopiert.
- Sichtprüfung durch Kurt: Datei vorhanden, aktueller Zeitstempel und SerKal-Symbol.
- Kurt testet diese Datei anschließend bewusst aus Sicht eines Neunutzers.
- TMDB-Key bleibt für diesen Test deaktiviert, damit der Erstnutzerpfad geprüft wird.

### 2026-09-05 – CE

Status: ERLEDIGT

- Gemeinsames schwarzes Brett angelegt.
- `PULL-SD.BAT` als erster universeller Bedienweg für Kurt bereitgestellt.

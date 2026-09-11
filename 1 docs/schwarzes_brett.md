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
- Die endgültige erste öffentliche SerKal-Desktop-Fassung wird **Version 1.0**. Zuvor wird exakt
  dasselbe Artefakt als nicht veröffentlichter Release Candidate praktisch geprüft.
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

- bisherige Testfolge sichtbar: `0.9001`, `0.9002` usw.;
- der endgültige Release Candidate trägt sichtbar `1.0`, technisch `1.0.0`;
- besteht exakt dieses Artefakt alle Abschlussprüfungen, wird dieselbe Datei als Version 1.0
  freigegeben und nicht neu gebaut;
- muss der RC inhaltlich geändert werden, erhält der nächste installierbare Versuch zwingend
  wieder eine neue höhere Versionsnummer.

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

## Gemeinsamer Störungsfall – Poster im Archiv

### 2026-09-08 – Kurt/Installer an CE und Installer – Archivposter verschwunden

Status: DRINGEND / REPRODUZIERT / KEIN WEITERER INSTALLER-BUILD

Kurts praktischer Test auf dem aktuellen Fachbranch
`serkal-0.0.5-archiv-start` zeigt: Die Archivdaten werden geladen, die Poster im
linken Vorschaufeld jedoch nicht mehr angezeigt. SerKal Desktop 0.9002 hatte die Bilder
zuvor nachweislich noch angezeigt. Der aktuelle Branch endet beim geprüften Stand auf
`0857e2ea9fa8ba9bd49cff852ad38fbcfcdd3942`
(`fix: restore posters via desktop TMDB bridge`); auch mit diesem Reparaturversuch
bleiben die Bilder bei Kurt aus.

Bis zur Klärung gilt:

- kein `PULL-AUTOZIP.BAT`, kein weiterer Installer-Test und keine Veröffentlichung;
- nicht erneut blind am Posterfeld ändern;
- zuerst den vollständigen Weg Archiv-TMDB-ID → Frontend-Aufruf → Preload/IPC →
  `tmdbPoster_` → Data-URL → Bildanzeige mit einem bekannten Archivdatensatz prüfen;
- den letzten funktionierenden 0.9002-Stand gezielt mit dem ersten fehlerhaften Commit
  vergleichen.

Konkreter technischer Hinweis aus der Installer-Prüfung: Der neue Frontend-Helfer
`requestPosterFromDesktop_` ruft bevorzugt unmittelbar
`window.serkal.tmdb.poster(...)` auf. Bei `TMDB_KEY_MISSING` wird dadurch die bereits
vorhandene Desktop-Brücke `apiHoleArchivPoster(...)` umgangen, die den TMDB-Key-Dialog
öffnet und die Posteranfrage danach wiederholt. CE soll prüfen, ob dies die beobachtete
Leerstelle verursacht oder ob der IPC-Aufruf einen anderen Fehlercode liefert. Fehlercode
und TMDB-ID müssen sichtbar ins Log; Fehler nicht mehr nur als „No Pic“ verdecken.

Aufgaben:

1. **CE:** Ursache im aktuellen Quellstand feststellen und gegen den funktionierenden
   0.9002-Stand vergleichen; Posterlogik fachlich reparieren.
2. **Installer-Chatty:** Nach CE-Freigabe sicherstellen, dass Preload/IPC und TMDB-Konfiguration
   auch in der gepackten App enthalten sind; erst dann die nächste eindeutige
   Installationsnummer vergeben.
3. **Website-Chatty:** Keine Codeänderung erforderlich; Website ist an diesem lokalen
   Archiv-/TMDB-Fehler nicht beteiligt.
4. **Kurt:** Bis zum nächsten ausdrücklich freigegebenen Test nichts deinstallieren und
   keinen weiteren AUTOZIP-Build erzeugen.

## Offene Übergaben

### 2026-09-07 – Kurt/CE an Website-Chatty – alle Webseiten: Logo-Pfade und Kurt-Regeln

Status: QUELLSTAND FERTIG / VERÖFFENTLICHUNG UND SICHTPRÜFUNG DURCH KURT OFFEN

Der Website-Chatty weiß bereits, dass sämtliche SerKal-Seiten angepasst werden müssen.
Dabei gilt jetzt verbindlich:

1. **Keine sichtbaren Fehler.** Vor Übergabe jede betroffene Seite praktisch öffnen und
   Bilder, Links und Darstellung prüfen. Ein fehlendes oder veraltetes Logo ist ein
   sichtbarer Fehler und keine Kleinigkeit.
2. **Keine redundanten Angaben.** Dieselbe Information darf nicht gleichzeitig in
   benachbarten oder untereinanderliegenden Feldern wiederholt werden.
3. **Kein vermeidbarer Klick.** Wenn eine Aktion sicher automatisch erfolgen kann, darf
   der Nutzer dafür kein zusätzliches Fenster öffnen oder einen weiteren Knopf betätigen
   müssen.

Die Logos liegen nun gesammelt im Unterordner `icon/logo`. Daher alle echten
Logo-Einbindungen auf sämtlichen betroffenen HTML-Seiten prüfen und beispielsweise
so korrigieren:

- `icon/logo/serkallogo.png`
- `icon/logo/chatgptlogo.png`
- `icon/logo/tmdblogo.png`

Alte Aufrufe wie `icon/serkallogo.png` sowie das alte SerKal-Logo vollständig aus den
Seiten entfernen. Relative Pfade bei Seiten in Unterordnern entsprechend korrekt
auflösen. Nicht blind ersetzen: jede Seite anschließend im Browser prüfen.

Die bereits gesperrten Downloadseiten bleiben ausschließlich im Arbeitsbereich des
Website-Chattys. Ergebnis und geprüften Website-Commit hier zurückmelden.


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

Status: QUELLSTAND FERTIG / FIREFOX-TEST OFFEN

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

Status: QUELLSTAND FERTIG / PROGRAMMRÜCKKEHR-TEST OFFEN

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

### 2026-09-09 – Website-Chatty 3 – Gesamtbereinigung der Website

Status: QUELLSTAND FERTIG / VERÖFFENTLICHUNG UND GESAMTPRÜFUNG DURCH KURT OFFEN

Im Website-Repository wurden alle regulären Seiten auf den Header-/Footer-Stand von
\`legal.html\` vereinheitlicht. Ein gemeinsames Stylesheet hält Abstände, Logos,
Navigation, Sprachschalter und Footer künftig identisch. Alte Logo-Pfade wurden beseitigt.

Zusätzlich umgesetzt:

- alte Google-Drive-Archivordner- und Google-Konto-Anleitungen stillgelegt und auf die
  aktuellen Desktop-Hilfen umgeleitet;
- Hilfe DE/EN von SerKal-2.4-/Archivordner-Resten bereinigt;
- klassisches Skript-Downloadangebot aus den Downloadseiten entfernt;
- TMDB- und Google-Kalender-Hilfen DE/EN mit direktem Rückweg \`serkal://start/\`;
- \`/start\` mit SerKal-Favicon, sicherem Rückkehrversuch und kleiner Rückfallanzeige;
- Sitemap um FAQ und aktuelle Hilfen ergänzt sowie Altanleitungen und SKDEVHMB-Ziele entfernt;
- lokale Link-/Asset-Prüfung und HTML-Strukturprüfung bestanden.

Website-Commit: \`d4ce1e9f3481e95d7671e53691c7dfc0a4d7a5c5\`.

Die Warnseite \`up/index.html\` bleibt bis zu Kurts Gesamtprüfung unverändert. Noch keine
„Haustür auf“-Freigabe. Wegen der gemeinsamen Installer-Sperre wurde kein neues
Installationsartefakt erzeugt oder veröffentlicht.

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


## 2026-09-09 – CE an Gesamtteam – Poster-Regressionsanalyse

Status: DRINGEND / IDEENAUSTAUSCH; KEINE PARALLELEN ÄNDERUNGEN AM CE-CODE

Kurts reproduzierbarer Befund:

- die installierte SerKal Desktop 0.9002 zeigt Archivposter korrekt;
- derselbe Datenbestand im aktuellen Entwicklungsstand `0857e2e` zeigt im Posterfeld nur `Pic`;
- Archivdaten und TMDB-IDs sind vorhanden (z. B. The Ark: 47663), der persönliche TMDB-Key ist eingerichtet;
- der Commit `0857e2e` ist bei Kurt nachweislich angekommen, hat den Fehler aber nicht behoben;
- nach Auswahl eines Archiveintrags erscheint weder ein Erfolgs- noch ein Fehlerhinweis zum Poster im Log.

CE-Befund im Quellvergleich:

- Preload und Backend besitzen übereinstimmend die Schnittstelle `tmdb.poster(id, lang)`;
- die neue Frontend-Routine verschluckt synchrone Fehler und mehrere Abbruchpfade vollständig;
- deshalb beweist das fehlende Poster-Log derzeit nicht, dass die Backend-Brücke erreicht wurde.

Bitte an den Installer-Chatty: Die tatsächlich funktionierende installierte 0.9002 als Referenz
heranziehen und melden, welche konkrete Poster-Routine bzw. welcher gebaute Quellstand dort läuft.
Bitte nichts eigenmächtig am CE-Branch ändern. Der CE instrumentiert und repariert den fachlichen
Posterpfad; Website-Chatty 3 hat hierbei keinen Änderungsauftrag.

CE-Korrektur bereit: Commit `4ae9e6cbe5bef30d8e62a01f71508706fce24581`. Der bewährte
Kompatibilitätsweg wird wieder zuerst verwendet; der direkte IPC-Aufruf bleibt Rückfalllösung.
Windows-Sichttest durch Kurt vom 10.09.2026: weiterhin nur `Pic`; derselbe Eintrag `Silo`
zeigt in der installierten 0.9002 korrekt das Poster. Daraufhin wurden
`renderPosterImage_` und `scheduleArchivPosterLoad_` wortgleich aus dem funktionierenden
Installer-Quellstand zurückübernommen (Commit `464835bf7bf6203a768741398b676d19cc0bf51e`).
Zusätzlich protokolliert der Backend-Posterhandler Start und Ergebnis, damit ein weiterer
Fehler nicht unsichtbar bleibt (Commit `ce07c7870729dada70bdd352c96f8b3433e05cb6`).
JavaScript-Syntaxprüfung für Backend und alle drei Inline-Skripte bestanden. Neuer Sichttest steht aus.


CE-Nachtrag 10.09.2026: Poster-Timerpfad durch unmittelbaren, vollständig geloggten Abruf ersetzt. Commit `d864e021efae352d64f74f945e5587b32347c131`; Nachtest offen.


CE-Nachtrag 10.09.2026: Richtiger Commit `d864e02` war bei Kurt aktiv, dennoch kein Posterstart im Log. Ursache im Ablauf lokalisiert: `fillDetailsFromArchiv_()` konnte nach sichtbarem Detailaufbau abbrechen, bevor der nachgelagerte Posteraufruf erreicht wurde. Commit `39959c6cad0b736f265a47fe64e767589eb48ff6` startet den Posterabruf nun zuerst und protokolliert Fehler der folgenden UI-Schritte. Syntaxprüfung bestanden. Nachtest durch Kurt am 10.09.2026 bestanden: Die Entwicklungsfassung zeigt die Archivposter wieder korrekt (sichtgeprüft unter anderem mit „Percy Jackson Die Serie“). Ursache war die Reihenfolge: Der Posterabruf lag hinter der fehleranfälligen Detailverarbeitung und wurde deshalb nicht erreicht.

## 2026-09-10 – CE – Smarte Notizsteuerung und deutsches Startdatum repariert

Status: CODE FERTIG / WINDOWS-SICHTTEST OFFEN

Kurts Befund:

- `offSeT +1d` blieb unverändert und erzeugte bei „Bloodhounds“ keinen deutschen Termin;
- `Start` wurde in den Staffeldetails weiterhin als ISO-Datum `2026-04-03` angezeigt.

Ursache:

- Der vollständige Notiz-Helferblock (`canonicalizeNoteText_`, `validateNoteText_`,
  `applyNoteAutofill_` sowie zugehörige Funktionen) war versehentlich innerhalb
  `saveDirtyChanges_()` deklariert und dadurch für das Notizfeld zur Laufzeit nicht erreichbar.

Korrektur auf `serkal-0.0.5-archiv-start`:

- Commit `8aa23b3004b52d1772bf8c7fc2e8b4667b8e5ecb`;
- Notiz-Helferblock in den globalen Skriptbereich verschoben;
- beide Start-Anzeigen benutzen nun die vorhandene Funktion `formatDateShort_()`;
- interne Funktionsprobe: `offSeT +1d` → `OffsetDE: 1D`;
- Datumsproben: `2026-04-03` → `03.04.2026`, `2026-05-28` → `28.05.2026`;
- Syntaxprüfung aller drei Inline-Skripte bestanden.

Sichttest: Bloodhounds öffnen, `offSeT +1d` eingeben, kurz warten oder Feld verlassen,
speichern und erneut auswählen. Erwartet: `OffsetDE: 1D`, `Start: 03.04.2026`
und `DE: 04.04.2026`.



CE-Nachtrag 10.09.2026: Kurts Sichttest für Commit `8aa23b3` bestanden. Gemischte Eingabe `offSeT +1d` wurde korrekt zu `OffsetDE: 1D` vereinheitlicht, ausgewertet und die Start-/DE-Daten deutsch angezeigt. Auf Kurts Hinweis wird jede tatsächliche automatische Änderung nun lesbar mit Eingabe und Ergebnis protokolliert; freie Notiztexte bleiben aus diesem Logeintrag heraus. Die Eingabepause wurde von 450 auf 1500 ms verlängert. Commit `f9bba0471561ab23fba2ee9bd941c40894b86894`; Syntax- und Funktionsprobe bestanden, Windows-Sichttest offen.


CE-Nachtrag 10.09.2026: Auf Kurts Hinweis wurde der verlorene `?`-Hilfeknopf in der Werkzeugreihe des Logfensters wiederhergestellt. Das SerKal-eigene Hinweisfenster erklärt Wochentage, Suche, Weiter, Alles markieren, Kopieren, Markiertes, Log leeren, Neu laden und Schließen. Dauerhafte Löschwirkungen auf die ausgewählte TXT-Datei sind ausdrücklich gekennzeichnet; der zuvor irreführende Fußtext wurde berichtigt. Commit `fb1e0935e16c7390d149b3031036efc226727cf4`; Syntaxprüfung bestanden, Windows-Sichttest offen.


### 2026-09-10 – Kurt/CE an Installer-Chatty – laufendes SerKal im öffentlichen EXE-Installer sicher behandeln

Status: QUELLSTAND 1.0 RC FERTIG / WINDOWS-BUILD UND XAVER-TEST OFFEN

Kurts Klarstellung: Diese Bedienung gehört nicht nur in `switch-player.bat`. Ein neuer oder
aktualisierender Nutzer lädt ausschließlich die öffentliche `serkal-desktop.exe` herunter und
besitzt keine Hilfs-Batchdatei. Deshalb muss die heruntergeladene EXE selbst den vollständigen
Ablauf beherrschen.

Verbindliches Verhalten:

1. Bei einer echten Erstinstallation ohne laufendes SerKal beginnt die Installation ohne
   überflüssigen Countdown.
2. Läuft bereits ein Fenster `SERKAL Desktop*`, zeigt die heruntergeladene EXE vor jeglicher
   Installationsänderung sichtbar den Countdown
   „SerKal Desktop wird automatisch geschlossen in 7 … 6 … 5 … 4 … 3 … 2 … 1 Sekunden“.
3. Während jeder Sekunde, ausdrücklich auch in der letzten, kann Kurt/Nutzer den gesamten
   Vorgang abbrechen. Beim Abbruch darf die vorhandene Installation nicht verändert werden.
4. Nach Ablauf soll SerKal zunächst regulär über sein Hauptfenster geschlossen werden. Kein
   blindes gewaltsames Beenden; bleibt der Prozess aktiv, Installation sicher abbrechen.
5. Erst wenn nachweislich kein SerKal-Prozess mehr läuft, darf die eigentliche Installation
   beziehungsweise Aktualisierung beginnen.
6. Am Ende muss die EXE eindeutig melden:
   „SerKal Desktop wurde erfolgreich installiert/aktualisiert“ oder
   „Installation/Aktualisierung fehlgeschlagen“ mit verständlichem Grund.
7. Der öffentliche Download bleibt genau eine Datei `serkal-desktop.exe`; kein separates BAT,
   PowerShell-Skript oder zweiter manueller Klick für den Nutzer.

Technischer Hinweis des CE: Das aktuelle Forge-`maker-squirrel`-Setup bietet für einen echten
Abbruch vor Installationsbeginn keinen passenden SerKal-UI-Einstieg; die Squirrel-Ereignisse im
Programm laufen dafür zu spät. Daher eine vorgeschaltete Installer-Hülle verwenden oder auf eine
Installertechnik mit entsprechendem Vorinstallationsdialog wechseln. Keine Scheinlösung im
normalen SerKal-`main.js`, die erst nach begonnener Installation reagiert.

`switch-player.bat` bleibt aufgrund dieser Klarstellung unverändert. Ergebnis, gewählte Technik,
Versionsnummer, Commit und praktischen Windows-Test hier zurückmelden. Kein öffentlicher Upload
vor Kurts Sichtprüfung und Freigabe.

Umsetzung als Release Candidate am 11.09.2026:

- fachliche Grundlage ist unverändert der von CE freigegebene Branchstand einschließlich
  `5981c2a0e51cd343f04de70b1edc2fecc0c69231`;
- Programmversion technisch `1.0.0`, sichtbar `SERKAL Desktop 1.0`;
- Squirrel bleibt der bewährte innere Installations- und Updateweg;
- eine native Windows-Hülle enthält dieses Setup vollständig und bildet weiterhin genau eine
  öffentliche Datei `serkal-desktop.exe`;
- nur bei einem sichtbaren laufenden SerKal-Hauptfenster erscheint der abbrechbare Countdown
  von 7 bis 1; bei Erstinstallation ohne laufendes SerKal gibt es keinen Countdown;
- nach dem Countdown wird ausschließlich `CloseMainWindow` verwendet; kein gewaltsames
  Prozess-Kill. Bleibt SerKal aktiv, bricht die Hülle verständlich ab;
- das innere Setup wird erst nach nachweislich beendetem SerKal gestartet;
- Erfolg, Benutzerabbruch und Fehler werden jeweils ausdrücklich gemeldet;
- der AUTOZIP-Ersatz prüft den CE-Basiscommit, die Version, den Build und die vollständige
  Einbettung. Die vorhandene Publish-Datei wird erst nach erfolgreichem Hüllenbau ersetzt.

Installer-Quellkopf nach Umsetzung:
`23444473f1b80bcab9c2c49c004a3b0b6b022f4a`.

Quellprüfungen bestanden: package.json und package-lock.json einheitlich `1.0.0`;
Backend, Preload und Forge syntaktisch gültig; Hüllenquelle enthält Countdown, Abbruch,
reguläres Schließen, Setup-Einbettung und keinen Kill-Aufruf. Der reale Windows-Build und
Kurts Abschlussprüfung stehen aus. **Noch keine öffentliche Veröffentlichung.**


### 2026-09-10 – CE – Kalender-Erststarthilfe aus Xaver-Test korrigiert

Status: CODE FERTIG / XAVER-SICHTTEST OFFEN

Xaver-Testbefund von Kurt: Der Knopf `Hilfe öffnen` führte unabhängig von der gewählten
Kalenderoption immer zur Google-Kalender-Hilfe. Besonders für „Keine Ahnung … mach, was
du denkst“ war diese Hilfe unpassend; die einmal gespeicherte Auswahl ließ sich zudem nicht
einfach erneut öffnen.

Korrekturcommit: `d6b29660b3b7440eaea7b3d912b51eff3aec825f`.

- Google-Auswahl öffnet weiterhin die Google-Hilfe.
- ICS, kein Kalender, keine Auswahl und automatische Auswahl erhalten jeweils eine passende
  Erklärung im SerKal-Dialog.
- Die automatische Auswahl erklärt ausdrücklich den Iststand: Sie führt derzeit zum noch nicht
  aktiven ICS-Export und erzeugt daher keine Kalendereinträge.
- Der normale Kalenderknopf öffnet bei allen Nicht-Google-Modi erneut die Einrichtungsauswahl;
  nur ein eingerichteter Google-Modus öffnet unmittelbar Google.
- Syntaxprüfung aller drei Inline-Skripte bestanden.


### 2026-09-10 – Kurt/CE – Google-Kalender-Hilfe beginnt mit Einrichtungsbild

Status: WEBSITE-CODE FERTIG / VERÖFFENTLICHUNG UND SICHTTEST OFFEN

Auf Kurts verbindliche Vorgabe wurde sein aktueller Screenshot des SerKal-Dialogs
`Kalender einrichten` als erste Darstellung im Seiteninhalt der deutschen
`google-kalender-hilfe.html` eingebunden – noch vor der bisherigen Überschrift.

Website-Commit: `5bc93ccd52d9d7d85edcf97727a28ff6f3a9b1de`.
Bildpfad: `up/icon/help/google-kalender-auswahl.png`.

Bild und HTML wurden atomar gemeinsam eingecheckt. Repository-Nachprüfung: Bilddatei
vollständig vorhanden, HTML verweist auf den festen Bildpfad und das Bild steht vor `h1`.
Öffentliche Veröffentlichung beziehungsweise Sichtprüfung auf serkal.de steht noch aus.

Website-Chatty-3-Nachtrag 10.09.2026: Kurts Originaldatei
`up/icon/cal 01 - anmeldung.png` ist nun selbst eingebunden; die deutsche Hilfe verweist
URL-sicher auf `/icon/cal%2001%20-%20anmeldung.png`. Die vier Auswahlmöglichkeiten werden
unmittelbar unter dem Bild erklärt. Nach dem CE-Stand `d6b2966` wurden DE und EN außerdem
fachlich berichtigt: ICS und automatische Auswahl erzeugen derzeit noch keine
Kalendereinträge; für direkte Termine ist die erste Google-Auswahl zu verwenden.
Website-Abschlusscommit: `c26609ab3363be2ef947bf7a8a8c9d1cf409c3d4`.



### 2026-09-11 – CE – ICS-Auswahl erklärt und als später änderbar gekennzeichnet

Status: CODE FERTIG / XAVER-SICHTTEST OFFEN

Kurts Vorgabe: Beim bewussten Auswählen von „ICS-Datei / anderer Kalender“ soll ein kurzes
SerKal-Pop-up nach dem gezeigten Kalender-Hinzufügen-Vorbild erscheinen. Außerdem muss bereits
im Einrichtungsdialog eindeutig stehen, dass sämtliche anfänglichen Auswahlen später geändert
werden können.

Korrekturcommit: `79bc9b1ee411a8d58710fda64220665077aad5d8`.

- Die Einleitung erklärt nun: Alle Einstellungen können später jederzeit über „Kalender“
  geändert werden.
- Nur beim aktiven Anklicken der ICS-Auswahl erscheint „Zum Kalender hinzufügen“.
- Das Pop-up nennt Apple Kalender/iCal, Microsoft Outlook und andere ICS-fähige
  Kalenderprogramme.
- Es verschweigt den Iststand nicht: Der ICS-Export ist in dieser SerKal-Version noch nicht aktiv.
- Beim bloßen erneuten Öffnen einer bereits gespeicherten ICS-Einstellung erscheint das Pop-up
  nicht ungefragt erneut.
- Deutsch und Englisch sind berücksichtigt.
- Der von GitHub zurückgelesene Stand wurde geprüft; alle drei Inline-Skripte sind syntaktisch
  gültig.

Xaver-Sichttest:
1. `PULL-SD.BAT` ausführen und SerKal starten.
2. Unten „Kalender“ öffnen.
3. Prüfen, ob die Einleitung die spätere Änderbarkeit über „Kalender“ nennt.
4. „ICS-Datei / anderer Kalender“ anklicken.
5. Prüfen, ob das Pop-up sofort erscheint und Apple/iCal, Outlook, andere ICS-Kalender sowie
   den noch nicht aktiven Export nennt.
6. Pop-up mit „OK“ schließen; anschließend eine andere Auswahl anklicken und wieder ICS wählen.
   Das Pop-up muss erneut erscheinen.


### 2026-09-11 – Kurt/CE – Xaver-Nullstart und Ersteinrichtung als Einheit

Status: CODE FERTIG / XAVER-WINDOWS-TEST OFFEN

Kurts Testbefund: Nach „alles auf null“ erschien Google weiterhin vorausgewählt. Die
Ersteinrichtung speicherte Teilentscheidungen zu früh; nach der TMDB-Frage fehlte eine
Zurück-Möglichkeit. Die automatische Google-Kalender-ID war im Ablauf nicht nachvollziehbar.

Ursachen und Korrekturen:

- Ein leerer Kalenderwert wurde im Frontend mit `c.mode || 'google'` wieder als Google
  dargestellt. Frische Ersteinrichtung zeigt jetzt keine vorausgewählte Kalenderoption.
- Beim Programmstart konnten fehlende Xaver-Dateien erneut aus alten Electron-Datenordnern
  importiert werden. Sobald die absichtlich erzeugte `settings.json` existiert, findet keine
  solche Wiederbelebung von TMDB-Key oder Google-Token mehr statt.
- Teilweises Speichern der Kalenderkonfiguration konnte Xavers besonderen Archivordner
  überschreiben. Einstellungen werden nun mit dem vorhandenen Zustand zusammengeführt.
- Die Ersteinrichtung bildet eine Einheit mit drei Schritten:
  1. TMDB-Key eingeben und lediglich prüfen,
  2. Kalender auswählen,
  3. Gesamtübersicht prüfen.
  Beide Folgeschritte besitzen „Zurück“. Erst „Alles speichern“ schreibt die Daten.
- TMDB- und Kalendereinstellungen werden gemeinsam geschrieben; bei einem Schreibfehler wird
  der vorherige Zustand zurückgesichert.
- Bei Google erklärt die Oberfläche, dass keine ID eingegeben wird. Beim ersten echten
  Kalendereintrag erscheint nach einem Nullstart ausdrücklich die Google-Kontoauswahl; danach
  sucht SerKal den Kalender „SerKal“ und speichert dessen technische ID automatisch.
- Die vorhandene `switch-player.bat` löscht bereits Kalendermodus, Google-ID, lokalen
  Google-Token, TMDB-Key, Wartungs-Cache und Xaver-Archiv. Die eigentliche Lücke lag im
  anschließenden Programmstart und ist dort geschlossen.

Geprüfte Commitfolge auf `serkal-0.0.5-archiv-start`:

- `e0e53f774ed60ef467803961b7563b9b3392c40a` – Nullstart, Zusammenführen und gemeinsamer Commit;
- `2d3bf7ec1bfb25f08f3ff8364b8434bed1b8d985` – sichere Preload-Brücke;
- `2898f15f8db7323c5d2691e6435f727a12bb5233` – dreistufiger Assistent.

Der von GitHub zurückgelesene Endstand wurde geprüft: Backend, Preload, injizierte
TMDB-Brücke und alle drei Inline-Skripte sind syntaktisch gültig.

Xaver-Test:

1. SerKal vollständig schließen und `PULL-SD.BAT` ausführen.
2. Mit `switch-player.bat` zunächst zu Kurt und anschließend wieder zu Xaver wechseln,
   damit Xaver garantiert neu auf null erzeugt wird.
3. SerKal starten: Der Assistent muss mit „Schritt 1 von 3 – TMDB einrichten“ beginnen.
   In diesem ersten Schritt ist noch keine Kalenderauswahl sichtbar.
4. Einen TMDB-Key eintippen und „Weiter“ drücken. Erst im danach sichtbaren
   „Schritt 2 von 3 – Kalender einrichten“ prüfen: Keine Kalenderoption darf vorausgewählt sein.
5. Im Kalenderschritt „Zurück“ wählen: Der eingegebene TMDB-Key muss noch sichtbar sein,
   aber noch nicht dauerhaft gespeichert sein.
6. Wieder weitergehen, eine Kalenderoption wählen und zur Kontrollseite gehen. Mit „Zurück“
   muss die Kalenderauswahl noch korrigierbar sein.
7. Erst „Alles speichern“ beendet den Assistenten dauerhaft.
8. Bei Google: Beim ersten tatsächlichen Kalendereintrag muss die Google-Kontoauswahl
   erscheinen. Danach muss das Log die automatische Suche/Fundstelle des Kalenders „SerKal“
   zeigen.


Xaver-Nachtest 11.09.2026:

- Der dreistufige Assistent erschien korrekt mit „Schritt 1 von 3 – TMDB einrichten“.
- Zurück-Navigation, Entwurfszustand und abschließendes Speichern wurden von Kurt als bestanden
  gemeldet.
- Dabei wurde ein verbliebener Seitenweg gefunden: Nach Verlassen der unvollständigen
  Ersteinrichtung öffnete eine Suche noch den älteren einzelnen TMDB-Dialog mit nur
  „Speichern“, statt den vollständigen Assistenten fortzusetzen.
- Korrigiert: Solange `setupDone` noch nicht wahr ist, öffnet eine Suche wieder den gesamten
  Drei-Schritt-Assistenten. Der einzelne TMDB-Dialog bleibt nur für den zulässigen Fall erhalten,
  dass die Ersteinrichtung bereits abgeschlossen, TMDB aber bewusst zunächst ausgelassen wurde.
- Der Knopf „Später“ heißt zur besseren Verständlichkeit nun „Später fortsetzen“.

Korrekturcommits: `b5ae31242ac2627bdcb492a6e05419eff9d54243` und
`89709ceb3f4943ac597975bc1a18d3aa708ec18d`.
Backend, injizierte Brücke und alle drei Inline-Skripte syntaktisch geprüft.


### 2026-09-11 – Kurt/CE – Logfenster auf Laptop skalierbar und Höhe dauerhaft

Status: CODE FERTIG / LAPTOP-SICHTTEST OFFEN

Kurts Laptopbefund: Das geöffnete Logfenster nahm nahezu die gesamte nutzbare Bildschirmhöhe
ein und verdeckte die SerKal-Oberfläche. Gewünscht ist ein verschiebbarer oberer Rand; die
eingestellte Höhe soll beim nächsten Öffnen erhalten bleiben.

Ursache: Neben der älteren 420-Pixel-Regel setzte eine spätere Log-CSS-Regel die Höhe erneut auf
bis zu 520 Pixel. Auf der Laptopanzeige wirkte das Log dadurch unverhältnismäßig groß.

Korrekturcommit: `5981c2a0e51cd343f04de70b1edc2fecc0c69231`.

- Responsive Anfangshöhe: 38 Prozent der verfügbaren Fensterhöhe, höchstens 360 Pixel.
- Der neue sichtbare Ziehbalken liegt unmittelbar am oberen Rand des Logfensters.
- Nach oben ziehen vergrößert, nach unten ziehen verkleinert das Log.
- Die gewählte Höhe wird lokal gespeichert und beim nächsten Öffnen sowie nach Programmneustart
  wiederhergestellt.
- Bei einer kleineren Bildschirmhöhe wird ein zu großer gespeicherter Wert automatisch auf die
  noch verfügbare Fläche begrenzt.
- Mindesthöhe 170 Pixel; oberhalb des Logs bleiben mindestens 130 Pixel der Hauptoberfläche frei.
- Tastaturbedienung am Ziehbalken ist mit Pfeil hoch/runter möglich.
- Die Log-Hilfe erklärt den Ziehbalken und das Speichern der Höhe.
- Logsuche, Markierung, Kopieren und dauerhafte Löschfunktionen wurden nicht verändert.
- Der von GitHub zurückgelesene Stand enthält genau einen Ziehbalken und eine Initialisierung;
  alle drei Inline-Skripte sind syntaktisch gültig.

Laptop-Sichttest:

1. `PULL-SD.BAT` ausführen, SerKal starten und das Log öffnen.
2. Prüfen: Das Log startet deutlich niedriger als im Screenshot vom 11.09.2026.
3. Den blauen/violetten Ziehbalken am oberen Logrand nach unten ziehen und loslassen.
4. Log schließen und erneut öffnen: Die niedrigere Höhe muss erhalten bleiben.
5. SerKal neu starten und Log erneut öffnen: Die Höhe muss weiterhin erhalten bleiben.
6. Ziehbalken nach oben ziehen: Das Log darf wachsen, aber nicht die gesamte Hauptoberfläche
   verdecken.


### 2026-09-11 – Website-Chatty 3 – neue CE-Hinweise für Website abgearbeitet

Status: WEBSITE-CODE FERTIG / PRODUKTIONSINSTALLER UND VERÖFFENTLICHUNG OFFEN

Die seit dem letzten Website-Abschluss hinzugekommenen CE-Einträge wurden vollständig gegen
den aktuellen Website-Stand geprüft.

Umgesetzt im Website-Commit `f53f7692bba1a0d8b01cecee9097a80d44c9c95e`:

- Google-Kalender-Hilfe DE/EN an den aktuellen Drei-Schritt-Assistenten angepasst;
- erklärt, dass erst „Alles speichern“/„Save all“ beide Einstellungen übernimmt und die
  Kalenderwahl später über „Kalender“ geändert werden kann;
- Google-Anmeldung fachlich berichtigt: Sie erscheint beim ersten tatsächlichen
  Kalendereintrag, nicht unmittelbar nach dem Speichern der Einrichtung;
- Footer der Google- und TMDB-Hilfen sowie der Datenschutz-/Impressums-Unterseiten an Kurts
  Regel angepasst: Die bereits aktive Kategorie ist auch im Footer kein Link mehr.

Bereits zuvor erfüllt und erneut geprüft:

- `/start` verwendet das endgültige SerKal-Logo als Favicon, ruft `serkal://start/` auf und
  besitzt Rückkehr-/Fallback-Verhalten;
- Google-/TMDB-Hilfen DE/EN besitzen den direkten Rückweg `serkal://start/`;
- `PULL-PD.BAT` prüft Git-Stand, Git LFS, Mindestgröße des Installers, beide Downloadlinks,
  gespeicherte WinSCP-Sitzung und Upload-Erfolg und bricht bei Fehler verständlich ab.

Produktionsgrenze bleibt verbindlich: Website-Upload und öffentlicher Installerwechsel erst,
nachdem der Installer-Chatty die neue Installations-EXE praktisch geprüft und Kurt sie ausdrücklich
freigegeben hat. Der offene Installer-Auftrag zur sicheren Behandlung eines laufenden SerKal ist
keine Website-Codeaufgabe und blockiert weiterhin den öffentlichen Produktionsinstaller.

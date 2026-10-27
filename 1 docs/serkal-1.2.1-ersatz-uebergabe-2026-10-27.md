# SerKal 1.2.1 – vollständige Ersatzfassung, Übergabe 27.10.2026

## Auftrag und aktueller Stand
Kurt hat den Gesamtauftrag ausdrücklich bekräftigt: Eine benutzbare Ersatzfassung für VelcroFist und alle vier Geräte fertigstellen, keine bloße Aufteilung in weitere Planungslose.
Der neue Sitzungsbetrieb ist für **Desktop und Android** implementiert. Kalenderabschluss und Bestandsübernahme sind enthalten.
Die öffentliche Downloadversion wurde durch CE noch nicht ersetzt.

- Produktversion beider Plattformen: **1.2.1**
- gemeinsamer Archivstand: **35**
- Android versionCode: **44**
- Android gebauter Quellcommit: **19d017fab89e9543a889c4c4d4a8f551a79140d2**
- Desktop festgeschriebener Bauquellcommit: **fec9f40186f7dfd2bc1a071a91931547acdd95df**
- interne Arbeitszweige behalten den Namen ce-session-34-android / ce-session-34-desktop. Das ist kein abweichender Produktstand.
- Die vorherige interne Alpha-34-APK wurde nicht an Kurt ausgegeben. Nach ihrem Bau wurde für die stabile Ersatzfassung korrekt auf gemeinsame 35 / Android 44 erhöht.

## Gelieferter Funktionsumfang
- Start liest den vollständigen Google-Sitzungsstand. Bearbeitungen lösen keine Hintergrundübertragung aus.
- Reguläres Beenden übernimmt offene lokale Änderungen und schreibt einen vollständigen Archivstand zurück.
- Android: explizites Beenden und Zurück führen denselben Abschluss aus; Wechsel in den Hintergrund allein überträgt nichts.
- Ein Prozessabbruch stellt keine unveröffentlichten Sitzungsänderungen wieder her.
- Für einen fehlgeschlagenen Google-Start gibt es den deutlich als lokal/fehlerhaft bezeichneten letzten bestätigten Stand; keine Dauersperre wegen Google-403. Bei erster Altübernahme kann der vorhandene lokale Bestand weiter benutzt werden.
- Gespeichert wird der zuletzt vollständig abgeschlossene Stand. Keine Zusammenführung oder Revisionskette.
- Neue und alte Geräte mit 1.2.1 verwenden gemeinsam **serkal-session-v1.json** im Google-appDataFolder.
- Fehlt diese Datei beim Umstieg, wird die zuletzt bei Google geänderte alte v2-Kopie übernommen. Desktop kann bei fehlender Google-Kopie den vorhandenen lokalen TXT-Bestand als erste Sitzung übernehmen. Keine leere Ersteinrichtung über einen vorhandenen Bestand hinweg.
- Alte v2-Dateien werden nach dem Umstieg nicht mehr mit dem neuen Sitzungsbestand vermischt.
- Google-Kalenderziele werden beim Abschluss vorbereitet; Archiveinträge werden einmal gespeichert; Kalendertermine danach aktualisiert. Ein Kalenderfehler verhindert den Archivupload nicht.
- Persönliche, nicht von SerKal markierte Kalendertermine bleiben außerhalb dieser Aktualisierung. Für von SerKal verwaltete Termine ist der Sitzungsstand maßgeblich; alte manuelle Schutzkonflikte blockieren diesen Abschluss nicht mehr.
- Bereits nicht mehr benötigte lokale Dateisperren und laufende Cloudübertragungs-Timer sind im aktiven Sitzungsweg umgangen; alte Module bleiben als unbenutzte Referenz im Repository.
- Bei fehlgeschlagenem Abschluss bleibt ausdrücklich Beenden ohne Übertragung möglich. Kein Wiederherstellungsdialog beim nächsten Start.

## Vollständige Google-Fehler
HTTP-Status, Aufruf/Operation, Methode, Endpunkt und der gesamte Google-Antworttext werden ohne inhaltliche Längenkürzung im Log gespeichert. Auch reason/domain/details und Nicht-JSON-Antworten bleiben enthalten. Zugangstoken und Credential-Felder werden geschwärzt; Requestbody und Authorization-Header werden nicht geloggt.
Android protokolliert Google-Anmelde-/Schlüsselfehler auch dann, wenn noch kein Archivmanager angelegt werden konnte. Das Menü-Log zeigt diese Antworten vollständig. Die knappe Statusanzeige verhindert, dass ein langer Fehlertext die Archivliste verdrängt.

**VelcroFists konkrete 403-Ursache ist weiterhin nicht bekannt.** Eine fehlende Berechtigung oder deaktivierte Google-API kann ohne deren echte Fehlerantwort nicht behauptet oder als behoben ausgegeben werden. Die irreführende permanente lokale Schreibsperre ist durch den neuen Ablauf beseitigt. Aus der neuen Fassung lässt sich jetzt die vollständige Antwort zur gezielten Google-Diagnose entnehmen.

## Prüfungen
- Desktop: 39 Testskripte lokal bestanden; abschließender CI-Lauf: https://github.com/KurtV731/serkal_desktop/actions/runs/40549775596
- Android: **73 Tests, 0 Fehlschläge, 0 Fehler**, Release-Bau erfolgreich: https://github.com/KurtV731/serkal_desktop/actions/runs/40548633786
- Enthaltene Fälle: keine Übertragung beim Editieren, Abschlussupload, nächster Start, Löschung, letzter Gesamtstand gewinnt, Prozessabbruch, 403 bei Laden/Speichern, weiterhin lokale Bearbeitung, getrenntes Kalenderfehlerergebnis, Übernahme eines alten Google-Snapshots.
- Desktop-Zusatzfall: Nach Prozessabbruch und gleichzeitigem Google-Ausfall erscheint höchstens der letzte bestätigte Stand, nicht die unveröffentlichte Sitzung.
- Praktischer geräteübergreifender Vorläufertest 33 ist am Schwarzen Brett bestanden dokumentiert. Eine praktische Abnahme dieser vollständigen 1.2.1 einschließlich Android/Kalender wurde damit noch nicht behauptet.

## Fertige signierte Android-Datei
- **035-SerKal-Android-1.2.1.apk**
- 2285979 Byte
- SHA-256: **c0142f13bc00083db12c6c84e0363489ca65e2fdacd54776d4fc73260d179849**
- Paketkennung unverändert: de.serkal.android.preview.v005
- gleicher bisheriger SerKal-Signaturschlüssel; v2/v3 geprüft; Zertifikat SHA-1 entspricht den bisherigen APKs.
- AndroidManifest.xml vor und nach Signierung bytegleich; tatsächliches versionName 1.2.1 / versionCode 44 anhand des APK-Badgings geprüft.
- APK Kurt direkt bereitgestellt; kein privater Schlüssel oder Passwort veröffentlicht.
- Nicht erneut bauen oder signieren, um genau dieses geprüfte Byte-Artefakt zu verteilen.
- Nach Übernahme in den Freigabeordner kann sie wie bisher **serkal-android.apk** heißen; Hash muss gleich bleiben.

## Windows: konkreter fertiger Bauweg
Datei auf main: **serkal-1-2-1-ersatz-bauen.bat**.
Sie verwendet den oben festgeschriebenen CE-Commit und folgende eigene Ordner:
- Bau: C:\ppd\serkal\build\release-1.2.1
- Ausgabe: C:\ppd\serkal\veroeffentlichungen\1.2.1
- Ergebnis: serkal-desktop.exe, SHA-Datei, freigabenachweis.txt.

Der vollständige vorhandene Windows-Ein-Datei-Bauweg ist weiterverwendet: private OAuth-Beilage lokal prüfen; bewährtes lokales Icon übernehmen; npm ci; alle 39 Tests; Forge/Squirrel-Setup; OAuth-Bytevergleich und Token-Ausschluss; Ein-Datei-Hülle; SHA-256/Freigabenachweis. Keine Server-/Website-Kopie.

**Noch keine Windows-EXE für 1.2.1 auf Kurts PC gebaut.** Diese Umgebung besitzt weder seinen Windows-Bauplatz noch seine private Desktop-OAuth-Beilage. Deshalb ist keine fertige Windows-Prüfsumme behauptet.
Installer kann unmittelbar mit dieser vollständig vorbereiteten BAT bauen; keine weitere fachliche Konzeptentscheidung vom CE nötig.

## Verteilung
Erst beide Gerätearten aktualisieren und danach starten, wie mit Kurt vereinbart. Alte 1.2-Geräte sollen nicht weiter in das alte Archiv schreiben.
Nach tatsächlichem Windows-Bau, Hashkontrolle und praktischer Abnahme dieselben fertigen Dateien unverändert als Ersatz des öffentlichen Angebots übernehmen. Die vorhandene 1.2-Datei nicht durch einen ungetesteten Zwischenbau ersetzen.

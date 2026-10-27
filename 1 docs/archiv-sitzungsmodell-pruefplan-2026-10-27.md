# SerKal – vereinfachte Archivsitzung und isolierter Prüflauf
Stand: 27.10.2026 · Vorgabe Kurt · Noch keine Programmfreigabe

## Verbindliche Ablösung des bisherigen Abgleichs
Kurt akzeptiert den Verlust ersetzbarer Archivdaten und persönlicher Markierungen.
Die Anwendung darf nicht durch eine immer feinere Konfliktverwaltung blockiert werden.
Der bisherige laufende Mehrgeräteabgleich soll für Desktop und Android abgelöst werden.

1. Programmstart liest den vollständig bei Google gespeicherten Archivstand in eine neue lokale Sitzung.
2. Ein alter lokaler Sitzungsstand wird dabei ersetzt, nicht zusammengeführt. Auch nach Abbruch wird kein lokaler Rest hochgeladen oder zur Wiederherstellung angeboten.
3. Archivänderungen während der Sitzung bleiben lokal. Keine zeitgesteuerten Übertragungen, keine Hintergrundabfragen des Cloudarchivs, kein automatischer Geräteabgleich.
4. Eine deutliche untere Anzeige unterscheidet den geladenen Google-Stand und „Änderungen noch nicht bei Google gespeichert“.
5. Reguläres Beenden speichert noch offene Eingaben lokal und schreibt den vollständigen Sitzungsstand einmal zu Google zurück. Ohne Änderungen kein unnötiger Upload.
6. Ausschalten, Prozessabbruch oder fehlgeschlagenes Zurückschreiben kann diese Sitzung verlieren. Der nächste Start liest wieder Google; keine automatische Nachübertragung alter Sitzungen.
7. Bei gleichzeitig laufenden Sitzungen gilt die letzte erfolgreich gespeicherte Sitzung vollständig. Keine Feldzusammenführung, keine Konfliktkette, keine nachträgliche Wiederbelebung gelöschter Einträge.
8. Ein Google-Fehler muss als tatsächlicher Fehler erscheinen, nicht als dauerhaftes „Archiv wird vorbereitet“. Bei fehlgeschlagenem Start darf ein alter lokaler Rest nicht als frisch geladener Google-Stand ausgegeben werden.
9. Ein Fehler beim Beenden wird verständlich angezeigt. Er erzwingt keine dauerhafte Beendensperre oder Wiederherstellung beim nächsten Start.

„Nur lokal“ bezieht sich auf die Archivhaltung während der Sitzung. TMDB-Abfragen für Suche/Wartung bleiben möglich. Kalenderänderungen sind für den neuen Ablauf ebenfalls auf den Abschluss zu verlegen; ein Kalenderfehler darf die lokale Archivbearbeitung nicht sperren. Ein gemeinsam atomarer Abschluss von Google Drive und Google Calendar wird nicht versprochen.

Android: Ein regulärer expliziter Beenden-Vorgang ist vom bloßen Hintergrundwechsel zu unterscheiden. Kein Upload bei jeder Activity-Pause, kein Erfolg vor bestätigter Google-Antwort. Beim tatsächlichen neuen Programmstart zählt ausschließlich der gespeicherte Google-Stand.

## Beobachteter Anlass
VelcroFist nutzt einen PC. Sein Log zeigt zweimal:
identity erfolgreich → archive-list → GOOGLE_HTTP_403, dirty=false.
Das lokale Archiv mit 60 Einträgen ist lesbar; Löschen und Wartung bleiben durch fehlende Initialisierung blockiert.
Der ausgelieferte HTTP-Helfer verwirft Googles Fehlerdetails und meldet nur den Statuscode.
Eine verweigerte Google-Berechtigung wird durch die Architekturänderung allein nicht repariert. Fehlerursache separat sichtbar machen, ohne Tokens oder private Archivtexte zu protokollieren.

## Isolierter Test und Übergabe an Installer
Kurt hat einen temporären isolierten Installer-Prüfstand angekündigt.
Auf dem gemeinsam gelesenen Brett war am 27.10.2026 noch keine konkrete Isolationsdatei oder neuer Installer-Bau dokumentiert.

Der Prüflauf benötigt:
- eigenen lokalen Einstellungs-/Arbeitsordner;
- ausdrücklich getrenntes Google-Testarchiv und, falls getestet, eigenen Testkalender;
- keine Registrierung oder Verknüpfung, die den öffentlichen SerKal-Start ersetzt;
- keine Rückübertragung von Testdaten in das echte Archiv;
- höhere eindeutige Installationsversion; kein zweites anders gebautes Artefakt mit Version 1.2.0;
- Desktop und Android vor öffentlicher Freigabe auf denselben Sitzungsablauf prüfen.

Eine EXE in einem anderen Ordner allein isoliert weder Electron-userData noch Google-Daten.
Keinen bestehenden persönlichen Archiv-/Kalenderstand für den Test zurücksetzen.

## Abnahmematrix

| Fall | Erwartung |
| --- | --- |
| Start mit altem lokalen Rest | Google wird geladen; Rest verschwindet ohne Wiederherstellungsfrage. |
| Eintragen, Gesehen umschalten, löschen | Sofort lokal wirksam; keine Cloudanfrage durch diese Änderungen. |
| Mehrere Minuten arbeiten | Keine Cloudabfragen oder Uploads durch Zeitablauf. |
| Regulär beenden | Offene Änderungen werden übernommen; ein vollständiger Archivabschluss statt Upload pro Eintrag. |
| Danach auf Gerät B starten | Exakt der gespeicherte Stand und dieselbe Eintragszahl. |
| Nach Löschen auf Gerät B starten | Gelöschter Eintrag bleibt weg. |
| Während Sitzung Internet trennen | Lokale Bearbeitung weiter möglich. |
| Prozess vor Abschluss beenden | Neustart lädt Google; ungespeicherte Sitzung wird nicht wieder angeboten oder hochgeladen. |
| Google-Fehler beim Abschluss | Kein falscher Gespeichert-Status; Verlassen bleibt möglich; nächster Start lädt Google. |
| Zwei gleichzeitig geöffnete Sitzungen | Letzter erfolgreich gespeicherter Gesamtstand gewinnt, auch wenn er Änderungen der anderen Sitzung ersetzt. |
| Google-403 beim Start | Verständlicher Zugriffsfehler; keine endlose Lademeldung und keine Behauptung eines geladenen Cloudstands. |
| Kalenderfehler | Keine Sperre lokaler Änderungen; tatsächliches Abschlussergebnis anzeigen. |
| Android nur in Hintergrund | Kein künstliches reguläres Beenden und kein Upload pro Pause. |
| Testprogramm neben öffentlicher Version | Lokales Profil, Google-Testarchiv und Kalender bleiben getrennt. |

## Freigabefolge
1. Umsetzung und automatisierte Prüfung des neuen Sitzungsablaufs.
2. Isolierten Installer-Prüfstand mit eindeutiger Version bauen.
3. Kurt prüft die Matrix praktisch; Android entsprechend prüfen.
4. Erst bei Erfolg neue finale Artefakte samt SHA-256 freigeben.
5. Dann vorhandenes öffentliches Angebot über Installer-/Website-Weg zurückziehen und ersetzen.

Status dieser Datei: Vereinbarung und konkrete Abnahmebedingungen festgehalten.
Noch kein Umbau als fertig behauptet, kein neuer Installer/APK gebaut, keine öffentliche Datei ersetzt.

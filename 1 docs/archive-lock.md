# Archiv-Schreibschutz – Alpha 09

## Implementierter Umfang

Der Backend-Einstieg für Eintragen, Archivänderungen, Serienlöschung, Kalender-Eintragen,
Wartung und Kalender-Neuaufbau hält während des gesamten Vorgangs eine exklusive
Dateisystemsperre im tatsächlichen Archivverzeichnis. Wartung hält die Sperre auch über
Google-Anfragen hinweg. Ein konkurrierender Vorgang erhält einen zentralen DE/EN-Hinweis.
Lesen bleibt verfügbar. Die Sperre wird bei Rückgabe und Fehler freigegeben.

Eine atomare mkdir-Vergabe serialisiert Prüfen/Anlegen/Freigeben der Sperre. Besitzer:
Rechnername, Prozess-ID, zufälliges Besitzertoken und Zeitpunkt. Das Token verhindert,
dass ein Vorgang eine inzwischen fremde Sperre freigibt. Keine Tokens/API-Keys enthalten.
Datei `.serkal-write-lock.json`, kurzzeitiges Vergabeverzeichnis `.serkal-write-guard`.
Sperren werden nicht mit den TXT-Archivdaten nach Google exportiert.

Ist der ursprüngliche Prozess auf demselben Rechner nachweislich beendet, darf der
nächste Vorgang dessen Sperre übernehmen. Fremde Rechner, unlesbare Sperren, unbekannte
Prozesszustände und unterbrochene Vergabe werden gesperrt gehalten. Kein automatisches
Löschen nach einer bloßen Zeitüberschreitung. Bei übrig gebliebenem Vergabeverzeichnis
muss die Ursache geprüft werden; nicht während laufender Schreibvorgänge entfernen.

Zusätzlich korrigiert: IPC-Speichern und Löschen warten nun auf ihr asynchrones Ergebnis,
bevor eine neue Cloud-Veröffentlichung eingeplant wird.

## Grenzen: kein fertiger Vier-Geräte-Schutz

Diese Sperre schützt Prozesse, die auf dasselbe tatsächliche Dateisystem zugreifen.
Replizierte Google-Drive-Ordner besitzen keine gemeinsame atomare mkdir-Vergabe.
Gleichnamige lokale Ordner auf PC/Laptop sind daher NICHT gegenseitig gesperrt.
Ältere Versionen beachten die neue Sperre ebenfalls nicht.

Der bestehende Cloud-Archivstand ist weiterhin ein Nur-Lese-Snapshot für Android und
lässt nur seinen bisherigen Quell-Desktop veröffentlichen. Andere Desktop-Archive werden
nicht dadurch vereinigt. Android bleibt ohne Schreibzugriff. Keine neue Google-Berechtigung,
kein zentraler SerKal-Server, keine Übertragung zusätzlicher Nutzerdaten eingeführt.

Für 1.2 noch zwingend erforderlich: gemeinsamer autoritativer Archivstand, zentrale atomare
Vergabe für Konto+Archiv, Schutz gegen veraltete Schreibstände und verbindliche Prüfung
bei jedem Cloud-Schreibvorgang, sowie Konto-/Gerätewechsel und sichere Wiederherstellung.
Eine reine synchronisierte Sperrdatei genügt dafür nicht. Die zuverlässige Zentralvergabe
ist noch nicht an einen produktiven Dienst angebunden; daher keine Freigabe des
Android-Schreibens und keine Veröffentlichung von 1.2 als fertig.

## Prüfung

Automatisch: konkurrierender zweiter Node-Prozess wird abgewiesen; Freigabe bei Erfolg
und Fehler; abgestürzter Besitzer desselben Rechners wird erkannt; fremder Besitzer bleibt
unangetastet; beschädigte Sperre blockiert. Alle 16 vorhandenen Testskripte bestanden.

Windows-Test auf einer separaten Archivkopie (nicht am einzigen Original): normal eintragen,
ändern, löschen; danach Wartung und zweites Schreiben während des laufenden Vorgangs.
Letzteres muss die Sperrmeldung bringen. Nach Abschluss muss Schreiben wieder möglich sein.
Die vier Geräte werden erst nach der zentralen Cloud-Anbindung gemeinsam geprüft.

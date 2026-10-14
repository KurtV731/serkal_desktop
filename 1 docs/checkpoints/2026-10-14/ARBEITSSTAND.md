# SerKal – gesicherter Arbeitsstand nach Unterbrechung

Stand: 14.10.2026 · CE · ausschließlich Teilauftrag „Arbeitsstand sichern“

**Die große Entwicklungsaufgabe ist pausiert. Dieser Bericht ist keine Freigabe für
Website, Play Store oder die Installation eines unsigned Android-Artefakts.**

## Kurzfassung für Kurt

- Windows: **1.2 Alpha 15** ist als Quellstand gespeichert; 22 Testskripte bestanden.
- Android: **0.0.5a11** wurde auf GitHub gebaut; 21 Unit-Tests bestanden. Noch keine
  signierte/installierbare a11-Datei an Kurt geliefert.
- Vier zusätzliche lokale Änderungen waren beim Abbruch offen. Sie sind hier als
  ausdrücklich ungeprüfte .pending-Dateien gesichert; keine neue a12 gebaut.
- Der reale Google-/Windows-/Pixel-/Samsung-/Gerätewechseltest ist offen.
- Punkt **1A** (Website-Vorab-APK mit passendem QR-Code) ist nicht ausgeführt.

## Nachgewiesene Quellstände

| Teil | Zweig | Commit | Status |
| --- | --- | --- | --- |
| Desktop | serkal-0.0.5-archiv-start | b6d25a79bbe3c95735e8d25382407508983506f7 | Version 1.2.0-alpha.15, noch kein Windows-Livetest |
| Android | android-preview-0.0.5 | fb0744f90b420f3b25f5cfa41d7fe3ba8836cf38 | VersionName 0.0.5a11, versionCode 19 im Quellstand; CI erfolgreich |

Desktop-Änderung entstand zuerst als Alpha 14 und wurde auf Alpha 15 fortgesetzt.
Android-Zwischenbuilds a9/a10/a11 wurden nicht an Kurt als installierbare APK geliefert.
Die zuletzt gelieferte und von Kurt bezüglich Bildern/Version bestätigte APK ist a8.
Öffentliche Desktop-1.1, Website-Dateien und Google-Console wurden durch diese Arbeit nicht geändert.

## Bereits implementiert – praktische Prüfung noch erforderlich

### Gemeinsames Archivformat

- Vollständige TXT-Dateiinhalte, keine bloße Rekonstruktion aus Anzeigezeilen.
- Original-/DE-Startanker, Originaltermine, Offsets, Notizen, Beschreibungen und manuelle
  Flags bleiben in den Dateien erhalten. Kalender-Modus und Kalender-ID werden mitgeführt.
- Private Google-appDataFolder-Dateien mit Namen serkal-copy-v2-UUID.json.
- Unveränderliche Archivstände mit Vorgängerkennung; abweichende Zweige werden angehalten.
- Konto, Dateinamen, Inhalts-Prüfsummen und Größen werden geprüft. Kein Transfer von
  API-Schlüsseln, OAuth-Tokens, lokalen Pfaden oder Logdateien mit dem Archiv.
- Ausstehende Upload-ID/Inhalt werden lokal gespeichert. Uploadbestätigung per direktem
  Abruf der geschriebenen Datei verhindert Abhängigkeit von sofort aktueller Dateiliste.
- Spätere lokale Änderungen werden durch Abschluss eines älteren Transfers nicht erledigt.

### Windows

- Neue Module archive-copy.js, archive-copy-desktop.js und archive-calendar-copy.js.
- Lokale TXT-Arbeit, Startübernahme, Hintergrundleistung, Synchronisationsstatus und
  „Jetzt synchronisieren“; alte Auftragsschlange/Cloud-Dauerabfrage im normalen neuen Modus abgelöst.
- Lokale Sicherung vor Archivübernahme und Wiederherstellungsjournal.
- Speicherprüfung: mindestens 10 MiB beziehungsweise Platz für drei Kopien plus Reserve.
- Abweichendes Google-Konto, Konflikt, alter unquittierter Android-Auftrag und zu wenig
  Speicher blockieren Schreiben mit verständlichem Hinweis.
- SYNC-Zeilen im vorhandenen Desktop-Log. Keine Änderung der öffentlichen 1.1.

### Android a11

- ArchiveCodec, ArchiveCopyClient, CalendarCopy und AndroidArchiveCopy hinzugefügt.
- Kontogebundene lokale Kopie mit AtomicFile, lokale Eingabe/Notiz-/Offsetänderung/Löschung.
- Eigener Hintergrund-Executor für Übertragung; Such-/Posterabruf davon getrennt.
- Status, „Jetzt synchronisieren“, Offline-Kopie und Lesemodus bei Speicherknappheit.
- Direkte Kalenderabgleichslogik und kleine kontogebundene Log-Anzeige.
- Zusätzliche angeforderte Rechte: calendar.app.created und calendar.calendarlist.readonly;
  drive.appdata/openid/userinfo.email bleiben. Keine neuen breiten Kalenderrechte.
- App-Paket bleibt de.serkal.android.preview.v005. Spätere Auslieferung muss mit dem
  bisherigen privaten Signaturschlüssel erfolgen; keinen neuen Schlüssel erzeugen.

## Prüfungen und ihre Grenzen

Am 14.10. erneut alle **22 Desktop-Node-Testskripte** erfolgreich ausgeführt.
Die relevanten lokalen Backend-/UI-/Synchronisationsdateien wurden anhand ihrer Git-Blob-
Prüfsummen mit den vorhandenen GitHub-Ständen verglichen. Veröffentlichte UI-Skripte
wurden im vorherigen Entwicklungslauf einzeln und im gemeinsamen Gültigkeitsbereich geparst.

Android-CI **38595315565**, Commit fb0744f90b420f3b25f5cfa41d7fe3ba8836cf38, erfolgreich. Die JUnit-XML-Berichte
wurden aus dem vorhandenen Artefakt gelesen: **21 Tests, 0 Fehler, 0 Fehlschläge, 0 übersprungene Tests**.
Artefakt **11910030195**, Name 0.0.5a11-SerKal-Android-unsigned, ZIP 3.673.328 Bytes.
Es wurde bei diesem Sicherungsauftrag kein Build gestartet, keine APK signiert und kein
Programmcode auf den Entwicklungszweigen geändert.

Die Tests beweisen keine echten Google-Berechtigungen und keinen bestandenen Vier-Gerätebetrieb.
Noch offen: praktische Startübernahme, richtige Kalender-ID auf allen Geräten, tatsächliche
Android-Kalenderberechtigung, Verhalten beim Prozessabbruch und Gerätewechsel sowie Lesbarkeit.

## Vier beim Abbruch nicht übertragene Änderungen

Die folgenden vollständigen Dateiinhalte sind als Sicherung in diesem Ordner abgelegt.
**Sie liegen absichtlich außerhalb der aktiven Programm-/Workflowpfade. Nicht als fertige
Fassung installieren und nicht ohne Prüfung über den bestätigten Stand kopieren.**

| Sicherungsdatei | Ursprünglicher Pfad | Zweck |
| --- | --- | --- |
| MainActivity.java.pending | android-preview/app/src/main/java/de/serkal/android/preview/MainActivity.java | Nach lokaler Notizänderung Anzeige aktualisieren; nach Löschen Auswahl/Poster zurücksetzen und Suchfeld behalten |
| app-build.gradle.pending | android-preview/app/build.gradle | Vorbereiteter Versionswechsel a11/code19 → a12/code20 |
| android-preview.yml.pending | .github/workflows/android-preview.yml | Artefaktname für vorgesehenen a12-Build |
| archive-copy-v2.md.pending | 1 docs/archive-copy-v2.md | Anleitung auf vorgesehenen a12-Stand angepasst |

Der lokale Test archive-copy.test.js inklusive Prüfung einer verzögerten Google-Dateiliste
ist bereits Bestandteil des gespeicherten Desktop-Commits; keine zusätzliche verlorene Teständerung.

## Bekannte Grenzen für den nächsten Entwickler

- Die ersten vollständigen Daten müssen vom bisherigen Quell-PC stammen. Ein alter
  Android-Anzeigestand darf nicht als vollständiges Archiv hochgestuft werden.
- Alle Geräte müssen für den neuen Ablauf auf passende neue Fassungen wechseln.
  Alte Clients schreiben weiterhin ihren bisherigen v1-Stand; nicht gemischt verwenden.
- Ein alter Android-Auftrag ohne Quittung blockiert die erste Migration. Vorher mit
  der bisherigen Fassung abschließen; keine unbegründete Löschung von Aufträgen.
- Kalender und Drive bilden keine gemeinsame atomare Transaktion. Bereits erledigte
  Kalenderoperationen vor einer unterbrochenen Archivpublikation sind möglich; die
  Wiederaufnahme muss live geprüft werden. Manuelle Kalenderänderungen werden geschützt.
- Noch keine automatische Bereinigung der vollständigen Versionshistorie, keine
  neue getestete Cloud-Löschfunktion und keine aktualisierte öffentliche Datenschutzfreigabe.
- Android kann Hintergrundprozesse beenden. Dauerhafte lokale Sicherung und Wiederaufnahme
  sind vorgesehen; ununterbrochene Hintergrundlaufzeit ist nicht zugesichert.
- Windows-Wartung und Android-Funktionsgleichheit sind separate spätere Aufgaben.

## Nächster Einzelauftrag – ausschließlich Windows

Den gespeicherten **Alpha-15-Stand** prüfen und mit Kurt den ersten Windows-Livetest durchführen.
Dafür zuerst Archiv sichern und alte SerKal-Instanzen schließen; im bisherigen CE-Zweig
auf dem bisherigen Quell-PC git pull und npm start. Kopf muss Alpha 15 anzeigen.
Zunächst keine Testeingabe/Löschung: Bestand und Synchronisationsstatus prüfen, bis
„Bei Google gespeichert“ erscheint. Bei Fehler Status und SYNC-Log auswerten; keinen
Ersatzkalender blind anlegen und keine offenen Aufträge blind löschen.

**Android a11 ist derzeit kein an Kurt ausgeliefertes Installationsangebot.** Bis zum
separaten Android-Auftrag bleibt dort a8. Danach die vier .pending-Änderungen prüfen,
entscheiden ob sie übernommen werden, neue eindeutige Version bauen, mit dem bisherigen
Schlüssel signieren und die fertige APK verifizieren und bereitstellen.

Dann separater Test PC → Handy → Laptop und Abbruch/Wiederaufnahme. Erst danach **1A**:
Website-Chatty erhält die konkrete geprüfte Vorab-APK samt Angaben; QR-Code muss zum
Android-Download führen. Nicht auf die Fertigstellung sämtlicher Wartungsfunktionen warten.
Kein Website-/Play-Store-Release in diesem Sicherungsauftrag.

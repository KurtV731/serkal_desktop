# SerKal 1.2.2 – Korrektur des langen Abschlusses und Fortschrittsanzeige
28.10.2026 · CE an Kurt / Installer / Website

## Verbindlicher Anlass
Die reale Abnahme von 1.2.1 ist fehlgeschlagen: auf allen vier Geräten mehr als zwei Minuten beim Beenden, auch ohne Bearbeitung. 1.2.1 bleibt unveröffentlicht und wird nicht überschrieben.
Kurt verlangt zusätzlich eine sichtbare Verlaufsanzeige sowie eine verständliche Erklärung der alten Speichern-Anzeige unten links.

## Codebefund und Grenzen
Desktop 1.2.1 initialisierte calendarPending=true und nahm dadurch auch unveränderte Sitzungen in den vollständigen Abschluss auf.
Android 1.2.1 startete beim Beenden Google-Autorisierung und Kalenderabschluss ohne vorgeschalteten unveränderten Schnellweg.
Zusätzlich hatte Desktop einen doppelten Kalenderziel-/Identitätscheck, mögliche interaktive Kalenderanmeldung beim Beenden und seriell ausgeführte Kalenderereignisse.
Das sind konkrete Codebefunde. Welche einzelne Anfrage auf Kurts Geräten die gemessenen zwei Minuten verursachte, ist ohne Messung nicht nachgewiesen.

## Umgesetzt auf beiden Plattformen
- Tatsächlichen Archivstand mit dem geladenen Anfangsstand vergleichen; bloßes dirty-Signal ohne Datenänderung löst keine Übertragung aus.
- Unveränderte Sitzung: kein Archivupload, kein Kalenderabgleich und keine Google-Autorisierung beim Beenden.
- Rückgängig gemachte bytegleiche Bearbeitung: gleicher Schnellweg.
- Einmalige echte Altbestandsübernahme bleibt ein erforderlicher Abschluss; ein Versionswechsel allein erzwingt keinen Upload eines unveränderten bereits vorhandenen Sitzungsarchivs.
- Reine Gesehen-Änderung: genau ein vollständiger Archivupload, kein Kalenderzugriff.
- Kalender nur dann abgleichen, wenn tatsächlich kalenderrelevante Inhalte wie Termine, Titel, Anbieterhinweise oder Kalenderziel geändert sind oder ein in derselben Sitzung gemeldeter Kalenderfehler ausdrücklich erneut versucht wird.
- Der echte Archivstand bleibt bei Änderungen eine vollständige Kopie. Keine laufenden Hintergrundabfragen oder Einzeluploads.
- Kalenderereignisse mit maximal vier parallelen Anfragen abarbeiten und alle gestarteten Anfragen abwarten. Nach einem Fehler keine weiteren Aufgaben einplanen.
- Google-Netzanfragen begrenzen; Abschlussbudget 45 Sekunden im neuen Sitzungsweg, übliche einzelne Netz-Leseanfrage maximal 15 Sekunden. Android begrenzt die zusätzliche SDK-Autorisierungswartezeit auf 10 Sekunden und protokolliert einen Ausfall.
- Desktop öffnet beim Beenden keine neue interaktive Kalenderanmeldung. Fehlende Kalenderverbindung wird als separater Kalenderfehler gemeldet; der Archivabschluss bleibt möglich.
- Fehler und Zeitüberschreitungen werden vollständig protokolliert und gemeldet, ohne eine geänderte Sitzung stillschweigend als gespeichert auszugeben.
- Desktop nimmt während des Abschlusses keine neuen Renderer-Eingaben in einen bereits eingefrorenen Uploadstand an; bei abgebrochenem Abschluss wird die Oberfläche wieder freigegeben.

## Anzeige und Bedienung
Bei längerem Abschluss: sichtbarer Fortschrittsbalken, laufende Phase und verstrichene Sekunden. Bei bekanntem Kalenderumfang zusätzlich fertige Einträge x von y. Unbekannter Netzwerkfortschritt wird unbestimmt angezeigt, keine erfundenen Prozentwerte.
Android aktualisiert diese Anzeige lokal alle 500 ms; der Desktop nutzt seine vorhandene lokale Statusabfrage. Das sind keine Google-Hintergrundabfragen.

Die alte Anzeige unten links war eine Statusanzeige, keine Google-Speicheraktion. Sie unterschied nur offene lokale Eingaben und sagte irreführend „Alles gespeichert“.
Sie zeigt jetzt:
- „Keine Änderungen · Beenden ohne Übertragung“
- „Änderungen werden beim Beenden bei Google gespeichert“
- lokale Übernahme / tatsächliche Abschlussphase während der Arbeit.

Der Menüpunkt für offene Editorbearbeitungen heißt jetzt **„Lokal übernehmen“** und erklärt ausdrücklich: Google wird erst beim Beenden aktualisiert. Er kann lokale Editoränderungen vor Wartung/Neuladen übernehmen. Beim regulären Beenden werden diese offenen Eingaben wie zuvor automatisch übernommen; dafür ist kein vorheriger manueller Klick nötig.

## Getrennte Messungen
Desktop protokolliert measurement mit phase, elapsedMs, ok für close-unchanged, archive-connect, archive-upload, calendar-prepare und calendar-sync.
Android protokolliert PHASE_END mit elapsedMs und Ergebnis für unveränderten Abschluss, SDK-Autorisierung, Archivverbindung/-upload und Kalender. Zusätzlich werden einzelne Archiv-/Kalender-HTTP-Zeiten protokolliert.
Bei einem weiterhin langsamen Test den neuen Abschluss-Logabschnitt auswerten; keine Dauerursache raten.

## Versionen und festgeschriebene Quellen
- Beide Plattformen: **1.2.2**
- gemeinsamer Archivstand: **36**
- Android versionCode: **45**
- Desktop Bauquellcommit: **2b953689d6eef9e981fcd323a950b4d2fcafac96**
- Android gebauter Quellcommit: **3938ade3e2cdb43ecf225295fc2e06de13dacfd3**
- PR #14 und #15 in reguläre Desktop-/Androidzweige übernommen.
- Neue Windows-Bau-BAT auf main: **serkal-1-2-2-ersatz-bauen.bat**
- Eigene Windows-Bau-/Ausgabeordner: C:\ppd\serkal\build\release-1.2.2 und C:\ppd\serkal\veroeffentlichungen\1.2.2
- Der alte fehlgeschlagene Ordner 1.2.1 bleibt bestehen.

## Prüfungen
Desktop: alle **40 Testskripte** lokal und CI erfolgreich:
https://github.com/KurtV731/serkal_desktop/actions/runs/40650624169

Android: **77 Tests, 0 Fehlschläge, 0 Fehler**, anschließend Release-APK erfolgreich:
https://github.com/KurtV731/serkal_desktop/actions/runs/40649884535

Neue konkrete Nachweise:
- unverändert schließen: null weitere Google-Clients/-Autorisierung/-Kalender/-Uploads;
- auch der echte Android-Beenden-Knopf beendet die unveränderte Activity unmittelbar ohne Google-Abschluss;
- reine Gesehen-Änderung: ein Upload und null Kalenderanfragen;
- tatsächliche Kalenderänderung: Abgleich und fertige Stückzahlen;
- tatsächlicher Desktop-TXT-Parser/Terminplaner: Gesehen und JSON-Schlüsselreihenfolge erzeugen keinen falschen Kalenderbedarf;
- Phasenmessungen vorhanden und Fehlerphasen als erfolglos markiert;
- abgelaufenes Abschlussbudget startet keine weitere Netzwerkanfrage;
- begrenzte parallele Kalenderoperationen vollständig abgewartet.

## Fertige Android-Datei
- **036-SerKal-Android-1.2.2.apk**
- **2290075 Byte**
- SHA-256: **4d6958dbba06f51e0722889cd1774833604d42b2890d7d5b87f3aa024899c9b8**
- unveränderte Paketkennung de.serkal.android.preview.v005
- bisheriger Signaturschlüssel, v2/v3 und Zertifikatsübereinstimmung geprüft;
- APK-Metadaten 1.2.2/code45 geprüft; Manifest vor/nach Signieren bytegleich.
- Kurt direkt bereitgestellt. Exakt dieselbe Datei weiterverwenden, nicht erneut bauen/signieren.

## Konkreter Installer-Auftrag
Die neue Windows-Bau-BAT mit dem genannten Pin ausführen, EXE und Prüfsumme unter dem neuen 1.2.2-Ordner bereitstellen. Die neue APK unverändert daneben als serkal-android.apk übernehmen und SHA erneut prüfen.
In dieser CE-Umgebung ist keine Windows-EXE erzeugt worden; sie benötigt den vorhandenen Windows-Bauplatz und die dortige private OAuth-Beilage.
Kein Konzeptlos oder weiterer fachlicher Entwurf ist für diesen Bau offen.

## Erneute praktische Abnahme
Alle Geräte zuerst auf 1.2.2 bringen und danach nacheinander verwenden.
1. Öffnen, Google geladen abwarten, ohne Bearbeitung beenden: kein unnötiges „Speichern auf Google“, zügiger Abschluss.
2. Eine Gesehen-Änderung, regulär beenden: ein Archivabschluss; nächstes Gerät lädt den geänderten Stand.
3. Echte Termin-/Serienänderung: Kalenderabschluss mit sichtbarer Phase und gegebenenfalls x/y.
4. Bei Fehler: vollständiger Bericht, kein falsches „gespeichert“.

Die reale Dauer auf Kurts vier Geräten und seinem Google-Konto ist erst durch diesen neuen Praxistest bestätigt. Kein öffentlicher Download wurde durch CE ersetzt. Veröffentlichungssperre bleibt bis zur praktischen Abnahme bestehen.

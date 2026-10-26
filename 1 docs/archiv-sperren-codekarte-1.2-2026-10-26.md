# SerKal 1.2 – Codekarte der Archiv-, Nachlade- und Synchronisationssperren

Stand: 26.10.2026. Auftrag: Kurt. **Bestandsaufnahme des ausgelieferten Codes; keine Änderung der Programmfunktion.**

Quellengrundlage: Windows-Baucommit `a046d4d3b2cbfe1f92e75e5167d9910043e84649` und finaler Android-Baucommit `f55bda2ad85b9e1e2752af6d0e244fbd313dcac5` (APK 1.2.0, versionCode 41). Die zentralen Desktop-Dateien sowie AndroidArchiveCopy wurden zusätzlich mit den aktuellen regulären Branches verglichen: gleiche Git-Dateiobjekte.

Hier geht es um Archivänderungen, Google-Abgleich, Nachladen, Wartungsübernahme und Schließen. Poster-Nachladen und gewöhnliche Eingabeprüfungen sind davon getrennte Vorgänge.

## 1. Der gemeinsame Eingang vor Desktop-Schreibaktionen

[main.js – archiveWriteHandler_()](https://github.com/KurtV731/serkal_desktop/blob/a046d4d3b2cbfe1f92e75e5167d9910043e84649/2%20src/backend/main.js#L3587) schaltet **vor Eintragen, Änderungen speichern, Löschen, Kalenderaufnahme und Wartung** dieselbe Prüfung:

```text
Bedienaktion
→ DesktopCopy.assertWrite()
→ lokale Dateisperre
→ eigentliche Aktion
→ Änderung als noch zu übertragen markieren
```

Die eigentliche Löschfunktion kann also in Ordnung sein und trotzdem nie erreicht werden.

### Die entscheidenden vier Abweisungen

[archive-copy-desktop.js – assertWrite()](https://github.com/KurtV731/serkal_desktop/blob/a046d4d3b2cbfe1f92e75e5167d9910043e84649/2%20src/common/archive-copy-desktop.js#L29), zur Lesbarkeit in Zeilen zerlegt:

```js
if (this.fatal()) copyError(this.error);
if (this.busy) copyError('COPY_SYNC_BUSY');
if (!this.initialized) copyError('COPY_LOADING');
if (!this.available()) copyError('COPY_LOW_SPACE');
```

| Prüfung | Was sie tatsächlich verlangt | Wirkung / wie sie wieder frei wird |
| --- | --- | --- |
| fatal() | Kein als sperrend eingestufter Fehler gespeichert | Ursache klären und erfolgreich abgleichen; bei Konflikt/fehlender Historie kann die ausdrückliche Archivwahl helfen |
| busy | Es läuft gerade kein Abgleich | Schreibversuch wird abgewiesen; nach Ende des Vorgangs erneut versuchen |
| initialized | Der Kopiermanager wurde erfolgreich initialisiert oder ein bereits bestätigter Basisstand ist wieder verwendbar | Bei Erstübernahme ist ein erfolgreicher Abgleich erforderlich; bloß vorhandene TXT-Dateien genügen dafür nicht |
| available() | Archivordner ist zugänglich und Speicherreserve reicht | Ordner-/Zugriffs- bzw. Speicherproblem klären |

**Der frühere konkrete Fehler:** Früher wurde `!initialized` vor dem gespeicherten Konflikt geprüft. Deshalb verdeckte „Archiv wird vorbereitet“ die eigentliche Konfliktsperre. In 1.2 steht der Konflikt zuerst. Der Text `COPY_LOADING` ist weiterhin vorhanden und wird bei tatsächlichem fehlendem Initialisierungsstand benutzt.

## 2. Welche Fehler Desktop ausdrücklich schreibsperrend behandelt

Die vollständige Liste aus [fatal()](https://github.com/KurtV731/serkal_desktop/blob/a046d4d3b2cbfe1f92e75e5167d9910043e84649/2%20src/common/archive-copy-desktop.js#L29):

| Fehlercode | Grund |
| --- | --- |
| COPY_VERSION_MISMATCH | Archivfreigabe ist neuer als die Anwendung bzw. Versionsprüfung wurde noch nicht erfolgreich geklärt |
| COPY_CONFLICT | Lokale Änderungen und Google-Basis passen nicht zusammen oder mehrere konkurrierende Archivzweige |
| COPY_ACCOUNT_CHANGED | Google-Konto passt nicht zum gespeicherten Archivbesitzer bzw. Kalenderkonto |
| COPY_LOW_SPACE | Speicherreserve reicht laut Prüfung nicht |
| COPY_LOCAL_STATE_INVALID | Lokale Synchronisations-Zustandsdatei lässt sich nicht zuverlässig lesen |
| COPY_INVALID | Übertragenes Archiv oder seine Metadaten bestehen die Prüfung nicht |
| COPY_HISTORY_MISSING | Eine für die Archivkette benötigte Vorgängerversion fehlt |
| COPY_NEEDS_SOURCE | Erstübernahme aus dem älteren Aufbau muss auf dem bisherigen Quell-PC erfolgen |
| COPY_LEGACY_PENDING | Aus dem alten Android-Auftragsverfahren ist noch ein unbestätigter Auftrag vorhanden |
| COPY_CALENDAR_TARGET_MISSING | Gespeichertes Kalenderziel nicht erreichbar, kein eindeutig passender vorhandener Kalender gefunden |
| COPY_CALENDAR_AMBIGUOUS | Mehrere mögliche Kalenderziele |
| COPY_CALENDAR_ACCESS_DENIED | Google verweigert Zugriff auf das Kalenderziel |

`fatal` ist hier der Name der Schreibsperren-Prüfung, keine Aussage, dass alle Daten zerstört wären.

**Auffällig:** Die letzten drei Kalenderfehler sperren auf Desktop auch neue lokale Archiv-Schreibaktionen, obwohl die Ursache beim Kalender liegt.

## 3. Android hat einen eigenen Schreibschalter

[AndroidArchiveCopy.java – writable()](https://github.com/KurtV731/serkal_desktop/blob/f55bda2ad85b9e1e2752af6d0e244fbd313dcac5/android-preview/app/src/main/java/de/serkal/android/preview/AndroidArchiveCopy.java#L56):

```java
return loaded && state.has("record") && space()
    && !fatal() && !closed && !busy;
```

Android verlangt also: geladen, Archiv vorhanden, genügend Speicher, kein sperrender Fehler, nicht geschlossen und kein laufender Abgleich.

Seine `fatal()`-Liste enthält Versionskonflikt, Archivkonflikt, Kontowechsel, ungültigen lokalen Zustand, ungültiges Archiv, fehlende Historie sowie die beiden Altübernahmefälle. Kalenderziel-Fehler sind dort nicht dieselbe zusätzliche dauerhafte lokale Schreibsperre wie auf Desktop.

[MainActivity.writeReady()](https://github.com/KurtV731/serkal_desktop/blob/f55bda2ad85b9e1e2752af6d0e244fbd313dcac5/android-preview/app/src/main/java/de/serkal/android/preview/MainActivity.java#L467) macht daraus häufig nur:

> Archiv derzeit nur lesbar. Synchronisationsstatus beachten.

**Damit wird auch „gerade beschäftigt“ als allgemeines „nur lesbar“ ausgegeben.** Der genauere Grund steht gegebenenfalls getrennt beim Synchronisationsstatus.

## 4. „Bitte erst speichern“ und das Nachladen

Das sind zusätzliche Desktop-UI-Prüfungen:

- [guardDirtyBeforeAction_()](https://github.com/KurtV731/serkal_desktop/blob/a046d4d3b2cbfe1f92e75e5167d9910043e84649/2%20src/frontend/index.html#L5018): Solange `state.isDirty` gilt, werden unter anderem Synchronisieren und Neu laden zurückgewiesen. Sichtbar: „Ungespeicherte Änderungen … Bitte erst speichern.“
- [archiveCheckRevision_()](https://github.com/KurtV731/serkal_desktop/blob/a046d4d3b2cbfe1f92e75e5167d9910043e84649/2%20src/frontend/index.html#L5173): Ist eine neue bereits lokal bekannte Archivrevision vorhanden, wird die Ansicht nur erneuert, wenn keine laufende Aktion, kein Speichern und keine ungespeicherte Eingabe im Weg sind.
- Bei offener Eingabe lautet die Meldung: **„Neuer Archivstand vorhanden. Bitte offene Änderungen zuerst speichern.“**
- Der manuelle Neu-laden-Knopf prüft ebenfalls `state.busy`, `state.saveBusy` und den Dirty-Guard.

Die Prüfung läuft in der Ansicht alle zwei Sekunden. Sie ist **kein eigener permanenter Google-Abruf**. Im normalen Kopiermodus wird beim Start synchronisiert; weitere Abgleiche entstehen durch Änderungen, die ausdrückliche Synchronisationsaktion und Wiederholungen nach Fehlern. Die älteren 10-/30-Sekunden-Beobachter stehen im anderen Startzweig: [main.js](https://github.com/KurtV731/serkal_desktop/blob/a046d4d3b2cbfe1f92e75e5167d9910043e84649/2%20src/backend/main.js#L4124).

### Zwei unterschiedliche Arten von „dirty“

- `state.isDirty` in der Oberfläche: Eingaben sind noch nicht als lokale Archivänderung gespeichert.
- `state.dirty` im Kopiermanager: Daten sind lokal gespeichert, aber noch nicht bei Google bestätigt.
- „Lokal gespeichert · Übertragung ausstehend“ ist für sich allein **keine** allgemeine Schreibsperre. Hinzukommen können `busy`, fehlende Initialisierung, ein fatal()-Fehler oder eine Dateisperre.

## 5. Warum Google einen Archivkonflikt meldet

[archive-copy.js – head() und synchronize()](https://github.com/KurtV731/serkal_desktop/blob/a046d4d3b2cbfe1f92e75e5167d9910043e84649/2%20src/common/archive-copy.js#L103) prüfen:

- Jede aktive Revision muss einen zulässigen Besitzer und eine gültige Vorgängerkennung haben.
- Die aktiven Dateien müssen eine zusammenhängende Kette mit einem eindeutigen aktuellen Ende ergeben.
- Fehlender Vorgänger: `COPY_HISTORY_MISSING`.
- Mehrere Wurzeln, mehrere Enden oder widersprechende maßgebliche Kennzeichnungen: `COPY_CONFLICT`.
- Bei ausstehenden lokalen Änderungen muss die Google-Revision noch zur lokal gespeicherten Basis passen. Sonst wird nicht einfach darübergeschrieben.
- Nach Kalenderarbeit wird der Google-Stand vor dem Archivupload erneut geprüft.
- Eine unklar bestätigte Übertragung wird zunächst anhand ihrer bereits gespeicherten Revision/Datei geprüft.

Diese Prüfkette erklärt, warum die bloße Zahl sichtbarer Serien nicht entscheidet: Auch zwei Archive mit derselben Anzahl können verschiedene Inhalte oder Revisionsketten besitzen.

## 6. Die ausdrückliche Wahl des maßgeblichen Archivs

Desktop: [adoptLocal()](https://github.com/KurtV731/serkal_desktop/blob/a046d4d3b2cbfe1f92e75e5167d9910043e84649/2%20src/common/archive-copy-desktop.js#L18) und der Übernahmezweig in `synchronize()`. Android: [makeAuthoritative()/publishAuthority()](https://github.com/KurtV731/serkal_desktop/blob/f55bda2ad85b9e1e2752af6d0e244fbd313dcac5/android-preview/app/src/main/java/de/serkal/android/preview/AndroidArchiveCopy.java#L84).

- Der gewählte vollständige Stand bekommt eine neue maßgebliche Kennzeichnung.
- Andere aktive Google-Archivstände werden aus dem aktiven Verlauf genommen.
- Andere aktualisierte Geräte übernehmen diese Kennzeichnung bei ihrem Abgleich.
- Die erzwungene Übernahme soll je Gerät **einmal** erfolgen. Danach sind neue lokale Änderungen wieder normale Änderungen.
- Auf Desktop erscheint der rote Knopf bei Konflikt oder fehlender Historie. Android bietet zusätzlich die Fortsetzung einer bereits vorgemerkten Übernahme an.
- Der Knopf ist kein allgemeiner Ersatz für Versionsprüfung, passende Konten, lesbare Daten und die laufende Beschäftigungssperre.

**Der inzwischen reparierte Rücksetzfehler:** Die maßgebliche Kopie wurde früher wiederholt angewendet. Dadurch konnten neue Gesehen-Änderungen sofort wieder verschwinden. Die aktuelle Prüfung vergleicht zuerst, ob das Gerät diese Kennzeichnung schon bestätigt hat.

## 7. Konto, Versionsstand und lokale Zustandsdatei

- **Konto:** Besitzerprüfung beim Laden/Übertragen und zusätzlich am Desktop-Kalenderkonto. Abweichung: `COPY_ACCOUNT_CHANGED`. Ein fehlgeschlagener Identitätsabruf ist nicht dasselbe wie ein bestätigter Kontowechsel.
- **Version:** Geprüft wird die gemeinsame Archivfreigabe `releaseNumber`, aktuell **32**. Androids `versionCode 41` ist eine andere Nummer und für sich kein Archivkonflikt. Neuere Anwendungen dürfen ältere gespeicherte Snapshots übernehmen; ältere Anwendungen dürfen keine neueren Archive schreiben.
- Eine erkannte Versionssperre wird im lokalen Synchronisationszustand als `releaseMismatch` festgehalten. Ein Neustart ohne erfolgreiche Prüfung soll sie nicht umgehen.
- Desktop speichert diesen Zustand unter `archive-copy-<Archivpfad-Hash>.json` im Programm-Benutzerprofil; Android kontogebunden als `archive-copy-<Konto-Hash>.json`.
- Kann dieser Zustand nicht gelesen werden, kann das Schreiben gesperrt sein, obwohl die eigentlichen Seriendaten noch sichtbar sind. Eine Zustandsdatei ist also nicht dasselbe wie eine Serien-TXT-Datei.

Quellen: [Desktop-Kopiermanager](https://github.com/KurtV731/serkal_desktop/blob/a046d4d3b2cbfe1f92e75e5167d9910043e84649/2%20src/common/archive-copy-desktop.js#L6), [Versions-/Archivprüfung](https://github.com/KurtV731/serkal_desktop/blob/a046d4d3b2cbfe1f92e75e5167d9910043e84649/2%20src/common/archive-copy.js#L6), [Android-Zustand und Prüfung](https://github.com/KurtV731/serkal_desktop/blob/f55bda2ad85b9e1e2752af6d0e244fbd313dcac5/android-preview/app/src/main/java/de/serkal/android/preview/AndroidArchiveCopy.java#L28).

## 8. Speicher und Dateisperre

### Speicherreserve

[archive-copy.js – writable()](https://github.com/KurtV731/serkal_desktop/blob/a046d4d3b2cbfe1f92e75e5167d9910043e84649/2%20src/common/archive-copy.js#L58): mindestens **10 MiB** oder, bei größeren Datenmengen, dreifache Payloadgröße plus 1 MiB. Android hat eine entsprechende Prüfung.

**Auffällige Meldungsvereinfachung:** Desktop `available()` gibt bei beliebigen Fehlern im Ordner-/Dateizugriff ebenfalls `false` zurück. Die Ansicht kann daraus „Zu wenig freier Speicher“ machen. Diese Anzeige beweist deshalb allein keinen tatsächlich vollen Datenträger.

### Echte lokale Schreibsperre

[archive-lock.js – acquire()/withWriteLock()](https://github.com/KurtV731/serkal_desktop/blob/a046d4d3b2cbfe1f92e75e5167d9910043e84649/2%20src/common/archive-lock.js#L9) verwendet:

- `.serkal-write-lock.json`: Besitzer mit Rechner, Prozesskennung und Token.
- `.serkal-write-guard`: Verzeichnis als kurze atomare Zugangssperre.
- Aktiver Prozess oder anderer Rechner: `ARCHIVE_LOCK_BUSY`.
- Nicht lesbarer/eindeutiger Sperrdatensatz: `ARCHIVE_LOCK_UNKNOWN`.
- Beim Freigeben abweichendes Besitzertoken: `ARCHIVE_LOCK_LOST`.

Die Dateisperre koordiniert Zugriffe auf das reale Dateisystem. Der Code weist selbst darauf hin, dass durch einen Synchronisationsclient replizierte Ordner damit keine verlässliche geräteübergreifende Mutex-Sperre erhalten. Der Google-Abgleich besitzt deshalb zusätzlich seine eigene Revisionsprüfung.

Eine tote Prozesskennung des eigenen Rechners kann der Code bereinigen. Für ein bereits vorhandenes Guard-Verzeichnis enthält die gezeigte Erwerbslogik dagegen keine Ablaufzeit. Das ist eine Eigenschaft der Logik, kein Nachweis, dass eine solche Datei bei Kurt vorliegt.

## 9. Der Kalender kann die Archivübertragung aufhalten

Im normalen Übertragungszweig kommt **Kalenderabgleich vor Archivupload**. Daher kann ein Kalenderfehler die Google-Bestätigung des Archivs verhindern.

- [copy-calendar-target.resolve()](https://github.com/KurtV731/serkal_desktop/blob/a046d4d3b2cbfe1f92e75e5167d9910043e84649/2%20src/common/copy-calendar-target.js#L5): fehlendes, mehrdeutiges oder verweigertes Ziel.
- [archive-calendar-copy.plan()](https://github.com/KurtV731/serkal_desktop/blob/a046d4d3b2cbfe1f92e75e5167d9910043e84649/2%20src/common/archive-calendar-copy.js#L54): ein abweichender manuell geschützter Kalendereintrag führt zu `COPY_CALENDAR_PROTECTED`.
- Android: [CalendarCopy.synchronize()](https://github.com/KurtV731/serkal_desktop/blob/f55bda2ad85b9e1e2752af6d0e244fbd313dcac5/android-preview/app/src/main/java/de/serkal/android/preview/CalendarCopy.java#L32) kann zusätzlich eine fehlende Kalender-ID melden.
- Android merkt eine begonnene Kalenderanlage dauerhaft vor. Ist deren Ausgang unklar, kann `COPY_CALENDAR_CREATE_UNCERTAIN` statt einer blinden zweiten Anlage entstehen.

**Wichtig zur Einordnung:** `COPY_CALENDAR_PROTECTED` allein gehört nicht zur oben genannten fatal()-Liste. Es stoppt den Transfer; zwischen Übertragungsversuchen können lokale Änderungen weiterhin möglich sein. Die drei ausdrücklich aufgeführten Desktop-Kalenderziel-Fehler gehen weiter und sperren dort das Schreiben.

## 10. Wartungsergebnisse dürfen nach lokalen Änderungen abgewiesen werden

[AndroidArchiveCopy.maintenance()](https://github.com/KurtV731/serkal_desktop/blob/f55bda2ad85b9e1e2752af6d0e244fbd313dcac5/android-preview/app/src/main/java/de/serkal/android/preview/AndroidArchiveCopy.java#L71) prüft:

1. Ist Schreiben gerade erlaubt?
2. Ist der lokale Änderungszähler `epoch` noch derselbe wie beim Beginn der Wartung?

Wenn zwischenzeitlich das Archiv bearbeitet wurde, folgt `COPY_LOCAL_CHANGED`. Dann wird das alte Wartungsergebnis nicht auf den inzwischen anderen Stand geschrieben. Sichtbare Folge: „NICHT ÜBERNOMMEN: Archiv geändert oder derzeit nur lesbar …“.

Die eigentliche TMDB-Wartung läuft getrennt. Erst bei der Übernahme kann sie zusätzlich an einem gerade laufenden Google-Abgleich scheitern.

## 11. Sperren beim Beenden

[close-guard.js – prepareClose()](https://github.com/KurtV731/serkal_desktop/blob/a046d4d3b2cbfe1f92e75e5167d9910043e84649/2%20src/common/close-guard.js#L3):

- Als beschäftigt gemeldete UI: Schließen zunächst verweigert.
- Ungespeicherte Eingabe: Speichern, Verwerfen oder Abbrechen.
- Scheitert Speichern oder bleibt die UI danach dirty/busy: Fenster bleibt offen.
- Noch zu übertragende lokale Daten oder laufender Abgleich: Auswahl Synchronisieren, lokal gesichert beenden oder Abbrechen.
- Bei Wahl „Synchronisieren“ muss das Ergebnis ohne dirty/busy und mit Status **genau `saved`** zurückkommen. Ein anderer Status wird von dieser Prüfung abgelehnt, selbst wenn er beispielsweise `authority-applied` heißt.

„Lokal gesichert beenden“ kann diesen letzten Online-Abgleich überspringen; es speichert keine zuvor noch ungespeicherte UI-Eingabe automatisch.

Android verwendet beim ausdrücklichen Beenden inzwischen `finishAndRemoveTask()`. Ein lokal vorgemerkter Transfer bleibt auf Datenträger und wird bei einem späteren Start geprüft.

## 12. Warum bloßes Warten nicht jede Sperre behebt

- Desktop setzt `busy=true` für den **gesamten** Abgleich; Android ebenso.
- HTTP-Anfragen können jeweils bis zu 45 Sekunden laufen. Mehrere aufeinanderfolgende Anfragen ergeben keine gemeinsame 45-Sekunden-Gesamtgrenze.
- Während busy werden Archiv-Schreibaktionen abgewiesen. Suche/Lesen kann weiterhin funktionieren.
- Trotzdem lautet eine sichtbare Meldung „Übertragung läuft · du kannst weiterarbeiten“. Das ist für Archivänderungen weiter gefasst als die tatsächliche Freigabe.
- Bei ausstehenden Änderungen und nicht-fatalem Fehler ist ein erneuter Versuch nach etwa 30 Sekunden vorgesehen.
- Bei fatal()-Fehlern wird diese automatische Wiederholung nicht angesetzt. Konflikt, Kontowechsel oder fehlende Historie werden deshalb nicht durch längeres Warten allein geklärt.
- Ein fehlender Erstabgleich ohne bestätigte Basis kann die Initialisierung offenlassen; vorhandene lokale Dateien allein lösen das nicht.

## 13. Altlogik und weitere Datenprüfungen

- `ARCHIVE_SHARED_READER` stammt vom früheren Quell-PC-/Anzeige-PC-Verfahren. Dieser Zweig ist in der normalen 1.2 durch `copyLocalMode_=true` nicht der reguläre Schreibweg.
- `COPY_NEEDS_SOURCE` und `COPY_LEGACY_PENDING` sind dagegen noch beim Übergang von älteren Google-/Android-Auftragsständen erreichbar.
- Archivprüfungen können ungültige Namen, Prüfsummen, Datums-/Metadaten und zu große Daten zurückweisen: unter anderem `COPY_INVALID`, `COPY_TOO_LARGE` und Android `COPY_INVALID_DATE`.
- Übertragungsgrenzen: 64 MiB sowie höchstens 20.000 Archivdateien; daneben gibt es Antwort-/Zustandsgrößenprüfungen.
- Eine weitere Desktop-Prozessinstanz wird beim Programmstart getrennt abgefangen. Das ist keine Google-Archivkonfliktsperre.

## Kurze Zusammenfassung

Die wiederholt erlebte Blockade entsteht aus mehreren hintereinanderliegenden Schaltern: **offene Eingabe → Schreibfreigabe → Dateisperre → Google-Archivkette → Kalender → Bestätigung**.

Die aktuelle 1.2 enthält weiterhin diese Schichten. Der alte Fehler, bei dem „Archiv wird vorbereitet“ den Konflikt verdeckte, und die wiederholte Rücksetzung nach maßgeblicher Archivwahl sind korrigiert. Die Beschäftigungssperre während des ganzen Abgleichs, die Kalenderkopplung und mehrere stark vereinfachte Meldungen sind im gelesenen Code weiterhin vorhanden.

Diese Karte dokumentiert die Entscheidungen im Code. Sie ersetzt keinen Befund über aktuell auf Kurts Geräten vorhandene Sperrdateien, Konten oder Fehlerzustände.

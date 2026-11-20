# CE SerKal – kompakte Übergabe November 2026

Stand: 20.11.2026 · Nachfolge von Kurt für Samstag, **21.11.2026**, vorbereitet.
Gilt ausschließlich für **SerKal Desktop und Android**. HASA hat einen eigenen CE;
Installer3 und Website haben eigene Zuständigkeiten. Kein gemeinsamer Neubeginn.

## 1. Einstieg und Arbeitsweise

1. [Aktuelles gemeinsames Schwarzes Brett](schwarzes_brett.md) lesen.
2. Diese Übergabe lesen; danach nur auftragsbezogene Quellen.
3. Aktuellen Status im Brett gegen diesen datierten Stand prüfen. Keine Archiv-Pflichtlektüre.
4. Gezielten nächsten Auftrag bearbeiten, Ergebnis und Restpunkte kurz aktualisieren.

Diese Übergabe ersetzt die CE-Startanweisung vom23.10.; deren Alphas und Konfliktabläufe
sind historische Dokumentation. **main ist Dokumentations-/Integrationsstand und nicht
automatisch die freigegebene Anwendungsquelle.** Branchspitze kann nur Dokumentation/
Bauausgaben ergänzen; für Artefakte immer den ausdrücklich genannten Quellpin verwenden.

Kurt möchte kurze Antworten auf Deutsch, konkrete Hilfe auf seinem tatsächlichen Bildschirm,
keine vermeidbaren Klicks und keine Übertragung technischer Bot-Nachrichten durch ihn.
Er nutzt Diktat; „weiter“ setzt die Arbeit fort. Routinearbeit und verfügbare GitHub-Wege
selbst erledigen. Keine unaufgeforderten Vollprüfungen oder langen Protokollausgaben.
Wunsch: künftig kurze Chatzyklen, spätestens etwa14 Tage, mit fortgeführter Kurzübergabe.


## 2. Verbindliche Ausgangsstände

| Bereich | Geprüfte Quelle | Kanal-/Dokumentstand |
|---|---|---|
| Windows Desktop1.2.6 | **07903512a7ac2de4521182ec8b9a89e4cb030a86** | Branch ce-desktop-1.2.6; Kopf e8765598897f650a27b7abb374c175df9c03f6f8 ergänzt Dokumentation. Öffentlich veröffentlicht, von Kurt praktisch abgenommen. |
| Android1.2.7 / Code51 | **47f4e2240b089f8cc700f6706af388f2baed6a28** | Branch ce-android-keyboard-1.2.7; Kopf c324f8ba0fccef0915a619ea5247b283a13a0afd enthält Übergabedokumentation. Am19.11. signiert und im bestehenden geschlossenen Alpha-Test eingereicht, letzter belegter Status „Wird überprüft“. |
| Android1.2.6 / Code50 Edge | **2043721004a6bbba4faf1454a366c1c9e9d90608** | Vorläufer auf ce-play-edge50; Kopf f3850a199e6d758beac141f8be18e374a241e626. Nicht mit überholter erster Nicht-Edge-Code50-Datei verwechseln. |
| Website-APK | 1.2.4 / Code47 | Getrennter öffentlicher APK-Kanal; keine automatische Aktualisierung durch Play-Einreichung. |
| Gemeinsame Daten | **Archivstand38** | Bleibt bei Desktop1.2.6 und Android1.2.7 gleich. Produktversion, versionCode und Archivstand nicht verwechseln. |

Android-Paket **de.serkal.android.preview.v005**, minSdk24, compile/target36.
Android ist für Kurt derzeit vor allem der **Play-Test**, nicht die Website-APK.
Keine Tester durch gerätespezifische Sonderannahmen ausschließen. Pixel-Erfolg beweist
keinen Samsung-/anderen Tastatur-Erfolg. Bestehende Paketkennung und Testgruppe erhalten.

## 3. Artefakte und Installer-Grenze

| Datei | Bytes | SHA256 |
|---|---:|---|
| Öffentliche Windows-serkal-desktop.exe1.2.6 | 140893184 | 4cd5128dce6c01771ecb0e80271b4a56b7b1047faa80eb0f72eabcab30aaef16 |
| Android1.2.7-Code51 unsignierte CE-AAB | 2496284 | 1eda94714c08c93265c78783bd010b6f290e57db93368bcc783d666d8ad138fa |
| Android1.2.7-Code51 signierte Play-AAB | 2511495 | 919e700ea8286ea5f2372160368904fc247074e254d78a23e4704e1d9aa11c4b |

[Unsignierte Code51-Datei](https://chatgpt.com/library?file_id=libfile_bab92dc04b0c81919f89a04c56a5610b&account_id=personal).
Bauausgabe zusätzlich unter play-build-output/ auf ce-android-keyboard-1.2.7,
Sicherungscommit f4c5ba3ecdd4693966af711c354df778002afc9e.
Vollständige signierte Nutzdaten-/Zertifikatprüfung und Einreichung durch Installer3
im Brett belegt. CE hat nicht privat signiert und nichts zu Play hochgeladen.

- **Keine Änderung/kein Neubau an eingereichter1.2.7.** Neue installierbare Änderungen
  brauchen neue eindeutige Version/Code, nach Prüfung des inzwischen belegten Stands.
- Nur ausdrücklich freigegebene CE-Quelle an Installer übergeben; dessen geprüfte
  BAT/CMD-/Signier-/Publishwege erhalten. Nicht aus alten Anwendungsskripten neu erfinden.
- **Keinen Windows-Installer aus dem Android-Zweig bauen.** Er ist kein zusammengeführter
  Desktop1.2.6-Stand. Auch Windows-Bauhelfer im Anwendungszweig können historisch sein.
- Windows-Paket muss google-auth-window.js **und** google-auth-window-position.ps1 enthalten.
  Private Desktop-OAuth-Datei und endgültiges Symbol liegen bei Kurt/Installer.
- Uploadalias **serkal-preview**; privater Schlüssel bleibt bei Kurt. Niemals ersetzen,
  neu erzeugen oder Passwort veröffentlichen. Für OAuth gilt das andere Play-App-Zertifikat.
- Uploadzertifikat SHA1: **0D:63:F5:08:DC:1F:E1:4E:97:6C:22:1A:0C:27:98:D3:A1:51:59:86**.
- Play-App-Signierzertifikat SHA1: **F9:CD:54:1E:1B:0D:8E:92:29:8B:44:8A:C4:D6:1A:E2:74:9B:1A:9F**.
  Fehlender Play-SHA1 im Android-OAuth-Client hatte früher die Anmeldung verhindert;
  zusätzlicher Client behob diesen konkreten Fall. Das beweist nicht Philipps Ursache.
- Bisherige Public bleibt verfügbar, bis Ersatz vollständig geprüft und freigegeben ist.
  Keine Quellen, Schlüssel, Archive oder alten geprüften Dateien beiläufig löschen.

[Android1.2.7-Bau/Installerübergabe mit Versionshinweisen](https://github.com/KurtV731/serkal_desktop/blob/c324f8ba0fccef0915a619ea5247b283a13a0afd/1%20docs/android/keyboard-1.2.7-installer-uebergabe.md)
· [Desktop1.2.6-Bauunterlagen](https://github.com/KurtV731/serkal_desktop/blob/e8765598897f650a27b7abb374c175df9c03f6f8/1%20docs/desktop-1.2.6-google-fenster.md).

## 4. Fachlicher Ablauf, den nicht wieder zurückbauen

SerKal2.5 bleibt fachliche Referenz. Ein persönliches Archiv über mehrere Geräte.
**Sitzungsmodell:** beim Start Google-Gesamtstand laden, lokal bearbeiten, beim normalen
Abschluss geänderten Gesamtstand einmal schreiben. Keine laufenden Cloudarchiv-Abfragen
oder Einzeländerungsuploads. Nicht gespeicherte Sitzungen dürfen verloren gehen;
bei parallelen Sitzungen gewinnt der letzte erfolgreich gespeicherte Gesamtstand.
Alte Live-Sync-/Revisions-/Konfliktsperren nicht ohne Auftrag reaktivieren.

Kalender getrennt: nur betroffene Serien/Staffeln und wirkliche Terminunterschiede,
identische Signaturen überspringen, erfolgreich erledigte Arbeit nicht erneut senden.
Anfragen mindestens250ms auseinander; nach20 erfolgreichen Writes2s Pause; passende403/429
mit wachsender Wartezeit/Retry-After bis siebenmal wiederholen. Eigenes5min-Kalenderbudget
nach Archivschreiben, sichtbarer Countdown, offene Restarbeit erhalten.
Ein Kalenderfehler darf nicht behaupten, das bereits gespeicherte Archiv sei verloren.
Manuelle Termine, deutsche Angaben und stärkere Ankündigungen vor Wartungsüberschreiben
schützen; unbekannte Daten unbekannt lassen. Startdatum allein darf Ankündigung ergeben.

Google-/TMDB-Einrichtung: getrennte Rechte/Schlüssel, Erklärung DE/EN, Datenschutzlink,
verständlicher Abbruch/Rückweg. TMDB-Dialog bei leeren/ungültigen Eingaben offen halten;
funktionierenden Schlüssel erst nach Validierung ersetzen; kontobezogener verschlüsselter
KeyCache bleibt erhalten. Hilfe darf Eingaben nicht verwerfen.

## 5. Kleine Codekarte – nur bei Bedarf öffnen

| Anliegen | Desktop | Android unter android-preview/app/src/main/java/de/serkal/android/preview/ |
|---|---|---|
| Oberfläche / Aufrufbrücke | 2 src/frontend/index.html; 2 src/common/preload.js; 2 src/backend/main.js | MainActivity.java; ZoomPanLayout.java |
| Archiv/Sitzung | 2 src/common/archive-session.js, archive-session-remote.js; Einbindung im Backend | AndroidArchiveSession.java, SessionArchiveClient.java, ArchiveCodec.java; Einbindung MainActivity |
| Kalender / Restarbeit | archive-calendar-copy.js, calendar-rate-limit.js, calendar-scope.js | CalendarCopy.java, CalendarRequestPolicy.java, CalendarScope.java |
| Google / Fehler / Fenster | google-auth-window.js + google-auth-window-position.ps1, google-identity.js, google-http-error.js | MainActivity.connectGoogle/useGoogleResult/onActivityResult; GoogleHttpFailure.java |
| TMDB / Wartung | tmdb-title.js, maintenance-follow.js, season-policy.js und Backend/Frontend | TmdbClient.java, Maintenance.java, KeyCache.java, SharedKeyClient.java, SeasonAnnouncements.java |
| Versionen | package.json + serkal-release.json | serkal-release.json + app/build.gradle + ReleaseCompatibilityTest.java |

Es existieren historische und aktive Archivdateien nebeneinander. Vor Änderung den
**tatsächlichen Aufrufpfad im freigegebenen Quellstand** verfolgen; Dateiname allein reicht nicht.

## 6. Bau-/Testwege, ohne Kurt Befehlsarbeit zuzuschieben

Frischen isolierten Checkout/Worktree des passenden Quellpins verwenden. Vorhandene
unbekannte lokale Änderungen nicht resetten. Flüchtiger Chat-Workspace ist keine Quelle.
Keine Neuinstallation/Komplettprüfung allein wegen des Chatwechsels.

**Desktop:** Node24; `npm test` prüft45 Testprogramme einschließlich
`npm run test:session`. Für Fensteränderungen zusätzlich Windows-Browserprüfung
`6 tests/google-auth-window.browser.cjs`, gemäß Workflow `.github/workflows/session-test.yml`.
Desktop1.2.6: [CI43852662392](https://github.com/KurtV731/serkal_desktop/actions/runs/43852662392),
beide Jobs erfolgreich; dazu Kurts reale Windows-/Google-Abnahme mit92Archiveinträgen.
Keine echten Google-/Archivdaten für isolierte Tests verwenden. Installer baut Windows.

**Android:** JDK17, Gradle8.11.1, AGP8.10.1, AndroidXCore1.17.0.
Im Ordner android-preview: `gradle testReleaseUnitTest`, danach `gradle bundleRelease`.
Release bleibt ohne private Signierung. Bei Versionsänderung auch ReleaseCompatibilityTest,
Workflow-Metadaten, Dateinamen und Signierstarter aktualisieren; Archivstand nicht blind erhöhen.
[Code51-Regression/Bau44600191771](https://github.com/KurtV731/serkal_desktop/actions/runs/44600191771):
98JUnit-Tests, null Fehler/übersprungen.
[Native Prüfung44600191921](https://github.com/KurtV731/serkal_desktop/actions/runs/44600191921):
Android15/Pixel7 und Android16/PixelTablet, beide erfolgreich; Aufnahmen angesehen.

Native Tests: `gradle -PserkalDeviceTests assembleDebug assembleDebugAndroidTest`,
beide Test-APKs im Emulator installieren und AndroidJUnitRunner für DisplayDeviceTest
ausführen; genaue Sequenz in **.github/workflows/android-display-code50.yml**
(Dateiname historisch, Inhalt inzwischen Code51).
Workflow-Branchfilter bei neuer Arbeitsbranch passend setzen. Emulatorhinweis zum
Immersive-Modus vorher bestätigen, sonst blockiert der Android-Hinweis den Tastaturtest.
APKs für Instrumentation sind ausschließlich Debug-Testartefakte, kein Verteilungspaket.

Code51-Testumfang: echte Tastatur jedes Mal neu öffnen; Schließenknopf, IME-Lupe und
Suchen verlangen danach IME-Höhe0, erhaltene Eingabe, Fokus außerhalb EditText und
wieder sichtbare Suchbedienung. Vorschlagsuche darf Tastatur nicht schließen.
Zusätzlich Fenstergröße/Systemleisten prüfen. Das ist keine echte TMDB-/OAuth-Abnahme.

## 7. Konkrete offene Prioritäten zum Übernahmezeitpunkt

### A – Neuer Vollbildwunsch, ausdrücklich noch nicht umgesetzt

Kurt präzisiert am19.11.: **Normalzustand volle Fläche für SerKal. Keine dauerhaft
reservierten leeren Ränder für ausgeblendete Android-Leisten.** Nur wenn Systemleisten/
Tastatur gebraucht werden, dürfen sie überlagern oder SerKal kurz verkleinern/verschieben.
Danach wieder volle Fläche. **Dauerhaft sichtbare Systemleisten wurden ausdrücklich
abgelehnt**; das war ein Missverständnis des CE, kein Auftrag.

In Code51: MainActivity.configureFullscreen_/hideSystemBars_ blenden Leisten aus;
der Insetslistener in buildScreen verwendet aber
`getInsetsIgnoringVisibility(systemBars|displayCutout)` plus IME-Maximum.
Das erklärt den dauerhaft reservierten Leistenbereich. Ansatz: sichtbare Systemleisten
von dauerhaft nötiger Aussparungs-/Fensterdekoration unterscheiden; versteckte Leisten
nicht dauerhaft als Padding reservieren. Kameraaussparungen/Window-Caption und bedienbare
Schaltflächen berücksichtigen. Keine pauschale Rückkehr zu veralteten UI-Flags/Farbaufrufen.

Bestehende Tests erwarten stabile versteckte Ränder; sie müssen für **den geänderten
Nutzervertrag** ersetzt/ergänzt werden: volle Fläche bei versteckten Leisten, zeitweise
Überlagerung/Anpassung, erneute volle Fläche, Tastatur auf/zu, Hoch-/Querformat/Mehrfenster,
keine aufsummierten Insets, keine verlorenen Eingaben. Das gehört in einen neuen
eindeutigen Kandidaten, nicht in die unverändert eingereichte1.2.7.

### B – Play-Warnung zu veralteten Edge-to-Edge-APIs

Kurts Screenshot nennt Release50/1.2.6 trotz bereits ersetzter direkter Farbaufrufe.
Nicht erledigt behaupten und nicht blind dieselbe Änderung wiederholen.
Zuerst Play-Detailbefund mit konkret benannten APIs/Klassen und exaktem AAB abgleichen;
auch Bibliotheksaufrufe prüfen. Code51 hat keinen gesonderten belegten Fix dieser Warnung.
Vollbild an sich ist nicht verboten; keine dauerhafte Randreserve aus der Warnung ableiten.

### C – Philipp: SamsungA54, Google-Kontoauswahl hängt

Play-Installation, normales unverändertes Gerät laut Tester. Nach Konto-/Zugriffsfreigabe
dauerhaft Spinner, Neustart wieder Kontoauswahl; zunächst leeres App-Log gemeldet.
Andere Benutzer können sich anmelden; bei einem anderen Tester klappte der zweite Start.
**Keine bestätigte Ursache und kein nachgewiesener Fix in1.2.6/1.2.7.**
Fehlende Google-Scopes sind nur Hypothese, keine bewiesene Schuld beim Tester.
Nicht „auf meinem Pixel geht es“ als Abnahme und keinen Tester ausschließen.

Prüfpfad: connectGoogle → SDK-Resolution/Kontoauswahl → onActivityResult →
useGoogleResult/Scopeprüfung → Identität → Drive-Key → ggf.TMDB-Validierung → Archiv.
Aktuelle Quellen haben Stufen/Timeouts und Logs; prüfen, welche Stufe tatsächlich erreicht wird.
MainActivity.googleTrace → GoogleHttpFailure.event schreibt intern google-auth.jsonl
(mit Rotation) und google-errors.jsonl; lesbar über **Menü > Log**.
Wenn Hänger/Abbruch weiter ohne verwertbaren Eintrag bleibt, diese konkrete Diagnoselücke
schließen, einschließlich Lifecycle/SDK-Rückgabe. Tokens/Passwörter nicht loggen.
Deinstallation entfernt lokale Daten, widerruft aber nicht automatisch Google-OAuth-Rechte.

### D – Claudia: Ersteinrichtung klappt, Tastaturproblem gemeldet

Claudia bestätigt1.2.6; zweimal bleibt Tastatur trotz Lupentipp offen.
Code-Lücke behoben in1.2.7: eigener IME-Handler, gezieltes Ausblenden,
sichtbarer Schließenknopf; normale Vorschlagsuche unverändert.
Claudias reale1.2.7-Abnahme, Gerät/Androidversion/Tastatur stehen noch aus.
Nicht erneut1.2.6 testen lassen oder Emulatorerfolg als ihren Erfolg ausgeben.

### E – Plattformplanung von Kurt, 20.11.2026

Weitere angefragte Tester haben wegen iPhone-Nutzung und fehlendem Android-Gerät
abgesagt. Deshalb wünscht Kurt für die weitere Plattformausweitung diese Reihenfolge:

1. **Linux, zunächst Ubuntu.** Vorhandene Desktop-Fachlogik möglichst weiterverwenden.
   Die frühere Aussage „relativ einfach“ ist eine vorläufige Einschätzung, keine
   bereits geprüfte Portierung: insbesondere Windows-spezifische Fenster-/Browserhelfer,
   OAuth-Rückweg, Installation und Schlüsselablage gezielt auf Ubuntu prüfen.
2. **Danach iPhone/iOS.** Als eigenständigen Portierungsauftrag planen; kein fertiger
   Bauweg oder Veröffentlichungstermin zugesagt. Google-/TMDB-/Archiv-/Kalenderfunktionen
   sollen funktional zu den bestehenden Fassungen passen.

Dies ist die gewünschte Reihenfolge der zusätzlichen Plattformen, kein Auftrag,
den laufenden Android-Test abzubrechen oder sofort beide Portierungen gleichzeitig
zu beginnen. Der Nachfolger soll diese Planung aktiv mitnehmen.

**Neue Testerantwort vom20.11.:** Thorsten meldet erfolgreiche Installation von1.2.6,
aber identisches Google-Anmeldeverhalten wie unter1.2.4. Kein behobener Loginfall.
Kurt hat ihn bereits angeschrieben; Antwort/Log kann dauern, SerKal hat für den Tester
nicht höchste Priorität. Nicht ständig neue Versuche verlangen. Seine Nachricht ist
mit Thorsten unterschrieben; nicht ungeprüft mit der bisherigen Bezeichnung Philipp
gleichsetzen. Logtext oder letzte Meldung genügt, Signal-Screenshot ist nicht nötig.

### F – Weitere Pflege, nicht alles gleichzeitig anfangen

- Desktop: Googlefenster kann nativen Hinweis verdecken (für1.2.6 akzeptiert);
  bessere Anordnung und tatsächlicher dauerhafter Kontostatus vorgemerkt.
- Kalender öffnen: falsches Browserkonto/„Kalender hinzufügen“-Umweg weiterhin offen;
  funktionierendes API-Schreibziel nicht dafür verändern.
- Android: Launcher-Dummysymbol, Wegwischen/Abschlussbedienung, spätere direkte Leistenaktionen.
- Sprache/Status/Wartungsergebnis/Menüs: vor neuem Auftrag bereits erreichte Teilstände prüfen.
- Deutsche Start-/Folgentermine: zweite verlässliche Quelle/manuell geschützte Angaben;
  vorhandene Felder zuerst prüfen. Kein bestehender Storestart-Blocker.
- Website-Nachlauf/Datenschutz-Protokolltext über Website-Chatty, keine ungeprüfte Eigenübernahme.
- [Ideenliste](ideenliste.md): spätere Funktionen, kein zusätzlicher aktueller Bauauftrag.

## 8. Google-Play-Prüfauftrag – fortführen, gezielt und ohne Alarmismus

Mitteilung29.10. am19.11. erneut gelesen:
https://support.google.com/googleplay/android-developer/answer/18100766
Details: https://support.google.com/googleplay/android-developer/answer/17492799

- Speicher-/Bitmapmessungen vor Februar2027 vorbereiten; nicht aus kleiner AAB ableiten.
- DEX25%-Quoten betreffen Apps über10MBDEX. Code51 tatsächlich aus AAB gemessen:
  **6836316 Bytes DEX** (classes.dex), derzeit unter Schwelle; nicht unnötig R8 nur
  wegen allgemeiner Meldung oder fehlender mapping.txt erzwingen. Künftige Pakete neu messen.
- Anmeldungswiederherstellung ab April2027: konkrete Anwendbarkeit auf Google-OAuth
  weiter klären; kein bestätigter Ausnahmestatus. Keine Tokens blind per Backup kopieren.
- Händler-/Nicht-Händler-Erklärung im Konto zutreffend halten; Abschluss nicht hier neu geprüft.
- Neue Kontakt-/Standort-/LAN-/AppFunctions-/Werbe-/Kaufregeln nur bei tatsächlicher Nutzung.
  Google-Play-Anforderungen nicht pauschal auf Windows übertragen.
- Immersive-Modus ist weiterhin dokumentiert:
  https://developer.android.com/develop/ui/views/layout/immersive
  Das rechtfertigt keine permanenten leeren Insets. Quellen bei Umsetzung aktualisieren.

### Aktueller Nachtrag 20.11.: Google-Prüfkonto und Support-Ticket

Kurt hat ein ausschließlich für die Play-Prüfer vorgesehenes Google-Konto angelegt
und dessen Zugangsdaten unter App-Zugriff hinterlegt. Eine Google-Sicherheitswarnung
meldete einen verhinderten Anmeldeversuch mit richtigem Passwort, unbekanntem Gerät
und Browser „Sonstiger“. **Arbeitsannahme von Kurt: Googles Kontoschutz hat den
autorisierten App-Prüfer ausgesperrt.** Diese nachvollziehbare Arbeitsannahme respektieren
und nicht in jedem Gespräch erneut mit ihm grundsätzlich diskutieren; eine technische
Zuordnung durch den Support steht noch aus.

**Support-Ticket am20.11.2026 durch Kurt erfolgreich abgesendet**, Bestätigung im
Screenshot „Ticket gesendet“. Weg in seiner Konsole: Konto verwalten → Hilfe →
Supportteam kontaktieren → Google Play-Richtlinien → Google Play-Richtlinien →
App/SerKal → Sonstiges Richtlinienproblem. Nach der KI-Empfehlung:
„Nein, Support-Ticket erstellen“ und Wunsch nach einer Supportantwort.
Kein Hilfe-Fragezeichen in seiner damaligen Kopfzeile vorhanden; keine erfundenen
Menüpositionen ansagen. Nächste Klicks anhand seines tatsächlichen Bildschirms erklären.

Inhalt des englischen Tickets: SerKal1.2.7/Code51, geschlossener Alpha-Test,
dedizierter Prüferzugang durch Google-Kontosicherheit blockiert; Bitte um Abstimmung
mit dem Reviewteam, einen verlässlichen Zugangsweg und Bestätigung, ob die laufende
Prüfung betroffen war. Kein Passwort im Tickettext. Ticketnummer liegt hier nicht vor;
Anhänge wurden im Text erwähnt, ihr tatsächlicher Upload ist nicht bestätigt.
Keine zweite gleichlautende Anfrage erstellen.

**Frist laut Versandbestätigung: Antwort per E-Mail innerhalb von zwei Arbeitstagen,
in einzelnen Fällen länger.** Nicht mit zwei Kalendertagen gleichsetzen.
Nächster Schritt bei Rückmeldung: vorhandenes Ticket gezielt lesen und den konkreten
Supportvorschlag gemeinsam mit Kurt umsetzen. Keine automatische Postfachüberwachung
oder Erinnerung wurde eingerichtet. Kurt hat sich zunächst für eine Pause verabschiedet.

Die vorgeschaltete Play-Support-KI meldete mit Kontozugriff:
Publishingstatus NO_CHANGES und Code51 **Fully rolled out** im geschlossenen Alpha-Test,
keine Ablehnung. Das ist ein neuer Statushinweis gegenüber „Wird überprüft“ vom19.11.,
aber noch kein unabhängig gelesener Release-Detailbeleg oder Claudias Geräteabnahme.
Bei Bedarf gezielt in der Releaseansicht bestätigen, nicht weiter als sicher noch
ungeprüft darstellen.

Keine Telefonnummer/2FA entfernen, kein Passwort ändern und keinen Demo-Modus bauen
allein aufgrund der bisherigen KI-Vorschläge. Entfernen einer Telefonnummer garantiert
keine bestimmte Sicherheitsabfrage; ein simulierter Demo-Modus ist keine zugesicherte
vollständige Play-Abnahme der echten Drive-/Kalenderfunktionen. Kontokonfiguration und
App wurden in diesem Vorgang nicht durch CE verändert. Für einen echten Auftrag
neuen Befund/Supportantwort verwenden, keine neue AAB allein aus diesem Ticket ableiten.

## 9. Erster Schritt am Samstag

1. Aktuelles Brett auf neue Installer-/Testerantworten prüfen.
2. Code51: Support-KI meldet am20.11. vollständig ausgerollt; Releaseansicht und reale Abnahme bei Bedarf bestätigen. Support-Ticket ist bereits gesendet, Antwort steht aus.
3. Mit Kurt den dann aktuellen Einzelauftrag fortsetzen: dynamische Vollbildfläche oder
   konkrete neue Tester-/Play-Diagnose. Fehlende Informationen gezielt erheben.
4. Nur betroffene Codepfade öffnen/testen; keine Versions-/Installer-/Archiv-Neuordnung
   allein wegen des Botwechsels. Nachweise und Übergabe kurz aktuell halten.

Diese Übergabe ändert **keinen Programmcode, keine AAB/EXE und keine öffentlichen Dateien**.

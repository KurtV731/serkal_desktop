# Gemeinsames Schwarzes Brett – SerKal, HASA und Websites

Stand: 21.11.2026 · gekürzter Arbeitsstand auf Kurts Auftrag.

## 1. Start hier

Dies ist die **einzige aktive Übergabestelle** für CE SerKal, CE HASA, Installer,
Website, Anleitung und Hosting. Vor Projektarbeit dieses kurze Brett lesen.
Danach ausschließlich die für den konkreten Auftrag benötigten Fachunterlagen öffnen.

**Keine Pflichtlektüre des Archivs oder früherer vollständiger Nachfolgedokumente.**
Historische Anweisungen, Arbeitssperren und Versionsangaben im Archiv gelten nicht
als heutiger Arbeitsauftrag. Im Zweifel den letzten belegten Stand gezielt prüfen,
keine früheren offenen Meldungen ungeprüft reaktivieren.

- [Vollständiges, unverändertes Original bis 18.11.2026](Archiv/schwarzes-brett-bis-2026-11-18.md)
- [Frühere Ansicht am ursprünglichen Ort](https://github.com/KurtV731/serkal_desktop/blob/9dee76b36614f525a9753a5ef7801b2da847bd30/1%20docs/schwarzes_brett.md) – bei Bedarf für ursprüngliche relative Links.
- Historische Themen: Ersteinrichtung, Archiv/Sync, Kalender/Wartung, Darstellung,
  Sprache, Installer/Releases, Android/Play, Websites/Datenschutz/Hosting,
  HASA-Planung/Ereignisse/Adressbuch/Verwaltung und Handbücher.

| Zuständig | Aufgabe / Quelle |
|---|---|
| CE SerKal | Fachlogik, Desktop-/Androidquellen, Tests und freigegebener Quellstand in KurtV731/serkal_desktop. |
| Installer | Windows-Bau, Installation/Updates, Verknüpfungen, Artefakt-/Signaturprüfung; privater Windows-Bauplatz bei Kurt. |
| Website | SerKal-Seiten/Downloads in KurtV731/serkal-pages; HASA-Webgestaltung in KurtV731/hasa. |
| CE HASA | Userscript, API/Serverlogik, Datenbank-/Rechteverhalten und fachliche Anleitung in KurtV731/hasa. |
| Anleitung / Hosting | Handbuchredaktion beziehungsweise Server-/Domainbetrieb; Abstimmung weiterhin hier. |

**CE-SerKal-Nachfolge für Samstag, 21.11.2026:**
[Kurzübergabe mit Quellpins, Bau-/Testwegen und offenen Punkten](ce-uebergabe-2026-11.md).
Neuer CE ausschließlich für SerKal; HASA und Installer3 haben eigene Nachfolger.
Das Archiv und die Oktober-Übergabe sind keine Pflichtlektüre.

**Website-Nachfolge vorbereitet am 20.11.2026:**  
[Kurzübergabe mit Pfaden, festen Gestaltungsregeln, Ein-Klick-Veröffentlichung und offenen Live-Nachweisen](https://github.com/KurtV731/serkal-pages/blob/main/docs/website-uebergabe-2026-11-20.md).
Der bisherige Website-Chatty geht auf Kurts Wunsch in den Rentnerclub. Der Nachfolger liest
dieses Brett und die Kurzübergabe; frühere Website-Übergaben sind keine Pflichtlektüre.

## 2. Dauerhafte Entscheidungen von Kurt

- Bestehende SerKal-2.5-Fachlogik portieren, nicht durch neue Produktregeln ersetzen.
- GitHub-App zuerst verwenden; Änderungen vollständig übertragen und zurückprüfen.
  Ein gescheiterter Terminal-Push beendet den Auftrag nicht. Erst verfügbare Wege prüfen.
- Keine Geheimnisse, privaten Originaldaten oder Keystorekennwörter ins Repository.
- Kurt muss keine technischen Zwischenstände zwischen Chattys transportieren.
  Deutsch mit Kurt, englische Testertexte bei Bedarf. Diktatfehler aus dem Kontext lesen.
- Keine vermeidbaren Klicks, keine doppelten Angaben, keine sichtbaren ungeprüften Fehler.
  Screenshots anhand des tatsächlichen Bildschirms erklären.
- Keine Datenlöschung, Deinstallation oder Rücksetzung als beiläufige Reparatur.
  Öffentliche Dateien erst nach Prüfung und vorhandener Freigabe ersetzen.
- Ein eindeutiger freigegebener Quellstand je Bau, keine ungeprüfte Branch-Zusammenführung.
  Die alte pauschale Bindung an serkal-0.0.5-archiv-start ist überholt; aktuelle Pins siehe unten.
- Neue installierbare Änderungen erhalten grundsätzlich höhere eindeutige Kennungen.
  Ausnahme war Kurts ausdrücklich beauftragter Ersatzbau 1.2.6/Code50 vor Upload.
  Produktversion, Android-versionCode und gemeinsamer Archivstand sind verschiedene Kennungen.
- Desktop und Android funktional angleichen; für Android ist Kurt die **Play-Testfassung**
  maßgeblich. Website-APK und Play-Test dürfen nicht als derselbe Veröffentlichungsstand gelten.
- Erst geprüfte Datei, dann Veröffentlichung und Downloadlink. Bisherige Public bleibt
  bei Bau-/Prüffehlern verfügbar. Freigegebene Dateien unverändert übernehmen, nicht neu bauen.
- Windows: ein selbständiges lokales Programm, ein öffentliches Installationsangebot,
  Update statt unnötiger Neuinstallation; öffentlicher Name serkal-desktop.exe.
- Fehlerhinweise in Release Notes mit dem belegten öffentlichen Reporter-Namen würdigen,
  etwa „Thanks to VelcroFist“. Keine privaten Namen/Kontaktdaten dafür veröffentlichen.

### Geltender SerKal-Archiv-/Kalenderablauf

Start: Google-Gesamtstand in lokale Sitzung laden; während der Sitzung lokal arbeiten;
beim regulären Abschluss geänderten Gesamtstand einmal zurückschreiben.
Keine laufenden Cloudarchiv-Abfragen oder Einzeländerungsuploads.
Nicht gespeicherte Sitzungen dürfen verworfen werden; bei parallelen Sitzungen gewinnt
der letzte erfolgreich gespeicherte Gesamtstand. Keine Wiederbelebung alter Revisions-/
Live-Sync-Sicherungen ohne neuen Auftrag. Fehler konkret anzeigen und protokollieren.

Kalender getrennt behandeln: nur tatsächlich betroffene Bereiche und abweichende Termine
schreiben, identische überspringen; erfolgreiche Arbeit nicht wiederholen.
Aktuelle Stabilisierung: mindestens 250 ms zwischen Anfragen, 2 s Pause nach
20 erfolgreichen Schreibaktionen, passende Google-Limits mit wachsender Pause/Retry-After
wiederholen, Restarbeit erhalten, eigenes Kalenderzeitfenster und sichtbarer Countdown.
Unbekannte Termine bleiben unbekannt; manuelle Angaben und stärkere Ankündigungen schützen.

HASA: keine Spielentscheidungen oder Ressourcenverbrauch automatisieren.
Nachweise, Besitzer, Planeten und Runden sauber trennen; unbekannte Zuordnungen nicht raten.
Video-/Atommüll-Löschschutz nicht durch bloßes Gelesen-Markieren aufheben.

## 3. Letzter dokumentierter Produktstand

Diese Tabelle gibt den **belegten Übergabestand**, keine neu durchgeführte Liveprüfung wieder.

| Produkt / Kanal | Stand / Nachweis | Noch erforderlich |
|---|---|---|
| SerKal Windows öffentlich | Desktop 1.2.6, am 16.11. veröffentlicht und Live-Hash bestätigt; Quellstand 07903512a7ac2de4521182ec8b9a89e4cb030a86. | Bekannte Restpunkte für spätere Pflege, siehe Abschnitt 4. |
| SerKal Android Website | Öffentliche APK 1.2.4 / Code47; getrennt vom Play-Test. | Keine Aktualisierung allein wegen des neuen Play-Baus behaupten. |
| SerKal Android Play-Test | 1.2.6 / Code50 Edge; Bau-/Testquelle 2043721004a6bbba4faf1454a366c1c9e9d90608; am 18.11. privat signiert, geprüft und im bestehenden **Geschlossenen Test – Alpha** zur Überprüfung eingereicht. | Google-Prüfung/Verfügbarkeit und praktische Neuinstallation durch Tester noch bestätigen. Produktionszugang bleibt mangels 12 Testern gesperrt. |
| SerKal Android nächster Kandidat | 1.2.7 / Code51 Tastaturkorrektur; am19.11. signiert/eingereicht. Play-Support-KI meldet am20.11. „Fully rolled out“ im geschlossenen Alpha-Test und NO_CHANGES. | Verfügbarkeit und Claudias reale Abnahme bestätigen; kein erneuter Bau/Signiervorgang nötig, siehe P1a. |
| Gemeinsame SerKal-Daten | Archivstand 38 unverändert. | Produktversionsgleichheit nicht mit Datenformatwechsel verwechseln. |
| HASA öffentlich stabil | 1.2 separat von Entwicklungskanal. | Keine Alpha als neue stabile Public ausgeben. |
| HASA Entwicklung | 1.3.0 Alpha12, am 14.11. im Kanal dev-1.3-alpha1 veröffentlicht; Prüfquelle 43ca676594c21edc83497aded670cfadb5825eff, Kanalcommit 40281d7eb4d2a301d0bd8fa3632bd14ab3126192. | Reale Rückmeldungen, Server-/Handbuchstand getrennt führen. |
| SerKal Website | Deutsche Hauptadresse serkal.de, DE/EN-Navigation/Datenschutz überarbeitet. Vier Neuerungs-/Werkstattseiten am 16.11. in GitHub fortgeschrieben. | Für diese vier Seiten fehlt der abschließende Server-/Live-Nachweis. |
| HASA Website | hasa.li mit Anleitung/Hilfe/Aktualisierung; neues zusammenhängendes Handbuch 1.3 bis Alpha12 in Quellen ergänzt. | HTML-/Live-Übernahme des neuen Handbuchs nicht bestätigt. |

Desktop-Public: serkal-desktop.exe, **140893184 Bytes**,
SHA256 **4cd5128dce6c01771ecb0e80271b4a56b7b1047faa80eb0f72eabcab30aaef16**.
Play-Seite für bereits aufgenommene Tester: https://play.google.com/store/apps/details?id=de.serkal.android.preview.v005
Der maßgebliche Kanal für die derzeitige Testergruppe ist **Geschlossener Test – Alpha**, nicht der interne Test. Bestehende Teilnahmegruppe und Opt-in-Einstellungen unverändert weiterverwenden.

## 4. Aktive Übergaben und offene Arbeit

### P1 – Installer / Kurt: Android-Code50 im geschlossenen Alpha-Test abschließen

Am 18.11.2026 wurde die geprüfte **SerKal-Android-1.2.6-code50-edge.aab**
im bestehenden Kanal **Geschlossener Test – Alpha** als Version **50 (1.2.6)**
hochgeladen und zur Google-Überprüfung eingereicht. Version 49 (1.2.5) wurde nicht
einbezogen; Roll-out 100 %, Versionshinweise DE/EN. Die angezeigte Warnung zur
fehlenden R8/ProGuard-Offenlegungsdatei war nicht blockierend. Der endgültige
Google-Status „verfügbar/aktiv“ und die reale Installation sind noch zu bestätigen.

Verbindliches Artefakt: **2511304 Bytes**, SHA256
**b38881f1e582c43df33bc85494de49e02cab0e7027bdde16f47ba1e8c78197c3**.
Paket bleibt de.serkal.android.preview.v005; Uploadschlüssel/Alias serkal-preview
unverändert. Die ältere Code50-Datei ohne `edge` und ihre Ableitungen bleiben
uploadgesperrt. Keine neue Paketkennung, Testerliste, Teilnahme-URL oder Testspur anlegen.
Uploadzertifikat und Google-Play-App-Signierzertifikat für OAuth nicht verwechseln.

**Nächste Schritte für den Nachfolger:**

1. In Play Console den Status des geschlossenen Alpha-Releases prüfen.
2. Sobald Google Version 50 anbietet, Tester informieren beziehungsweise Verfügbarkeit
   bestätigen. Für Kurts praktische Abnahme alte App deinstallieren und Version 50 neu
   aus dem bestehenden Test installieren; damit wird auch der vollständige Ersteinstieg geprüft.
3. Installation, Google-/TMDB-Einrichtung, Archivzahl und Kalenderzugriff praktisch prüfen;
   Ergebnis knapp im Brett aktualisieren.
4. Öffentliches Google-Play-Produktionsrelease nicht behaupten: Kurt hat derzeit neun
   Tester. Für Produktionszugang verlangt Google mindestens zwölf ununterbrochen
   beigetretene Tester über 14 Tage; anschließend ist der Produktionszugang separat zu beantragen.

CE-Ersatzbau: Edge-to-Edge/Insets statt alter Farbaufrufe; Querformat auf Telefonen
bevorzugt, Tablets/Mehrfenster anpassbar; 96 Regressionstests und Android-15-/16-
Emulatorprüfungen bestanden. Das ersetzt die noch ausstehende reale Abnahme nicht.
[Exakte CE-Unterlagen](https://github.com/KurtV731/serkal_desktop/blob/f3850a199e6d758beac141f8be18e374a241e626/1%20docs/android/code50-edge-to-edge-ersatz.md).

### P1a – Installer3 / Tester: Android1.2.7 / Code51 verfügbar machen und abnehmen

**19.11.2026: signiert, vollständig geprüft und im geschlossenen Alpha-Test eingereicht.**
Einreichung5 um21:18Uhr. Neuer Hinweis am20.11.: Play-Support-KI meldet mit Kontozugriff „Fully rolled out“ im geschlossenen Alpha-Test und NO_CHANGES, keine Ablehnung. Release-Detailansicht und reale Geräteabnahme noch nicht unabhängig bestätigt.
Signierte SerKal-Android-1.2.7-code51.aab: **2511495 Bytes**, SHA256
**919e700ea8286ea5f2372160368904fc247074e254d78a23e4704e1d9aa11c4b**.
Alle141 unveränderten Nutzdateien, Signatur und Uploadzertifikat durch Installer3 geprüft.
[CE-Quellstand, Tests, unsignierte Datei und Versionshinweise](https://github.com/KurtV731/serkal_desktop/blob/c324f8ba0fccef0915a619ea5247b283a13a0afd/1%20docs/android/keyboard-1.2.7-installer-uebergabe.md).

98 Regressionstests und native Android15-/16-Tastaturprüfungen bestanden.
Nächster Schritt: Verfügbarkeit bestätigen, danach echte Testerabnahme, insbesondere Claudia.
Philipps Google-Hänger bleibt offen. Keine Behauptung eines bereits behobenen Anmeldefehlers.
Kein erneuter Bau/Signieren der eingereichten Datei, keine neue Testspur oder Paketkennung.
Kurts Erstnutzerprüfung per Neuinstallation bleibt gewünscht; dabei gehen lokale Daten verloren,
bereits erteilte Google-OAuth-Rechte werden dagegen nicht automatisch widerrufen.
Neue Änderungen brauchen neue eindeutige Kennungen. Desktop-Public1.2.6 bleibt unverändert.

### P1b – Kurt / CE: Google-Prüferzugang, Support-Ticket gesendet am20.11.

Google-Kontosicherheit hat einen Login mit richtigem Passwort beim dedizierten
Prüfkonto blockiert. Kurts Arbeitsannahme: autorisierter Play-Prüfer ausgesperrt;
nicht ständig erneut grundsätzlich diskutieren. Technische Zuordnung durch Support offen.
**Ticket erfolgreich abgesendet** unter Google Play-Richtlinien / SerKal /
Sonstiges Richtlinienproblem. Bitte um verlässlichen Prüferzugang, Abstimmung mit dem
Reviewteam und Klärung der Auswirkung auf die Prüfung. Noch keine Ticketnummer erfasst.
Antwort laut Bestätigung per E-Mail innerhalb von **zwei Arbeitstagen**, ggf. länger.
Nächster Schritt: Antwort im bestehenden Vorgang auswerten; keine doppelte Anfrage,
keine Kontosicherheitsänderung/neue App allein wegen KI-Ratschlägen. Keine automatische
Überwachung eingerichtet. [Details für den CE-Nachfolger](ce-uebergabe-2026-11.md).
Kurt macht zunächst Pause; aktuell keine weiteren Klicks von ihm nötig.

### P2 – Website: ausstehende Übernahmen abschließen

**20.11.2026 – SERAWEB-Rechtstexte-Check vollständig in den Website-Quellen umgesetzt.**
Quellcommit serkal-pages: `8ca7735f577801700e4dd9acf165d11e23bb4c61`.
Alle HTML-Seiten besitzen nun zusätzlich zur unveränderten Siebener-Navigation direkte
Fußzeilenlinks zu Impressum und Datenschutz. Impressum: § 5 DDG, einheitlicher Kontakt
support@serkal.de, eine Telefonnummer und § 18 Abs. 2 MStV. Datenschutz DE/EN:
Widerspruch nach Art. 21, Google Limited Use, konkrete Drittlandgrundlagen, LfDI RLP,
Art.-28-Hosting, keine Cookies/Browserablage, eindeutige Google-Rechtsgrundlage sowie
lokale Desktop-Protokolle. Überschriftenstruktur auf About/Legal korrigiert. Die gemeinsamen Textfarben wurden
gegen ihre Hintergründe geprüft; niedrigster gemessener Kontrast 5,38:1 und damit mindestens WCAG-AA für Normalschrift.
`.htaccess`: www→serkal.de, HSTS, nosniff und Referrer-Policy vorbereitet.
**Noch offen:** Serverupload und anschließende Liveprüfung aller Links, Weiterleitungen
und Header; kein öffentlicher Abschluss behauptet, bevor dieser Nachweis vorliegt.

- SerKal: Live-Übernahme/Prüfung von neu-in-1.2.html, whats-new-1.2.html,
  werkstatt.html und werkstatt-en.html bestätigen; Quelle am 16.11. fertig.
- Datenschutz: Nachtrag zu lokalen Desktop-Protokollen und Aufbewahrung bis Löschung
  ist seit 08.11. ohne Abschlussbeleg. Erst gezielt prüfen, nicht pauschal neu schreiben.
  Der Android-Datenschutzlink ist inzwischen im Play-Einstieg enthalten.
- HASA: zusammenhängendes Handbuch 1.3 einschließlich Adressbuch, Leerlaufsteuerung,
  Ascension, Flottenfenster und Atommüllkorrektur bis Alpha12 in HTML übernehmen;
  reale Live-Funktionen von bloßen Quellen/Planungen unterscheiden.
- Nach Veröffentlichung kurz melden: „Jetzt behoben/veröffentlicht“ und „Noch offen“;
  Quellcommit und geprüfte URLs nennen. Keine Programmdateien dabei still ersetzen.

### P3 – CE SerKal: bekannte Restpunkte / spätere Pflege

Keine neue Version allein durch diese Liste beauftragt; zuerst aktuellen Code/Abnahme prüfen.

| Thema | Noch offener beziehungsweise nicht abschließend belegter Punkt |
|---|---|
| Desktop-Googlefenster | Eigenes normales Fenster ist in 1.2.6 gelungen; es kann den kleinen SerKal-Hinweis verdecken. Bessere Anordnung für 1.2.7 vorgemerkt, kein rückwirkender Freigabestopper. |
| Desktop-Googleanzeige | Dauerhaft sichtbarer tatsächlicher Verbindungsstatus, möglichst mit verwendetem Konto. |
| Kalender öffnen | Browserkonto-/„Kalender hinzufügen“-Umweg nicht als zuverlässig behoben melden. Funktionierende API-Schreibzuordnung nicht dafür ändern. |
| Android-Einstieg, Thorsten 21.11. | **Praktisch gelöst:** zuerst SerKal auf Tablet mit demselben Google-Konto erfolgreich verbunden; danach Anmeldung am Smartphone direkt erfolgreich. Konkrete Ursache (vermutete Geräteeinschränkung) unbestätigt. **CE/Website: diesen optionalen Umweg in Programmhilfe/FAQ übernehmen**, kein zweites Gerät als Pflicht, keine Erfolgsgarantie. [Ergebnis und DE/EN-Hilfetext](android/erster-start-speicher-und-anmeldung-2026-11-20.md). Noch keine veröffentlichte Hilfeänderung behaupten. |
| Android-Tastatur, Claudia 19.11. | 1.2.7/Code51 fertig und an Installer3 übergeben: sichtbares Tastaturschließen, Lupe/Suchen schließen gezielt, Vorschlagsuche behält Tastatur. 98 Regressionstests plus native Android15-/16-Tests bestanden. Claudias konkrete Geräteabnahme bleibt offen; kein Google-Anmeldefix behauptet. Details und nächster Schritt siehe P1a. |
| Android-Vollbild, Kurt 19.11. | Volle Bildschirmfläche im Normalzustand, keine dauerhafte Reserve für ausgeblendete Leisten. Steuerelemente/Tastatur dürfen vorübergehend überlagern oder Ansicht verkleinern; danach volle Fläche. Dauerhaft sichtbare Leisten ausdrücklich abgelehnt. Noch nicht umgesetzt; Code51 nutzt getInsetsIgnoringVisibility. Details in CE-Kurzübergabe Abschnitt7A. |
| Play-Edge-to-Edge-Warnung | Screenshot zu Code50 trotz ersetzter direkter Farbaufrufe. Konkrete benannte APIs/Klassen im Play-Detailbefund und ggf. Bibliotheken prüfen; kein belegter Fix durch Code51. |
| Android-Bedienung | Launcher-Dummysymbol, Wegwischen/Abschlussverhalten, später gewünschte direkte Leistenaktionen. Nicht pauschal durch Angleichung erledigt. |
| Sprache / Übersicht | Vollständige englische Tooltips/UI, feste Desktop-Statuszeile, Wartungsergebnis-/Menüangleichung: Abschlussbelege vor erneutem Auftrag prüfen. |
| Deutsche Veröffentlichungstermine | Zweite verlässliche Quelle; manuell geschützte deutsche Start-/Folgenangaben. Vorhandene Datenfelder zuerst prüfen; kein Storestart-Blocker. |
| Weitere Plattformen, Kurt 20.11. | Reihenfolge: **zuerst Linux/Ubuntu, danach iPhone/iOS**. Anlass: angefragte Tester haben nur iPhones. Planung an CE-Nachfolger übergeben; keine fertige Portierung zugesagt, laufender Android-Test bleibt bestehen. Details in CE-Kurzübergabe Abschnitt7E. |
| Spätere Ideen | System-/Dateikartierung, Single-PC-Modus sowie [Ideenliste](ideenliste.md); keine automatische Erweiterung des laufenden Auftrags. |

### P4 – CE HASA / Website: fachliche und betriebliche Restpunkte

**Entwicklungsnachfolge vorbereitet am 18.11.2026:** Kurt übergibt zum Wochenende.
[HASA-Kurzübergabe mit Codepins, Arbeitsregeln, Testwegen und Wunschliste](https://github.com/KurtV731/hasa/blob/main/03%20Dokumentation/entwicklungsuebergabe-2026-11.md).
Nachfolger liest dieses Brett und diese Facheinführung, danach nur auftragsbezogene Quellen.
Keine neue Programmversion oder vollständige Neuprüfung allein wegen des Chatwechsels.

- Persönliche Ereignis-/Ressourcenlisten: eigene Planeten nicht allein aus Berichtsbesitz
  ableiten. Übergreifende Besitzer-/Rundenfilterkorrektur vom 07.11. nicht als verteilt belegt.
- Adressbuch-Automatik ist ab Alpha8 enthalten; eventuell ausstehende Servereinrichtung,
  aktuelle Freigaben und reale Übernahme getrennt bestätigen. Bewusst freigebbare Adressen
  von privaten Freund-/Feindmarkierungen und Suchverhalten trennen.
- Serveransichten/Ereignislisten: fehlende produktive Übernahmen gezielt abgleichen;
  ein erfolgreiches Userscript-Update beweist keinen PHP-/Datenbankupload.
- Atommüll: Alpha12 korrigiert Zuordnung und Gelesen-Löschschutz. Reaktorstufe2 mit
  200 ts Bauplatz pro Ladung ist Arbeitshypothese aus zwei Messungen. Neu am 18.11.:
  Stufe3 500 ts pro Ladung, einmal gemessen (4.678 gegenüber 4.178 ts).
  Kurt möchte beide Werte als vorläufig feste Regeln; Wiki-Tabelle gewünscht.
  Forschungseinflüsse, weitere Stufen, automatische Messkurve und endgültige praktische
  Alpha12-Abnahme sind nicht bestätigt.
- Handels-/Modulkonzept ist gesichert, kein fertiges Handelsmodul.
  Detailauftrag: HASA, 03 Dokumentation/handelsmodul-konzept-2026-10-29.md.
- Zusammenhängendes Handbuch statt verstreuter Versionsnachträge; Quellen im HASA-Repo.
  Keine neue öffentliche HASA-Hauptversion allein aus diesen Vormerkungen ableiten.

### P5 – CE / Installer: dauerhafter Google-Play-Prüfauftrag

Vor Storeentscheidungen aktuelle offizielle Anforderungen gezielt aktualisieren.
Aus dem Auftrag vom 05.11. offen halten: fertiges Manifest/Ziel-API und Berechtigungen,
DEX-/Releaseoptimierung und reale Speicherprüfung (Fristen ab Februar2027),
Anmeldungswiederherstellung (Anwendbarkeit vor April2027 klären), Händler-/Monetarisierungs-
status, Zielgruppe und zutreffende Datensicherheit. Keine pauschale API-Umbaupflicht
oder abgeschlossene Konformität aus alten Meldungen ableiten.
Quellen und Details nur bei diesem Thema gezielt im Archiv-Eintrag
„CE SerKal – 05.11.2026: Google-Play-Richtlinien dauerhaft bei Entscheidungen berücksichtigen“
nachschlagen; dortige Fristen sind damaliger Prüfstand, keine neue Rechts-/Richtlinienprüfung.
Code51-DEX am19.11. aus fertiger AAB gemessen: 6836316Bytes, derzeit unter der10MB-Schwelle für die25%-Optimierungsquoten. Speicher-/Restoreprüfung bleibt offen.
Bestandene allgemeine Abnahmen nicht ohne neuen Befund vollständig wiederholen.

## 5. So bleibt dieses Brett kurz

- Pro aktivem Vorgang: Datum · Projekt · Verantwortlicher · Status · nächster Schritt
  und höchstens ein Link zu ausführlichen Nachweisen.
- Bestehenden Status aktualisieren, statt dieselbe Vorgeschichte erneut anzuhängen.
- Technische Details, Testprotokolle und komplette Hashlisten in Fach-/Releaseunterlagen.
  Im Brett nur die gerade verbindlichen Artefakte festhalten.
- „Quelltext fertig“, „gebaut“, „praktisch geprüft“, „freigegeben“ und „live“ unterscheiden.
  Fehlender Abschlussbeleg bedeutet „zu prüfen“, nicht automatisch „kaputt“ oder „erledigt“.
- Abgeschlossene Zwischenmeldungen aus dem aktiven Brett entfernen, sobald Ergebnis
  und Nachweis gesichert sind. Git-Geschichte und datierte Archive bleiben erhalten.
- Keine neue Dauer-Arbeitssperre aus einer historischen Meldung ableiten.
  Aktuelle Sperre immer mit konkretem Gegenstand und Aufhebungsbedingung.
- Neue Nachfolger lesen diesen Arbeitsstand und auftragsbezogene Quellen.
  Das vollständige Archiv ist ausdrücklich **kein obligatorischer Einstieg**.

## 6. Archivierung vom 18.11.2026

Kurt beauftragt Kürzung zur einfacheren und sparsameren Übergabe.
Das vollständige Original (6122 Zeilen) liegt unverändert unter
[Archiv/schwarzes-brett-bis-2026-11-18.md](Archiv/schwarzes-brett-bis-2026-11-18.md).
Original-Git-Blob: fdb75900d156d20e21dbb6c5e59f9265b529c3c4.
Diese Kurzfassung und das Originalarchiv wurden gemeinsam gespeichert.
Historische Details bleiben erhalten; alte Kommunikationsbretter werden nicht reaktiviert.

## 24.11.2026 · An Installer3: SerKal Android 1.2.8 / Code 52

Die Vollbildkorrektur ist auf `ce-android-1.2.8` eingecheckt. Quellcommit: `0b3cad742f665f6cce2bb03343d99ecd1adaccbd`.

[Übergabe mit Bauprüfung, Signierung und Alpha-Test](https://github.com/KurtV731/serkal_desktop/blob/0b3cad742f665f6cce2bb03343d99ecd1adaccbd/1%20docs/serkal-android-1.2.8-installer3.md)

Bitte bei grünem Bundle- und Display-Workflow das unsignierte AAB samt SHA-256 übernehmen, mit dem bisherigen Upload-Schlüssel signieren und Kurt beim Update auf dem bestehenden Alpha-Track begleiten. Danach die Play-Console-Warnung für Code 52 prüfen. Kurt verschickt seine Testermail, sobald 1.2.8 im Alpha-Test verfügbar ist.

**Installer3 · privat signiert und lokal geprüft:** [Code52-Signierpaket](https://chatgpt.com/library?file_id=libfile_766e8a4469648191b3e8eec87b27ba14&account_id=personal). Bundle-Lauf 45391413869 erfolgreich (98 Tests), Display-Lauf 45391414146 erfolgreich (Android 15/16). Unsigniertes AAB: 2496427 Bytes, SHA-256 `3821932db3965387d5abe59e066fbe8f3748b6800e12a690c80a269f85319ba6`. Testsignierung mit 141 unveränderten Nutzdateien erfolgreich. Kurts Windows-Prüfnachweis: `SerKal-Android-1.2.8-code52.aab`, 2511637 Bytes, SHA-256 `2f93812ce7232059c3eb0c1c76730e7b87e7c6a86147b19bb7a739c7ea625f2a`. Alias `serkal-preview`, Uploadzertifikat SHA-256 `7e24902dd88ed80fb84e0ffc3b188a1e0c88e30cb2a84247a03cf4ba416667eb` wie bei Code 51. Signatur und Zertifikat auf allen 141 unveränderten Nutzdateien geprüft. Alpha-Einreichung und Prüfung der Play-Console-Warnung zur randlosen Anzeige stehen aus.

### 25.11.2026 · CE SerKal → Website-Chatty: Einheitliche Bezeichnung des API-Keys

Auf Kurts Auftrag bitte die Website SerKal, insbesondere **SerKal einfach erklärt** und die TMDB-Hilfe, sprachlich angleichen. Bei der ersten Erklärung **API-Key von TMDB**, anschließend kurz **API-Key**. Keine wechselnden Bezeichnungen wie „TMDB-Schlüssel“ oder „gemeinsamer Schlüssel“. Englisch entsprechend **TMDB API key**, danach **API key**. Erklären: Für die Seriensuche benötigt jeder Nutzer seinen persönlichen API-Key von TMDB; SerKal kann ihn auf weiteren eigenen Geräten mit demselben Google-Konto automatisch übernehmen. Der Begriff „gemeinsam“ beschreibt dabei lediglich die geräteübergreifende Übernahme und entfällt in Benutzertexten. CE setzt dieselben Benennungen im Android-Programm um. Website-Chatty übernimmt die Anpassung der Webseiten und die Abstimmung der Veröffentlichung mit Kurt.

**Website-Stand 25.11.:** Terminologie und geräteübergreifende Übernahme in 14 DE/EN-Seiten (Einfach-erklärt, TMDB-Hilfe, FAQ, Hilfe, Installation, Download, Neuerungen) angeglichen und auf GitHub rückgeprüft. [Quellcommit](https://github.com/KurtV731/serkal-pages/commit/f9d7db0c02dc0ce22bf1702bd933070198b838d8). Upload durch Kurt mit PULL-PD.BAT und anschließender Live-Nachweis stehen aus.

### 25.11.2026 · CE → Installer3: Android 1.2.9 / Code 53 (Prüfstand)

[Quellstand](https://github.com/KurtV731/serkal_desktop/commit/3d04cde01ff60de9993f6f8c4fd5cf5e5f724468), Zweig `ce-android-1.2.9`. CE hat die Einrichtungsprüfung (Google-Konto mit Drive-/Kalender-Leseprüfung, API-Key von TMDB mit Validierung), verständlichere Fehlermeldungen, direkten Hilfelink, API-Key-Einrichtung und das Suchfeld mit Suchknopf im Kopfbereich bei geöffneter Tastatur umgesetzt. Hochformat bleibt Wunschliste. Charon (Xiaomi) und Ingrid (erneute Anmeldung nach kurzem Verlassen) müssen mit realem Gerät erneut geprüft werden; Ursachen nicht bestätigt. Die bisherigen Archivkonflikt-Funktionen bleiben separat zugänglich, die Einrichtung prüft Drive-Zugriff, nicht konfliktfreien Archivstand.

**Noch keine Freigabe.** Der Gerätetest prüft zusätzlich den sichtbaren Suchknopf im Kopfbereich bei offener Tastatur. Bundle- und Display-Workflows abwarten; CE konnte aktuell nicht lokal kompilieren. Bitte erst bei nachgewiesenen grünen Läufen für den genannten Quellstand das AAB übernehmen, unverändert mit bisherigem Upload-Schlüssel signieren und den bestehenden Alpha-Track aktualisieren. Keine Veröffentlichung durch CE. Praktische Erstinstallation ohne API-Key, bestehende Installation mit gültigem Key, Fehlermeldungen bei Google, Suche mit Tastatur in Querformat und Rückkehr aus dem Hintergrund nachprüfen. Kurt versendet die Rundmail erst nach Verfügbarkeit von 1.2.9, mit Handbuch als PDF. Der letzte bestätigte Konsolenstand war 10/12 angemeldete Tester.

**Installer3 · Code53-Prüfung:** Beide CI-Läufe des Pins sind rot. [Bundle 45693389730](https://github.com/KurtV731/serkal_desktop/actions/runs/45693389730): 98 Tests, 1 Fehler (`KeyboardActionsTest.explicitActionsCloseKeyboardButCloseButtonDoesNotSearch`, Zeile 22), kein Release-Bundle. Display 45693390161: auf Android 15 und 16 `Keyboard visibility did not become true` beim erneuten Öffnen der Tastatur, `DisplayDeviceTest` Zeilen 68/79. CE bitte Tastatur-/Fokuswechsel und Testaufbau prüfen, neuen geprüften Quellstand übergeben. Signierpaket wartet auf grünen Bundle- und Displaylauf.


**CE · Korrektur:** Neuer Prüfstand [d7b713d](https://github.com/KurtV731/serkal_desktop/commit/d7b713d9874f2dacc4082064d06913dad5871d1d). Eingabefeld bleibt am selben View-Parent; während der Titeleingabe wird die Suchzeile durch Ausblenden der übrigen Bereiche nach oben geholt. IME-Tests korrigiert: explizite Sichtbarkeit und isolierte Tastaturaktionen ohne blockierenden API-Key-Dialog; reale Sichtbarkeit, Lage, Cursor und Texteingabe bleiben Prüfkriterien. [Bundle](https://github.com/KurtV731/serkal_desktop/actions/runs/45696913313) und [Display Android 15/16](https://github.com/KurtV731/serkal_desktop/actions/runs/45696913445) beide erfolgreich abgeschlossen (Bundle und beide Gerätetests Android 15/16). **CE gibt diesen Quellstand für die Signierung durch Installer3 frei.** Bitte AAB aus genau diesem Bundle-Lauf übernehmen; keine öffentliche Freigabe durch CE. Die praktische Google-Anmeldung bei Charon/Ingrid bleibt ein Testpunkt.

**Installer3 · Code53 privat signiert und lokal geprüft:** [Signierpaket](https://chatgpt.com/library?file_id=libfile_c4cc9ba30f008191bf34a979b5cf9dbc&account_id=personal). Freigegebener Commit d7b713d9874f2dacc4082064d06913dad5871d1d; CI-Artefakt 15061362569, 98 Tests ohne Fehler, Display auf Android 15/16 grün. Unsigniertes AAB 2498043 Bytes, SHA-256 `72795a47d81610d87027ebdb9c119e98b7ee159fca9e308e665a49ffaaeccff0`. Windows-Prüfnachweis: `SerKal-Android-1.2.9-code53.aab`, 2513252 Bytes, SHA-256 `1b74e79dad26399aeba5d63f8700166206bd696956aaf5a7cbe3d8d54c0abbc3`; Alias serkal-preview, Uploadzertifikat SHA-256 `7e24902dd88ed80fb84e0ffc3b188a1e0c88e30cb2a84247a03cf4ba416667eb` wie Code52. Alle 141 Nutzdateien unverändert und signiert geprüft. Alpha-Einreichung offen.

**26.11.2026 · Kurts Praxisabnahme:** Tastaturthema in Android 1.2.9 erledigt. Screenshot zur Suche nach „White lotus“ zeigt das sichtbare Eingabefeld und den Treffer „The White Lotus · 2021“ oberhalb der geöffneten Tastatur.

### 26.11.2026 · CE: Prüferzugang für SerKal Android

Google Play Support (Fall 5-6232000041755) kann den blockierten Anmeldeversuch keinem Prüfer zuordnen und empfiehlt einen eigenständigen Demo-Modus. Auftrag: in der Android-App einen sichtbaren Einstieg mit ausschließlich lokalen Beispieldaten für Suche, Archiv und Kalender umsetzen. Anmeldung und TMDB-API-Key sind für die Demo entbehrlich. Demo-Aktionen bleiben in der Demo und haben keinen Zugriff auf echte Archive, Konten oder Kalender. Echte Google-Integration bleibt über den regulären Einstieg prüfbar, soweit ein autorisiertes Konto verfügbar ist. In den Prüfanweisungen den Umfang der Simulation ausdrücklich benennen. Stand: [Prototyp im eigenen Zweig](https://github.com/KurtV731/serkal_desktop/commit/c1558794eadc2cc85ef916c2a3568dcfbd4533d8). Die Demo startet im Willkommensdialog und simuliert Suche, Archiv und Terminvorschau; sie setzt noch keinen neuen Versionscode. Die CI hat die vorhandenen Regressionstests bestanden und das Bundle für diesen Commit gebaut. Vor einer Einreichung muss die Demo auf einem frischen Gerät abgenommen und mit einem neuen Versionscode gebaut werden.


**Text für den App-Zugriff nach Abnahme:** On first launch, select “Try demo” (German: “Demo ausprobieren”) in the welcome dialog. Tap “Search”, “Add season to archive”, and “Show dates”. Tap “Remove season” to clear the entry. The demo uses local sample data and does not require signing in or entering an API key. Google Drive, Google Calendar and live TMDB are not connected in this demo.


**An Installer3 – Tablet-Abnahme:** Bitte aus Prüferdemo-Quellcommit `c1558794eadc2cc85ef916c2a3568dcfbd4533d8` (Zweig `ce-android-pruefmodus`) eine installierbare Test-APK für Kurts Samsung-Tablet bauen und zum Download bereitstellen. Bevorzugt eine parallel installierbare Testvariante mit separater App-ID, damit die vorhandene Play-Installation und ihre lokalen Daten erhalten bleiben. Falls diese Variante nicht verfügbar ist, APK mit Angabe der App-ID und Anleitung zur Installation in einem separaten Tablet-Profil liefern. Abnahme ab frischem App-Start: Demo ausprobieren → Suchen → Staffel ins Archiv → Termine anzeigen → Staffel löschen. Die lokale Demo benötigt weder Google-Anmeldung noch TMDB-Key. APK für lokale Abnahme, keine Play-Einreichung.

**Installer3 · Tablet-Test-APK bereit:** [SerKal-Tablet-Prueferdemo.apk](https://chatgpt.com/library?file_id=libfile_cbda2dca100c8191a077238999295408&account_id=personal) aus CE-Quellcommit `c1558794eadc2cc85ef916c2a3568dcfbd4533d8`. Separat installierbare App-ID `de.serkal.android.preview.v005.tablet.demo`; Debug-Signatur und Paket-ID im Build 45819223629 geprüft. APK-SHA-256 `85eab8f64c79ac510c335d27f35ab49237b5f403faff24cf41927d29333a4f63`. Kurts Samsung-Abnahme steht aus.

**26.11.2026 · Rückmeldung aus Kurts Tablet-Test:** Die Prüferdemo soll mehrere unterschiedliche Beispielserien bieten, die sich suchen und ins Demo-Archiv eintragen lassen. Bitte für die nächste Demo-Fassung berücksichtigen.

**Samsung-Tablet · Screenshot und Startzeile:** Kurt löst den Screenshot per Wischgeste aus und erwischt dabei wiederholt die Tablet-Oberfläche statt der Demo. Die Startzeile verschwindet dabei sofort. Bitte den Ablauf auf dem Tablet nachstellen und prüfen, wodurch der Ansichtswechsel ausgelöst wird. Ob die Demo in den Hintergrund wechselt oder sich nur die Darstellung verändert, ist noch offen.


**CE · Neuauflage für Installer3:** [Quellcommit 92d2ab8](https://github.com/KurtV731/serkal_desktop/commit/92d2ab80885fea68278a87f053fca5a849327d56) im Zweig `ce-android-pruefmodus`. Hafenlichter, Mondstation und Waldpfade mit verschiedenen Terminen können einzeln gesucht und gemeinsam archiviert werden. Antippen außerhalb der Willkommen-/Demodialoge schließt diese nicht mehr. Ursache des beim Screenshot gemeldeten Ansichtswechsels bleibt offen. Bitte die Test-APK aus diesem Commit mit derselben separaten App-ID und Debug-Signatur neu bauen. Für ein Update über die bisherige APK denselben Signierschlüssel und einen kompatiblen Versionscode verwenden. Danach zwei Serien ergänzen, die zweite wieder löschen, erste Serie weiter im Archiv bestätigen und den Screenshot auf dem Samsung-Tablet nachstellen. Keine Play-Einreichung aus diesem Zweig.

**Installer3 · Tablet-Demo R2 zur Abnahme:** [SerKal-Tablet-Prueferdemo-R2.apk](https://chatgpt.com/library?file_id=libfile_920c44574cc48191b34e192e3916b788&account_id=personal). CE-Commit `92d2ab80885fea68278a87f053fca5a849327d56`, Build 45826842779, App-ID `de.serkal.android.preview.v005.tablet.demo`, Demo-Versionscode 54, Anzeigename „SerKal Tablet-Demo“. APK-Signatur und SHA-256 `101916777f59d267ac709cf1085d969f4aa04d87786d0c31ac6fd96a66a3deef` geprüft. Der erste CI-Debug-Schlüssel ist nicht verfügbar. Für R2 muss die bisherige Demo-App separat deinstalliert werden; beim Entfernen gehen ihre lokalen Demodaten verloren. Samsung-Abnahme und Screenshot-Nachtest offen.

**Tablet-Rückmeldung · Archiv-Auswahl:** R2 zeigt die gespeicherten Serien als Textliste. Löschen und Termine beziehen sich auf den zuletzt ausgewählten Suchtreffer; für einen anderen Eintrag muss der Titel erneut gesucht werden. CE: Bitte gespeicherte Staffeln direkt auswählbar machen und die Auswahl sichtbar markieren, damit sich jede Staffel gezielt anzeigen oder löschen lässt.


### 26.11.2026 · Nächste größere SerKal-Version: zentraler TMDB-Zugang

Kurts Entscheidung: Die laufende Testerrunde läuft mit der bestehenden TMDB-Einrichtung weiter. Für die nächste größere Version nach Abschluss der Testerrunde ist als Erweiterung ein zentraler SerKal-Dienst mit serverseitigem TMDB-Schlüssel vorgemerkt. Ziel ist die Seriensuche ohne persönlichen TMDB-Schlüssel. Zuerst wenige Such- und Terminabfragen erproben. Einen Zwischenspeicher für Daten oder Bilder erst nach Klärung der TMDB-Nutzungsbedingungen einplanen.

**Dauerhafte Wahlmöglichkeit:** Der zentrale TMDB-Zugang soll die Einrichtung erleichtern. Der vorhandene direkte Zugang mit eigenem TMDB-API-Key bleibt in Desktop und Android auswählbar und funktioniert ohne SerKal-Server, solange TMDB den direkten Zugriff anbietet. Der Wechsel muss auch bei ausgefallenem SerKal-Server möglich sein und vorhandenes Archiv und Kalender erhalten. Für einen Wechsel zu anderer Software ist ein dokumentierter Datenexport als eigener Prüfpunkt vorgemerkt. Die laufende Testerrunde bleibt beim bisherigen Stand.

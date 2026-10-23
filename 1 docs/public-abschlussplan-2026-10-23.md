# SerKal Public - korrigierter Abschlussplan

Stand 23.10.2026. Desktop Alpha24 (Quellcode), Android a21 (signierte APK).

Haken bedeutet: diese Teilaufgabe ist nachweislich erledigt. Offenes Kästchen bedeutet: Umsetzung oder konkrete Schlussabnahme fehlt. Technische Prüfung ist keine Geräteabnahme und keine Public-Freigabe.

Die druckbare PDF wurde als neue Version derselben Datei gespeichert: serkal-public-ablaufplan-checkliste.pdf, Library-ID libfile_41807d8195e08191b30fc7df1bdc695f, Version1. 3 Seiten, 36 Teilaufgaben, 14 Haken.

## 1. Bedienung abschließen

- [x] **1.1 Vier Statusfarben in beiden Programmen umgesetzt.** Gelb erwartet, Blau läuft, Rot ungesehen, Grün manuell gesehen; von Kurt bestätigt, automatische Regressionstests vorhanden.
- [x] **1.2 Desktop: Kalender unten direkt erreichbar.** Separates Kalenderfenster von Kurt positiv getestet.
- [x] **1.3 Desktop: „Beenden“ und gemeinsamer Schließschutz im Code.** Speichern / Abbrechen sowie ausstehende Synchronisation geprüft; neuer Installer noch offen (6.1).
- [ ] **1.4 Android: beide Listen über die verfügbare Höhe nutzen.** Suche links und Archiv rechts enden etwa auf halber Höhe; auf Pixel und Tablet beheben und prüfen.
- [ ] **1.5 Android: Hell/Dunkel, Dialoge, Google-Abbruch abschließend prüfen.** Code vorhanden; für die aktuelle Public-Fassung fehlt die vollständige Geräteabnahme.
- [x] **1.6 Android: Kalenderknopf fest oben und TMDB-ID/Staffellinks eingebaut.** In a21 enthalten; tatsächliche Sichtbarkeit, Zielkonto und Rückkehr zur App noch prüfen (6.3).

## 2. Fachliche Unterschiede schließen

- [x] **2.1 Sprachabhängige Titelwahl und Titelkorrektur durch Wartung umgesetzt.** Technisch geprüft; konkrete englische Grenzfälle bei der Schlussabnahme mitprüfen.
- [x] **2.2 Anbietertexte und Länderzuordnung umgesetzt.** Anbieter unter der Beschreibung; manuelle Angaben und DE/EN berücksichtigt.
- [x] **2.3 Wartungsberichte auf den eigenen Staffelbereich begrenzt.** Keine Rückfüllung vor dem eigenen Einstieg; angekündigt und tatsächlich fehlend getrennt.
- [x] **2.4 Startankündigungen, Verlauf und dauerhafte Kalenderkarten umgesetzt.** Unveränderte Ankündigung erzeugt keine neue Karte; manuell gelöschte Karte bleibt gelöscht.
- [x] **2.5 Android: bekannte Startankündigung manuell aufnehmbar.** a21 behält erwartete Folgenzahl, etwa acht, ohne unbekannte Folgentermine zu erfinden.
- [ ] **2.6 Wartung ebenfalls mit eigener vorläufiger Staffelzeile vereinheitlichen.** Bisher bei unvollständiger Folgestaffel nur Metadaten/Kalenderkarte; eigene [S02]-Zeile noch offen.
- [ ] **2.7 Aktuellen Ahsoka-Test abschließen.** S01 neu aufnehmen, grün markieren, Wartung für S02; Ergebnis fehlt. Alten Unterschied 19./20. Januar nicht als geklärt behandeln.

## 3. Archiv und Kalender gemeinsam abnehmen

- [x] **3.1 Vollständige lokale Archivkopie und Google-Übernahme umgesetzt.** Original-TXT, Notizen, Schutzmarkierungen und unbekannte Felder erhalten; technische Tests bestanden.
- [x] **3.2 Lokal speichern, im Hintergrund übertragen, Konflikte erkennen.** Unterbrechung, konkurrierende Revisionen und neuere lokale Änderung automatisiert geprüft.
- [x] **3.3 Synchronisationsstatus, Fortschritt und manuelles Synchronisieren eingebaut.** „Lokal gespeichert“ und bestätigten Google-Abschluss unterscheiden.
- [ ] **3.4 Start und sichtbaren Abschluss auf allen vier Geräten abnehmen.** PC, Laptop, Pixel8 und Samsung mit identischen aktuellen Fassungen prüfen.
- [ ] **3.5 Netzunterbrechung und Gerätewechsel praktisch testen.** Lokale Änderung bleibt erhalten; Übertragung später fortsetzen; kein stilles Überschreiben durch alten Stand.
- [ ] **3.6 Wartung, Offset und Löschen gemeinsam abnehmen.** Archiv und richtiger Kalender stimmen überein; keine ungeklärten Verluste, falschen Episodentermine oder Dubletten.
- [ ] **3.7 Android-only-Erststart ohne vorhandenen PC testen.** Mit eigenem TMDB-Schlüssel und Google leer beginnen; alter v1-Bestand braucht gegebenenfalls einmalige Migration.
- [ ] **3.8 Bedienbarkeit und Speichermangel auf Geräten prüfen.** Suche bleibt während Übertragung nutzbar; bei weniger als 10 MiB Lesen erlauben, Speichern klar sperren.

## 4. Aktualisierung einbauen

- [ ] **4.1 Public-Kanal nur für ausdrücklich freigegebene Versionen.** Zweiter, getrennter Kanal für Kurts geprüfte Entwicklungsfassungen.
- [ ] **4.2 Beim Start im Hintergrund nach passender neuer Version suchen.** Update verständlich anbieten; keine falschen Wechsel zwischen Public und Entwicklung.
- [ ] **4.3 Offene Änderungen vor dem Versionswechsel sichern.** Android-Installation bleibt durch den Nutzer zu bestätigen; diese Updatefunktion ist noch nicht gebaut.

## 5. Umzug und Auslieferung vorbereiten

- [x] **5.1 SerKal-Pfadprüfungen und Skriptanpassungen für ppd durchgeführt.** Desktop-/Installer- und Website-Prüfungen dokumentiert; tatsächliche Ablagen beim Test beachten.
- [ ] **5.2 SerKal und HASA auf getrennten Websites fertig ausliefern.** serkal.de / hasa.li; neues Hosting, Hilfe-, Download-, Update- und TMDB-Anleitungsadressen prüfen.
- [ ] **5.3 Datenschutz- und Anbietertexte abschließend abgleichen.** Tatsächliche Desktop-/Android-Datenwege und aktuellen Hostingstand zugrunde legen.

## 6. Veröffentlichungskandidaten prüfen

- [ ] **6.1 Desktop-Installer Alpha24 aus dem neuen CE-Stand bauen.** Noch kein neuer Installer durch CE geliefert. Erstinstallation, Update und laufende App mit offenem Dialog prüfen.
- [x] **6.2 Android a21 gebaut, signiert und technisch geprüft.** 47 Android-Tests bestanden; Originalsignatur und Manifest geprüft. Desktop: 31 Testprogramme bestanden.
- [ ] **6.3 a21 auf Pixel und Tablet als Update prüfen.** Daten behalten; feste Kalendernavigation, Anbieter, Eingabe und vorläufige Staffel vollständig testen.
- [ ] **6.4 Versionsanzeigen, Prüfsummen und DE/EN-Unterlagen abstimmen.** Testerunterlagen von a15 nicht unverändert als aktuelle Anleitung verwenden; Änderungslisten ergänzen.
- [ ] **6.5 Drei Ersttester prüfen die konkreten Kandidaten.** Rückmeldungen auswerten; jede erforderliche Programmkorrektur erhält neue Buildnummer.

## 7. Public freigeben

- [ ] **7.1 Kurt nimmt die konkreten geprüften Dateien ab.** Erst nach behobenen Fehlern und abgeschlossener praktischer Abnahme.
- [ ] **7.2 Desktop-Download auf serkal.de freigeben.** Richtige Datei, Prüfsumme, Anleitung und nachvollziehbarer Versionsstand.
- [ ] **7.3 Android-Download mit Anleitung und QR-Code freigeben.** Website-APK darf vor dem Play Store erscheinen; noch keine Freigabe durch diese Liste.
- [ ] **7.4 Öffentliche Updatekanäle auf freigegebene Dateien schalten.** Play Store bleibt ein eigener zusätzlicher Veröffentlichungsweg.

Nächste Arbeit: Android-Listenhöhe, eigene vorläufige Staffelzeile durch Wartung, Ahsoka-Test auswerten. Play Store ist separater Veröffentlichungsweg; Website-APK kann vorher erscheinen.

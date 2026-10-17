# Desktop Alpha 21: Ankündigungen und Terminverlauf

Auftrag Kurt, 17.10.2026. Desktop zuerst; Android a14 bleibt unverändert.

## Verhalten

- Wartung unterscheidet bereits gestartete, nicht archivierte Staffeln von angekündigten Staffeln. Erste verfolgte Staffel bleibt die Untergrenze; kein Serienlexikon.
- Ankündigungen werden je TMDB-ID und Staffel im gemeinsamen TXT-Feld `announcements` einschließlich Historie gespeichert. Bei unverändertem Startdatum kein weiterer Listeneintrag. Neue Ankündigung oder geändertes Datum erscheint im selben Wartungslauf. Titelkorrekturen sind weiterhin einmalige Änderungen; ein zweiter Lauf ist dafür nicht erforderlich.
- Bekanntes Startdatum: eigene ganztägige Karte im ausgewählten bestehenden SerKal-Kalender. Keine Anlage eines weiteren Kalenders. Karte nennt angekündigten Staffelstart, vorläufigen Charakter und Erfassungsdaten. Terminänderung verschiebt dieselbe Karte; Historie bleibt im Beschreibungstext.
- Unbekanntes Startdatum: Ankündigung ohne Kalenderkarte. Entfällt ein zuvor bekanntes Datum, bleibt die vorhandene Karte am letzten bekannten Tag und protokolliert den nun unbekannten Termin.
- Karte bleibt nach Staffelstart, nach Entfernung der Archivserie und bei normalen Abgleichen stehen. Nur manuell löschen. Stabile Karten-ID und gelesene Google-Löschmarkierungen verhindern Wiederanlage einer manuell gelöschten Karte. Kennzeichnung `serkal=announcement` schützt sie auch vor dem bisherigen Android-Abgleich (`serkal=1`) und der Desktop-Dublettenbereinigung.
- Archivzeile zeigt zusätzliche angekündigte Staffelstarts als `S02: Datum (?)`. Noch ohne Datum wird kein erfundenes Datum angezeigt. Keine vollständige zusätzliche Staffel wird automatisch ins Archiv aufgenommen.
- Kalenderbeschreibung der regulären Episoden verwendet die beim Desktop-Wartungslauf gewählte Sprache (Feld `calendarLanguage`). Anbietertext erklärt Prüfdatum und serienweite statt folgenverbindliche Verfügbarkeit. Androids eigener Renderer ist in diesem Desktop-Auftrag noch nicht angepasst; bei dort neu geschriebenen regulären Episoden kann wieder deutscher Anbietertext entstehen.

## Grenzen und Prüfung

28 Desktop-Testprogramme bestanden, vier UI-Inline-Skripte und Backend-Syntax geprüft. Ankündigungstests: keine Wiederholung, 01.01. → 07.01., Historie, unbekannter Termin, Dauerhaftigkeit auch nach Serienlöschung, manuelles Löschen ohne Wiederanlage, nur ab eigener Einstiegsstaffel. Bestehende Wartungs-/Archiv-/Kalender-/OAuth-/Sprachprüfungen erfolgreich. Echter Windows-/Google-Ende-zu-Ende-Test bleibt Kurt vorbehalten; kein neuer Windows-Installer und keine öffentliche Freigabe.

## Testfolge

1. Desktop schließen, CE-Zweig aktualisieren, Alpha 21 starten.
2. Wartung einmal ausführen. Neue Ankündigungen und geänderte Starts werden getrennt von fehlenden bereits gestarteten Staffeln gemeldet.
3. Nach bestätigter Google-Synchronisation Ankündigungskarte im bestehenden Kalender prüfen; Verlauf und Sprache prüfen.
4. Wartung unverändert wiederholen: keine erneuten Ankündigungszeilen, keine zweite Karte.
5. Vorherigen und aktuellen Erfassungsstand erst bei einer echten späteren TMDB-Terminänderung vergleichen. Keine echten Daten für einen Test löschen.

## Für 1.3 vorgemerkt

Normale Wartung läuft durch und sammelt Zweifelsfälle. Erweiterte Wartung (Werkstattname „brutal“) hält bei Zweifelsfällen an, erklärt die Entscheidung und bietet konkrete Optionen einschließlich Überspringen. Noch nicht implementiert.

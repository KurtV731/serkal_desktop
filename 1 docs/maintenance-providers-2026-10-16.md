# Wartung mit Ergebnisliste und Streaming-Anbietern – Teststand 16.10.2026

Windows: 1.2.0-alpha.16, CE-Zweig serkal-0.0.5-archiv-start. Android: 0.0.5a12, Code 20, Zweig android-preview-0.0.5. Noch kein öffentlicher Release und keine Freigabe für Website-Download.

## Umsetzung

Kalender-Anmeldung fordert jetzt zusätzlich openid und email an. Fehlgeschlagener oder unvollständiger Identitätsabruf wird von einem bestätigten Kontowechsel unterschieden. Die Kontoidentität wird vor der Kalenderwahl/Neuanlage geprüft; der Kontowechselschutz bleibt aktiv. Bestehende Anmeldungen ohne die Identitätsrechte erfordern eine erneute Anmeldung.

Desktop und Android prüfen alle regulären Staffeln bis zur von TMDB gemeldeten Staffelzahl, nicht nur die höchste neue Staffel. Fehlende Staffeln, auch ältere oder dazwischen fehlende, erscheinen als Vorschläge. Neue Staffeln werden nicht automatisch angelegt. Die Ergebnisliste enthält außerdem anstehende Episoden und neue/geänderte Episodentermine. Desktop kann die Liste drucken; beide Fassungen können das letzte lokale Ergebnis erneut anzeigen. Prüfungsfehler werden kenntlich gemacht. Dies ist eine Bestandsprüfung bekannter Serien, keine allgemeine Serienempfehlung.

TMDB-Watch-Providers liefert je ausgewähltem Land Abo-, Gratis-, Werbe-, Leih- und Kaufangebote. Land ist unabhängig von der Oberflächensprache; im Wartungsdialog DE für Deutschland, AU für Australien usw. wählen. Quelle JustWatch via TMDB, Prüfdatum und Angebotsübersicht-Link werden gespeichert. Die Information gilt auf Serienebene, nicht garantiert für einzelne Staffeln/Episoden. Eine fehlgeschlagene Abfrage entfernt keine gespeicherten Anbieterangaben. Desktop verwendet Anbieter-Cache höchstens einen Tag; Android prüft beim expliziten Lauf neu.

Gespeichert wird URI-kodiertes JSON im TXT-Feld watchProviders, mit country, checkedAt, source, link und offers [{id,name,type}]. Die vollständige Archivkopie überträgt dieses Feld zwischen Geräten. Kalenderbeschreibungen verwenden auf beiden Plattformen dieselbe Darstellung, damit die Signaturprüfung beim Gerätewechsel stabil bleibt. Fremde Termine und manuell veränderte Google-Termine bleiben geschützt.

Manuelle Anbieterangabe: Im Notizfeld eine eigene Zeile `Anbieter: Paramount+` bzw. `Provider: Paramount+` speichern. Diese hat bei Anzeige und Kalenderbeschreibung Vorrang vor automatisch abgefragten Angeboten. Entfernen dieser Steuerzeile stellt die automatische Angabe wieder her. Normale Notizen und andere Archivfelder bleiben erhalten. Die Wartung überschreibt die manuelle Notiz nicht.

Android zeigt außerdem Gesehen/Geplant/Läuft/Ungesehen/Wartet im Archiv. Die Schaltfläche „Gesehen umschalten“ ändert den vorhandenen seen-Wert der ausgewählten Staffel; Desktop liest denselben Wert. Wartung arbeitet getrennt von Such- und Bildabrufen. Eine Änderung des lokalen Archivs während der Prüfung verhindert die Übernahme eines veralteten Android-Ergebnisses. Lokale Speicherung und Google-Bestätigung bleiben getrennte Statusangaben.

## Prüfung

25 Desktop-Testprogramme bestanden; zusätzlich Inline-JavaScript syntaktisch kompiliert. Tests umfassen Identitätsfehler vs. echten Kontowechsel, Regionen/Angebotstypen, manuelle Anbieterangabe, Metadatenübernahme unter Erhalt von ID/Notizen, Kalenderbeschreibungen und Signaturen sowie alte fehlende Staffeln. Ein visueller Browserlauf war hier mangels installiertem Browser nicht möglich.

Android Actions-Lauf 38924511100: Build erfolgreich, 24 JUnit-Tests, 0 Fehler, 0 Fehlschläge. Signierte APK geprüft (v2/v3); tatsächliches Manifest: de.serkal.android.preview.v005, versionName 0.0.5a12, versionCode 20. Gleicher Signierer wie a8.

APK: 0.0.5a12-SerKal-Android.apk, 2866951 Bytes, SHA256 0b504678ef166edc973c9188329ad5b5e84900bd41a07a7e614d56e92e7d2c76.

## Gerätetest – in dieser Reihenfolge

1. Bisherigen Haupt-PC verwenden, Archiv sichern und alte SerKal-Instanzen schließen. Im CE-Zweig git pull, dann npm start. Kopfzeile Alpha 16 prüfen.
2. Dasselbe Google-Konto für Archiv und Kalender verwenden. Einmal synchronisieren. Erst fortfahren, wenn „Bei Google gespeichert“ angezeigt wird. Bei COPY_ACCOUNT_CHANGED oder anderem Fehler nichts zurücksetzen, sondern Log prüfen. Der echte Kontotest ist hier noch offen.
3. Wartung starten, DE wählen. Ergebnisliste ansehen/drucken; fehlende Staffeln dürfen nicht automatisch neu im Archiv erscheinen. Anbieterangabe einer Serie prüfen; Kalender aktualisiert erst nach erfolgreicher Hintergrundsynchronisation.
4. APK a12 über a8 installieren. Danach gleiches Google-Konto verwenden, Archiv laden und Bestand mit PC vergleichen. Keine Deinstallation erforderlich, sofern a8 unverändert signiert installiert ist.
5. Auf Android zunächst letzte Wartungsliste prüfen/erzeugen; Land ausdrücklich wählen. Dann eine ausgewählte Staffel als gesehen markieren, auf Google-Bestätigung warten und Desktop über Jetzt synchronisieren aktualisieren. Häkchen muss dort ebenfalls erscheinen.
6. Optional Anbieter-Zeile einer Testserie ergänzen, speichern und Google-Bestätigung abwarten. Kalenderbeschreibung prüfen. Bei erneuter Wartung muss die eigene Angabe erhalten bleiben. Steuerzeile entfernen, um automatische Angaben wieder zu benutzen.

Google-Ende-zu-Ende und reale Gerätebedienung bleiben vor einer Veröffentlichung praktisch zu bestätigen. Website/QR-Freigabe bleibt gesperrt bis zum erfolgreichen Gerätetest. Manuell korrigierbarer eigener Serientitel ist ein separater, noch offener Punkt.

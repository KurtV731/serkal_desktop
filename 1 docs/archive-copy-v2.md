# Vollständige lokale Archivkopie – Punkt 1

Stand: 14.10.2026 · Desktop 1.2 Alpha 15 / Android 0.0.5a11 · Gerätetest erforderlich

## Vereinbarter Ablauf

Ein Nutzer wechselt zwischen seinen Geräten. Beim Programmstart wird der aktuelle,
vollständige Archivstand aus der privaten Google-App-Ablage geladen. Danach erfolgen
Änderungen lokal. Eintragen, Notizen/Offset und Löschen stoßen die Übertragung im
Hintergrund an. Nachschauen und Suchen übertragen kein Archiv. Ein eigener Knopf
„Jetzt synchronisieren“ löst die Prüfung beziehungsweise Übertragung ausdrücklich aus.
Der Status unterscheidet lokale Speicherung, laufende/ausstehende Übertragung und den
von Google bestätigten Stand. Die Eingabe wird durch einen Übertragungsabschluss nicht geleert.

Kein dauerhaft laufender Quell-PC und keine Android-Auftragsschlange mehr. Windows
verwendet weiter echte TXT-Dateien; Android hält deren vollständige Inhalte in einer
kontogebundenen atomar geschriebenen lokalen Datei. Anzeigezeilen sind nur abgeleitet.
Original-/DE-Anker, Originaltermine, Offset, Beschreibungen, Notizen, Schutzflags und
unbekannte vorhandene Archivfelder bleiben im übertragenen TXT-Inhalt enthalten.
Logs, lokale Pfade, Einstellungen, API-Schlüssel und OAuth-Tokens gehören nicht zum Archivtransfer.
Nur Kalender-Modus und Kalender-ID werden zusätzlich für den Gerätewechsel übertragen.

## Sicherheits- und Abbruchverhalten

- Unter 10 MiB beziehungsweise unter dem Platzbedarf für drei Kopien plus Reserve:
  Lesen bleibt möglich, Archivschreiben wird gesperrt.
- Das Google-Konto wird vor Übertragung geprüft. Konto-/Archivkonflikt ersetzt keine lokale Kopie.
- Vollständige Google-Stände werden als unveränderliche Versionen mit Vorgängerkennung
  gespeichert. Konkurrierende Zweige werden erkannt und angehalten; kein Last-writer-wins.
  Die Versionen werden derzeit nicht automatisch bereinigt.
- Ein unklarer Upload behält seine ID und seinen eingefrorenen Inhalt. Die nächste
  Prüfung erkennt einen bereits gespeicherten Stand statt erneut einen neuen anzulegen.
- Änderungen während einer Übertragung bleiben als nächste lokale Änderung ausstehend.
- Windows sichert alte TXT-Inhalte vor einer Übernahme und protokolliert eine unvollständige
  Installation für die Wiederherstellung. Android nutzt AtomicFile; eine ausstehende
  Übertragung wird vor dem Netzwerkzugriff dauerhaft gespeichert.
- Android überträgt auf einem eigenen Hintergrund-Executor. Bei Prozessbeendigung
  verbleibt der Auftrag im lokalen Zustand und wird beim nächsten Start geprüft.
  Android darf Hintergrundprozesse beenden; unbegrenzte Laufzeit wird nicht versprochen.
- Erneuter Versuch bei ausstehender Übertragung nach Netzfehlern, keine permanente
  Cloud-Abfrage im unveränderten Zustand. Alte manuelle Reserve-Ladeknöpfe bleiben.

## Kalender

Android fordert jetzt calendar.app.created und calendar.calendarlist.readonly zusätzlich
zu drive.appdata/openid/userinfo.email an. Das ist die erste direkte Android-Kalenderfassung.
Vorhandene Kalender-ID wird übernommen, kein Namenszwang und kein Ersatzkalender bei 404.
Die früheren breiten Kalenderrechte werden nicht neu angefordert. Manuell veränderte
Google-Termine werden über ihre SerKal-Signatur geschützt. Echte Google-Autorisierung
und Zugriff auf den vom Desktop angelegten Kalender müssen praktisch geprüft werden.

Archiv und Kalender sind zwei Google-Dienste ohne gemeinsame Transaktion. Ein Netzwerkfehler
kann bereits erledigte Kalenderoperationen vor dem bestätigten Archivtransfer hinterlassen;
die Wiederholung ist idempotent. Bei erkanntem Konflikt bleibt die lokale Kopie erhalten,
und der Kalenderabgleich muss geprüft werden. Keine vollständig atomare dienstübergreifende
Transaktion behaupten. Neue Android-Kalenderanlage hat eine dauerhafte Anlagemarkierung;
bei unklarem Ausgang wird kein zweiter Kalender blind angelegt.

## Übergang vom bisherigen Aufbau

Alle vier Geräte müssen die neuen Fassungen verwenden. Alte Alpha-13-/a8-Clients schreiben
weiter ihren alten Stand und gehören während des Tests geschlossen. Die ersten vollständigen
TXT-Daten werden auf dem bisherigen Quell-PC exportiert; ein bloßer Smartphone-Anzeigestand
darf nicht zum vollständigen Archiv hochgestuft werden. Danach sind alle neuen Geräte gleichwertig.
Falls noch ein alter Android-Auftrag ohne Quittung existiert, hält die Umstellung an.
Zuerst den alten Auftrag mit dem bisherigen Quell-Desktop abschließen und prüfen.

## Kurze erste Testfolge mit Kurt

1. Vorhandenes Archiv sichern. Alte laufende SerKal-Instanzen schließen. Auf dem bisherigen
   Quell-PC den CE-Zweig aktualisieren und npm start ausführen; **Alpha 15** prüfen.
   Warten bis „Bei Google gespeichert“. Zahl der Staffeln und vorhandene Notiz/Offset vergleichen.
2. Zweiten Windows-Rechner mit Alpha 15 starten. Derselbe Bestand muss geladen werden;
   dessen ehemaliger lokaler Bestand wird vorher gesichert. Keine Änderung vor dem Laden.
3. Android a11 über a8 installieren. Google-Konto und die neuen Kalenderrechte bestätigen.
   Archivbestand und eine bekannte Offset-Notiz prüfen. Bisherigen PC anschließend schließen.
4. Eine klar erkennbare Testserie mit Zukunftsterminen auf Android eintragen.
   Erst „Lokal gespeichert“, dann „Bei Google gespeichert“ abwarten. Im selben bestehenden
   Google-Kalender kontrollieren. Währenddessen suchen und zwischen Apps wechseln.
5. Laptop neu starten: Testserie vorhanden. Dort +1D ändern; bestätigten Status und
   Google-Termin prüfen. Auf dem neu gestarteten Handy muss derselbe Offset erscheinen.
6. Testserie löschen, Übertragungsstatus und Google-Kalender prüfen. Kurz Netz aus/an
   während einer weiteren Teständerung: lokal bleibt sie erhalten und wird erneut versucht.

Bei Fehlermeldung keine manuelle Löschung/Neuanlage des Kalenders und keine blind wiederholte
Serieneingabe. Android-Log ist über den Log-Knopf erreichbar; Desktop-Log enthält SYNC-Zeilen.
Für diese Phase keine Behauptung einer bereits bestandenen Vier-Geräte-Prüfung.

## Nächste Punkte

**1A direkt nach dem bestandenen Gerätetest:** geprüfte Vorab-APK samt Größe/Prüfsumme
und Einrichtungs-/Grenzenbeschreibung an Website-Chatty übergeben. Der QR-Code muss
zu einem tatsächlich verfügbaren Android-Download führen, nicht zur Windows-EXE.
Wartung und alle Zusatzfunktionen sind keine Voraussetzung für diese klar bezeichnete Vorabfassung.
Keine öffentliche Bereitstellung ohne den geprüften Stand.

**2:** Wartung und gesammelte neue-Staffeln-Liste. **3:** Desktop-/Android-Funktionsvergleich.
Google-OAuth-Verifizierung und Play-Store-Veröffentlichung bleiben gesondert offen.
Datenschutzhinweise müssen vollständige private Archivstände, Versionshistorie und direkte
Android-Kalenderrechte korrekt beschreiben; automatische Löschung noch nicht implementiert.

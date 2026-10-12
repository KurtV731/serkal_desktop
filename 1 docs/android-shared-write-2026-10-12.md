# Android 0.0.5a6 und Desktop 1.2 Alpha 10

## Funktionsumfang

Android kann eine vollständig datierte TMDB-Staffel zur Übernahme in Archiv und Kalender
anfordern. In der Archivliste ausgewählte Staffeln erhalten Notiz-/Offset-Bearbeitung und
eine bestätigte Löschaktion für die gesamte Serie samt ihren Kalenderterminen.

Der bereits konfigurierte Quell-Desktop ist der einzige Archiv-Schreiber. Android schreibt
Aufträge in Googles privaten App-Datenbereich; Desktop verarbeitet sie einzeln unter der
Archiv-Schreibsperre. Andere Desktops bleiben Leser des veröffentlichten Snapshots.
Kein separater SerKal-Server, keine neuen Google-Rechte auf Android und keine Anforderung
von calendar.events.owned/calendar.calendars. Kalenderänderungen erfolgen durch Desktop
mit seiner vorhandenen engeren Kalenderverbindung.

**Der Quell-Desktop muss laufen**, mit Google-/TMDB-Verbindung, vollständigem Archiv und
Google-Kalendermodus. Prüfung auf neue Aufträge nach Start (5 Sekunden), dann alle 30 Sekunden.
Android zeigt zunächst „Auftrag wartet“. Erst eine Desktop-Quittung meldet tatsächlichen
Abschluss. Über „Archiv laden“ werden Stand und Auftragsstatus aktualisiert. Ist Desktop
ausgeschaltet, bleiben Aufträge erhalten; das ist keine abgeschlossene Kalenderaktion.

## Schutz und Wiederholung

Aufträge enthalten Schema, UUID, Konto-ID, Quellkennung, ursprünglichen Archivzeitstempel,
Aktion und Nutzdaten. Kein OAuth-/TMDB-Schlüssel oder lokaler Pfad wird im Auftrag gespeichert.
Desktop prüft Konto, Quelle, Eingabefelder und ob der zugrunde liegende Archivstand noch aktuell
ist. Ein veralteter Auftrag wird abgewiesen: neu laden, Änderung erneut eingeben. Er ersetzt
niemals blind einen vollständigen Archivstand durch eine ältere Android-Kopie.

Android hält den aktuellen Auftrag pro Konto lokal fest. Bei unsicherer Übertragung wird
beim Prüfen dieselbe UUID verwendet. Desktop merkt sich bereits verarbeitete IDs sowie den
Inhalt; doppelte Übertragungen führen nicht zur erneuten Ausführung. Widersprüchliche Inhalte
unter derselben ID werden abgewiesen. Erfolgreiche lokale Verarbeitung wird vor Veröffentlichung
festgehalten; bei einem Veröffentlichungsfehler wird die Veröffentlichung wiederholt, ohne
die bestätigte lokale Aktion nochmals auszuführen. Lesen bleibt möglich.

Aufträge und Quittungen bleiben vorerst im privaten Google-App-Datenbereich. Keine neue
Löschfrist behaupten; Bereinigung und App-Daten-Löschfunktion sind weitere offene Arbeiten.
Quellwechsel, direktes Android-Schreiben ohne laufenden Desktop und gemeinsame Schreibrechte
aller Desktop-Installationen sind damit nicht umgesetzt. Keine Abnahme dieser Funktionen behaupten.

## Installation und Testreihe

1. Quell-Desktop schließen, CE-Zweig aktualisieren (`git pull`), `npm start`.
   Kopfzeile muss 1.2 Alpha 10 zeigen. Vorab Archiv sichern.
2. Signierte 0.0.5a6 über a5 installieren; Paket/Signatur bleiben gleich, keine Deinstallation.
3. Gleiches Google-Konto verwenden, Archiv laden. Vorhandene Einträge bleiben sichtbar.
4. Eine Testserie suchen, „Ins Archiv + Kalender“, Staffelnummer wählen, Vorschau prüfen,
   „Senden“. Erst wartende Meldung, nach Verarbeitung/„Archiv laden“ bestätigter Abschluss.
   Im Desktop-Archiv und im neuen SerKal-App-Kalender nachsehen.
5. Diese Serie rechts auswählen, Notiz `OffsetDE: +1D` senden. Datum im Google-Kalender prüfen.
   Danach Offset entfernen und erneut prüfen.
6. Testserie löschen, ausdrücklich bestätigen; Archiv und deren Kalendertermine prüfen.
7. Desktop ausschalten, eine neue Testaktion senden: muss warten. Desktop starten, dann prüfen.
8. Zwei Androidgeräte laden denselben Stand. Auf Gerät A ändern und abschließen lassen;
   auf B mit altem Stand ändern: muss veraltet melden, nichts überschreiben. B neu laden.
9. Kontowechsel: keine fremden Einträge/Auftragsquittungen übernehmen.

Automatisierte Tests sind keine Geräteabnahme. Echte Vier-Geräte-Tests und Google-Freigabe
stehen aus. Google-Antwort: erst nach passendem Video des tatsächlich vorgesehenen Stands.
Website-Chatty vor Veröffentlichung über die neuen privaten Aufträge/Quittungen informieren.

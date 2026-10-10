# Desktop 1.2 Alpha 04: engere Kalenderrechte testen

Nur Entwicklung, keine Veröffentlichung und keine automatische Cloud-Console-Änderung.
Angefordert werden calendar.calendarlist.readonly und calendar.app.created.
calendar.calendars und calendar.events.owned entfallen im CE-Zweig.

Die Kalenderliste bleibt nötig, um einen bestehenden SerKal-Kalender wiederzufinden.
Alte breitere Tokens werden für diesen Test nicht akzeptiert. include_granted_scopes
ist false. Falls Google trotzdem alte Rechte im Token liefert, meldet SerKal dies;
es nutzt diese Rechte nicht als erfolgreichen Nachweis der engeren Variante.

## Test mit Kurt
1. Archiv sichern, alte Entwicklungsinstanz schließen, CE-Zweig aktualisieren und
   npm start ausführen. Kopfzeile: 1.2 Alpha 04.
2. In Googles OAuth-Konfiguration muss calendar.app.created für den Test konfiguriert
   werden. Produktionsstatus nicht auf Testing zurückstellen. Bestehende öffentlich
   verwendete Rechte nicht voreilig entfernen: öffentliche 1.1 fordert weiterhin die
   bisherigen Rechte. Die Prüfung ist noch nicht abgeschlossen.
3. Google-Kalender erneut verbinden. Nur falls Google alte breitere Rechte weiterhin
   erteilt: SerKal-Freigabe im Google-Konto widerrufen und neu verbinden. Dieser
   Widerruf betrifft auch andere SerKal-Verbindungen desselben Projekts; deshalb
   gemeinsam durchführen. Kalender, Archiv und App-Daten dabei nicht löschen.
4. Bestehenden SerKal-Kalender testen: einen Testeintrag erstellen, in Google Kalender
   prüfen, Offset ändern und dort prüfen, Testeintrag löschen und dort prüfen.
5. Bei HTTP 403/404/sonstigem Fehler stoppt SerKal. Kein Ersatzkalender wird erstellt,
   keine Kalender-ID wird überschrieben. Das Ergebnis ist noch keine Aussage, dass
   jeder vorhandene Kalender migrierbar wäre. Ursprung/App-Projekt kann relevant sein.
6. Getrenntes frisches Testprofil/Konto ohne SerKal-Kalender: Erstellung eines neuen
   Kalenders sowie Termine anlegen, lesen, verschieben und löschen nachweisen.
   Kurts echten Kalender dafür nicht löschen oder umbenennen.

Automatisiert geprüft: passende/alte/zu breite Scopes, vorhandener zugänglicher
Kalender, Fehler 403/404/500 ohne Erstellung und ohne ID-Änderung, gespeicherte ID
bei fehlendem Listentreffer, echte erstmalige Erstellung. Reale Google-Konto-Tests
stehen aus. Kein Nachweis einer Verifizierungsfreiheit oder Google-Freigabe.

Website-Chatty: öffentliche Datenschutzerklärung beschreibt weiterhin 1.1; die
Entwicklung nun getrennt mit den engeren Kalenderrechten ergänzen, sobald Kurt
hierzu einen Auftrag gibt. Keine öffentliche 1.1-Änderung behaupten.

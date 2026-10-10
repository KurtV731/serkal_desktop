# Kalender-Testlabor – Desktop 1.2 Alpha 05

Start im CE-Zweig:
```
git pull
npm run start:calendar-lab
```
Normale Entwicklungsinstanz vorher schließen. Kopfzeile enthält TESTLABOR.

Eigenes Electron-Profil: %APPDATA%\SerKal-Calendar-Lab.
Eigenes leeres Archiv: Unterordner Archiv dieses Profils, fest im Labormodus.
Ein vorhandener lokaler TMDB-Schlüssel wird einmal aus %APPDATA%\SerKal\tmdb.json
kopiert. Normales Archiv, Einstellungen und Google-Tokens werden nicht übernommen.
Fehlt ein Schlüssel, kann er im Labor eingerichtet werden. TMDB · Google ist im
Labor deaktiviert; keine gemeinsame Schlüssel-/Archivübertragung.

Kalendername: SerKal Testlabor plus dauerhaft gespeicherte UUID.
Ein echter vorhandener Kalender namens SerKal wird nicht ausgewählt. Der neue
Testkalender wird erst beim Eintragen einer Testserie angelegt, nicht beim Start.
OAuth-Rechte bleiben calendar.app.created und calendar.calendarlist.readonly.
Das Labor verwendet denselben OAuth-Client/dasselbe Google-Projekt; es ist kein
separates Google-Konto oder Projekt. Freigaben niemals blind widerrufen, denn das
kann normale Desktop-/Handyverbindungen desselben Projekts betreffen.
Anmeldefrist im Labor 15 Minuten; Normalmodus unverändert fünf Minuten.

## Praktische Testfolge
1. Labor starten. Im leeren Archiv genau eine Serie mit zukünftigen Terminen wählen
   (z.B. The Party, falls die gelieferten Daten weiterhin 11.–13.10.2026 sind).
2. Eintragen und Google-Anmeldung abschließen. Google Kalender öffnen und den
   Kalender SerKal Testlabor … auswählen. Anzahl und Daten der Termine prüfen.
3. Dieselbe Serie um +1D verschieben. In demselben Testkalender prüfen, dass sich
   bestehende Termine verschieben und keine Duplikate entstehen.
4. Serie im Labor löschen. Prüfen, dass die Testtermine aus Google verschwinden.
5. Labor schließen und neu starten. Eine weitere Testserie eintragen; es muss
   derselbe Laborkalender verwendet werden, kein zweiter entstehen.

Originalkalender und Originalarchiv nicht löschen oder umbenennen. Laborkalender
bleibt nach Programmende bestehen; keine automatische Löschung. Bei Fehlern Log
aus dem Laborarchiv liefern. Normales npm start startet wieder das normale Profil.

Nach Kurts Log vom 10.10. funktioniert OAuth mit den engeren Rechten, aber der alte
SerKal-Kalender liefert beim Events-Zugriff HTTP404. Das beweist noch nicht die
Funktion eines neu app-erstellten Kalenders. Diese Testreihe prüft genau das.
Automatisierte Isolationstests und gesamte Testfolge bestanden; echter Google-Test
und Windows-Electron-Start bleiben praktische Prüfungen mit Kurt.

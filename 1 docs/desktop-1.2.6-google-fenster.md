# Desktop 1.2.6 – Google-Fenster und richtige Archivanzahl

Anwendungsquelle: `07903512a7ac2de4521182ec8b9a89e4cb030a86` auf `ce-desktop-1.2.6`, aufbauend auf Desktop 1.2.5 `7be1db9003ba5bd4b4ff8c5efb291595229ceb85`. Gemeinsames Archivformat/Stand 38 unverändert; Android 1.2.5/Code49 wird nicht neu gebaut.

## Korrekturen

Die Anmeldung öffnet keinen normalen Tab mehr mit `shell.openExternal`. Sie startet ein separates App-Fenster eines vollständig externen installierten Chromium-Browsers. Auf Windows wird der HTTPS-Standardbrowser verwendet, sofern Brave, Chrome, Edge oder Chromium erkannt wird; sonst ein installierter Browser aus Brave/Chrome/Edge gewählt. Es werden keine Browserprofile, Cookies oder Anmeldedaten ausgelesen und keine bestehenden Browserprozesse beendet. Ohne unterstützten Browser erscheint ein verständlicher Fehler; kein stilles Zurückfallen auf einen großen Browser-Tab. macOS-/Linux-Pfade sind enthalten, aber die praktische Freigabe betrifft Windows.

Zielgröße 640 × 780, auf die Arbeitsfläche des aktuellen Monitors mit Rand begrenzt und zentriert. Wichtig: Ein bereits laufender Browser ignoriert CLI-Größen teilweise. Deshalb startet Windows zuerst eine lokale Seite mit einer einmaligen zufälligen Fensterkennung. Ein mitgeliefertes PowerShell-/Win32-Hilfsstück sucht ausschließlich das sichtbare Fenster mit dieser Kennung und setzt dessen normalen Zustand, Position und Größe. Bei mehrdeutigem oder fehlendem Fenster wird abgebrochen. Erst danach gibt der lokale Server die Weiterleitung zu Google frei. Andere Browserfenster bleiben unangetastet. Keine eingebettete Google-Anmeldeseite, keine Remote-Debugging-Schnittstelle im Produkt.

Bei SerKal bleibt ein echter nativer Dialog mit Abbrechen verfügbar. Erfolgreiche Anmeldung, Google-Abbruch, Fehler und Timeout schließen diesen Wartezustand und holen SerKal wieder nach vorne. Der Abschluss im Browser versucht, das eigene Fenster zu schließen; verhindert der Browser das wegen seiner Verlauf-/Schließregeln, bleibt es ein normales Fenster mit X und entsprechendem Hinweis. Es wird kein fremdes Browserfenster erzwungen geschlossen. Die Google-Anmeldung bleibt auf fünf Minuten begrenzt. Eine verspätete Tokenantwort nach Abbruch wird nicht gespeichert.

Der aktive Archivweg lieferte bislang beim Verbindungsabschluss keine `count`-Eigenschaft. Er übernimmt jetzt die tatsächlich erfolgreich geladene Archivanzahl. Die Oberfläche prüft sie und zeigt im aktiven Sitzungsmodus „Archiv geladen: 92 Einträge.“ beziehungsweise den tatsächlichen Wert, auch 0. Sie behauptet damit keine bereits erfolgte Veröffentlichung auf Android. Bei Lesefehler keine erfundene Null, bei fehlender Anzahl kein `undefined`.

Unverändert: Kalenderstabilisierung aus 1.2.5, Archivformat, Menüpunkte, SerKals Hauptfensterstart. Noch nicht benannte Aktionen für die untere Leiste bleiben ein späterer Wunsch.

## Nachweise

45 Testprogramme lokal und unabhängig unter Node 24 bestanden. Darunter produktiver lokaler OAuth-Server mit PKCE/State, Erfolg, Google-Abbruch, nativer Abbruch, Tokenfehler, Browserstartfehler und Timeout; korrekte Archivzahlen 92/0 auf Deutsch/Englisch; sämtliche Kalender-/Scope-Regressionen aus 1.2.5.

Zusätzlicher echter Windows-Browsertest: zunächst ein bestehendes Browserfenster maximieren; dann den Produktionsstarter samt Win32-Positionierung ausführen. Zweites Fenster hat einen anderen Fensterhandle, normalen Zustand und begrenzte Größe; altes Fenster unverändert. Ausschließlich lokale Testseiten und ein separates temporäres Browserprofil. Der Abschluss schließt sein eigenes Fenster bei einfachem Verlauf, das vorher vorhandene Browserfenster bleibt offen. Kein Google-Konto und keine echten Archivdaten in diesem Test.

GitHub Actions: https://github.com/KurtV731/serkal_desktop/actions/runs/43852662392 — beide Jobs erfolgreich. Windows-Nachweis `desktop-1.2.6-browser-window-evidence` enthält gemessene Fenstergrenzen, Inhaltsbild und Desktopaufnahme mit nativer Fensterdekoration.

## Verbindliche Installer-Übergabe

Nur den obigen Anwendungscommit bauen, nicht main oder den ersten fehlgeschlagenen Zwischenstand 52323d7. Bewährten Installer-Bauweg `installer-desktop-1.2.5`/`ef1ab2f4a987dfd5fdafbaa4fa1be425661edc61` weiterverwenden und für **1.2.6** festschreiben: Quellpin, Versionsprüfungen, 45 Tests, Ausgabe-/Kandidatenordner, Setupname `serkal-desktop-1-2-6-setup.exe`, C#-Hülle Assembly-/Dateiversion `1.2.6.0` und eingebetteter Setupname. Die im Anwendungszweig historisch enthaltene Installerhülle nicht unverändert als aktuelle Hülle verwenden. Private OAuth-Datei und bewährtes SerKal-Symbol bleiben auf Kurts PC.

Zusätzlicher Paketcheck: `2 src/common/google-auth-window.js` **und** `google-auth-window-position.ps1` müssen aus dem gepackten ASAR lesbar sein. PowerShell liest das mitgelieferte Hilfsstück als Text über Electron-fs; keine Ausführung eines virtuellen ASAR-Dateipfades. Start-/Upgradeprüfung durchführen; Archiv erhalten; sichtbare Version 1.2.6 und korrekte Anzahl bestätigen. Anschließend echter Google-Durchlauf in Kurts Browser, separater Fensterrand/X, Rückkehr und Abbruch sowie Google-Ergebnis prüfen.

Nach bestandenem Windows-Bau Quellstand, EXE-Größe, SHA256, Version und Ergebnisse ins gemeinsame Schwarze Brett zurückmelden. Neue eindeutige Kandidatenordner verwenden. Vorhandene Public 1.2.4 sowie Kandidat 1.2.5 behalten; erst nach Kurts Abnahme exakt die geprüfte neue EXE veröffentlichen. Diese Übergabe ist Quellfreigabe zum Bau, keine Public-Freigabe und keine Behauptung einer bereits gebauten lokalen 1.2.6-EXE.

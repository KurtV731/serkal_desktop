# Automatischer gemeinsamer Archivstand – Desktop Alpha 13 / Android a7

Alle verbundenen Geräte prüfen im Hintergrund die Google-Drive-Dateiversion des gemeinsamen
Archivstands. Prüfung alle 10 Sekunden; bei unveränderter Version kein Download aller Einträge.
Die Dateiversion wird von Google bei Änderungen erhöht. Nach Änderung wird die private Archivdatei
neu geladen und die Anzeige aktualisiert, einschließlich Löschungen. Keine echte Push-Nachricht.
Die Desktop-Oberfläche prüft die bereits im Backend erfasste Kennung lokal alle 2 Sekunden.

Andere Desktop-Installationen zeigen jetzt den gemeinsamen Google-Stand statt ihren abweichenden
lokalen TXT-Bestand. Ihre lokalen Dateien werden dabei nicht verändert oder als neue Wahrheit
hochgeladen. Der Quell-Desktop behält sein lokales Archiv als einzige Schreibquelle. Andere
Desktop-Installationen melden beim Schreiben, dass Änderungen dort noch nicht unterstützt werden;
Schreiben erfolgt am Quell-Desktop oder durch Android-Aufträge. Diese Beschränkung ist erforderlich,
um einen veralteten lokalen Bestand nicht wieder einzubringen. Allgemeiner Quellwechsel und
Schreibaufträge weiterer Desktops sind noch offen.

Desktop: Bei offenen Archivänderungen wird automatisches Neuladen verschoben und der neue Stand
angekündigt. Nach Speichern und Ende laufender Aktionen wird aktualisiert. Eine aktive Seriensuche
wird beim automatischen Nachladen nicht zurückgesetzt. Die manuelle Neuladen-Funktion bleibt als
Reserve erhalten. Fehler/Verbindungspause erhalten den zuletzt bestätigten Stand; die nächste
erfolgreiche Prüfung holt auf. Windows-Livetest noch ausstehend.

Android: Prüfung nur bei sichtbarer App; nach Rückkehr erneute Prüfung. Offene Eingabedialoge,
laufende Aufträge und Ladevorgänge verschieben die Aktualisierung. Kommt eine laufende Anfrage
während einer geöffneten Bearbeitung zurück, wird ihre Kennung verworfen und später erneut geprüft;
die Eingabe wird nicht überschrieben. Wartende Aufträge werden ebenfalls automatisch auf Quittung
geprüft. Archiv-laden bleibt Reserve. Keine neue Google-Berechtigung erforderlich.

Test: Auf allen Geräten gleiches Google-Konto verbinden. Eine Testserie am Quell-PC löschen.
Innerhalb etwa 10–20 Sekunden nach erfolgreicher Veröffentlichung soll sie ohne Knopfdruck auf
Laptop, Pixel und Tablet verschwinden. Kein Rückschreiben durch den Laptop. Bei geöffnetem
Notizdialog am Handy muss der Text erhalten bleiben; nach Schließen wird aktualisiert. Dasselbe
mit ungespeicherter Desktop-Notiz prüfen. App pausieren, Archiv ändern, zurückkehren: Stand muss
aufholen. Netzwerk unterbrechen und wiederherstellen: letzten Stand behalten, anschließend aufholen.
18 Desktop-Testskripte einschließlich unveränderter Revision, Löschung und Kontotrennung bestanden.
Gerätetest ist weiterhin erforderlich; Google-Verifizierungsverfahren bleibt separat offen.

# Offset-Kalenderkorrektur – 04.10.2026

Beim Speichern einer Offset-Notiz wurde bisher nur das Archiv geändert. Google-Termine blieben am bisherigen Tag. Save edits synchronisiert jetzt geänderte aktive Termindaten über die vorhandene Kalender-Synchronisierung, bevor die Archivdatei geschrieben wird. Manuell in Google geänderte Termine bleiben geschützt; ein Konflikt oder Übertragungsfehler wird als Fehler gemeldet.

Beim Entfernen einer bestehenden Offset-Steuerzeile werden startDE, datesDE und offsetDE geleert und die Originaltermine wieder verwendet. Freie Notizen ohne bisherigen Offset ändern keine Kalenderdaten. Die englische Statusanzeige verwendet wieder ✅ statt „done“.

Validierung: alle zehn bisherigen Testgruppen, Syntaxprüfung und diff check bestanden. Zusätzlich offset-calendar-sync.test.js: +1D, +2D, -2D, Offset entfernen, freie Notiz, Übertragungsfehler und manuell geschützter Kalender. Google-Aufrufe werden im Zusatztest ersetzt; der reale Google-Abgleich muss mit Kurts Installation geprüft werden.

Testablauf: Entwicklung schließen, Änderungen holen, npm start. Reacher S04: Offset +1D speichern → Google neu laden; +2D speichern → erneut vergleichen; Offset-Zeile entfernen → Originaldatum prüfen. Erwartet für den ersten Termin: 13.08., 14.08., 12.08.2026. Bestehende direkt in Google veränderte Termine können einen Schutzkonflikt melden. Bei Netzwerkfehlern können bereits ausgeführte Google-Operationen nicht atomar zurückgenommen werden; die Archivänderung wird nicht als erfolgreich gespeichert.

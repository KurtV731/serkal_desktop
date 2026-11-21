# Desktop-Wartungstest 1.2.7-wartung.2

Entwicklungsstand für Kurts praktische Abnahme. Basis ist die freigegebene Desktop-Version 1.2.6. Archivstand 38.

1. Laufendes SerKal regulär beenden.
2. Die Datei `serkal-wartung-test.cmd` herunterladen und doppelklicken. Der erste Start lädt die Entwicklungsfassung und ihre Abhängigkeiten. Sie verwendet das vorhandene SerKal-Profil, Archiv und den konfigurierten Kalender.
3. **Wartung** starten. Im Ergebnis zwischen **Bei dieser Wartung geändert** und **Wann geht’s weiter?** wechseln. Nach einem weiteren Lauf beide datierten Berichte vergleichen. Ältere Berichte ohne gespeicherte Laufzeit zeigen einen entsprechenden Hinweis.
4. In der Archivliste den Serienstatus prüfen. Die erste Zuordnung erfolgt bei der Wartung. Ein bekannter Staffelstart erscheint im Ausblick und wird nach dem bestehenden Kalenderablauf als Starttermin geführt. Eine angekündigte Staffel ohne Startdatum erscheint mit „Termin offen“.

Für den Testbau gilt der normale Speicherablauf von SerKal. Die private OAuth-Datei kann wie bei Desktop 1.2.6 unter `C:\serkal_dev\serkal_private\google_oauth_client.json` liegen. Der Teststarter installiert kein neues Windows-Setup. Installer und öffentliche Freigabe folgen separat.

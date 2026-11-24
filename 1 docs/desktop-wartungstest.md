# Desktop-Wartungstest 1.2.7-wartung.5

Entwicklungsstand für Kurts praktische Abnahme. Basis ist die freigegebene Desktop-Version 1.2.6. Archivstand 38.

1. Laufendes SerKal regulär beenden.
2. Die Datei `serkal-wartung-test.cmd` herunterladen und doppelklicken. Der erste Start lädt die Entwicklungsfassung und ihre Abhängigkeiten. Sie verwendet das vorhandene SerKal-Profil, Archiv und den konfigurierten Kalender.
3. **Wartung** starten. Im Ergebnis zwischen **Bei dieser Wartung geändert** und **Wann geht’s weiter?** wechseln. Nach einem weiteren Lauf beide datierten Berichte vergleichen. Ältere Berichte ohne gespeicherte Laufzeit zeigen einen entsprechenden Hinweis.
4. In der Archivliste den Serienstatus prüfen. Die erste Zuordnung erfolgt bei der Wartung. Ein bekannter Staffelstart erscheint im Ausblick und wird nach dem bestehenden Kalenderablauf als Starttermin geführt. Eine angekündigte Staffel ohne Startdatum erscheint mit „Termin offen“.

Für den Testbau gilt der normale Speicherablauf von SerKal. Die private OAuth-Datei kann wie bei Desktop 1.2.6 unter `C:\serkal_dev\serkal_private\google_oauth_client.json` liegen. Der Teststarter installiert kein neues Windows-Setup. Installer und öffentliche Freigabe folgen separat.

## Intensiv Analyse

Unter **Menü → Intensiv Analyse** prüft SerKal die beiden Serienjunkies-Jahreslisten ab 2008 einmal je Jahr. Datum, Vermerk und Quellenlink des jüngsten eindeutig zuordenbaren Treffers werden im Archiv hinterlegt. Ein fehlender Treffer ändert keine bestehenden Vermerke. Falls Listen fehlen, zeigt SerKal den unvollständigen Durchlauf an und lässt die bisherigen Vermerke stehen.

Der Vermerk lässt sich über seine Schaltfläche in der Archivliste bearbeiten und wie andere Archivänderungen speichern. Manuelle Werte gelten für die vorhandenen Staffeln der Serie. Über **Automatisch (TMDB und Serienjunkies)** lässt sich wieder die gespeicherte Quellenmeldung anzeigen. Der Quellenlink öffnet die Meldung oder die entsprechende Jahresliste.

Im Archiv und im Ausblick sind ↻ (verlängert), ✕ (abgesetzt), ⚑ (beendet) und ? (offen) anklickbar. Ein automatisch ermittelter Status erscheint zurückhaltend, ein bestätigter Status kräftig. Nach einer Bestätigung als abgesetzt oder beendet verschwindet die Serie aus dem Ausblick. Gelbe Archiveinträge zeigen einen zusätzlichen Planungshinweis nur bei konkret belegten weiteren Staffeln außerhalb des Archivs.

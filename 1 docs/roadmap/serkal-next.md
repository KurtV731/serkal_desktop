# SerKal – Reihenfolge nach der Arbeitsunterbrechung

Stand: 14.10.2026 · CE · Arbeitsstand: ../checkpoints/2026-10-14/ARBEITSSTAND.md

## Kleine Einzelaufträge

1. Arbeitsstand sichern und prüfen: dieser Dokumentationsauftrag. Windows Alpha 15 gespeichert,
   22 Testskripte bestanden; Android a11-CI mit 21 Tests bestanden. Vier lokale Reständerungen
   getrennt als .pending gesichert. Keine neue installierbare Android-APK freigegeben.
2. Ausschließlich Windows: Alpha 15 prüfen und erste vollständige Archivübernahme mit Kurt testen.
3. Ausschließlich Android: Reständerungen prüfen, passende neue APK bauen/signieren/verifizieren.
4. Gerätewechsel: PC → Handy, Handy → Laptop, anschließend Netz-/Prozessabbruch und Wiederaufnahme.
5. **Ursprünglicher Punkt 1A:** geprüfte Vorab-APK auf der Website anbieten, mit direktem
   Android-Downloadknopf und QR-Code. Dies geschieht vor Wartung und vollständiger Funktionsgleichheit.
6. Wartung mit eigener gesammelter Vorausschauliste reparieren/fertigstellen und anschließend
   dieselbe Fachlogik auf Android verfügbar machen.
7. Desktop und Android vergleichen, fehlende Funktionen in kleinen Aufgaben ergänzen;
   ausdrücklich Löschen, Log-Anzeige, gut lesbare Version und Desktop-ähnliche Optik.

## Verbindliches neues Archivmodell

Ein Nutzer mit wechselnden Geräten: beim Start vollständiges Google-Archiv laden, lokal
arbeiten, nach echten Archivänderungen im Hintergrund synchronisieren. Beim Nachschauen,
Suchen und Ausprobieren kein ständiger Archivtransfer. Status unterscheidet lokal gespeichert,
ausstehend/laufend und bei Google bestätigt. Zusätzlich „Jetzt synchronisieren“.
Bei Platzknappheit Lesen erlauben und Schreiben sperren. Unterbrechung erhält lokale Daten;
älterer Transfer darf neuere lokale Änderung nicht als erledigt behandeln.

Damit wird der frühere feste Quell-PC ersetzt; der Laptop braucht danach keine besondere
Hauptrechnerrolle. Nur die Erstübernahme erfolgt kontrolliert vom bisherigen Quell-PC.

## Weitere Wünsche

- Streaming-Anbieter mit Länderbezug anzeigen.
- Großes Mittelfeld mit nützlichen Angaben und eventuell Trailern ergänzen.
- Filme nach der abgeschlossenen 1.2 ergänzen; Kino-/Streaming-/Kaufstarts unterscheiden.
- Google-OAuth-Verifizierung: Veröffentlichungsstand/Rechte abgleichen, neues Video und Antwort offen.
- Play Store separat vorbereiten: Entwicklerkonto, Produktionssignatur/OAuth, AAB, Storeangaben,
  Datenschutz/Datensicherheit und die für das Konto erforderliche Testgruppe. Website-APK ist
  eine eigene vorherige Etappe und ersetzt weder Play-Freigabe noch OAuth-Prüfung.

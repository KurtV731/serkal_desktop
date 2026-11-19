# Android-Testfassung 1.2.7 / versionCode51 – Tastaturbedienung

Auftrag Kurt19.11.2026: Claudias in1.2.6 zweimal gemeldetes Tastaturproblem bearbeiten und geprüfte Neufassung an SerKal Installer3 übergeben. Kein Ausschluss eines Testers und keine Gboard-/Pixel-Voraussetzung.

## Änderung

- Sichtbare Schaltfläche „Tastatur schließen“ / „Close keyboard“ links oben, solange die Bildschirmtastatur geöffnet ist; auch bei schmaler Ansicht erreichbar. Sie verwirft keine Eingabe und startet keine Suche.
- Tastatur-Lupe und Suchen-Schaltfläche verwenden denselben expliziten Suchweg: Fokus aus Eingabefeld nehmen, Tastatur über AndroidX-Insetsteuerung plus InputMethodManager-Rückfall ausblenden, Suche starten. Enter wird konsumiert, ohne auf Loslassen doppelt zu suchen.
- Automatische Vorschlagsuche beim Tippen bleibt unverändert und schließt die Tastatur nicht.
- Bestehende Edge-to-Edge-/Tablet-Anpassung, Google-/TMDB-Einrichtung, Schlüsselablage und Kalenderstabilisierung erhalten. Paket de.serkal.android.preview.v005 und Archivstand38 unverändert.
- Android-Zweig ce-android-keyboard-1.2.7, auf geprüftem Code50-Stand2043721004a6bbba4faf1454a366c1c9e9d90608. **Nur Android-AAB daraus übernehmen; keinen Windows-Installer aus diesem Zweig bauen. Desktop-Public1.2.6 bleibt unverändert.**

## Grenzen

Die Code-Lücke in1.2.6 ist nachgewiesen: IME_ACTION_SEARCH wurde angezeigt, aber kein eigener EditorAction-Handler und kein gezieltes Tastaturschließen implementiert. Claudias konkrete Geräteursache ist nicht reproduziert; Handymodell, Tastatur-App und Androidversion noch unbekannt. Emulatorerfolg ersetzt ihre praktische Abnahme nicht.

**Philipps Google-Anmeldehänger und die zugehörigen Diagnoselücken bleiben ausdrücklich offen.** Diese Fassung enthält dafür keinen behaupteten Fix. Keine neuen Google-Rechte oder zurückgesetzten Archive als Tastaturreparatur.

## Installer3

Nur die fertige geprüfte unsignedAAB signieren, nicht neu bauen. Neuen Code51-Signierstarter mit exakt dokumentiertem Eingabehash/Größe/Quellstand verwenden, keinen Code50-Starter unverändert wiederverwenden. Alias serkal-preview und bekanntes Uploadzertifikat erhalten; Signatur, Zertifikat, unveränderte Nutzdaten und neuen signierten Hash belegen. Play-App-Signierzertifikat für OAuth bleibt getrennt.

Bestehenden **geschlossenen Alpha-Test** aktualisieren; kein neuer Kanal, Paket, Teilnehmerlink oder neue Testerliste. CE lädt nichts in Play hoch. Kurt wünscht für diese Erstnutzerabnahme Deinstallation/Neuinstallation; mögliche lokale ungespeicherte Daten und erneute Schlüssel-/Kontoeinrichtung berücksichtigen. Eine Deinstallation hebt bereits erteilte Google-OAuth-Rechte nicht automatisch auf; Wiederinstallation allein beweist keine vollständig neue OAuth-Zustimmung.

## Versionshinweise zum Einfügen

DE: Die Bildschirmtastatur lässt sich jetzt mit „Tastatur schließen“ ausblenden. Lupe und „Suchen“ führen die Suche aus und schließen die Tastatur. Beim Weitertippen bleibt sie geöffnet. Bekannte einzelne Google-Anmeldeprobleme sind weiterhin in Untersuchung.

EN: The on-screen keyboard can now be dismissed with “Close keyboard”. The keyboard search action and Search button submit the search and dismiss the keyboard. Typing suggestions keep it open. Individual Google sign-in issues remain under investigation.

Der Testhinweis stammt von Claudia. Öffentliche Namensnennung vor Veröffentlichung mit Kurt abstimmen; keine privaten Kontaktdaten verwenden.

## Geprüfter Bau und Übergabedatei

- Quell-/Teststand: **47f4e2240b089f8cc700f6706af388f2baed6a28**.
- [Regression und Releasebau](https://github.com/KurtV731/serkal_desktop/actions/runs/44600191771): **98 Tests, 0 Fehler, 0 Fehlschläge, 0 übersprungen**.
- CI-Artefakt14567503243: SerKal-Android-1.2.7-code51-unsigned-aab. Zusätzlich unter play-build-output/ in Sicherungscommit f4c5ba3ecdd4693966af711c354df778002afc9e.
- Übergabedatei: **SerKal-Android-1.2.7-code51-unsigned.aab**, **2496284 Bytes**.
- SHA256: **1eda94714c08c93265c78783bd010b6f290e57db93368bcc783d666d8ad138fa**.
- [Datei für Kurt/Installer](https://chatgpt.com/library?file_id=libfile_bab92dc04b0c81919f89a04c56a5610b&account_id=personal).
- CE hat CI-Prüfsumme verglichen, ZIP vollständig geprüft (141 Einträge) und das echte AAB-Manifest ausgelesen: Version1.2.7, Code51, bestehendes Paket, resizeableActivity=true, screenOrientation=unspecified. Release ist unsigniert.
- [Native Darstellung und Tastatur](https://github.com/KurtV731/serkal_desktop/actions/runs/44600191921): Android15/Pixel7 Job135829208638 und Android16/PixelTablet Job135829208914 beide erfolgreich, jeweils Instrumentation OK(1test). Artefakte14568330553 und14568205957.
- Beide Emulatortests öffnen die echte Bildschirmtastatur für jeden der drei Wege erneut und verlangen danach IME-Höhe0, Fokus außerhalb der Eingabe, erhaltenen Suchtext, ausgeblendete Schließen-Schaltfläche und wieder sichtbare Suchen-Schaltfläche. Bestehende Systemleisten-/Größenwechselprüfungen bleiben enthalten.
- Zwei neue Robolectric-Tests prüfen: explizite Suche schließt ohne Textverlust; reines Schließen startet keine Suche; automatische Suche hält Tastatur/Fokus; Schließen-Schaltfläche folgt IME-Sichtbarkeit.
- CE hat Vorher-/Nachheraufnahmen auf beiden Emulatoren angesehen. Bei sehr hoher Tastatur im Querformat können Suchaktionen unten zeitweise keinen Platz haben; die neue Schaltfläche bleibt links oben erreichbar und gibt die volle Suchfläche frei.
- Keine reale TMDB-/Google-Netzwerkanfrage als Teil dieser Tastaturtests; kein Play-Upload und keine private Signierung durch CE.

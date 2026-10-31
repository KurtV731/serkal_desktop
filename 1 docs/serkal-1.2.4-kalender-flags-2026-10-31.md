# SerKal 1.2.4 – Kalender nur für geänderte Staffeln

Stand: 31.10.2026. Gemeinsamer Stand 38, Android versionCode 47. Noch keine Veröffentlichung oder Geräteabnahme behauptet.

## Anlass

Kurts Log aus 1.2.2 belegt nach einer Aufnahme und Löschung 269 bzw. 248 geplante Kalenderoperationen, darunter zahlreiche PUTs für andere Serien. Der ganze Kalender wurde gegen die Archivprojektion verglichen. 1.2.3 bremste diese Anfragen, begrenzte aber ihren Umfang nicht. Der Rückstand wurde inzwischen durch wiederholtes Beenden vollständig abgearbeitet; Neustart mit85 Einträgen ruhig. Das ist kein Nachweis einer bereits reparierten Änderungslogik.

## Umgesetzte Regel

Beim Laden wird der kalenderrelevante Sollinhalt pro TMDB-Serie/Staffel festgehalten. Verglichen werden die tatsächlich geplanten Kalenderereignisse mit Titel, Datum, Beschreibung/Anbieter und Ankündigungen. Reine Gesehen-Änderungen, freie Notizen ohne Kalenderwirkung, andere Dateireihenfolge und neue Revisionsnummern erzeugen keine Kalender-Markierung.

Beim normalen Abschluss wird die Menge aus tatsächlich geänderten, hinzugefügten oder entfernten Staffeln und bereits offenen Markierungen verwendet. Der vorhandene Kalenderplaner darf außerhalb dieser Menge keine Termine anlegen, ändern oder löschen. Bestehende alte Abweichungen anderer Serien bleiben bei diesem normalen Abschluss unangetastet. Eine Wartung, die tatsächlich kalenderrelevante Daten vieler Staffeln ändert, markiert entsprechend mehrere Staffeln; sie erzwingt nicht blind eine Vollreparatur.

Kalendereinträge werden zum Vergleich weiterhin gelesen; begrenzt sind die Schreiboperationen. Die Markierungen sind kleine lokale Dateien im jeweiligen SerKal-Profil, nach Benutzerkonto/Archiv getrennt. Sie enthalten nur offene TMDB-/Staffelkennungen, keine zweite Arbeitsarchivkopie und keine neue Revisionsverwaltung. Sie bleiben auf dem Gerät erhalten, dessen Kalenderabschluss aussteht.

## Wann Flags gelöscht werden

Vor dem ersten Kalender-Schreibvorgang wird die tatsächlich offene Menge dauerhaft gespeichert. Hat eine Staffel mehrere Operationen, bleibt ihre Markierung bis zur letzten erfolgreichen Operation erhalten. Ein bereits passend vorgefundener Stand gilt nach erfolgreichem Lesen ebenfalls als erledigt. Nach jedem vollständig erledigten Staffelbereich wird die Restmenge gespeichert. Nach Fehler/Neustart werden nur offene Bereiche erneut geplant; vorhandene erfolgreiche Einzelereignisse werden beim Vergleich berücksichtigt. Bei späteren lokalen Änderungen wird die neue Menge mit den offenen Bereichen vereinigt. Ein Kalender-only-Retry lädt das Archiv nicht erneut hoch.

Ein echter Wechsel des Kalenderziels verlangt einen vollständigen Abgleich dieses neuen Ziels. Alte 1.2.3-Pending-Dateien ohne Staffelkennungen können ihren Umfang nicht nachträglich rekonstruieren: bis zur ersten erfolgreichen Planung gilt dort einmalig der bisherige volle Abgleich; danach wird die präzise Restmenge gespeichert. Das darf nicht als normale Zwei-Serien-Änderung verheimlicht werden. Kurts fertig abgearbeitete 1.2.2-Sitzung hat diese neue alte Pending-Datei nicht erzeugt.

Dauerhafte Ankündigungskarten bleiben nach der bisherigen Produktregel erhalten; scoped Serienlöschung ist keine automatische Löschung dieser Karten. Fremde persönliche Termine bleiben außerhalb des verwalteten Planers.

## Protokoll

Kalenderpläne zeigen betroffene Bereiche und Anlegen/Ändern/Löschen-Zahlen; Android führt Ankündigungsprüfungen zusätzlich separat auf. Einzeloperationen nennen ihre Art, den TMDB-/Staffelbereich und bei Updates die abweichenden Feldnamen. Keine vollständigen privaten Ereignisinhalte in diesen neuen Diagnosezeilen. Vollständige Google-Fehler bleiben wie zuvor erhalten. Fortschritt zählt erfolgreiche Operationen, keine fehlgeschlagenen Versuche. Vorhandene Anfragebremse/Backoff und begrenzte Abschlussdauer bleiben aktiv.

## Quellen und Prüfungen

- Desktop-Bauquelle: 52aafa693ec519de0e45bc235dcc870a1e9eec80.
- Android-Bauquelle: aad44b929401d3c85c7bb9ec43405208249f53bb.
- PR #18 und #19 nach erfolgreichen Prüfungen in die regulären Desktop-/Androidzweige übernommen. Kein zweites APK durch den Merge erzeugt.
- Desktop42 Testskripte lokal und CI41241477501 erfolgreich: https://github.com/KurtV731/serkal_desktop/actions/runs/41241477501 .
- Android erster Prüflauf41241482596 erfolgreich. Finaler Prüflauf/Bau41241688044:85 Tests,0 Fehler,0 Fehlschläge,0 übersprungen; assembleRelease erfolgreich. https://github.com/KurtV731/serkal_desktop/actions/runs/41241688044 .
- Neuer gezielter Test:150 Serien mit300 vorhandenen, absichtlich abweichenden Kalenderereignissen. Eine Aufnahme und Löschung mit je zwei Terminen ergeben genau vier zulässige Schreiboperationen, null PUTs für dieunbeteiligten Bereiche. Die konkreten Anzahlwerte beschreiben die synthetischen Testdaten, nicht eine behauptete Messung an Kurts echtem Kalender.
- Weiter geprüft: unverändert/Gesehen ohne neue Kalenderarbeit, Ankündigungsbereiche, Kalenderzielwechsel, partielle Fehler mit Erledigungsmarkierungen, Neustart mit nur offener Restmenge, kein zusätzlicher Archivupload beim Kalender-Retry.

## Lieferung und Grenzen

Neue Produktversion1.2.4, gemeinsamer Stand38, Android47. Neue Windows-BAT serkal-1-2-4-ersatz-bauen.bat verwendet den bewährten privaten OAuth-/Icon-/Forge-/Squirrel-/Ein-Datei-Weg und prüft42 Tests. Ausgabe C:\\ppd\\serkal\\veroeffentlichungen\\1.2.4. CE hat hier keine Windows-EXE gebaut. Signiertes APK nachfolgend geprüft und geliefert. Keine vorhandenen Artefakte verändern; vor Gerätewechsel alle beteiligten Geräte auf denselben Stand aktualisieren.

Offen bleibt ausdrücklich der Calendar-Button mit Browserkonto/Add-calendar-Dialog. Diese Korrektur ändert diesen Link nicht. Kein erneuter öffentlicher Website-Upload und keine neue Freigabe aus dieser Quellkorrektur ableiten.

Changelog: Begrenzter Kalenderabgleich und präzise Erledigungsmarkierungen **(Thanks to Kurt)**; beibehaltene Anfragebremse und verständlicher Kalender-/Archiv-Abschluss **(Thanks to VelcroFist)**.

## Geprüfte Android-Datei

**038-SerKal-Android-1.2.4.apk**, 2294171 Byte, Version1.2.4/code47.
SHA-256: **1fc7f7faea8ba100d0b09455206b03808ff3be00d43c28cb555f1aa023ff976a**.
Bisheriges Zertifikat, Signatur v2/v3 gültig; Paket und Manifest-Metadaten überprüft, Manifest vor/nach Signieren byteidentisch. Kurt direkt bereitgestellt. Keine Signaturgeheimnisse im Repository. Datei nicht erneut bauen/signieren oder unter derselben Nummer verändern.

Nächster konkreter Schritt für Installer: die neue BAT auf Kurts Windows-Bauplatz ausführen, EXE/Hash nachweisen und als eindeutig bezeichnete Testfassung liefern. Die aktuelle CE-Umgebung hat keine Windows-EXE erzeugt. Vor einer öffentlichen Ablösung der bisherigen Fassung muss der konkrete Installer praktisch abgenommen werden.

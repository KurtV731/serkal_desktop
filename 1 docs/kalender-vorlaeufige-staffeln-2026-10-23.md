# Kalenderzugriff und angekündigte Staffeln – 23.10.2026

## Anlass und Ursache

Kurts Pixel lehnte Ahsoka S02 ab, weil askForSeason für jede Folge ein Datum verlangte. Der bisherige Kalenderknopf befand sich am unteren Rand der verschiebbaren Archivspalte und war im Nutzertest nicht erreichbar. Desktop hing sämtliche gemeinsamen Ankündigungen an jede Staffelzeile: S01 zeigte deshalb neben 22.08.2023 zusätzlich die S02-Ankündigung. Das ist kein Beleg für eine neue Ausstrahlung von S01.

Der Screenshot zeigt zusätzlich einen gespeicherten S02-Zeilenstart 20.01.2027 und eine Ankündigung am 19.01.2027. Aus dem Screenshot ist ein Offset oder der genaue ursprüngliche Datensatz nicht feststellbar. Bestehende Original-/DE-Termine werden daher nicht pauschal umgeschrieben.

## Umsetzung

- Android: zusätzlicher Kalenderknopf im festen Kopf außerhalb ZoomPanLayout. Bisheriger Knopf unten bleibt ebenfalls vorhanden. Keine neuen Google-Berechtigungen.
- Android-Eingabe akzeptiert bekannten Staffelstart trotz fehlender Folgetermine. Folgenzahl aus Staffelübersicht/Details bleibt erhalten, zum Beispiel acht. Bestätigungsdialog kennzeichnet die Ankündigung.
- Neue vorläufige Staffel besitzt eigene Zeile [S02], announcementOnly=1, Startdatum und leere Episodenterminliste. Ankündigung mit dauerhafter Historienkarte im bestehenden Kalender; keine erfundenen E01–E08-Termine.
- Bestehende vollständige Staffeln werden durch unvollständige Eingaben nicht ersetzt. Frühere Staffeltermine, Notizen, Schutzmarkierungen bleiben erhalten.
- Vollständige spätere Episodendaten lösen den vorläufigen Zustand bei Eingabe/Wartung ab; dauerhafte Ankündigungskarte bleibt. Einzelne datierte Folge bei acht erwarteten Folgen reicht dafür nicht.
- Desktop kann diesen Android-Zustand einlesen und überspringt ihn bei regulären Episodenkalenderterminen. Staffel gehört nur zum Titel [Sxx]. Datumsspalte zeigt keine angehängten Staffellisten; vorläufige eigene Zeilen erhalten (?).
- Android entfernt ebenfalls gemeinsame Ankündigungssuffixe von anderen Staffelzeilen.

## Verifizierter Stand

Desktop 1.2 Alpha 24, Zweig serkal-0.0.5-archiv-start: 4a3179a800413a07767291e8007878ba5ed5685b. 31 Testprogramme bestanden; zusätzliche Prüfungen für TXT-Zustand, keine falschen Episodeneinträge, S01/S02-Anzeige und unvollständige spätere Wartungsdaten. Abhängigkeiten unverändert; package/package-lock Versionsangabe angepasst.

Android 0.0.5a21 / versionCode29, Zweig android-preview-0.0.5: 63faec7cebfda4a5a1e311323bf96af09279b7d3. Actions 39919433453: 47 JUnit-Tests, 0 Fehler, 0 Fehlschläge, 0 übersprungen. APK-Manifest unabhängig geprüft: de.serkal.android.preview.v005, 0.0.5a21, Code29. V2/V3 signiert, ursprüngliches Zertifikat 7e24902dd88ed80fb84e0ffc3b188a1e0c88e30cb2a84247a03cf4ba416667eb.

Signierte Testdatei: 0.0.5a21-serkal-android.apk, 2887431 Bytes, SHA256 9798819e8adda27a0e55bbf348590ea5763fbd926069c645694c9c61e02421d6, Library-ID libfile_68c5ee876b1c8191bfd660cf0c3676bb. Update über a20/a19 vorgesehen; nicht deinstallieren. Noch keine reale Geräteabnahme und keine öffentliche Veröffentlichung.

## Prüfreihenfolge

1. Desktop zuerst auf Alpha24 aktualisieren (Entwicklungszweig oder daraus neu gebauter Installer). Bestehende Daten behalten. Bei installiertem Desktop ist der neue Installer durch Installer-Chatty noch zu bauen; kein fertiger Windows-Installer durch diese CE-Lieferung behauptet.
2. APK a21 direkt über bestehende App installieren. Oben Kalender antippen: richtiger Google-Kalender/richtiges Konto erreichbar, zurück führt zur App.
3. Angekündigte Staffel mit bekanntem Start und acht noch undatierten Folgen aufnehmen: Bestätigung als Ankündigung, eigene [S02]-Zeile, eine Ankündigungskarte, keine erfundenen Einzeltermine.
4. S01-Termine und Gesehen-Zustand unverändert. Rechts keine S02-Ankündigung neben S01. Bereits vorhandene vollständige S02 nicht löschen, nur um diesen Test zu erzwingen.
5. Synchronisation bestätigen lassen, auf zweitem Gerät laden. Eine Zeile pro Staffel, dauerhafte Karte ohne Dublette. Ein erneuter Wartungslauf ohne Datenänderung erzeugt keine weitere Karte.

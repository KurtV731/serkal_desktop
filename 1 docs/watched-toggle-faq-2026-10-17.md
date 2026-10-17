# Gesehen-Häkchen – Fehlerkorrektur und FAQ-Text

17.10.2026. Meldung VelcroFist: Rot lässt sich grün schalten, grün nicht wieder rot. Ursache bestätigt: Desktop-UI bot den Klick nur für Status 2/3 und setzte immer seen=1. Status 4 hatte keinen Rückweg.

CE Alpha 18: Häkchen für Status 2/3/4 interaktiv, seen wechselt 0/1; nach Rücknahme wird Status aus den tatsächlichen Terminen neu berechnet. Bei vergangener Staffel wieder ungesehen, bei laufender wieder laufend, bei zukünftiger wieder geplant. Notizen, IDs und Termine unverändert. Änderungen müssen wie bisher mit „Änderungen speichern“ / „Save edits“ gespeichert werden. Tooltips und zugängliche Buttonrolle/aria-pressed/Tastatur Enter/Leertaste ergänzt.

27 Testprogramme und vier Inline-Skripte geprüft. Neuer Test für beide Schaltrichtungen, Rücknahme bei zukünftigen Terminen und Erhalt von ID/Notiz. Noch kein neuer Windows-Installer gebaut. Bestehenden Alpha-17.1-Installer nicht unter derselben Versionsnummer ersetzen. Android a13 kann bereits in beide Richtungen schalten und benötigt dafür kein neues Paket.

## FAQ Deutsch – zur Übernahme durch Website-Chatty

**Was bedeuten die farbigen Zeichen im Archiv?**

Grünes Häkchen: Diese Staffel wurde ausdrücklich als gesehen markiert. Rotes Häkchen: Die Termine liegen zurück, aber die Staffel ist noch nicht als gesehen bestätigt. Gelber Punkt: Die Staffel kommt laut hinterlegtem Starttermin noch. SerKal erkennt nicht automatisch, was du tatsächlich gesehen hast. Die zeitliche Einordnung stammt aus den Terminen; den Gesehen-Status setzt du selbst. Ein gelber Punkt allein bedeutet nicht, dass TMDB gerade eine neue Staffel angekündigt hat.

Mit der korrigierten Desktop-Fassung kannst du das Häkchen in beide Richtungen umschalten. Danach „Änderungen speichern“ wählen. Beim Zurücknehmen einer Markierung ergibt sich der Status wieder aus den Terminen. Auf Android werden solche Änderungen direkt lokal gespeichert und anschließend synchronisiert.

## FAQ English – for Website-Chatty

**What do the coloured archive symbols mean?**

A green tick means you explicitly marked the season as watched. A red tick means its scheduled dates have passed, but you have not marked it as watched. A yellow dot means the season is still upcoming according to its stored start date. SerKal does not automatically know what you have watched: dates determine the timing status, and you set the watched status yourself. A yellow dot alone does not mean that TMDB has just announced a new season.

In the corrected desktop version, click the tick to switch in either direction, then choose “Save edits”. Removing the watched mark restores the appropriate date-based status. On Android, edits are saved locally straight away and synchronized afterwards.

/*
===============================================================================
 SERKAL Desktop – Installer-Einstieg
-------------------------------------------------------------------------------
 Aufgabe: Installer-spezifische Windows-Integration, ohne den CE-Hauptcode
          main.js zu veraendern.
===============================================================================
*/

const { app } = require("electron");

// Der Endnutzer soll serkal://start ohne Registry-Handarbeit verwenden koennen.
// Bei jedem installierten Start wird die Zuordnung zugleich auf den aktuell
// installierten EXE-Pfad aktualisiert (wichtig nach Squirrel-Updates).
if (process.platform === "win32" && app.isPackaged) {
    try {
        const registered = app.setAsDefaultProtocolClient("serkal");
        if (!registered) {
            console.error("SERKAL Protokoll serkal:// konnte nicht registriert werden.");
        }
    } catch (err) {
        console.error("SERKAL Protokollregistrierung:", err);
    }
}

// Squirrel-Installations-/Update-Ereignisse sauber behandeln. Die
// Protokollregistrierung steht absichtlich davor, damit sie bereits beim
// Setup bzw. Update gesetzt/erneuert werden kann.
if (require("electron-squirrel-startup")) {
    app.quit();
} else {
    require("./main.js");
}

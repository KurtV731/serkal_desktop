/*
===============================================================================
 SERKAL Desktop – Installer-Einstieg
-------------------------------------------------------------------------------
 Aufgabe: Installer-spezifische Windows-Integration, ohne den CE-Hauptcode
          main.js zu veraendern.
===============================================================================
*/

const path = require("node:path");
const fs = require("node:fs");
const { spawnSync } = require("node:child_process");
const { app } = require("electron");

function configureBundledGoogleOauth_() {
    if (!app.isPackaged) return;

    // Die Hersteller-OAuth-Konfiguration wird beim Installerbau als interne
    // Ressource neben app.asar abgelegt. Der Endnutzer muss weder eine JSON-
    // Datei beschaffen noch Google Cloud oeffnen.
    process.env.SERKAL_GOOGLE_OAUTH_FILE = path.join(
        process.resourcesPath,
        "google_oauth_client.json"
    );
}

function serkalProtocolExe_() {
    const currentExe = process.execPath;
    const currentDir = path.dirname(currentExe);
    const parentDir = path.dirname(currentDir);

    // Squirrel startet normalerweise die EXE aus app-<version>. Fuer die
    // Protokollzuordnung verwenden wir bevorzugt die stabile Stub-EXE eine
    // Ebene hoeher, damit Updates den Registry-Pfad nicht ungueltig machen.
    if (/^app-/i.test(path.basename(currentDir))) {
        const stableExe = path.join(parentDir, path.basename(currentExe));
        if (fs.existsSync(stableExe)) return stableExe;
    }

    return currentExe;
}

function registerSerkalProtocol_() {
    if (process.platform !== "win32" || !app.isPackaged) return;

    const exe = serkalProtocolExe_();
    const key = "HKCU\\Software\\Classes\\serkal";
    const commandKey = key + "\\shell\\open\\command";
    const command = "\"" + exe + "\" \"%1\"";

    const commands = [
        ["add", key, "/ve", "/d", "URL:SerKal Desktop Protocol", "/f"],
        ["add", key, "/v", "URL Protocol", "/t", "REG_SZ", "/d", "", "/f"],
        ["add", commandKey, "/ve", "/d", command, "/f"]
    ];

    for (const args of commands) {
        const result = spawnSync("reg.exe", args, { windowsHide:true, encoding:"utf8" });
        if (result.status !== 0) {
            console.error("SERKAL Protokollregistrierung fehlgeschlagen:", result.stderr || result.stdout || args.join(" "));
            return;
        }
    }
}

// Squirrel-Ereignisse zuerst sauber abfangen. Bei normalem installierten Start
// werden danach interne Herstellerressourcen und die Protokollzuordnung gesetzt.
if (require("electron-squirrel-startup")) {
    app.quit();
} else {
    configureBundledGoogleOauth_();
    registerSerkalProtocol_();
    require("./main.js");
}

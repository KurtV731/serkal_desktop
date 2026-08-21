/* SERKAL Desktop – sichere Renderer-Bruecke
   Versionsquelle: package.json (keine manuell gepflegte sichtbare Versionsnummer) */
const path = require("node:path");
const { contextBridge, ipcRenderer } = require("electron");

let SERKAL_VERSION = "0.0.0";
try {
    const packageInfo = require(path.join(__dirname, "..", "..", "package.json"));
    SERKAL_VERSION = String(packageInfo && packageInfo.version || SERKAL_VERSION);
} catch (_e) {}

function applyDesktopIdentity_() {
    try {
        document.title = "SERKAL Desktop " + SERKAL_VERSION;

        /* Die alte Apps-Script-UI hatte eine eigene Build-Zeile.
           Im Desktop ist sie doppelt, weil Electron bereits die Titelleiste hat.
           Deshalb nicht nur verstecken, sondern aus dem DOM entfernen. */
        const topBuildBar = document.querySelector(".topBuildBar");
        if (topBuildBar) topBuildBar.remove();
    } catch (_e) {}
}

window.addEventListener("DOMContentLoaded", applyDesktopIdentity_);
window.addEventListener("load", applyDesktopIdentity_);

contextBridge.exposeInMainWorld("serkal", {
    name:"SERKAL Desktop",
    version:SERKAL_VERSION,
    build:SERKAL_VERSION,
    settings:{
        get:()=>ipcRenderer.invoke("serkal:settings:get"),
        save:(settings)=>ipcRenderer.invoke("serkal:settings:save",settings)
    },
    tmdb:{
        status:()=>ipcRenderer.invoke("serkal:tmdb:status"),
        saveKey:(apiKey)=>ipcRenderer.invoke("serkal:tmdb:saveKey",apiKey),
        test:()=>ipcRenderer.invoke("serkal:tmdb:test"),
        searchTv:(query,lang,options)=>ipcRenderer.invoke("serkal:tmdb:searchTv",query,lang,options||{})
    },
    archive:{
        load:()=>ipcRenderer.invoke("serkal:archive:load"),
        insert:(payload)=>ipcRenderer.invoke("serkal:archive:insert",payload||{})
    },
    calendar:{ open:(settings)=>ipcRenderer.invoke("serkal:calendar:open",settings) }
});

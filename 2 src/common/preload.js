/* SERKAL Desktop – sichere Renderer-Bruecke
   Versionsquelle: package.json (keine manuell gepflegte sichtbare Versionsnummer) */
const path = require("node:path");
const { contextBridge, ipcRenderer } = require("electron");

let SERKAL_VERSION = "0.0.0";
try {
    const packageInfo = require(path.join(__dirname, "..", "..", "package.json"));
    SERKAL_VERSION = String(packageInfo && packageInfo.version || SERKAL_VERSION);
} catch (_e) {}

window.addEventListener("DOMContentLoaded", () => {
    try {
        document.title = "SERKAL Desktop " + SERKAL_VERSION;

        const style = document.createElement("style");
        style.textContent = ".topBuildBar{display:none !important;}";
        document.head.appendChild(style);
    } catch (_e) {}
});

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
    calendar:{ open:(settings)=>ipcRenderer.invoke("serkal:calendar:open",settings) }
});

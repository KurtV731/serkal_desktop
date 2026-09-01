/* SERKAL Desktop – sichere Renderer-Bruecke
   Versionsquelle: package.json (keine manuell gepflegte sichtbare Versionsnummer) */
const { contextBridge, ipcRenderer } = require("electron");

/* Sandboxed Preloads duerfen keine beliebigen Node-Module wie node:path laden.
   Die Versionsangabe wird fuer diese Baustellenversion bewusst lokal gehalten. */
const SERKAL_VERSION = "0.0.5";
const SERKAL_CHANNEL = process.argv.includes("--serkal-installed") ? "INSTALLIERT" : "ENTWICKLUNG";
const SERKAL_WINDOW_TITLE = "SERKAL Desktop " + SERKAL_VERSION + " – " + SERKAL_CHANNEL;

function applyDesktopIdentity_() {
    try {
        document.title = SERKAL_WINDOW_TITLE;

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
    channel:SERKAL_CHANNEL,
    settings:{
        get:()=>ipcRenderer.invoke("serkal:settings:get"),
        save:(settings)=>ipcRenderer.invoke("serkal:settings:save",settings)
    },
    tmdb:{
        status:()=>ipcRenderer.invoke("serkal:tmdb:status"),
        saveKey:(apiKey)=>ipcRenderer.invoke("serkal:tmdb:saveKey",apiKey),
        test:()=>ipcRenderer.invoke("serkal:tmdb:test"),
        searchTv:(query,lang,options)=>ipcRenderer.invoke("serkal:tmdb:searchTv",query,lang,options||{}),
        poster:(id,lang)=>ipcRenderer.invoke("serkal:tmdb:poster",id,lang||"de")
    },
    archive:{
        load:()=>ipcRenderer.invoke("serkal:archive:load"),
        insert:(payload)=>ipcRenderer.invoke("serkal:archive:insert",payload||{}),
        saveChanges:(dirtyMap)=>ipcRenderer.invoke("serkal:archive:saveChanges",dirtyMap||{}),
        deleteSeries:(payload)=>ipcRenderer.invoke("serkal:archive:deleteSeries",payload||{})
    },
    log:{
        write:(level,tag,text,object)=>ipcRenderer.invoke("serkal:log:write",level,tag,text,object),
        read:(maxLines,day)=>ipcRenderer.invoke("serkal:log:read",maxLines,day),
        saveText:(day,text)=>ipcRenderer.invoke("serkal:log:saveText",day,text),
        clear:(day)=>ipcRenderer.invoke("serkal:log:clear",day)
    },
    calendar:{
        open:(settings)=>ipcRenderer.invoke("serkal:calendar:open",settings),
        insertSeason:(payload)=>ipcRenderer.invoke("serkal:calendar:insertSeason",payload||{}),
        createIcs:(payload)=>ipcRenderer.invoke("serkal:calendar:createIcs",payload||{})
    },
    maintenance:{
        status:()=>ipcRenderer.invoke("serkal:maintenance:status"),
        run:()=>ipcRenderer.invoke("serkal:maintenance:run")
    }
});

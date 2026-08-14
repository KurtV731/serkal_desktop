/* SERKAL Desktop 0.0.4 – sichere Renderer-Bruecke */
const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("serkal", {
    name:"SERKAL Desktop", version:"0.0.4", build:"0004",
    settings:{
        get:()=>ipcRenderer.invoke("serkal:settings:get"),
        save:(settings)=>ipcRenderer.invoke("serkal:settings:save",settings)
    },
    tmdb:{
        status:()=>ipcRenderer.invoke("serkal:tmdb:status"),
        saveKey:(apiKey)=>ipcRenderer.invoke("serkal:tmdb:saveKey",apiKey),
        test:()=>ipcRenderer.invoke("serkal:tmdb:test"),
        searchTv:(query)=>ipcRenderer.invoke("serkal:tmdb:searchTv",query)
    },
    calendar:{ open:(settings)=>ipcRenderer.invoke("serkal:calendar:open",settings) }
});

/* SERKAL Desktop 0.0.3 – sichere Renderer-Brücke */
const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("serkal", {
    name:"SERKAL Desktop", version:"0.0.3", build:"0003",
    settings:{
        get:()=>ipcRenderer.invoke("serkal:settings:get"),
        save:(settings)=>ipcRenderer.invoke("serkal:settings:save",settings)
    },
    calendar:{ open:(settings)=>ipcRenderer.invoke("serkal:calendar:open",settings) }
});

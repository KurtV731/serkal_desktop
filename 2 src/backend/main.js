/*
===============================================================================
 SERKAL Desktop
-------------------------------------------------------------------------------
 Datei      : main.js
 Version    : 0.0.4
 Aufgabe    : Startet Electron, verwaltet lokale Grundeinstellungen,
              oeffnet den Kalender und stellt den TMDB-Grundanschluss bereit.
===============================================================================
*/

const path = require("node:path");
const fs = require("node:fs");
const { app, BrowserWindow, ipcMain, shell } = require("electron");

const DEFAULT_SETTINGS = {
    setupDone: false,
    calendar: { mode: "", googleCalendarId: "" }
};

function settingsPath_() { return path.join(app.getPath("userData"), "settings.json"); }
function tmdbConfigPath_() { return path.join(app.getPath("userData"), "tmdb.json"); }

function normalizeSettings_(raw) {
    const out = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
    if (raw && typeof raw === "object") {
        out.setupDone = raw.setupDone === true;
        if (raw.calendar && typeof raw.calendar === "object") {
            const mode = String(raw.calendar.mode || "").toLowerCase();
            if (["google", "ics", "none", "auto"].includes(mode)) out.calendar.mode = mode;
            out.calendar.googleCalendarId = String(raw.calendar.googleCalendarId || "").trim();
        }
    }
    return out;
}

function readSettings_() {
    try {
        const file = settingsPath_();
        if (!fs.existsSync(file)) return normalizeSettings_(null);
        return normalizeSettings_(JSON.parse(fs.readFileSync(file, "utf8")));
    } catch (err) {
        console.error("SERKAL settings lesen:", err);
        return normalizeSettings_(null);
    }
}

function writeSettings_(settings) {
    const normalized = normalizeSettings_(settings);
    const file = settingsPath_();
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(normalized, null, 2) + "\n", "utf8");
    return normalized;
}

function readTmdbKey_() {
    try {
        const file = tmdbConfigPath_();
        if (!fs.existsSync(file)) return "";
        const raw = JSON.parse(fs.readFileSync(file, "utf8"));
        return String(raw && raw.apiKey || "").trim();
    } catch (err) {
        console.error("SERKAL TMDB-Konfiguration lesen:", err);
        return "";
    }
}

function writeTmdbKey_(apiKey) {
    const key = String(apiKey || "").trim();
    if (!key) throw new Error("TMDB API-Key fehlt.");
    const file = tmdbConfigPath_();
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify({ apiKey:key }, null, 2) + "\n", "utf8");
    return { ok:true, configured:true };
}

async function tmdbRequest_(pathname, params) {
    const apiKey = readTmdbKey_();
    if (!apiKey) return { ok:false, code:"NO_KEY", message:"TMDB API-Key ist noch nicht eingerichtet." };
    const url = new URL("https://api.themoviedb.org/3" + pathname);
    url.searchParams.set("api_key", apiKey);
    url.searchParams.set("language", "de-DE");
    for (const [key, value] of Object.entries(params || {})) {
        if (value !== undefined && value !== null && String(value) !== "") url.searchParams.set(key, String(value));
    }
    try {
        const response = await fetch(url, { headers:{ accept:"application/json" } });
        const data = await response.json().catch(() => null);
        if (!response.ok) return { ok:false, code:"TMDB_HTTP", status:response.status, message:(data && data.status_message) || "TMDB-Anfrage fehlgeschlagen." };
        return { ok:true, data };
    } catch (err) {
        return { ok:false, code:"NETWORK", message:String(err && err.message || err) };
    }
}

function googleCalendarUrl_(calendarId) {
    const id = String(calendarId || "").trim();
    if (!id) return "https://calendar.google.com/";
    return "https://calendar.google.com/calendar/u/0/r?cid=" + encodeURIComponent(id);
}

function installIpc_() {
    ipcMain.handle("serkal:settings:get", () => readSettings_());
    ipcMain.handle("serkal:settings:save", (_event, settings) => writeSettings_(settings));
    ipcMain.handle("serkal:tmdb:status", () => ({ configured:!!readTmdbKey_(), configFile:tmdbConfigPath_() }));
    ipcMain.handle("serkal:tmdb:saveKey", (_event, apiKey) => writeTmdbKey_(apiKey));
    ipcMain.handle("serkal:tmdb:test", async () => {
        const res = await tmdbRequest_("/configuration", {});
        return res.ok ? { ok:true, message:"TMDB-Verbindung funktioniert." } : res;
    });
    ipcMain.handle("serkal:tmdb:searchTv", async (_event, query) => {
        const q = String(query || "").trim();
        if (!q) return { ok:false, code:"NO_QUERY", message:"Serientitel fehlt." };
        const res = await tmdbRequest_("/search/tv", { query:q, include_adult:"false", page:"1" });
        if (!res.ok) return res;
        const results = Array.isArray(res.data && res.data.results) ? res.data.results.slice(0, 10).map(x => ({
            id:x.id,
            name:x.name || "",
            originalName:x.original_name || "",
            firstAirDate:x.first_air_date || "",
            overview:x.overview || "",
            posterPath:x.poster_path || ""
        })) : [];
        return { ok:true, results };
    });
    ipcMain.handle("serkal:calendar:open", async (_event, settingsFromUi) => {
        const settings = settingsFromUi ? normalizeSettings_(settingsFromUi) : readSettings_();
        let mode = settings.calendar.mode;
        if (mode === "auto") mode = "ics";
        if (mode === "none") return { ok:false, action:"none", message:"Kalender ist in SERKAL deaktiviert." };
        if (mode === "ics") return { ok:false, action:"ics", message:"ICS ist ausgewaehlt. Der eigentliche ICS-Export folgt in einer spaeteren SERKAL-Version." };
        if (mode === "google") {
            const url = googleCalendarUrl_(settings.calendar.googleCalendarId);
            await shell.openExternal(url);
            return { ok:true, action:"google", url };
        }
        return { ok:false, action:"setup", message:"Kalender ist noch nicht eingerichtet." };
    });
}

function installTmdbTestButton_(hauptfenster) {
    const js = `
(() => {
  if (document.getElementById('serkalTmdb004Test')) return;
  const btn = document.createElement('button');
  btn.id = 'serkalTmdb004Test';
  btn.textContent = 'TMDB 0.0.4 TEST';
  btn.title = 'TMDB-Key einrichten und aktuelle Titelsuche direkt ueber TMDB testen';
  Object.assign(btn.style, {
    position:'fixed', right:'18px', top:'18px', zIndex:'2147483647',
    padding:'10px 14px', borderRadius:'12px', border:'1px solid #5b6cff',
    background:'#eef0ff', fontWeight:'800', cursor:'pointer', boxShadow:'0 4px 14px rgba(0,0,0,.18)'
  });
  btn.addEventListener('click', async () => {
    try {
      const status = await window.serkal.tmdb.status();
      if (!status.configured) {
        const key = window.prompt('TMDB API-Key einmalig lokal eingeben:');
        if (!key) return;
        await window.serkal.tmdb.saveKey(key);
      }
      const test = await window.serkal.tmdb.test();
      if (!test.ok) { window.alert('TMDB-Verbindung fehlgeschlagen: ' + (test.message || test.code || 'unbekannt')); return; }
      const titleEl = document.getElementById('inpTitle') || document.querySelector('input[type="text"]');
      const query = titleEl ? String(titleEl.value || '').trim() : '';
      if (!query) { window.alert('TMDB-Verbindung funktioniert. Bitte links einen Serientitel eingeben und den TMDB-Test erneut klicken.'); return; }
      const res = await window.serkal.tmdb.searchTv(query);
      if (!res.ok) { window.alert('TMDB-Suche fehlgeschlagen: ' + (res.message || res.code || 'unbekannt')); return; }
      const rows = (res.results || []).slice(0, 5).map((x,i) => (i+1) + '. ' + (x.name || x.originalName || '?') + (x.firstAirDate ? ' (' + x.firstAirDate.slice(0,4) + ')' : '') + '  [TMDB ' + x.id + ']');
      window.alert(rows.length ? 'TMDB-Treffer fuer "' + query + '":\\n\\n' + rows.join('\\n') : 'TMDB: kein Treffer fuer "' + query + '".');
    } catch (e) {
      window.alert('TMDB-0.0.4-Testfehler: ' + (e && e.message ? e.message : String(e)));
    }
  });
  document.body.appendChild(btn);
})();`;
    hauptfenster.webContents.executeJavaScript(js).catch(err => console.error("SERKAL TMDB-Testbutton:", err));
}

function erstelleHauptfenster() {
    const hauptfenster = new BrowserWindow({
        width:1280, height:820, minWidth:900, minHeight:600, show:false,
        title:"SERKAL Desktop 0.0.4", backgroundColor:"#f6f3ff",
        webPreferences:{ preload:path.join(__dirname,"..","common","preload.js"), contextIsolation:true, nodeIntegration:false }
    });
    hauptfenster.loadFile(path.join(__dirname,"..","frontend","index.html"));
    hauptfenster.once("ready-to-show",()=>{
        hauptfenster.maximize();
        hauptfenster.show();
        installTmdbTestButton_(hauptfenster);
    });
    hauptfenster.setMenuBarVisibility(false);
}

app.whenReady().then(()=>{
    installIpc_(); erstelleHauptfenster();
    app.on("activate",()=>{ if (BrowserWindow.getAllWindows().length===0) erstelleHauptfenster(); });
});
app.on("window-all-closed",()=>{ if (process.platform!=="darwin") app.quit(); });

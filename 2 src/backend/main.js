/*
===============================================================================
 SERKAL Desktop
-------------------------------------------------------------------------------
 Datei      : main.js
 Version    : 0.0.4
 Aufgabe    : Startet Electron, verwaltet lokale Grundeinstellungen,
              oeffnet den Kalender und stellt die TMDB-Anbindung bereit.
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
    if (!apiKey) return { ok:false, code:"TMDB_KEY_MISSING", message:"TMDB ist noch nicht eingerichtet. Bitte zuerst den TMDB API-Key eintragen." };

    const url = new URL("https://api.themoviedb.org/3" + pathname);
    url.searchParams.set("api_key", apiKey);
    for (const [key, value] of Object.entries(params || {})) {
        if (value !== undefined && value !== null && String(value) !== "") url.searchParams.set(key, String(value));
    }

    try {
        const response = await fetch(url, { headers:{ accept:"application/json" } });
        const data = await response.json().catch(() => null);
        if (!response.ok) {
            const code = (response.status === 401) ? "TMDB_KEY_INVALID" : "TMDB_HTTP";
            return { ok:false, code, status:response.status, message:(data && data.status_message) || "TMDB-Anfrage fehlgeschlagen." };
        }
        return { ok:true, data };
    } catch (err) {
        return { ok:false, code:"NETWORK", message:"Keine Verbindung zu TMDB. Bitte Internetverbindung prüfen." };
    }
}

function tmdbLang_(lang) {
    return String(lang || "").toLowerCase().startsWith("en") ? "en-US" : "de-DE";
}

async function tmdbSearchTv_(query, lang) {
    const q = String(query || "").trim();
    if (!q) return { ok:false, code:"NO_QUERY", message:"Serientitel fehlt." };
    const res = await tmdbRequest_("/search/tv", {
        query:q,
        language:tmdbLang_(lang),
        include_adult:"false",
        page:"1"
    });
    if (!res.ok) return res;

    const results = Array.isArray(res.data && res.data.results) ? res.data.results.slice(0, 10).map(x => ({
        id:x.id,
        tmdbId:x.id,
        name:x.name || "",
        title:x.name || "",
        originalName:x.original_name || "",
        original_name:x.original_name || "",
        firstAirDate:x.first_air_date || "",
        first_air_date:x.first_air_date || "",
        year:String(x.first_air_date || "").slice(0,4),
        overview:x.overview || "",
        descDE:tmdbLang_(lang) === "de-DE" ? (x.overview || "") : "",
        descEN:tmdbLang_(lang) === "en-US" ? (x.overview || "") : "",
        posterPath:x.poster_path || "",
        poster_path:x.poster_path || ""
    })) : [];
    return { ok:true, results };
}

function googleCalendarUrl_(calendarId) {
    const id = String(calendarId || "").trim();
    if (!id) return "https://calendar.google.com/";
    return "https://calendar.google.com/calendar/u/0/r?cid=" + encodeURIComponent(id);
}

function installIpc_() {
    ipcMain.handle("serkal:settings:get", () => readSettings_());
    ipcMain.handle("serkal:settings:save", (_event, settings) => writeSettings_(settings));
    ipcMain.handle("serkal:tmdb:status", () => ({ configured:!!readTmdbKey_() }));
    ipcMain.handle("serkal:tmdb:saveKey", (_event, apiKey) => writeTmdbKey_(apiKey));
    ipcMain.handle("serkal:tmdb:test", async () => {
        const res = await tmdbRequest_("/configuration", {});
        return res.ok ? { ok:true, message:"TMDB-Verbindung funktioniert." } : res;
    });
    ipcMain.handle("serkal:tmdb:searchTv", async (_event, query, lang) => tmdbSearchTv_(query, lang));
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

function installDesktopTmdbBridge_(hauptfenster) {
    const js = `
(() => {
  function askTmdbKey_() {
    return new Promise((resolve) => {
      const old = document.getElementById('skTmdbKeyOverlay');
      if (old) old.remove();

      const overlay = document.createElement('div');
      overlay.id = 'skTmdbKeyOverlay';
      overlay.className = 'skDialogOverlay sk-open';
      overlay.setAttribute('aria-hidden', 'false');
      overlay.innerHTML = '<section class="skDialogBox" role="dialog" aria-modal="true" data-kind="info">' +
        '<div class="skDialogHead"><div class="skDialogIcon">🔑</div><h2 class="skDialogTitle">TMDB einrichten</h2></div>' +
        '<div class="skDialogText">Für die Seriensuche benötigt SERKAL einmalig Ihren TMDB API-Key.<br><br>' +
        '<input id="skTmdbKeyInput" type="text" autocomplete="off" spellcheck="false" placeholder="TMDB API-Key" style="width:100%;box-sizing:border-box;padding:10px 12px;border-radius:10px;border:1px solid #cbd5e1;font:inherit">' +
        '<div id="skTmdbKeyError" style="display:none;margin-top:10px;color:#b91c1c;font-weight:700"></div></div>' +
        '<div class="skDialogActions"><button id="skTmdbKeyCancel" type="button">Abbrechen</button><button id="skTmdbKeySave" class="skDialogPrimary" type="button">Speichern und suchen</button></div>' +
        '</section>';
      document.body.appendChild(overlay);

      const input = document.getElementById('skTmdbKeyInput');
      const error = document.getElementById('skTmdbKeyError');
      const finish = (value) => { overlay.remove(); resolve(value); };
      document.getElementById('skTmdbKeyCancel').onclick = () => finish('');
      document.getElementById('skTmdbKeySave').onclick = async () => {
        const key = String(input.value || '').trim();
        if (!key) { error.textContent='Bitte TMDB API-Key eingeben.'; error.style.display='block'; input.focus(); return; }
        try {
          await window.serkal.tmdb.saveKey(key);
          const test = await window.serkal.tmdb.test();
          if (!test.ok) {
            error.textContent = test.code === 'NETWORK' ? 'Keine Verbindung zu TMDB. Bitte Internetverbindung prüfen.' : 'Der TMDB API-Key funktioniert nicht. Bitte prüfen.';
            error.style.display='block'; input.focus(); input.select(); return;
          }
          finish(key);
        } catch (e) {
          error.textContent='TMDB-Einrichtung fehlgeschlagen.'; error.style.display='block';
        }
      };
      input.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') document.getElementById('skTmdbKeySave').click(); });
      setTimeout(() => input.focus(), 50);
    });
  }

  function runner_() {
    let success = function(){};
    let failure = function(){};
    const chain = {
      withSuccessHandler(fn) { success = typeof fn === 'function' ? fn : success; return chain; },
      withFailureHandler(fn) { failure = typeof fn === 'function' ? fn : failure; return chain; },
      async apiSucheSerieKomplett(query, lang, options) {
        try {
          let res = await window.serkal.tmdb.searchTv(query, lang);
          if (!res.ok && res.code === 'TMDB_KEY_MISSING') {
            const key = await askTmdbKey_();
            if (!key) { failure({message:'TMDB ist noch nicht eingerichtet. Bitte zuerst den TMDB API-Key eintragen.'}); return; }
            res = await window.serkal.tmdb.searchTv(query, lang);
          }
          if (!res.ok) { failure({message:res.message || 'TMDB-Suche fehlgeschlagen.', code:res.code}); return; }
          let rows = Array.isArray(res.results) ? res.results : [];
          const year = options && Number(options.yearOverride || 0);
          if (year) rows = rows.filter(x => Number(x.year || 0) === year);
          success(rows);
        } catch (e) { failure({message:(e && e.message) ? e.message : String(e)}); }
      }
    };
    return chain;
  }

  const oldGoogle = window.google || {};
  const oldScript = oldGoogle.script || {};
  const desktopRun = new Proxy({}, { get(_target, prop) {
    const chain = runner_();
    if (prop in chain) return chain[prop].bind(chain);
    const oldRun = oldScript.run;
    if (oldRun && oldRun[prop]) return oldRun[prop];
    return undefined;
  }});
  window.google = Object.assign({}, oldGoogle, { script:Object.assign({}, oldScript, { run:desktopRun }) });
})();`;
    return hauptfenster.webContents.executeJavaScript(js);
}

function erstelleHauptfenster() {
    const hauptfenster = new BrowserWindow({
        width:1280, height:820, minWidth:900, minHeight:600, show:false,
        title:"SERKAL Desktop 0.0.4", backgroundColor:"#f6f3ff",
        webPreferences:{ preload:path.join(__dirname,"..","common","preload.js"), contextIsolation:true, nodeIntegration:false }
    });
    hauptfenster.loadFile(path.join(__dirname,"..","frontend","index.html"));
    hauptfenster.once("ready-to-show", async ()=>{
        try { await installDesktopTmdbBridge_(hauptfenster); }
        catch (err) { console.error("SERKAL Desktop TMDB-Bridge:", err); }
        hauptfenster.maximize();
        hauptfenster.show();
    });
    hauptfenster.setMenuBarVisibility(false);
}

app.whenReady().then(()=>{
    installIpc_(); erstelleHauptfenster();
    app.on("activate",()=>{ if (BrowserWindow.getAllWindows().length===0) erstelleHauptfenster(); });
});
app.on("window-all-closed",()=>{ if (process.platform!=="darwin") app.quit(); });

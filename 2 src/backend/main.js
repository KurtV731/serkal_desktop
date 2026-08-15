/*
===============================================================================
 SERKAL Desktop
-------------------------------------------------------------------------------
 Datei      : main.js
 Version    : 0.0.4
 Aufgabe    : Startet Electron, verwaltet lokale Grundeinstellungen,
              oeffnet den Kalender und stellt die TMDB-/SERKAL-Suche bereit.
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
    } catch (_err) {
        return { ok:false, code:"NETWORK", message:"Keine Verbindung zu TMDB. Bitte Internetverbindung prüfen." };
    }
}

function tmdbLang_(lang) {
    return String(lang || "").toLowerCase().startsWith("en") ? "en-US" : "de-DE";
}

function normTitle_(value) {
    return String(value || "")
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, " ")
        .trim();
}

function parseYear_(value) {
    const m = String(value == null ? "" : value).trim().match(/^(\d{4})$/);
    return m ? m[1] : "";
}

function yearFromDate_(value) {
    const m = String(value || "").match(/^(\d{4})/);
    return m ? m[1] : "";
}

function parseSeason_(value) {
    const m = String(value == null ? "" : value).trim().match(/^(?:S)?\s*0*([1-9]\d*)$/i);
    if (!m) return null;
    const n = Number(m[1]);
    return Number.isFinite(n) && n > 0 ? n : null;
}

function parseIdMode_(value) {
    const m = String(value || "").trim().match(/^(?:#\s*)?(\d{5,8})\s*(?:[,;\s]+(?:S)?\s*0*([1-9]\d*))?\s*$/i);
    if (!m) return null;
    const id = Number(m[1]);
    if (!Number.isFinite(id) || id <= 0) return null;
    const season = m[2] ? Number(m[2]) : null;
    return { id, season:(season && Number.isFinite(season) && season > 0) ? season : null };
}

function pad2_(n) { return String(Number(n || 0)).padStart(2, "0"); }

function dateInt_(value) {
    const m = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
    return m ? Number(m[1] + m[2] + m[3]) : 0;
}

function todayInt_() {
    const d = new Date();
    return Number(String(d.getFullYear()) + String(d.getMonth()+1).padStart(2,"0") + String(d.getDate()).padStart(2,"0"));
}

async function tmdbTvDetails_(id, lang) {
    return tmdbRequest_("/tv/" + encodeURIComponent(String(id)), { language:tmdbLang_(lang) });
}

async function tmdbSeasonDetails_(id, seasonNumber, lang) {
    return tmdbRequest_("/tv/" + encodeURIComponent(String(id)) + "/season/" + encodeURIComponent(String(seasonNumber)), { language:tmdbLang_(lang) });
}

function analyseSeason_(seasonJson) {
    const eps = seasonJson && Array.isArray(seasonJson.episodes) ? seasonJson.episodes : [];
    const episodeDates = eps.map(e => e && e.air_date ? String(e.air_date) : "").filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d));
    return {
        episodeCount:eps.length,
        seasonStart:episodeDates.length ? episodeDates[0] : "",
        episodeDates
    };
}

function seasonEpisodeCount_(seasons, seasonNumber) {
    const row = (Array.isArray(seasons) ? seasons : []).find(s => s && Number(s.season_number) === Number(seasonNumber));
    return row ? Number(row.episode_count || 0) : 0;
}

async function pickSeasonWithDates_(tvId, seasons, seasonOverride, lang) {
    const seasonMeta = (Array.isArray(seasons) ? seasons : [])
        .map(s => ({
            seasonNumber:Number(s && s.season_number || 0),
            episodeCount:Number(s && s.episode_count || 0),
            airDate:String(s && s.air_date || "")
        }))
        .filter(s => Number.isFinite(s.seasonNumber) && s.seasonNumber > 0)
        .sort((a,b) => a.seasonNumber - b.seasonNumber);

    const newestSeason = seasonMeta.length ? seasonMeta[seasonMeta.length-1].seasonNumber : 1;
    const requested = Number(seasonOverride || 0);
    const scanList = requested > 0 ? [requested] : seasonMeta.slice().sort((a,b)=>b.seasonNumber-a.seasonNumber).map(s=>s.seasonNumber);
    if (!scanList.length) scanList.push(newestSeason);

    let picked = null;
    for (const sn of scanList) {
        const seasonRes = await tmdbSeasonDetails_(tvId, sn, lang);
        if (!seasonRes.ok) continue;
        const a = analyseSeason_(seasonRes.data || {});
        if (a.episodeDates.length) {
            picked = {
                seasonNumber:sn,
                seasonLabel:"S" + pad2_(sn),
                episodeCount:a.episodeCount || seasonEpisodeCount_(seasons, sn),
                seasonStart:a.seasonStart || a.episodeDates[0] || "",
                episodeDates:a.episodeDates,
                dateFlag:"",
                placeholderStart:""
            };
            break;
        }
    }

    if (!picked) {
        const target = requested > 0 ? requested : newestSeason;
        const placeholderStart = String(new Date().getFullYear()+1) + "-01-01";
        picked = {
            seasonNumber:target,
            seasonLabel:"S" + pad2_(target),
            episodeCount:seasonEpisodeCount_(seasons, target),
            seasonStart:placeholderStart,
            episodeDates:[],
            dateFlag:"ANNOUNCED",
            placeholderStart
        };
    }

    const futureSeasons = seasonMeta
        .filter(s => s.seasonNumber > Number(picked.seasonNumber || 0))
        .map(s => ({
            seasonNumber:s.seasonNumber,
            seasonLabel:"S" + pad2_(s.seasonNumber),
            status:"ANNOUNCED",
            episodeCount:Number.isFinite(s.episodeCount) ? s.episodeCount : 0,
            airDate:s.airDate || ""
        }));

    picked.maxSeasonNumber = newestSeason;
    picked.futureSeasonsCount = futureSeasons.length;
    picked.futureSeasons = futureSeasons;
    picked.operatingSeasonNumber = picked.seasonNumber;
    return picked;
}

function rankForDates_(seasonStart, episodeDates) {
    const today = todayInt_();
    let nextFuture = 0;
    let lastSeen = 0;
    for (const date of Array.isArray(episodeDates) ? episodeDates : []) {
        const di = dateInt_(date);
        if (!di) continue;
        if (di >= today && (!nextFuture || di < nextFuture)) nextFuture = di;
        if (di > lastSeen) lastSeen = di;
    }
    const startInt = dateInt_(seasonStart);
    if (!nextFuture && startInt && startInt >= today) nextFuture = startInt;
    if (!lastSeen && startInt) lastSeen = startInt;
    return { group:nextFuture ? 0 : 1, key:nextFuture ? nextFuture : (99999999-lastSeen) };
}

async function buildHit_(id, fallback, detDE, detEN, seasonOverride, searchLang) {
    const seasons = detDE && Array.isArray(detDE.seasons) && detDE.seasons.length ? detDE.seasons : (detEN && Array.isArray(detEN.seasons) ? detEN.seasons : []);
    const pick = await pickSeasonWithDates_(id, seasons, seasonOverride, searchLang);
    const rank = rankForDates_(pick.seasonStart, pick.episodeDates);
    return {
        _rankGroup:rank.group,
        _rankKey:rank.key,
        id,
        tmdbId:id,
        name:(detDE && detDE.name) || (detEN && detEN.name) || (fallback && fallback.name) || "—",
        title:(detDE && detDE.name) || (detEN && detEN.name) || (fallback && fallback.name) || "—",
        originalName:(detEN && detEN.original_name) || (detDE && detDE.original_name) || (fallback && fallback.original_name) || "",
        year:yearFromDate_((detDE && detDE.first_air_date) || (detEN && detEN.first_air_date) || (fallback && fallback.first_air_date) || ""),
        posterPath:(detDE && detDE.poster_path) || (detEN && detEN.poster_path) || (fallback && fallback.poster_path) || "",
        poster_path:(detDE && detDE.poster_path) || (detEN && detEN.poster_path) || (fallback && fallback.poster_path) || "",
        seasonNumber:pick.seasonNumber,
        staffelNummer:pick.seasonNumber,
        seasonLabel:"S" + pad2_(pick.seasonNumber),
        staffelLabel:"S" + pad2_(pick.seasonNumber),
        seasonStart:pick.seasonStart,
        start:pick.seasonStart,
        episodeCount:pick.episodeCount,
        episodes:pick.episodeCount,
        episoden:pick.episodeCount,
        episodeDates:pick.episodeDates,
        termindaten:pick.episodeDates,
        dateFlag:pick.dateFlag || "",
        placeholderStart:pick.placeholderStart || "",
        futureSeasonsCount:pick.futureSeasonsCount || 0,
        futureSeasons:Array.isArray(pick.futureSeasons) ? pick.futureSeasons : [],
        maxSeasonNumber:pick.maxSeasonNumber || pick.seasonNumber,
        descDE:String(detDE && detDE.overview || "").trim(),
        descEN:String(detEN && detEN.overview || "").trim()
    };
}

async function serkalSearchComplete_(query, lang, options) {
    const qRaw = String(query || "").trim();
    if (!qRaw) return { ok:false, code:"NO_QUERY", message:"Serientitel fehlt." };
    const o = options || {};
    const yearOverride = parseYear_(o.yearOverride || o.year || "");
    const seasonOverride = parseSeason_(o.seasonOverride || o.season || "");
    const searchLang = tmdbLang_(lang).startsWith("en") ? "en" : "de";
    const idMode = parseIdMode_(qRaw);

    if (idMode) {
        const [deRes,enRes] = await Promise.all([tmdbTvDetails_(idMode.id,"de"), tmdbTvDetails_(idMode.id,"en")]);
        if (!deRes.ok && !enRes.ok) return deRes.ok ? enRes : deRes;
        const hit = await buildHit_(idMode.id, null, deRes.data || null, enRes.data || null, idMode.season || seasonOverride, searchLang);
        return { ok:true, anzahl:1, results:[hit], treffer:[hit], daten:[hit] };
    }

    const searchRes = await tmdbRequest_("/search/tv", { query:qRaw, language:tmdbLang_(searchLang), include_adult:"false", page:"1" });
    if (!searchRes.ok) return searchRes;
    let hits = Array.isArray(searchRes.data && searchRes.data.results) ? searchRes.data.results : [];

    const qNorm = normTitle_(qRaw);
    const exact = hits.filter(h => normTitle_(h && h.name) === qNorm);
    if (exact.length) hits = exact;
    else {
        const begins = hits.filter(h => {
            const n = normTitle_(h && h.name);
            return n === qNorm || n.startsWith(qNorm + " ");
        });
        if (begins.length) hits = begins;
    }

    if (yearOverride) hits = hits.filter(h => yearFromDate_(h && h.first_air_date) === yearOverride);

    const candidateLimit = Math.min(hits.length, 12);
    const detailed = [];
    for (let i=0; i<candidateLimit; i++) {
        const h = hits[i];
        if (!h || !h.id) continue;
        const [deRes,enRes] = await Promise.all([tmdbTvDetails_(h.id,"de"), tmdbTvDetails_(h.id,"en")]);
        if (!deRes.ok && !enRes.ok) continue;
        const detDE = deRes.data || null;
        const detEN = enRes.data || null;
        if (yearOverride) {
            const y = yearFromDate_((detDE && detDE.first_air_date) || (detEN && detEN.first_air_date) || h.first_air_date || "");
            if (y !== yearOverride) continue;
        }
        detailed.push(await buildHit_(h.id, h, detDE, detEN, seasonOverride, searchLang));
    }

    detailed.sort((a,b) => {
        if (a._rankGroup !== b._rankGroup) return a._rankGroup - b._rankGroup;
        if (a._rankKey !== b._rankKey) return a._rankKey - b._rankKey;
        return Number(b.year || 0) - Number(a.year || 0);
    });

    const out = detailed.slice(0,3).map(x => {
        const copy = Object.assign({}, x);
        delete copy._rankGroup;
        delete copy._rankKey;
        return copy;
    });
    return { ok:true, anzahl:out.length, results:out, treffer:out, daten:out };
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
    ipcMain.handle("serkal:tmdb:searchTv", async (_event, query, lang, options) => serkalSearchComplete_(query, lang, options));
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
        } catch (_e) {
          error.textContent='TMDB-Einrichtung fehlgeschlagen.'; error.style.display='block';
        }
      };
      input.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') document.getElementById('skTmdbKeySave').click(); });
      setTimeout(() => input.focus(), 50);
    });
  }

  function sperreEintrag_() {
    setTimeout(() => {
      const btn = document.getElementById('btnInsert');
      if (!btn) return;
      btn.disabled = true;
      btn.title = 'Eintragen folgt, sobald das lokale Archiv angeschlossen ist.';
      const dock = document.getElementById('dockStatus');
      if (dock) dock.textContent = 'Suche aktiv · Eintragen folgt mit lokalem Archiv';
    }, 0);
  }

  function runner_() {
    let success = function(){};
    let failure = function(){};
    const chain = {
      withSuccessHandler(fn) { success = typeof fn === 'function' ? fn : success; return chain; },
      withFailureHandler(fn) { failure = typeof fn === 'function' ? fn : failure; return chain; },
      async apiSucheSerieKomplett(query, lang, options) {
        try {
          let res = await window.serkal.tmdb.searchTv(query, lang, options || {});
          if (!res.ok && res.code === 'TMDB_KEY_MISSING') {
            const key = await askTmdbKey_();
            if (!key) { failure({message:'TMDB ist noch nicht eingerichtet. Bitte zuerst den TMDB API-Key eintragen.'}); return; }
            res = await window.serkal.tmdb.searchTv(query, lang, options || {});
          }
          if (!res.ok) { failure({message:res.message || 'TMDB-Suche fehlgeschlagen.', code:res.code}); return; }
          success(res);
          if ((res.anzahl || 0) > 0) sperreEintrag_();
        } catch (e) { failure({message:(e && e.message) ? e.message : String(e)}); }
      },
      verarbeiteTmdbAuswahl() {
        failure({message:'Eintragen ist in SERKAL Desktop 0.0.4 noch gesperrt. Das lokale Archiv wird als nächster Schritt angeschlossen.'});
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

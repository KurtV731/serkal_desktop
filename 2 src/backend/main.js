/*
===============================================================================
 SERKAL Desktop
-------------------------------------------------------------------------------
 Datei      : main.js
 Version    : 0.9002
 Aufgabe    : Startet Electron, verwaltet lokale Grundeinstellungen,
              oeffnet den Kalender, stellt die TMDB-/SERKAL-Suche bereit
              und portiert das SERKAL-2.5-Archiv auf lokale TXT-Dateien.
===============================================================================
*/

const path = require("node:path");
const fs = require("node:fs");
const http = require("node:http");
const crypto = require("node:crypto");
const { app, BrowserWindow, ipcMain, shell } = require("electron");

const SERKAL_PROTOCOL = "serkal";
const serkalSquirrelUninstall_ = process.argv.includes("--squirrel-uninstall");

function maintainSerkalProtocol_() {
    if (process.platform !== "win32" || !app.isPackaged) return false;
    try {
        if (serkalSquirrelUninstall_) {
            return app.removeAsDefaultProtocolClient(SERKAL_PROTOCOL);
        }
        return app.setAsDefaultProtocolClient(SERKAL_PROTOCOL);
    } catch (err) {
        console.error("SERKAL URL-Protokoll:", err);
        return false;
    }
}

// Vor der Squirrel-Behandlung registrieren bzw. bei Deinstallation entfernen.
// Bei jedem normalen Start wird die Zuordnung vorsorglich erneut repariert.
maintainSerkalProtocol_();

// Squirrel-Ereignisse bei Installation, Update und Deinstallation sofort behandeln.
// Dadurch werden die dauerhaften Desktop- und Startmenue-Verknuepfungen gepflegt.
if (require("electron-squirrel-startup")) return;

function configureSharedUserData_() {
    try {
        const appData = app.getPath("appData");
        const previousUserData = app.getPath("userData");
        const target = path.join(appData, "SerKal");
        const candidates = Array.from(new Set([
            previousUserData,
            path.join(appData, "SerKal Desktop"),
            path.join(appData, "serkal_desktop")
        ])).filter(folder => path.resolve(folder) !== path.resolve(target));

        fs.mkdirSync(target, { recursive:true });

        const files = ["settings.json", "tmdb.json", "google_calendar_token.json"];
        for (const fileName of files) {
            const targetFile = path.join(target, fileName);
            if (fs.existsSync(targetFile)) continue;

            const available = candidates.map(folder => path.join(folder, fileName)).filter(file => {
                try { return fs.existsSync(file) && fs.statSync(file).isFile(); }
                catch (_err) { return false; }
            });
            if (!available.length) continue;

            available.sort((a, b) => {
                if (fileName === "settings.json") {
                    const score = file => {
                        try {
                            const value = JSON.parse(fs.readFileSync(file, "utf8"));
                            const calendar = value && value.calendar || {};
                            return (String(calendar.googleCalendarId || "").trim() ? 100 : 0) +
                                (String(calendar.mode || "").toLowerCase() === "google" ? 20 : 0) +
                                (value && value.setupDone === true ? 10 : 0);
                        } catch (_err) { return -1; }
                    };
                    const scoreDiff = score(b) - score(a);
                    if (scoreDiff) return scoreDiff;
                }
                return fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs;
            });
            fs.copyFileSync(available[0], targetFile);
        }

        app.setPath("userData", target);
    } catch (err) {
        console.error("SERKAL gemeinsamer Einstellungsordner:", err);
    }
}

configureSharedUserData_();

function serkalDisplayVersion_() {
    return app.getVersion().replace(/\.0$/, "");
}

function serkalWindowTitle_() {
    const title = "SERKAL Desktop " + serkalDisplayVersion_();
    return app.isPackaged ? title : title + " – ENTWICKLUNG";
}


function defaultArchiveFolder_() {
    return path.join(app.getPath("documents"), "SerKal", "Archiv");
}

const DEFAULT_SETTINGS = {
    setupDone: false,
    archive: { folderPath: defaultArchiveFolder_() },
    calendar: { mode: "", googleCalendarId: "" }
};

const SERKAL_GOOGLE_HELP_URL_DE = "https://serkal.de/google-kalender-hilfe.html";
const SERKAL_GOOGLE_HELP_URL_EN = "https://serkal.de/google-calendar-help.html";
const SERKAL_TMDB_HELP_URL_DE = "https://serkal.de/tmdb-hilfe.html";
const SERKAL_TMDB_HELP_URL_EN = "https://serkal.de/tmdb-help.html";

function googleHelpUrl_(lang) {
    return String(lang || "de").toLowerCase() === "en" ?
        SERKAL_GOOGLE_HELP_URL_EN : SERKAL_GOOGLE_HELP_URL_DE;
}

function tmdbHelpUrl_(lang) {
    return String(lang || "de").toLowerCase() === "en" ?
        SERKAL_TMDB_HELP_URL_EN : SERKAL_TMDB_HELP_URL_DE;
}

function googleCalendarPublicFailure_(extra) {
    return Object.assign({
        ok:false,
        code:"GOOGLE_CALENDAR_UNAVAILABLE",
        message:"SerKal konnte keine Verbindung zum Google Kalender herstellen. Bitte prüfen Sie die Anmeldung oder öffnen Sie die SerKal-Hilfe.",
        helpUrl:SERKAL_GOOGLE_HELP_URL_DE
    }, extra || {});
}

function settingsPath_() { return path.join(app.getPath("userData"), "settings.json"); }
function tmdbConfigPath_() { return path.join(app.getPath("userData"), "tmdb.json"); }

function normalizeSettings_(raw) {
    const out = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
    if (raw && typeof raw === "object") {
        out.setupDone = raw.setupDone === true;
        if (raw.archive && typeof raw.archive === "object") {
            const folderPath = String(raw.archive.folderPath || "").trim();
            if (folderPath) out.archive.folderPath = folderPath;
        }
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


const LOG_WEEKDAYS = { so:0, mo:1, di:2, mi:3, do:4, fr:5, sa:6 };

function logDateForDay_(day) {
    const key = String(day || "today").trim().toLowerCase();
    const now = new Date();
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (Object.prototype.hasOwnProperty.call(LOG_WEEKDAYS, key)) {
        let diff = date.getDay() - LOG_WEEKDAYS[key];
        if (diff < 0) diff += 7;
        date.setDate(date.getDate() - diff);
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(key)) {
        return key;
    }
    return String(date.getFullYear()) + "-" + String(date.getMonth() + 1).padStart(2, "0") + "-" +
        String(date.getDate()).padStart(2, "0");
}

function logFilePath_(day) {
    const folder = archiveFolderPath_();
    if (!folder) throw new Error("Archivordner für das Log ist nicht eingerichtet.");
    if (!fs.existsSync(folder)) throw new Error("Archivordner für das Log wurde nicht gefunden: " + folder);
    return path.join(folder, "!!SERKAL_LOG_" + logDateForDay_(day) + ".txt");
}

function logSafeObject_(value) {
    if (value === undefined || value === null || value === "") return "";
    try { return JSON.stringify(value); }
    catch (_err) { return String(value); }
}

function logWrite_(level, tag, text, object) {
    try {
        const now = new Date();
        const record = {
            zeit:now.toLocaleTimeString("de-DE", { hour12:false }),
            level:String(level || "INFO").toUpperCase(),
            tag:String(tag || "SYSTEM"),
            text:String(text || ""),
            objekt:logSafeObject_(object)
        };
        fs.appendFileSync(logFilePath_("today"), JSON.stringify(record) + "\n", "utf8");
        return { ok:true };
    } catch (err) {
        return { ok:false, message:"Log konnte nicht geschrieben werden: " + err.message };
    }
}

function logRead_(maxLines, day) {
    try {
        const file = logFilePath_(day);
        if (!fs.existsSync(file)) return { ok:true, lines:[], fileName:path.basename(file) };
        const rawLines = fs.readFileSync(file, "utf8").split(/\r?\n/).filter(Boolean);
        const limit = Math.max(1, Math.min(5000, Number(maxLines || 500)));
        const lines = rawLines.slice(-limit).map(line => {
            try {
                const parsed = JSON.parse(line);
                if (parsed && typeof parsed === "object") return parsed;
            } catch (_err) {}
            return { zeit:"", level:"", tag:"", text:String(line), objekt:"" };
        });
        return { ok:true, lines, fileName:path.basename(file), count:lines.length };
    } catch (err) {
        return { ok:false, message:"Log konnte nicht gelesen werden: " + err.message, lines:[] };
    }
}

function logSaveText_(day, text) {
    try {
        const file = logFilePath_(day);
        fs.writeFileSync(file, String(text || "").replace(/\r?\n/g, "\n"), "utf8");
        return { ok:true, message:"Log gespeichert.", fileName:path.basename(file) };
    } catch (err) {
        return { ok:false, message:"Log konnte nicht gespeichert werden: " + err.message };
    }
}

function logClear_(day) {
    try {
        const file = logFilePath_(day);
        fs.writeFileSync(file, "", "utf8");
        return { ok:true, message:"Log geleert.", fileName:path.basename(file) };
    } catch (err) {
        return { ok:false, message:"Log konnte nicht geleert werden: " + err.message };
    }
}

function archiveFolderPath_() {
    return String(readSettings_().archive.folderPath || "").trim();
}

function archiveEnsureFolder_(folder) {
    const target = String(folder || "").trim();
    if (!target) return false;
    if (fs.existsSync(target)) return true;

    // Nur den SerKal-Standardordner eines neuen Benutzers automatisch
    // anlegen. Ein verschwundener, bewusst gewaehlter Fremdpfad bleibt
    // weiterhin ein Fehler und wird nicht stillschweigend neu erzeugt.
    if (path.resolve(target) !== path.resolve(defaultArchiveFolder_())) return false;

    fs.mkdirSync(target, { recursive:true });
    logWrite_("INFO", "ARCHIV", "Standard-Archivordner beim Erststart angelegt", {
        folderPath:target
    });
    return fs.existsSync(target);
}

function archiveSafeTitle_(value) {
    return String(value || "")
        .replace(/[\\/:*?"<>|]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

function archiveFileName_(title, year) {
    const safeTitle = archiveSafeTitle_(title);
    const safeYear = /^\d{4}$/.test(String(year || "")) ? String(year) : "";
    return safeTitle + (safeYear ? " (" + safeYear + ")" : "") + ".txt";
}

function archiveEncode_(value) {
    return encodeURIComponent(String(value || "").trim());
}

function archiveDecode_(value) {
    const raw = String(value || "").trim();
    if (!raw) return "";
    try { return decodeURIComponent(raw.replace(/\+/g, "%20")); }
    catch (_err) { return raw; }
}

function archiveField_(line, key) {
    const escaped = String(key || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = String(line || "").match(new RegExp("(?:^|[;|]\\s*)" + escaped + "=([^;|]*)", "i"));
    return match ? String(match[1] || "").trim() : "";
}

function archiveCompactDates_(dates) {
    return (Array.isArray(dates) ? dates : []).map((date) => {
        const match = String(date || "").match(/^\d{4}-(\d{2})-(\d{2})$/);
        return match ? match[2] + "." + match[1] + "." : "";
    }).filter(Boolean);
}

function archiveExpandDates_(tokens, startIso) {
    let year = Number(String(startIso || "").slice(0,4)) || new Date().getFullYear();
    let lastMonth = 0;
    const out = [];
    for (const raw of Array.isArray(tokens) ? tokens : []) {
        const token = String(raw || "").trim();
        if (/^\d{4}-\d{2}-\d{2}$/.test(token)) {
            out.push(token);
            lastMonth = Number(token.slice(5,7));
            continue;
        }
        const match = token.match(/^(\d{1,2})\.(\d{1,2})\.?$/);
        if (!match) continue;
        const day = Number(match[1]);
        const month = Number(match[2]);
        if (lastMonth && month < lastMonth) year++;
        lastMonth = month;
        out.push(String(year) + "-" + String(month).padStart(2,"0") + "-" + String(day).padStart(2,"0"));
    }
    return out;
}

function archiveShiftDates_(dates, offsetDays) {
    const offset = Number(offsetDays);
    if (!Number.isFinite(offset)) return [];
    return (Array.isArray(dates) ? dates : []).map(value => {
        const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (!match) return "";
        const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
        date.setUTCDate(date.getUTCDate() + offset);
        return date.toISOString().slice(0, 10);
    }).filter(Boolean);
}

function archiveParseNoteRules_(noteText, startOriginal, originalDates) {
    const result = {
        rule:"",
        offsetDE:null,
        termineDECompact:[],
        datesDE:[],
        startDE:""
    };
    const lines = String(noteText || "").split(/\r?\n/);

    for (const rawLine of lines) {
        const line = String(rawLine || "").trim();
        if (!line) continue;

        const offsetMatch = line.match(/^(?:offset(?:\s*de)?|termin\s*offset|de\s*offset|offset\s*deutsch)\s*:?\s*([+-]?\d+)\s*d?\s*$/i);
        if (offsetMatch) {
            result.offsetDE = Number(offsetMatch[1]);
            continue;
        }

        const datesMatch = line.match(/^termine(?:\s*de)?\s*:\s*(.+)$/i);
        if (datesMatch) {
            result.termineDECompact = String(datesMatch[1] || "")
                .split(",").map(value => String(value || "").trim()).filter(Boolean);
        }
    }

    if (result.termineDECompact.length) {
        result.datesDE = archiveExpandDates_(result.termineDECompact, startOriginal || "");
        result.rule = "TermineDE";
    } else if (result.offsetDE !== null && Array.isArray(originalDates) && originalDates.length) {
        result.datesDE = archiveShiftDates_(originalDates, result.offsetDE);
        result.rule = "OffsetDE";
    }
    result.startDE = result.datesDE[0] || "";
    return result;
}

const SERKAL_MANUAL_TITLE = 1;
const SERKAL_MANUAL_DESC_DE = 2;
const SERKAL_MANUAL_DESC_EN = 4;
const SERKAL_MANUAL_START = 8;
const SERKAL_MANUAL_DATES = 16;
const SERKAL_MANUAL_EPISODES = 32;
const SERKAL_MANUAL_POSTER = 64;
const SERKAL_MANUAL_NOTES = 128;
const SERKAL_MANUAL_CALENDAR = SERKAL_MANUAL_START | SERKAL_MANUAL_DATES;

function archiveManualFlags_(line, noteText, startOriginal, originalDates) {
    let flags = Number(archiveField_(line, "manualFlags") || 0) || 0;
    const noteRule = archiveParseNoteRules_(noteText, startOriginal, originalDates);
    if (noteRule.rule) {
        flags |= SERKAL_MANUAL_NOTES;
        flags |= SERKAL_MANUAL_CALENDAR;
    }
    return flags;
}

function archiveStatus_(dates, seen) {
    if (Number(seen || 0) === 1) return 4;
    const list = Array.isArray(dates) ? dates.filter(Boolean) : [];
    if (!list.length) return 0;
    const today = new Date();
    const todayIso = String(today.getFullYear()) + "-" + String(today.getMonth()+1).padStart(2,"0") + "-" + String(today.getDate()).padStart(2,"0");
    if (list[0] > todayIso) return 1;
    if (list[list.length-1] >= todayIso) return 2;
    return 3;
}

function archiveStatusText_(status) {
    return ({0:"warten",1:"geplant",2:"läuft",3:"ungesehen",4:"geschaut",5:"fehler"})[Number(status)] || "warten";
}

function archiveEntryFromLine_(fileName, stats, line) {
    const labelMatch = String(line || "").match(/^(S\d{1,2})(?:\b|;|\|)/i);
    if (!labelMatch) return null;
    const base = fileName.replace(/\.txt$/i, "");
    const titleYear = base.match(/^(.*)\s\((\d{4})\)$/);
    const title = titleYear ? String(titleYear[1] || "").trim() : base;
    const year = titleYear ? Number(titleYear[2]) : null;
    const startOriginal = archiveField_(line,"startOriginal") || archiveField_(line,"start");
    const startDE = archiveField_(line,"startDE");
    const datesOriginal = archiveExpandDates_(archiveField_(line,"dates").split(",").filter(Boolean),startOriginal);
    const datesDE = archiveExpandDates_(archiveField_(line,"datesDE").split(",").filter(Boolean),startDE);
    const activeDates = datesDE.length ? datesDE : (datesOriginal.length ? datesOriginal : (startDE ? [startDE] : (startOriginal ? [startOriginal] : [])));
    const seen = Number(archiveField_(line,"seen") || archiveField_(line,"buttonPressed") || 0) || 0;
    const noteText = archiveDecode_(archiveField_(line,"note"));
    const manualFlags = archiveManualFlags_(line, noteText, startOriginal, datesOriginal);
    const status = archiveStatus_(activeDates,seen);
    const updated = stats && stats.mtime ? stats.mtime : new Date(0);
    return {
        fileName, name:fileName, id:fileName, url:"", titel:title, title, jahr:year, year,
        staffelLabel:String(labelMatch[1]).toUpperCase(), seasonLabel:String(labelMatch[1]).toUpperCase(), staffel:String(labelMatch[1]).toUpperCase(),
        tmdbId:Number(archiveField_(line,"tmdb") || 0) || null,
        start:activeDates[0] || "", startDate:activeDates[0] || "", endDate:activeDates[activeDates.length-1] || "",
        startOriginal, originalStartDate:startOriginal, startDE, deStartDate:startDE,
        episoden:Number(archiveField_(line,"eps") || 0) || 0, eps:Number(archiveField_(line,"eps") || 0) || 0,
        termindaten:activeDates, dates:activeDates, datesOriginal, datesDE, activeDates, termCount:activeDates.length,
        descDE:archiveDecode_(archiveField_(line,"descDE") || archiveField_(line,"ov_de")),
        descEN:archiveDecode_(archiveField_(line,"descEN") || archiveField_(line,"ov_en")),
        note:noteText, flags:Number(archiveField_(line,"flags") || 0) || 0,
        manualFlags,
        manualTitle:Boolean(manualFlags & SERKAL_MANUAL_TITLE),
        manualDescDE:Boolean(manualFlags & SERKAL_MANUAL_DESC_DE),
        manualDescEN:Boolean(manualFlags & SERKAL_MANUAL_DESC_EN),
        manualStart:Boolean(manualFlags & SERKAL_MANUAL_START),
        manualDates:Boolean(manualFlags & SERKAL_MANUAL_DATES),
        manualEpisodes:Boolean(manualFlags & SERKAL_MANUAL_EPISODES),
        manualPoster:Boolean(manualFlags & SERKAL_MANUAL_POSTER),
        manualNotes:Boolean(manualFlags & SERKAL_MANUAL_NOTES),
        buttonPressed:seen, seen, status, statusText:archiveStatusText_(status), raw:String(line || ""),
        updated:updated.toISOString(), updatedMs:updated.getTime(), updatedText:updated.toLocaleString("de-DE")
    };
}

function archiveLoad_() {
    const folder = archiveFolderPath_();
    if (!folder) return { ok:false, message:"Archivordner ist nicht eingerichtet.", daten:{entries:[],meta:{source:"no-folder"}}, count:0 };
    try {
        if (!archiveEnsureFolder_(folder)) return { ok:false, message:"Archivordner nicht gefunden: " + folder, daten:{entries:[],meta:{source:"missing-folder"}}, count:0 };
        const entries = [];
        for (const fileName of fs.readdirSync(folder)) {
            const lower = fileName.toLowerCase();
            if (!lower.endsWith(".txt") || lower.startsWith("!!serkal_log_") || lower.startsWith("fanal_")) continue;
            const fullPath = path.join(folder,fileName);
            const stats = fs.statSync(fullPath);
            if (!stats.isFile()) continue;
            const lines = fs.readFileSync(fullPath,"utf8").split(/\r?\n/).map(x=>String(x||"").trim()).filter(Boolean);
            for (const line of lines) {
                const entry = archiveEntryFromLine_(fileName,stats,line);
                if (entry) entries.push(entry);
            }
        }
        entries.sort((a,b) => (a.startDate && b.startDate && a.startDate !== b.startDate) ? a.startDate.localeCompare(b.startDate) : b.updatedMs-a.updatedMs);
        return { ok:true, daten:{entries,meta:{source:"local-rebuild",generatedAt:new Date().toISOString(),count:entries.length,folderPath:folder}}, count:entries.length };
    } catch (err) {
        return { ok:false, message:"Archiv konnte nicht gelesen werden: " + err.message, daten:{entries:[],meta:{source:"load-error"}}, count:0 };
    }
}

function archiveInsert_(payload) {
    try {
        const data = payload || {};
        const title = String(data.titel || data.title || data.name || "").trim();
        const year = String(data.jahr || data.year || "").trim();
        const seasonNumber = Number(data.staffelNummer || data.seasonNumber || String(data.staffelLabel || data.seasonLabel || "").replace(/\D/g,""));
        const episodeCount = Number(data.episoden ?? data.episodes ?? data.episodeCount ?? 0) || 0;
        const tmdbId = Number(data.tmdbId || data.id || 0) || null;
        const dates = (Array.isArray(data.termindaten) ? data.termindaten : (Array.isArray(data.episodeDates) ? data.episodeDates : []))
            .map(x=>String(x||"")).filter(x=>/^\d{4}-\d{2}-\d{2}$/.test(x));
        if (!title) return { ok:false, message:"Titel fehlt." };
        if (!seasonNumber || (!dates.length && !episodeCount)) return { ok:false, message:"Eintrag unvollständig (Staffel/Termine/Episoden fehlen)." };
        const folder = archiveFolderPath_();
        if (!folder) return { ok:false, message:"Archivordner ist nicht eingerichtet." };
        if (!archiveEnsureFolder_(folder)) return { ok:false, message:"Archivordner nicht gefunden: " + folder };
        const fileName = archiveFileName_(title,year);
        const fullPath = path.join(folder,fileName);
        const label = "S" + String(seasonNumber).padStart(2,"0");
        const oldText = fs.existsSync(fullPath) ? fs.readFileSync(fullPath,"utf8") : "";
        const oldLines = oldText.split(/\r?\n/).map(x=>String(x||"").trim()).filter(Boolean);
        const oldLine = oldLines.find(x=>new RegExp("^"+label+"(?:\\b|;|\\|)","i").test(x)) || "";
        let flags = Number(archiveField_(oldLine,"flags") || 0) || 0;
        const manualFlags = Number(archiveField_(oldLine,"manualFlags") || 0) || 0;
        const oldNote = archiveField_(oldLine,"note");
        const oldStartDE = archiveField_(oldLine,"startDE");
        const oldDatesDE = archiveField_(oldLine,"datesDE");
        const oldOffsetDE = archiveField_(oldLine,"offsetDE");
        const descDE = String(data.descDE || "").trim();
        const descEN = String(data.descEN || "").trim();
        if (descDE && descEN) flags |= 32;
        const parts = [label];
        if (dates.length) parts.push("startOriginal="+dates[0]);
        if (episodeCount) parts.push("eps="+episodeCount);
        if (tmdbId) parts.push("tmdb="+tmdbId);
        parts.push("titleOriginal="+archiveEncode_(title));
        if (dates.length) parts.push("dates="+archiveCompactDates_(dates).join(","));
        if (descDE) parts.push("descDE="+archiveEncode_(descDE));
        if (descEN) parts.push("descEN="+archiveEncode_(descEN));
        if (oldStartDE) parts.push("startDE="+oldStartDE);
        if (oldDatesDE) parts.push("datesDE="+oldDatesDE);
        if (oldOffsetDE !== "") parts.push("offsetDE="+oldOffsetDE);
        if (oldNote) parts.push("note="+oldNote);
        parts.push("flags="+flags);
        if (manualFlags) parts.push("manualFlags="+manualFlags);
        const newLine = parts.join("; ");
        const kept = oldLines.filter(x=>!new RegExp("^"+label+"(?:\\b|;|\\|)","i").test(x));
        kept.push(newLine);
        kept.sort((a,b)=>(Number((a.match(/^S(\d+)/i)||[])[1])||9999)-(Number((b.match(/^S(\d+)/i)||[])[1])||9999));
        const tempPath = fullPath+".serkal-tmp";
        fs.writeFileSync(tempPath,kept.join("\n")+"\n","utf8");
        fs.renameSync(tempPath,fullPath);
        return { ok:true, message:"Archiv gespeichert: "+fileName+" / "+label, fileName, staffelLabel:label, archiv:archiveLoad_() };
    } catch (err) {
        return { ok:false, message:"Archiv konnte nicht gespeichert werden: "+err.message };
    }
}


async function archiveDeleteSeries_(payload) {
    try {
        const data = payload || {};
        const fileName = String(data.fileName || "").trim();
        if (!fileName || path.basename(fileName) !== fileName || !fileName.toLowerCase().endsWith(".txt")) {
            return { ok:false, message:"Ungültiger Archivdateiname." };
        }

        const folder = archiveFolderPath_();
        if (!folder || !archiveEnsureFolder_(folder)) {
            return { ok:false, message:"Archivordner nicht gefunden: " + folder };
        }

        const fullPath = path.join(folder, fileName);
        if (!fs.existsSync(fullPath)) {
            return { ok:false, message:"Archivdatei nicht gefunden: " + fileName };
        }

        const stats = fs.statSync(fullPath);
        if (!stats.isFile()) return { ok:false, message:"Archivdatei ist keine Datei: " + fileName };

        const lines = fs.readFileSync(fullPath, "utf8")
            .split(/\r?\n/)
            .map(line => String(line || "").trim())
            .filter(Boolean);
        const entries = lines
            .map(line => archiveEntryFromLine_(fileName, stats, line))
            .filter(Boolean);

        const settings = readSettings_();
        const calendarMode = String(settings.calendar.mode || "").toLowerCase();
        let calendarDeleted = 0;

        if (calendarMode === "ics") {
            return {
                ok:false,
                message:"ICS-Kalendertermine können nicht automatisch gelöscht werden. Archivdatei wurde nicht gelöscht."
            };
        }

        if (calendarMode === "google") {
            const resolvedCalendar = await googleResolveSerkalCalendar_();
            const calendarId = String(resolvedCalendar.id || "").trim();

            for (const entry of entries) {
                const seasonNumber = Number(String(entry.staffelLabel || "").replace(/\D/g, ""));
                const dates = Array.isArray(entry.activeDates) ? entry.activeDates : [];
                const blocks = calendarBlocks_(dates);
                for (const block of blocks) {
                    let deletedCandidate = false;
                    const idPayload = {
                        tmdbId:entry.tmdbId,
                        staffelNummer:seasonNumber
                    };
                    for (const eventId of googleCalendarEventIdCandidates_(idPayload, block)) {
                        const result = await googleCalendarApi_("DELETE", calendarId, eventId, null);
                        if (result.ok) {
                            calendarDeleted++;
                            deletedCandidate = true;
                            continue;
                        }
                        if (result.status === 404 || result.status === 410) {
                            if (deletedCandidate) break;
                            continue;
                        }
                        const detail = result.data && (result.data.error && result.data.error.message || result.data.error_description);
                        logWrite_("ERROR", "GOOGLE", "Google-Kalendertermin konnte beim Löschen nicht entfernt werden", {
                            fileName,
                            httpStatus:Number(result.status || 0),
                            googleMessage:String(detail || "")
                        });
                        return googleCalendarPublicFailure_({
                            action:"delete",
                            message:"Die Serie wurde nicht gelöscht, weil SerKal den Google Kalender nicht erreichen konnte. Ihre Archivdatei ist unverändert."
                        });
                    }
                }
            }
        }

        fs.unlinkSync(fullPath);
        const loaded = archiveLoad_();
        return {
            ok:true,
            message:"Serie gelöscht: " + fileName,
            fileName,
            calendarMode:calendarMode || "none",
            calendarDeleted,
            daten:loaded.daten,
            count:loaded.count
        };
    } catch (err) {
        const technical = String(err && err.message || err);
        if (/google|oauth|calendar|client.?id|google_oauth_client\.json/i.test(technical)) {
            logWrite_("ERROR", "GOOGLE", "Google-Fehler beim Löschen einer Serie", {
                fehler:technical,
                fileName:String(payload && payload.fileName || "")
            });
            return googleCalendarPublicFailure_({
                action:"delete",
                message:"Die Serie wurde nicht gelöscht, weil SerKal den Google Kalender nicht erreichen konnte. Ihre Archivdatei ist unverändert."
            });
        }
        return { ok:false, message:"Serie konnte nicht gelöscht werden: " + technical };
    }
}

function archiveSetField_(line, key, value) {
    const escaped = String(key || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp("((?:^|[;|]\\s*)" + escaped + "=)[^;|]*", "i");
    if (re.test(line)) return String(line).replace(re, "$1" + String(value));
    const delimiter = String(line).includes(";") ? "; " : " | ";
    return String(line).trim() + delimiter + String(key) + "=" + String(value);
}

function archiveSaveChanges_(dirtyMap) {
    try {
        const changes = dirtyMap && typeof dirtyMap === "object" ? Object.values(dirtyMap) : [];
        if (!changes.length) return { ok:true, savedCount:0, daten:archiveLoad_().daten };

        const folder = archiveFolderPath_();
        if (!folder || !archiveEnsureFolder_(folder)) return { ok:false, message:"Archivordner nicht gefunden: " + folder };

        let savedCount = 0;
        const byFile = new Map();
        for (const patch of changes) {
            const fileName = String(patch && patch.fileName || "").trim();
            const staffelLabel = String(patch && patch.staffelLabel || "").trim().toUpperCase();
            if (!fileName || path.basename(fileName) !== fileName || !fileName.toLowerCase().endsWith(".txt")) {
                return { ok:false, message:"Ungültiger Archivdateiname." };
            }
            if (!/^S\d{1,2}$/.test(staffelLabel)) return { ok:false, message:"Ungültige Staffelkennung." };
            if (!byFile.has(fileName)) byFile.set(fileName, []);
            byFile.get(fileName).push(Object.assign({}, patch, { staffelLabel }));
        }

        for (const [fileName, patches] of byFile.entries()) {
            const fullPath = path.join(folder, fileName);
            if (!fs.existsSync(fullPath)) return { ok:false, message:"Archivdatei nicht gefunden: " + fileName };
            const original = fs.readFileSync(fullPath, "utf8");
            const hadFinalNewline = /\r?\n$/.test(original);
            const lines = original.split(/\r?\n/);
            let changed = false;

            for (const patch of patches) {
                const lineIndex = lines.findIndex(line => new RegExp("^" + patch.staffelLabel + "(?:\\b|;|\\|)", "i").test(String(line || "").trim()));
                if (lineIndex < 0) return { ok:false, message:"Staffel nicht gefunden: " + fileName + " / " + patch.staffelLabel };

                let line = String(lines[lineIndex] || "").trim();
                if (Object.prototype.hasOwnProperty.call(patch, "seen")) {
                    line = archiveSetField_(line, "seen", Number(patch.seen) === 1 ? "1" : "0");
                }
                if (Object.prototype.hasOwnProperty.call(patch, "note")) {
                    const noteText = String(patch.note || "");
                    line = archiveSetField_(line, "note", archiveEncode_(noteText));

                    /*
                     * Nur ausdrücklich erkannte Steuerzeilen werden fachlich
                     * ausgewertet. Beliebiger übriger Notiztext bleibt frei.
                     */
                    const startOriginal = archiveField_(line, "startOriginal") || archiveField_(line, "start");
                    const datesOriginal = archiveExpandDates_(
                        archiveField_(line, "dates").split(",").filter(Boolean),
                        startOriginal
                    );
                    const noteRule = archiveParseNoteRules_(noteText, startOriginal, datesOriginal);
                    let manualFlags = Number(archiveField_(line, "manualFlags") || 0) || 0;
                    manualFlags |= SERKAL_MANUAL_NOTES;
                    if (noteRule.rule) {
                        manualFlags |= SERKAL_MANUAL_CALENDAR;
                        line = archiveSetField_(line, "datesDE", archiveCompactDates_(noteRule.datesDE).join(","));
                        line = archiveSetField_(line, "startDE", noteRule.startDE);
                        if (noteRule.rule === "OffsetDE") {
                            line = archiveSetField_(line, "offsetDE", String(noteRule.offsetDE));
                        } else {
                            line = archiveSetField_(line, "offsetDE", "");
                        }
                        line = archiveSetField_(line, "manualFlags", String(manualFlags));
                        logWrite_("INFO", "NOTES", "Notiz-Steuerregel ausgewertet", {
                            fileName,
                            staffelLabel:patch.staffelLabel,
                            regel:noteRule.rule,
                            offsetDE:noteRule.offsetDE,
                            termineDE:noteRule.datesDE.length
                        });
                    } else {
                        line = archiveSetField_(line, "manualFlags", String(manualFlags));
                    }
                }
                if (line !== String(lines[lineIndex] || "").trim()) {
                    lines[lineIndex] = line;
                    changed = true;
                    savedCount++;
                }
            }

            if (changed) {
                const text = lines.join("\n").replace(/\n+$/, "") + (hadFinalNewline ? "\n" : "");
                const tempPath = fullPath + ".serkal-tmp";
                fs.writeFileSync(tempPath, text, "utf8");
                fs.renameSync(tempPath, fullPath);
            }
        }

        const loaded = archiveLoad_();
        if (!loaded.ok) return loaded;
        return { ok:true, savedCount, daten:loaded.daten, count:loaded.count };
    } catch (err) {
        return { ok:false, message:"Archivänderungen konnten nicht gespeichert werden: " + err.message };
    }
}

async function tmdbRequest_(pathname, params, apiKeyOverride) {
    const apiKey = String(apiKeyOverride || readTmdbKey_()).trim();
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

async function tmdbPoster_(id, lang) {
    const tvId = Number(id || 0);
    if (!Number.isFinite(tvId) || tvId <= 0) return { ok:false, nopic:true, message:"TMDB-ID fehlt." };

    const details = await tmdbTvDetails_(tvId, lang);
    if (!details.ok) return details;

    const posterPath = String(details.data && details.data.poster_path || "").trim();
    if (!posterPath) return { ok:true, nopic:true, tmdbId:tvId };

    try {
        const url = "https://image.tmdb.org/t/p/w342" + posterPath;
        const response = await fetch(url, { headers:{ accept:"image/*" } });
        if (!response.ok) return { ok:false, nopic:true, message:"TMDB-Poster konnte nicht geladen werden." };
        const mime = String(response.headers.get("content-type") || "image/jpeg").split(";")[0];
        const bytes = Buffer.from(await response.arrayBuffer());
        return {
            ok:true,
            nopic:false,
            tmdbId:tvId,
            posterPath,
            dataUrl:"data:" + mime + ";base64," + bytes.toString("base64")
        };
    } catch (_err) {
        return { ok:false, nopic:true, message:"Keine Verbindung zum TMDB-Bildserver." };
    }
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


function calendarPad2_(value) {
    return String(Number(value || 0)).padStart(2, "0");
}

function calendarBlocks_(termindaten) {
    const blocks = [];
    let lastDate = null;
    let from = 1;
    let to = 1;
    for (let i = 0; i < termindaten.length; i++) {
        const date = String(termindaten[i] || "").trim();
        if (!date) continue;
        const episode = i + 1;
        if (lastDate === null) {
            lastDate = date;
            from = episode;
            to = episode;
        } else if (date === lastDate) {
            to = episode;
        } else {
            blocks.push({ date:lastDate, eFrom:from, eTo:to });
            lastDate = date;
            from = episode;
            to = episode;
        }
    }
    if (lastDate !== null) blocks.push({ date:lastDate, eFrom:from, eTo:to });
    return blocks;
}

function calendarIcsEscape_(value) {
    return String(value == null ? "" : value)
        .replace(/\\/g, "\\\\")
        .replace(/\r?\n/g, "\\n")
        .replace(/,/g, "\\,")
        .replace(/;/g, "\\;");
}

function calendarIcsFold_(line) {
    let text = String(line == null ? "" : line);
    const out = [];
    while (text.length > 73) {
        out.push(text.substring(0, 73));
        text = " " + text.substring(73);
    }
    out.push(text);
    return out.join("\r\n");
}

function calendarIcsNextDay_(iso) {
    const match = String(iso || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return "";
    const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
    date.setUTCDate(date.getUTCDate() + 1);
    return String(date.getUTCFullYear()) + "-" +
        String(date.getUTCMonth() + 1).padStart(2, "0") + "-" +
        String(date.getUTCDate()).padStart(2, "0");
}

function calendarIcsFileName_(value) {
    return String(value || "SerKal")
        .replace(/[\\/:*?"<>|]/g, "_")
        .replace(/\s+/g, " ")
        .trim()
        .substring(0, 100) || "SerKal";
}

function calendarUtcStamp_() {
    const date = new Date();
    return String(date.getUTCFullYear()) +
        String(date.getUTCMonth() + 1).padStart(2, "0") +
        String(date.getUTCDate()).padStart(2, "0") + "T" +
        String(date.getUTCHours()).padStart(2, "0") +
        String(date.getUTCMinutes()).padStart(2, "0") +
        String(date.getUTCSeconds()).padStart(2, "0") + "Z";
}

function calendarCreateIcs_(payload) {
    try {
        const data = payload || {};
        const title = String(data.titel || data.title || data.name || "").trim();
        const year = String(data.jahrOverride || data.jahr || data.year || "").trim();
        const seasonNumber = Number(data.staffelOverride || data.staffelNummer || data.seasonNumber ||
            String(data.staffelLabel || data.seasonLabel || "").replace(/\D/g, ""));
        const tmdbId = Number(data.tmdbId || data.id || 0) || 0;
        const dates = (Array.isArray(data.termindaten) ? data.termindaten :
            (Array.isArray(data.episodeDates) ? data.episodeDates : []))
            .map(value => String(value || "").trim())
            .filter(value => /^\d{4}-\d{2}-\d{2}$/.test(value));

        if (!title || !/^\d{4}$/.test(year) || !Number.isFinite(seasonNumber) || seasonNumber <= 0) {
            return { ok:false, message:"ICS: Titel, Jahr oder Staffel fehlt." };
        }
        if (!dates.length) return { ok:false, message:"ICS: Keine gültigen Termine vorhanden." };

        const seasonLabel = "S" + calendarPad2_(seasonNumber);
        const blocks = calendarBlocks_(dates);
        if (!blocks.length) return { ok:false, message:"ICS: Keine Terminblöcke vorhanden." };

        const stamp = calendarUtcStamp_();
        const lines = [
            "BEGIN:VCALENDAR",
            "VERSION:2.0",
            "PRODID:-//SerKal Desktop//0.0.5//DE",
            "CALSCALE:GREGORIAN",
            "METHOD:PUBLISH",
            "X-WR-TIMEZONE:Europe/Berlin",
            "X-WR-CALNAME:" + calendarIcsEscape_("SerKal – " + title + " " + seasonLabel)
        ];

        for (const block of blocks) {
            const startCompact = block.date.replace(/-/g, "");
            const endCompact = calendarIcsNextDay_(block.date).replace(/-/g, "");
            const summary = title + " (" + year + ") " + seasonLabel + "E" + calendarPad2_(block.eFrom) +
                (block.eTo !== block.eFrom ? ("–E" + calendarPad2_(block.eTo)) : "");
            const uidBase = tmdbId ? ("tmdb-" + tmdbId) :
                calendarIcsFileName_(title + "-" + year).toLowerCase().replace(/[^a-z0-9]+/g, "-");
            const uid = "serkal-desktop-" + uidBase + "-" + seasonLabel.toLowerCase() +
                "-e" + calendarPad2_(block.eFrom) + "-e" + calendarPad2_(block.eTo) + "@serkal.de";

            lines.push("BEGIN:VEVENT");
            lines.push("UID:" + uid);
            lines.push("DTSTAMP:" + stamp);
            lines.push("CREATED:" + stamp);
            lines.push("LAST-MODIFIED:" + stamp);
            lines.push("SEQUENCE:0");
            lines.push("DTSTART;VALUE=DATE:" + startCompact);
            lines.push("DTEND;VALUE=DATE:" + endCompact);
            lines.push("SUMMARY:" + calendarIcsEscape_(summary));
            lines.push("DESCRIPTION:SerKal");
            lines.push("TRANSP:TRANSPARENT");
            lines.push("END:VEVENT");
        }

        lines.push("END:VCALENDAR");
        const content = lines.map(calendarIcsFold_).join("\r\n") + "\r\n";
        const fileName = calendarIcsFileName_(title) + "_" + year + "_" + seasonLabel + ".ics";
        return {
            ok:true,
            fileName,
            mimeType:"text/calendar;charset=utf-8",
            base64:Buffer.from(content, "utf8").toString("base64"),
            events:blocks.length,
            importUrl:"https://calendar.google.com/calendar/u/0/r/settings/export"
        };
    } catch (err) {
        return { ok:false, message:"ICS-Erzeugung fehlgeschlagen: " + err.message };
    }
}


/* Originalverhalten aus modul5-kalender.gs benötigt:
   Kalender "SerKal" suchen, bei Bedarf anlegen und danach Events verwalten. */
const GOOGLE_CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar";

function googleOauthTokenHasRequiredScope_(token) {
    const scopes = String(token && token.scope || "").split(/\s+/).filter(Boolean);
    return scopes.includes(GOOGLE_CALENDAR_SCOPE);
}

function googleOauthTokenPath_() {
    return path.join(app.getPath("userData"), "google_calendar_token.json");
}

function googleOauthCredentialsPath_() {
    const candidates = [
        String(process.env.SERKAL_GOOGLE_OAUTH_FILE || "").trim(),
        path.resolve(app.getAppPath(), "..", "serkal_private", "google_oauth_client.json"),
        "C:\\serkal_dev\\serkal_private\\google_oauth_client.json"
    ].filter(Boolean);
    for (const candidate of candidates) {
        try {
            if (fs.existsSync(candidate)) return candidate;
        } catch (_err) {}
    }
    return candidates[0] || "";
}

function googleOauthClientConfig_() {
    const file = googleOauthCredentialsPath_();
    if (!file || !fs.existsSync(file)) {
        throw new Error("Google-OAuth-Datei nicht gefunden: C:\\serkal_dev\\serkal_private\\google_oauth_client.json");
    }
    const raw = JSON.parse(fs.readFileSync(file, "utf8"));
    const cfg = raw.installed || raw.web || raw;
    const clientId = String(cfg.client_id || "").trim();
    const clientSecret = String(cfg.client_secret || "").trim();
    if (!clientId) throw new Error("Google-OAuth-Datei enthält keine Client-ID.");
    return { clientId, clientSecret, file };
}

function googleOauthReadToken_() {
    try {
        const file = googleOauthTokenPath_();
        if (!fs.existsSync(file)) return null;
        const token = JSON.parse(fs.readFileSync(file, "utf8"));
        return token && typeof token === "object" ? token : null;
    } catch (_err) {
        return null;
    }
}

function googleOauthWriteToken_(token) {
    const file = googleOauthTokenPath_();
    fs.mkdirSync(path.dirname(file), { recursive:true });
    fs.writeFileSync(file, JSON.stringify(token, null, 2) + "\n", "utf8");
}

async function googleOauthTokenRequest_(params) {
    const response = await fetch("https://oauth2.googleapis.com/token", {
        method:"POST",
        headers:{ "content-type":"application/x-www-form-urlencoded" },
        body:new URLSearchParams(params)
    });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data || !data.access_token) {
        throw new Error((data && (data.error_description || data.error)) || "Google-Anmeldung fehlgeschlagen.");
    }
    return data;
}

async function googleOauthRefresh_(cfg, token) {
    if (!token || !token.refresh_token) return null;
    const data = await googleOauthTokenRequest_({
        client_id:cfg.clientId,
        client_secret:cfg.clientSecret,
        refresh_token:String(token.refresh_token),
        grant_type:"refresh_token"
    });
    const merged = Object.assign({}, token, data, {
        expiry_date:Date.now() + (Number(data.expires_in || 3600) * 1000)
    });
    googleOauthWriteToken_(merged);
    return merged;
}

function googleOauthBrowserLogin_(cfg) {
    return new Promise((resolve, reject) => {
        const state = crypto.randomBytes(24).toString("hex");
        const verifier = crypto.randomBytes(48).toString("base64url");
        const challenge = crypto.createHash("sha256").update(verifier).digest("base64url");
        let finished = false;
        let timeout = null;

        const finish = (err, token, server) => {
            if (finished) return;
            finished = true;
            if (timeout) clearTimeout(timeout);
            try { server.close(); } catch (_closeErr) {}
            if (err) reject(err);
            else resolve(token);
        };

        const server = http.createServer(async (req, res) => {
            try {
                const callback = new URL(req.url || "/", "http://127.0.0.1");
                if (callback.searchParams.get("state") !== state) {
                    res.writeHead(400, { "content-type":"text/plain; charset=utf-8" });
                    res.end("Ungültige Google-Anmeldung.");
                    return;
                }
                const oauthError = callback.searchParams.get("error");
                const code = callback.searchParams.get("code");
                if (oauthError || !code) {
                    res.writeHead(400, { "content-type":"text/html; charset=utf-8" });
                    res.end("<h2>SerKal wurde nicht mit Google verbunden.</h2><p>Dieses Fenster kann geschlossen werden.</p>");
                    finish(new Error(oauthError || "Google hat keinen Anmeldecode geliefert."), null, server);
                    return;
                }

                const redirectUri = "http://127.0.0.1:" + server.address().port;
                const data = await googleOauthTokenRequest_({
                    client_id:cfg.clientId,
                    client_secret:cfg.clientSecret,
                    code,
                    code_verifier:verifier,
                    grant_type:"authorization_code",
                    redirect_uri:redirectUri
                });
                const token = Object.assign({}, data, {
                    expiry_date:Date.now() + (Number(data.expires_in || 3600) * 1000)
                });
                googleOauthWriteToken_(token);
                res.writeHead(200, { "content-type":"text/html; charset=utf-8" });
                res.end("<!doctype html><meta charset='utf-8'><title>SerKal verbunden</title><body style='font:20px Arial;padding:40px;background:#f6f3ff;color:#172033'><h1>SerKal ist mit Google Kalender verbunden.</h1><p>Dieses Fenster kann jetzt geschlossen werden.</p></body>");
                finish(null, token, server);
            } catch (err) {
                try {
                    res.writeHead(500, { "content-type":"text/plain; charset=utf-8" });
                    res.end("SerKal-Google-Anmeldung fehlgeschlagen.");
                } catch (_responseErr) {}
                finish(err, null, server);
            }
        });

        server.on("error", err => finish(err, null, server));
        server.listen(0, "127.0.0.1", async () => {
            const redirectUri = "http://127.0.0.1:" + server.address().port;
            const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
            authUrl.searchParams.set("client_id", cfg.clientId);
            authUrl.searchParams.set("redirect_uri", redirectUri);
            authUrl.searchParams.set("response_type", "code");
            authUrl.searchParams.set("scope", GOOGLE_CALENDAR_SCOPE);
            authUrl.searchParams.set("access_type", "offline");
            authUrl.searchParams.set("prompt", "consent");
            authUrl.searchParams.set("state", state);
            authUrl.searchParams.set("code_challenge", challenge);
            authUrl.searchParams.set("code_challenge_method", "S256");
            try { await shell.openExternal(authUrl.toString()); }
            catch (err) { finish(err, null, server); }
        });

        timeout = setTimeout(() => {
            finish(new Error("Google-Anmeldung wurde nach fünf Minuten abgebrochen."), null, server);
        }, 5 * 60 * 1000);
    });
}

async function googleOauthAccessToken_() {
    const cfg = googleOauthClientConfig_();
    let token = googleOauthReadToken_();

    /* Ein alter 0.0.5-Token besitzt nur calendar.events.
       Damit kann Google zwar Termine bearbeiten, aber SerKal kann seinen
       Zielkalender nicht wie das Original selbst suchen oder anlegen.
       In diesem Fall einmalig eine neue Zustimmung anfordern. */
    if (token && !googleOauthTokenHasRequiredScope_(token)) {
        logWrite_("INFO", "GOOGLE",
            "Vorhandene Google-Anmeldung besitzt noch nicht die Berechtigung zur automatischen Kalenderwahl. Neuanmeldung wird geöffnet.",
            { vorhandeneScopes:String(token.scope || "") });
        token = null;
    }

    if (token && token.access_token && Number(token.expiry_date || 0) > Date.now() + 60000) {
        return String(token.access_token);
    }
    if (token && token.refresh_token) {
        try {
            token = await googleOauthRefresh_(cfg, token);
            return String(token.access_token);
        } catch (err) {
            console.warn("SERKAL Google-Token erneuern:", err);
        }
    }
    token = await googleOauthBrowserLogin_(cfg);
    return String(token.access_token);
}

async function googleCalendarJsonRequest_(method, url, body) {
    const accessToken = await googleOauthAccessToken_();
    const response = await fetch(url, {
        method,
        headers:{
            authorization:"Bearer " + accessToken,
            "content-type":"application/json"
        },
        body:body === undefined ? undefined : JSON.stringify(body)
    });
    const data = await response.json().catch(() => null);
    return { ok:response.ok, status:response.status, data };
}

/* Desktop-Entsprechung zu holeSerkalKalender_() aus modul5-kalender.gs.
   Der sichtbare Kalendername ist die fachliche Wahrheit; die technische
   Google-ID wird automatisch ermittelt und nur lokal zwischengespeichert. */
async function googleResolveSerkalCalendar_() {
    logWrite_("TRACE", "GOOGLE", "Automatische Suche nach Kalender SerKal gestartet", {});

    let pageToken = "";
    const matches = [];
    do {
        const listUrl = new URL("https://www.googleapis.com/calendar/v3/users/me/calendarList");
        listUrl.searchParams.set("maxResults", "250");
        listUrl.searchParams.set("showDeleted", "false");
        listUrl.searchParams.set("showHidden", "true");
        if (pageToken) listUrl.searchParams.set("pageToken", pageToken);

        const listResult = await googleCalendarJsonRequest_("GET", listUrl.toString());
        if (!listResult.ok) {
            const detail = listResult.data && listResult.data.error && listResult.data.error.message;
            logWrite_("ERROR", "GOOGLE", "Google-Kalenderliste konnte nicht gelesen werden", {
                httpStatus:listResult.status,
                googleMessage:String(detail || "")
            });
            throw new Error(detail || ("Google-Kalenderliste antwortete mit Fehler " + listResult.status + "."));
        }

        const items = Array.isArray(listResult.data && listResult.data.items) ?
            listResult.data.items : [];
        for (const item of items) {
            const visibleName = String(item && (item.summaryOverride || item.summary) || "").trim();
            if (visibleName.toLocaleLowerCase("de-DE") === "serkal") matches.push(item);
        }
        pageToken = String(listResult.data && listResult.data.nextPageToken || "");
    } while (pageToken);

    if (matches.length) {
        const roleRank = { owner:4, writer:3, reader:2, freeBusyReader:1 };
        const calendarRank = item => {
            const role = Number(roleRank[String(item && item.accessRole || "")] || 0);
            const visible = item && item.hidden === true ? 0 : 100;
            const selectedInUi = item && item.selected === true ? 50 : 0;
            return visible + selectedInUi + role;
        };
        matches.sort((a, b) => calendarRank(b) - calendarRank(a));
        const selected = matches[0];
        const calendarId = String(selected && selected.id || "").trim();
        if (!calendarId) throw new Error("Kalender SerKal wurde gefunden, besitzt aber keine Google-ID.");

        logWrite_("INFO", "GOOGLE", "Kalender SerKal automatisch gefunden", {
            kalender:googleCalendarIdForLog_(calendarId),
            zugriffsrolle:String(selected.accessRole || ""),
            sichtbar:selected.hidden !== true,
            inGoogleAusgewaehlt:selected.selected === true,
            treffer:matches.length,
            davonAusgeblendet:matches.filter(item => item && item.hidden === true).length
        });

        const settings = readSettings_();
        if (String(settings.calendar.googleCalendarId || "") !== calendarId) {
            settings.calendar.googleCalendarId = calendarId;
            writeSettings_(settings);
            logWrite_("INFO", "GOOGLE", "Ermittelte Kalender-ID lokal gespeichert", {
                kalender:googleCalendarIdForLog_(calendarId)
            });
        }
        return { id:calendarId, created:false, matches:matches.length };
    }

    logWrite_("INFO", "GOOGLE", "Kalender SerKal nicht vorhanden; Neuanlage beginnt", {});
    const createResult = await googleCalendarJsonRequest_(
        "POST",
        "https://www.googleapis.com/calendar/v3/calendars",
        {
            summary:"SerKal",
            description:"SerKal – Serienkalender",
            timeZone:Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Berlin"
        }
    );
    if (!createResult.ok) {
        const detail = createResult.data && createResult.data.error && createResult.data.error.message;
        logWrite_("ERROR", "GOOGLE", "Kalender SerKal konnte nicht angelegt werden", {
            httpStatus:createResult.status,
            googleMessage:String(detail || "")
        });
        throw new Error(detail || ("Google konnte den Kalender SerKal nicht anlegen (Fehler " + createResult.status + ")."));
    }

    const calendarId = String(createResult.data && createResult.data.id || "").trim();
    if (!calendarId) throw new Error("Google hat den Kalender SerKal ohne Kalender-ID angelegt.");

    const settings = readSettings_();
    settings.calendar.googleCalendarId = calendarId;
    writeSettings_(settings);
    logWrite_("INFO", "GOOGLE", "Kalender SerKal wurde angelegt und lokal gespeichert", {
        kalender:googleCalendarIdForLog_(calendarId)
    });
    return { id:calendarId, created:true, matches:0 };
}

function googleCalendarIdForLog_(calendarId) {
    const value = String(calendarId || "").trim();
    if (!value) return "(leer)";
    if (value.length <= 12) return value;
    return value.slice(0, 6) + "…" + value.slice(-6);
}

async function googleCalendarApi_(method, calendarId, eventId, event) {
    const trace = {
        method:String(method || ""),
        kalender:googleCalendarIdForLog_(calendarId),
        eventId:eventId ? String(eventId).slice(0, 18) + "…" : "(neu)",
        summary:event && event.summary ? String(event.summary) : ""
    };
    logWrite_("TRACE", "GOOGLE", "API-Aufruf vorbereitet", trace);
    try {
        const accessToken = await googleOauthAccessToken_();
        logWrite_("TRACE", "GOOGLE", "OAuth-Token für API-Aufruf verfügbar", {
            method:trace.method,
            kalender:trace.kalender,
            tokenVorhanden:Boolean(accessToken)
        });
        const base = "https://www.googleapis.com/calendar/v3/calendars/" +
            encodeURIComponent(calendarId) + "/events";
        const url = eventId ? (base + "/" + encodeURIComponent(eventId)) : base;
        const response = await fetch(url, {
            method,
            headers:{
                authorization:"Bearer " + accessToken,
                "content-type":"application/json"
            },
            body:event ? JSON.stringify(event) : undefined
        });
        const data = await response.json().catch(() => null);
        const googleMessage = data && data.error && data.error.message ?
            String(data.error.message) : "";
        logWrite_(response.ok ? "TRACE" : "ERROR", "GOOGLE", "API-Antwort erhalten", {
            method:trace.method,
            kalender:trace.kalender,
            eventId:trace.eventId,
            summary:trace.summary,
            httpStatus:response.status,
            ok:response.ok,
            googleMessage
        });
        return { ok:response.ok, status:response.status, data };
    } catch (err) {
        logWrite_("ERROR", "GOOGLE", "API-Aufruf mit Ausnahme abgebrochen", {
            method:trace.method,
            kalender:trace.kalender,
            eventId:trace.eventId,
            summary:trace.summary,
            fehler:String(err && err.message || err)
        });
        throw err;
    }
}

function googleCalendarEventSignature_(event) {
    const item = event || {};
    const privateData = item.extendedProperties && item.extendedProperties.private || {};
    const signatureSource = [
        String(item.summary || "").trim(),
        String(item.start && (item.start.date || item.start.dateTime) || "").slice(0, 10),
        String(item.end && (item.end.date || item.end.dateTime) || "").slice(0, 10),
        String(item.description || ""),
        String(privateData.tmdbId || ""),
        String(privateData.season || ""),
        String(privateData.episodeFrom || ""),
        String(privateData.episodeTo || "")
    ].join("|");
    return crypto.createHash("sha256").update(signatureSource).digest("hex");
}

function googleCalendarEventWasManuallyChanged_(event) {
    const privateData = event && event.extendedProperties && event.extendedProperties.private || {};
    const stored = String(privateData.serkalSignature || "");
    if (!stored) return true; // Altbestand: vorsichtshalber schützen.
    return stored !== googleCalendarEventSignature_(event);
}

async function googleCalendarFindSummaryAnywhere_(calendarId, summary) {
    const base = "https://www.googleapis.com/calendar/v3/calendars/" +
        encodeURIComponent(calendarId) + "/events";
    const url = new URL(base);
    url.searchParams.set("singleEvents", "true");
    url.searchParams.set("showDeleted", "false");
    url.searchParams.set("maxResults", "2500");
    url.searchParams.set("q", String(summary || "").trim());

    const result = await googleCalendarJsonRequest_("GET", url.toString());
    if (!result.ok) {
        const detail = result.data && result.data.error && result.data.error.message;
        throw new Error(detail || ("Google-Termine konnten nicht kalenderweit geprüft werden (" + result.status + ")."));
    }
    const wanted = String(summary || "").trim();
    return (Array.isArray(result.data && result.data.items) ? result.data.items : [])
        .filter(item => String(item && item.summary || "").trim() === wanted &&
            String(item && item.status || "") !== "cancelled");
}

async function googleCalendarFindExactEvents_(calendarId, summary, dateIso) {
    const base = "https://www.googleapis.com/calendar/v3/calendars/" +
        encodeURIComponent(calendarId) + "/events";
    const url = new URL(base);
    url.searchParams.set("singleEvents", "true");
    url.searchParams.set("showDeleted", "false");
    url.searchParams.set("timeMin", dateIso + "T00:00:00Z");
    url.searchParams.set("timeMax", calendarIcsNextDay_(dateIso) + "T00:00:00Z");
    url.searchParams.set("maxResults", "250");

    const result = await googleCalendarJsonRequest_("GET", url.toString());
    if (!result.ok) {
        const detail = result.data && result.data.error && result.data.error.message;
        throw new Error(detail || ("Google-Termine konnten nicht geprüft werden (" + result.status + ")."));
    }

    const wantedSummary = String(summary || "").trim();
    return (Array.isArray(result.data && result.data.items) ? result.data.items : [])
        .filter(item => {
            const itemSummary = String(item && item.summary || "").trim();
            const itemDate = String(item && item.start && (item.start.date || item.start.dateTime) || "").slice(0, 10);
            return itemSummary === wantedSummary && itemDate === dateIso && String(item && item.status || "") !== "cancelled";
        })
        .sort((a, b) => String(a && a.created || "").localeCompare(String(b && b.created || "")));
}

function googleCalendarEventId_(payload, block) {
    const identity = [
        Number(payload.tmdbId || payload.id || 0) || 0,
        Number(payload.staffelOverride || payload.staffelNummer || payload.seasonNumber || 0) || 0,
        Number(block.eFrom || 0),
        Number(block.eTo || block.eFrom || 0)
    ].join(":");
    return "serkal" + crypto.createHash("sha1").update(identity).digest("hex");
}

function googleCalendarEventIdCandidates_(payload, block) {
    const baseId = googleCalendarEventId_(payload, block);
    return Array.from({length:10}, (_unused, index) => index ? (baseId + String(index)) : baseId);
}

async function googleCalendarInsertSeason_(payload) {
    try {
        const data = payload || {};
        const title = String(data.titel || data.title || data.name || "").trim();
        const year = String(data.jahrOverride || data.jahr || data.year || "").trim();
        const seasonNumber = Number(data.staffelOverride || data.staffelNummer || data.seasonNumber ||
            String(data.staffelLabel || data.seasonLabel || "").replace(/\D/g, ""));
        const dates = (Array.isArray(data.termindaten) ? data.termindaten :
            (Array.isArray(data.episodeDates) ? data.episodeDates : []))
            .map(value => String(value || "").trim())
            .filter(value => /^\d{4}-\d{2}-\d{2}$/.test(value));

        logWrite_("TRACE", "KAL", "Kalenderverarbeitung gestartet", {
            titel:title,
            jahr:year,
            staffel:seasonNumber,
            tmdbId:Number(data.tmdbId || data.id || 0) || null,
            termine:dates.length,
            ersterTermin:dates[0] || "",
            letzterGelieferterTermin:dates.length ? dates[dates.length - 1] : ""
        });

        /*
         * Originalregel aus SerKal 2.5 / modul5-kalender.gs:
         * Erst die letzte echte Episode bestimmen. Liegt sie vor dem
         * aktuellen Jahr, wird Google ueberhaupt nicht angesprochen.
         * Liegt sie im aktuellen Jahr oder spaeter, wird die ganze Staffel
         * eingetragen. Diese Pruefung muss vor Kalender-ID und OAuth stehen.
         */
        if (!title || !/^\d{4}$/.test(year) || !seasonNumber || !dates.length) {
            return { ok:false, message:"Kalendereintrag unvollständig.", reason:"invalid_input" };
        }

        let lastDate = null;
        let lastIso = "";
        for (const iso of dates) {
            const parsed = new Date(iso + "T00:00:00");
            if (Number.isNaN(parsed.getTime())) continue;
            if (!lastDate || parsed.getTime() > lastDate.getTime()) {
                lastDate = parsed;
                lastIso = iso;
            }
        }
        if (!lastDate) {
            return { ok:false, message:"Keine gültigen Kalendertage vorhanden.", reason:"no_valid_dates" };
        }

        const currentYear = new Date().getFullYear();
        if (lastDate.getFullYear() < currentYear) {
            logWrite_("INFO", "KAL",
                "Kalender-Eintrag übersprungen: letzte Episode liegt vor dem aktuellen Jahr.",
                {
                    titel:title,
                    jahr:year,
                    staffel:"S" + calendarPad2_(seasonNumber),
                    lastDate:lastIso,
                    currentYear
                });
            return {
                ok:true,
                mode:"google",
                skipped:true,
                reason:"past_season",
                created:0,
                updated:0,
                events:0,
                lastDate:lastIso,
                currentYear
            };
        }

        const settings = readSettings_();
        logWrite_("TRACE", "KAL", "Google-Ziel vor Eintrag wird automatisch ermittelt", {
            kalenderModus:String(settings && settings.calendar && settings.calendar.mode || ""),
            bisherGespeichert:googleCalendarIdForLog_(settings && settings.calendar && settings.calendar.googleCalendarId),
            letzterTermin:lastIso,
            aktuellesJahr:currentYear
        });
        const resolvedCalendar = await googleResolveSerkalCalendar_();
        const calendarId = String(resolvedCalendar.id || "").trim();

        const seasonLabel = "S" + calendarPad2_(seasonNumber);
        const blocks = calendarBlocks_(dates);
        logWrite_("TRACE", "KAL", "Terminblöcke für Google erzeugt", {
            titel:title,
            staffel:seasonLabel,
            blockAnzahl:blocks.length,
            bloecke:blocks.map(block => ({
                datum:block.date,
                episodeVon:block.eFrom,
                episodeBis:block.eTo
            }))
        });
        let created = 0;
        let updated = 0;
        let duplicatesRemoved = 0;
        let protectedEvents = 0;

        for (const block of blocks) {
            logWrite_("TRACE", "KAL", "Google-Terminblock beginnt", {
                datum:block.date,
                episodeVon:block.eFrom,
                episodeBis:block.eTo
            });
            const summary = title + " (" + year + ") " + seasonLabel + "E" + calendarPad2_(block.eFrom) +
                (block.eTo !== block.eFrom ? ("–E" + calendarPad2_(block.eTo)) : "");
            const eventBase = {
                summary,
                description:"SerKal",
                start:{ date:block.date },
                end:{ date:calendarIcsNextDay_(block.date) },
                transparency:"transparent",
                extendedProperties:{ private:{
                    serkal:"1",
                    tmdbId:String(data.tmdbId || data.id || ""),
                    season:seasonLabel,
                    episodeFrom:String(block.eFrom),
                    episodeTo:String(block.eTo)
                } }
            };
            eventBase.extendedProperties.private.serkalSignature =
                googleCalendarEventSignature_(eventBase);

            /*
             * Wichtig: Alte SerKal-Versionen haben andere Google-Event-IDs
             * verwendet. Deshalb vor einer Neuanlage fachlich nach dem
             * exakten Titel am exakten Tag suchen.
             */
            const exactEvents = await googleCalendarFindExactEvents_(calendarId, summary, block.date);
            if (exactEvents.length) {
                const keep = exactEvents[0];
                const keepId = String(keep && keep.id || "");
                if (!keepId) throw new Error("Vorhandener Google-Termin besitzt keine Event-ID.");

                /*
                 * Vorhanden heißt unantastbar. Es erfolgt kein PUT.
                 * Bei exakten Doppelungen bleibt der älteste Termin stehen.
                 */
                for (const duplicate of exactEvents.slice(1)) {
                    const duplicateId = String(duplicate && duplicate.id || "");
                    if (!duplicateId || duplicateId === keepId) continue;
                    const deleteResult = await googleCalendarApi_("DELETE", calendarId, duplicateId, null);
                    if (!deleteResult.ok && deleteResult.status !== 404 && deleteResult.status !== 410) {
                        const detail = deleteResult.data && deleteResult.data.error && deleteResult.data.error.message;
                        throw new Error(detail || ("Doppeltermin konnte nicht entfernt werden (" + deleteResult.status + ")."));
                    }
                    duplicatesRemoved++;
                    logWrite_("INFO", "WARTUNG", "Exakter Kalender-Doppeltermin entfernt", {
                        titel:summary,
                        datum:block.date,
                        behalten:keepId.slice(0, 18) + "…",
                        entfernt:duplicateId.slice(0, 18) + "…"
                    });
                }
                continue;
            }

            /*
             * Gleicher Termintext an einem anderen Tag bedeutet regelmäßig:
             * Kurt hat den Termin händisch verschoben. Nicht zurücksetzen.
             */
            const sameSummaryElsewhere = await googleCalendarFindSummaryAnywhere_(calendarId, summary);
            if (sameSummaryElsewhere.length) {
                protectedEvents++;
                logWrite_("INFO", "WARTUNG", "Kalendertermin als händisch verschoben geschützt", {
                    titel:summary,
                    archivDatum:block.date,
                    kalenderDatum:String(sameSummaryElsewhere[0] && sameSummaryElsewhere[0].start &&
                        (sameSummaryElsewhere[0].start.date || sameSummaryElsewhere[0].start.dateTime) || "").slice(0, 10)
                });
                continue;
            }

            let stored = false;
            for (const eventId of googleCalendarEventIdCandidates_(data, block)) {
                const event = Object.assign({id:eventId}, eventBase);
                let result = await googleCalendarApi_("POST", calendarId, "", event);
                if (result.ok) {
                    created++;
                    stored = true;
                    break;
                }
                if (result.status !== 409) {
                    const detail = result.data && (result.data.error && result.data.error.message || result.data.error_description);
                    throw new Error(detail || ("Google Kalender antwortete mit Fehler " + result.status + "."));
                }

                const existingResult = await googleCalendarApi_("GET", calendarId, eventId, null);
                if (existingResult.ok && existingResult.data) {
                    if (googleCalendarEventWasManuallyChanged_(existingResult.data)) {
                        protectedEvents++;
                        stored = true;
                        logWrite_("INFO", "WARTUNG", "Kalendertermin wegen manueller Änderung geschützt", {
                            titel:summary,
                            eventId:eventId.slice(0, 18) + "…"
                        });
                        break;
                    }

                    result = await googleCalendarApi_("PUT", calendarId, eventId, eventBase);
                    if (result.ok) {
                        updated++;
                        stored = true;
                        break;
                    }
                    if (result.status === 404 || result.status === 410) continue;
                } else if (existingResult.status === 404 || existingResult.status === 410) {
                    continue;
                }

                const detail = (result.data && (result.data.error && result.data.error.message || result.data.error_description)) ||
                    (existingResult.data && existingResult.data.error && existingResult.data.error.message);
                throw new Error(detail || ("Google Kalender antwortete mit Fehler " + (result.status || existingResult.status) + "."));
            }
            if (!stored) {
                throw new Error("Der frühere Google-Termin ist gelöscht und konnte nicht neu angelegt werden.");
            }
        }

        return { ok:true, mode:"google", created, updated, duplicatesRemoved, protectedEvents, events:blocks.length, calendarId };
    } catch (err) {
        logWrite_("ERROR", "KAL", "Google-Kalendereintrag endgültig fehlgeschlagen", {
            fehler:String(err && err.message || err)
        });
        return googleCalendarPublicFailure_({ action:"insert" });
    }
}

let maintenanceRunning_ = false;
let maintenanceStatus_ = {
    ok:true,
    phase:"bereit",
    text:"Wartung ist bereit.",
    datei:"",
    nr:0,
    gesamt:0
};

function maintenanceSetStatus_(phase, textValue, entry, nr, total) {
    maintenanceStatus_ = {
        ok:phase !== "fehler",
        phase:String(phase || ""),
        text:String(textValue || ""),
        datei:String(entry && entry.fileName || ""),
        fileName:String(entry && entry.fileName || ""),
        nr:Number(nr || 0),
        gesamt:Number(total || 0)
    };
    return maintenanceStatus_;
}

function maintenanceGetStatus_() {
    return Object.assign({}, maintenanceStatus_, { running:maintenanceRunning_ });
}

/*
 * Desktop-Port des alten Modul-10-Grundgedankens.
 *
 * Sicherheitsreihenfolge:
 *   1. Archiv nur lesen und eindeutige TMDB-IDs sammeln.
 *   2. Einen gemeinsamen TMDB-Pruefbestand im Arbeitsspeicher aufbauen.
 *   3. Gueltige Cache-Daten wiederverwenden; nur faellige Serien abfragen.
 *   4. Archiv/TMDB vergleichen und Abweichungen protokollieren.
 *   5. Nur vollstaendige, ungeschuetzte Abweichungen kontrolliert uebernehmen.
 *
 * Unvollstaendige TMDB-Daten und manuell geschuetzte Eintraege bleiben
 * unangetastet. Vor jeder Archiv-Aenderung wird der Originalinhalt gehalten
 * und bei einem Kalenderfehler wiederhergestellt.
 */

const MAINTENANCE_CACHE_VERSION = 1;
const MAINTENANCE_MAX_PARALLEL = 3;
const MAINTENANCE_DAY_MS = 24 * 60 * 60 * 1000;

function maintenanceCachePath_() {
    return path.join(app.getPath("userData"), "maintenance_tmdb_cache.json");
}

function maintenanceReadCache_() {
    try {
        const file = maintenanceCachePath_();
        if (!fs.existsSync(file)) return { version:MAINTENANCE_CACHE_VERSION, series:{} };
        const data = JSON.parse(fs.readFileSync(file, "utf8"));
        if (!data || typeof data !== "object" || !data.series || typeof data.series !== "object") {
            return { version:MAINTENANCE_CACHE_VERSION, series:{} };
        }
        return { version:MAINTENANCE_CACHE_VERSION, series:data.series };
    } catch (err) {
        logWrite_("WARN", "WARTUNG", "TMDB-Wartungscache konnte nicht gelesen werden", {
            fehler:String(err && err.message || err)
        });
        return { version:MAINTENANCE_CACHE_VERSION, series:{} };
    }
}

function maintenanceWriteCache_(cache) {
    const file = maintenanceCachePath_();
    fs.mkdirSync(path.dirname(file), { recursive:true });
    fs.writeFileSync(file, JSON.stringify({
        version:MAINTENANCE_CACHE_VERSION,
        updatedAt:new Date().toISOString(),
        series:cache && cache.series || {}
    }, null, 2) + "\n", "utf8");
}

function maintenanceSeasonNumber_(entry) {
    return Number(String(entry && (entry.staffelLabel || entry.seasonLabel || entry.staffel) || "").replace(/\D/g, "")) || 0;
}

function maintenanceLastDate_(entries) {
    let last = "";
    for (const entry of Array.isArray(entries) ? entries : []) {
        const dates = Array.isArray(entry && entry.termindaten) ? entry.termindaten : [];
        for (const value of dates) {
            const date = String(value || "");
            if (/^\d{4}-\d{2}-\d{2}$/.test(date) && date > last) last = date;
        }
    }
    return last;
}

function maintenanceCacheMaxAgeMs_(entries) {
    const last = maintenanceLastDate_(entries);
    const today = new Date().toISOString().slice(0, 10);
    const currentYear = new Date().getFullYear();

    if (last && last >= today) return MAINTENANCE_DAY_MS;
    if (last && Number(last.slice(0, 4)) >= currentYear - 1) return 7 * MAINTENANCE_DAY_MS;
    return 90 * MAINTENANCE_DAY_MS;
}

function maintenanceCacheIsFresh_(cached, entries) {
    const fetchedAt = Date.parse(String(cached && cached.fetchedAt || ""));
    return Number.isFinite(fetchedAt) &&
        (Date.now() - fetchedAt) >= 0 &&
        (Date.now() - fetchedAt) < maintenanceCacheMaxAgeMs_(entries);
}

function maintenanceGroups_(entries) {
    const groups = new Map();
    const withoutTmdbId = [];

    for (const entry of Array.isArray(entries) ? entries : []) {
        const tmdbId = Number(entry && entry.tmdbId || 0);
        if (!tmdbId) {
            withoutTmdbId.push(entry);
            continue;
        }
        const key = String(tmdbId);
        if (!groups.has(key)) groups.set(key, { tmdbId, entries:[] });
        groups.get(key).entries.push(entry);
    }

    return { groups:Array.from(groups.values()), withoutTmdbId };
}

function maintenanceDatesEqual_(left, right) {
    const a = (Array.isArray(left) ? left : []).map(String);
    const b = (Array.isArray(right) ? right : []).map(String);
    return a.length === b.length && a.every((value, index) => value === b[index]);
}

function maintenanceEntryDates_(entry) {
    return Array.isArray(entry && entry.datesOriginal) && entry.datesOriginal.length
        ? entry.datesOriginal.map(String)
        : (Array.isArray(entry && entry.termindaten) ? entry.termindaten.map(String) : []);
}

function maintenanceSeasonIsComplete_(analysed) {
    const count = Number(analysed && analysed.episodeCount || 0);
    const dates = Array.isArray(analysed && analysed.episodeDates) ? analysed.episodeDates : [];
    return count > 0 && dates.length === count &&
        dates.every(value => /^\d{4}-\d{2}-\d{2}$/.test(String(value || "")));
}

// Originalregel aus SerKal 2.5:
// unvollstaendige oder noch laufende letzte Archivstaffel verhindert eine
// automatische Uebernahme der naechsten Staffel.
function maintenanceArchiveLatestSeasonRunning_(entries, maxSeason) {
    const today = new Date().toISOString().slice(0, 10);
    for (const entry of Array.isArray(entries) ? entries : []) {
        if (maintenanceSeasonNumber_(entry) !== Number(maxSeason || 0)) continue;
        const episodeCount = Number(entry && (entry.episoden || entry.eps) || 0);
        const dates = maintenanceEntryDates_(entry);
        if (episodeCount && dates.length && dates.length < episodeCount) return true;
        if (!dates.length) return true;
        const last = String(dates[dates.length - 1] || "");
        if (/^\d{4}-\d{2}-\d{2}$/.test(last) && last >= today) return true;
    }
    return false;
}

function maintenanceAnalyse_(groups, snapshot) {
    const findings = [];

    for (const group of groups) {
        const record = snapshot.get(String(group.tmdbId));
        if (!record || record.ok === false || !record.tv) continue;

        const tv = record.tv;
        const title = String(tv.name || group.entries[0] && group.entries[0].titel || "");
        const maxArchiveSeason = group.entries.reduce((max, entry) =>
            Math.max(max, maintenanceSeasonNumber_(entry)), 0);
        const maxTmdbSeason = Number(tv.number_of_seasons || 0) || 0;

        if (maxTmdbSeason > maxArchiveSeason) {
            const seasonRecord = record.seasons && record.seasons[String(maxTmdbSeason)];
            const seasonData = seasonRecord && seasonRecord.ok && seasonRecord.data
                ? seasonRecord.data : null;
            const analysed = seasonData ? analyseSeason_(seasonData) : null;
            const episodeCount = Number(analysed && analysed.episodeCount || 0);
            // Schutz gegen vorläufige TMDB-Platzhalter:
            // 1 Episode + 1 Termin ist formal vollständig, aber für eine neu
            // angekündigte Staffel noch kein belastbarer Staffelbestand.
            const complete = maintenanceSeasonIsComplete_(analysed) && episodeCount > 1;
            const previousRunning = maintenanceArchiveLatestSeasonRunning_(group.entries, maxArchiveSeason);
            let type = "NEW_SEASON_ANNOUNCED";
            let action = "observe";
            let reason = episodeCount === 1
                ? "Staffel besitzt bei TMDB bisher nur eine vorläufig erfasste Episode und bleibt unter Beobachtung."
                : "Staffel ist angekündigt, aber TMDB liefert noch keine vollständigen Episoden und Termine.";

            if (complete && previousRunning) {
                type = "NEW_SEASON_REVIEW";
                action = "review";
                reason = "Neue Staffel ist vollständig, aber die bisher letzte Archivstaffel wirkt noch laufend.";
            } else if (complete) {
                type = "NEW_SEASON_READY";
                action = "apply";
                reason = "Neue Staffel besitzt für jede Episode einen vollständigen TMDB-Termin.";
            }

            findings.push({
                type,
                action,
                reason,
                tmdbId:group.tmdbId,
                title,
                fileName:String(group.entries[0] && group.entries[0].fileName || ""),
                archiveSeason:maxArchiveSeason,
                tmdbSeason:maxTmdbSeason,
                episodeCount:Number(analysed && analysed.episodeCount || 0),
                dateCount:Array.isArray(analysed && analysed.episodeDates) ? analysed.episodeDates.length : 0,
                previousSeasonRunning:previousRunning
            });
        }

        for (const entry of group.entries) {
            const seasonNumber = maintenanceSeasonNumber_(entry);
            const season = record.seasons && record.seasons[String(seasonNumber)];
            if (!season || season.ok === false || !season.data) continue;

            const analysed = analyseSeason_(season.data);
            const seasonComplete = maintenanceSeasonIsComplete_(analysed);
            const flags = Number(entry.manualFlags || 0);
            const archiveEpisodes = Number(entry && (entry.episoden || entry.eps) || 0);

            if (analysed.episodeCount && analysed.episodeCount !== archiveEpisodes) {
                const manualProtected = Boolean(flags & SERKAL_MANUAL_EPISODES);
                findings.push({
                    type:manualProtected ? "EPISODE_COUNT_PROTECTED" : "EPISODE_COUNT_READY",
                    action:manualProtected ? "protected" : (seasonComplete ? "apply" : "observe"),
                    reason:manualProtected
                        ? "Episodenzahl wurde manuell geschützt und bleibt unangetastet."
                        : (seasonComplete
                            ? "Vollständige TMDB-Staffel weicht bei der Episodenzahl ab."
                            : "TMDB-Staffel ist noch unvollständig; keine Änderung."),
                    tmdbId:group.tmdbId,
                    title,
                    fileName:String(entry.fileName || ""),
                    seasonNumber,
                    archiveValue:archiveEpisodes,
                    tmdbValue:analysed.episodeCount,
                    manualProtected,
                    tmdbComplete:seasonComplete
                });
            }

            const archiveDates = maintenanceEntryDates_(entry);
            if (analysed.episodeDates.length && !maintenanceDatesEqual_(archiveDates, analysed.episodeDates)) {
                const manualProtected = Boolean(flags & SERKAL_MANUAL_CALENDAR);
                findings.push({
                    type:manualProtected ? "DATES_PROTECTED" : "DATES_READY",
                    action:manualProtected ? "protected" : (seasonComplete ? "apply" : "observe"),
                    reason:manualProtected
                        ? "Kalendertermine wurden manuell geschützt und bleiben unangetastet."
                        : (seasonComplete
                            ? "Vollständige TMDB-Termine weichen vom Archiv ab."
                            : "TMDB-Termine sind noch unvollständig; keine Änderung."),
                    tmdbId:group.tmdbId,
                    title,
                    fileName:String(entry.fileName || ""),
                    seasonNumber,
                    archiveCount:archiveDates.length,
                    tmdbCount:analysed.episodeDates.length,
                    archiveDates,
                    tmdbDates:analysed.episodeDates.map(String),
                    manualProtected,
                    tmdbComplete:seasonComplete
                });
            }
        }
    }

    return findings;
}

function maintenanceOperationKey_(tmdbId, seasonNumber) {
    return String(Number(tmdbId || 0)) + ":" + String(Number(seasonNumber || 0));
}

function maintenanceBuildOperations_(groups, snapshot, findings) {
    const operations = new Map();
    const groupsByTmdb = new Map(groups.map(group => [String(group.tmdbId), group]));

    for (const finding of Array.isArray(findings) ? findings : []) {
        if (String(finding && finding.action || "") !== "apply") continue;
        const tmdbId = Number(finding.tmdbId || 0);
        const seasonNumber = Number(finding.tmdbSeason || finding.seasonNumber || 0);
        const group = groupsByTmdb.get(String(tmdbId));
        const record = snapshot.get(String(tmdbId));
        const seasonRecord = record && record.seasons && record.seasons[String(seasonNumber)];
        if (!group || !record || !seasonRecord || !seasonRecord.ok || !seasonRecord.data) continue;

        const analysed = analyseSeason_(seasonRecord.data);
        if (!maintenanceSeasonIsComplete_(analysed)) continue;
        const existing = group.entries.find(entry => maintenanceSeasonNumber_(entry) === seasonNumber) || null;
        const base = existing || group.entries[0];
        if (!base) continue;

        const key = maintenanceOperationKey_(tmdbId, seasonNumber);
        if (operations.has(key)) continue;
        operations.set(key, {
            key,
            isNew:!existing,
            entry:existing,
            fileName:String(base.fileName || archiveFileName_(base.titel, base.jahr)),
            payload:{
                titel:String(base.titel || record.tv && record.tv.name || ""),
                jahr:String(base.jahr || base.year || ""),
                staffelNummer:seasonNumber,
                tmdbId,
                episoden:Number(analysed.episodeCount || 0),
                termindaten:analysed.episodeDates.map(String),
                descDE:!existing ? String(record.tv && record.tv.overview || "") : ""
            },
            findingTypes:[]
        });
    }

    for (const finding of Array.isArray(findings) ? findings : []) {
        if (String(finding && finding.action || "") !== "apply") continue;
        const operation = operations.get(maintenanceOperationKey_(
            finding.tmdbId,
            finding.tmdbSeason || finding.seasonNumber
        ));
        if (operation) operation.findingTypes.push(String(finding.type || ""));
    }
    return Array.from(operations.values());
}

function maintenanceArchiveSnapshot_(operation) {
    const folder = archiveFolderPath_();
    if (!folder || !archiveEnsureFolder_(folder)) throw new Error("Archivordner nicht gefunden: " + folder);
    const fileName = String(operation && operation.fileName || "");
    if (!fileName || path.basename(fileName) !== fileName) throw new Error("Ungültiger Archivdateiname.");
    const fullPath = path.join(folder, fileName);
    return {
        fullPath,
        existed:fs.existsSync(fullPath),
        content:fs.existsSync(fullPath) ? fs.readFileSync(fullPath, "utf8") : ""
    };
}

function maintenanceRestoreArchive_(snapshot) {
    if (!snapshot) return;
    if (snapshot.existed) {
        fs.writeFileSync(snapshot.fullPath, snapshot.content, "utf8");
    } else if (fs.existsSync(snapshot.fullPath)) {
        fs.unlinkSync(snapshot.fullPath);
    }
}

function maintenanceWriteArchive_(operation) {
    if (operation.isNew) {
        const inserted = archiveInsert_(operation.payload);
        if (!inserted || inserted.ok === false) {
            throw new Error(String(inserted && inserted.message || "Neue Staffel konnte nicht gespeichert werden."));
        }
        return inserted;
    }

    const snapshot = maintenanceArchiveSnapshot_(operation);
    const label = "S" + String(operation.payload.staffelNummer).padStart(2, "0");
    const lines = snapshot.content.split(/\r?\n/);
    const index = lines.findIndex(line => new RegExp("^" + label + "(?:\\b|;|\\|)", "i")
        .test(String(line || "").trim()));
    if (index < 0) throw new Error("Staffel nicht gefunden: " + operation.fileName + " / " + label);

    let line = String(lines[index] || "").trim();
    line = archiveSetField_(line, "eps", String(operation.payload.episoden));
    line = archiveSetField_(line, "startOriginal", String(operation.payload.termindaten[0] || ""));
    line = archiveSetField_(line, "dates", archiveCompactDates_(operation.payload.termindaten).join(","));
    lines[index] = line;
    const tempPath = snapshot.fullPath + ".serkal-maint-tmp";
    fs.writeFileSync(tempPath, lines.join("\n").replace(/\n*$/, "\n"), "utf8");
    fs.renameSync(tempPath, snapshot.fullPath);
    return { ok:true, fileName:operation.fileName, staffelLabel:label };
}

async function googleCalendarManagedEvents_(calendarId, includeLegacy) {
    const all = [];
    let pageToken = "";
    do {
        const base = "https://www.googleapis.com/calendar/v3/calendars/" +
            encodeURIComponent(calendarId) + "/events";
        const url = new URL(base);
        url.searchParams.set("singleEvents", "true");
        url.searchParams.set("showDeleted", "false");
        url.searchParams.set("maxResults", "2500");
        /*
         * Normale Wartung arbeitet nur mit eindeutig von SerKal markierten
         * Terminen. Die Dublettenbereinigung muss zusätzlich den Altbestand
         * sehen, dessen Termine diese Markierung noch nicht besaßen.
         */
        if (!includeLegacy) {
            url.searchParams.append("privateExtendedProperty", "serkal=1");
        }
        if (pageToken) url.searchParams.set("pageToken", pageToken);
        const result = await googleCalendarJsonRequest_("GET", url.toString());
        if (!result.ok) {
            const detail = result.data && result.data.error && result.data.error.message;
            throw new Error(detail || ("Google-Termine konnten nicht geprüft werden (" + result.status + ")."));
        }
        all.push(...(Array.isArray(result.data && result.data.items) ? result.data.items : []));
        pageToken = String(result.data && result.data.nextPageToken || "");
    } while (pageToken);

    return all;
}

async function googleCalendarManagedSeasonEvents_(calendarId, tmdbId, seasonNumber) {
    const seasonLabel = "S" + calendarPad2_(seasonNumber);
    const all = await googleCalendarManagedEvents_(calendarId);
    return all.filter(event => {
        const privateData = event && event.extendedProperties && event.extendedProperties.private || {};
        return String(privateData.tmdbId || "") === String(tmdbId) &&
            String(privateData.season || "").toUpperCase() === seasonLabel;
    });
}

function maintenanceCalendarDuplicateKey_(event) {
    const date = String(event && event.start &&
        (event.start.date || event.start.dateTime) || "").slice(0, 10);
    const rawSummary = String(event && event.summary || "");
    const summary = rawSummary
        .normalize("NFKC")
        .replace(/[\u2010-\u2015\u2212]/g, "-")
        .replace(/\s+/g, " ")
        .trim()
        .toLocaleLowerCase("de-DE");
    return date && summary ? (summary + "|" + date) : "";
}

async function maintenanceCleanupCalendarDuplicates_() {
    const settings = readSettings_();
    if (String(settings && settings.calendar && settings.calendar.mode || "").toLowerCase() !== "google") {
        return { ok:true, removed:0, protected:0, skipped:true };
    }
    const resolved = await googleResolveSerkalCalendar_();
    const calendarId = String(resolved.id || "").trim();
    // Der eigene SerKal-Kalender darf Alttermine ohne serkal=1 enthalten.
    const events = await googleCalendarManagedEvents_(calendarId, true);
    const groups = new Map();
    for (const event of events) {
        const key = maintenanceCalendarDuplicateKey_(event);
        if (!key) continue;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(event);
    }

    const duplicateGroups = Array.from(groups.values())
        .filter(items => items.length > 1);
    logWrite_("INFO", "WARTUNG", "Kalender-Dublettenprüfung", {
        kalenderTermine:events.length,
        vergleichbareTermine:Array.from(groups.values()).reduce((sum, items) => sum + items.length, 0),
        doppelgruppen:duplicateGroups.length,
        doppeltermine:duplicateGroups.reduce((sum, items) => sum + items.length - 1, 0)
    });

    let removed = 0;
    let protectedCount = 0;
    for (const duplicates of groups.values()) {
        if (duplicates.length < 2) continue;
        duplicates.sort((a, b) => String(a && a.created || "").localeCompare(String(b && b.created || "")));
        /*
         * Eine vorhandene SerKal-Signatur, die nicht mehr zum Termin passt,
         * beweist eine händische Änderung und hat Vorrang. Fehlende Signaturen
         * kennzeichnen dagegen auch den SerKal-Altbestand und dürfen bei einer
         * exakten Dublette nicht pauschal jede Bereinigung blockieren.
         */
        const manual = duplicates.filter(event => {
            const privateData = event && event.extendedProperties && event.extendedProperties.private || {};
            const stored = String(privateData.serkalSignature || "");
            return !!stored && googleCalendarEventWasManuallyChanged_(event);
        });
        const keep = manual[0] || duplicates[0];
        for (const event of duplicates) {
            if (event === keep) continue;
            const privateData = event && event.extendedProperties && event.extendedProperties.private || {};
            const stored = String(privateData.serkalSignature || "");
            if (stored && googleCalendarEventWasManuallyChanged_(event)) {
                protectedCount++;
                continue;
            }
            const eventId = String(event && event.id || "");
            if (!eventId) continue;
            const deleted = await googleCalendarApi_("DELETE", calendarId, eventId, null);
            if (!deleted.ok && deleted.status !== 404 && deleted.status !== 410) {
                const detail = deleted.data && deleted.data.error && deleted.data.error.message;
                throw new Error(detail || "Kalender-Doppeltermin konnte nicht entfernt werden.");
            }
            removed++;
            logWrite_("INFO", "WARTUNG", "Exakter Kalender-Doppeltermin bereinigt", {
                titel:String(event.summary || ""),
                datum:String(event.start && (event.start.date || event.start.dateTime) || "").slice(0, 10),
                entfernt:eventId.slice(0, 18) + "…"
            });
        }
    }
    return { ok:true, removed, protected:protectedCount, skipped:false };
}

async function maintenanceSyncCalendar_(operation) {
    const settings = readSettings_();
    const mode = String(settings && settings.calendar && settings.calendar.mode || "none").toLowerCase();
    if (mode !== "google") {
        return { ok:true, skipped:true, reason:mode === "ics" ? "ics_requires_export" : "calendar_disabled", created:0, updated:0, removed:0 };
    }

    const dates = operation.payload.termindaten;
    const lastDate = dates.length ? dates[dates.length - 1] : "";
    if (Number(lastDate.slice(0, 4)) < new Date().getFullYear()) {
        return { ok:true, skipped:true, reason:"past_season", created:0, updated:0, removed:0 };
    }

    const resolved = await googleResolveSerkalCalendar_();
    const calendarId = String(resolved.id || "").trim();
    const existing = await googleCalendarManagedSeasonEvents_(
        calendarId,
        operation.payload.tmdbId,
        operation.payload.staffelNummer
    );

    // Eine händische Änderung im Google-Kalender ist die Ultima Ratio:
    // Dann bleibt die komplette Staffel in Archiv und Kalender unberührt.
    const manuallyChanged = existing.filter(googleCalendarEventWasManuallyChanged_);
    if (manuallyChanged.length) {
        return { ok:true, skipped:true, protected:true, reason:"manual_calendar_change", created:0, updated:0, removed:0 };
    }

    const wanted = new Set(calendarBlocks_(dates).map(block => [
        String(block.eFrom), String(block.eTo), String(block.date)
    ].join("|")));
    let removed = 0;
    for (const event of existing) {
        const privateData = event.extendedProperties && event.extendedProperties.private || {};
        const eventDate = String(event.start && (event.start.date || event.start.dateTime) || "").slice(0, 10);
        const key = [String(privateData.episodeFrom || ""), String(privateData.episodeTo || ""), eventDate].join("|");
        if (wanted.has(key)) continue;
        const eventId = String(event.id || "");
        if (!eventId) continue;
        const deleted = await googleCalendarApi_("DELETE", calendarId, eventId, null);
        if (!deleted.ok && deleted.status !== 404 && deleted.status !== 410) {
            const detail = deleted.data && deleted.data.error && deleted.data.error.message;
            throw new Error(detail || "Veralteter SerKal-Termin konnte nicht entfernt werden.");
        }
        removed++;
    }

    const inserted = await googleCalendarInsertSeason_(operation.payload);
    if (!inserted || inserted.ok === false) {
        throw new Error(String(inserted && inserted.message || "Google-Kalender konnte nicht aktualisiert werden."));
    }
    return Object.assign({ removed }, inserted);
}

async function maintenanceApplyOperations_(operations) {
    const result = { changedFiles:new Set(), created:0, updated:0, removed:0, protected:0, skipped:0, errors:[] };
    for (const operation of Array.isArray(operations) ? operations : []) {
        const snapshot = maintenanceArchiveSnapshot_(operation);
        try {
            maintenanceWriteArchive_(operation);
            const calendar = await maintenanceSyncCalendar_(operation);
            if (calendar && calendar.protected) {
                maintenanceRestoreArchive_(snapshot);
                result.protected++;
                result.skipped++;
                logWrite_("INFO", "WARTUNG", "Wartungsänderung wegen händischer Kalenderänderung geschützt", {
                    fileName:operation.fileName,
                    staffel:operation.payload.staffelNummer
                });
                continue;
            }
            result.changedFiles.add(operation.fileName);
            result.created += Number(calendar && calendar.created || 0);
            result.updated += Number(calendar && calendar.updated || 0);
            result.removed += Number(calendar && calendar.removed || 0);
            if (calendar && calendar.skipped) result.skipped++;
            logWrite_("INFO", "WARTUNG", "Wartungsänderung übernommen", {
                fileName:operation.fileName,
                staffel:operation.payload.staffelNummer,
                neu:operation.isNew,
                kalenderModus:String(readSettings_().calendar.mode || "none"),
                kalenderEntfernt:Number(calendar && calendar.removed || 0)
            });
        } catch (err) {
            maintenanceRestoreArchive_(snapshot);
            const error = {
                fileName:operation.fileName,
                seasonNumber:operation.payload.staffelNummer,
                message:String(err && err.message || err)
            };
            result.errors.push(error);
            logWrite_("ERROR", "WARTUNG", "Wartungsänderung zurückgerollt", error);
        }
    }
    try {
        const cleanup = await maintenanceCleanupCalendarDuplicates_();
        result.removed += Number(cleanup && cleanup.removed || 0);
        result.protected += Number(cleanup && cleanup.protected || 0);
    } catch (err) {
        result.errors.push({
            fileName:"",
            seasonNumber:0,
            message:"Kalender-Doppelprüfung: " + String(err && err.message || err)
        });
    }
    result.changedFileCount = result.changedFiles.size;
    return result;
}

async function maintenanceFetchGroup_(group, cache, snapshot, counters) {
    const key = String(group.tmdbId);
    const cached = cache.series[key];

    if (maintenanceCacheIsFresh_(cached, group.entries)) {
        snapshot.set(key, Object.assign({}, cached, { ok:true, source:"cache" }));
        counters.cacheHits++;
        return;
    }

    const tvResult = await tmdbTvDetails_(group.tmdbId, "de");
    counters.requests++;
    if (!tvResult || tvResult.ok === false) {
        const error = {
            tmdbId:group.tmdbId,
            fileName:String(group.entries[0] && group.entries[0].fileName || ""),
            code:String(tvResult && tvResult.code || "TMDB"),
            status:Number(tvResult && tvResult.status || 0),
            message:String(tvResult && tvResult.message || "TMDB-Seriendaten konnten nicht geladen werden.")
        };
        snapshot.set(key, { ok:false, source:"network", error });
        counters.errors.push(error);
        return;
    }

    const tv = tvResult.data || {};
    const seasonNumbers = new Set(group.entries.map(maintenanceSeasonNumber_).filter(Boolean));
    const maxArchiveSeason = Math.max(0, ...Array.from(seasonNumbers));
    const maxTmdbSeason = Number(tv.number_of_seasons || 0) || 0;
    if (maxTmdbSeason > maxArchiveSeason) seasonNumbers.add(maxTmdbSeason);

    const seasons = {};
    for (const seasonNumber of Array.from(seasonNumbers).sort((a, b) => a - b)) {
        const seasonResult = await tmdbSeasonDetails_(group.tmdbId, seasonNumber, "de");
        counters.requests++;
        if (seasonResult && seasonResult.ok) {
            seasons[String(seasonNumber)] = { ok:true, data:seasonResult.data || {} };
        } else {
            const error = {
                tmdbId:group.tmdbId,
                seasonNumber,
                fileName:String(group.entries[0] && group.entries[0].fileName || ""),
                code:String(seasonResult && seasonResult.code || "TMDB"),
                status:Number(seasonResult && seasonResult.status || 0),
                message:String(seasonResult && seasonResult.message || "TMDB-Staffeldaten konnten nicht geladen werden.")
            };
            const isAnnouncedWithoutDetails = Number(error.status || 0) === 404 &&
                seasonNumber > maxArchiveSeason;
            seasons[String(seasonNumber)] = {
                ok:false,
                pending:isAnnouncedWithoutDetails,
                error
            };
            if (isAnnouncedWithoutDetails) {
                counters.pendingSeasons++;
                logWrite_("INFO", "WARTUNG", "Neue Staffel angekündigt, Detaildaten bei TMDB noch nicht verfügbar", {
                    tmdbId:group.tmdbId,
                    staffel:"S" + String(seasonNumber).padStart(2, "0"),
                    fileName:error.fileName
                });
            } else {
                counters.errors.push(error);
            }
        }
    }

    const record = {
        ok:true,
        source:"network",
        fetchedAt:new Date().toISOString(),
        tmdbId:group.tmdbId,
        tv,
        seasons
    };
    cache.series[key] = record;
    snapshot.set(key, record);
    counters.networkSeries++;
}

async function maintenanceFetchAll_(groups, cache, snapshot, counters) {
    let nextIndex = 0;

    async function worker_() {
        while (true) {
            const index = nextIndex++;
            if (index >= groups.length) return;
            const group = groups[index];
            maintenanceSetStatus_(
                "tmdb",
                "TMDB-Prüfbestand wird aufgebaut.",
                group.entries[0] || null,
                index + 1,
                groups.length
            );
            await maintenanceFetchGroup_(group, cache, snapshot, counters);

            if (counters.errors.some(error => Number(error.status || 0) === 429)) {
                throw new Error("TMDB hat die Anfragezahl vorübergehend begrenzt. Wartung wurde sicher beendet.");
            }
        }
    }

    const workerCount = Math.min(MAINTENANCE_MAX_PARALLEL, Math.max(1, groups.length));
    await Promise.all(Array.from({ length:workerCount }, () => worker_()));
}

async function maintenanceRun_() {
    if (maintenanceRunning_) {
        return { ok:false, message:"Die Wartung läuft bereits." };
    }

    maintenanceRunning_ = true;
    const counters = {
        requests:0,
        cacheHits:0,
        networkSeries:0,
        pendingSeasons:0,
        errors:[]
    };

    try {
        const loaded = archiveLoad_();
        if (!loaded || loaded.ok === false) {
            throw new Error(String(loaded && loaded.message || "Archiv konnte nicht geladen werden."));
        }

        const entries = Array.isArray(loaded && loaded.daten && loaded.daten.entries)
            ? loaded.daten.entries : [];
        const grouped = maintenanceGroups_(entries);
        const groups = grouped.groups;
        const cache = maintenanceReadCache_();
        const snapshot = new Map();

        maintenanceSetStatus_("start", "Wartung liest Archiv und plant TMDB-Prüfung.", null, 0, groups.length);
        logWrite_("INFO", "WARTUNG", "Desktop-Wartung gestartet", {
            archivEintraege:entries.length,
            eindeutigeTmdbSerien:groups.length,
            ohneTmdbId:grouped.withoutTmdbId.length,
            maxParallel:MAINTENANCE_MAX_PARALLEL
        });

        await maintenanceFetchAll_(groups, cache, snapshot, counters);
        maintenanceWriteCache_(cache);

        maintenanceSetStatus_("auswertung", "TMDB-Prüfbestand wird mit dem Archiv verglichen.", null, groups.length, groups.length);
        const findings = maintenanceAnalyse_(groups, snapshot);
        const decisionCounts = findings.reduce((counts, finding) => {
            const action = String(finding && finding.action || "observe");
            if (action === "apply") counts.ready++;
            else if (action === "review") counts.review++;
            else if (action === "protected") counts.protected++;
            else counts.observe++;
            return counts;
        }, { ready:0, review:0, observe:0, protected:0 });

        for (const finding of findings) {
            logWrite_("INFO", "WARTUNG", "TMDB-Abweichung festgestellt", finding);
        }
        for (const entry of grouped.withoutTmdbId) {
            logWrite_("WARN", "WARTUNG", "Archivstaffel ohne TMDB-ID übersprungen", {
                fileName:String(entry && entry.fileName || ""),
                staffel:String(entry && entry.staffelLabel || "")
            });
        }

        let applied = {
            changedFileCount:0,
            created:0,
            updated:0,
            removed:0,
            protected:0,
            skipped:0,
            errors:[]
        };
        if (counters.errors.length === 0) {
            const operations = maintenanceBuildOperations_(groups, snapshot, findings);
            maintenanceSetStatus_("uebernahme", "Freigegebene Wartungsänderungen werden sicher übernommen.", null, 0, operations.length);
            applied = await maintenanceApplyOperations_(operations);
        } else {
            logWrite_("WARN", "WARTUNG", "Übernahme wegen unvollständigem TMDB-Prüflauf ausgesetzt", {
                fehler:counters.errors.length
            });
        }

        const allErrors = counters.errors.concat(applied.errors || []);
        const ok = allErrors.length === 0;
        const result = {
            ok,
            readOnly:false,
            phase:"applied",
            message:ok
                ? ("Wartung abgeschlossen. " + Number(applied.changedFileCount || 0) + " Archivdatei(en) geändert.")
                : ("Wartung mit " + allErrors.length + " Fehler(n) sicher beendet."),
            geprueftDateien:entries.length,
            geprueftStaffeln:entries.length,
            gepruefteSerien:groups.length,
            tmdbAnfragen:counters.requests,
            ausCache:counters.cacheHits,
            neuVonTmdb:counters.networkSeries,
            angekuendigtOhneDetails:counters.pendingSeasons,
            ohneTmdbId:grouped.withoutTmdbId.length,
            auffaellig:findings.length,
            uebernehmbar:decisionCounts.ready,
            rueckfragen:decisionCounts.review,
            beobachten:decisionCounts.observe,
            geschuetzt:decisionCounts.protected,
            geaendertDateien:Number(applied.changedFileCount || 0),
            created:Number(applied.created || 0),
            updated:Number(applied.updated || 0),
            removed:Number(applied.removed || 0),
            kalenderGeschuetzt:Number(applied.protected || 0),
            skipped:grouped.withoutTmdbId.length + Number(applied.skipped || 0),
            findings,
            errors:allErrors
        };

        maintenanceSetStatus_(ok ? "ende" : "fehler", result.message, null, groups.length, groups.length);
        logWrite_(ok ? "INFO" : "ERROR", "WARTUNG", "Desktop-Wartung abgeschlossen", result);
        return result;
    } catch (err) {
        const message = "Wartung sicher beendet: " + String(err && err.message || err);
        maintenanceSetStatus_("fehler", message, null, 0, 0);
        logWrite_("ERROR", "WARTUNG", "Desktop-Wartung sicher beendet", {
            fehler:message,
            tmdbAnfragen:counters.requests,
            ausCache:counters.cacheHits
        });
        return {
            ok:false,
            readOnly:true,
            message,
            geprueftDateien:0,
            geprueftStaffeln:0,
            geaendertDateien:0,
            created:0,
            updated:0,
            skipped:0,
            tmdbAnfragen:counters.requests,
            ausCache:counters.cacheHits,
            errors:counters.errors
        };
    } finally {
        maintenanceRunning_ = false;
    }
}

function googleCalendarUrl_(_calendarId) {
    return "https://calendar.google.com/calendar/u/0/r";
}

function installIpc_() {
    ipcMain.handle("serkal:settings:get", () => readSettings_());
    ipcMain.handle("serkal:settings:save", (_event, settings) => writeSettings_(settings));
    ipcMain.handle("serkal:tmdb:status", () => ({ configured:!!readTmdbKey_() }));
    ipcMain.handle("serkal:tmdb:testKey", async (_event, apiKey) => {
        const key = String(apiKey || "").trim();
        if (!key) return { ok:false, code:"TMDB_KEY_MISSING", message:"TMDB API-Key fehlt." };
        const res = await tmdbRequest_("/configuration", {}, key);
        return res.ok ? { ok:true, message:"TMDB-Verbindung funktioniert." } : res;
    });
    ipcMain.handle("serkal:tmdb:saveKey", (_event, apiKey) => writeTmdbKey_(apiKey));
    ipcMain.handle("serkal:tmdb:test", async () => {
        const res = await tmdbRequest_("/configuration", {});
        return res.ok ? { ok:true, message:"TMDB-Verbindung funktioniert." } : res;
    });
    ipcMain.handle("serkal:tmdb:searchTv", async (_event, query, lang, options) => serkalSearchComplete_(query, lang, options));
    ipcMain.handle("serkal:tmdb:poster", async (_event, id, lang) => tmdbPoster_(id, lang));
    ipcMain.handle("serkal:archive:load", () => archiveLoad_());
    ipcMain.handle("serkal:archive:insert", (_event, payload) => {
        logWrite_("TRACE", "PIPELINE", "IPC Archiv-Eintrag empfangen", {
            titel:String(payload && (payload.titel || payload.title || payload.name) || ""),
            jahr:String(payload && (payload.jahr || payload.year) || ""),
            staffel:Number(payload && (payload.staffelNummer || payload.seasonNumber) || 0),
            termine:Array.isArray(payload && (payload.termindaten || payload.episodeDates)) ?
                (payload.termindaten || payload.episodeDates).length : 0
        });
        const result = archiveInsert_(payload);
        logWrite_(result && result.ok ? "TRACE" : "ERROR", "PIPELINE", "IPC Archiv-Eintrag abgeschlossen", {
            ok:Boolean(result && result.ok),
            fileName:String(result && result.fileName || ""),
            message:String(result && result.message || "")
        });
        return result;
    });
    ipcMain.handle("serkal:archive:saveChanges", (_event, dirtyMap) => archiveSaveChanges_(dirtyMap));
    ipcMain.handle("serkal:archive:deleteSeries", (_event, payload) => archiveDeleteSeries_(payload));
    ipcMain.handle("serkal:log:write", (_event, level, tag, text, object) => logWrite_(level, tag, text, object));
    ipcMain.handle("serkal:log:read", (_event, maxLines, day) => logRead_(maxLines, day));
    ipcMain.handle("serkal:log:saveText", (_event, day, text) => logSaveText_(day, text));
    ipcMain.handle("serkal:log:clear", (_event, day) => logClear_(day));
    ipcMain.handle("serkal:calendar:insertSeason", async (_event, payload) => {
        logWrite_("TRACE", "PIPELINE", "IPC Kalender-Eintrag empfangen", {
            titel:String(payload && (payload.titel || payload.title || payload.name) || ""),
            tmdbId:Number(payload && (payload.tmdbId || payload.id) || 0) || null
        });
        const result = await googleCalendarInsertSeason_(payload);
        logWrite_(result && result.ok ? "TRACE" : "ERROR", "PIPELINE", "IPC Kalender-Eintrag abgeschlossen", {
            ok:Boolean(result && result.ok),
            skipped:Boolean(result && result.skipped),
            reason:String(result && result.reason || ""),
            created:Number(result && result.created || 0),
            updated:Number(result && result.updated || 0),
            message:String(result && result.message || "")
        });
        return result;
    });
    ipcMain.handle("serkal:maintenance:status", () => maintenanceGetStatus_());
    ipcMain.handle("serkal:maintenance:run", async () => maintenanceRun_());
    ipcMain.handle("serkal:calendar:createIcs", async (_event, payload) => {
        const result = calendarCreateIcs_(payload);
        if (result.ok) {
            try { await shell.openExternal(result.importUrl); }
            catch (err) { result.openWarning = "Google Kalender konnte nicht automatisch geöffnet werden: " + err.message; }
        }
        return result;
    });
    ipcMain.handle("serkal:help:google", async (_event, lang) => {
        const url = googleHelpUrl_(lang);
        await shell.openExternal(url);
        return { ok:true, url };
    });
    ipcMain.handle("serkal:help:tmdb", async (_event, lang) => {
        const url = tmdbHelpUrl_(lang);
        await shell.openExternal(url);
        return { ok:true, url };
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

function installDesktopTmdbBridge_(hauptfenster) {
    const js = `
(() => {
  function askTmdbKey_() {
    return new Promise((resolve) => {
      const lang = (() => {
        try {
          const saved = String(localStorage.getItem('serkal_lang') || '').toLowerCase();
          if (saved === 'en') return 'en';
        } catch (_e) {}
        return 'de';
      })();
      const copy = lang === 'en' ? {
        title:'Set up TMDB',
        text:'For this function, SerKal needs your personal free TMDB API key.',
        placeholder:'Personal TMDB API key (v3 auth)',
        cancel:'Cancel',
        help:'Open help',
        save:'Save',
        missing:'Please enter your personal TMDB API key.',
        network:'Unable to connect to TMDB. Please check your internet connection.',
        invalid:'This TMDB API key did not work. Please check it.',
        failed:'TMDB setup failed.'
      } : {
        title:'TMDB einrichten',
        text:'Für diese Funktion benötigt SerKal deinen persönlichen kostenlosen TMDB-API-Key.',
        placeholder:'Persönlicher TMDB-API-Key (v3 auth)',
        cancel:'Abbrechen',
        help:'Hilfe öffnen',
        save:'Speichern',
        missing:'Bitte deinen persönlichen TMDB-API-Key eingeben.',
        network:'Keine Verbindung zu TMDB. Bitte die Internetverbindung prüfen.',
        invalid:'Dieser TMDB-API-Key funktioniert nicht. Bitte prüfe ihn.',
        failed:'Die TMDB-Einrichtung ist fehlgeschlagen.'
      };
      const old = document.getElementById('skTmdbKeyOverlay');
      if (old) old.remove();
      const overlay = document.createElement('div');
      overlay.id = 'skTmdbKeyOverlay';
      overlay.className = 'skDialogOverlay sk-open';
      overlay.setAttribute('aria-hidden', 'false');
      overlay.innerHTML = '<section class="skDialogBox" role="dialog" aria-modal="true" data-kind="info">' +
        '<div class="skDialogHead"><div class="skDialogIcon">🔑</div><h2 class="skDialogTitle">' + copy.title + '</h2></div>' +
        '<div class="skDialogText">' + copy.text + '<br><br>' +
        '<input id="skTmdbKeyInput" type="text" autocomplete="off" spellcheck="false" placeholder="' + copy.placeholder + '" style="width:100%;box-sizing:border-box;padding:10px 12px;border-radius:10px;border:1px solid #cbd5e1;font:inherit">' +
        '<div id="skTmdbKeyError" style="display:none;margin-top:10px;color:#b91c1c;font-weight:700"></div></div>' +
        '<div class="skDialogActions"><button id="skTmdbKeyCancel" type="button">' + copy.cancel + '</button><button id="skTmdbKeyHelp" type="button">' + copy.help + '</button><button id="skTmdbKeySave" class="skDialogPrimary" type="button">' + copy.save + '</button></div>' +
        '</section>';
      document.body.appendChild(overlay);
      const input = document.getElementById('skTmdbKeyInput');
      const error = document.getElementById('skTmdbKeyError');
      const finish = (value) => { overlay.remove(); resolve(value); };
      document.getElementById('skTmdbKeyCancel').onclick = () => finish('');
      document.getElementById('skTmdbKeyHelp').onclick = async () => {
        try { await window.serkal.help.tmdb(lang); }
        catch (_e) {
          error.textContent=copy.failed;
          error.style.display='block';
        }
      };
      document.getElementById('skTmdbKeySave').onclick = async () => {
        const key = String(input.value || '').trim();
        if (!key) { error.textContent=copy.missing; error.style.display='block'; input.focus(); return; }
        try {
          const test = await window.serkal.tmdb.testKey(key);
          if (!test.ok) {
            error.textContent = test.code === 'NETWORK' ? copy.network : copy.invalid;
            error.style.display='block'; input.focus(); input.select(); return;
          }
          await window.serkal.tmdb.saveKey(key);
          finish(key);
        } catch (_e) {
          error.textContent=copy.failed; error.style.display='block';
        }
      };
      input.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') document.getElementById('skTmdbKeySave').click(); });
      setTimeout(() => input.focus(), 50);
    });
  }

  function aktiviereEintrag_() {
    setTimeout(() => {
      const btn = document.getElementById('btnInsert');
      if (!btn) return;
      btn.disabled = false;
      btn.title = 'In das lokale SERKAL-Archiv eintragen';
      const dock = document.getElementById('dockStatus');
      if (dock) dock.textContent = 'Suche und lokales Archiv aktiv';
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
            if (!key) { failure({message:'Die TMDB-Einrichtung wurde abgebrochen. Du kannst sie jederzeit erneut öffnen, indem du eine neue Suche startest. Über „Hilfe öffnen“ erfährst du, wie du deinen kostenlosen TMDB-API-Key erhältst.'}); return; }
            res = await window.serkal.tmdb.searchTv(query, lang, options || {});
          }
          if (!res.ok) { failure({message:res.message || 'TMDB-Suche fehlgeschlagen.', code:res.code}); return; }
          success(res);
          if ((res.anzahl || 0) > 0) aktiviereEintrag_();
        } catch (e) { failure({message:(e && e.message) ? e.message : String(e)}); }
      },
      async verarbeiteTmdbAuswahl(payload) {
        try {
          const archiveRes = await window.serkal.archive.insert(payload || {});
          if (!archiveRes || archiveRes.ok === false) {
            success(archiveRes || {ok:false,message:'Archiv konnte nicht gespeichert werden.'});
            return;
          }

          const settings = await window.serkal.settings.get();
          const calendarMode = String(settings && settings.calendar && settings.calendar.mode || '');
          if (calendarMode === 'google') {
            const calendarRes = await window.serkal.calendar.insertSeason(payload || {});
            if (!calendarRes || calendarRes.ok === false) {
              success({
                ok:false,
                archiveSaved:true,
                code:String(calendarRes && calendarRes.code || 'GOOGLE_CALENDAR_UNAVAILABLE'),
                helpUrl:String(calendarRes && calendarRes.helpUrl || 'https://serkal.de/hilfe.html'),
                message:'Archiv wurde gespeichert. ' + String(calendarRes && calendarRes.message || 'SerKal konnte keine Verbindung zum Google Kalender herstellen.')
              });
              return;
            }
            success(Object.assign({}, archiveRes, {
              calendarMode:'google',
              calendar:calendarRes,
              message:'Archiv und Google Kalender wurden gespeichert.'
            }));
            return;
          }
          success(Object.assign({}, archiveRes, { calendarMode:calendarMode || 'none' }));
        } catch (e) { failure({message:(e && e.message) ? e.message : String(e)}); }
      },
      async apiWartungStatus() {
        try {
          if (!window.serkal || !window.serkal.maintenance) {
            success({ok:false, phase:'fehler', text:'Desktop-Wartungsbrücke ist nicht geladen.'});
            return;
          }
          success(await window.serkal.maintenance.status());
        } catch (e) {
          failure({message:(e && e.message) ? e.message : String(e)});
        }
      },
      async apiStarteZukunftspruefung() {
        try {
          if (!window.serkal || !window.serkal.maintenance) {
            success({ok:false, message:'Desktop-Wartungsbrücke ist nicht geladen.'});
            return;
          }
          success(await window.serkal.maintenance.run());
        } catch (e) {
          failure({message:(e && e.message) ? e.message : String(e)});
        }
      },
      async apiErzeugeIcsFuerAuswahl(payload) {
        try {
          const res = await window.serkal.calendar.createIcs(payload || {});
          success(res);
        } catch (e) {
          failure({message:(e && e.message) ? e.message : String(e)});
        }
      },
      async apiLadeArchivDaten() {
        try {
          const res = await window.serkal.archive.load();
          success(res);
        } catch (e) {
          const detail = (e && e.message) ? e.message : String(e);
          console.error('SERKAL Archiv laden:', e);
          success({ok:false, message:'Archiv konnte nicht geladen werden: ' + detail, daten:{entries:[]}, count:0});
        }
      },
      async apiSpeichereArchivAenderungen(dirtyMap) {
        try {
          const res = await window.serkal.archive.saveChanges(dirtyMap || {});
          success(res);
        } catch (e) {
          failure({message:(e && e.message) ? e.message : String(e)});
        }
      },
      async apiLoescheArchivEintrag(payload) {
        try {
          if (!window.serkal || !window.serkal.archive || typeof window.serkal.archive.deleteSeries !== 'function') {
            success({ok:false, message:'Die neue Lösch-Brücke ist in dieser laufenden SerKal-Instanz noch nicht geladen. Bitte alle SerKal-/Electron-Fenster schließen und SerKal neu starten.'});
            return;
          }
          const res = await window.serkal.archive.deleteSeries(payload || {});
          try {
            const logSummary = {
              ok:!!(res && res.ok),
              message:String(res && res.message || ''),
              fileName:String(res && res.fileName || payload && payload.fileName || ''),
              calendarMode:String(res && res.calendarMode || ''),
              calendarDeleted:Number(res && res.calendarDeleted || 0),
              archiveCount:Number(res && res.count || 0)
            };
            await window.serkal.log.write(logSummary.ok ? 'ACTION' : 'ERROR', 'DELETE',
              logSummary.ok ? 'Löschen abgeschlossen' : 'Löschen fehlgeschlagen', logSummary);
          } catch (_logErr) {}
          success(res);
        } catch (e) {
          success({ok:false, message:(e && e.message) ? e.message : String(e)});
        }
      },
      async LOG_INFO(tag, text, object) {
        try { success(await window.serkal.log.write('INFO', tag || 'UI', text || '', object)); }
        catch (e) { failure({message:(e && e.message) ? e.message : String(e)}); }
      },
      async apiLogUserAction(action, object) {
        try { success(await window.serkal.log.write('ACTION', 'UI', action || 'Aktion', object)); }
        catch (e) { failure({message:(e && e.message) ? e.message : String(e)}); }
      },
      async apiLogViewportInfo(info) {
        try { success(await window.serkal.log.write('INFO', 'VIEWPORT', 'Fenstergröße erkannt', info)); }
        catch (e) { failure({message:(e && e.message) ? e.message : String(e)}); }
      },
      async apiHoleLogZeilen(maxLines, day) {
        try { success(await window.serkal.log.read(maxLines || 500, day || 'today')); }
        catch (e) { failure({message:(e && e.message) ? e.message : String(e)}); }
      },
      async apiSpeichereLogText(day, text) {
        try { success(await window.serkal.log.saveText(day || 'today', text || '')); }
        catch (e) { failure({message:(e && e.message) ? e.message : String(e)}); }
      },
      async apiLoescheLog(day) {
        try { success(await window.serkal.log.clear(day || 'today')); }
        catch (e) { failure({message:(e && e.message) ? e.message : String(e)}); }
      },
      async apiHoleArchivPoster(tmdbId, lang) {
        try {
          let res = await window.serkal.tmdb.poster(tmdbId, lang || 'de');
          if (!res.ok && res.code === 'TMDB_KEY_MISSING') {
            const key = await askTmdbKey_();
            if (!key) {
              failure({message:'TMDB ist noch nicht eingerichtet.'});
              return;
            }
            res = await window.serkal.tmdb.poster(tmdbId, lang || 'de');
          }
          if (!res.ok) {
            failure({message:res.message || 'TMDB-Poster konnte nicht geladen werden.', code:res.code});
            return;
          }
          success(res);
        } catch (e) {
          failure({message:(e && e.message) ? e.message : String(e)});
        }
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
  setTimeout(() => {
    if (typeof window.loadArchiv === "function") window.loadArchiv();
  }, 0);
})();`;
    return hauptfenster.webContents.executeJavaScript(js);
}

let serkalMainWindow_ = null;

function bringSerkalToFront_() {
    const win = serkalMainWindow_;
    if (!win || win.isDestroyed()) return false;
    if (win.isMinimized()) win.restore();
    if (!win.isVisible()) win.show();
    win.focus();
    return true;
}

function erstelleHauptfenster() {
    const hauptfenster = new BrowserWindow({
        width:1280, height:820, minWidth:900, minHeight:600, show:false,
        title:serkalWindowTitle_(), backgroundColor:"#f6f3ff",
        webPreferences:{
            preload:path.join(__dirname,"..","common","preload.js"),
            contextIsolation:true,
            nodeIntegration:false,
            additionalArguments:[
                app.isPackaged ? "--serkal-installed" : "--serkal-development",
                "--serkal-version=" + app.getVersion()
            ]
        }
    });
    serkalMainWindow_ = hauptfenster;
    hauptfenster.on("closed", () => {
        if (serkalMainWindow_ === hauptfenster) serkalMainWindow_ = null;
    });
    hauptfenster.loadFile(path.join(__dirname,"..","frontend","index.html"));
    hauptfenster.once("ready-to-show", async ()=>{
        try { await installDesktopTmdbBridge_(hauptfenster); }
        catch (err) { console.error("SERKAL Desktop TMDB-Bridge:", err); }
        hauptfenster.maximize();
        hauptfenster.show();
        if (String(process.env.SERKAL_DEBUG || "") === "1") {
            logWrite_("INFO", "DEBUG", "Electron-Entwicklerwerkzeuge automatisch geöffnet", {});
            hauptfenster.webContents.openDevTools({ mode:"detach" });
        }
    });
    hauptfenster.setMenuBarVisibility(false);
}

const serkalHasSingleInstanceLock_ = app.requestSingleInstanceLock();

if (!serkalHasSingleInstanceLock_) {
    app.quit();
} else {
    app.on("second-instance", () => {
        bringSerkalToFront_();
    });

    app.whenReady().then(()=>{
        maintainSerkalProtocol_();
        installIpc_();
        erstelleHauptfenster();
        app.on("activate",()=>{
            if (!bringSerkalToFront_() && BrowserWindow.getAllWindows().length===0) erstelleHauptfenster();
        });
    });

    app.on("window-all-closed",()=>{ if (process.platform!=="darwin") app.quit(); });
}

/*
===============================================================================
 SERKAL Desktop
-------------------------------------------------------------------------------
 Datei      : main.js
 Version    : 0.0.5
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

function serkalBuildChannel_() {
    return app.isPackaged ? "INSTALLIERT" : "ENTWICKLUNG";
}

function serkalWindowTitle_() {
    return "SERKAL Desktop " + app.getVersion() + " – " + serkalBuildChannel_();
}


const DEFAULT_SETTINGS = {
    setupDone: false,
    archive: { folderPath: "G:\\Meine Ablage\\Serkal_Haupt\\SerKal_Archivdaten" },
    calendar: { mode: "", googleCalendarId: "" }
};

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
        note:archiveDecode_(archiveField_(line,"note")), flags:Number(archiveField_(line,"flags") || 0) || 0,
        buttonPressed:seen, seen, status, statusText:archiveStatusText_(status), raw:String(line || ""),
        updated:updated.toISOString(), updatedMs:updated.getTime(), updatedText:updated.toLocaleString("de-DE")
    };
}

function archiveLoad_() {
    const folder = archiveFolderPath_();
    if (!folder) return { ok:false, message:"Archivordner ist nicht eingerichtet.", daten:{entries:[],meta:{source:"no-folder"}}, count:0 };
    try {
        if (!fs.existsSync(folder)) return { ok:false, message:"Archivordner nicht gefunden: " + folder, daten:{entries:[],meta:{source:"missing-folder"}}, count:0 };
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
        if (!fs.existsSync(folder)) return { ok:false, message:"Archivordner nicht gefunden: " + folder };
        const fileName = archiveFileName_(title,year);
        const fullPath = path.join(folder,fileName);
        const label = "S" + String(seasonNumber).padStart(2,"0");
        const oldText = fs.existsSync(fullPath) ? fs.readFileSync(fullPath,"utf8") : "";
        const oldLines = oldText.split(/\r?\n/).map(x=>String(x||"").trim()).filter(Boolean);
        const oldLine = oldLines.find(x=>new RegExp("^"+label+"(?:\\b|;|\\|)","i").test(x)) || "";
        let flags = Number(archiveField_(oldLine,"flags") || 0) || 0;
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
        parts.push("flags="+flags);
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
        if (!folder || !fs.existsSync(folder)) {
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
            const calendarId = String(settings.calendar.googleCalendarId || "").trim();
            if (!calendarId) {
                return { ok:false, message:"Google-Kalender-ID fehlt. Archivdatei wurde nicht gelöscht." };
            }

            for (const entry of entries) {
                const seasonNumber = Number(String(entry.staffelLabel || "").replace(/\D/g, ""));
                const dates = Array.isArray(entry.activeDates) ? entry.activeDates : [];
                const blocks = calendarBlocks_(dates);
                for (const block of blocks) {
                    const eventId = googleCalendarEventId_({
                        tmdbId:entry.tmdbId,
                        staffelNummer:seasonNumber
                    }, block);
                    const result = await googleCalendarApi_("DELETE", calendarId, eventId, null);
                    if (result.ok) {
                        calendarDeleted++;
                        continue;
                    }
                    if (result.status === 404 || result.status === 410) continue;
                    const detail = result.data && (result.data.error && result.data.error.message || result.data.error_description);
                    return {
                        ok:false,
                        message:"Google-Kalendertermin konnte nicht gelöscht werden: " +
                            (detail || ("Fehler " + result.status)) +
                            ". Archivdatei wurde nicht gelöscht."
                    };
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
        return { ok:false, message:"Serie konnte nicht gelöscht werden: " + err.message };
    }
}

function archiveSetField_(line, key, value) {
    const escaped = String(key || "").replace(/[.*+?^$(){}|[\]\\]/g, "\\async function tmdbRequest_(pathname, params) {");
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
        if (!folder || !fs.existsSync(folder)) return { ok:false, message:"Archivordner nicht gefunden: " + folder };

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
                    line = archiveSetField_(line, "note", archiveEncode_(patch.note));
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


const GOOGLE_CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.events";

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

async function googleCalendarApi_(method, calendarId, eventId, event) {
    const accessToken = await googleOauthAccessToken_();
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
    return { ok:response.ok, status:response.status, data };
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

async function googleCalendarInsertSeason_(payload) {
    try {
        const settings = readSettings_();
        const calendarId = String(settings.calendar.googleCalendarId || "").trim();
        if (!calendarId) return { ok:false, message:"Google-Kalender-ID fehlt." };

        const data = payload || {};
        const title = String(data.titel || data.title || data.name || "").trim();
        const year = String(data.jahrOverride || data.jahr || data.year || "").trim();
        const seasonNumber = Number(data.staffelOverride || data.staffelNummer || data.seasonNumber ||
            String(data.staffelLabel || data.seasonLabel || "").replace(/\D/g, ""));
        const dates = (Array.isArray(data.termindaten) ? data.termindaten :
            (Array.isArray(data.episodeDates) ? data.episodeDates : []))
            .map(value => String(value || "").trim())
            .filter(value => /^\d{4}-\d{2}-\d{2}$/.test(value));

        if (!title || !/^\d{4}$/.test(year) || !seasonNumber || !dates.length) {
            return { ok:false, message:"Kalendereintrag unvollständig." };
        }

        const seasonLabel = "S" + calendarPad2_(seasonNumber);
        const blocks = calendarBlocks_(dates);
        let created = 0;
        let updated = 0;

        for (const block of blocks) {
            const summary = title + " (" + year + ") " + seasonLabel + "E" + calendarPad2_(block.eFrom) +
                (block.eTo !== block.eFrom ? ("–E" + calendarPad2_(block.eTo)) : "");
            const eventId = googleCalendarEventId_(data, block);
            const event = {
                id:eventId,
                summary,
                description:"SerKal",
                start:{ date:block.date },
                end:{ date:calendarIcsNextDay_(block.date) },
                transparency:"transparent",
                extendedProperties:{ private:{ serkal:"1", tmdbId:String(data.tmdbId || data.id || "") } }
            };

            let result = await googleCalendarApi_("POST", calendarId, "", event);
            if (result.status === 409) {
                const updateEvent = Object.assign({}, event);
                delete updateEvent.id;
                result = await googleCalendarApi_("PUT", calendarId, eventId, updateEvent);
                if (result.ok) updated++;
            } else if (result.ok) {
                created++;
            }
            if (!result.ok) {
                const detail = result.data && (result.data.error && result.data.error.message || result.data.error_description);
                throw new Error(detail || ("Google Kalender antwortete mit Fehler " + result.status + "."));
            }
        }

        return { ok:true, mode:"google", created, updated, events:blocks.length, calendarId };
    } catch (err) {
        return { ok:false, message:"Google-Kalendereintrag fehlgeschlagen: " + err.message };
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
    ipcMain.handle("serkal:tmdb:status", () => ({ configured:!!readTmdbKey_() }));
    ipcMain.handle("serkal:tmdb:saveKey", (_event, apiKey) => writeTmdbKey_(apiKey));
    ipcMain.handle("serkal:tmdb:test", async () => {
        const res = await tmdbRequest_("/configuration", {});
        return res.ok ? { ok:true, message:"TMDB-Verbindung funktioniert." } : res;
    });
    ipcMain.handle("serkal:tmdb:searchTv", async (_event, query, lang, options) => serkalSearchComplete_(query, lang, options));
    ipcMain.handle("serkal:tmdb:poster", async (_event, id, lang) => tmdbPoster_(id, lang));
    ipcMain.handle("serkal:archive:load", () => archiveLoad_());
    ipcMain.handle("serkal:archive:insert", (_event, payload) => archiveInsert_(payload));
    ipcMain.handle("serkal:archive:saveChanges", (_event, dirtyMap) => archiveSaveChanges_(dirtyMap));
    ipcMain.handle("serkal:archive:deleteSeries", (_event, payload) => archiveDeleteSeries_(payload));
    ipcMain.handle("serkal:log:write", (_event, level, tag, text, object) => logWrite_(level, tag, text, object));
    ipcMain.handle("serkal:log:read", (_event, maxLines, day) => logRead_(maxLines, day));
    ipcMain.handle("serkal:log:saveText", (_event, day, text) => logSaveText_(day, text));
    ipcMain.handle("serkal:log:clear", (_event, day) => logClear_(day));
    ipcMain.handle("serkal:calendar:insertSeason", async (_event, payload) => googleCalendarInsertSeason_(payload));
    ipcMain.handle("serkal:calendar:createIcs", async (_event, payload) => {
        const result = calendarCreateIcs_(payload);
        if (result.ok) {
            try { await shell.openExternal(result.importUrl); }
            catch (err) { result.openWarning = "Google Kalender konnte nicht automatisch geöffnet werden: " + err.message; }
        }
        return result;
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
            if (!key) { failure({message:'TMDB ist noch nicht eingerichtet. Bitte zuerst den TMDB API-Key eintragen.'}); return; }
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
                message:'Archiv wurde gespeichert, aber ' + String(calendarRes && calendarRes.message || 'der Google-Kalendereintrag ist fehlgeschlagen.')
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
            await window.serkal.log.write(res && res.ok ? 'ACTION' : 'ERROR', 'DELETE',
              res && res.ok ? 'Löschen abgeschlossen' : 'Löschen fehlgeschlagen', res || {});
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
            additionalArguments:[app.isPackaged ? "--serkal-installed" : "--serkal-development"]
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
        installIpc_();
        erstelleHauptfenster();
        app.on("activate",()=>{
            if (!bringSerkalToFront_() && BrowserWindow.getAllWindows().length===0) erstelleHauptfenster();
        });
    });

    app.on("window-all-closed",()=>{ if (process.platform!=="darwin") app.quit(); });
}

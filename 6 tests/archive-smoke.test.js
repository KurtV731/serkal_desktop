const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const vm = require("node:vm");

const testRoot = fs.mkdtempSync(path.join(os.tmpdir(),"serkal-archive-"));
const appData = path.join(testRoot,"appData");
const userData = path.join(appData,"SerKal");
const documents = path.join(testRoot,"Documents");
const archivePath = path.join(testRoot,"archive");
fs.mkdirSync(userData,{recursive:true});
fs.mkdirSync(archivePath,{recursive:true});
fs.writeFileSync(path.join(userData,"settings.json"),JSON.stringify({
    setupDone:true,
    archive:{folderPath:archivePath},
    calendar:{mode:"none",googleCalendarId:""}
}),"utf8");

const ipcMain = { handle(){} };
const app = {
    isPackaged:false,
    getVersion(){ return "1.0.5"; },
    getAppPath(){ return testRoot; },
    getPath(name) {
        if (name === "appData") return appData;
        if (name === "userData") return userData;
        if (name === "documents") return documents;
        throw new Error("unexpected app path: " + name);
    },
    setPath(){},
    whenReady() { return { then(){} }; },
    on(){}, quit(){},
    requestSingleInstanceLock(){ return true; },
    setAsDefaultProtocolClient(){ return true; },
    removeAsDefaultProtocolClient(){ return true; }
};
const context = {
    console, URL, Buffer, fetch:async()=>{ throw new Error("fetch not used"); },
    require(id) {
        if(id === "../../serkal-session-test.json")return {enabled:false};
        if (id === "electron") return {app,BrowserWindow:function(){},ipcMain,shell:{openExternal:async()=>{}}};
        if (id === "electron-squirrel-startup") return false;
        return require(id);
    },
    __dirname:path.resolve("2 src/backend"),
    process,
    setTimeout,
    clearTimeout
};
vm.createContext(context);
const mainSource = "(function(){\n" +
    fs.readFileSync(path.resolve("2 src/backend/main.js"),"utf8") +
    "\nglobalThis.__archiveTest={archiveInsert_,archiveLoad_,buildHit_,calendarCreateIcs_,mockSeason:(response)=>{tmdbSeasonDetails_=async()=>response;}};\n})();";
vm.runInContext(mainSource,context,{filename:"main.js"});

const api = context.__archiveTest;
let result = api.archiveLoad_();
assert.equal(result.ok,true);
assert.equal(result.count,0);

const payload = {
    title:"Wednesday",
    year:"2022",
    seasonNumber:2,
    episodeCount:8,
    tmdbId:119051,
    episodeDates:["2025-08-06","2025-08-06","2025-09-03"],
    descDE:"Deutsche Beschreibung",
    descEN:"English description"
};
result = api.archiveInsert_(payload);
assert.equal(result.ok,true,result.message);
const filePath = path.join(archivePath,"Wednesday (2022).txt");
assert.equal(fs.existsSync(filePath),true);
let text = fs.readFileSync(filePath,"utf8");
assert.match(text,/^S02; startOriginal=2025-08-06; eps=8; tmdb=119051;/);
assert.match(text,/dates=06\.08\.,06\.08\.,03\.09\./);
assert.match(text,/flags=32/);

result = api.archiveLoad_();
assert.equal(result.ok,true);
assert.equal(result.count,1);
assert.equal(result.daten.entries[0].titel,"Wednesday");
assert.equal(result.daten.entries[0].staffelLabel,"S02");
assert.deepEqual(Array.from(result.daten.entries[0].datesOriginal),["2025-08-06","2025-08-06","2025-09-03"]);

payload.episodeCount = 9;
payload.episodeDates.push("2025-09-10");
result = api.archiveInsert_(payload);
assert.equal(result.ok,true,result.message);
text = fs.readFileSync(filePath,"utf8");
assert.equal(text.split(/\r?\n/).filter(line=>/^S02(?:\b|;|\|)/.test(line)).length,1);
assert.match(text,/eps=9/);
assert.match(text,/10\.09\./);

// Dieselbe Serie darf unter einem geänderten/lokalisierten Titel nicht als
// zweite Archivdatei weiterleben. Maßgeblich ist die TMDB-ID.
fs.writeFileSync(path.join(archivePath,"나를 충전해줘 (2026).txt"),
    "S01; startOriginal=2026-10-02; eps=12; tmdb=289423; titleOriginal=%EB%82%98%EB%A5%BC; dates=02.10.; note=Alte%20Notiz; flags=32\n",
    "utf8");
fs.writeFileSync(path.join(archivePath,"Take Charge of My Heart (2026).txt"),
    "S02; startOriginal=2027-01-10; eps=10; tmdb=289423; titleOriginal=Take%20Charge%20of%20My%20Heart; dates=10.01.; flags=32\n",
    "utf8");

result = api.archiveInsert_({
    title:"Take Charge of My Heart",
    year:"2026",
    seasonNumber:1,
    episodeCount:12,
    tmdbId:289423,
    episodeDates:["2026-10-09"]
});
assert.equal(result.ok,true,result.message);
assert.deepEqual(Array.from(result.mergedFiles),["나를 충전해줘 (2026).txt"]);
const localizedPath = path.join(archivePath,"Take Charge of My Heart (2026).txt");
assert.equal(fs.existsSync(localizedPath),true);
assert.equal(fs.existsSync(path.join(archivePath,"나를 충전해줘 (2026).txt")),false);
text = fs.readFileSync(localizedPath,"utf8");
assert.match(text,/^S01; startOriginal=2026-10-09;/m);
assert.match(text,/note=Alte%20Notiz/);
assert.match(text,/^S02; startOriginal=2027-01-10;/m);
const sameSeries = api.archiveLoad_().daten.entries.filter(entry=>entry.tmdbId===289423);
assert.equal(sameSeries.length,2);
assert.equal(new Set(sameSeries.map(entry=>entry.fileName)).size,1);
assert.equal(fs.existsSync(path.join(archivePath,"!!SERKAL_DUBLETTEN_SICHERUNG","나를 충전해줘 (2026).txt")),true);

console.log("SERKAL archive smoke test: OK");

// A selected announced season is saved as a row and one calendar hint, never 8 invented dates.
const calendarCopy=require("../2 src/common/archive-calendar-copy");
const announcedPayload={title:"Silo",year:"2023",tmdbId:99,seasonNumber:4,episodeCount:8,
    announcementOnly:true,announcedStart:"2099-01-19",episodeDates:[]};
assert.equal(api.archiveInsert_(announcedPayload).ok,true);
let announcedEntry=api.archiveLoad_().daten.entries.find(e=>e.tmdbId===99);
assert.equal(announcedEntry.announcementOnly,true);
assert.equal(announcedEntry.episoden,8);
assert.equal(announcedEntry.datesOriginal.length,0);
let events=calendarCopy.plan([announcedEntry],[],"pending",2026);
assert.equal(events.length,1);
assert.equal(events[0].body.extendedProperties.private.serkal,"announcement");
assert.equal(events[0].body.start.date,"2099-01-19");
// A later missing date preserves the known hint.
assert.equal(api.archiveInsert_({...announcedPayload,announcedStart:""}).ok,true);
announcedEntry=api.archiveLoad_().daten.entries.find(e=>e.tmdbId===99);
assert.equal(announcedEntry.announcements[0].date,"2099-01-19");
// A confirmed eight-episode schedule replaces the provisional row.
const confirmedDates=Array.from({length:8},(_,i)=>"2099-01-"+String(19+i).padStart(2,"0"));
assert.equal(api.archiveInsert_({...announcedPayload,announcementOnly:false,episodeDates:confirmedDates}).ok,true);
announcedEntry=api.archiveLoad_().daten.entries.find(e=>e.tmdbId===99);
assert.equal(announcedEntry.announcementOnly,false);
assert.deepEqual(Array.from(announcedEntry.datesOriginal),confirmedDates);
// A weaker future response cannot replace that complete schedule.
assert.equal(api.archiveInsert_(announcedPayload).unchanged,true);
assert.deepEqual(Array.from(api.archiveLoad_().daten.entries.find(e=>e.tmdbId===99).datesOriginal),confirmedDates);
console.log("Announced season: archive row, single calendar hint, missing-date preservation and complete promotion passed");

// Exercise the real search-enrichment path, not just the policy helper.
(async()=>{
    const metadata={name:"Silo",first_air_date:"2023-01-01",seasons:[
        {season_number:3,episode_count:8},{season_number:4,episode_count:8,air_date:"2099-01-19"}]};
    api.mockSeason({ok:true,data:{episodes:[{episode_number:1,air_date:"2099-01-19"}]}});
    let hit=await api.buildHit_(99,{},metadata,metadata,4,"de");
    assert.equal(hit.seasonNumber,4);
    assert.equal(hit.announcementOnly,true);
    assert.equal(hit.episoden,8);
    assert.equal(hit.termindaten.length,0);
    assert.equal(hit.announcedStart,"2099-01-19");
    api.mockSeason({ok:false});
    hit=await api.buildHit_(99,{},metadata,metadata,4,"de");
    assert.equal(hit.seasonNumber,4);
    assert.equal(hit.seasonStart,"2099-01-19");
    const unknown={name:"Show",seasons:[{season_number:2,episode_count:8}]};
    hit=await api.buildHit_(88,{},unknown,unknown,2,"en");
    assert.equal(hit.seasonStart,"");
    assert.equal(hit.placeholderStart,"");
    console.log("Search enrichment: selected season, partial TMDB detail and absent dates passed");
})().catch(error=>{console.error(error);process.exitCode=1;});

const ics=api.calendarCreateIcs_(announcedPayload);
assert.equal(ics.ok,true,ics.message);
assert.equal(ics.events,1);
const icsText=Buffer.from(ics.base64,'base64').toString('utf8');
assert.match(icsText,/DTSTART;VALUE=DATE:20990119/);
assert.doesNotMatch(icsText,/S04E01/);
assert.equal(api.calendarCreateIcs_({...announcedPayload,announcedStart:''}).ok,false);
console.log('ICS export: one provisional start hint, no episode fabrication and no invented date: OK');

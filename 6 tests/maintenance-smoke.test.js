const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const vm = require("node:vm");
const mainPath = process.env.SERKAL_MAIN_TEST_PATH || path.resolve("2 src/backend/main.js");

const testRoot = fs.mkdtempSync(path.join(os.tmpdir(), "serkal-maintenance-"));
const appData = path.join(testRoot, "appData");
const userData = path.join(appData, "SerKal");
const documents = path.join(testRoot, "Documents");
const archivePath = path.join(testRoot, "archive");
fs.mkdirSync(userData, { recursive:true });
fs.mkdirSync(archivePath, { recursive:true });
fs.writeFileSync(path.join(userData, "settings.json"), JSON.stringify({
    setupDone:true,
    archive:{ folderPath:archivePath },
    calendar:{ mode:"none", googleCalendarId:"" }
}), "utf8");

const ipcMain = { handle(){} };
const app = {
    isPackaged:false,
    getVersion(){ return "0.9002.0"; },
    getAppPath(){ return testRoot; },
    getPath(name) {
        if (name === "appData") return appData;
        if (name === "userData") return userData;
        if (name === "documents") return documents;
        throw new Error("unexpected app path: " + name);
    },
    setPath(){},
    whenReady(){ return { then(){} }; },
    on(){},
    quit(){},
    requestSingleInstanceLock(){ return true; },
    setAsDefaultProtocolClient(){ return true; },
    removeAsDefaultProtocolClient(){ return true; }
};
const context = {
    console, URL, fetch:async()=>{ throw new Error("fetch not used"); },
    require(id) {
        if (id === "electron") return { app, BrowserWindow:function(){}, ipcMain, shell:{ openExternal:async()=>{} } };
        if (id === "electron-squirrel-startup") return false;
        return require(id);
    },
    __dirname:path.dirname(mainPath),
    process,
    setTimeout,
    clearTimeout
};
vm.createContext(context);
const mainSource = `(function(){\n` + fs.readFileSync(mainPath, "utf8") + `
globalThis.__maintenanceTest={
  archiveLoad_, maintenanceAnalyse_, maintenanceBuildOperations_, maintenanceWriteProviders_, saveSettingsPatch_,
  maintenanceArchiveSnapshot_, maintenanceWriteArchive_, maintenanceRestoreArchive_,
  googleCalendarEventWasManuallyChanged_
};\n})();`;
vm.runInContext(mainSource, context, { filename:"main.js" });
const api = context.__maintenanceTest;

const fileName = "Testserie (2025).txt";
const filePath = path.join(archivePath, fileName);
const original = "S01; startOriginal=2026-01-01; eps=2; tmdb=123; titleOriginal=Testserie; dates=01.01.,08.01.; descDE=Bleibt%20erhalten; note=Meine%20Notiz; flags=32\n";
fs.writeFileSync(filePath, original, "utf8");
const loaded = api.archiveLoad_();
const group = { tmdbId:123, entries:loaded.daten.entries };
const snapshot = new Map([["123", {
    ok:true,
    tv:{ name:"Testserie", overview:"Beschreibung", number_of_seasons:1 },
    seasons:{ "1":{ ok:true, data:{ episodes:[
        { episode_number:1, air_date:"2026-01-02" },
        { episode_number:2, air_date:"2026-01-09" }
    ] } } }
}]]);
const findings = api.maintenanceAnalyse_([group], snapshot);
assert.equal(findings.some(item => item.type === "DATES_READY" && item.action === "apply"), true);
const operations = api.maintenanceBuildOperations_([group], snapshot, findings);
assert.equal(operations.length, 1);

const before = api.maintenanceArchiveSnapshot_(operations[0]);
api.maintenanceWriteArchive_(operations[0]);
let changed = fs.readFileSync(filePath, "utf8");
assert.match(changed, /startOriginal=2026-01-02/);
assert.match(changed, /dates=02\.01\.,09\.01\./);
assert.match(changed, /descDE=Bleibt%20erhalten/);
assert.match(changed, /note=Meine%20Notiz/);
api.maintenanceRestoreArchive_(before);
assert.equal(fs.readFileSync(filePath, "utf8"), original);

const providerInfo={country:"AU",checkedAt:"2026-10-16",offers:[{id:8,name:"Netflix",type:"flatrate"}],source:"JustWatch via TMDB",link:""};
snapshot.get("123").watchProviders=providerInfo;
api.maintenanceWriteProviders_([group],snapshot);
const metadata=api.archiveLoad_().daten.entries[0];
assert.equal(metadata.watchProviders.country,"AU");
assert.equal(metadata.note,"Meine Notiz");
assert.equal(metadata.tmdbId,123);
assert.match(fs.readFileSync(filePath,"utf8"),/flags=32/);
api.maintenanceRestoreArchive_(before);

// An existing wrong localized archive title is repaired, not deleted/reinserted.
api.saveSettingsPatch_({language:"en"});
snapshot.get("123").tv={name:"The Testaments",original_name:"The Testaments",original_language:"en",alternative_titles:{results:[{iso_3166_1:"CA",title:"Les Testaments"}]}};
fs.writeFileSync(filePath,original.trim()+"; titleEN=Les%20Testaments\n","utf8");
const titleChanges=api.maintenanceWriteProviders_([group],snapshot);
assert.equal(titleChanges[0].previousTitle,"Les Testaments");assert.equal(titleChanges[0].title,"The Testaments");
assert.equal(api.archiveLoad_().daten.entries[0].titleEN,"The Testaments");
assert.equal(api.archiveLoad_().daten.entries[0].note,"Meine Notiz");
assert.equal(api.archiveLoad_().daten.entries[0].tmdbId,123);
// The same maintenance must preserve a user-protected title.
fs.writeFileSync(filePath,original.trim()+"; titleEN=My%20own%20title; manualFlags=1\n","utf8");
assert.equal(api.maintenanceWriteProviders_([group],snapshot).length,0);
assert.equal(api.archiveLoad_().daten.entries[0].titleEN,"My own title");
api.maintenanceRestoreArchive_(before);api.saveSettingsPatch_({language:"de"});

const laterGroup={tmdbId:77,entries:[7,9].map(n=>({tmdbId:77,titel:"Later start",fileName:"Later start (2026).txt",staffelLabel:"S0"+n,episoden:2,datesOriginal:["2026-11-01","2026-11-08"]}))};
const laterSeasons={};for(let n=1;n<=9;n++)laterSeasons[n]={ok:true,data:{episodes:[{episode_number:1,air_date:"2026-11-01"},{episode_number:2,air_date:"2026-11-08"}]}};
const limitedFindings=api.maintenanceAnalyse_([laterGroup],new Map([["77",{ok:true,tv:{name:"Later start",number_of_seasons:9},seasons:laterSeasons}]]));
assert.deepEqual(Array.from(limitedFindings.filter(f=>f.type.startsWith("NEW_SEASON")),f=>f.tmdbSeason),[8]);

const managed = {
    summary:"Testserie (2025) S01E01",
    start:{ date:"2026-01-02" },
    end:{ date:"2026-01-03" },
    description:"SerKal",
    extendedProperties:{ private:{
        serkal:"1", tmdbId:"123", season:"S01", episodeFrom:"1", episodeTo:"1"
    } }
};
const crypto = require("node:crypto");
const source = [managed.summary,"2026-01-02","2026-01-03","SerKal","123","S01","1","1"].join("|");
managed.extendedProperties.private.serkalSignature = crypto.createHash("sha256").update(source).digest("hex");
assert.equal(api.googleCalendarEventWasManuallyChanged_(managed), false);
managed.summary += " händisch";
assert.equal(api.googleCalendarEventWasManuallyChanged_(managed), true);

console.log("SERKAL maintenance smoke test: OK");

// Announcement metadata survives TXT round trips and a second maintenance is silent.
const announcementRecord={ok:true,tv:{name:'Testserie'},seasons:{2:{ok:true,data:{air_date:'2099-01-01',episodes:[]}}}};
let announcementGroup={tmdbId:123,entries:api.archiveLoad_().daten.entries};
const announcementSnapshot=new Map([['123',announcementRecord]]);
const announced=api.maintenanceWriteProviders_([announcementGroup],announcementSnapshot);
assert.equal(announced.filter(r=>r.kind==='announced-season').length,1);
announcementGroup={tmdbId:123,entries:api.archiveLoad_().daten.entries};
assert.equal(announcementGroup.entries[0].announcements[0].date,'2099-01-01');
assert.equal(announcementGroup.entries[0].calendarLanguage,'de');
assert.equal(api.maintenanceWriteProviders_([announcementGroup],announcementSnapshot).filter(r=>r.kind==='announced-season'||r.kind==='announcement-changed').length,0);
assert.equal(announcementGroup.entries[0].note,'Meine Notiz');
console.log('Maintenance announcement TXT round trip and second-run silence: OK');


// An announcement with eight expected episodes cannot become a complete one-episode season.
const provisionalFile=path.join(archivePath,'Ahsoka (2023).txt');
fs.writeFileSync(provisionalFile,'S02; tmdb=42; eps=8; startOriginal=2027-01-19; announcementOnly=1; dates=; announcements='+encodeURIComponent(JSON.stringify([{season:2,date:'2027-01-19',title:'Ahsoka',history:[]}]))+'\n');
const provisionalEntry=api.archiveLoad_().daten.entries.find(e=>e.tmdbId===42);
assert.equal(provisionalEntry.announcementOnly,true);assert.equal(provisionalEntry.status,1);
const provisionalGroup={tmdbId:42,entries:[provisionalEntry]};
const oneEpisode=new Map([['42',{ok:true,tv:{name:'Ahsoka',number_of_seasons:2},seasons:{2:{ok:true,data:{episodes:[{air_date:'2027-01-19'}]}}}}]]);
const provisionalFindings=api.maintenanceAnalyse_([provisionalGroup],oneEpisode);
assert.equal(provisionalFindings.filter(f=>f.action==='apply').length,0);
assert.equal(api.maintenanceBuildOperations_([provisionalGroup],oneEpisode,[{action:'apply',tmdbId:42,seasonNumber:2,type:'DATES_READY'}]).length,0);

// Maintenance creates an eligible next announced season and does not duplicate it.
fs.writeFileSync(path.join(archivePath,'Follow (2020).txt'),
    'S01; startOriginal=2020-01-01; eps=2; tmdb=700; dates=01.01.,08.01.; seen=1; flags=0\n');
let followGroup={tmdbId:700,entries:api.archiveLoad_().daten.entries.filter(e=>e.tmdbId===700)};
const followRecord={ok:true,tv:{name:'Follow',seasons:[{season_number:2,episode_count:8,air_date:'2099-02-01'}]},
    seasons:{2:{ok:true,data:{episodes:[{episode_number:1,air_date:'2099-02-01'}]}}}};
const followSnapshot=new Map([['700',followRecord]]);
api.maintenanceWriteProviders_([followGroup],followSnapshot);
followGroup={tmdbId:700,entries:api.archiveLoad_().daten.entries.filter(e=>e.tmdbId===700)};
assert.equal(followGroup.entries.length,2);
const next=followGroup.entries.find(e=>e.staffelLabel==='S02');
assert.equal(next.announcementOnly,true);
assert.equal(next.episoden,8);
assert.equal(next.datesOriginal.length,0);
api.maintenanceWriteProviders_([followGroup],followSnapshot);
assert.equal(api.archiveLoad_().daten.entries.filter(e=>e.tmdbId===700).length,2);
console.log('Maintenance creates one provisional next season with known start and no invented dates: OK');

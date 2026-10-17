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
        { air_date:"2026-01-02" },
        { air_date:"2026-01-09" }
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
const laterSeasons={};for(let n=1;n<=9;n++)laterSeasons[n]={ok:true,data:{episodes:[{air_date:"2026-11-01"},{air_date:"2026-11-08"}]}};
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


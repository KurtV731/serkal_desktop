const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const backend = fs.readFileSync(path.resolve("2 src/backend/main.js"), "utf8");
assert.doesNotMatch(backend, /for \(const eventId of googleCalendarEventIdCandidates_\(idPayload, block\)\)/);
assert.match(backend, /const actualEvents = new Map\(\)/);
assert.match(backend, /googleCalendarFindSummaryAnywhere_\(calendarId, summary\)/);
assert.match(backend, /Kalendertermin mit neuer Google-ID wiederangelegt/);
assert.match(backend, /status \|\| ""\)\.toLowerCase\(\) === "cancelled"/);

let exposed = null;
const preloadSource = fs.readFileSync(path.resolve("2 src/common/preload.js"), "utf8");
const context = {
    require(id) {
        if (id !== "electron") return require(id);
        return {
            contextBridge:{ exposeInMainWorld(_name, value){ exposed = value; } },
            ipcRenderer:{ invoke(){}, send(){} }
        };
    },
    process:{ argv:["electron", "--serkal-version=1.0.7-f1", "--serkal-installed"] },
    window:{ addEventListener(){} },
    document:{ title:"", querySelector(){ return null; } },
    console
};
vm.createContext(context);
vm.runInContext(preloadSource, context, { filename:"preload.js" });
assert.ok(exposed);
assert.equal(exposed.version, "1.0007f1");

console.log("SERKAL calendar repair 1.007f1 test: OK");

'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
function prepare(appData) {
 const root=path.join(appData,'SerKal-Calendar-Lab');
 fs.mkdirSync(root,{recursive:true});
 const configFile=path.join(root,'lab.json');
 let config;
 if(fs.existsSync(configFile)) config=JSON.parse(fs.readFileSync(configFile,'utf8'));
 else {config={id:crypto.randomUUID()};fs.writeFileSync(configFile,JSON.stringify(config),'utf8');}
 if(!/^[a-f0-9-]{36}$/.test(String(config.id)))throw new Error('Invalid calendar lab identity');
 const archive=path.join(root,'Archiv');fs.mkdirSync(archive,{recursive:true});
 const key=path.join(root,'tmdb.json');const normalKey=path.join(appData,'SerKal','tmdb.json');
 if(!fs.existsSync(key)&&fs.existsSync(normalKey))fs.copyFileSync(normalKey,key);
 const settings=path.join(root,'settings.json');
 if(!fs.existsSync(settings))fs.writeFileSync(settings,JSON.stringify({setupDone:true,language:'de',archive:{folderPath:archive},calendar:{mode:'google',googleCalendarId:''}}),'utf8');
 return {root,archive,calendarName:'SerKal Testlabor '+config.id};
}
module.exports={prepare};

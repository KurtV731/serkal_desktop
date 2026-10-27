'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
const {prepare}=require('../2 src/common/session-test-profile');
const root=fs.mkdtempSync(path.join(os.tmpdir(),'serkal-isolation-'));
try{
 const normal=path.join(root,'SerKal');fs.mkdirSync(normal);
 fs.writeFileSync(path.join(normal,'settings.json'),JSON.stringify({archive:{folderPath:'REAL'},calendar:{mode:'google',googleCalendarId:'PRIVATE'}}));
 fs.writeFileSync(path.join(normal,'tmdb.json'),'{}');fs.writeFileSync(path.join(normal,'google_calendar_token.json'),'PRIVATE');
 const profile=prepare(root);const settings=JSON.parse(fs.readFileSync(path.join(profile.root,'settings.json'),'utf8'));
 assert.equal(settings.archive.folderPath,profile.archive);assert.equal(settings.calendar.mode,'none');assert.equal(settings.calendar.googleCalendarId,'');assert(!fs.existsSync(path.join(profile.root,'google_calendar_token.json')));assert.equal(fs.readFileSync(path.join(normal,'google_calendar_token.json'),'utf8'),'PRIVATE');
 assert.equal(prepare(root).root,profile.root);
 console.log('session profile: separate paths, no real calendar credentials or settings, stable test identity passed');
}finally{fs.rmSync(root,{recursive:true,force:true});}

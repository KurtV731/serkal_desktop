'use strict';
const fs=require('node:fs'),path=require('node:path');
function prepare(appData){
    const root=path.join(appData,'SerKal-Session-Test-34'),archive=path.join(root,'Archiv');
    fs.mkdirSync(archive,{recursive:true});
    const normal=path.join(appData,'SerKal');
    // Reuse only credentials locally, never archive data, copy state or calendar IDs.
    for(const name of ['tmdb.json','google_shared_key_token.json']){
        if(!fs.existsSync(path.join(root,name))&&fs.existsSync(path.join(normal,name)))fs.copyFileSync(path.join(normal,name),path.join(root,name));
    }
    if(!fs.existsSync(path.join(root,'settings.json')))fs.writeFileSync(path.join(root,'settings.json'),JSON.stringify({setupDone:true,language:'de',archive:{folderPath:archive},calendar:{mode:'none',googleCalendarId:''}}));
    return {root,archive};
}
module.exports={prepare};

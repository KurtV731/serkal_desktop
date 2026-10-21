"use strict";
// Separate Firefox calendar window: never close or kill a browser process.
const path = require("node:path");
async function openCalendarWindow(url, {platform=process.platform, env=process.env, exists, launch, openExternal, workArea={width:1280,height:800}}) {
  const parsed=new URL(url);
  if(parsed.protocol!=="https:" || parsed.hostname!=="calendar.google.com") throw new Error("Invalid calendar URL");
  const roots=[env.ProgramFiles,env["ProgramFiles(x86)"],env.LOCALAPPDATA && path.join(env.LOCALAPPDATA,"Programs")].filter(Boolean);
  const firefox=platform==="win32" && roots.map(root=>path.join(root,"Mozilla Firefox","firefox.exe")).find(exists);
  if(!firefox){await openExternal(url);return {separateWindow:false};}
  const width=Math.max(640,Math.floor(workArea.width*.88));
  const height=Math.max(360,Math.floor(workArea.height*.5));
  await launch(firefox,["-width",String(width),"-height",String(height),"-new-window",url]);
  return {separateWindow:true,width,height};
}
module.exports={openCalendarWindow};

'use strict';
// Use a real external Chromium browser window, never an Electron Google webview.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const supported=new Set(['chrome.exe','msedge.exe','brave.exe','chromium.exe']);
function registryValue(text){return /REG_(?:EXPAND_)?SZ\s+(.+)$/m.exec(text||'')?.[1]?.trim()||'';}
function commandExecutable(command){return /^"([^"]+\.exe)"/i.exec(command)?.[1]||/^([^\s]+\.exe)(?:\s|$)/i.exec(command)?.[1]||'';}
function bounds(area={x:0,y:0,width:1280,height:900}){
 const width=Math.max(1,Math.min(640,area.width-32)),height=Math.max(1,Math.min(780,area.height-32));
 return {width,height,x:Math.round(area.x+(area.width-width)/2),y:Math.round(area.y+(area.height-height)/2)};
}
async function findBrowser({platform=process.platform,env=process.env,exists=fs.existsSync,query}={}){
 if(platform==='win32'){
  query=query||((key,value)=>new Promise(resolve=>cp.execFile('reg.exe',['query',key,...(value?['/v',value]:['/ve'])],{windowsHide:true,timeout:3000},(_error,out)=>resolve(registryValue(out)))));
  // UserChoice identifies the user's existing browser; no profile/cookie access.
  let progId='';
  try{progId=await query('HKCU\\Software\\Microsoft\\Windows\\Shell\\Associations\\UrlAssociations\\https\\UserChoice','ProgId');}catch(_){}
  // The production registry reader uses /v ProgId for this non-default value.
  if(progId){try{const exe=commandExecutable(await query('HKCR\\'+progId+'\\shell\\open\\command'));
   if(supported.has(path.win32.basename(exe).toLowerCase())&&exists(exe))return exe;}catch(_){}}
  const roots=[env.LOCALAPPDATA,env.PROGRAMFILES,env['PROGRAMFILES(X86)'],env.ProgramFiles,env['ProgramFiles(x86)']].filter(Boolean);
  for(const relative of ['BraveSoftware\\Brave-Browser\\Application\\brave.exe','Google\\Chrome\\Application\\chrome.exe','Microsoft\\Edge\\Application\\msedge.exe'])
   for(const root of roots){const exe=path.win32.join(root,relative);if(exists(exe))return exe;}
 }else if(platform==='darwin'){
  for(const exe of ['/Applications/Brave Browser.app/Contents/MacOS/Brave Browser','/Applications/Google Chrome.app/Contents/MacOS/Google Chrome','/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge'])if(exists(exe))return exe;
 }else{
  for(const exe of ['/usr/bin/brave-browser','/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser'])if(exists(exe))return exe;
 }
 throw Object.assign(new Error('GOOGLE_WINDOW_BROWSER_MISSING'),{code:'GOOGLE_WINDOW_BROWSER_MISSING'});
}
function argumentsFor(url,area){
 const target=new URL(url);if(target.origin!=='https://accounts.google.com'||target.pathname!=='/o/oauth2/v2/auth')throw Error('GOOGLE_WINDOW_URL_INVALID');
 const b=bounds(area);return ['--new-window','--window-size='+b.width+','+b.height,'--window-position='+b.x+','+b.y,'--app='+target.toString()];
}
async function open(url,{area,spawn=cp.spawn,...discovery}={}){
 const args=argumentsFor(url,area),executable=await findBrowser(discovery);
 await new Promise((resolve,reject)=>{
  const child=spawn(executable,args,{detached:true,stdio:'ignore',shell:false,windowsHide:false});
  child.once('error',reject);child.once('spawn',()=>{child.unref();resolve();});
 });
 return {browser:path.win32.basename(executable)};
}
function resultPage(message){
 const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 return "<!doctype html><html><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'><title>SerKal</title></head><body style='font:18px system-ui;padding:24px;background:#f6f3ff;color:#172033'><p>"+escape(message)+"</p><script>setTimeout(function(){window.close();},300);</script></body></html>";
}
module.exports={open,findBrowser,argumentsFor,bounds,resultPage,registryValue,commandExecutable};

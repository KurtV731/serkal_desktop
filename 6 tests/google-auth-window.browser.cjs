'use strict';
// Real external browser, isolated test profile, local pages only. No Google account.
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),http=require('node:http'),cp=require('node:child_process');
const {chromium}=require('playwright'),policy=require('../2 src/common/google-auth-window');
(async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'serkal-browser-window-'));
 let browser,child,server;
 try{
  server=http.createServer((req,res)=>{res.setHeader('Content-Type','text/html; charset=utf-8');res.end(req.url==='/done'?policy.resultPage('Google connection established. Return to SerKal.'):'<!doctype html><title>SerKal – test sign-in</title><h1>SerKal sign-in window</h1><p>Local test page. No Google account is used.</p>');});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const url='http://127.0.0.1:'+server.address().port;
  const executable=await policy.findBrowser();
  const args=['about:blank'];
  // CDP and profile isolation exist only in this test, never in the app launcher.
  args.push('--remote-debugging-port=0','--user-data-dir='+root,'--no-first-run','--no-default-browser-check');
  if(process.platform!=='win32')args.push('--headless=new','--no-sandbox');
  child=cp.spawn(executable,args,{stdio:'ignore'});let spawnError;child.once('error',e=>spawnError=e);
  const active=path.join(root,'DevToolsActivePort');const end=Date.now()+20000;
  while(!fs.existsSync(active)){if(spawnError)throw spawnError;if(Date.now()>end)throw Error('Browser CDP startup timeout');await new Promise(r=>setTimeout(r,100));}
  const [port]=fs.readFileSync(active,'utf8').trim().split(/\r?\n/);
  browser=await chromium.connectOverCDP('http://127.0.0.1:'+port);
  const session=await browser.newBrowserCDPSession();
  const initial=await session.send('Target.getTargets');const oldTarget=initial.targetInfos.find(t=>t.type==='page');assert(oldTarget);
  const oldWindow=await session.send('Browser.getWindowForTarget',{targetId:oldTarget.targetId});
  await session.send('Browser.setWindowBounds',{windowId:oldWindow.windowId,bounds:{windowState:'maximized'}});
  const before=await session.send('Browser.getWindowBounds',{windowId:oldWindow.windowId});
  await policy.open('https://accounts.google.com/o/oauth2/v2/auth?state=local-test',{
   area:{x:0,y:0,width:1280,height:900},spawn:(exe,actualArgs,options)=>{
    assert.equal(exe,executable);actualArgs[actualArgs.length-1]='--app='+url;actualArgs.push('--user-data-dir='+root);
    if(process.platform!=='win32')actualArgs.push('--no-sandbox');
    return cp.spawn(exe,actualArgs,options);
   }
  });
  let page;while(!(page=browser.contexts().flatMap(c=>c.pages()).find(p=>p.url().startsWith(url)))){if(Date.now()>end)throw Error('Separate app window did not appear');await new Promise(r=>setTimeout(r,100));}
  await page.waitForSelector('h1');
  const targets=await session.send('Target.getTargets'),target=targets.targetInfos.find(t=>t.url.startsWith(url));assert(target);
  const window=await session.send('Browser.getWindowForTarget',{targetId:target.targetId});
  assert.notEqual(window.windowId,oldWindow.windowId);assert.deepEqual(await session.send('Browser.getWindowBounds',{windowId:oldWindow.windowId}),before);
  assert.equal(window.bounds.windowState,'normal');
  assert(window.bounds.width<=672&&window.bounds.height<=812,JSON.stringify(window.bounds));assert(window.bounds.width>=600&&window.bounds.height>=700);
  fs.mkdirSync('test-results',{recursive:true});
  fs.writeFileSync('test-results/google-window-bounds.json',JSON.stringify({platform:process.platform,executable,window:window.bounds},null,2));
  await page.screenshot({path:'test-results/google-window-content.png'});
  if(process.platform==='win32'){
   const shot=path.resolve('test-results/google-window-desktop.png');
   cp.execFileSync('powershell.exe',['-NoProfile','-Command',`Add-Type -AssemblyName System.Windows.Forms;Add-Type -AssemblyName System.Drawing;$b=[System.Windows.Forms.Screen]::PrimaryScreen.Bounds;$i=New-Object Drawing.Bitmap $b.Width,$b.Height;$g=[Drawing.Graphics]::FromImage($i);$g.CopyFromScreen($b.Location,[Drawing.Point]::Empty,$b.Size);$i.Save('${shot.replaceAll("'","''")}');$g.Dispose();$i.Dispose()`]);
  }
  // Self-close is best effort in production. For a fresh window with a single
  // history entry it must work; never close another browser window/process.
  const closed=page.waitForEvent('close',{timeout:10000});await page.evaluate(target=>location.replace(target),url+'/done').catch(e=>{if(!/closed|detached|ERR_ABORTED/.test(e.message))throw e;});await closed;
  assert(browser.contexts().flatMap(c=>c.pages()).some(p=>p.url()==='about:blank'));
  console.log('External browser window normal and bounded; local completion page closes its own window. Evidence in test-results.');
 }finally{
  if(browser)await browser.close().catch(()=>{});if(child&&!child.killed)child.kill();if(server){server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
  // Browser profiles are temporary; allow Windows to release its handles.
  for(let n=0;n<20;n++){try{fs.rmSync(root,{recursive:true,force:true});break;}catch(_){await new Promise(r=>setTimeout(r,100));}}
 }
})().catch(error=>{console.error(error);process.exitCode=1;});

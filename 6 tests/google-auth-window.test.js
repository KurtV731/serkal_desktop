'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),http=require('node:http'),crypto=require('node:crypto'),{EventEmitter}=require('node:events');
const windowPolicy=require('../2 src/common/google-auth-window');
(async()=>{
 const b=windowPolicy.bounds({x:-1200,y:30,width:1200,height:700});assert.deepEqual(b,{width:640,height:668,x:-920,y:46});
 const auth='https://accounts.google.com/o/oauth2/v2/auth?state=test';const args=windowPolicy.argumentsFor(auth,{x:0,y:0,width:1920,height:1080});
 assert(args.includes('--app='+auth));assert(args.includes('--window-size=640,780'));assert(!args.some(s=>/start-maximized|kiosk|fullscreen|disable-web-security|user-data-dir/.test(s)));
 assert.throws(()=>windowPolicy.argumentsFor('file:///bad'),/INVALID/);
 assert.equal(windowPolicy.registryValue('    ProgId    REG_SZ    BraveHTML'),'BraveHTML');
 const queries=[];const exe='C:\\Browser\\brave.exe';
 assert.equal(await windowPolicy.findBrowser({platform:'win32',exists:p=>p===exe,query:async(k,v)=>{queries.push([k,v]);return v==='ProgId'?'BraveHTML':'"'+exe+'" --single-argument %1';}}),exe);
 assert.equal(queries[0][1],'ProgId');
 const fallback='C:\\Programs\\Microsoft\\Edge\\Application\\msedge.exe';
 assert.equal(await windowPolicy.findBrowser({platform:'win32',env:{PROGRAMFILES:'C:\\Programs'},query:async()=>{throw Error('registry unavailable');},exists:p=>p===fallback}),fallback);
 await assert.rejects(windowPolicy.findBrowser({platform:'win32',env:{},query:async()=>'',exists:()=>false}),/MISSING/);
 let spawnCall;await windowPolicy.open(auth,{platform:'win32',env:{},query:async(_k,v)=>v?'BraveHTML':'"'+exe+'"',exists:p=>p===exe,spawn:(...call)=>{spawnCall=call;const child=new EventEmitter();child.unref=()=>{};queueMicrotask(()=>child.emit('spawn'));return child;}});
 assert.equal(spawnCall[0],exe);assert.equal(spawnCall[2].shell,false);
 assert(windowPolicy.resultPage('<script>bad</script>').includes('&lt;script&gt;'));assert(!windowPolicy.resultPage('<script>bad</script>').includes('<script>bad'));
 // Exercise the actual production OAuth server/PKCE/state/token/return path.
 const source=fs.readFileSync(path.join(__dirname,'../2 src/backend/main.js'),'utf8');
 const production=source.slice(source.indexOf('function googleOauthBrowserLogin_('),source.indexOf('\nfunction googleSharedKeyTokenFile_'));
 for(const outcome of ['success','cancel','failure','launch-error','timeout']){
  let authorization,tokenWrites=0,focused=0,timer,scheduled,received;
  const context={require:name=>{assert(name.endsWith('google-auth-window'));return {...windowPolicy,open:async url=>{authorization=new URL(url);if(outcome==='launch-error')throw Error('launch failed');return {browser:'test-browser'};}};},
   crypto,http,URL,Date,Promise,Error,setTimeout:fn=>{timer=fn;return 1;},clearTimeout:()=>{},
   screen:{getDisplayNearestPoint:()=>({workArea:{x:0,y:0,width:1280,height:900}}),getCursorScreenPoint:()=>({x:1,y:1})},
   googleOauthWriteToken_:()=>tokenWrites++,GOOGLE_CALENDAR_SCOPES:['calendar'],googleOauthTokenHasRequiredScope_:()=>true,
   googleOauthTokenRequest_:async params=>{assert(params.code_verifier);assert.equal(params.redirect_uri,authorization.searchParams.get('redirect_uri'));if(outcome==='failure')throw Error('token exchange failed');return {access_token:'secret',expires_in:3600};},
   calendarLab_:false,bt_:key=>key,bringSerkalToFront_:()=>focused++,logWrite_:()=>{}};
  vm.createContext(context);vm.runInContext(production,context);
  const result=context.googleOauthBrowserLogin_({clientId:'test',clientSecret:'test'}).then(value=>({value}),error=>({error}));
  while(!authorization)await new Promise(resolve=>setImmediate(resolve));
  await new Promise(resolve=>setImmediate(resolve));
  if(outcome==='timeout')timer();
  else if(outcome!=='launch-error'){
   const callback=new URL(authorization.searchParams.get('redirect_uri'));callback.searchParams.set('state',authorization.searchParams.get('state'));callback.searchParams.set(outcome==='cancel'?'error':'code',outcome==='cancel'?'access_denied':'code');
   received=await fetch(callback).then(async r=>({status:r.status,body:await r.text()}));
  }
  const actual=await result;
  if(outcome==='success'){assert(actual.value);assert.equal(tokenWrites,1);assert.equal(received.status,200);assert(received.body.includes('window.close()'));assert(!received.body.includes('secret'));}
  else {assert(actual.error);assert.equal(tokenWrites,0);}
  assert.equal(focused,outcome==='launch-error'?0:1);
 }
 console.log('Google browser window: real external app-window launch, work-area bounds, default/fallback discovery, no embedded OAuth; actual loopback success/cancel/error/timeout and focus passed');
})().catch(error=>{console.error(error);process.exitCode=1;});

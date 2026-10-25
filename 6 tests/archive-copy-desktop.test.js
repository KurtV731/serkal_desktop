'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const copy=require('../2 src/common/archive-copy'),{DesktopCopy}=require('../2 src/common/archive-copy-desktop');
(async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'serkal-manager-')),folder=path.join(root,'archive');fs.mkdirSync(folder);
 fs.writeFileSync(path.join(folder,'Test (2026).txt'),'S01; tmdb=42; startOriginal=2026-10-12; dates=12.10.\n');
 const records=[],archived=new Set();let failPatch=false;const originalFetch=global.fetch;
 const metadata=r=>({id:r.revision,name:(archived.has(r.revision)?'serkal-history-v2-':'serkal-copy-v2-')+r.revision+'.json',md5Checksum:copy.hash(JSON.stringify(r)),appProperties:{owner:'123',revision:r.revision,parent:r.parent||'root',...(r.releaseNumber===undefined?{}:{releaseNumber:String(r.releaseNumber)}),...(r.authorityId?{authorityId:r.authorityId}:{})}});
 global.fetch=async(url,options)=>{
  let body;if(url.includes('userinfo'))body={sub:'123',email_verified:true};
  else if(options.method==='PATCH'){if(failPatch){failPatch=false;return {ok:false,status:503,text:async()=>'{"error":"offline"}'};}const id=decodeURIComponent(url.split('/files/')[1].split('?')[0]);archived.add(id);body={id};}
  else if(options.method==='POST'){const text=options.body;const marker='Content-Type: application/json\r\n\r\n';const from=text.lastIndexOf(marker)+marker.length;const end=text.indexOf('\r\n--',from);records.push(JSON.parse(text.slice(from,end)));body={id:records.at(-1).revision};}
  else if(url.includes('alt=media'))body=records.find(r=>url.includes(r.revision));else body={files:records.filter(r=>!archived.has(r.revision)).map(metadata)};
  return {ok:true,text:async()=>JSON.stringify(body)};
 };
 const options={folder:()=>folder,stateFile:path.join(root,'state.json'),calendar:()=>({mode:'',id:''}),selectCalendar:()=>{},token:async()=>'test',bootstrap:async()=>{},calendarSync:async()=>{},lock:async fn=>fn()};
 try {
  let manager=new DesktopCopy(options);assert.throws(()=>manager.assertWrite(),/COPY_LOADING/);manager.error='COPY_CONFLICT';assert.throws(()=>manager.assertWrite(),/COPY_CONFLICT/);manager.error='';await manager.sync();assert.equal(manager.view().status,'saved');assert.equal(records.length,1);manager.assertWrite();
  fs.appendFileSync(path.join(folder,'Test (2026).txt'),'S02; tmdb=42; eps=2\n');manager.changed();clearTimeout(manager.timer);assert(manager.state.dirty);await manager.sync();assert.equal(records.length,2);assert(!manager.state.dirty);
  const otherFolder=path.join(root,'reader');fs.mkdirSync(otherFolder);fs.writeFileSync(path.join(otherFolder,'old.txt'),'S01; tmdb=99\n');
  const second=new DesktopCopy({...options,folder:()=>otherFolder,stateFile:path.join(root,'second.json')});await second.sync();assert.equal(second.view().status,'saved');assert(!fs.existsSync(path.join(otherFolder,'old.txt')));assert(fs.existsSync(path.join(otherFolder,'Test (2026).txt')));
  const revision=second.state.base;fs.appendFileSync(path.join(otherFolder,'Test (2026).txt'),'new local edit\n');
  const restart=new DesktopCopy({...options,folder:()=>otherFolder,stateFile:path.join(root,'second.json')});await restart.sync();assert.notEqual(restart.state.base,revision);assert(records.at(-1).files[0].content.endsWith('new local edit\n'));
  const conflict={schema:2,owner:'123',revision:require('node:crypto').randomUUID(),parent:'',generatedAt:new Date().toISOString(),files:[{name:'Other.txt',content:'S01; tmdb=8\\n',sha256:copy.hash('S01; tmdb=8\\n')}],calendar:{mode:'',id:''}};records.push(conflict);manager.error='COPY_HISTORY_MISSING';assert.throws(()=>manager.assertWrite(),/COPY_HISTORY_MISSING/);failPatch=true;const pending=await manager.adoptLocal();assert.equal(pending.authorityPending,true);assert(manager.state.adoption);manager=new DesktopCopy(options);assert.equal(manager.view().authorityPending,true);const adopted=await manager.sync();assert.equal(adopted.status,'saved');assert.equal(manager.error,'');manager.assertWrite();assert(records.length>=5);assert(records.every(r=>archived.has(r.revision)||r.revision===manager.state.base));assert.equal(manager.state.base,records.at(-1).revision);assert.equal(manager.state.authorityId,manager.state.base);assert.equal(records.at(-1).authorityId,manager.state.authorityId);
  const oldCount=fs.readdirSync(otherFolder).filter(name=>name.endsWith('.txt')).length;assert.equal(oldCount,1);
  const followed=await second.sync();assert.equal(followed.status,'authority-applied');assert.equal(second.state.authorityId,manager.state.authorityId);assert.equal(second.state.base,manager.state.base);assert.equal(second.state.dirty,false);assert.equal(fs.readdirSync(otherFolder).filter(name=>name.endsWith('.txt')).length,1);assert(!fs.readFileSync(path.join(otherFolder,'Test (2026).txt'),'utf8').includes('new local edit'));
  fs.appendFileSync(path.join(otherFolder,'Test (2026).txt'),'S03; tmdb=42; seen=1\n');second.changed();clearTimeout(second.timer);assert.equal((await second.sync()).status,'saved');assert.equal(second.state.dirty,false);assert(records.at(-1).authorityId===manager.state.authorityId);assert(records.at(-1).files[0].content.endsWith('S03; tmdb=42; seen=1\n'));assert.equal((await second.sync()).status,'saved');assert(fs.readFileSync(path.join(otherFolder,'Test (2026).txt'),'utf8').endsWith('S03; tmdb=42; seen=1\n'));
  const future={...records.at(-1),releaseNumber:31,parent:records.at(-1).revision,revision:require('node:crypto').randomUUID()};records.push(future);
  const beforeWrites=records.length,beforeArchived=archived.size;
  assert.equal((await second.sync()).code,'COPY_VERSION_MISMATCH');
  assert.throws(()=>second.assertWrite(),/COPY_VERSION_MISMATCH/);
  await assert.rejects(second.adoptLocal(),/COPY_VERSION_MISMATCH/);
  assert.equal(records.length,beforeWrites);assert.equal(archived.size,beforeArchived);
  const blockedRestart=new DesktopCopy({...options,folder:()=>otherFolder,stateFile:path.join(root,'second.json')});
  global.fetch=async()=>{throw Error('offline');};
  assert.equal((await blockedRestart.sync()).code,'COPY_VERSION_MISMATCH');
  assert.throws(()=>blockedRestart.assertWrite(),/COPY_VERSION_MISMATCH/);
  clearTimeout(manager.timer);clearTimeout(second.timer);clearTimeout(restart.timer);clearTimeout(blockedRestart.timer);
 }finally{global.fetch=originalFetch;fs.rmSync(root,{recursive:true,force:true});}
 console.log('desktop archive copy: first export, local edit, authority adoption, post-adoption edit and interrupted state recovery passed');
})().catch(e=>{console.error(e);process.exitCode=1;});

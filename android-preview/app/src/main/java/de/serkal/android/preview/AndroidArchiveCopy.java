package de.serkal.android.preview;

import android.content.Context;
import android.util.AtomicFile;
import org.json.*;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.*;
import java.util.concurrent.*;

/** UI edits are local; a separate worker owns transfers and survives ordinary app backgrounding. */
final class AndroidArchiveCopy {
    interface Listener {void changed();}
    final String owner;
    private final AtomicFile disk;
    private final File directory;
    private final ScheduledExecutorService worker=Executors.newSingleThreadScheduledExecutor();
    private volatile JSONObject state;
    private JSONObject readOnlyRecord;
    private volatile String token;
    private volatile boolean closed,busy;
    private boolean loaded;
    private String status="loading",error="";
    private Listener listener;
    private File logFile;
    private ScheduledFuture<?> scheduled;
    AndroidArchiveCopy(Context context,String owner,String token,Listener listener) throws Exception {
        this.owner=owner;this.token=token;this.listener=listener;directory=context.getFilesDir();
        logFile=new File(directory,"serkal-log-"+ArchiveCodec.hash(owner)+".jsonl");
        disk=new AtomicFile(new File(directory,"archive-copy-"+ArchiveCodec.hash(owner)+".json"));
        state=new JSONObject().put("owner",owner).put("base","").put("dirty",false).put("epoch",0);
        try(InputStream in=disk.openRead();ByteArrayOutputStream out=new ByteArrayOutputStream()){
            byte[] b=new byte[8192];int n;while((n=in.read(b))!=-1){out.write(b,0,n);if(out.size()>ArchiveCodec.LIMIT*2L)throw new Exception("COPY_TOO_LARGE");}
            state=new JSONObject(out.toString("UTF-8"));if(!owner.equals(state.getString("owner")))throw new Exception("COPY_ACCOUNT_CHANGED");
            if(state.has("record"))ArchiveCodec.validate(state.getJSONObject("record"),owner);
            if(state.has("pending"))ArchiveCodec.validate(state.getJSONObject("pending"),owner);
        }catch(FileNotFoundException absent){}catch(Exception invalid){error="COPY_LOCAL_STATE_INVALID";}
    }
    private synchronized void save(JSONObject value) throws Exception {
        if(closed)throw new Exception("COPY_CLOSED");if(!spaceFor(value))throw new Exception("COPY_LOW_SPACE");FileOutputStream out=null;
        try {out=disk.startWrite();out.write(value.toString().getBytes(StandardCharsets.UTF_8));disk.finishWrite(out);state=value;}
        catch(Exception failure){if(out!=null)disk.failWrite(out);throw failure;}
    }
    private static String now(){SimpleDateFormat f=new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",Locale.ROOT);f.setTimeZone(TimeZone.getTimeZone("UTC"));return f.format(new Date());}
    private synchronized void log(String event,String code) {
        try {if(logFile.length()>256*1024){File backup=new File(logFile.getPath()+".old");if(backup.exists())backup.delete();logFile.renameTo(backup);}
            try(FileOutputStream out=new FileOutputStream(logFile,true)){out.write((new JSONObject().put("time",now()).put("event",event).put("code",code.matches("[A-Z0-9_]*")?code:"COPY_NETWORK_FAILED").toString()+"\n").getBytes(StandardCharsets.UTF_8));}}
        catch(Exception ignored){}
    }
    synchronized String readLog() throws Exception {
        StringBuilder text=new StringBuilder();try(BufferedReader reader=new BufferedReader(new InputStreamReader(new FileInputStream(logFile),StandardCharsets.UTF_8))){String line;while((line=reader.readLine())!=null){text.append(line).append('\n');if(text.length()>20000)text.delete(0,text.length()-15000);}}catch(FileNotFoundException absent){}
        return text.toString();
    }
    private boolean spaceFor(JSONObject value){long bytes=value.toString().getBytes(StandardCharsets.UTF_8).length;return directory.getUsableSpace()>=Math.max(10*1024*1024L,bytes*3+1024*1024L);}
    private synchronized boolean space(){return spaceFor(state);}
    synchronized boolean writable(){return loaded && state.has("record") && space() && !fatal() && !closed && !busy;}
    private boolean fatal(){return error.matches("COPY_(CONFLICT|ACCOUNT_CHANGED|LOCAL_STATE_INVALID|INVALID|HISTORY_MISSING|NEEDS_SOURCE|LEGACY_PENDING)");}
    synchronized String status(){if(!space())return "COPY_LOW_SPACE";if(state.optBoolean("authorityPending")&&!error.matches("COPY_(ACCOUNT_CHANGED|LOCAL_STATE_INVALID)"))return "authority-pending";if(!error.isEmpty())return error;return status;}
    boolean busy(){return busy;}
    synchronized String calendarId() {
        JSONObject record=readOnlyRecord!=null?readOnlyRecord:state.optJSONObject("record");
        JSONObject calendar=record==null?null:record.optJSONObject("calendar");
        return calendar==null?"":calendar.optString("id");
    }
    synchronized JSONObject snapshot() throws Exception {
        if(readOnlyRecord==null && !state.has("record"))return null;JSONObject r=readOnlyRecord!=null?readOnlyRecord:state.getJSONObject("record");
        return new JSONObject().put("epoch",state.optLong("epoch")).put("owner",owner).put("generatedAt",r.getString("generatedAt")).put("entries",ArchiveCodec.entries(r));
    }
    synchronized void maintenance(long epoch,JSONArray patches) throws Exception {
        if(!writable())throw new Exception(!space()?"COPY_LOW_SPACE":!error.isEmpty()?error:"COPY_LOADING");
        if(state.optLong("epoch")!=epoch)throw new Exception("COPY_LOCAL_CHANGED");
        JSONObject next=new JSONObject(state.toString());next.put("record",ArchiveCodec.maintenance(next.getJSONObject("record"),patches));
        if(next.getJSONObject("record").toString().equals(state.getJSONObject("record").toString()))return;
        next.put("dirty",true).put("epoch",epoch+1);save(next);status="pending";error="";log("MAINTENANCE_SAVED","");notifyChange();schedule(1);
    }
    synchronized void edit(String action,JSONObject payload) throws Exception {
        if(!writable())throw new Exception(!space()?"COPY_LOW_SPACE":error.isEmpty()?"COPY_LOADING":error);
        JSONObject next=new JSONObject(state.toString());next.put("record",ArchiveCodec.edit(next.getJSONObject("record"),action,payload));
        next.put("dirty",true).put("epoch",next.getLong("epoch")+1);save(next);status="pending";error="";log("LOCAL_SAVED","");notifyChange();schedule(1);
    }
    synchronized boolean useOfflineCache(){loaded=state.has("record") && !fatal();if(loaded){status=state.optBoolean("dirty")?"pending":"offline";error="COPY_CONNECT";}return loaded;}
    synchronized boolean canMakeAuthoritative(){return state.has("record") && !closed && !busy &&
        (error.equals("COPY_CONFLICT") || error.equals("COPY_HISTORY_MISSING") || state.optBoolean("authorityPending"));}
    void makeAuthoritative(){
        synchronized(this){if(!canMakeAuthoritative())return;busy=true;status="syncing";}
        notifyChange();worker.execute(()->{
            try {
                JSONObject chosen;
                synchronized(this){
                    String revision=state.optString("authorityRevision"),generatedAt=state.optString("authorityGeneratedAt");
                    if(state.optBoolean("authorityPending") && !revision.isEmpty() && !generatedAt.isEmpty())chosen=ArchiveAuthority.select(state.getJSONObject("record"),owner,generatedAt,revision);
                    else {generatedAt=now();chosen=ArchiveAuthority.select(state.getJSONObject("record"),owner,generatedAt);
                        JSONObject next=new JSONObject(state.toString());next.put("authorityPending",true).put("authorityRevision",chosen.getString("revision")).put("authorityGeneratedAt",generatedAt);save(next);}
                }
                if(token==null || token.isEmpty())throw new Exception("COPY_CONNECT");
                ArchiveCopyClient client=new ArchiveCopyClient(token);if(!owner.equals(client.owner()))throw new Exception("COPY_ACCOUNT_CHANGED");
                publishAuthority(client,chosen,client.list(ArchiveCodec.PREFIX));
            } catch(Exception failure){synchronized(this){error=String.valueOf(failure.getMessage());status="error";log("LOCAL_AUTHORITY_FAILED",error);}}
            finally{synchronized(this){busy=false;}notifyChange();}
        });
    }
    private void publishAuthority(ArchiveCopyClient client,JSONObject chosen,List<JSONObject> active) throws Exception {
        client.archiveActiveRevisions(active);
        if(!client.list(ArchiveCodec.PREFIX).isEmpty())throw new Exception("COPY_CONFLICT");
        client.upload(chosen);
        JSONObject check=ArchiveCopyClient.head(client.list(ArchiveCodec.PREFIX),owner);
        if(check==null || !check.getJSONObject("appProperties").getString("revision").equals(chosen.getString("revision")))throw new Exception("COPY_CONFLICT");
        synchronized(this){JSONObject next=new JSONObject(state.toString());next.put("record",chosen).put("base",chosen.getString("revision")).put("dirty",false).put("lastSynced",now());
            next.remove("authorityPending");next.remove("authorityRevision");next.remove("authorityGeneratedAt");next.remove("pending");next.remove("pendingFileId");next.remove("pendingEpoch");
            save(next);error="";status="saved";loaded=true;log("LOCAL_AUTHORITY_PUBLISHED","");}
    }
    void updateToken(String token){this.token=token;}
    void setListener(Listener listener){this.listener=listener;}
    synchronized void schedule(int seconds){if(closed)return;if(scheduled!=null)scheduled.cancel(false);scheduled=worker.schedule(this::synchronize,seconds,TimeUnit.SECONDS);}
    private void notifyChange(){Listener l=listener;if(!closed && l!=null)l.changed();}
    void close(){closed=true;listener=null;worker.shutdownNow();}
    private void ensureCalendar(ArchiveCopyClient client,JSONObject pending) throws Exception {
        JSONObject calendar=pending.getJSONObject("calendar");
        if(!calendar.getString("mode").equals("google") || !calendar.getString("id").isEmpty() || (CalendarCopy.desired(pending).isEmpty() && SeasonAnnouncements.desired(ArchiveCodec.entries(pending)).isEmpty()))return;
        String marker="SerKal archive "+pending.getString("revision"),page="",found="";
        do {JSONObject r=client.get("https://www.googleapis.com/calendar/v3/users/me/calendarList?maxResults=250&showHidden=true&pageToken="+ArchiveCopyClient.esc(page));JSONArray items=r.optJSONArray("items");
            if(items!=null)for(int i=0;i<items.length();i++){JSONObject item=items.getJSONObject(i);if(marker.equals(item.optString("description"))){if(!found.isEmpty())throw new Exception("COPY_CONFLICT");found=item.getString("id");}}
            page=r.optString("nextPageToken");
        }while(!page.isEmpty());
        if(found.isEmpty()) {
            synchronized(this){if(state.optBoolean("calendarCreating"))throw new Exception("COPY_CALENDAR_CREATE_UNCERTAIN");JSONObject next=new JSONObject(state.toString());next.put("calendarCreating",true);save(next);}
            JSONObject created=client.request("https://www.googleapis.com/calendar/v3/calendars","POST",new JSONObject().put("summary","SerKal").put("description",marker).toString(),"application/json");found=created.getString("id");
        }
        calendar.put("id",found);
        synchronized(this){JSONObject next=new JSONObject(state.toString());next.put("pending",pending);next.getJSONObject("record").getJSONObject("calendar").put("id",found);next.remove("calendarCreating");save(next);}
    }
    private void synchronize() {
        synchronized(this){if(closed||busy)return;busy=true;status="syncing";log("SYNC_START","");}notifyChange();
        try {
            if(error.equals("COPY_LOCAL_STATE_INVALID"))throw new Exception(error);
            if(token==null || token.isEmpty())throw new Exception("COPY_CONNECT");
            ArchiveCopyClient client=new ArchiveCopyClient(token);if(!owner.equals(client.owner()))throw new Exception("COPY_ACCOUNT_CHANGED");
            List<JSONObject> remoteFiles=client.list(ArchiveCodec.PREFIX);JSONObject tip=ArchiveCopyClient.head(remoteFiles,owner);String revision=tip==null?"":tip.getJSONObject("appProperties").getString("revision");
            JSONObject pending;String base;boolean dirty;
            synchronized(this){dirty=state.optBoolean("dirty");base=state.optString("base");pending=state.has("pending")?new JSONObject(state.getJSONObject("pending").toString()):null;}
            boolean authorityPending;String authorityRevision,authorityGeneratedAt;
            synchronized(this){authorityPending=state.optBoolean("authorityPending");authorityRevision=state.optString("authorityRevision");authorityGeneratedAt=state.optString("authorityGeneratedAt");}
            String authorityId=tip==null?"":tip.getJSONObject("appProperties").optString("authorityId");
            if(authorityPending) {
                if(authorityRevision.isEmpty()||authorityGeneratedAt.isEmpty())throw new Exception("COPY_LOCAL_STATE_INVALID");
                JSONObject chosen; synchronized(this){chosen=ArchiveAuthority.select(state.getJSONObject("record"),owner,authorityGeneratedAt,authorityRevision);}
                publishAuthority(client,chosen,remoteFiles);
            } else if(tip!=null && !authorityId.isEmpty()) {
                JSONObject authoritative=client.load(tip,owner);
                boolean changed=dirty || !revision.equals(base);
                synchronized(this){JSONObject next=new JSONObject(state.toString());next.put("record",authoritative).put("base",revision).put("dirty",false).put("lastSynced",now());
                    next.remove("pending");next.remove("pendingFileId");next.remove("pendingEpoch");next.remove("authorityPending");next.put("authorityId",authorityId);
                    if(!spaceFor(next))throw new Exception("COPY_LOW_SPACE");save(next);readOnlyRecord=null;loaded=true;status=changed?"authority-applied":"saved";error="";}
            } else if(dirty) {
                if(pending!=null && (revision.equals(pending.getString("revision")) || state.has("pendingFileId"))) {
                    if(!revision.isEmpty() && !revision.equals(base) && !revision.equals(pending.getString("revision")))throw new Exception("COPY_CONFLICT");
                    JSONObject proof=revision.equals(pending.getString("revision"))?tip:new JSONObject().put("id",state.getString("pendingFileId")).put("appProperties",new JSONObject().put("revision",pending.getString("revision")).put("parent",pending.getString("parent")));
                    JSONObject confirmed=client.load(proof,owner);
                    if(!confirmed.getJSONArray("files").toString().equals(pending.getJSONArray("files").toString()))throw new Exception("COPY_CONFLICT");
                    synchronized(this){JSONObject next=new JSONObject(state.toString());boolean same=next.getLong("epoch")==next.getLong("pendingEpoch");next.put("base",confirmed.getString("revision")).put("dirty",!same);
                        next.getJSONObject("record").put("revision",confirmed.getString("revision")).put("parent",confirmed.getString("parent")).put("generatedAt",confirmed.getString("generatedAt"));
                        next.remove("pending");next.remove("pendingFileId");next.remove("pendingEpoch");next.put("lastSynced",now());save(next);status=same?"saved":"pending";error="";if(!same)schedule(1);}
                } else {
                    if(!revision.equals(base))throw new Exception("COPY_CONFLICT");
                    if(pending==null)synchronized(this){JSONObject next=new JSONObject(state.toString());pending=new JSONObject(next.getJSONObject("record").toString());
                        pending.put("revision",java.util.UUID.randomUUID().toString()).put("parent",base).put("generatedAt",now());next.put("pending",pending).put("pendingEpoch",next.getLong("epoch"));save(next);}
                    pending=new JSONObject(pending.toString());
                    ensureCalendar(client,pending);CalendarCopy.synchronize(client,pending);
                    JSONObject latest=ArchiveCopyClient.head(client.list(ArchiveCodec.PREFIX),owner);
                    if(!(latest==null?"":latest.getJSONObject("appProperties").getString("revision")).equals(base))throw new Exception("COPY_CONFLICT");
                    String uploaded=client.upload(pending);synchronized(this){JSONObject next=new JSONObject(state.toString());next.put("pendingFileId",uploaded);save(next);}schedule(1);
                }
            } else {
                if(tip==null) {
                    if(!client.list("serkal-archive-v1.json").isEmpty())throw new Exception("COPY_NEEDS_SOURCE");
                    synchronized(this){JSONObject next=new JSONObject(state.toString());JSONObject record=new JSONObject().put("schema",2).put("owner",owner).put("revision",java.util.UUID.randomUUID().toString())
                        .put("parent","").put("generatedAt",now()).put("calendar",new JSONObject().put("mode","google").put("id","" )).put("files",new JSONArray());
                        next.put("record",record).put("dirty",true).put("epoch",1);if(!space())throw new Exception("COPY_LOW_SPACE");save(next);status="pending";schedule(1);}
                } else if(!revision.equals(base)) {
                    if(!base.isEmpty()){boolean known=false;for(JSONObject f:remoteFiles)if(base.equals(f.getJSONObject("appProperties").getString("revision")))known=true;if(!known)throw new Exception("COPY_HISTORY_MISSING");}
                    JSONObject record=client.load(tip,owner);
                    synchronized(this){if(state.optBoolean("dirty"))throw new Exception("COPY_CONFLICT");
                        JSONObject next=new JSONObject(state.toString());next.put("record",record).put("base",revision).put("lastSynced",now());
                        if(!spaceFor(next)){readOnlyRecord=record;throw new Exception("COPY_LOW_SPACE");}save(next);readOnlyRecord=null;status="saved";error="";}
                } else synchronized(this){status="saved";error="";}
            }
        }catch(Exception failure){synchronized(this){if(!closed){error=String.valueOf(failure.getMessage());status="error";if(state.optBoolean("dirty") && !fatal())schedule(30);}}}
        finally {synchronized(this){busy=false;if(state.has("record") && !fatal())loaded=true;log("SYNC_END",error);}notifyChange();}
    }
}



package de.serkal.android.preview;
import android.content.Context;
import android.util.AtomicFile;
import org.json.*;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.*;
import java.util.concurrent.*;

/** Start reads Google, edits stay local, explicit Exit saves one complete snapshot. */
final class AndroidArchiveSession {
    interface Listener{void changed();}
    interface Factory{SessionArchiveClient create(String token);}
    final String owner;
    private String token,status="loading",error="",message="";
    private JSONObject record,confirmed;
    private long epoch;
    private boolean loaded,dirty,busy,closed,started;
    private Listener listener;
    private final ExecutorService worker=Executors.newSingleThreadExecutor();
    private final AtomicFile disk;
    private final File logFile;
    private final Factory factory;
    AndroidArchiveSession(Context context,String owner,String token,Listener listener) throws Exception {this(context,owner,token,listener,SessionArchiveClient::new);}
    AndroidArchiveSession(Context context,String owner,String token,Listener listener,Factory factory) throws Exception {
        this.owner=owner;this.token=token;this.listener=listener;this.factory=factory;
        disk=new AtomicFile(new File(context.getFilesDir(),"session-confirmed-"+ArchiveCodec.hash(owner)+".json"));
        logFile=new File(context.getFilesDir(),"serkal-session-log-"+ArchiveCodec.hash(owner)+".jsonl");
        try(InputStream in=disk.openRead()){confirmed=ArchiveCodec.validate(read(in),owner);}catch(FileNotFoundException absent){}
        catch(Exception invalid){log("CACHE_INVALID",invalid);}
        // A previous unsaved working record is never restored.
        if(confirmed==null){
            File legacy=new File(context.getFilesDir(),"archive-copy-"+ArchiveCodec.hash(owner)+".json");
            if(legacy.exists())try(InputStream in=new FileInputStream(legacy)){JSONObject old=read(in);if(old.has("record"))confirmed=ArchiveCodec.validate(old.getJSONObject("record"),owner);}catch(Exception invalid){log("LEGACY_CACHE_INVALID",invalid);}
        }
        record=empty(owner);
    }
    static String now(){SimpleDateFormat f=new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",Locale.ROOT);f.setTimeZone(TimeZone.getTimeZone("UTC"));return f.format(new Date());}
    static JSONObject empty(String owner) throws Exception{return new JSONObject().put("schema",2).put("releaseNumber",ArchiveCodec.RELEASE).put("owner",owner).put("revision",UUID.randomUUID().toString()).put("parent","").put("generatedAt",now()).put("files",new JSONArray()).put("calendar",new JSONObject().put("mode","google").put("id",""));}
    private static JSONObject read(InputStream in) throws Exception {ByteArrayOutputStream out=new ByteArrayOutputStream();byte[] b=new byte[8192];int n;while((n=in.read(b))!=-1){out.write(b,0,n);if(out.size()>ArchiveCodec.LIMIT)throw new Exception("COPY_TOO_LARGE");}return new JSONObject(out.toString("UTF-8"));}
    private void saveConfirmed() throws Exception {FileOutputStream out=null;try{out=disk.startWrite();out.write(record.toString().getBytes(StandardCharsets.UTF_8));disk.finishWrite(out);confirmed=new JSONObject(record.toString());}catch(Exception e){if(out!=null)disk.failWrite(out);throw e;}}
    private void log(String event,Exception failure){try(FileOutputStream out=new FileOutputStream(logFile,true)){
        JSONObject row=new JSONObject().put("time",now()).put("event",event);
        if(failure!=null){row.put("code",GoogleHttpFailure.code(failure)).put("message",GoogleHttpFailure.clean(String.valueOf(failure.getMessage()),token));if(failure instanceof GoogleHttpFailure){GoogleHttpFailure g=(GoogleHttpFailure)failure;row.put("endpoint",g.endpoint).put("method",g.method).put("responseText",g.responseText);}}
        out.write((row+"\n").getBytes(StandardCharsets.UTF_8));}catch(Exception ignored){} }
    synchronized void recordFailure(Exception failure){log("GOOGLE_CONNECTION_FAILED",failure);}
    synchronized String readLog() throws Exception {if(!logFile.exists())return "";try(InputStream in=new FileInputStream(logFile);ByteArrayOutputStream out=new ByteArrayOutputStream()){byte[] b=new byte[8192];int n;while((n=in.read(b))!=-1)out.write(b,0,n);return out.toString("UTF-8");}}
    private synchronized void changed(){if(listener!=null&&!closed)listener.changed();}
    synchronized boolean writable(){return loaded&&!busy&&!closed;}
    synchronized boolean hasChanges(){return dirty;}
    synchronized boolean busy(){return busy;}
    synchronized String status(){return error.isEmpty()?status:error;}
    synchronized String message(){return message;}
    synchronized String calendarId(){return record.optJSONObject("calendar")==null?"":record.optJSONObject("calendar").optString("id");}
    synchronized JSONObject snapshot() throws Exception {return new JSONObject().put("owner",owner).put("epoch",epoch).put("generatedAt",record.getString("generatedAt")).put("entries",ArchiveCodec.entries(record));}
    synchronized void edit(String action,JSONObject payload) throws Exception {if(!writable())throw new Exception("SESSION_BUSY");record=ArchiveCodec.edit(record,action,payload);dirty=true;epoch++;status="pending";changed();}
    synchronized void maintenance(long expected,JSONArray patches) throws Exception {if(!writable())throw new Exception("SESSION_BUSY");if(expected!=epoch)throw new Exception("COPY_LOCAL_CHANGED");record=ArchiveCodec.maintenance(record,patches);dirty=true;epoch++;status="pending";changed();}
    synchronized boolean useOfflineCache(){if(confirmed!=null)try{record=new JSONObject(confirmed.toString());}catch(Exception ignored){}loaded=true;status="offline";error="COPY_CONNECT";message="Google unavailable; working locally with the last confirmed archive.";return true;}
    synchronized boolean canMakeAuthoritative(){return false;}
    void makeAuthoritative(){} // Old menu callback is retained but hidden.
    synchronized void updateToken(String value){token=value;}
    synchronized void setListener(Listener value){listener=value;}
    void schedule(int ignored){synchronized(this){if(closed||busy||started)return;started=true;busy=true;status="loading";}changed();worker.execute(this::load);}
    private void load(){
        try {if(token==null||token.isEmpty())throw new Exception("COPY_CONNECT");SessionArchiveClient client=factory.create(token);if(!owner.equals(client.owner()))throw new Exception("COPY_ACCOUNT_CHANGED");
            JSONObject value=client.loadSession(owner);
            synchronized(this){if(closed)return;record=value==null?empty(owner):value;dirty=client.imported;epoch++;loaded=true;error="";message="";status=dirty?"pending":"saved";saveConfirmed();log("SESSION_LOADED",null);}
        }catch(Exception failure){synchronized(this){if(closed)return;if(confirmed!=null)try{record=new JSONObject(confirmed.toString());}catch(Exception ignored){}loaded=true;error=GoogleHttpFailure.code(failure);message=String.valueOf(failure.getMessage());status="error";started=false;log("SESSION_LOAD_FAILED",failure);}}
        finally{synchronized(this){busy=false;}changed();}
    }
    void finish(Runnable complete){synchronized(this){if(closed)return;if(busy){message="An archive operation is still running.";error="SESSION_BUSY";if(complete!=null)complete.run();return;}busy=true;status="syncing";}changed();
        worker.execute(()->{Exception calendarFailure=null;try{
            final JSONObject outgoing;final boolean write;
            synchronized(this){write=dirty;outgoing=new JSONObject(record.toString()).put("releaseNumber",ArchiveCodec.RELEASE).put("revision",UUID.randomUUID().toString()).put("parent","").put("generatedAt",now());}
            if(!loaded)return;
            if(token==null||token.isEmpty())throw new Exception("COPY_CONNECT");SessionArchiveClient client=factory.create(token);if(!owner.equals(client.owner()))throw new Exception("COPY_ACCOUNT_CHANGED");
            String before=outgoing.getJSONObject("calendar").toString();
            try{client.prepareCalendar(outgoing);}catch(Exception failure){calendarFailure=failure;log("CALENDAR_PREPARE_FAILED",failure);}
            if(write||!before.equals(outgoing.getJSONObject("calendar").toString()))client.saveSession(outgoing);
            if(calendarFailure==null)try{client.updateCalendar(outgoing);}catch(Exception failure){calendarFailure=failure;log("CALENDAR_SAVE_FAILED",failure);}
            synchronized(this){record=outgoing;dirty=false;saveConfirmed();error=calendarFailure==null?"":GoogleHttpFailure.code(calendarFailure);message=calendarFailure==null?"":"Archive saved. Calendar update failed:\n"+calendarFailure.getMessage();status=calendarFailure==null?"saved":"calendar-warning";log("SESSION_FINISHED",null);}
        }catch(Exception failure){synchronized(this){error=GoogleHttpFailure.code(failure);message=String.valueOf(failure.getMessage());status="error";log("SESSION_SAVE_FAILED",failure);}}
        finally{synchronized(this){busy=false;}changed();if(complete!=null)complete.run();}});
    }
    synchronized boolean needsExitWarning(){return !error.isEmpty()||dirty;}
    synchronized void close(){closed=true;listener=null;worker.shutdownNow();}
}

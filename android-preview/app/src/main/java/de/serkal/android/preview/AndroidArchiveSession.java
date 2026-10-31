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
    private boolean loaded,dirty,busy,closed,started,forceSave,calendarPending;
    private String baseline="",calendarBaseline="",phase="";
    private CalendarScope.Projection calendarProjection;private Set<String> pendingScopes=new TreeSet<>();
    private long phaseStart,closeStart;private int current,total;
    private Listener listener;
    private final ExecutorService worker=Executors.newSingleThreadExecutor();
    private final AtomicFile disk;
    private final AtomicFile pendingCalendar;
    private final File logFile;
    private final Factory factory;
    AndroidArchiveSession(Context context,String owner,String token,Listener listener) throws Exception {this(context,owner,token,listener,SessionArchiveClient::new);}
    AndroidArchiveSession(Context context,String owner,String token,Listener listener,Factory factory) throws Exception {
        this.owner=owner;this.token=token;this.listener=listener;this.factory=factory;
        disk=new AtomicFile(new File(context.getFilesDir(),"session-confirmed-"+ArchiveCodec.hash(owner)+".json"));
        pendingCalendar=new AtomicFile(new File(context.getFilesDir(),"session-calendar-pending-"+ArchiveCodec.hash(owner)+".json"));
        try(InputStream in=pendingCalendar.openRead()){JSONObject flag=read(in);calendarPending=flag.optBoolean("pending");pendingScopes=CalendarScope.read(flag.optJSONArray("scopes"));}catch(FileNotFoundException absent){}
        logFile=new File(context.getFilesDir(),"serkal-session-log-"+ArchiveCodec.hash(owner)+".jsonl");
        try(InputStream in=disk.openRead()){confirmed=ArchiveCodec.validate(read(in),owner);}catch(FileNotFoundException absent){}
        catch(Exception invalid){log("CACHE_INVALID",invalid);}
        // A previous unsaved working record is never restored.
        if(confirmed==null){
            File legacy=new File(context.getFilesDir(),"archive-copy-"+ArchiveCodec.hash(owner)+".json");
            if(legacy.exists())try(InputStream in=new FileInputStream(legacy)){JSONObject old=read(in);if(old.has("record"))confirmed=ArchiveCodec.validate(old.getJSONObject("record"),owner);}catch(Exception invalid){log("LEGACY_CACHE_INVALID",invalid);}
        }
        record=empty(owner);baseline=digest(record);calendarBaseline=calendarKey(record);calendarProjection=new CalendarScope.Projection(record);
    }
    static String now(){SimpleDateFormat f=new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",Locale.ROOT);f.setTimeZone(TimeZone.getTimeZone("UTC"));return f.format(new Date());}
    static JSONObject empty(String owner) throws Exception{return new JSONObject().put("schema",2).put("releaseNumber",ArchiveCodec.RELEASE).put("owner",owner).put("revision",UUID.randomUUID().toString()).put("parent","").put("generatedAt",now()).put("files",new JSONArray()).put("calendar",new JSONObject().put("mode","google").put("id",""));}
    private static JSONObject read(InputStream in) throws Exception {ByteArrayOutputStream out=new ByteArrayOutputStream();byte[] b=new byte[8192];int n;while((n=in.read(b))!=-1){out.write(b,0,n);if(out.size()>ArchiveCodec.LIMIT)throw new Exception("COPY_TOO_LARGE");}return new JSONObject(out.toString("UTF-8"));}
    private void saveConfirmed() throws Exception {FileOutputStream out=null;try{out=disk.startWrite();out.write(record.toString().getBytes(StandardCharsets.UTF_8));disk.finishWrite(out);confirmed=new JSONObject(record.toString());}catch(Exception e){if(out!=null)disk.failWrite(out);throw e;}}
    private synchronized void markCalendarPending(boolean value)throws Exception{markCalendarPending(value,pendingScopes);}
    private synchronized void markCalendarPending(boolean value,Set<String> scopes)throws Exception{
        calendarPending=value;pendingScopes=value?scopes:new TreeSet<>();
        if(!value){pendingCalendar.delete();return;}
        FileOutputStream out=null;try{out=pendingCalendar.startWrite();out.write(new JSONObject().put("pending",true).put("scopes",scopes==null?JSONObject.NULL:new JSONArray(scopes)).toString().getBytes(StandardCharsets.UTF_8));pendingCalendar.finishWrite(out);}
        catch(Exception failure){if(out!=null)pendingCalendar.failWrite(out);throw failure;}
    }
    private void log(String event,Exception failure){try(FileOutputStream out=new FileOutputStream(logFile,true)){
        JSONObject row=new JSONObject().put("time",now()).put("event",event);
        if(failure!=null){row.put("code",GoogleHttpFailure.code(failure)).put("message",GoogleHttpFailure.clean(String.valueOf(failure.getMessage()),token));if(failure instanceof GoogleHttpFailure){GoogleHttpFailure g=(GoogleHttpFailure)failure;row.put("endpoint",g.endpoint).put("method",g.method).put("responseText",g.responseText);}}
        out.write((row+"\n").getBytes(StandardCharsets.UTF_8));}catch(Exception ignored){} }
    synchronized void recordFailure(Exception failure){log("GOOGLE_CONNECTION_FAILED",failure);}
    synchronized String readLog() throws Exception {if(!logFile.exists())return "";try(InputStream in=new FileInputStream(logFile);ByteArrayOutputStream out=new ByteArrayOutputStream()){byte[] b=new byte[8192];int n;while((n=in.read(b))!=-1)out.write(b,0,n);return out.toString("UTF-8");}}
    private synchronized void changed(){if(listener!=null&&!closed)listener.changed();}
    synchronized boolean writable(){return loaded&&!busy&&!closed;}
    static String digest(JSONObject value)throws Exception{
        TreeMap<String,String> files=new TreeMap<>();JSONArray list=value.getJSONArray("files");for(int i=0;i<list.length();i++){JSONObject f=list.getJSONObject(i);files.put(f.getString("name"),f.getString("sha256"));}
        JSONObject c=value.getJSONObject("calendar");return ArchiveCodec.hash(files.toString()+"|"+c.optString("mode")+"|"+c.optString("id"));
    }
    static String calendarKey(JSONObject value)throws Exception{
        JSONObject c=value.getJSONObject("calendar");if(!c.optString("mode").equals("google"))return c.optString("mode")+"|"+c.optString("id");
        List<String> events=new ArrayList<>();for(JSONObject e:CalendarCopy.desired(value)){JSONObject b=new JSONObject(e.toString());b.remove("id");events.add(b.toString());}
        for(JSONObject e:SeasonAnnouncements.desired(ArchiveCodec.entries(value))){JSONObject b=new JSONObject(e.toString());b.remove("id");events.add(b.toString());}
        Collections.sort(events);return ArchiveCodec.hash(c.optString("mode")+"|"+c.optString("id")+events.toString());
    }
    synchronized boolean hasChanges(){try{return loaded&&(forceSave||!baseline.equals(digest(record)));}catch(Exception failure){return dirty;}}
    synchronized boolean requiresFinish(){return hasChanges()||calendarPending;}
    synchronized void report(String value,int done,int count){if(!value.equals(phase)){phase=value;phaseStart=System.nanoTime();}current=done;total=count;changed();}
    synchronized String progress(boolean english){
        if(!busy)return "";long seconds=Math.max(0,(System.nanoTime()-phaseStart)/1000000000L);
        String label=phase.equals("calendar-wait")?(english?"Google Calendar request limit · waiting before retry":"Google-Kalender begrenzt Anfragen · Wiederholung nach Pause"):phase.startsWith("calendar")?(english?"Updating Calendar":"Kalender aktualisieren"):phase.equals("archive-upload")?(english?"Saving archive to Google":"Archiv bei Google speichern"):phase.equals("archive-connect")?(english?"Connecting to Google":"Google-Verbindung herstellen"):(english?"Loading archive":"Archiv laden");
        return label+(total>0?" · "+current+"/"+total:"")+" · "+seconds+" s";
    }
    synchronized int progressCurrent(){return current;}synchronized int progressTotal(){return total;}
    synchronized void time(String step,long start,boolean ok){try(FileOutputStream out=new FileOutputStream(logFile,true)){
        out.write((new JSONObject().put("time",now()).put("event","PHASE_END").put("phase",step).put("elapsedMs",Math.max(0,(System.nanoTime()-start)/1000000L)).put("ok",ok)+"\n").getBytes(StandardCharsets.UTF_8));}catch(Exception ignored){} }
    interface PhaseTask{void run()throws Exception;}
    private void runPhase(String step,PhaseTask task)throws Exception{report(step,0,0);long start=System.nanoTime();boolean ok=false;try{task.run();ok=true;}finally{time(step,start,ok);}}
    synchronized void authorizationTime(long start,boolean ok){time("authorization",start,ok);}
    private void detail(String event,JSONObject data){try(FileOutputStream out=new FileOutputStream(logFile,true)){out.write((new JSONObject().put("time",now()).put("event",event).put("details",data)+"\n").getBytes(StandardCharsets.UTF_8));}catch(Exception ignored){}}
    private SessionArchiveClient client(){SessionArchiveClient client=factory.create(token);client.trace=(step,start,ok,failure)->{time(step,start,ok);if(failure!=null)log("GOOGLE_REQUEST_FAILED",failure);};client.progress=(step,done,count)->report(step,done,count);client.calendarPlan=data->detail(data.has("method")?"CALENDAR_OPERATION":"CALENDAR_PLAN",data);return client;}

    synchronized boolean busy(){return busy;}
    synchronized String status(){return error.isEmpty()?status:error;}
    synchronized String message(){return message;}
    synchronized String calendarId(){return record.optJSONObject("calendar")==null?"":record.optJSONObject("calendar").optString("id");}
    synchronized JSONObject snapshot() throws Exception {return new JSONObject().put("owner",owner).put("epoch",epoch).put("generatedAt",record.getString("generatedAt")).put("entries",ArchiveCodec.entries(record));}
    synchronized void edit(String action,JSONObject payload) throws Exception {if(!writable())throw new Exception("SESSION_BUSY");record=ArchiveCodec.edit(record,action,payload);dirty=hasChanges();epoch++;status=dirty?"pending":"saved";changed();}
    synchronized void maintenance(long expected,JSONArray patches) throws Exception {if(!writable())throw new Exception("SESSION_BUSY");if(expected!=epoch)throw new Exception("COPY_LOCAL_CHANGED");record=ArchiveCodec.maintenance(record,patches);dirty=hasChanges();epoch++;status=dirty?"pending":"saved";changed();}
    synchronized boolean useOfflineCache(){if(confirmed!=null)try{record=new JSONObject(confirmed.toString());}catch(Exception ignored){}try{baseline=digest(record);calendarBaseline=calendarKey(record);calendarProjection=new CalendarScope.Projection(record);}catch(Exception ignored){}loaded=true;status="offline";error="COPY_CONNECT";message="Google unavailable; working locally with the last confirmed archive.";return true;}
    synchronized boolean canMakeAuthoritative(){return false;}
    void makeAuthoritative(){} // Old menu callback is retained but hidden.
    synchronized void updateToken(String value){token=value;}
    synchronized void setListener(Listener value){listener=value;}
    void schedule(int ignored){synchronized(this){if(closed||busy||started)return;started=true;busy=true;status="loading";}changed();worker.execute(this::load);}
    private void load(){
        try {if(token==null||token.isEmpty())throw new Exception("COPY_CONNECT");SessionArchiveClient client=client();if(!owner.equals(client.owner()))throw new Exception("COPY_ACCOUNT_CHANGED");
            JSONObject value=client.loadSession(owner);
            synchronized(this){if(closed)return;record=value==null?empty(owner):value;forceSave=client.imported;dirty=forceSave;baseline=digest(record);calendarBaseline=calendarKey(record);calendarProjection=new CalendarScope.Projection(record);epoch++;loaded=true;error="";message="";status=dirty?"pending":"saved";saveConfirmed();log("SESSION_LOADED",null);}
        }catch(Exception failure){synchronized(this){if(closed)return;if(confirmed!=null)try{record=new JSONObject(confirmed.toString());}catch(Exception ignored){}try{baseline=digest(record);calendarBaseline=calendarKey(record);calendarProjection=new CalendarScope.Projection(record);}catch(Exception ignored){}loaded=true;error=GoogleHttpFailure.code(failure);message=String.valueOf(failure.getMessage());status="error";started=false;log("SESSION_LOAD_FAILED",failure);}}
        finally{synchronized(this){busy=false;}changed();}
    }
    void finish(Runnable complete){synchronized(this){if(closed)return;if(!requiresFinish()){time("close-unchanged",System.nanoTime(),true);if(complete!=null)complete.run();return;}if(busy){message="An archive operation is still running.";error="SESSION_BUSY";if(complete!=null)complete.run();return;}busy=true;status="syncing";closeStart=System.nanoTime();phase="archive-connect";phaseStart=closeStart;}changed();
        worker.execute(()->{Exception calendarFailure=null;try{
            final JSONObject outgoing;final boolean write;
            synchronized(this){write=hasChanges();outgoing=new JSONObject(record.toString()).put("releaseNumber",ArchiveCodec.RELEASE).put("revision",UUID.randomUUID().toString()).put("parent","").put("generatedAt",now());}
            if(!loaded)return;
            if(token==null||token.isEmpty())throw new Exception("COPY_CONNECT");SessionArchiveClient client=client();client.deadline=System.currentTimeMillis()+45000;runPhase("archive-connect",()->{if(!owner.equals(client.owner()))throw new Exception("COPY_ACCOUNT_CHANGED");});
            Set<String> scopes=CalendarScope.changes(calendarProjection,new CalendarScope.Projection(outgoing));
            if(calendarPending)scopes=CalendarScope.union(pendingScopes,scopes);
            boolean calendarChanged=scopes==null||!scopes.isEmpty();
            String before=outgoing.getJSONObject("calendar").toString();
            try{if(calendarChanged){runPhase("calendar-prepare",()->client.prepareCalendar(outgoing));}}catch(Exception failure){calendarFailure=failure;log("CALENDAR_PREPARE_FAILED",failure);}
            scopes=CalendarScope.changes(calendarProjection,new CalendarScope.Projection(outgoing));
            if(calendarPending)scopes=CalendarScope.union(pendingScopes,scopes);
            if(calendarChanged)markCalendarPending(true,scopes);
            final CalendarScope.Projection projected=new CalendarScope.Projection(outgoing);
            client.calendarScopes=scopes;client.remainingScopes=remaining->{synchronized(this){markCalendarPending(!remaining.isEmpty(),remaining);calendarProjection=projected;}detail("CALENDAR_REMAINING",new JSONObject().put("scopes",remaining.size()));};
            if(write||!before.equals(outgoing.getJSONObject("calendar").toString())){runPhase("archive-upload",()->client.saveSession(outgoing));}
            if(calendarChanged&&calendarFailure==null)try{runPhase("calendar-read",()->client.updateCalendar(outgoing));calendarBaseline=calendarKey(outgoing);calendarProjection=projected;}catch(Exception failure){calendarFailure=failure;log("CALENDAR_SAVE_FAILED",failure);}
            synchronized(this){record=outgoing;dirty=false;forceSave=false;baseline=digest(record);markCalendarPending(calendarFailure!=null);saveConfirmed();error=calendarFailure==null?"":GoogleHttpFailure.code(calendarFailure);message=calendarFailure==null?"":"Archive saved to Google. Only the Calendar update is incomplete. It will be retried the next time you exit normally.\n"+calendarFailure.getMessage();status=calendarFailure==null?"saved":"calendar-warning";log("SESSION_FINISHED",null);}
        }catch(Exception failure){synchronized(this){error=GoogleHttpFailure.code(failure);message=String.valueOf(failure.getMessage());status="error";log("SESSION_SAVE_FAILED",failure);}}
        finally{synchronized(this){busy=false;}changed();if(complete!=null)complete.run();}});
    }
    synchronized boolean calendarIncomplete(){return calendarPending&&!hasChanges();}
    synchronized boolean needsExitWarning(){return !error.isEmpty()||hasChanges()||calendarPending;}
    synchronized void close(){closed=true;listener=null;worker.shutdownNow();}
}

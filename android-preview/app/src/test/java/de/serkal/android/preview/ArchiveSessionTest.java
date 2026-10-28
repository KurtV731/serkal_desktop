package de.serkal.android.preview;
import org.junit.*;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.RuntimeEnvironment;
import android.content.Context;
import org.json.*;
import java.util.concurrent.*;
import static org.junit.Assert.*;
@RunWith(RobolectricTestRunner.class)
public class ArchiveSessionTest {
    JSONObject cloud;int writes,reads,calendarWrites,creates,owners;boolean denied,calendarDenied;
    class Remote extends SessionArchiveClient {
        Remote(){super("token");}
        @Override String owner(){owners++;return "123";}
        @Override JSONObject loadSession(String owner)throws Exception{reads++;if(denied)throw new GoogleHttpFailure(403,"Complete reason: SERVICE_DISABLED","https://www.googleapis.com/drive/v3/files","GET","token");return cloud==null?null:new JSONObject(cloud.toString());}
        @Override void saveSession(JSONObject record)throws Exception{if(denied)throw new GoogleHttpFailure(403,"Full save error","https://www.googleapis.com/upload/drive/v3/files","POST","token");writes++;cloud=new JSONObject(record.toString());}
        @Override void prepareCalendar(JSONObject record){}
        @Override void updateCalendar(JSONObject record)throws Exception{calendarWrites++;if(calendarDenied)throw new GoogleHttpFailure(403,"Calendar access denied with details","https://www.googleapis.com/calendar/v3/calendars","GET","token");}
    }
    AndroidArchiveSession make()throws Exception{return new AndroidArchiveSession(RuntimeEnvironment.getApplication(),"123","token",()->{},token->{creates++;return new Remote();});}
    void load(AndroidArchiveSession s)throws Exception{s.schedule(0);waitFor(s);}
    void waitFor(AndroidArchiveSession s)throws Exception{long until=System.currentTimeMillis()+5000;while(s.busy()&&System.currentTimeMillis()<until)Thread.sleep(5);assertFalse(s.busy());}
    void finish(AndroidArchiveSession s)throws Exception{CountDownLatch done=new CountDownLatch(1);s.finish(done::countDown);assertTrue(done.await(5,TimeUnit.SECONDS));}
    JSONObject entry()throws Exception{return new SeasonInputTest().payload(false);}
    @Test public void editsStayLocalUntilExitAndNextStartLoadsGoogle()throws Exception{
        AndroidArchiveSession a=make(),b=null;try{load(a);a.edit("insert",entry());assertEquals(0,writes);assertEquals(1,reads);a.schedule(0);Thread.sleep(30);assertEquals(1,reads);
            finish(a);assertEquals(1,writes);b=make();load(b);assertEquals(a.snapshot().getJSONArray("entries").length(),b.snapshot().getJSONArray("entries").length());
        }finally{a.close();if(b!=null)b.close();}}
    @Test public void crashDoesNotRestoreUnpublishedEdits()throws Exception{
        AndroidArchiveSession a=make();load(a);a.edit("insert",entry());a.close();AndroidArchiveSession b=make();try{load(b);assertEquals(0,b.snapshot().getJSONArray("entries").length());assertEquals(0,writes);}finally{b.close();}}
    @Test public void google403DoesNotBlockLocalEditsAndKeepsCompleteLog()throws Exception{
        denied=true;AndroidArchiveSession s=make();try{load(s);assertTrue(s.writable());s.edit("insert",entry());finish(s);assertTrue(s.writable());assertTrue(s.needsExitWarning());assertTrue(s.readLog().contains("SERVICE_DISABLED"));assertTrue(s.readLog().contains("Full save error"));assertFalse(s.readLog().contains("Bearer token"));}finally{s.close();}}
    @Test public void calendarFailureDoesNotPreventArchiveSave()throws Exception{
        calendarDenied=true;AndroidArchiveSession s=make();try{load(s);s.edit("insert",entry());finish(s);assertEquals(1,writes);assertTrue(s.needsExitWarning());assertTrue(s.message().contains("Archive saved"));assertTrue(s.writable());}finally{s.close();}}
    @Test public void lastCompletedSessionWins()throws Exception{
        AndroidArchiveSession a=make(),b=make();try{load(a);load(b);a.edit("insert",entry());finish(a);assertEquals(1,ArchiveCodec.entries(cloud).length());b.edit("insert",entry());finish(b);assertEquals(1,ArchiveCodec.entries(cloud).length());assertEquals(2,writes);}finally{a.close();b.close();}}
    @Test public void googleErrorPreservesLongResponseWithoutCredentials()throws Exception{
        String text="{\"error\":{\"message\":\""+new String(new char[25000]).replace('\0','x')+"\",\"details\":[\"SERVICE_DISABLED\"]},\"access_token\":\"secret\"}";
        GoogleHttpFailure e=new GoogleHttpFailure(403,text,"https://www.googleapis.com/drive/v3/files?access_token=secret","GET","secret");assertTrue(e.responseText.length()>25000);assertTrue(e.responseText.contains("SERVICE_DISABLED"));assertFalse(e.responseText.contains("secret"));assertFalse(e.endpoint.contains("?"));assertEquals("GOOGLE_HTTP_403",e.code);
    }

    @Test public void unchangedCloseDoesNotConnectAuthorizeUploadOrReadCalendar()throws Exception{
        cloud=new ArchiveCopyTest().record();AndroidArchiveSession session=make();load(session);int initialCreates=creates,initialOwners=owners;
        try{finish(session);assertFalse(session.requiresFinish());assertEquals(initialCreates,creates);assertEquals(initialOwners,owners);assertEquals(0,writes);assertEquals(0,calendarWrites);assertTrue(session.readLog().contains("close-unchanged"));
            org.robolectric.android.controller.ActivityController<MainActivity> controller=org.robolectric.Robolectric.buildActivity(MainActivity.class).create();
            try{MainActivity activity=controller.get();java.lang.reflect.Field field=MainActivity.class.getDeclaredField("archiveCopy");field.setAccessible(true);field.set(activity,session);
                activity.findViewById(android.R.id.content).findViewWithTag("exitSerKal").performClick();assertTrue(activity.isFinishing());assertEquals(initialCreates,creates);
            }finally{controller.destroy();}
        }finally{session.close();}
    }
    @Test public void watchedOnlyUploadsOnceAndDoesNotTouchCalendar()throws Exception{
        cloud=new ArchiveCopyTest().record();JSONObject file=cloud.getJSONArray("files").getJSONObject(0);String text=file.getString("content").replace("; note=;","; note=; seen=0;");file.put("content",text).put("sha256",ArchiveCodec.hash(text));
        AndroidArchiveSession session=make();try{load(session);JSONObject patch=new JSONObject().put("tmdbId",42).put("seasonLabel","S01").put("seen",true);
            session.edit("seen",patch);assertTrue(session.hasChanges());finish(session);assertEquals(1,writes);assertEquals(0,calendarWrites);int before=creates;
            session.edit("seen",patch.put("seen",false));session.edit("seen",patch.put("seen",true));assertFalse(session.hasChanges());finish(session);assertEquals(before,creates);
            assertTrue(session.readLog().contains("archive-upload"));assertTrue(session.readLog().contains("elapsedMs"));
        }finally{session.close();}
    }
    @Test public void expiredCloseDeadlineStopsBeforeNetwork()throws Exception{
        SessionArchiveClient client=new SessionArchiveClient("secret");client.deadline=System.currentTimeMillis()-1;
        try{client.get("https://invalid.example.com/never");fail();}catch(java.net.SocketTimeoutException expected){assertTrue(expected.getMessage().contains("SESSION_CLOSE_TIMEOUT"));}
    }
    @Test public void calendarEventWritesAreBoundedAndReportCompletedCounts()throws Exception{
        java.util.concurrent.atomic.AtomicInteger active=new java.util.concurrent.atomic.AtomicInteger(),maximum=new java.util.concurrent.atomic.AtomicInteger(),completed=new java.util.concurrent.atomic.AtomicInteger();
        ArchiveCopyClient client=new ArchiveCopyClient("test"){@Override JSONObject request(String url,String method,String body,String type)throws Exception{
            if(method.equals("GET"))return new JSONObject().put("items",new JSONArray());int n=active.incrementAndGet();maximum.accumulateAndGet(n,Math::max);
            try{Thread.sleep(20);return new JSONObject().put("id","written");}finally{active.decrementAndGet();}
        }};
        CalendarCopy.synchronize(client,new ArchiveCopyTest().record(),true,(phase,current,total)->{assertEquals("calendar-write",phase);completed.set(current);});
        assertEquals(2,completed.get());assertEquals(1,maximum.get());
    }
    @Test public void calendarFailureIsRetriedAfterRestartWithoutAnotherArchiveUpload()throws Exception{
        calendarDenied=true;AndroidArchiveSession first=make();load(first);first.edit("insert",entry());finish(first);
        assertEquals(1,writes);assertTrue(first.requiresFinish());first.close();
        AndroidArchiveSession second=make();try{load(second);assertFalse(second.hasChanges());assertTrue(second.requiresFinish());calendarDenied=false;
            finish(second);assertEquals(1,writes);assertEquals(2,calendarWrites);assertFalse(second.needsExitWarning());
        }finally{second.close();}
        AndroidArchiveSession third=make();try{load(third);assertFalse(third.requiresFinish());}finally{third.close();}
    }

}

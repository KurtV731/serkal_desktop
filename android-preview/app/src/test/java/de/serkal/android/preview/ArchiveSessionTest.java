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
    JSONObject cloud;int writes,reads,calendarWrites;boolean denied,calendarDenied;
    class Remote extends SessionArchiveClient {
        Remote(){super("token");}
        @Override String owner(){return "123";}
        @Override JSONObject loadSession(String owner)throws Exception{reads++;if(denied)throw new GoogleHttpFailure(403,"Complete reason: SERVICE_DISABLED","https://www.googleapis.com/drive/v3/files","GET","token");return cloud==null?null:new JSONObject(cloud.toString());}
        @Override void saveSession(JSONObject record)throws Exception{if(denied)throw new GoogleHttpFailure(403,"Full save error","https://www.googleapis.com/upload/drive/v3/files","POST","token");writes++;cloud=new JSONObject(record.toString());}
        @Override void prepareCalendar(JSONObject record){}
        @Override void updateCalendar(JSONObject record)throws Exception{calendarWrites++;if(calendarDenied)throw new GoogleHttpFailure(403,"Calendar access denied with details","https://www.googleapis.com/calendar/v3/calendars","GET","token");}
    }
    AndroidArchiveSession make()throws Exception{return new AndroidArchiveSession(RuntimeEnvironment.getApplication(),"123","token",()->{},token->new Remote());}
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
}

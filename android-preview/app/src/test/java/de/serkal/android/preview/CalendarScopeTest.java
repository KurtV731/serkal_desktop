package de.serkal.android.preview;
import org.junit.*;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;
import org.json.*;
import java.util.*;
import static org.junit.Assert.*;
@RunWith(RobolectricTestRunner.class)
public class CalendarScopeTest {
    JSONObject file(int id)throws Exception{
        int year=Calendar.getInstance().get(Calendar.YEAR);
        String content="S01; startOriginal="+year+"-12-01; dates=01.12.,08.12.; tmdb="+id+"; eps=2; seen=0; note=\n";
        return new JSONObject().put("name","Series "+id+" ("+year+").txt").put("content",content).put("sha256",ArchiveCodec.hash(content));
    }
    JSONObject record()throws Exception{JSONObject r=new ArchiveCopyTest().record().put("files",new JSONArray());for(int i=1;i<=150;i++)r.getJSONArray("files").put(file(i));return r;}
    @Test public void twoChangedSeriesDoNotRepairOtherCalendarDifferences()throws Exception{
        JSONObject before=record(),after=new JSONObject(before.toString());JSONArray files=new JSONArray();
        for(int i=0;i<150;i++)if(i!=1)files.put(after.getJSONArray("files").getJSONObject(i));files.put(file(200));after.put("files",files);
        Set<String> scopes=CalendarScope.changes(new CalendarScope.Projection(before),new CalendarScope.Projection(after));assertEquals(new TreeSet<>(Arrays.asList("2:S01","200:S01")),scopes);
        JSONArray remote=new JSONArray();for(JSONObject e:CalendarCopy.desired(before))remote.put(new JSONObject(e.toString()).put("description","Old unrelated Calendar text"));
        List<String> writes=new ArrayList<>();List<Set<String>> remaining=new ArrayList<>();
        ArchiveCopyClient client=new ArchiveCopyClient("test"){@Override JSONObject request(String url,String method,String body,String type)throws Exception{
            if(method.equals("GET"))return new JSONObject().put("items",remote);
            writes.add(method);if(body!=null)assertEquals("200:S01",CalendarScope.group(new JSONObject(body)));return new JSONObject();
        }};
        CalendarCopy.synchronize(client,after,true,null,scopes,s->remaining.add(new TreeSet<>(s)));
        assertEquals(4,writes.size());assertEquals(2,Collections.frequency(writes,"DELETE"));assertEquals(2,Collections.frequency(writes,"POST"));assertEquals(0,Collections.frequency(writes,"PUT"));assertTrue(remaining.get(remaining.size()-1).isEmpty());
    }
    @Test public void seenOnlyAndIdenticalProjectionsHaveNoScopes()throws Exception{
        JSONObject before=record();JSONObject after=ArchiveCodec.edit(before,"seen",new JSONObject().put("tmdbId",1).put("seasonLabel","S01").put("seen",true));
        assertTrue(CalendarScope.changes(new CalendarScope.Projection(before),new CalendarScope.Projection(after)).isEmpty());
        after.getJSONObject("calendar").put("id","different-target");assertNull(CalendarScope.changes(new CalendarScope.Projection(before),new CalendarScope.Projection(after)));
    }
    @Test public void failedGroupKeepsItsFlagWhileCompletedGroupIsCleared()throws Exception{
        JSONObject before=record(),after=new JSONObject(before.toString());after.getJSONArray("files").put(file(200));
        JSONArray remote=new JSONArray();for(JSONObject e:CalendarCopy.desired(before))if(CalendarScope.group(e).equals("2:S01"))remote.put(e);
        List<Set<String>> flags=new ArrayList<>();
        ArchiveCopyClient client=new ArchiveCopyClient("test"){@Override JSONObject request(String url,String method,String body,String type)throws Exception{
            if(method.equals("GET"))return new JSONObject().put("items",remote);if(method.equals("POST"))throw new Exception("injected failure");return new JSONObject();
        }};
        // Scope 2 is deleted from the current archive; unrelated 149 series stay untouched.
        JSONArray files=new JSONArray();for(int i=0;i<after.getJSONArray("files").length();i++){JSONObject f=after.getJSONArray("files").getJSONObject(i);if(!f.getString("name").startsWith("Series 2 ("))files.put(f);}after.put("files",files);
        try{CalendarCopy.synchronize(client,after,true,null,new TreeSet<>(Arrays.asList("2:S01","200:S01")),s->flags.add(new TreeSet<>(s)));fail();}catch(Exception expected){assertEquals("injected failure",expected.getMessage());}
        assertEquals(Collections.singleton("200:S01"),flags.get(flags.size()-1));
    }
}

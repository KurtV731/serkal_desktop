package de.serkal.android.preview;
import org.junit.Test;
import org.json.*;
import static org.junit.Assert.*;
public class MaintenanceTest {
    @Test public void startsAtFirstTrackedSeasonAndOmitsKnownFutureEpisodes() throws Exception {
        JSONArray entries=new JSONArray();for(int n:new int[]{7,9})entries.put(new JSONObject().put("tmdbId",42).put("title","Show").put("seasonLabel",String.format("S%02d",n)).put("datesOriginal",new JSONArray().put("2026-11-01")));
        java.util.List<Integer> requested=new java.util.ArrayList<>();
        JSONObject result=Maintenance.run(entries,(path,q)->{
            if(path.endsWith("/watch/providers"))return new JSONObject();
            if(path.equals("tv/42"))return new JSONObject("{name:'Show',number_of_seasons:9}");
            int season=Integer.parseInt(path.substring(path.lastIndexOf('/')+1));requested.add(season);
            return new JSONObject("{episodes:[{episode_number:1,air_date:'2026-11-01'}]}");
        },"DE",false,"2026-10-17T00:00:00Z");
        assertEquals(java.util.Arrays.asList(7,8,9),requested);
        JSONArray rows=result.getJSONArray("report");assertEquals(1,rows.length());assertEquals("missing-season",rows.getJSONObject(0).getString("kind"));assertEquals(8,rows.getJSONObject(0).getInt("season"));
    }
    @Test public void missingOldSeasonsAreReportedNotInserted() throws Exception {
        JSONArray entries=new JSONArray().put(new JSONObject().put("tmdbId",1).put("title","Test").put("seasonLabel","S01").put("datesOriginal",new JSONArray().put("2026-01-01")));
        JSONObject result=Maintenance.run(entries,(path,q)->{
            if(path.endsWith("/watch/providers"))return new JSONObject("{results:{DE:{flatrate:[{provider_id:8,provider_name:'Netflix'}]}}}");
            if(path.equals("tv/1"))return new JSONObject("{name:'Test',number_of_seasons:3}");
            return new JSONObject("{air_date:'2023-01-01',episodes:[{episode_number:1,air_date:'2023-01-01'}]}");
        },"DE",false,"2026-10-16T00:00:00Z");
        int missing=0;JSONArray rows=result.getJSONArray("report");for(int i=0;i<rows.length();i++)if(rows.getJSONObject(i).getString("kind").equals("missing-season"))missing++;
        assertEquals(2,missing);assertEquals(2,result.getJSONArray("patches").length());assertEquals(1,entries.length());
        assertTrue(WatchProviders.text(result.getJSONArray("providers").getJSONObject(0).getJSONObject("info"),"",false).contains("Netflix (Abo)"));
    }
    @Test public void manualProviderAndCountrySelection() throws Exception {
        JSONObject source=new JSONObject("{results:{AU:{buy:[{provider_id:9,provider_name:'Amazon'}]},DE:{flatrate:[{provider_id:8,provider_name:'Netflix'}]}}}");
        JSONObject value=WatchProviders.normalize(source,"AU","2026-10-16");
        assertEquals("Amazon",value.getJSONArray("offers").getJSONObject(0).getString("name"));
        assertEquals("Provider (manual): Paramount",WatchProviders.text(value,"Provider: Paramount",true));
    }
    @Test public void metadataAndWatchedSurviveMaintenance() throws Exception {
        JSONObject record=new ArchiveCopyTest().record();
        JSONObject selected=new JSONObject().put("tmdbId",42).put("seasonLabel","S01");
        record=ArchiveCodec.edit(record,"notes",new JSONObject(selected.toString()).put("note","Anbieter: My service"));
        record=ArchiveCodec.edit(record,"seen",new JSONObject(selected.toString()).put("seen",true));
        JSONObject patch=new JSONObject(selected.toString()).put("watchProviders",WatchProviders.normalize(new JSONObject(),"AU","2026-10-16"));
        JSONObject updated=ArchiveCodec.maintenance(record,new JSONArray().put(patch));
        ArchiveCodec.validate(updated,"123");JSONObject entry=ArchiveCodec.entries(updated).getJSONObject(0);
        assertEquals(1,entry.getInt("seen"));assertEquals("Anbieter: My service",entry.getString("note"));
        assertEquals("AU",entry.getJSONObject("watchProviders").getString("country"));
        assertTrue(updated.getJSONArray("files").getJSONObject(0).getString("content").contains("futureField=keep%20me"));
    }
}

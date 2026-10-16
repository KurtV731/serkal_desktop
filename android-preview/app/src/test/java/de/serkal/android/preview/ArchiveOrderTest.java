package de.serkal.android.preview;
import org.junit.Test;
import org.json.*;
import java.util.*;
import static org.junit.Assert.*;
public class ArchiveOrderTest {
    private JSONObject e(String title,String date,String season) throws Exception {return new JSONObject().put("title",title).put("year","2026").put("seasonLabel",season).put("dates",date.isEmpty()?new JSONArray():new JSONArray().put(date));}
    @Test public void dateOrderMatchesDesktopAndDoesNotModifySource() throws Exception {
        JSONArray input=new JSONArray().put(e("Alpha","2026-10-01","S01")).put(e("Zulu","2026-11-01","S01")).put(e("Missing","","S01")).put(e("Same","2026-11-01","S02"));
        List<JSONObject> sorted=ArchiveOrder.sorted(input,true,false);
        assertEquals("Missing",sorted.get(0).getString("title"));assertEquals("S02",sorted.get(1).getString("seasonLabel"));assertEquals("Zulu",sorted.get(2).getString("title"));assertEquals("Alpha",sorted.get(3).getString("title"));
        assertEquals("Alpha",input.getJSONObject(0).getString("title"));
        assertEquals("Alpha",ArchiveOrder.sorted(input,false,false).get(0).getString("title"));
    }
    @Test public void localizedTitlesAndActiveOffsetDatesAreUsed() throws Exception {
        JSONArray entries=new JSONArray().put(e("Alpha","2026-10-15","S01").put("titleEN","Zulu")).put(e("Beta","2026-10-16","S01"));
        assertEquals("Beta",ArchiveOrder.sorted(entries,false,true).get(0).getString("title"));
        assertEquals("Beta",ArchiveOrder.sorted(entries,true,false).get(0).getString("title"));
    }
    @Test public void statusKeepsWatchedSeparateFromDates() throws Exception {
        assertEquals(0,ArchiveOrder.status(e("x","","S01"),"2026-10-16"));
        assertEquals(1,ArchiveOrder.status(e("x","2026-11-01","S01"),"2026-10-16"));
        assertEquals(2,ArchiveOrder.status(e("x","2026-10-16","S01"),"2026-10-16"));
        assertEquals(3,ArchiveOrder.status(e("x","2026-10-01","S01"),"2026-10-16"));
        assertEquals(4,ArchiveOrder.status(e("x","2026-10-01","S01").put("seen",1),"2026-10-16"));
    }
}

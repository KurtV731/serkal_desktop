package de.serkal.android.preview;
import org.junit.Test;
import org.json.JSONObject;
import org.json.JSONArray;
import static org.junit.Assert.*;
public class SharedArchiveClientTest {
    private JSONObject record() throws Exception {
        return new JSONObject().put("schema",1).put("owner","user").put("publisher","pc")
            .put("generatedAt","2026-10-07T12:00:00.000Z").put("entries",new JSONArray().put(
                new JSONObject().put("title","Reacher").put("dates",new JSONArray().put("2026-08-12"))));
    }
    @Test public void acceptsValidSnapshotAndEmptyArchive() throws Exception {
        assertEquals(1,SharedArchiveClient.validate(record(),"user").getJSONArray("entries").length());
        assertEquals(0,SharedArchiveClient.validate(record().put("entries",new JSONArray()),"user").getJSONArray("entries").length());
    }
    @Test public void rejectsOtherOwnerAndInvalidEntries() throws Exception {
        try { SharedArchiveClient.validate(record(),"other"); fail(); } catch(Exception expected) { assertEquals("SHARED_ARCHIVE_INVALID",expected.getMessage()); }
        JSONObject r=record();r.getJSONArray("entries").getJSONObject(0).put("dates",new JSONArray().put("oops"));
        try { SharedArchiveClient.validate(r,"user"); fail(); } catch(Exception expected) { assertEquals("SHARED_ARCHIVE_INVALID",expected.getMessage()); }
    }
}

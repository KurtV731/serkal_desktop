package de.serkal.android.preview;
import org.junit.Test;
import org.json.JSONArray;
import org.json.JSONObject;
import static org.junit.Assert.*;
public class ArchiveWriteTest {
 @Test public void writableSnapshotKeepsAccountAndNotes() throws Exception {
  JSONObject e=new JSONObject().put("title","Test").put("seasonLabel","S01").put("tmdbId",5).put("note","OffsetDE: +1D").put("dates",new JSONArray().put("2026-11-01"));
  JSONObject record=new JSONObject().put("schema",1).put("owner","account").put("publisher","source").put("generatedAt","2026-10-12T00:00:00Z").put("entries",new JSONArray().put(e));
  assertEquals("OffsetDE: +1D",SharedArchiveClient.validate(record,"account").getJSONArray("entries").getJSONObject(0).getString("note"));
  try{SharedArchiveClient.validate(record,"other");fail();}catch(Exception expected){assertEquals("SHARED_ARCHIVE_INVALID",expected.getMessage());}
 }
}

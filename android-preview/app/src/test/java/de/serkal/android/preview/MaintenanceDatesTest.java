package de.serkal.android.preview;
import org.json.*;import org.junit.Test;import static org.junit.Assert.*;
public class MaintenanceDatesTest {
 @Test public void acceptsGermanDatesWithYearAndNewYear()throws Exception{
  JSONArray d=ArchiveCodec.dates("19.12.2026,02.01.2027,09.01.","2026-12-19");
  assertEquals("2026-12-19",d.getString(0));assertEquals("2027-01-02",d.getString(1));assertEquals("2027-01-09",d.getString(2));
 }
 @Test public void invalidNotePreservesDatesButAllowsAnnouncementMetadata()throws Exception{
  JSONObject r=new ArchiveCopyTest().record();JSONObject file=r.getJSONArray("files").getJSONObject(0);String content=file.getString("content").replace("note=;","note=TermineDE%3A%20noch%20offen;");file.put("content",content).put("sha256",ArchiveCodec.hash(content));
  JSONArray anns=new JSONArray();SeasonAnnouncements.update(anns,2,"2027-01-19","Show",false,"2026-10-21");
  JSONObject dates=new JSONObject().put("tmdbId",42).put("seasonLabel","S01").put("termindaten",new JSONArray().put("2026-10-13").put("2026-10-20")).put("episoden",2);
  JSONObject meta=new JSONObject().put("tmdbId",42).put("seasonLabel","S01").put("announcements",anns);
  JSONObject out=ArchiveCodec.maintenance(r,new JSONArray().put(dates).put(meta));JSONObject e=ArchiveCodec.entries(out).getJSONObject(0);
  assertEquals("2026-10-12",e.getJSONArray("datesOriginal").getString(0));assertEquals("COPY_INVALID_DATE",dates.getString("applyError"));assertEquals("Serie (2026).txt",dates.getString("fileName"));assertEquals(1,e.getJSONArray("announcements").length());
  assertTrue(out.getJSONArray("files").getJSONObject(0).getString("content").contains("futureField=keep%20me"));
 }
}

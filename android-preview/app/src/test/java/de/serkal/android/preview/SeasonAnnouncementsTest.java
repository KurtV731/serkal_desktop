package de.serkal.android.preview;
import org.json.*;import org.junit.Test;import static org.junit.Assert.*;
public class SeasonAnnouncementsTest {
 @Test public void historyDeduplicatesAndRetainsWithdrawnDate()throws Exception{
  JSONArray a=new JSONArray();assertNotNull(SeasonAnnouncements.update(a,2,"2027-01-19","Ahsoka",false,"2026-10-21"));
  assertNull(SeasonAnnouncements.update(a,2,"2027-01-19","Ahsoka",false,"2026-10-22"));
  SeasonAnnouncements.update(a,2,"2027-01-26","Ahsoka",false,"2026-10-23");
  JSONObject e=new JSONObject().put("tmdbId",42).put("announcements",a);String id=SeasonAnnouncements.desired(new JSONArray().put(e)).get(0).getString("id");
  SeasonAnnouncements.update(a,2,"","Ahsoka",false,"2026-10-24");JSONObject card=SeasonAnnouncements.desired(new JSONArray().put(e)).get(0);
  assertEquals(id,card.getString("id"));assertEquals("2027-01-26",card.getJSONObject("start").getString("date"));assertTrue(card.getString("description").contains("Termin unbekannt"));assertEquals(3,a.getJSONObject(0).getJSONArray("history").length());
 }
 @Test public void watchedLatestSeasonAddsFullNextSeasonButNotPast()throws Exception{
  JSONArray entries=new JSONArray().put(new JSONObject().put("tmdbId",42).put("title","Show").put("year","2026").put("seasonLabel","S07").put("seen",1));
  JSONObject result=Maintenance.run(entries,(p,q)->{
   if(p.endsWith("/watch/providers"))return new JSONObject();
   if(p.equals("tv/42"))return new JSONObject("{name:'Show',number_of_seasons:8}");
   return new JSONObject("{air_date:'2027-01-19',episodes:[{episode_number:1,air_date:'2027-01-19'},{episode_number:2,air_date:'2027-01-26'}]}");
  },"DE",false,"2026-10-21T00:00:00Z");
  int inserted=0;JSONArray patches=result.getJSONArray("patches");for(int i=0;i<patches.length();i++)if(patches.getJSONObject(i).has("insertPayload")){inserted++;assertEquals(8,patches.getJSONObject(i).getJSONObject("insertPayload").getInt("staffelNummer"));}
  assertEquals(1,inserted);
 }
 @Test public void announcementMetadataRoundTripsUnknownFields()throws Exception{
  JSONObject record=new ArchiveCopyTest().record();JSONArray a=new JSONArray();SeasonAnnouncements.update(a,2,"2027-01-19","Show",true,"2026-10-21");
  JSONObject out=ArchiveCodec.maintenance(record,new JSONArray().put(new JSONObject().put("tmdbId",42).put("seasonLabel","S01").put("announcements",a)));
  assertEquals("2027-01-19",ArchiveCodec.entries(out).getJSONObject(0).getJSONArray("announcements").getJSONObject(0).getString("date"));assertTrue(out.getJSONArray("files").getJSONObject(0).getString("content").contains("futureField=keep%20me"));
 }
}

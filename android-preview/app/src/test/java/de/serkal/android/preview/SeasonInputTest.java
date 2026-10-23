package de.serkal.android.preview;
import org.junit.Test;
import org.json.*;
import java.util.*;
import static org.junit.Assert.*;

public class SeasonInputTest {
 JSONObject tv()throws Exception{return new JSONObject().put("seasons",new JSONArray().put(new JSONObject().put("season_number",2).put("episode_count",8).put("air_date","2027-01-19")));}
 JSONObject season(boolean complete)throws Exception{
  JSONArray episodes=new JSONArray();for(int i=0;i<8;i++)episodes.put(new JSONObject().put("episode_number",i+1).put("air_date",complete?ArchiveCodec.dateShift("2027-01-19",7*i):JSONObject.NULL));
  return new JSONObject().put("air_date","2027-01-19").put("episodes",episodes);
 }
 JSONObject payload(boolean complete)throws Exception{return SeasonInput.schedule(tv(),season(complete),2).put("tmdbId",42).put("staffelNummer",2).put("titel","Ahsoka").put("jahr","2023").put("calendarLanguage","en");}
 @Test public void knownStartAndEightUnknownEpisodesAreAnAnnouncement()throws Exception{
  JSONObject p=payload(false);assertTrue(p.getBoolean("announcementOnly"));assertEquals(8,p.getInt("episoden"));assertEquals(0,p.getJSONArray("termindaten").length());assertEquals("2027-01-19",p.getString("announcedStart"));
 }
 @Test public void tvMetadataWorksBeforeEpisodeDetailsExist()throws Exception{
  JSONObject p=SeasonInput.schedule(tv(),new JSONObject(),2);assertEquals(8,p.getInt("episoden"));assertTrue(p.getBoolean("announcementOnly"));
 }
 @Test public void missingStartDoesNotInventADate()throws Exception{
  try{SeasonInput.schedule(new JSONObject(),new JSONObject(),2);fail();}catch(Exception e){assertEquals("DATES",e.getMessage());}
 }
 @Test public void completeScheduleRemainsAnEpisodeSchedule()throws Exception{
  JSONObject p=payload(true);assertFalse(p.getBoolean("announcementOnly"));assertEquals(8,p.getJSONArray("termindaten").length());
 }
 @Test public void announcementPreservesFirstSeasonAndOnlyCreatesAnnouncementCard()throws Exception{
  JSONObject r=new ArchiveCopyTest().record();JSONObject old=ArchiveCodec.entries(r).getJSONObject(0);
  JSONObject changed=ArchiveCodec.edit(r,"insert",payload(false));ArchiveCodec.validate(changed,"123");
  JSONArray entries=ArchiveCodec.entries(changed);assertEquals(2,entries.length());JSONObject first=entries.getJSONObject(0),second=entries.getJSONObject(1);
  for(String k:new String[]{"dates","startOriginal","eps","manualFlags","note"})assertEquals(old.get(k).toString(),first.get(k).toString());
  assertTrue(second.getBoolean("announcementOnly"));assertEquals("2027-01-19",ArchiveOrder.start(second));assertEquals(8,second.getInt("eps"));
  assertEquals(2,CalendarCopy.desired(changed).size()); // Only the two pre-existing S01 episodes.
  List<JSONObject> cards=SeasonAnnouncements.desired(entries);assertEquals(1,cards.size());assertTrue(cards.get(0).getString("summary").endsWith("S02"));assertTrue(cards.get(0).getString("description").contains("Expected episodes: 8"));
  JSONObject again=ArchiveCodec.edit(changed,"insert",payload(false));assertEquals(2,ArchiveCodec.entries(again).length());assertEquals(cards.get(0).toString(),SeasonAnnouncements.desired(ArchiveCodec.entries(again)).get(0).toString());
 }
 @Test public void completeScheduleReplacesPlaceholderWithoutLosingPermanentCard()throws Exception{
  JSONObject r=ArchiveCodec.edit(new ArchiveCopyTest().record(),"insert",payload(false));
  r=ArchiveCodec.edit(r,"insert",payload(true));JSONObject e=ArchiveCodec.entries(r).getJSONObject(1);
  assertFalse(e.getBoolean("announcementOnly"));assertEquals(8,e.getJSONArray("dates").length());assertEquals(10,CalendarCopy.desired(r).size());assertEquals(1,SeasonAnnouncements.desired(ArchiveCodec.entries(r)).size());
 }
 @Test public void partialDataNeverReplacesACompleteSeason()throws Exception{
  JSONObject r=ArchiveCodec.edit(new ArchiveCopyTest().record(),"insert",payload(true));
  JSONObject old=ArchiveCodec.entries(r).getJSONObject(1);r=ArchiveCodec.edit(r,"insert",payload(false));JSONObject e=ArchiveCodec.entries(r).getJSONObject(1);
  assertFalse(e.getBoolean("announcementOnly"));assertEquals(old.getJSONArray("dates").toString(),e.getJSONArray("dates").toString());
 }
 @Test public void maintenanceDoesNotPromoteOneKnownEpisodeToEightConfirmedEpisodes()throws Exception{
  JSONObject r=ArchiveCodec.edit(new ArchiveCopyTest().record(),"insert",payload(false));
  JSONObject one=new JSONObject().put("air_date","2027-01-19").put("episodes",new JSONArray().put(new JSONObject().put("episode_number",1).put("air_date","2027-01-19")));
  JSONObject result=Maintenance.run(ArchiveCodec.entries(r),(path,query)->path.contains("/watch/providers")?new JSONObject():path.contains("/season/")?one:tv().put("name","Ahsoka").put("number_of_seasons",2),"DE",true,"2026-10-23T12:00:00Z");
  JSONArray patches=result.getJSONArray("patches");for(int i=0;i<patches.length();i++){JSONObject p=patches.getJSONObject(i);if(p.optString("seasonLabel").equals("S02"))assertFalse(p.has("termindaten"));}
  JSONObject after=ArchiveCodec.entries(ArchiveCodec.maintenance(r,patches)).getJSONObject(1);assertTrue(after.getBoolean("announcementOnly"));assertEquals(8,after.getInt("eps"));
 }
}

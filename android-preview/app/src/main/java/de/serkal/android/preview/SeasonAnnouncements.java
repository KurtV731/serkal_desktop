package de.serkal.android.preview;
import org.json.*;import java.util.*;
/** Same persisted announcement format and stable calendar IDs as Desktop. */
final class SeasonAnnouncements {
 static String date(JSONObject o,String key){String s=o==null?"":o.optString(key);return s.matches("\\d{4}-\\d{2}-\\d{2}")?s:"";}
 static JSONObject update(JSONArray old,int season,String date,String title,boolean en,String today)throws Exception{
  JSONObject previous=null;for(int i=0;i<old.length();i++)if(old.getJSONObject(i).optInt("season")==season)previous=old.getJSONObject(i);
  if(previous!=null && previous.optString("date").equals(date))return null;
  JSONArray history=previous==null || previous.optJSONArray("history")==null?new JSONArray():new JSONArray(previous.optJSONArray("history").toString());
  history.put(new JSONObject().put("capturedAt",today).put("from",previous==null?"":previous.optString("date")).put("to",date));
  JSONObject a=new JSONObject().put("season",season).put("date",date).put("title",title).put("language",en?"en":"de").put("history",history);
  boolean replaced=false;for(int i=0;i<old.length();i++)if(old.getJSONObject(i).optInt("season")==season){old.put(i,a);replaced=true;break;}if(!replaced)old.put(a);
  return new JSONObject().put("kind",previous==null?"announced-season":"announcement-changed").put("title",title).put("season",season).put("date",date);
 }
 static List<JSONObject> desired(JSONArray entries)throws Exception{
  Map<String,JSONObject> wanted=new LinkedHashMap<>();
  for(int i=0;i<entries.length();i++){JSONObject e=entries.getJSONObject(i);JSONArray list=e.optJSONArray("announcements");if(list==null)continue;
   for(int j=0;j<list.length();j++){JSONObject a=list.getJSONObject(j);JSONArray history=a.optJSONArray("history");String d=date(a,"date");
    if(d.isEmpty() && history!=null)for(int k=history.length()-1;k>=0;k--){d=date(history.getJSONObject(k),"to");if(!d.isEmpty())break;}if(d.isEmpty())continue;
    boolean en=a.optString("language").equals("en");String key=e.getInt("tmdbId")+String.format(Locale.ROOT,":S%02d",a.getInt("season"));
    StringBuilder desc=new StringBuilder(en?"Provisional start date. This card remains until you delete it.":"Vorläufiges Startdatum. Diese Karte bleibt bis zur manuellen Löschung bestehen.");
    if(history!=null)for(int k=0;k<history.length();k++){JSONObject h=history.getJSONObject(k);String from=date(h,"from"),to=date(h,"to");desc.append('\n').append(en?"Recorded on ":"Erfasst am ").append(h.optString("capturedAt")).append(": ").append(from.isEmpty()?(en?"announced for ":"angekündigt für "):(en?"from ":"von ")+from+" → ").append(to.isEmpty()?(en?"date unknown":"Termin unbekannt"):to);}
    wanted.put(key,new JSONObject().put("id","serkal"+ArchiveCodec.hash("SHA-1","announcement:"+key)).put("summary",(en?"Announced season start: ":"Angekündigter Staffelstart: ")+a.optString("title")+String.format(Locale.ROOT," S%02d",a.getInt("season"))).put("description",desc.toString()).put("start",new JSONObject().put("date",d)).put("end",new JSONObject().put("date",ArchiveCodec.dateShift(d,1))).put("transparency","transparent").put("extendedProperties",new JSONObject().put("private",new JSONObject().put("serkal","announcement").put("announcementKey",key))));
   }
  }return new ArrayList<>(wanted.values());
 }
 static void synchronize(ArchiveCopyClient client,String base,List<JSONObject> desired)throws Exception{
  if(desired.isEmpty())return;
  Map<String,JSONObject> wanted=new LinkedHashMap<>();for(JSONObject e:desired)wanted.put(e.getString("id"),e);
  String page="";do{JSONObject r=client.get(base+"?showDeleted=true&maxResults=2500&privateExtendedProperty=serkal%3Dannouncement&pageToken="+ArchiveCopyClient.esc(page));JSONArray items=r.optJSONArray("items");
   if(items!=null)for(int i=0;i<items.length();i++){JSONObject old=items.getJSONObject(i),next=wanted.remove(old.optString("id"));if(next==null || old.optString("status").equals("cancelled"))continue;
    if(!old.optString("description").equals(next.optString("description")) || !old.optString("summary").equals(next.optString("summary")) || !old.getJSONObject("start").optString("date").equals(next.getJSONObject("start").optString("date"))){next.remove("id");client.request(base+"/"+ArchiveCopyClient.esc(old.getString("id")),"PUT",next.toString(),"application/json");}
   }page=r.optString("nextPageToken");
  }while(!page.isEmpty());
  for(JSONObject e:wanted.values())try{client.request(base,"POST",e.toString(),"application/json");}catch(Exception error){if(!"GOOGLE_HTTP_409".equals(error.getMessage()))throw error;JSONObject old=client.get(base+"/"+ArchiveCopyClient.esc(e.getString("id")));if(!old.optString("status").equals("cancelled"))throw error;}
 }
}

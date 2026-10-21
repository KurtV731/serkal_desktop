package de.serkal.android.preview;

import org.json.*;
import java.util.*;

final class CalendarCopy {
    static String signature(JSONObject e) throws Exception {
        JSONObject p=e.optJSONObject("extendedProperties");p=p==null?new JSONObject():p.optJSONObject("private");if(p==null)p=new JSONObject();
        JSONObject start=e.optJSONObject("start"),end=e.optJSONObject("end");
        String a=start==null?"":start.optString("date",start.optString("dateTime")),b=end==null?"":end.optString("date",end.optString("dateTime"));
        if(a.length()>10)a=a.substring(0,10);if(b.length()>10)b=b.substring(0,10);
        return ArchiveCodec.hash(ArchiveCodec.join("|",e.optString("summary").trim(),a,b,e.optString("description"),p.optString("tmdbId"),p.optString("season"),p.optString("episodeFrom"),p.optString("episodeTo")));
    }
    static String key(JSONObject e) throws Exception {JSONObject p=e.getJSONObject("extendedProperties").getJSONObject("private");return ArchiveCodec.join(":",p.optString("tmdbId"),p.optString("season"),p.optString("episodeFrom"),p.optString("episodeTo"));}
    static List<JSONObject> desired(JSONObject record) throws Exception {
        List<JSONObject> events=new ArrayList<>();JSONArray entries=ArchiveCodec.entries(record);String year=String.valueOf(Calendar.getInstance().get(Calendar.YEAR));
        for(int n=0;n<entries.length();n++){
            JSONObject e=entries.getJSONObject(n);JSONArray dates=e.getJSONArray("dates");boolean current=false;
            for(int i=0;i<dates.length();i++)if(dates.getString(i).substring(0,4).compareTo(year)>=0)current=true;
            if(!current || e.optInt("tmdbId")<=0)continue;
            for(int i=0;i<dates.length();){int last=i;while(last+1<dates.length() && dates.getString(last+1).equals(dates.getString(i)))last++;
                JSONObject p=new JSONObject().put("serkal","1").put("tmdbId",String.valueOf(e.getInt("tmdbId"))).put("season",e.getString("seasonLabel"))
                    .put("episodeFrom",String.valueOf(i+1)).put("episodeTo",String.valueOf(last+1));
                String summary=e.getString("title")+" ("+e.getString("year")+") "+e.getString("seasonLabel")+String.format(Locale.ROOT,"E%02d",i+1)+(last==i?"":String.format(Locale.ROOT,"–E%02d",last+1));
                String providers=WatchProviders.text(e.optJSONObject("watchProviders"),e.optString("note"),e.optString("calendarLanguage").equals("en"));
                JSONObject event=new JSONObject().put("summary",summary).put("description","SerKal"+(providers.isEmpty()?"":"\n"+providers)).put("start",new JSONObject().put("date",dates.getString(i)))
                    .put("end",new JSONObject().put("date",ArchiveCodec.dateShift(dates.getString(i),1))).put("transparency","transparent").put("extendedProperties",new JSONObject().put("private",p));
                p.put("serkalSignature",signature(event));event.put("id","serkal"+ArchiveCodec.hash("SHA-1",key(event)+":"+record.getString("revision")));events.add(event);i=last+1;
            }
        }return events;
    }
    static void synchronize(ArchiveCopyClient client,JSONObject record) throws Exception {
        JSONObject calendar=record.getJSONObject("calendar");if(!calendar.getString("mode").equals("google"))return;
        String id=calendar.getString("id");List<JSONObject> wanted=desired(record),announced=SeasonAnnouncements.desired(ArchiveCodec.entries(record));
        if(id.isEmpty()){if(wanted.isEmpty() && announced.isEmpty())return;throw new Exception("COPY_CALENDAR_ID_MISSING");}
        String base="https://www.googleapis.com/calendar/v3/calendars/"+ArchiveCopyClient.esc(id)+"/events";
        SeasonAnnouncements.synchronize(client,base,announced);
        List<JSONObject> remote=new ArrayList<>();String page="";
        do{JSONObject r=client.get(base+"?singleEvents=true&showDeleted=false&maxResults=2500&privateExtendedProperty=serkal%3D1&pageToken="+ArchiveCopyClient.esc(page));
            JSONArray events=r.optJSONArray("items");if(events!=null)for(int i=0;i<events.length();i++)remote.add(events.getJSONObject(i));page=r.optString("nextPageToken");
        }while(!page.isEmpty());
        Set<String> past=new HashSet<>();JSONArray entries=ArchiveCodec.entries(record);String year=String.valueOf(Calendar.getInstance().get(Calendar.YEAR));
        for(int i=0;i<entries.length();i++){JSONObject e=entries.getJSONObject(i);JSONArray dates=e.getJSONArray("dates");boolean current=false;for(int j=0;j<dates.length();j++)if(dates.getString(j).substring(0,4).compareTo(year)>=0)current=true;
            if(dates.length()>0 && !current)past.add(e.getInt("tmdbId")+":"+e.getString("seasonLabel"));}
        Map<String,JSONObject> desired=new LinkedHashMap<>();for(JSONObject e:wanted)desired.put(key(e),e);Set<String> seen=new HashSet<>();List<JSONObject> actions=new ArrayList<>();
        for(JSONObject e:remote){JSONObject p=e.getJSONObject("extendedProperties").getJSONObject("private");String k=key(e);JSONObject target=desired.get(k);
            if(target==null && past.contains(p.optString("tmdbId")+":"+p.optString("season")))continue;
            if(!signature(e).equals(p.optString("serkalSignature"))){if(target==null || !signature(target).equals(signature(e)))throw new Exception("COPY_CALENDAR_PROTECTED");seen.add(k);continue;}
            if(target==null || seen.contains(k))actions.add(new JSONObject().put("method","DELETE").put("id",e.getString("id")));
            else {seen.add(k);if(!signature(target).equals(signature(e))){JSONObject body=new JSONObject(target.toString());body.remove("id");actions.add(new JSONObject().put("method","PUT").put("id",e.getString("id")).put("body",body));}}
        }
        for(Map.Entry<String,JSONObject> e:desired.entrySet())if(!seen.contains(e.getKey()))actions.add(new JSONObject().put("method","POST").put("id","").put("body",e.getValue()));
        for(JSONObject op:actions){String method=op.getString("method"),eventId=op.getString("id");JSONObject body=op.optJSONObject("body");
            try{client.request(base+(eventId.isEmpty()?"":"/"+ArchiveCopyClient.esc(eventId)),method,body==null?null:body.toString(),"application/json");}
            catch(Exception error){String code=error.getMessage();if(method.equals("DELETE") && ("GOOGLE_HTTP_404".equals(code)||"GOOGLE_HTTP_410".equals(code)))continue;
                if(method.equals("POST") && "GOOGLE_HTTP_409".equals(code)){JSONObject old=client.get(base+"/"+ArchiveCopyClient.esc(body.getString("id")));if(signature(old).equals(signature(body)))continue;}throw error;}
        }
    }
}


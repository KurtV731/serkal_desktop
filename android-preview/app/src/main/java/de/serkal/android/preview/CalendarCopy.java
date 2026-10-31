package de.serkal.android.preview;

import org.json.*;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;

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
            JSONObject e=entries.getJSONObject(n);if(e.optBoolean("announcementOnly"))continue;JSONArray dates=e.getJSONArray("dates");boolean current=false;
            for(int i=0;i<dates.length();i++)if(dates.getString(i).substring(0,4).compareTo(year)>=0)current=true;
            if(!current || e.optInt("tmdbId")<=0)continue;
            for(int i=0;i<dates.length();){int last=i;while(last+1<dates.length() && dates.getString(last+1).equals(dates.getString(i)))last++;
                JSONObject p=new JSONObject().put("serkal","1").put("tmdbId",String.valueOf(e.getInt("tmdbId"))).put("season",e.getString("seasonLabel"))
                    .put("episodeFrom",String.valueOf(i+1)).put("episodeTo",String.valueOf(last+1));
                String summary=ArchiveOrder.title(e,e.optString("calendarLanguage","de").equals("en"))+" ("+e.getString("year")+") "+e.getString("seasonLabel")+String.format(Locale.ROOT,"E%02d",i+1)+(last==i?"":String.format(Locale.ROOT,"–E%02d",last+1));
                String providers=WatchProviders.text(e.optJSONObject("watchProviders"),e.optString("note"),e.optString("calendarLanguage").equals("en"));
                JSONObject event=new JSONObject().put("summary",summary).put("description","SerKal"+(providers.isEmpty()?"":"\n"+providers)).put("start",new JSONObject().put("date",dates.getString(i)))
                    .put("end",new JSONObject().put("date",ArchiveCodec.dateShift(dates.getString(i),1))).put("transparency","transparent").put("extendedProperties",new JSONObject().put("private",p));
                p.put("serkalSignature",signature(event));event.put("id","serkal"+ArchiveCodec.hash("SHA-1",key(event)+":"+record.getString("revision")));events.add(event);i=last+1;
            }
        }return events;
    }
    static void synchronize(ArchiveCopyClient client,JSONObject record) throws Exception {synchronize(client,record,false);}
    static void synchronize(ArchiveCopyClient client,JSONObject record,boolean replaceManaged) throws Exception {synchronize(client,record,replaceManaged,null);}
    static void synchronize(ArchiveCopyClient client,JSONObject record,boolean replaceManaged,SessionArchiveClient.Progress progress) throws Exception {
        synchronize(client,record,replaceManaged,progress,null,null);
    }
    static void synchronize(ArchiveCopyClient client,JSONObject record,boolean replaceManaged,SessionArchiveClient.Progress progress,Set<String> scopes,SessionArchiveClient.Remaining onRemaining)throws Exception{
        JSONObject calendar=record.getJSONObject("calendar");if(!calendar.getString("mode").equals("google"))return;
        String id=calendar.getString("id");List<JSONObject> wanted=desired(record),announced=SeasonAnnouncements.desired(ArchiveCodec.entries(record));
        if(id.isEmpty()){if(wanted.isEmpty() && announced.isEmpty())return;throw new Exception("COPY_CALENDAR_ID_MISSING");}
        String base="https://www.googleapis.com/calendar/v3/calendars/"+ArchiveCopyClient.esc(id)+"/events";
        if(scopes!=null){wanted.removeIf(e->!scopes.contains(CalendarScope.group(e)));announced.removeIf(e->!scopes.contains(CalendarScope.group(e)));}
        List<JSONObject> remote=new ArrayList<>();String page="";
        do{JSONObject r=client.get(base+"?singleEvents=true&showDeleted=false&maxResults=2500&privateExtendedProperty=serkal%3D1&pageToken="+ArchiveCopyClient.esc(page));
            JSONArray events=r.optJSONArray("items");if(events!=null)for(int i=0;i<events.length();i++)remote.add(events.getJSONObject(i));page=r.optString("nextPageToken");
        }while(!page.isEmpty());
        Set<String> past=new HashSet<>();JSONArray entries=ArchiveCodec.entries(record);String year=String.valueOf(Calendar.getInstance().get(Calendar.YEAR));
        for(int i=0;i<entries.length();i++){JSONObject e=entries.getJSONObject(i);JSONArray dates=e.getJSONArray("dates");boolean current=false;for(int j=0;j<dates.length();j++)if(dates.getString(j).substring(0,4).compareTo(year)>=0)current=true;
            if(dates.length()>0 && !current)past.add(e.getInt("tmdbId")+":"+e.getString("seasonLabel"));}
        Map<String,JSONObject> desired=new LinkedHashMap<>();for(JSONObject e:wanted)desired.put(key(e),e);Set<String> seen=new HashSet<>();List<JSONObject> actions=new ArrayList<>();
        for(JSONObject e:remote){if(scopes!=null&&!scopes.contains(CalendarScope.group(e)))continue;JSONObject p=e.getJSONObject("extendedProperties").getJSONObject("private");String k=key(e);JSONObject target=desired.get(k);
            if(target==null && past.contains(p.optString("tmdbId")+":"+p.optString("season")))continue;
            if(!replaceManaged && !signature(e).equals(p.optString("serkalSignature"))){if(target==null || !signature(target).equals(signature(e)))throw new Exception("COPY_CALENDAR_PROTECTED");seen.add(k);continue;}
            if(target==null || seen.contains(k))actions.add(new JSONObject().put("method","DELETE").put("id",e.getString("id")));
            else {seen.add(k);if(!signature(target).equals(signature(e))){JSONObject body=new JSONObject(target.toString());body.remove("id");actions.add(new JSONObject().put("method","PUT").put("id",e.getString("id")).put("body",body));}}
        }
        for(Map.Entry<String,JSONObject> e:desired.entrySet())if(!seen.contains(e.getKey()))actions.add(new JSONObject().put("method","POST").put("id","").put("body",e.getValue()));
        Map<String,JSONObject> remoteById=new HashMap<>();for(JSONObject e:remote)remoteById.put(e.optString("id"),e);
        Map<String,Integer> remaining=new TreeMap<>();
        for(JSONObject op:actions){String key=CalendarScope.group(op.has("body")?op.getJSONObject("body"):remoteById.get(op.getString("id")));remaining.put(key,remaining.getOrDefault(key,0)+1);}
        for(JSONObject e:announced){String k=CalendarScope.group(e);remaining.put(k,remaining.getOrDefault(k,0)+1);}
        if(client instanceof SessionArchiveClient&&((SessionArchiveClient)client).calendarPlan!=null){
            int create=0,update=0,delete=0;for(JSONObject op:actions){if(op.getString("method").equals("POST"))create++;else if(op.getString("method").equals("PUT"))update++;else delete++;}
            ((SessionArchiveClient)client).calendarPlan.accept(new JSONObject().put("scope",scopes==null?"full-target":"changed-series").put("scopes",scopes==null?JSONObject.NULL:scopes.size()).put("create",create).put("update",update).put("delete",delete).put("announcementChecks",announced.size()));
        }
        if(onRemaining!=null)onRemaining.update(new TreeSet<>(remaining.keySet()));
        SessionArchiveClient.Remaining completedScope=done->{for(String k:done){int left=remaining.getOrDefault(k,1)-1;if(left>0)remaining.put(k,left);else{remaining.remove(k);if(onRemaining!=null)onRemaining.update(new TreeSet<>(remaining.keySet()));}}};
        SeasonAnnouncements.synchronize(client,base,announced,k->completedScope.update(Collections.singleton(k)));
        if(progress!=null)progress.update("calendar-write",0,actions.size());
        int completed=0;
        for(JSONObject op:actions){operationLog(client,op.getString("method"),op.optJSONObject("body"),remoteById.get(op.optString("id")));execute(client,base,op);completedScope.update(Collections.singleton(CalendarScope.group(op.has("body")?op.getJSONObject("body"):remoteById.get(op.getString("id")))));if(progress!=null)progress.update("calendar-write",++completed,actions.size());}
    }

    static void operationLog(ArchiveCopyClient client,String method,JSONObject target,JSONObject previous)throws Exception{
        if(!(client instanceof SessionArchiveClient)||((SessionArchiveClient)client).calendarPlan==null)return;
        JSONArray fields=new JSONArray();if(target!=null&&previous!=null)for(String k:new String[]{"summary","description","start","end"})if(!String.valueOf(target.opt(k)).equals(String.valueOf(previous.opt(k))))fields.put(k);
        ((SessionArchiveClient)client).calendarPlan.accept(new JSONObject().put("method",method).put("scope",CalendarScope.group(target==null?previous:target)).put("reason",method.equals("POST")?"missing":method.equals("DELETE")?"removed-or-duplicate":"changed-fields").put("changedFields",fields));
    }
    private static void execute(ArchiveCopyClient client,String base,JSONObject op)throws Exception{
        String method=op.getString("method"),eventId=op.getString("id");JSONObject body=op.optJSONObject("body");
        try{client.request(base+(eventId.isEmpty()?"":"/"+ArchiveCopyClient.esc(eventId)),method,body==null?null:body.toString(),"application/json");}
        catch(Exception error){String code=GoogleHttpFailure.code(error);if(method.equals("DELETE")&&(code.equals("GOOGLE_HTTP_404")||code.equals("GOOGLE_HTTP_410")))return;
            if(method.equals("POST")&&code.equals("GOOGLE_HTTP_409")){JSONObject old=client.get(base+"/"+ArchiveCopyClient.esc(body.getString("id")));if(signature(old).equals(signature(body)))return;}throw error;
        }

    }
}



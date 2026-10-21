package de.serkal.android.preview;
import org.json.*;
import java.util.*;
import java.text.SimpleDateFormat;

/** Fetch first, then atomically apply to the still-current local archive. Never auto-add seasons. */
final class Maintenance {
    interface Source {JSONObject get(String path,String query) throws Exception;}
    static JSONObject run(JSONArray entries,Source source,String country,boolean english,String now) throws Exception {
        if(!country.matches("[A-Z]{2}"))throw new Exception("PROVIDER_COUNTRY_INVALID");
        JSONArray patches=new JSONArray(),report=new JSONArray(),providers=new JSONArray(),errors=new JSONArray();
        LinkedHashMap<Integer,List<JSONObject>> groups=new LinkedHashMap<>();
        for(int i=0;i<entries.length();i++){JSONObject e=entries.getJSONObject(i);int id=e.optInt("tmdbId");if(id>0)groups.computeIfAbsent(id,k->new ArrayList<>()).add(e);}
        for(Map.Entry<Integer,List<JSONObject>> group:groups.entrySet()){
            if(Thread.currentThread().isInterrupted())throw new InterruptedException();
            int id=group.getKey();String language="language="+(english?"en-US":"de-DE");
            try{
                JSONObject tv=source.get("tv/"+id,language+"&append_to_response=translations,alternative_titles"),offers=null;String title=TmdbTitle.resolve(tv,english);
                try{offers=WatchProviders.normalize(source.get("tv/"+id+"/watch/providers",""),country,now);}catch(Exception error){errors.put(new JSONObject().put("tmdbId",id).put("kind","providers"));}
                providers.put(new JSONObject().put("tmdbId",id).put("title",title).put("info",offers==null?JSONObject.NULL:offers));
                Map<Integer,JSONObject> existing=new LinkedHashMap<>();for(JSONObject e:group.getValue()){
                    existing.put(ArchiveCodec.number(e.getString("seasonLabel").replaceAll("\\D","")),e);
                    JSONObject metadata=new JSONObject().put("tmdbId",id).put("seasonLabel",e.getString("seasonLabel"));
                    if(offers!=null)metadata.put("watchProviders",offers);
                    metadata.put("calendarLanguage",english?"en":"de");
                    if(!title.isEmpty() && (e.optInt("manualFlags")&1)==0)metadata.put(english?"titleEN":"titleDE",title);
                    patches.put(metadata);
                }
                int max=tv.optInt("number_of_seasons");if(max<0 || max>999)throw new Exception("MAINT_INVALID_SEASONS");
                int first=Integer.MAX_VALUE,last=0;for(int number:existing.keySet())if(number>0){first=Math.min(first,number);last=Math.max(last,number);}
                boolean follow=existing.containsKey(last) && existing.get(last).optInt("seen")==1;
                JSONArray announcements=new JSONArray();for(JSONObject item:group.getValue())if(item.optJSONArray("announcements")!=null && item.getJSONArray("announcements").length()>announcements.length())announcements=new JSONArray(item.getJSONArray("announcements").toString());
                String today=now.substring(0,10);
                for(int n=first;n<=max;n++){
                    if(Thread.currentThread().isInterrupted())throw new InterruptedException();
                    JSONObject e=existing.get(n),season;
                    try{season=source.get("tv/"+id+"/season/"+n,language);}catch(Exception error){errors.put(new JSONObject().put("tmdbId",id).put("season",n));continue;}
                    JSONArray episodes=season.optJSONArray("episodes");if(episodes==null)episodes=new JSONArray();JSONArray dates=new JSONArray();boolean complete=episodes.length()>0;
                    String start=SeasonAnnouncements.date(season,"air_date");if(start.isEmpty() && episodes.length()>0)start=SeasonAnnouncements.date(episodes.optJSONObject(0),"air_date");
                    if(e==null && (!start.isEmpty() && start.compareTo(today)<=0))report.put(new JSONObject().put("kind","missing-season").put("title",title).put("season",n).put("date",start));
                    if(e==null && (start.isEmpty() || start.compareTo(today)>0) && !(n>last && follow))report.put(new JSONObject().put("kind","announced-season").put("title",title).put("season",n).put("date",start));
                    if(e==null && n>last && follow){JSONObject change=SeasonAnnouncements.update(announcements,n,start,title,english,today);if(change!=null)report.put(change);}
                    // Continue following already recorded announcements even after a season is archived.
                    else for(int ai=0;ai<announcements.length();ai++)if(announcements.getJSONObject(ai).optInt("season")==n){JSONObject change=SeasonAnnouncements.update(announcements,n,start,title,english,today);if(change!=null)report.put(change);break;}
                    for(int j=0;j<episodes.length();j++){JSONObject ep=episodes.getJSONObject(j);String date=ep.optString("air_date");int number=ep.optInt("episode_number",j+1);
                        if(!date.matches("\\d{4}-\\d{2}-\\d{2}")){complete=false;continue;}ArchiveCodec.dateShift(date,0);dates.put(date);
                        JSONArray old=e==null?null:e.optJSONArray("datesOriginal");String previous=old==null?"":old.optString(number-1);
                        if(e!=null && !previous.equals(date))report.put(new JSONObject().put("kind",previous.isEmpty()?"new-episode":"changed-episode").put("title",title).put("season",n).put("episode",number).put("date",date));
                    }
                    if(e==null && n>last && follow && complete && episodes.length()>1){
                        JSONObject payload=new JSONObject().put("tmdbId",id).put("titel",title).put("jahr",group.getValue().get(0).getString("year")).put("staffelNummer",n).put("episoden",episodes.length()).put("termindaten",dates).put(english?"titleEN":"titleDE",title).put("calendarLanguage",english?"en":"de");
                        patches.put(new JSONObject().put("tmdbId",id).put("seasonLabel",String.format(Locale.ROOT,"S%02d",n)).put("insertPayload",payload));
                        report.put(new JSONObject().put("kind","added-season").put("title",title).put("season",n).put("date",start));
                    }
                    if(e!=null){JSONObject patch=new JSONObject().put("tmdbId",id).put("seasonLabel",e.getString("seasonLabel"));if(offers!=null)patch.put("watchProviders",offers);
                        int flags=e.optInt("manualFlags");if(complete && (flags&56)==0)patch.put("termindaten",dates).put("episoden",episodes.length());
                        patches.put(patch);}
                }
                for(JSONObject item:group.getValue())if(!announcements.toString().equals(item.optJSONArray("announcements")==null?"[]":item.getJSONArray("announcements").toString()))patches.put(new JSONObject().put("tmdbId",id).put("seasonLabel",item.getString("seasonLabel")).put("announcements",announcements));
                // Even an archived season absent from the current TV season count retains provider metadata.
                for(JSONObject e:group.getValue())if(offers!=null && ArchiveCodec.number(e.getString("seasonLabel").replaceAll("\\D",""))>max)patches.put(new JSONObject().put("tmdbId",id).put("seasonLabel",e.getString("seasonLabel")).put("watchProviders",offers));
            }catch(InterruptedException interrupted){throw interrupted;}catch(Exception error){errors.put(new JSONObject().put("tmdbId",id).put("kind","series"));}
        }
        return new JSONObject().put("country",country).put("checkedAt",now).put("patches",patches).put("report",report).put("providers",providers).put("errors",errors);
    }
}


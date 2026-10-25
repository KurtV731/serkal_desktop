package de.serkal.android.preview;

import org.json.*;
import java.util.*;

/** season-plan-1: shared with Desktop season-policy.js and the common fixtures. */
final class SeasonInput {
    static final String RULES="season-plan-1";
    static JSONObject schedule(JSONObject tv, JSONObject season, int number) throws Exception {
        JSONArray episodes=season.optJSONArray("episodes"), dates=new JSONArray();
        if(episodes==null)episodes=new JSONArray();
        int count=episodes.length();String start=SeasonAnnouncements.date(season,"air_date");
        JSONArray seasons=tv.optJSONArray("seasons");
        if(seasons!=null)for(int i=0;i<seasons.length();i++){
            JSONObject s=seasons.getJSONObject(i);if(s.optInt("season_number")!=number)continue;
            count=Math.max(count,s.optInt("episode_count"));
            if(start.isEmpty())start=SeasonAnnouncements.date(s,"air_date");
        }
        Map<Integer,String> ordered=new TreeMap<>();boolean complete=count>1 && episodes.length()==count;
        for(int i=0;i<episodes.length();i++){
            JSONObject e=episodes.getJSONObject(i);int n=e.optInt("episode_number");String date=SeasonAnnouncements.date(e,"air_date");
            if(n==1 && start.isEmpty())start=date;
            if(n<1 || ordered.containsKey(n) || date.isEmpty())complete=false;
            else {try{ArchiveCodec.dateShift(date,0);}catch(Exception invalid){complete=false;}ordered.put(n,date);}
        }
        for(int n=1;n<=count;n++){if(!ordered.containsKey(n))complete=false;else dates.put(ordered.get(n));}
        if(complete)return new JSONObject().put("rules",RULES).put("episoden",count).put("termindaten",dates).put("announcementOnly",false);
        if(!start.isEmpty())try{ArchiveCodec.dateShift(start,0);}catch(Exception invalid){start="";}
        return new JSONObject().put("rules",RULES).put("episoden",count).put("termindaten",new JSONArray()).put("announcementOnly",true).put("announcedStart",start);
    }
}

package de.serkal.android.preview;

import org.json.*;

/** A season start is an announcement, not a replacement for unknown episode dates. */
final class SeasonInput {
    static JSONObject schedule(JSONObject tv, JSONObject season, int number) throws Exception {
        JSONArray episodes=season.optJSONArray("episodes"), dates=new JSONArray();
        int count=episodes==null?0:episodes.length();
        String start=SeasonAnnouncements.date(season,"air_date");
        JSONArray seasons=tv.optJSONArray("seasons");
        if(seasons!=null)for(int i=0;i<seasons.length();i++){
            JSONObject s=seasons.getJSONObject(i);if(s.optInt("season_number")!=number)continue;
            count=Math.max(count,s.optInt("episode_count"));
            if(start.isEmpty())start=SeasonAnnouncements.date(s,"air_date");
        }
        boolean complete=count>0 && episodes!=null && episodes.length()==count;
        if(episodes!=null)for(int i=0;i<episodes.length();i++){
            JSONObject e=episodes.getJSONObject(i);String date=SeasonAnnouncements.date(e,"air_date");
            if(date.isEmpty())complete=false;
            else {ArchiveCodec.dateShift(date,0);dates.put(date);if(start.isEmpty() && e.optInt("episode_number",i+1)==1)start=date;}
        }
        if(complete)return new JSONObject().put("episoden",count).put("termindaten",dates).put("announcementOnly",false);
        if(start.isEmpty())throw new Exception("DATES");
        ArchiveCodec.dateShift(start,0);
        return new JSONObject().put("episoden",count).put("termindaten",new JSONArray()).put("announcementOnly",true).put("announcedStart",start);
    }
}

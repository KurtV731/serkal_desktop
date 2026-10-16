package de.serkal.android.preview;
import org.json.*;
import java.util.*;
import java.text.Collator;

/** Same ordering as Desktop: no-date first, then start descending, season descending, title. */
final class ArchiveOrder {
    static String title(JSONObject e,boolean en){String translated=e.optString(en?"titleEN":"titleDE");return translated.isEmpty()?e.optString("title"):translated;}
    static String start(JSONObject e){JSONArray dates=e.optJSONArray("dates");String date=dates==null?"":dates.optString(0);return date.matches("\\d{4}-\\d{2}-\\d{2}")?date:"";}
    static int season(JSONObject e){return ArchiveCodec.number(e.optString("seasonLabel").replaceAll("\\D",""));}
    static String label(JSONObject e,boolean en){return title(e,en)+" ("+e.optString("year")+") ["+e.optString("seasonLabel")+"]";}
    static List<JSONObject> sorted(JSONArray entries,boolean date,boolean en){
        List<JSONObject> result=new ArrayList<>();for(int i=0;i<entries.length();i++){JSONObject e=entries.optJSONObject(i);if(e!=null)result.add(e);}
        Collator collator=Collator.getInstance(en?Locale.ENGLISH:Locale.GERMAN);collator.setStrength(Collator.PRIMARY);
        result.sort((a,b)->{
            if(date){String x=start(a),y=start(b);if(x.isEmpty()!=y.isEmpty())return x.isEmpty()?-1:1;
                int dates=y.compareTo(x);if(dates!=0)return dates;
                int seasons=Integer.compare(season(b),season(a));if(seasons!=0)return seasons;}
            return collator.compare(label(a,en),label(b,en));
        });return result;
    }
    static int status(JSONObject e,String today){
        if(e.optInt("seen")==1)return 4;
        JSONArray dates=e.optJSONArray("dates");if(dates==null || dates.length()==0)return 0;
        if(dates.optString(0).compareTo(today)>0)return 1;
        return dates.optString(dates.length()-1).compareTo(today)>=0?2:3;
    }
    static String icon(int status){return status==4?"✓":status==3?"✓":status==1?"◷":status==2?"●":"○";}
}

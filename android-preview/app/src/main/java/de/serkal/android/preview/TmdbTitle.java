package de.serkal.android.preview;
import org.json.*;
import java.util.*;
/** Language-aware title choice shared by search/detail and maintenance. */
final class TmdbTitle {
    static String resolve(JSONObject detail,boolean english) {
        String original=detail.optString("original_name").trim(), lang=english?"en":"de";
        if(english && detail.optString("original_language").equals("en") && !original.isEmpty())return original;
        String[] countries=english?new String[]{"US","GB","AU","CA"}:new String[]{"DE","AT","CH"};
        JSONObject translations=detail.optJSONObject("translations");JSONArray list=translations==null?null:translations.optJSONArray("translations");
        String translated="";int best=999;
        if(list!=null)for(int i=0;i<list.length();i++){
            JSONObject item=list.optJSONObject(i);if(item==null || !lang.equals(item.optString("iso_639_1")))continue;
            JSONObject data=item.optJSONObject("data");String name=data==null?"":data.optString("name").trim();if(name.isEmpty())continue;
            int rank=Arrays.asList(countries).indexOf(item.optString("iso_3166_1"));if(rank<0)rank=998;
            if(rank<best){translated=name;best=rank;}
        }
        if(!translated.isEmpty())return translated;
        String name=detail.optString("name").trim();
        if(!name.isEmpty() && (!name.equalsIgnoreCase(original) || lang.equals(detail.optString("original_language"))))return name;
        JSONObject alternatives=detail.optJSONObject("alternative_titles");JSONArray titles=alternatives==null?null:alternatives.optJSONArray("results");
        if(titles!=null)for(String country:countries)for(int i=0;i<titles.length();i++){
            JSONObject item=titles.optJSONObject(i);if(item!=null && country.equals(item.optString("iso_3166_1")) && !item.optString("title").trim().isEmpty())return item.optString("title").trim();
        }
        return !original.isEmpty()?original:!name.isEmpty()?name:"—";
    }
}

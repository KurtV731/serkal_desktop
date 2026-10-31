package de.serkal.android.preview;
import org.json.*;
import java.util.*;

final class CalendarScope {
    static String group(JSONObject event){JSONObject p=event.optJSONObject("extendedProperties");p=p==null?null:p.optJSONObject("private");if(p==null)return "";return p.optString("serkal").equals("announcement")?p.optString("announcementKey"):p.optString("tmdbId")+":"+p.optString("season");}
    static final class Projection {
        final String target;final Map<String,String> groups=new TreeMap<>();
        Projection(JSONObject record)throws Exception{
            JSONObject c=record.getJSONObject("calendar");target=c.optString("mode")+"|"+c.optString("id");
            if(!c.optString("mode").equals("google"))return;
            Map<String,List<String>> values=new TreeMap<>();List<JSONObject> events=CalendarCopy.desired(record);events.addAll(SeasonAnnouncements.desired(ArchiveCodec.entries(record)));
            for(JSONObject e:events)values.computeIfAbsent(group(e),k->new ArrayList<>()).add(CalendarCopy.signature(e));
            for(Map.Entry<String,List<String>> e:values.entrySet()){Collections.sort(e.getValue());groups.put(e.getKey(),e.getValue().toString());}
        }
    }
    // null is full target reconciliation; empty is no work.
    static Set<String> changes(Projection before,Projection after){
        if(before==null||!before.target.equals(after.target))return null;
        Set<String> keys=new TreeSet<>(before.groups.keySet());keys.addAll(after.groups.keySet());
        keys.removeIf(k->Objects.equals(before.groups.get(k),after.groups.get(k)));return keys;
    }
    static Set<String> union(Set<String> a,Set<String> b){if(a==null||b==null)return null;Set<String> result=new TreeSet<>(a);result.addAll(b);return result;}
    static Set<String> read(JSONArray array)throws Exception{
        if(array==null)return null;Set<String> result=new TreeSet<>();for(int i=0;i<array.length();i++){String k=array.getString(i);if(!k.matches("\\d+:S\\d{2,3}"))return null;result.add(k);}return result;
    }
}

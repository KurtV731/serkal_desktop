package de.serkal.android.preview;
import org.json.*;
final class WatchProviders {
    static JSONObject normalize(JSONObject data,String country,String checkedAt) throws Exception {
        if(!country.matches("[A-Z]{2}"))throw new Exception("PROVIDER_COUNTRY_INVALID");
        JSONObject results=data.optJSONObject("results"),r=results==null?null:results.optJSONObject(country);JSONArray offers=new JSONArray();
        for(String type:new String[]{"flatrate","free","ads","rent","buy"}){JSONArray list=r==null?null:r.optJSONArray(type);if(list==null)continue;
            for(int i=0;i<list.length();i++){JSONObject p=list.getJSONObject(i);if(p.optInt("provider_id")>0 && !p.optString("provider_name").trim().isEmpty())offers.put(new JSONObject().put("id",p.getInt("provider_id")).put("name",p.getString("provider_name")).put("type",type));}}
        String link=r==null?"":r.optString("link");if(!link.startsWith("https://www.themoviedb.org/"))link="";
        return new JSONObject().put("country",country).put("checkedAt",checkedAt).put("source","JustWatch via TMDB").put("link",link).put("offers",offers);
    }
    static String text(JSONObject p,String note,boolean en){
        java.util.regex.Matcher m=java.util.regex.Pattern.compile("(?im)^(?:Anbieter|Provider)\\s*:\\s*(.*)$").matcher(note);
        if(m.find() && !m.group(1).trim().isEmpty())return (en?"Provider (manual): ":"Anbieter (manuell): ")+m.group(1).trim();
        if(p==null)return "";StringBuilder b=new StringBuilder(en?"Providers":"Anbieter");b.append(" [").append(p.optString("country")).append("]: ");JSONArray offers=p.optJSONArray("offers");
        if(offers==null || offers.length()==0)b.append(en?"No offers reported":"Keine Angebote gemeldet");
        else for(int i=0;i<offers.length();i++){JSONObject o=offers.optJSONObject(i);if(i>0)b.append(", ");String type=o.optString("type");String label=type;
            if(type.equals("flatrate"))label=en?"subscription":"Abo";if(type.equals("free"))label=en?"free":"kostenlos";if(type.equals("ads"))label=en?"ads":"Werbung";if(type.equals("rent"))label=en?"rent":"Leihe";if(type.equals("buy"))label=en?"buy":"Kauf";
            b.append(o.optString("name")).append(" (").append(label).append(")");}
        String checked=p.optString("checkedAt");b.append(" · ").append(checked.length()>=10?checked.substring(0,10):checked).append(" · JustWatch via TMDB");if(!p.optString("link").isEmpty())b.append('\n').append(p.optString("link"));return b.toString();
    }
}

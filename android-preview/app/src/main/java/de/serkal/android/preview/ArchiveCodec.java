package de.serkal.android.preview;

import org.json.JSONArray;
import org.json.JSONObject;
import java.util.*;
import java.util.regex.*;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.net.URLDecoder;
import java.net.URLEncoder;
import java.text.SimpleDateFormat;

/** Full TXT files are the portable truth; display rows are derived, never used as backups. */
final class ArchiveCodec {
    static final String PREFIX="serkal-copy-v2-";
    static final int LIMIT=64*1024*1024;
    static final String UUID="[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}";
    static String join(String delimiter,String... values){StringBuilder result=new StringBuilder();boolean first=true;for(String value:values){if(!first)result.append(delimiter);first=false;result.append(value);}return result.toString();}
    static String join(String delimiter,List<String> values){return join(delimiter,values.toArray(new String[0]));}
    static String hash(String text) throws Exception {return hash("SHA-256",text);}
    static String hash(String algorithm,String text) throws Exception {
        byte[] bytes=MessageDigest.getInstance(algorithm).digest(text.getBytes(StandardCharsets.UTF_8));
        StringBuilder out=new StringBuilder();for(byte b:bytes)out.append(String.format(Locale.ROOT,"%02x",b&255));return out.toString();
    }
    static boolean safeName(String name){return name.length()<=240 && name.matches("[^\\\\/:*?\"<>|\\x00-\\x1f]+\\.[tT][xX][tT]") &&
        !name.toLowerCase(Locale.ROOT).matches("^(!!serkal_log_|fanal_|\\.|con\\.|prn\\.|aux\\.|nul\\.|com[1-9]\\.|lpt[1-9]\\.).*");}
    static JSONObject validate(JSONObject r,String owner) throws Exception {
        if(r.optInt("schema")!=2 || !owner.equals(r.optString("owner")) || !r.optString("revision").matches(UUID) ||
            !(r.optString("parent").isEmpty() || r.optString("parent").matches(UUID)) || r.optString("parent").equals(r.optString("revision")) ||
            !r.optString("generatedAt").matches("\\d{4}-\\d{2}-\\d{2}T.*Z") || r.optJSONArray("files")==null || r.getJSONArray("files").length()>20000)throw new Exception("COPY_INVALID");
        Set<String> names=new HashSet<>();long size=0;
        for(int i=0;i<r.getJSONArray("files").length();i++){
            JSONObject f=r.getJSONArray("files").getJSONObject(i);String name=f.getString("name"),content=f.getString("content");
            if(!safeName(name) || content.indexOf('\0')>=0 || !hash(content).equals(f.optString("sha256")) || !names.add(name.toLowerCase(Locale.ROOT)))throw new Exception("COPY_INVALID");
            size+=content.getBytes(StandardCharsets.UTF_8).length;if(size>LIMIT)throw new Exception("COPY_TOO_LARGE");
        }
        JSONObject cal=r.getJSONObject("calendar");if(!Arrays.asList("","google","ics").contains(cal.getString("mode")) || cal.getString("id").length()>512)throw new Exception("COPY_INVALID");
        return r;
    }
    static LinkedHashMap<String,String> fields(String line){
        LinkedHashMap<String,String> result=new LinkedHashMap<>();String[] parts=line.trim().split("[;|]");
        result.put("season",parts[0].trim());for(int i=1;i<parts.length;i++){int at=parts[i].indexOf('=');if(at>0)result.put(parts[i].substring(0,at).trim(),parts[i].substring(at+1).trim());}return result;
    }
    static String decode(String text){try{return URLDecoder.decode(text,"UTF-8");}catch(Exception e){return text;}}
    static String encode(String text) throws Exception{return URLEncoder.encode(text,"UTF-8").replace("+","%20");}
    static String line(Map<String,String> fields){StringBuilder s=new StringBuilder(fields.getOrDefault("season",""));for(Map.Entry<String,String> e:fields.entrySet())if(!e.getKey().equals("season"))s.append("; ").append(e.getKey()).append('=').append(e.getValue());return s.toString();}
    static int number(String text){try{return Integer.parseInt(text);}catch(Exception e){return 0;}}
    static String dateShift(String iso,int days) throws Exception {
        SimpleDateFormat format=new SimpleDateFormat("yyyy-MM-dd",Locale.ROOT);format.setLenient(false);format.setTimeZone(TimeZone.getTimeZone("UTC"));
        Calendar date=Calendar.getInstance(TimeZone.getTimeZone("UTC"),Locale.ROOT);date.setTime(format.parse(iso));date.add(Calendar.DAY_OF_MONTH,days);return format.format(date.getTime());
    }
    static JSONArray dates(String compact,String anchor) throws Exception {
        JSONArray out=new JSONArray();int year=anchor.length()>=4?number(anchor.substring(0,4)):Calendar.getInstance().get(Calendar.YEAR),lastMonth=0;
        for(String token:compact.split(",")){
            token=token.trim();if(token.isEmpty())continue;
            if(token.matches("\\d{4}-\\d{2}-\\d{2}")){dateShift(token,0);out.put(token);lastMonth=number(token.substring(5,7));continue;}
            Matcher m=Pattern.compile("(\\d{1,2})\\.(\\d{1,2})\\.?").matcher(token);if(!m.matches())throw new Exception("COPY_INVALID_DATE");
            int month=number(m.group(2));if(lastMonth>0 && month<lastMonth)year++;lastMonth=month;
            String date=String.format(Locale.ROOT,"%04d-%02d-%02d",year,month,number(m.group(1)));dateShift(date,0);out.put(date);
        }return out;
    }
    static JSONArray entries(JSONObject record) throws Exception {
        JSONArray out=new JSONArray(),files=record.getJSONArray("files");
        for(int i=0;i<files.length();i++){
            JSONObject file=files.getJSONObject(i);String base=file.getString("name").replaceFirst("(?i)\\.txt$","");
            Matcher title=Pattern.compile("^(.*) \\((\\d{4})\\)$").matcher(base);String name=base,year="";if(title.matches()){name=title.group(1);year=title.group(2);}
            for(String raw:file.getString("content").split("\\r?\\n")) {
                if(!raw.trim().matches("(?i)^S\\d{1,3}(\\b|;|\\|).*$"))continue;
                Map<String,String> f=fields(raw);String anchor=f.getOrDefault("startOriginal",f.getOrDefault("start",""));
                JSONArray original=dates(f.getOrDefault("dates",""),anchor),de=dates(f.getOrDefault("datesDE",""),f.getOrDefault("startDE",anchor));
                JSONArray active=de.length()>0?de:original;if(active.length()==0 && !f.getOrDefault("startDE",anchor).isEmpty())active.put(f.getOrDefault("startDE",anchor));
                out.put(new JSONObject().put("title",name).put("year",year).put("fileName",file.getString("name"))
                    .put("seasonLabel",f.get("season").toUpperCase(Locale.ROOT)).put("tmdbId",number(f.getOrDefault("tmdb","0")))
                    .put("eps",number(f.getOrDefault("eps","0"))).put("dates",active).put("datesOriginal",original).put("datesDE",de)
                    .put("startOriginal",anchor).put("startDE",f.getOrDefault("startDE",""))
                    .put("descDE",decode(f.getOrDefault("descDE",f.getOrDefault("ov_de",""))))
                    .put("descEN",decode(f.getOrDefault("descEN",f.getOrDefault("ov_en",""))))
                    .put("note",decode(f.getOrDefault("note",""))).put("manualFlags",number(f.getOrDefault("manualFlags","0")))
                    .put("seen",number(f.getOrDefault("seen",f.getOrDefault("buttonPressed","0")))));
            }
        }return out;
    }
    static String compact(JSONArray values) throws Exception {List<String> dates=new ArrayList<>();for(int i=0;i<values.length();i++){String date=values.getString(i);dateShift(date,0);dates.add(date.substring(8,10)+"."+date.substring(5,7)+".");}return join(",",dates);}
    static void note(LinkedHashMap<String,String> f,String note) throws Exception {
        String anchor=f.getOrDefault("startOriginal",f.getOrDefault("start",""));JSONArray original=dates(f.getOrDefault("dates",""),anchor),de=new JSONArray();String offset="",terms="";
        for(String text:note.split("\\r?\\n")){
            Matcher o=Pattern.compile("(?i)^(?:offset(?:\\s*de)?|termin\\s*offset|de\\s*offset|offset\\s*deutsch)\\s*:?\\s*([+-]?\\d+)\\s*d?\\s*$").matcher(text.trim());
            if(o.matches())offset=o.group(1);
            Matcher t=Pattern.compile("(?i)^termine(?:\\s*de)?\\s*:\\s*(.+)$").matcher(text.trim());if(t.matches())terms=t.group(1);
        }
        if(!terms.isEmpty())de=dates(terms,anchor);else if(!offset.isEmpty())for(int i=0;i<original.length();i++)de.put(dateShift(original.getString(i),number(offset)));
        int flags=number(f.getOrDefault("manualFlags","0"))|128;
        if(de.length()>0){f.put("datesDE",compact(de));f.put("startDE",de.getString(0));f.put("offsetDE",offset);flags|=24;}
        else if(!f.getOrDefault("offsetDE","").isEmpty()){f.put("datesDE","");f.put("startDE","");f.put("offsetDE","");flags&=~24;}
        f.put("note",encode(note));f.put("manualFlags",String.valueOf(flags));
    }
    static JSONObject edit(JSONObject original,String action,JSONObject payload) throws Exception {
        JSONObject r=new JSONObject(original.toString());JSONArray files=r.getJSONArray("files");int id=payload.getInt("tmdbId");
        if(id<=0)throw new Exception("COPY_INVALID");String season=action.equals("insert")?String.format(Locale.ROOT,"S%02d",payload.getInt("staffelNummer")):payload.getString("seasonLabel");
        if(!Arrays.asList("insert","notes","delete").contains(action))throw new Exception("COPY_INVALID");
        boolean found=false;JSONArray result=new JSONArray();String target="";
        for(int i=0;i<files.length();i++){
            JSONObject file=files.getJSONObject(i);StringBuilder content=new StringBuilder();boolean fileHas=false;
            for(String raw:file.getString("content").split("\\r?\\n",-1)) {
                LinkedHashMap<String,String> f=fields(raw);boolean matches=number(f.getOrDefault("tmdb","0"))==id;
                if(matches)fileHas=true;
                if(matches && action.equals("delete")){found=true;continue;}
                if(matches && f.getOrDefault("season","").equalsIgnoreCase(season)) {
                    found=true;
                    if(action.equals("notes")){note(f,payload.getString("note"));raw=line(f);}
                    if(action.equals("insert")){f.put("eps",String.valueOf(payload.getInt("episoden")));f.put("dates",compact(payload.getJSONArray("termindaten")));f.put("startOriginal",payload.getJSONArray("termindaten").getString(0));
                        f.put("descDE",encode(payload.optString("descDE")));f.put("descEN",encode(payload.optString("descEN")));note(f,decode(f.getOrDefault("note","")));raw=line(f);}
                }
                content.append(raw).append('\n');
            }
            if(fileHas && target.isEmpty())target=file.getString("name");
            String text=fileHas ? content.toString().replaceFirst("\\n+$", "")+"\n" : file.getString("content");
            if(!text.trim().isEmpty())result.put(new JSONObject().put("name",file.getString("name")).put("content",text).put("sha256",hash(text)));
        }
        if(action.equals("insert") && !found) {
            if(target.isEmpty())target=payload.getString("titel").replaceAll("[\\\\/:*?\"<>|]","").trim()+" ("+payload.getString("jahr")+").txt";
            if(!safeName(target))throw new Exception("COPY_INVALID");
            LinkedHashMap<String,String> f=new LinkedHashMap<>();f.put("season",season);f.put("startOriginal",payload.getJSONArray("termindaten").getString(0));
            f.put("eps",String.valueOf(payload.getInt("episoden")));f.put("tmdb",String.valueOf(id));f.put("titleOriginal",encode(payload.getString("titel")));
            f.put("dates",compact(payload.getJSONArray("termindaten")));f.put("descDE",encode(payload.optString("descDE")));f.put("descEN",encode(payload.optString("descEN")));f.put("flags","32");
            boolean appended=false;for(int i=0;i<result.length();i++){JSONObject file=result.getJSONObject(i);if(file.getString("name").equals(target)){String text=file.getString("content")+line(f)+"\n";file.put("content",text).put("sha256",hash(text));appended=true;break;}}
            if(!appended){String text=line(f)+"\n";result.put(new JSONObject().put("name",target).put("content",text).put("sha256",hash(text)));}
        } else if(!found && !action.equals("delete"))throw new Exception("COPY_ENTRY_MISSING");
        r.put("files",result);return r;
    }
}

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
    static final int RELEASE=BuildConfig.SERKAL_RELEASE;
    static void assertRelease(Object value) throws Exception {
        if(value!=null && value!=JSONObject.NULL && !String.valueOf(RELEASE).equals(String.valueOf(value)))throw new Exception("COPY_VERSION_MISMATCH");
    }
    static void assertReadableRelease(Object value) throws Exception {
        if(value==null || value==JSONObject.NULL)return;
        int number;try{number=Integer.parseInt(String.valueOf(value));}catch(Exception e){throw new Exception("COPY_VERSION_MISMATCH");}
        if(number<1 || number>RELEASE || !String.valueOf(number).equals(String.valueOf(value)))throw new Exception("COPY_VERSION_MISMATCH");
    }
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
        assertReadableRelease(r.opt("releaseNumber"));
        if(r.optInt("schema")!=2 || !owner.equals(r.optString("owner")) || !r.optString("revision").matches(UUID) ||
            !(r.optString("parent").isEmpty() || r.optString("parent").matches(UUID)) || r.optString("parent").equals(r.optString("revision")) ||
            (!r.optString("authorityId").isEmpty() && !r.optString("authorityId").matches(UUID)) ||
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
            Matcher full=Pattern.compile("(\\d{1,2})\\.(\\d{1,2})\\.(\\d{4})\\.?").matcher(token);
            if(full.matches()){year=number(full.group(3));lastMonth=number(full.group(2));String date=String.format(Locale.ROOT,"%04d-%02d-%02d",year,lastMonth,number(full.group(1)));dateShift(date,0);out.put(date);continue;}
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
                    .put("announcements",announcements(f.getOrDefault("announcements","")))
                    .put("announcementOnly",f.getOrDefault("announcementOnly","0").equals("1"))
                    .put("calendarLanguage",f.getOrDefault("calendarLanguage","de"))
                    .put("watchProviders",provider(f.getOrDefault("watchProviders","")))
                    .put("titleDE",decode(f.getOrDefault("titleDE",""))).put("titleEN",decode(f.getOrDefault("titleEN","")))
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
        if(!Arrays.asList("insert","notes","delete","seen").contains(action))throw new Exception("COPY_INVALID");
        boolean provisional=action.equals("insert") && payload.optBoolean("announcementOnly");
        if(action.equals("insert"))for(int fi=0;fi<files.length();fi++)for(String raw:files.getJSONObject(fi).getString("content").split("\\r?\\n")){
            Map<String,String> old=fields(raw);
            if(number(old.getOrDefault("tmdb","0"))!=id || !old.getOrDefault("season","").equalsIgnoreCase(season))continue;
            if((number(old.getOrDefault("manualFlags","0"))&56)!=0 || (provisional && !old.getOrDefault("announcementOnly","0").equals("1")) || (!provisional && payload.getJSONArray("termindaten").length()<number(old.getOrDefault("eps","0"))))return r;
        }
        JSONArray announcementList=new JSONArray();
        if(provisional){
            for(int i=0;i<files.length();i++)for(String raw:files.getJSONObject(i).getString("content").split("\\r?\\n")){
                Map<String,String> f=fields(raw);if(number(f.getOrDefault("tmdb","0"))!=id)continue;
                JSONArray list=announcements(f.getOrDefault("announcements",""));for(int j=0;j<list.length();j++){
                    JSONObject a=list.getJSONObject(j);boolean exists=false;for(int k=0;k<announcementList.length();k++)if(announcementList.getJSONObject(k).optInt("season")==a.optInt("season"))exists=true;
                    if(!exists)announcementList.put(a);
                }
            }
            String today=new SimpleDateFormat("yyyy-MM-dd",Locale.ROOT).format(new Date());
            SeasonAnnouncements.update(announcementList,payload.getInt("staffelNummer"),payload.getString("announcedStart"),payload.getString("titel"),payload.optString("calendarLanguage").equals("en"),today);
            for(int i=0;i<announcementList.length();i++)if(announcementList.getJSONObject(i).optInt("season")==payload.getInt("staffelNummer"))announcementList.getJSONObject(i).put("episodeCount",Math.max(announcementList.getJSONObject(i).optInt("episodeCount"),payload.optInt("episoden")));
        }
        boolean found=false;JSONArray result=new JSONArray();String target="";
        for(int i=0;i<files.length();i++){
            JSONObject file=files.getJSONObject(i);StringBuilder content=new StringBuilder();boolean fileHas=false;
            for(String raw:file.getString("content").split("\\r?\\n",-1)) {
                LinkedHashMap<String,String> f=fields(raw);boolean matches=number(f.getOrDefault("tmdb","0"))==id;
                if(matches){fileHas=true;if(provisional){f.put("announcements",encode(announcementList.toString()));raw=line(f);}}
                if(matches && action.equals("delete")){found=true;continue;}
                if(matches && f.getOrDefault("season","").equalsIgnoreCase(season)) {
                    found=true;
                    if(action.equals("seen")){f.put("seen",payload.optBoolean("seen")?"1":"0");raw=line(f);}
                    if(action.equals("notes")){note(f,payload.getString("note"));raw=line(f);}
                    if(action.equals("insert") && (!provisional || f.getOrDefault("announcementOnly","0").equals("1"))){
                        f.put("announcementOnly",provisional?"1":"0");f.put("eps",String.valueOf(provisional?Math.max(payload.optInt("episoden"),number(f.getOrDefault("eps","0"))):payload.getInt("episoden")));f.put("dates",compact(payload.getJSONArray("termindaten")));f.put("startOriginal",provisional?(payload.optString("announcedStart").isEmpty()?f.getOrDefault("startOriginal",""):payload.getString("announcedStart")):payload.getJSONArray("termindaten").getString(0));
                        f.put("descDE",encode(payload.optString("descDE")));f.put("descEN",encode(payload.optString("descEN")));
                        for(String k:new String[]{"titleDE","titleEN"})if(payload.has(k) && (number(f.getOrDefault("manualFlags","0"))&1)==0)f.put(k,encode(payload.optString(k)));
                        if(payload.has("calendarLanguage"))f.put("calendarLanguage",payload.optString("calendarLanguage"));note(f,decode(f.getOrDefault("note","")));raw=line(f);}
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
            LinkedHashMap<String,String> f=new LinkedHashMap<>();f.put("season",season);f.put("startOriginal",provisional?payload.getString("announcedStart"):payload.getJSONArray("termindaten").getString(0));f.put("announcementOnly",provisional?"1":"0");if(provisional)f.put("announcements",encode(announcementList.toString()));
            f.put("eps",String.valueOf(payload.getInt("episoden")));f.put("tmdb",String.valueOf(id));f.put("titleOriginal",encode(payload.getString("titel")));
            f.put("dates",compact(payload.getJSONArray("termindaten")));f.put("descDE",encode(payload.optString("descDE")));f.put("descEN",encode(payload.optString("descEN")));
                        for(String k:new String[]{"titleDE","titleEN"})if(payload.has(k) && (number(f.getOrDefault("manualFlags","0"))&1)==0)f.put(k,encode(payload.optString(k)));
                        if(payload.has("calendarLanguage"))f.put("calendarLanguage",payload.optString("calendarLanguage"));f.put("flags","32");
            boolean appended=false;for(int i=0;i<result.length();i++){JSONObject file=result.getJSONObject(i);if(file.getString("name").equals(target)){String text=file.getString("content")+line(f)+"\n";file.put("content",text).put("sha256",hash(text));appended=true;break;}}
            if(!appended){String text=line(f)+"\n";result.put(new JSONObject().put("name",target).put("content",text).put("sha256",hash(text)));}
        } else if(!found && !action.equals("delete"))throw new Exception("COPY_ENTRY_MISSING");
        r.put("files",result);return r;
    }
    static JSONArray announcements(String raw){try{return new JSONArray(decode(raw));}catch(Exception ignored){return new JSONArray();}}
    static JSONObject provider(String raw){try{return new JSONObject(decode(raw));}catch(Exception ignored){return null;}}
    static JSONObject maintenance(JSONObject original,JSONArray patches) throws Exception {
        JSONObject record=new JSONObject(original.toString());JSONArray files=record.getJSONArray("files");
        for(int i=0;i<files.length();i++){JSONObject file=files.getJSONObject(i);String[] lines=file.getString("content").split("\\r?\\n",-1);boolean changed=false;
            for(int j=0;j<lines.length;j++){LinkedHashMap<String,String> f=fields(lines[j]);
                for(int k=0;k<patches.length();k++){JSONObject p=patches.getJSONObject(k);if(number(f.getOrDefault("tmdb","0"))!=p.getInt("tmdbId") || !f.getOrDefault("season","").equals(p.getString("seasonLabel")))continue;
                    if(p.has("watchProviders"))f.put("watchProviders",encode(p.getJSONObject("watchProviders").toString()));
                    for(String name:new String[]{"titleDE","titleEN"})if(p.has(name) && (number(f.getOrDefault("manualFlags","0"))&1)==0)f.put(name,encode(p.getString(name)));
                    if(p.has("announcements")){
                        JSONArray list=p.getJSONArray("announcements");f.put("announcements",encode(list.toString()));
                        if(f.getOrDefault("announcementOnly","0").equals("1"))for(int ai=0;ai<list.length();ai++){
                            JSONObject a=list.getJSONObject(ai);if(a.optInt("season")==number(f.getOrDefault("season","").replaceAll("\\D","")) && !SeasonAnnouncements.date(a,"date").isEmpty())f.put("startOriginal",a.getString("date"));
                        }
                    }
                    if(p.has("calendarLanguage"))f.put("calendarLanguage",p.getString("calendarLanguage"));
                    if(p.has("termindaten") && (number(f.getOrDefault("manualFlags","0"))&56)==0){
                        LinkedHashMap<String,String> beforeDates=new LinkedHashMap<>(f);
                        try{JSONArray dates=p.getJSONArray("termindaten");f.put("announcementOnly","0");f.put("dates",compact(dates));f.put("startOriginal",dates.getString(0));f.put("eps",String.valueOf(p.getInt("episoden")));note(f,decode(f.getOrDefault("note","")));}
                        catch(Exception invalid){if(!(invalid instanceof java.text.ParseException) && !"COPY_INVALID_DATE".equals(invalid.getMessage()))throw invalid;f=beforeDates;p.put("applyError","COPY_INVALID_DATE").put("fileName",file.getString("name"));}
                    }
                    lines[j]=line(f);changed=true;
                }
            }if(changed){String text=join("\n",lines);file.put("content",text).put("sha256",hash(text));}
        }
        for(int k=0;k<patches.length();k++){JSONObject p=patches.getJSONObject(k);if(p.has("insertPayload"))record=edit(record,"insert",p.getJSONObject("insertPayload"));}
        return record;
    }
}



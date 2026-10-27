package de.serkal.android.preview;
import org.json.*;
import java.util.*;
class SessionArchiveClient extends ArchiveCopyClient {
    static final String NAME="serkal-session-v1.json";
    boolean imported;
    SessionArchiveClient(String token){super(token);}
    private JSONObject latest() throws Exception {
        JSONObject newest=null;String page="";
        do{JSONObject r=get("https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&pageSize=1000&fields="+esc("nextPageToken,files(id,modifiedTime)")+"&q="+esc("name = '"+NAME+"' and trashed = false")+"&pageToken="+esc(page));
            JSONArray files=r.getJSONArray("files");for(int i=0;i<files.length();i++){JSONObject f=files.getJSONObject(i);if(newest==null||f.optString("modifiedTime").compareTo(newest.optString("modifiedTime"))>0||f.optString("modifiedTime").equals(newest.optString("modifiedTime"))&&f.getString("id").compareTo(newest.getString("id"))>0)newest=f;}
            page=r.optString("nextPageToken");
        }while(!page.isEmpty());return newest;
    }
    JSONObject loadSession(String owner) throws Exception {
        JSONObject f=latest();if(f!=null)return ArchiveCodec.validate(get("https://www.googleapis.com/drive/v3/files/"+esc(f.getString("id"))+"?alt=media"),owner);
        // One-time import of the last saved old snapshot, with no history-chain requirements.
        List<JSONObject> old=list(ArchiveCodec.PREFIX);old.sort((a,b)->{int time=b.optString("modifiedTime").compareTo(a.optString("modifiedTime"));return time!=0?time:b.optString("id").compareTo(a.optString("id"));});
        JSONObject chosen=old.isEmpty()?null:ArchiveCodec.validate(get("https://www.googleapis.com/drive/v3/files/"+esc(old.get(0).getString("id"))+"?alt=media"),owner);
        imported=chosen!=null;return chosen;
    }
    void saveSession(JSONObject record) throws Exception {
        ArchiveCodec.validate(record,record.getString("owner"));JSONObject f=latest();
        if(f!=null){request("https://www.googleapis.com/upload/drive/v3/files/"+esc(f.getString("id"))+"?uploadType=media&fields=id","PATCH",record.toString(),"application/json");return;}
        String boundary="serkal-session-v1";
        String body="--"+boundary+"\r\nContent-Type: application/json\r\n\r\n"+new JSONObject().put("name",NAME).put("mimeType","application/json").put("parents",new JSONArray().put("appDataFolder"))+
            "\r\n--"+boundary+"\r\nContent-Type: application/json\r\n\r\n"+record+"\r\n--"+boundary+"--\r\n";
        request("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id","POST",body,"multipart/related; boundary="+boundary);
    }
    void updateCalendar(JSONObject record) throws Exception {
        JSONObject calendar=record.getJSONObject("calendar");if(!calendar.optString("mode").equals("google"))return;
        if(calendar.optString("id").isEmpty()){
            if(CalendarCopy.desired(record).isEmpty()&&SeasonAnnouncements.desired(ArchiveCodec.entries(record)).isEmpty())return;
            String page="",found="";
            do{JSONObject r=get("https://www.googleapis.com/calendar/v3/users/me/calendarList?maxResults=250&showHidden=true&pageToken="+esc(page));JSONArray items=r.optJSONArray("items");
                if(items!=null)for(int i=0;i<items.length();i++){JSONObject item=items.getJSONObject(i);if("SerKal".equals(item.optString("summary"))&&"owner".equals(item.optString("accessRole"))){found=item.getString("id");break;}}
                page=r.optString("nextPageToken");
            }while(found.isEmpty()&&!page.isEmpty());
            if(found.isEmpty())found=request("https://www.googleapis.com/calendar/v3/calendars","POST",new JSONObject().put("summary","SerKal").put("description","SerKal session archive").toString(),"application/json").getString("id");
            calendar.put("id",found);
        }
        CalendarCopy.synchronize(this,record,true);
    }
}

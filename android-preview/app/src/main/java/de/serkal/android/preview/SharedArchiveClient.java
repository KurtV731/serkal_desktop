package de.serkal.android.preview;

import org.json.JSONArray;
import org.json.JSONObject;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.io.InputStream;
import java.io.ByteArrayOutputStream;

final class SharedArchiveClient {
    static final String NAME = "serkal-archive-v1.json";
    private final String token;
    SharedArchiveClient(String token) { this.token=token; }
    private JSONObject request(String url) throws Exception { return request(url,"GET",null,null); }
    private JSONObject request(String url,String method,String body,String contentType) throws Exception {
        HttpURLConnection c=(HttpURLConnection)new URL(url).openConnection();
        c.setConnectTimeout(10000); c.setReadTimeout(15000); c.setRequestMethod(method); c.setRequestProperty("Authorization","Bearer "+token);
        if(body!=null) { c.setDoOutput(true); c.setRequestProperty("Content-Type",contentType); try(java.io.OutputStream out=c.getOutputStream()){out.write(body.getBytes(java.nio.charset.StandardCharsets.UTF_8));} }
        try {
            int status=c.getResponseCode(); if(status!=200 && status!=201) throw new Exception("GOOGLE_HTTP_"+status);
            try(InputStream in=c.getInputStream(); ByteArrayOutputStream out=new ByteArrayOutputStream()) {
                byte[] buffer=new byte[8192]; int n;
                while((n=in.read(buffer))!=-1) {
                    out.write(buffer,0,n); if(out.size()>8*1024*1024) throw new Exception("SHARED_ARCHIVE_TOO_LARGE");
                }
                return new JSONObject(out.toString("UTF-8"));
            }
        } finally { c.disconnect(); }
    }
    static JSONObject validate(JSONObject record,String owner) throws Exception {
        JSONArray entries=record.optJSONArray("entries");
        if(record.optInt("schema")!=1 || !owner.equals(record.optString("owner")) ||
            record.optString("publisher").isEmpty() || !record.optString("generatedAt").matches("\\d{4}-\\d{2}-\\d{2}T.*Z") ||
            entries==null || entries.length()>20000) throw new Exception("SHARED_ARCHIVE_INVALID");
        for(int i=0;i<entries.length();i++) {
            JSONObject e=entries.optJSONObject(i);
            if(e==null || !(e.opt("title") instanceof String) || e.optString("title").trim().isEmpty() || e.optJSONArray("dates")==null)
                throw new Exception("SHARED_ARCHIVE_INVALID");
            JSONArray dates=e.getJSONArray("dates");
            for(int j=0;j<dates.length();j++) if(!(dates.opt(j) instanceof String) || !dates.getString(j).matches("\\d{4}-\\d{2}-\\d{2}"))
                throw new Exception("SHARED_ARCHIVE_INVALID");
        }
        return record;
    }
    JSONObject load(String owner) throws Exception {
        String page="",id="";
        do {
            String query=URLEncoder.encode("name = '"+NAME+"' and trashed = false","UTF-8");
            JSONObject list=request("https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&pageSize=100&fields=nextPageToken,files(id)&q="+
                query+"&pageToken="+URLEncoder.encode(page,"UTF-8"));
            JSONArray files=list.getJSONArray("files");
            for(int i=0;i<files.length();i++) {
                if(!id.isEmpty()) throw new Exception("SHARED_ARCHIVE_CONFLICT");
                id=files.getJSONObject(i).getString("id");
            }
            page=list.optString("nextPageToken");
        } while(!page.isEmpty());
        if(id.isEmpty()) throw new Exception("SHARED_ARCHIVE_MISSING");
        return validate(request("https://www.googleapis.com/drive/v3/files/"+URLEncoder.encode(id,"UTF-8")+"?alt=media"),owner);
    }
    String submit(JSONObject snapshot,String action,JSONObject payload,String id) throws Exception {
        if(!id.matches("[a-f0-9-]{36}"))throw new Exception("REQUEST_INVALID");
        String query=URLEncoder.encode("name = 'serkal-request-v1-"+id+".json' and trashed = false","UTF-8");
        JSONObject existing=request("https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&fields=files(id)&q="+query);
        if(existing.getJSONArray("files").length()>0)return id;
        JSONObject command=new JSONObject().put("schema",1).put("id",id).put("owner",snapshot.getString("owner"))
            .put("publisher",snapshot.getString("publisher")).put("base",snapshot.getString("generatedAt"))
            .put("action",action).put("payload",payload);
        String boundary="serkal-"+id;
        JSONObject metadata=new JSONObject().put("name","serkal-request-v1-"+id+".json").put("mimeType","application/json")
            .put("parents",new JSONArray().put("appDataFolder"));
        String body="--"+boundary+"\r\nContent-Type: application/json\r\n\r\n"+metadata+
            "\r\n--"+boundary+"\r\nContent-Type: application/json\r\n\r\n"+command+"\r\n--"+boundary+"--\r\n";
        request("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id","POST",body,"multipart/related; boundary="+boundary);
        return id;
    }
    JSONObject result(String owner,String id) throws Exception {
        if(!id.matches("[a-f0-9-]{36}"))throw new Exception("REQUEST_INVALID");
        String query=URLEncoder.encode("name = 'serkal-result-v1-"+id+".json' and trashed = false","UTF-8");
        JSONObject list=request("https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&pageSize=100&fields=files(id)&q="+query);
        JSONArray files=list.getJSONArray("files");if(files.length()==0)return null;
        JSONObject found=null;
        for(int i=0;i<files.length();i++){
            JSONObject value=request("https://www.googleapis.com/drive/v3/files/"+URLEncoder.encode(files.getJSONObject(i).getString("id"),"UTF-8")+"?alt=media");
            if(value.optInt("schema")!=1 || !owner.equals(value.optString("owner")) || !id.equals(value.optString("id")))throw new Exception("REQUEST_INVALID");
            if(found!=null && (!found.optString("code").equals(value.optString("code")) || found.optBoolean("ok")!=value.optBoolean("ok")))throw new Exception("REQUEST_CONFLICT");
            found=value;
        }
        return found;
    }

}

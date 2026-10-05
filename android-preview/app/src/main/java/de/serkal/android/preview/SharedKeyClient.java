package de.serkal.android.preview;

import org.json.JSONArray;
import org.json.JSONObject;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.io.InputStream;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.LinkedHashSet;

final class SharedKeyClient {
    static final String NAME = "serkal-tmdb-key-v1.json";
    private final String token;
    SharedKeyClient(String token) { this.token = token; }
    static class Result {
        final String key, owner, email;
        Result(String key, String owner, String email) { this.key=key; this.owner=owner; this.email=email; }
    }
    private JSONObject request(String url, String method, String body, String contentType) throws Exception {
        HttpURLConnection c=(HttpURLConnection)new URL(url).openConnection();
        c.setConnectTimeout(10000); c.setReadTimeout(15000);
        c.setRequestMethod(method); c.setRequestProperty("Authorization","Bearer "+token);
        try {
            if(body!=null) {
                c.setDoOutput(true); c.setRequestProperty("Content-Type",contentType);
                try(java.io.OutputStream out=c.getOutputStream()) { out.write(body.getBytes(StandardCharsets.UTF_8)); }
            }
            int status=c.getResponseCode();
            if(status!=200 && status!=201) throw new Exception("GOOGLE_HTTP_"+status);
            try(InputStream in=c.getInputStream(); ByteArrayOutputStream out=new ByteArrayOutputStream()) {
                byte[] b=new byte[8192]; int n;
                while((n=in.read(b))!=-1) {
                    out.write(b,0,n);
                    if(out.size()>1048576) throw new Exception("SHARED_KEY_INVALID");
                }
                return new JSONObject(out.toString("UTF-8"));
            }
        } finally { c.disconnect(); }
    }
    Result identify() throws Exception {
        JSONObject user=request("https://www.googleapis.com/oauth2/v3/userinfo","GET",null,null);
        if(user.optString("sub").isEmpty() || user.optString("email").isEmpty() || !user.optBoolean("email_verified"))
            throw new Exception("GOOGLE_IDENTITY_INVALID");
        return new Result("",user.getString("sub"),user.getString("email"));
    }
    static String resolve(List<JSONObject> records, String owner) throws Exception {
        LinkedHashSet<String> keys=new LinkedHashSet<>();
        for(JSONObject record:records) {
            if(record.optInt("schema")!=1 || !owner.equals(record.optString("owner")) ||
                !(record.opt("apiKey") instanceof String) || record.optString("apiKey").trim().isEmpty())
                throw new Exception("SHARED_KEY_INVALID");
            keys.add(record.getString("apiKey").trim());
        }
        if(keys.size()>1) throw new Exception("SHARED_KEY_CONFLICT");
        return keys.isEmpty() ? "" : keys.iterator().next();
    }
    Result load(Result user) throws Exception {
        List<JSONObject> records=new ArrayList<>();
        String page="";
        do {
            String query=URLEncoder.encode("name = '"+NAME+"' and trashed = false","UTF-8");
            JSONObject listing=request("https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&pageSize=100"+
                "&fields=nextPageToken,files(id)&q="+query+"&pageToken="+URLEncoder.encode(page,"UTF-8"),"GET",null,null);
            JSONArray files=listing.getJSONArray("files");
            for(int i=0;i<files.length();i++) {
                if(records.size()>=1000) throw new Exception("SHARED_KEY_TOO_MANY");
                records.add(request("https://www.googleapis.com/drive/v3/files/"+
                    URLEncoder.encode(files.getJSONObject(i).getString("id"),"UTF-8")+"?alt=media","GET",null,null));
            }
            page=listing.optString("nextPageToken");
        } while(!page.isEmpty());
        return new Result(resolve(records,user.owner),user.owner,user.email);
    }
    Result publish(Result user, String key) throws Exception {
        Result existing=load(user);
        if(!existing.key.isEmpty() && !existing.key.equals(key)) throw new Exception("SHARED_KEY_CONFLICT");
        new TmdbClient(key).validate();
        if(existing.key.isEmpty()) {
            String boundary="serkal-key-config-boundary";
            JSONObject metadata=new JSONObject().put("name",NAME).put("mimeType","application/json")
                .put("parents",new JSONArray().put("appDataFolder"));
            JSONObject record=new JSONObject().put("schema",1).put("owner",user.owner).put("apiKey",key);
            String body="--"+boundary+"\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n"+metadata+
                "\r\n--"+boundary+"\r\nContent-Type: application/json\r\n\r\n"+record+"\r\n--"+boundary+"--\r\n";
            request("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id","POST",body,
                "multipart/related; boundary="+boundary);
        }
        Result verified=load(user);
        if(!key.equals(verified.key)) throw new Exception("SHARED_KEY_CONFLICT");
        return verified;
    }
}

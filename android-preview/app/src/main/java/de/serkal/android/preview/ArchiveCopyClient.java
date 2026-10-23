package de.serkal.android.preview;

import org.json.*;
import java.util.*;
import java.net.*;
import java.io.*;
import java.nio.charset.StandardCharsets;

final class ArchiveCopyClient {
    final String token;
    ArchiveCopyClient(String token){this.token=token;}
    JSONObject request(String url,String method,String body,String type) throws Exception {
        HttpURLConnection c=(HttpURLConnection)new URL(url).openConnection();c.setConnectTimeout(10000);c.setReadTimeout(45000);
        c.setRequestMethod(method);c.setRequestProperty("Authorization","Bearer "+token);c.setInstanceFollowRedirects(false);
        try {
            if(body!=null){c.setDoOutput(true);c.setRequestProperty("Content-Type",type);byte[] bytes=body.getBytes(StandardCharsets.UTF_8);c.setFixedLengthStreamingMode(bytes.length);try(OutputStream out=c.getOutputStream()){out.write(bytes);}}
            int status=c.getResponseCode();if(status==204)return new JSONObject();
            if(status<200 || status>299)throw new Exception("GOOGLE_HTTP_"+status);
            try(InputStream in=c.getInputStream();ByteArrayOutputStream out=new ByteArrayOutputStream()){
                byte[] bytes=new byte[8192];int n;while((n=in.read(bytes))!=-1){out.write(bytes,0,n);if(out.size()>ArchiveCodec.LIMIT)throw new Exception("COPY_TOO_LARGE");}
                return new JSONObject(out.toString("UTF-8"));
            }
        }finally{c.disconnect();}
    }
    JSONObject get(String url) throws Exception{return request(url,"GET",null,null);}
    static String esc(String text) throws Exception{return URLEncoder.encode(text,"UTF-8");}
    String owner() throws Exception {JSONObject u=get("https://www.googleapis.com/oauth2/v3/userinfo");if(!u.optBoolean("email_verified") || u.optString("sub").isEmpty())throw new Exception("COPY_ACCOUNT_CHANGED");return u.getString("sub");}
    List<JSONObject> list(String prefix) throws Exception {
        List<JSONObject> files=new ArrayList<>();String page="";
        do{JSONObject r=get("https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&pageSize=1000&fields="+esc("nextPageToken,files(id,name,appProperties,md5Checksum)")+"&q="+esc("name contains '"+prefix+"' and trashed = false")+"&pageToken="+esc(page));
            JSONArray all=r.getJSONArray("files");for(int i=0;i<all.length();i++)files.add(all.getJSONObject(i));if(files.size()>20000)throw new Exception("COPY_TOO_LARGE");page=r.optString("nextPageToken");
        }while(!page.isEmpty());return files;
    }
    static JSONObject head(List<JSONObject> files,String owner) throws Exception {
        Map<String,JSONObject> revisions=new HashMap<>();Set<String> parents=new HashSet<>();int roots=0;
        for(JSONObject file:files){JSONObject p=file.getJSONObject("appProperties");if(p.optString("parent").equals("root"))p.put("parent","");String rev=p.getString("revision"),parent=p.getString("parent");
            if(!p.getString("owner").equals(owner) || !rev.matches(ArchiveCodec.UUID) || !(parent.isEmpty()||parent.matches(ArchiveCodec.UUID)) || !file.getString("name").equals(ArchiveCodec.PREFIX+rev+".json"))throw new Exception("COPY_INVALID");
            JSONObject old=revisions.get(rev);if(old!=null && (!old.optString("md5Checksum").equals(file.optString("md5Checksum")) || !old.getJSONObject("appProperties").getString("parent").equals(parent)))throw new Exception("COPY_CONFLICT");
            revisions.put(rev,file);
        }
        if(revisions.isEmpty())return null;
        for(JSONObject f:revisions.values()){String parent=f.getJSONObject("appProperties").getString("parent");if(parent.isEmpty())roots++;else{if(!revisions.containsKey(parent))throw new Exception("COPY_HISTORY_MISSING");parents.add(parent);}}
        List<JSONObject> tips=new ArrayList<>();for(Map.Entry<String,JSONObject> e:revisions.entrySet())if(!parents.contains(e.getKey()))tips.add(e.getValue());
        if(roots!=1 || tips.size()!=1)throw new Exception("COPY_CONFLICT");
        Set<String> visited=new HashSet<>();JSONObject cursor=tips.get(0);while(cursor!=null){JSONObject p=cursor.getJSONObject("appProperties");if(!visited.add(p.getString("revision")))throw new Exception("COPY_INVALID");cursor=revisions.get(p.getString("parent"));}
        if(visited.size()!=revisions.size())throw new Exception("COPY_INVALID");return tips.get(0);
    }
    JSONObject load(JSONObject file,String owner) throws Exception {
        JSONObject r=ArchiveCodec.validate(get("https://www.googleapis.com/drive/v3/files/"+esc(file.getString("id"))+"?alt=media"),owner);
        if(!r.getString("revision").equals(file.getJSONObject("appProperties").getString("revision")) || !r.getString("parent").equals(file.getJSONObject("appProperties").getString("parent")))throw new Exception("COPY_INVALID");return r;
    }
    String upload(JSONObject record) throws Exception {
        ArchiveCodec.validate(record,record.getString("owner"));String id=record.getString("revision"),boundary="serkal-"+id;
        JSONObject meta=new JSONObject().put("name",ArchiveCodec.PREFIX+id+".json").put("mimeType","application/json").put("parents",new JSONArray().put("appDataFolder"))
            .put("appProperties",new JSONObject().put("owner",record.getString("owner")).put("revision",id).put("parent",record.getString("parent").isEmpty()?"root":record.getString("parent")));
        String body="--"+boundary+"\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n"+meta+"\r\n--"+boundary+"\r\nContent-Type: application/json\r\n\r\n"+record+"\r\n--"+boundary+"--\r\n";
        return request("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id","POST",body,"multipart/related; boundary="+boundary).getString("id");
    }

    void archiveActiveRevisions(List<JSONObject> files) throws Exception {
        for(JSONObject file:files) {
            JSONObject meta=new JSONObject().put("name","serkal-backup-v2-"+file.getString("id")+".json");
            URL url=new URL("https://www.googleapis.com/drive/v3/files/"+esc(file.getString("id"))+"?fields=id,name");
            HttpURLConnection c=(HttpURLConnection)url.openConnection();c.setConnectTimeout(10000);c.setReadTimeout(45000);
            c.setRequestMethod("POST");c.setRequestProperty("X-HTTP-Method-Override","PATCH");
            c.setRequestProperty("Authorization","Bearer "+token);c.setRequestProperty("Content-Type","application/json");c.setDoOutput(true);
            byte[] body=meta.toString().getBytes(StandardCharsets.UTF_8);c.setFixedLengthStreamingMode(body.length);
            try(OutputStream out=c.getOutputStream()){out.write(body);}
            try {int status=c.getResponseCode();if(status<200||status>299)throw new Exception("GOOGLE_HTTP_"+status);}
            finally {c.disconnect();}
        }
    }
}

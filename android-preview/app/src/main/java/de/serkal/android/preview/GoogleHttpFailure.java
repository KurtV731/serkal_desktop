package de.serkal.android.preview;
import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
final class GoogleHttpFailure extends Exception {
    final String code,responseText,endpoint,method;
    long retryAfterMillis;
    GoogleHttpFailure(int status,String text,String url,String method,String token){
        super("GOOGLE_HTTP_"+status+"\n"+clean(text,token));code="GOOGLE_HTTP_"+status;
        responseText=clean(text,token);this.method=method;this.endpoint=url.split("\\?",2)[0];
    }
    static String clean(String text,String token){String out=text==null?"":text;if(token!=null&&!token.isEmpty())out=out.replace(token,"[REDACTED]");
        return out.replaceAll("(?i)(Bearer\\s+)[^\\s\"<>]+","$1[REDACTED]").replaceAll("(?i)(\"(?:access_token|refresh_token|id_token|client_secret|apiKey)\"\\s*:\\s*\")[^\"]*","$1[REDACTED]");}
    static GoogleHttpFailure read(HttpURLConnection connection,int status,String token) throws Exception {
        String text="";InputStream stream=connection.getErrorStream();
        if(stream!=null)try(InputStream in=stream;ByteArrayOutputStream out=new ByteArrayOutputStream()){
            byte[] b=new byte[8192];int n;while((n=in.read(b))!=-1)out.write(b,0,n);text=out.toString("UTF-8");
        }
        GoogleHttpFailure failure=new GoogleHttpFailure(status,text,connection.getURL().toString(),connection.getRequestMethod(),token);
        try{failure.retryAfterMillis=Math.max(0,Long.parseLong(connection.getHeaderField("Retry-After")))*1000;}catch(Exception ignored){}
        return failure;
    }
    static void record(android.content.Context context,Exception error){
        try(FileOutputStream out=new FileOutputStream(new File(context.getFilesDir(),"google-errors.jsonl"),true)){
            org.json.JSONObject row=new org.json.JSONObject().put("message",String.valueOf(error.getMessage()));
            if(error instanceof GoogleHttpFailure){GoogleHttpFailure g=(GoogleHttpFailure)error;row.put("code",g.code).put("endpoint",g.endpoint).put("method",g.method).put("responseText",g.responseText);}
            out.write((row+"\n").getBytes(StandardCharsets.UTF_8));
        }catch(Exception ignored){}
    }
    static String readLog(android.content.Context context)throws Exception{
        File file=new File(context.getFilesDir(),"google-errors.jsonl");if(!file.exists())return "";
        try(InputStream in=new FileInputStream(file);ByteArrayOutputStream out=new ByteArrayOutputStream()){byte[] b=new byte[8192];int n;while((n=in.read(b))!=-1)out.write(b,0,n);return out.toString("UTF-8");}
    }
    static String code(Exception error){return error instanceof GoogleHttpFailure?((GoogleHttpFailure)error).code:String.valueOf(error.getMessage()).split("\\n",2)[0];}
}

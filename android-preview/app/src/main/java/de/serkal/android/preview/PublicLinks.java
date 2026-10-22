package de.serkal.android.preview;
import java.net.URLEncoder;
final class PublicLinks {
 static String esc(String value){try{return URLEncoder.encode(value,"UTF-8");}catch(Exception e){throw new IllegalArgumentException(e);}}
 static String series(int id,int season,boolean english){
  if(id<=0 || season<0 || season>999)throw new IllegalArgumentException("Invalid series or season");
  return "https://www.themoviedb.org/tv/"+id+(season>0?"/season/"+season:"")+"?language="+(english?"en-US":"de-DE");
 }
 static String calendar(String encodedId,String email,boolean english){
  return "https://calendar.google.com/calendar/u/0/r?hl="+(english?"en":"de")+(encodedId.isEmpty()?"":"&cid="+esc(encodedId))+(email.isEmpty()?"":"&authuser="+esc(email));
 }
}

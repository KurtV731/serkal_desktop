package de.serkal.android.preview;
import org.junit.Test;import static org.junit.Assert.*;
public class PublicLinksTest {
 @Test public void seriesAndSpecificSeasonUseSameId(){assertEquals("https://www.themoviedb.org/tv/42?language=de-DE",PublicLinks.series(42,0,false));assertEquals("https://www.themoviedb.org/tv/42/season/2?language=en-US",PublicLinks.series(42,2,true));}
 @Test public void calendarEscapesAccountAndId(){String s=PublicLinks.calendar("abc+/=","person+test@example.com",false);assertTrue(s.contains("cid=abc%2B%2F%3D"));assertTrue(s.contains("authuser=person%2Btest%40example.com"));assertFalse(s.contains("token"));}
 @Test public void noCalendarYetOpensCalendarHome(){assertEquals("https://calendar.google.com/calendar/u/0/r?hl=en",PublicLinks.calendar("","",true));}
 @Test(expected=IllegalArgumentException.class) public void invalidSeasonRejected(){PublicLinks.series(42,-1,false);}
}

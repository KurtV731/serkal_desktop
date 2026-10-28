package de.serkal.android.preview;
import org.junit.*;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;
import org.json.*;
import static org.junit.Assert.*;
@RunWith(RobolectricTestRunner.class)
public class CalendarRequestPolicyTest {
    GoogleHttpFailure quota(){return new GoogleHttpFailure(403,"{\"error\":{\"errors\":[{\"reason\":\"rateLimitExceeded\"}],\"message\":\"Rate Limit Exceeded\"}}","https://www.googleapis.com/calendar/v3/calendars/id/events","PUT","");}
    @Test public void retriesQuotaWithGrowingWaitsAndPacesSuccesses()throws Exception{
        long[] clock={0};int[] calls={0};java.util.List<Long> waits=new java.util.ArrayList<>();
        CalendarRequestPolicy policy=new CalendarRequestPolicy(()->clock[0],()->0,ms->{waits.add(ms);clock[0]+=ms;},null);
        policy.run(()->{if(++calls[0]<3)throw quota();return new JSONObject();});
        assertEquals(3,calls[0]);assertTrue(waits.get(0)>=1000&&waits.get(0)<2000);assertTrue(waits.get(1)>=2000&&waits.get(1)<3000);
        policy.run(JSONObject::new);assertEquals(Long.valueOf(250),waits.get(2));
    }
    @Test public void exhaustionRetainsFullErrorAndBlocksQueuedNetworkCalls()throws Exception{
        long[] clock={0};int[] calls={0};CalendarRequestPolicy p=new CalendarRequestPolicy(()->clock[0],()->500,ms->clock[0]+=ms,null);
        for(int i=0;i<2;i++)try{p.run(()->{calls[0]++;throw quota();});fail();}catch(GoogleHttpFailure failure){assertTrue(failure.responseText.contains("rateLimitExceeded"));}
        assertEquals(1,calls[0]);
    }
    @Test public void permissionFailuresAreNotRetried()throws Exception{
        int[] calls={0};CalendarRequestPolicy p=new CalendarRequestPolicy(()->0,null);
        try{p.run(()->{calls[0]++;throw new GoogleHttpFailure(403,"{\"error\":{\"errors\":[{\"reason\":\"forbidden\"}]}}","https://www.googleapis.com/calendar/v3/calendars/id","GET","");});fail();}catch(GoogleHttpFailure expected){}
        assertEquals(1,calls[0]);assertTrue(CalendarRequestPolicy.limited(new GoogleHttpFailure(429,"{}","url","PUT","")));
    }
}

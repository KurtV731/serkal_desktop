package de.serkal.android.preview;
import org.json.*;
import java.util.function.LongSupplier;

/** Shared by all Calendar calls in one close; never used for Drive uploads. */
final class CalendarRequestPolicy {
    interface Request {JSONObject run() throws Exception;}
    interface Sleeper {void sleep(long millis)throws Exception;}
    interface Wait {void waiting(int attempt,long millis);}
    private final LongSupplier now,deadline;
    private final Sleeper sleep;
    private final Wait progress;
    private long lastStart=-1;
    private Exception blocked;
    private int successfulWrites;
    CalendarRequestPolicy(LongSupplier deadline,Wait progress){this(System::currentTimeMillis,deadline,Thread::sleep,progress);}
    CalendarRequestPolicy(LongSupplier now,LongSupplier deadline,Sleeper sleep,Wait progress){this.now=now;this.deadline=deadline;this.sleep=sleep;this.progress=progress;}
    static boolean limited(Exception error){
        if(!(error instanceof GoogleHttpFailure))return false;
        GoogleHttpFailure e=(GoogleHttpFailure)error;if(e.code.equals("GOOGLE_HTTP_429"))return true;
        if(!e.code.equals("GOOGLE_HTTP_403"))return false;
        try{JSONArray reasons=new JSONObject(e.responseText).getJSONObject("error").optJSONArray("errors");
            if(reasons!=null)for(int i=0;i<reasons.length();i++){String r=reasons.getJSONObject(i).optString("reason");if(r.equals("rateLimitExceeded")||r.equals("userRateLimitExceeded"))return true;}
        }catch(Exception ignored){}return false;
    }
    private void waitFor(long ms)throws Exception{
        long end=deadline.getAsLong();if(end>0&&now.getAsLong()+ms>=end)throw new java.net.SocketTimeoutException("SESSION_CLOSE_TIMEOUT");
        if(ms>0)sleep.sleep(ms);
    }
    private void pause(long millis,int attempt)throws Exception{
        waitFor(0);long remaining=millis;
        if(deadline.getAsLong()>0&&now.getAsLong()+millis>=deadline.getAsLong())throw new java.net.SocketTimeoutException("SESSION_CLOSE_TIMEOUT");
        while(remaining>0){if(progress!=null)progress.waiting(attempt,remaining);long step=progress==null?remaining:Math.min(1000,remaining);waitFor(step);remaining-=step;}
    }
    synchronized JSONObject run(Request request)throws Exception{return run(request,false);}
    synchronized JSONObject run(Request request,boolean write)throws Exception{
        if(blocked!=null)throw blocked;
        waitFor(lastStart<0?0:Math.max(0,250-(now.getAsLong()-lastStart)));
        for(int attempt=0;;attempt++){
            if(write&&successfulWrites>=20){pause(2000,0);successfulWrites=0;}
            waitFor(0);lastStart=now.getAsLong();
            try{JSONObject result=request.run();if(write)successfulWrites++;return result;}catch(Exception error){
                if(!limited(error))throw error;
                long delay=Math.max(((GoogleHttpFailure)error).retryAfterMillis,Math.min(32000L,(1000L<<attempt))+(long)(Math.random()*1000));
                long end=deadline.getAsLong();
                if(attempt>=7||(end>0&&now.getAsLong()+delay>=end)){blocked=error;throw error;}
                pause(delay,attempt+1);
            }
        }
    }
}

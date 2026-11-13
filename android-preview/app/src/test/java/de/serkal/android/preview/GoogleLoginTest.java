package de.serkal.android.preview;

import android.app.AlertDialog;
import android.content.Context;
import android.widget.TextView;
import java.lang.reflect.*;
import java.time.Duration;
import org.json.JSONObject;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.*;
import org.robolectric.annotation.*;
import org.robolectric.android.controller.ActivityController;
import org.robolectric.shadows.ShadowAlertDialog;
import static org.junit.Assert.*;

@RunWith(RobolectricTestRunner.class)
@Config(sdk=28)
@LooperMode(LooperMode.Mode.PAUSED)
public class GoogleLoginTest {
    Object get(MainActivity a,String name)throws Exception{Field f=MainActivity.class.getDeclaredField(name);f.setAccessible(true);return f.get(a);}
    void set(MainActivity a,String name,Object value)throws Exception{Field f=MainActivity.class.getDeclaredField(name);f.setAccessible(true);f.set(a,value);}
    void call(MainActivity a,String name,Class<?>[] types,Object... args)throws Exception{Method m=MainActivity.class.getDeclaredMethod(name,types);m.setAccessible(true);m.invoke(a,args);}
    @Test public void firstConnectionRequiresExplanationAndLaterDoesNotAuthorize()throws Exception{
        ActivityController<MainActivity> c=Robolectric.buildActivity(MainActivity.class).create();MainActivity a=c.get();
        try{
            call(a,"connectGoogle",new Class<?>[]{boolean.class},false);
            AlertDialog dialog=ShadowAlertDialog.getLatestAlertDialog();assertNotNull(dialog);assertTrue(dialog.isShowing());
            assertFalse((Boolean)get(a,"googleBusy"));
            assertTrue(((TextView)dialog.findViewById(android.R.id.message)).getText().toString().contains("Google Drive"));
            assertNotNull(dialog.getButton(AlertDialog.BUTTON_NEUTRAL));
            dialog.getButton(AlertDialog.BUTTON_NEGATIVE).performClick();
            assertFalse((Boolean)get(a,"googleBusy"));assertFalse(a.getPreferences(0).getBoolean("googleWelcomeAccepted",false));
        }finally{c.destroy();}
    }
    @Test public void timeoutEndsBusyStateAndInvalidatesLateResult()throws Exception{
        ActivityController<MainActivity> c=Robolectric.buildActivity(MainActivity.class).create();MainActivity a=c.get();
        try{
            set(a,"googleBusy",true);set(a,"googleGeneration",4);set(a,"pendingGoogleGeneration",4);
            call(a,"googleStage",new Class<?>[]{String.class,long.class},"authorize",1000L);
            Shadows.shadowOf(android.os.Looper.getMainLooper()).idleFor(Duration.ofSeconds(1));
            assertFalse((Boolean)get(a,"googleBusy"));assertEquals(5,get(a,"googleGeneration"));
            call(a,"onActivityResult",new Class<?>[]{int.class,int.class,android.content.Intent.class},505,android.app.Activity.RESULT_OK,null);
            assertEquals(5,get(a,"googleGeneration"));
            assertTrue(((TextView)get(a,"statusText")).getText().toString().contains("Zeitüberschreitung"));
            String log=GoogleHttpFailure.readLog(a);assertTrue(log.contains("TIMEOUT"));assertTrue(log.contains("authorize"));
        }finally{c.destroy();}
    }
    @Test public void helpOpensPrivacyWithoutGoogleLogin()throws Exception{
        ActivityController<MainActivity> c=Robolectric.buildActivity(MainActivity.class).create();MainActivity a=c.get();
        try{
            call(a,"showHelp",new Class<?>[]{});
            ShadowAlertDialog.getLatestAlertDialog().getButton(AlertDialog.BUTTON_NEUTRAL).performClick();
            assertEquals("https://serkal.de/privacy.html",Shadows.shadowOf(a).getNextStartedActivity().getDataString());
            assertFalse((Boolean)get(a,"googleBusy"));
        }finally{c.destroy();}
    }
    @Test public void cancellationIsPersistedWithoutAccountOrCredentials()throws Exception{
        ActivityController<MainActivity> c=Robolectric.buildActivity(MainActivity.class).create();MainActivity a=c.get();
        try{
            set(a,"googleBusy",true);set(a,"googleGeneration",7);
            a.getPreferences(0).edit().putBoolean("googleAttemptPending",true).commit();
            call(a,"cancelGoogleConnection",new Class<?>[]{});
            assertFalse((Boolean)get(a,"googleBusy"));assertFalse(a.getPreferences(0).getBoolean("googleAttemptPending",true));
            String log=GoogleHttpFailure.readLog(a);assertTrue(log.contains("CANCELLED"));
            for(String line:log.trim().split("\n")){
                JSONObject row=new JSONObject(line);assertTrue(row.has("time"));assertTrue(row.has("versionCode"));
                assertFalse(row.has("token"));assertFalse(row.has("email"));assertFalse(row.has("owner"));
            }
        }finally{c.destroy();}
    }
}

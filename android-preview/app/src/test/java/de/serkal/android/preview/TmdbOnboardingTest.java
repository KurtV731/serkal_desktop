package de.serkal.android.preview;
import android.app.AlertDialog;
import android.widget.*;
import android.view.*;
import java.lang.reflect.*;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.*;
import org.robolectric.annotation.*;
import org.robolectric.android.controller.ActivityController;
import org.robolectric.shadows.ShadowAlertDialog;
import static org.junit.Assert.*;
@RunWith(RobolectricTestRunner.class) @Config(sdk=28) @LooperMode(LooperMode.Mode.PAUSED)
public class TmdbOnboardingTest {
 public static class TestActivity extends MainActivity {
  boolean reject;
  @Override protected TmdbClient tmdbClient(String key){return new TmdbClient(key){@Override void validate()throws Exception{if(reject)throw new Exception("KEY");}};}
 }
 void call(MainActivity a,String name,Class<?>[] types,Object... args)throws Exception{Method m=MainActivity.class.getDeclaredMethod(name,types);m.setAccessible(true);m.invoke(a,args);}
 void set(MainActivity a,String name,Object value)throws Exception{Field f=MainActivity.class.getDeclaredField(name);f.setAccessible(true);f.set(a,value);}
 Object get(MainActivity a,String name)throws Exception{Field f=MainActivity.class.getDeclaredField(name);f.setAccessible(true);return f.get(a);}
 EditText field(View v){if(v instanceof EditText)return (EditText)v;if(v instanceof ViewGroup)for(int i=0;i<((ViewGroup)v).getChildCount();i++){EditText found=field(((ViewGroup)v).getChildAt(i));if(found!=null)return found;}return null;}
 void idle(){Shadows.shadowOf(android.os.Looper.getMainLooper()).idle();}
 @Test public void explanationEmptyInputAndHelpDoNotDismissOrLoseInput()throws Exception{
  for(boolean en:new boolean[]{false,true}){
   ActivityController<TestActivity> c=Robolectric.buildActivity(TestActivity.class).create();TestActivity a=c.get();
   try{set(a,"english",en);call(a,"askForKey",new Class<?>[]{});AlertDialog d=ShadowAlertDialog.getLatestAlertDialog();EditText input=field(d.getWindow().getDecorView());assertNotNull(input);
    d.getButton(AlertDialog.BUTTON_POSITIVE).performClick();idle();assertTrue(d.isShowing());assertNotNull(input.getError());
    input.setText("test key");d.getButton(AlertDialog.BUTTON_NEUTRAL).performClick();idle();
    assertTrue(d.isShowing());assertEquals("test key",input.getText().toString());assertEquals(en?"https://serkal.de/tmdb-help.html":"https://serkal.de/tmdb-hilfe.html",Shadows.shadowOf(a).getNextStartedActivity().getDataString());
    call(a,"openTmdbPage",new Class<?>[]{boolean.class},false);assertTrue(Shadows.shadowOf(a).getNextStartedActivity().getDataString().startsWith("https://www.themoviedb.org/settings/api"));
   }finally{c.destroy();}
  }
 }
 @Test public void rejectedKeyCanBeCorrectedWithoutReplacingWorkingCredential()throws Exception{
  ActivityController<TestActivity> c=Robolectric.buildActivity(TestActivity.class).create();TestActivity a=c.get();
  try{a.reject=true;set(a,"credential","previous");call(a,"askForKey",new Class<?>[]{});AlertDialog d=ShadowAlertDialog.getLatestAlertDialog();EditText input=field(d.getWindow().getDecorView());input.setText("bad");d.getButton(AlertDialog.BUTTON_POSITIVE).performClick();
   long end=System.currentTimeMillis()+3000;while(input.getError()==null&&System.currentTimeMillis()<end){Thread.sleep(10);idle();}
   assertNotNull(input.getError());assertTrue(d.isShowing());assertEquals("previous",get(a,"credential"));
   a.reject=false;input.setText("accepted");d.getButton(AlertDialog.BUTTON_POSITIVE).performClick();
   end=System.currentTimeMillis()+3000;while(d.isShowing()&&System.currentTimeMillis()<end){Thread.sleep(10);idle();}
   assertFalse(d.isShowing());assertEquals("accepted",get(a,"credential"));
  }finally{c.destroy();}
 }
 @Test public void missingGooglePermissionsExplainReconnectPath()throws Exception{
  ActivityController<TestActivity> c=Robolectric.buildActivity(TestActivity.class).create();TestActivity a=c.get();
  try{call(a,"googleFailure",new Class<?>[]{Exception.class},new Exception("GOOGLE_PERMISSION_MISSING"));assertTrue(((TextView)get(a,"statusText")).getText().toString().contains("Menü > Google-Konto"));}finally{c.destroy();}
 }
}

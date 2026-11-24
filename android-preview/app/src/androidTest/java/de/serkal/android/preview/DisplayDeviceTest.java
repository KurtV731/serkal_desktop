package de.serkal.android.preview;
import android.app.*;
import android.content.*;
import android.graphics.*;
import android.view.*;
import android.widget.*;
import androidx.test.core.app.ActivityScenario;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import androidx.core.view.*;
import androidx.core.graphics.Insets;
import org.junit.Test;
import org.junit.runner.RunWith;
import java.io.*;
import static org.junit.Assert.*;
@RunWith(AndroidJUnit4.class)
public class DisplayDeviceTest {
 @Test public void systemBarsCutoutKeyboardAndResizeKeepControlsReachable()throws Exception{
  Instrumentation inst=InstrumentationRegistry.getInstrumentation();Context context=inst.getTargetContext();
  context.getSharedPreferences(MainActivity.class.getName(),Context.MODE_PRIVATE).edit().putBoolean("googleAttemptPending",true).commit();
  try(ActivityScenario<MainActivity> scenario=ActivityScenario.launch(MainActivity.class)){
   inst.waitForIdleSync();
   scenario.onActivity(a->{for(View window:android.view.inspector.WindowInspector.getGlobalWindowViews()){Button later=findLater(window);if(later!=null)later.performClick();}});
   inst.waitForIdleSync();
   scenario.onActivity(a->{
    View root=a.findViewById(android.R.id.content).findViewWithTag("insetRoot");assertNotNull(root);assertTrue(root.getWidth()>0);
    WindowInsetsCompat insets=ViewCompat.getRootWindowInsets(root);assertNotNull(insets);
    Insets safe=insets.getInsets(WindowInsetsCompat.Type.systemBars()|WindowInsetsCompat.Type.displayCutout());
    assertTrue(root.getPaddingLeft()>=safe.left);assertTrue(root.getPaddingRight()>=safe.right);assertTrue(root.getPaddingBottom()>=safe.bottom);
    View footer=root.findViewWithTag("globalFooter");Rect visible=new Rect();assertTrue(footer.getGlobalVisibleRect(visible));assertTrue(visible.height()>0);
    View tabs=root.findViewWithTag("adaptiveTabs");if(tabs.getVisibility()==View.VISIBLE){root.findViewWithTag("panelTab2").performClick();assertEquals(View.VISIBLE,root.findViewWithTag("panelArchive").getVisibility());root.findViewWithTag("panelTab0").performClick();}
    EditText input=(root.<EditText>findViewWithTag("seriesTitleInput"));input.setText("Retained display test");
   });
   save(inst,context,"display-initial.png");
   scenario.onActivity(a->WindowCompat.getInsetsController(a.getWindow(),a.getWindow().getDecorView()).show(WindowInsetsCompat.Type.systemBars()));
   Thread.sleep(500);inst.waitForIdleSync();
   scenario.onActivity(a->{View root=a.findViewById(android.R.id.content).findViewWithTag("insetRoot");WindowInsetsCompat i=ViewCompat.getRootWindowInsets(root);Insets bars=i.getInsets(WindowInsetsCompat.Type.systemBars());assertTrue(i.isVisible(WindowInsetsCompat.Type.statusBars()));assertTrue(bars.top>0);assertTrue(root.getPaddingTop()>=bars.top);assertTrue(root.getPaddingBottom()>=bars.bottom);});
   save(inst,context,"display-system-bars.png");
   scenario.onActivity(a->WindowCompat.getInsetsController(a.getWindow(),a.getWindow().getDecorView()).hide(WindowInsetsCompat.Type.systemBars()));
   Thread.sleep(500);inst.waitForIdleSync();
   scenario.onActivity(a->{
    View root=a.findViewById(android.R.id.content).findViewWithTag("insetRoot");
    WindowInsetsCompat i=ViewCompat.getRootWindowInsets(root);
    assertFalse(i.isVisible(WindowInsetsCompat.Type.statusBars()));
    assertFalse(i.isVisible(WindowInsetsCompat.Type.navigationBars()));
    Insets remaining=Insets.max(i.getInsets(WindowInsetsCompat.Type.systemBars()|WindowInsetsCompat.Type.ime()),
        i.getInsetsIgnoringVisibility(WindowInsetsCompat.Type.displayCutout()));
    float density=root.getResources().getDisplayMetrics().density;
    assertEquals(Math.round(3*density)+remaining.top,root.getPaddingTop());
    assertEquals(Math.round(4*density)+remaining.bottom,root.getPaddingBottom());
   });
   save(inst,context,"display-bars-hidden-again.png");
   // Force a size change through the OS; this preserves the same app session.
   shell(inst,"wm size 1200x1800");inst.waitForIdleSync();Thread.sleep(2200);inst.waitForIdleSync();
   scenario.onActivity(a->{View root=a.findViewById(android.R.id.content).findViewWithTag("insetRoot");assertNotNull(root);assertEquals("Retained display test",(root.<EditText>findViewWithTag("seriesTitleInput")).getText().toString());assertNotNull(root.findViewWithTag("exitSerKal"));View panel=root.findViewWithTag("panelSearch");assertTrue(panel.getWidth()>0);assertTrue(panel.getHeight()>0);assertTrue(panel.getWidth()<=root.getWidth());});
   save(inst,context,"display-resized.png");
   scenario.onActivity(a->{for(View window:android.view.inspector.WindowInspector.getGlobalWindowViews()){Button later=findLater(window);if(later!=null)later.performClick();}});
   inst.waitForIdleSync();Thread.sleep(300);
   scenario.onActivity(a->{View root=a.findViewById(android.R.id.content).findViewWithTag("insetRoot");if(root.findViewWithTag("adaptiveTabs").getVisibility()==View.VISIBLE)root.findViewWithTag("panelTab0").performClick();EditText input=(root.<EditText>findViewWithTag("seriesTitleInput"));input.requestFocus();WindowCompat.getInsetsController(a.getWindow(),input).show(WindowInsetsCompat.Type.ime());});
   java.util.concurrent.atomic.AtomicInteger imeHeight=new java.util.concurrent.atomic.AtomicInteger();
   for(int attempt=0;attempt<50&&imeHeight.get()==0;attempt++){Thread.sleep(100);inst.waitForIdleSync();scenario.onActivity(a->{WindowInsetsCompat insets=ViewCompat.getRootWindowInsets(a.findViewById(android.R.id.content).findViewWithTag("insetRoot"));if(insets!=null)imeHeight.set(insets.getInsets(WindowInsetsCompat.Type.ime()).bottom);});}
   save(inst,context,"display-ime.png");
   scenario.onActivity(a->{View root=a.findViewById(android.R.id.content).findViewWithTag("insetRoot");WindowInsetsCompat i=ViewCompat.getRootWindowInsets(root);assertNotNull(i);assertTrue("Keyboard must actually be visible",i.getInsets(WindowInsetsCompat.Type.ime()).bottom>0);assertTrue(root.getPaddingBottom()>=i.getInsets(WindowInsetsCompat.Type.ime()).bottom);});
   // Reopen the real IME for each route; no Google/TMDB credentials are needed.
   for(int route=0;route<3;route++){
    final int action=route;
    scenario.onActivity(a->{View r=a.findViewById(android.R.id.content).findViewWithTag("insetRoot");EditText e=(r.<EditText>findViewWithTag("seriesTitleInput"));e.setText("Thorsten");e.setSelection(3);e.requestFocus();WindowCompat.getInsetsController(a.getWindow(),e).show(WindowInsetsCompat.Type.ime());});
    waitIme(inst,scenario,true);
    scenario.onActivity(a->{View r=a.findViewById(android.R.id.content).findViewWithTag("insetRoot");EditText input=r.findViewWithTag("seriesTitleInput");View title=r.findViewWithTag("appTitle");assertSame(title.getParent(),input.getParent());assertEquals(View.GONE,title.getVisibility());assertTrue(input.hasFocus());assertEquals(3,input.getSelectionStart());Rect inputRect=new Rect();assertTrue(input.getGlobalVisibleRect(inputRect));assertEquals(input.getHeight(),inputRect.height());View close=r.findViewWithTag("closeKeyboard");Rect rect=new Rect();assertEquals(View.VISIBLE,close.getVisibility());assertTrue("Close keyboard button reachable",close.getGlobalVisibleRect(rect));assertTrue(rect.width()>0&&rect.height()>0);if(action==0)close.performClick();else if(action==1)(r.<EditText>findViewWithTag("seriesTitleInput")).onEditorAction(android.view.inputmethod.EditorInfo.IME_ACTION_SEARCH);else r.findViewWithTag("submitSearch").performClick();});
    waitIme(inst,scenario,false);
    scenario.onActivity(a->{View r=a.findViewById(android.R.id.content).findViewWithTag("insetRoot");assertFalse((r.<EditText>findViewWithTag("seriesTitleInput")).hasFocus());assertEquals("Thorsten",(r.<EditText>findViewWithTag("seriesTitleInput")).getText().toString());assertEquals(View.GONE,r.findViewWithTag("closeKeyboard").getVisibility());assertEquals(View.VISIBLE,r.findViewWithTag("appTitle").getVisibility());assertNotNull(r.findViewWithTag("panelSearch").findViewWithTag("seriesTitleInput"));Rect rect=new Rect();assertTrue(r.findViewWithTag("submitSearch").getGlobalVisibleRect(rect));assertTrue(rect.height()>0);});
    save(inst,context,"keyboard-closed-"+action+".png");
   }
  }finally{shell(inst,"wm size reset");}
 }
 static void waitIme(Instrumentation inst,ActivityScenario<MainActivity> scenario,boolean expected)throws Exception{
  java.util.concurrent.atomic.AtomicBoolean shown=new java.util.concurrent.atomic.AtomicBoolean(!expected);
  for(int i=0;i<60;i++){Thread.sleep(100);inst.waitForIdleSync();scenario.onActivity(a->{WindowInsetsCompat insets=ViewCompat.getRootWindowInsets(a.findViewById(android.R.id.content));shown.set(insets!=null&&insets.getInsets(WindowInsetsCompat.Type.ime()).bottom>0);});if(shown.get()==expected)return;}
  fail("Keyboard visibility did not become "+expected);
 }
 static Button findLater(View v){if(v instanceof Button&&(((Button)v).getText().toString().equalsIgnoreCase("Später")||((Button)v).getText().toString().equalsIgnoreCase("Later")))return (Button)v;if(v instanceof ViewGroup)for(int n=0;n<((ViewGroup)v).getChildCount();n++){Button b=findLater(((ViewGroup)v).getChildAt(n));if(b!=null)return b;}return null;}
 static void shell(Instrumentation i,String command)throws Exception{try(android.os.ParcelFileDescriptor fd=i.getUiAutomation().executeShellCommand(command);FileInputStream in=new FileInputStream(fd.getFileDescriptor())){byte[] b=new byte[1024];while(in.read(b)>0){}}}
 static void save(Instrumentation i,Context c,String name)throws Exception{Thread.sleep(1200);i.waitForIdleSync();Bitmap b=i.getUiAutomation().takeScreenshot();assertNotNull(b);try(FileOutputStream out=new FileOutputStream(new File(c.getExternalFilesDir(null),name))){b.compress(Bitmap.CompressFormat.PNG,100,out);}b.recycle();}
}

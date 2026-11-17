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
    EditText input=findEdit(root.findViewWithTag("panelSearch"));input.setText("Retained display test");
   });
   save(inst,context,"display-initial.png");
   scenario.onActivity(a->WindowCompat.getInsetsController(a.getWindow(),a.getWindow().getDecorView()).show(WindowInsetsCompat.Type.systemBars()));
   Thread.sleep(500);inst.waitForIdleSync();
   scenario.onActivity(a->{View root=a.findViewById(android.R.id.content).findViewWithTag("insetRoot");WindowInsetsCompat i=ViewCompat.getRootWindowInsets(root);Insets bars=i.getInsetsIgnoringVisibility(WindowInsetsCompat.Type.systemBars());assertTrue(bars.top>0);assertTrue(root.getPaddingTop()>=bars.top);assertTrue(root.getPaddingBottom()>=bars.bottom);});
   save(inst,context,"display-system-bars.png");
   // Force a size change through the OS; this preserves the same app session.
   shell(inst,"wm size 1200x1800");inst.waitForIdleSync();Thread.sleep(800);
   scenario.onActivity(a->{View root=a.findViewById(android.R.id.content).findViewWithTag("insetRoot");assertNotNull(root);assertEquals("Retained display test",findEdit(root.findViewWithTag("panelSearch")).getText().toString());assertNotNull(root.findViewWithTag("exitSerKal"));});
   save(inst,context,"display-resized.png");
   scenario.onActivity(a->{for(View window:android.view.inspector.WindowInspector.getGlobalWindowViews()){Button later=findLater(window);if(later!=null)later.performClick();}});
   inst.waitForIdleSync();Thread.sleep(300);
   scenario.onActivity(a->{View root=a.findViewById(android.R.id.content).findViewWithTag("insetRoot");if(root.findViewWithTag("adaptiveTabs").getVisibility()==View.VISIBLE)root.findViewWithTag("panelTab0").performClick();EditText input=findEdit(root.findViewWithTag("panelSearch"));input.requestFocus();WindowCompat.getInsetsController(a.getWindow(),input).show(WindowInsetsCompat.Type.ime());});
   java.util.concurrent.atomic.AtomicInteger imeHeight=new java.util.concurrent.atomic.AtomicInteger();
   for(int attempt=0;attempt<50&&imeHeight.get()==0;attempt++){Thread.sleep(100);inst.waitForIdleSync();scenario.onActivity(a->{WindowInsetsCompat insets=ViewCompat.getRootWindowInsets(a.findViewById(android.R.id.content).findViewWithTag("insetRoot"));if(insets!=null)imeHeight.set(insets.getInsets(WindowInsetsCompat.Type.ime()).bottom);});}
   save(inst,context,"display-ime.png");
   scenario.onActivity(a->{View root=a.findViewById(android.R.id.content).findViewWithTag("insetRoot");WindowInsetsCompat i=ViewCompat.getRootWindowInsets(root);assertNotNull(i);assertTrue("Keyboard must actually be visible",i.getInsets(WindowInsetsCompat.Type.ime()).bottom>0);assertTrue(root.getPaddingBottom()>=i.getInsets(WindowInsetsCompat.Type.ime()).bottom);});
   save(inst,context,"display-ime.png");
  }finally{shell(inst,"wm size reset");}
 }
 static Button findLater(View v){if(v instanceof Button&&(((Button)v).getText().toString().equalsIgnoreCase("Später")||((Button)v).getText().toString().equalsIgnoreCase("Later")))return (Button)v;if(v instanceof ViewGroup)for(int n=0;n<((ViewGroup)v).getChildCount();n++){Button b=findLater(((ViewGroup)v).getChildAt(n));if(b!=null)return b;}return null;}
 static EditText findEdit(View v){if(v instanceof EditText)return (EditText)v;if(v instanceof ViewGroup)for(int n=0;n<((ViewGroup)v).getChildCount();n++){EditText e=findEdit(((ViewGroup)v).getChildAt(n));if(e!=null)return e;}return null;}
 static void shell(Instrumentation i,String command)throws Exception{try(android.os.ParcelFileDescriptor fd=i.getUiAutomation().executeShellCommand(command);FileInputStream in=new FileInputStream(fd.getFileDescriptor())){byte[] b=new byte[1024];while(in.read(b)>0){}}}
 static void save(Instrumentation i,Context c,String name)throws Exception{Bitmap b=i.getUiAutomation().takeScreenshot();assertNotNull(b);try(FileOutputStream out=new FileOutputStream(new File(c.getExternalFilesDir(null),name))){b.compress(Bitmap.CompressFormat.PNG,100,out);}b.recycle();}
}

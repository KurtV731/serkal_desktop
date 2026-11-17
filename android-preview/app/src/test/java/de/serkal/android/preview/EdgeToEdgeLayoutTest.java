package de.serkal.android.preview;
import android.view.*;
import android.widget.*;
import androidx.core.view.*;
import androidx.core.graphics.Insets;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.*;
import org.robolectric.annotation.*;
import org.robolectric.android.controller.ActivityController;
import static org.junit.Assert.*;
@RunWith(RobolectricTestRunner.class) @Config(sdk=35) @LooperMode(LooperMode.Mode.PAUSED)
public class EdgeToEdgeLayoutTest {
 View root(MainActivity a){return a.findViewById(android.R.id.content).findViewWithTag("insetRoot");}
 void layout(View v,int width,int height){float density=v.getResources().getDisplayMetrics().density;int w=Math.round(width*density),h=Math.round(height*density);v.measure(View.MeasureSpec.makeMeasureSpec(w,View.MeasureSpec.EXACTLY),View.MeasureSpec.makeMeasureSpec(h,View.MeasureSpec.EXACTLY));v.layout(0,0,w,h);Shadows.shadowOf(android.os.Looper.getMainLooper()).idle();}
 @Test @Config(qualifiers="sw800dp-w800dp-h1280dp") public void tabletCanUsePortraitAndSwitchPanelsWithoutLosingInput(){
  ActivityController<MainActivity> c=Robolectric.buildActivity(MainActivity.class).create();MainActivity a=c.get();try{
   assertEquals(android.content.pm.ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED,a.getRequestedOrientation());View r=root(a);assertNotNull(r);layout(r,800,1280);
   assertEquals(View.VISIBLE,r.findViewWithTag("adaptiveTabs").getVisibility());assertEquals(View.VISIBLE,r.findViewWithTag("panelSearch").getVisibility());
   EditText input=findEdit(r.findViewWithTag("panelSearch"));input.setText("Retained query");
   r.findViewWithTag("panelTab2").performClick();assertEquals(View.VISIBLE,r.findViewWithTag("panelArchive").getVisibility());assertEquals(View.GONE,r.findViewWithTag("panelSearch").getVisibility());
   layout(r,1280,800);assertEquals(View.GONE,r.findViewWithTag("adaptiveTabs").getVisibility());for(String tag:new String[]{"panelSearch","panelEntry","panelArchive"})assertEquals(View.VISIBLE,r.findViewWithTag(tag).getVisibility());assertEquals("Retained query",input.getText().toString());
   layout(r,400,600);assertEquals(View.VISIBLE,r.findViewWithTag("panelArchive").getVisibility());assertNotNull(r.findViewWithTag("exitSerKal"));
  }finally{c.destroy();}
 }
 EditText findEdit(View v){if(v instanceof EditText)return (EditText)v;if(v instanceof ViewGroup)for(int n=0;n<((ViewGroup)v).getChildCount();n++){EditText e=findEdit(((ViewGroup)v).getChildAt(n));if(e!=null)return e;}return null;}
 @Test @Config(qualifiers="sw400dp-w900dp-h400dp") public void phoneStillPrefersLandscapeAndInsetsAreIdempotent(){
  ActivityController<MainActivity> c=Robolectric.buildActivity(MainActivity.class).create();MainActivity a=c.get();try{
   assertEquals(android.content.pm.ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE,a.getRequestedOrientation());View r=root(a);layout(r,760,400);assertEquals(View.GONE,r.findViewWithTag("adaptiveTabs").getVisibility());layout(r,900,400);int baseLeft=r.getPaddingLeft(),baseBottom=r.getPaddingBottom();
   WindowInsetsCompat safe=new WindowInsetsCompat.Builder().setInsets(WindowInsetsCompat.Type.systemBars(),Insets.of(14,24,10,28)).setInsets(WindowInsetsCompat.Type.displayCutout(),Insets.of(36,0,0,0)).setInsets(WindowInsetsCompat.Type.ime(),Insets.of(0,0,0,180)).build();
   ViewCompat.dispatchApplyWindowInsets(r,safe);assertEquals(baseLeft+36,r.getPaddingLeft());assertEquals(baseBottom+180,r.getPaddingBottom());
   ViewCompat.dispatchApplyWindowInsets(r,safe);assertEquals(baseLeft+36,r.getPaddingLeft());assertEquals(baseBottom+180,r.getPaddingBottom());
   ViewCompat.dispatchApplyWindowInsets(r,new WindowInsetsCompat.Builder().build());assertEquals(baseLeft,r.getPaddingLeft());assertEquals(baseBottom,r.getPaddingBottom());
  }finally{c.destroy();}
 }
}

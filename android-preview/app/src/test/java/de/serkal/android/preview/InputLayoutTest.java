package de.serkal.android.preview;

import android.view.View;
import android.view.ViewGroup;
import android.widget.*;
import android.os.*;
import org.json.*;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.*;
import org.robolectric.android.controller.ActivityController;
import org.robolectric.annotation.*;
import java.lang.reflect.*;
import java.time.Duration;
import static org.junit.Assert.*;

@RunWith(RobolectricTestRunner.class)
@Config(sdk=28)
@LooperMode(LooperMode.Mode.PAUSED)
public class InputLayoutTest {
 Object get(Object object,String name)throws Exception{Field f=object.getClass().getDeclaredField(name);f.setAccessible(true);return f.get(object);}
 void set(Object object,String name,Object value)throws Exception{Field f=object.getClass().getDeclaredField(name);f.setAccessible(true);f.set(object,value);}
 void invoke(MainActivity a,String name)throws Exception{Method m=MainActivity.class.getDeclaredMethod(name);m.setAccessible(true);m.invoke(a);}
 void seed(MainActivity a)throws Exception{
  ((EditText)get(a,"queryField")).setText("Silo");((EditText)get(a,"yearField")).setText("2023");((EditText)get(a,"seasonField")).setText("4");
  ((LinearLayout)get(a,"suggestions")).addView(new TextView(a));set(a,"selectedTmdbId",42);set(a,"selectedDetail",new JSONObject().put("id",42));
 }
 void assertReset(MainActivity a)throws Exception{
  for(String field:new String[]{"queryField","yearField","seasonField"})assertEquals("",((EditText)get(a,field)).getText().toString());
  assertTrue(((EditText)get(a,"queryField")).hasFocus());assertEquals(0,((LinearLayout)get(a,"suggestions")).getChildCount());
  assertEquals(0,get(a,"selectedTmdbId"));assertNull(get(a,"selectedDetail"));assertNull(get(a,"selectedArchiveEntry"));
 }
 @Test public void actionsAreBelowFieldsAndUtilitiesAreBottomLeft()throws Exception{
  ActivityController<MainActivity> c=Robolectric.buildActivity(MainActivity.class).create();MainActivity a=c.get();
  try{
   View root=a.findViewById(android.R.id.content),actions=root.findViewWithTag("searchActions"),prefs=root.findViewWithTag("preferences"),utilities=root.findViewWithTag("utilities");
   ViewGroup left=(ViewGroup)actions.getParent();assertSame(left,prefs.getParent());assertSame(left,utilities.getParent());
   assertEquals(2,left.indexOfChild(actions));assertEquals(left.getChildCount()-1,left.indexOfChild(utilities));
   assertSame(actions,root.findViewWithTag("addToArchive").getParent());
   for(int[] size:new int[][]{{1280,800},{960,600},{800,480}}){
    root.measure(View.MeasureSpec.makeMeasureSpec(size[0],View.MeasureSpec.EXACTLY),View.MeasureSpec.makeMeasureSpec(size[1],View.MeasureSpec.EXACTLY));root.layout(0,0,size[0],size[1]);
    assertTrue(actions.getBottom()<prefs.getTop());assertTrue(prefs.getBottom()<=utilities.getTop());
    for(int i=0;i<((ViewGroup)actions).getChildCount();i++){View button=((ViewGroup)actions).getChildAt(i);assertTrue(button.getWidth()>0);assertTrue(button.getRight()<=actions.getWidth());}
   }
  }finally{c.destroy();}
 }
 @Test public void resetClearsFieldsCancelsPendingSearchAndRestoresFocus()throws Exception{
  ActivityController<MainActivity> c=Robolectric.buildActivity(MainActivity.class).create();MainActivity a=c.get();
  try{
   seed(a);int generation=(Integer)get(a,"requestGeneration");Handler handler=(Handler)get(a,"handler");
   Runnable stale=()->((EditText)getUnchecked(a,"queryField")).setText("late result");set(a,"pendingSearch",stale);handler.postDelayed(stale,450);
   a.findViewById(android.R.id.content).findViewWithTag("resetSearch").performClick();
   Shadows.shadowOf(Looper.getMainLooper()).idleFor(Duration.ofMillis(500));assertReset(a);assertTrue((Integer)get(a,"requestGeneration")>generation);
  }finally{c.destroy();}
 }
 Object getUnchecked(Object object,String name){try{return get(object,name);}catch(Exception e){throw new RuntimeException(e);}}
 @Test public void successfulInsertUsesTheSameReset()throws Exception{
  ActivityController<MainActivity> c=Robolectric.buildActivity(MainActivity.class).create();MainActivity a=c.get();AndroidArchiveCopy copy=null;
  try{
   seed(a);copy=new AndroidArchiveCopy(a,"123","",()->{});
   set(copy,"state",new JSONObject().put("owner","123").put("base","").put("dirty",false).put("epoch",0).put("record",new ArchiveCopyTest().record()));
   set(copy,"loaded",true);set(a,"archiveCopy",copy);assertTrue(copy.writable());
   Method send=MainActivity.class.getDeclaredMethod("sendRequest",String.class,JSONObject.class);send.setAccessible(true);send.invoke(a,"insert",new SeasonInputTest().payload(false));
   assertReset(a);assertEquals(2,ArchiveCodec.entries(((JSONObject)get(copy,"state")).getJSONObject("record")).length());
  }finally{if(copy!=null)copy.close();c.destroy();}
 }
 @Test public void rejectedInsertKeepsTheInputForRetry()throws Exception{
  ActivityController<MainActivity> c=Robolectric.buildActivity(MainActivity.class).create();MainActivity a=c.get();
  try{seed(a);Method send=MainActivity.class.getDeclaredMethod("sendRequest",String.class,JSONObject.class);send.setAccessible(true);send.invoke(a,"insert",new JSONObject());assertEquals("Silo",((EditText)get(a,"queryField")).getText().toString());}
  finally{c.destroy();}
 }
}

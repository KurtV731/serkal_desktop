package de.serkal.android.preview;

import android.view.View;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import org.json.JSONArray;
import org.json.JSONObject;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.Robolectric;
import org.robolectric.android.controller.ActivityController;
import org.robolectric.annotation.Config;
import org.robolectric.annotation.LooperMode;
import java.lang.reflect.Field;
import java.lang.reflect.Method;
import static org.junit.Assert.*;

@RunWith(org.robolectric.RobolectricTestRunner.class)
@Config(sdk=28)
@LooperMode(LooperMode.Mode.PAUSED)
public class ArchiveLayoutTest {
    @Test public void archiveOwnsRemainingHeightOnPhoneAndTablet() throws Exception {
        ActivityController<MainActivity> controller=Robolectric.buildActivity(MainActivity.class).create();
        MainActivity activity=controller.get();
        try {
            JSONArray entries=new JSONArray();
            for(int i=0;i<75;i++) entries.put(new JSONObject().put("title","Series "+i).put("fileName","Series "+i+".txt").put("seasonLabel","S01").put("tmdbId",i+1).put("dates",new JSONArray().put("2026-01-01")).put("seen",1));
            Field snapshot=MainActivity.class.getDeclaredField("archiveSnapshot");snapshot.setAccessible(true);snapshot.set(activity,new JSONObject().put("entries",entries));
            Method render=MainActivity.class.getDeclaredMethod("renderArchive");render.setAccessible(true);render.invoke(activity);
            Field rowsField=MainActivity.class.getDeclaredField("archiveRows");rowsField.setAccessible(true);
            LinearLayout rows=(LinearLayout)rowsField.get(activity);
            ScrollView scroll=(ScrollView)rows.getParent();
            LinearLayout panel=(LinearLayout)scroll.getParent();
            View root=activity.findViewById(android.R.id.content);
            for(int[] size:new int[][]{{1280,800},{960,600},{800,480}}){
                root.measure(View.MeasureSpec.makeMeasureSpec(size[0],View.MeasureSpec.EXACTLY),View.MeasureSpec.makeMeasureSpec(size[1],View.MeasureSpec.EXACTLY));
                root.layout(0,0,size[0],size[1]);
                assertTrue("List must use over 65% of panel at "+size[0]+"x"+size[1]+": "+scroll.getHeight()+"/"+panel.getHeight(),scroll.getHeight()>panel.getHeight()*0.65f);
                for(int i=0;i<panel.getChildCount();i++){
                    View child=panel.getChildAt(i);
                    LinearLayout.LayoutParams params=(LinearLayout.LayoutParams)child.getLayoutParams();
                    if(child!=scroll)assertEquals("Footer must not take a share of remaining height",0f,params.weight,0f);
                }
                assertEquals(75,rows.getChildCount());
                assertTrue("All entries remain in scrollable content",rows.getHeight()>scroll.getHeight());
                scroll.scrollTo(0,rows.getHeight());
                assertTrue("Last entry can be reached",scroll.getScrollY()>0);
            }
        } finally { controller.destroy(); }
    }
}

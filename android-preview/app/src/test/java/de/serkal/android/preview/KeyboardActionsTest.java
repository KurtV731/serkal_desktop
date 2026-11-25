package de.serkal.android.preview;
import android.content.Context;
import android.view.*;
import android.view.inputmethod.*;
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
public class KeyboardActionsTest {
 int generation(MainActivity a)throws Exception{java.lang.reflect.Field f=MainActivity.class.getDeclaredField("requestGeneration");f.setAccessible(true);return f.getInt(a);}
 EditText input(View v){if(v instanceof EditText)return (EditText)v;if(v instanceof ViewGroup)for(int i=0;i<((ViewGroup)v).getChildCount();i++){EditText e=input(((ViewGroup)v).getChildAt(i));if(e!=null)return e;}return null;}
 void focus(MainActivity a,View r,EditText e){e.requestFocus();((InputMethodManager)a.getSystemService(Context.INPUT_METHOD_SERVICE)).showSoftInput(e,0);ViewCompat.dispatchApplyWindowInsets(r,new WindowInsetsCompat.Builder().setInsets(WindowInsetsCompat.Type.ime(),Insets.of(0,0,0,180)).setVisible(WindowInsetsCompat.Type.ime(),true).build());}
 @Test public void explicitActionsCloseKeyboardButCloseButtonDoesNotSearch()throws Exception{
  ActivityController<MainActivity> c=Robolectric.buildActivity(MainActivity.class).create();MainActivity a=c.get();try{
   View root=a.findViewById(android.R.id.content).findViewWithTag("insetRoot");EditText e=input(root.findViewWithTag("panelSearch"));e.setText("T");
   focus(a,root,e);assertEquals(View.VISIBLE,root.findViewWithTag("closeKeyboard").getVisibility());int before=generation(a);root.findViewWithTag("closeKeyboard").performClick();assertEquals(before,generation(a));assertFalse(e.hasFocus());assertEquals("T",e.getText().toString());
   focus(a,root,e);before=generation(a);e.onEditorAction(EditorInfo.IME_ACTION_SEARCH);assertEquals(before+1,generation(a));assertFalse(e.hasFocus());
   focus(a,root,e);before=generation(a);root.findViewWithTag("submitSearch").performClick();assertEquals(before+1,generation(a));assertFalse(e.hasFocus());
   assertFalse(Shadows.shadowOf((InputMethodManager)a.getSystemService(Context.INPUT_METHOD_SERVICE)).isSoftInputVisible());
  }finally{c.destroy();}
 }
 @Test public void automaticSearchKeepsFocusAndHiddenImeRemovesCloseButton()throws Exception{
  ActivityController<MainActivity> c=Robolectric.buildActivity(MainActivity.class).create();MainActivity a=c.get();try{
   View root=a.findViewById(android.R.id.content).findViewWithTag("insetRoot");EditText e=input(root.findViewWithTag("panelSearch"));e.setText("T");focus(a,root,e);
   java.lang.reflect.Method auto=MainActivity.class.getDeclaredMethod("searchNow");auto.setAccessible(true);auto.invoke(a);assertTrue(e.hasFocus());
   assertTrue(Shadows.shadowOf((InputMethodManager)a.getSystemService(Context.INPUT_METHOD_SERVICE)).isSoftInputVisible());
   ViewCompat.dispatchApplyWindowInsets(root,new WindowInsetsCompat.Builder().build());assertEquals(View.GONE,root.findViewWithTag("closeKeyboard").getVisibility());
  }finally{c.destroy();}
 }
}

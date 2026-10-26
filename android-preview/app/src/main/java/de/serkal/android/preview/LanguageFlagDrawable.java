package de.serkal.android.preview;

import android.graphics.*;
import android.graphics.drawable.Drawable;

/** Fixed flag artwork: independent of the device's emoji font. */
final class LanguageFlagDrawable extends Drawable {
    private final boolean english;
    private final Paint paint=new Paint(Paint.ANTI_ALIAS_FLAG);
    LanguageFlagDrawable(boolean english){this.english=english;}
    private void rect(Canvas c,int color,float l,float t,float r,float b){paint.setColor(color);paint.setStyle(Paint.Style.FILL);c.drawRect(l,t,r,b,paint);}
    private void line(Canvas c,int color,float width,float x1,float y1,float x2,float y2){paint.setColor(color);paint.setStrokeWidth(width);paint.setStyle(Paint.Style.STROKE);c.drawLine(x1,y1,x2,y2,paint);}
    @Override public void draw(Canvas c){
        Rect b=getBounds();int save=c.save();c.translate(b.left,b.top);c.scale(b.width()/60f,b.height()/36f);c.clipRect(0,0,60,36);
        if(english){
            rect(c,Color.rgb(1,33,105),0,0,60,36);
            line(c,Color.WHITE,8,0,0,60,36);line(c,Color.WHITE,8,60,0,0,36);
            line(c,Color.rgb(200,16,46),4,0,0,60,36);line(c,Color.rgb(200,16,46),4,60,0,0,36);
            rect(c,Color.WHITE,24,0,36,36);rect(c,Color.WHITE,0,12,60,24);
            rect(c,Color.rgb(200,16,46),26.5f,0,33.5f,36);rect(c,Color.rgb(200,16,46),0,14.5f,60,21.5f);
        }else{rect(c,Color.BLACK,0,0,60,12);rect(c,Color.rgb(221,0,0),0,12,60,24);rect(c,Color.rgb(255,206,0),0,24,60,36);}
        paint.setStyle(Paint.Style.STROKE);paint.setColor(Color.GRAY);paint.setStrokeWidth(1);c.drawRect(0,0,60,36,paint);c.restoreToCount(save);
    }
    @Override public int getIntrinsicWidth(){return 30;}
    @Override public int getIntrinsicHeight(){return 18;}
    @Override public void setAlpha(int alpha){paint.setAlpha(alpha);invalidateSelf();}
    @Override public void setColorFilter(ColorFilter filter){paint.setColorFilter(filter);invalidateSelf();}
    @Override public int getOpacity(){return PixelFormat.OPAQUE;}
}

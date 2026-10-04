package de.serkal.android.preview;

import android.content.Context;
import android.util.AttributeSet;
import android.view.GestureDetector;
import android.view.MotionEvent;
import android.view.ScaleGestureDetector;
import android.view.View;
import android.widget.FrameLayout;

/**
 * Kleine, abhaengigkeitsfreie Zoom-/Verschiebeebene fuer die Android-Vorschau.
 * Bei 100 % bleiben alle Bedienelemente normal anklickbar. Nach dem Hineinzoomen
 * verschiebt ein Finger die Ansicht; Doppeltippen oder die 100-%-Taste setzt sie zurueck.
 */
public class ZoomPanLayout extends FrameLayout {
    public interface OnScaleChangedListener { void onScaleChanged(float scale); }

    private static final float MIN_SCALE = 1.0f;
    private static final float MAX_SCALE = 3.0f;
    private final ScaleGestureDetector scaleDetector;
    private final GestureDetector gestureDetector;
    private float scale = 1.0f;
    private float translationX = 0.0f;
    private float translationY = 0.0f;
    private float lastX;
    private float lastY;
    private boolean childGestureCancelled;
    private OnScaleChangedListener scaleChangedListener;

    public ZoomPanLayout(Context context) { this(context, null); }

    public ZoomPanLayout(Context context, AttributeSet attrs) {
        super(context, attrs);
        setClipChildren(true);
        setClipToPadding(true);

        scaleDetector = new ScaleGestureDetector(context, new ScaleGestureDetector.SimpleOnScaleGestureListener() {
            @Override public boolean onScaleBegin(ScaleGestureDetector detector) {
                cancelChildGesture_();
                return true;
            }

            @Override public boolean onScale(ScaleGestureDetector detector) {
                float oldScale = scale;
                float nextScale = clamp_(oldScale * detector.getScaleFactor(), MIN_SCALE, MAX_SCALE);
                if (Math.abs(nextScale - oldScale) < 0.001f) return true;

                float contentX = (detector.getFocusX() - translationX) / oldScale;
                float contentY = (detector.getFocusY() - translationY) / oldScale;
                scale = nextScale;
                translationX = detector.getFocusX() - contentX * scale;
                translationY = detector.getFocusY() - contentY * scale;
                applyTransform_();
                return true;
            }
        });

        gestureDetector = new GestureDetector(context, new GestureDetector.SimpleOnGestureListener() {
            @Override public boolean onDoubleTap(MotionEvent event) {
                reset();
                return true;
            }
        });
    }

    public void setOnScaleChangedListener(OnScaleChangedListener listener) {
        scaleChangedListener = listener;
        notifyScale_();
    }

    public void reset() {
        scale = 1.0f;
        translationX = 0.0f;
        translationY = 0.0f;
        applyTransform_();
    }

    public float getContentScale() { return scale; }

    @Override public boolean dispatchTouchEvent(MotionEvent event) {
        boolean gestureHandled = gestureDetector.onTouchEvent(event);
        scaleDetector.onTouchEvent(event);

        // Ein Doppeltipp setzt zurueck und darf nicht zusaetzlich die darunter
        // liegende Schaltflaeche ausloesen.
        if (gestureHandled) return true;

        if (event.getActionMasked() == MotionEvent.ACTION_DOWN) {
            lastX = event.getX();
            lastY = event.getY();
            childGestureCancelled = false;
        }

        if (event.getPointerCount() > 1 || scaleDetector.isInProgress()) {
            cancelChildGesture_();
            return true;
        }

        if (scale > MIN_SCALE + 0.001f) {
            if (event.getActionMasked() == MotionEvent.ACTION_MOVE) {
                float x = event.getX();
                float y = event.getY();
                translationX += x - lastX;
                translationY += y - lastY;
                lastX = x;
                lastY = y;
                applyTransform_();
            }
            return true;
        }

        return super.dispatchTouchEvent(event);
    }

    @Override protected void onSizeChanged(int w, int h, int oldw, int oldh) {
        super.onSizeChanged(w, h, oldw, oldh);
        applyTransform_();
    }

    private void cancelChildGesture_() {
        if (childGestureCancelled) return;
        childGestureCancelled = true;
        long now = android.os.SystemClock.uptimeMillis();
        MotionEvent cancel = MotionEvent.obtain(now, now, MotionEvent.ACTION_CANCEL, lastX, lastY, 0);
        super.dispatchTouchEvent(cancel);
        cancel.recycle();
    }

    private void applyTransform_() {
        if (getChildCount() == 0) return;
        View content = getChildAt(0);
        float minX = getWidth() - getWidth() * scale;
        float minY = getHeight() - getHeight() * scale;
        translationX = clamp_(translationX, minX, 0.0f);
        translationY = clamp_(translationY, minY, 0.0f);
        content.setPivotX(0.0f);
        content.setPivotY(0.0f);
        content.setScaleX(scale);
        content.setScaleY(scale);
        content.setTranslationX(translationX);
        content.setTranslationY(translationY);
        notifyScale_();
    }

    private void notifyScale_() {
        if (scaleChangedListener != null) scaleChangedListener.onScaleChanged(scale);
    }

    private static float clamp_(float value, float minimum, float maximum) {
        return Math.max(minimum, Math.min(maximum, value));
    }
}

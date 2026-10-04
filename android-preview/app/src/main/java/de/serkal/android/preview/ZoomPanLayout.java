package de.serkal.android.preview;

import android.content.Context;
import android.util.AttributeSet;
import android.view.GestureDetector;
import android.view.MotionEvent;
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
    private final GestureDetector gestureDetector;
    private float scale = 1.0f;
    private float translationX = 0.0f;
    private float translationY = 0.0f;
    private float lastX;
    private float lastY;
    private boolean childGestureCancelled;
    private boolean pinching;
    private float pinchStartSpan;
    private float pinchStartScale;
    private float pinchStartFocusX;
    private float pinchStartFocusY;
    private float pinchStartTranslationX;
    private float pinchStartTranslationY;
    private OnScaleChangedListener scaleChangedListener;

    public ZoomPanLayout(Context context) { this(context, null); }

    public ZoomPanLayout(Context context, AttributeSet attrs) {
        super(context, attrs);
        setClipChildren(true);
        setClipToPadding(true);

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

    public void zoomBy(float factor) {
        float nextScale = clamp_(scale * factor, MIN_SCALE, MAX_SCALE);
        float focusX = getWidth() / 2.0f;
        float focusY = getHeight() / 2.0f;
        float contentX = (focusX - translationX) / scale;
        float contentY = (focusY - translationY) / scale;
        scale = nextScale;
        translationX = focusX - contentX * scale;
        translationY = focusY - contentY * scale;
        applyTransform_();
    }

    @Override public boolean dispatchTouchEvent(MotionEvent event) {
        boolean gestureHandled = gestureDetector.onTouchEvent(event);
        // Ein Doppeltipp setzt zurueck und darf nicht zusaetzlich die darunter
        // liegende Schaltflaeche ausloesen.
        if (gestureHandled) return true;

        if (event.getActionMasked() == MotionEvent.ACTION_DOWN) {
            lastX = event.getX();
            lastY = event.getY();
            childGestureCancelled = false;
            pinching = false;
        }

        if (event.getActionMasked() == MotionEvent.ACTION_POINTER_DOWN && event.getPointerCount() >= 2) {
            cancelChildGesture_();
            pinching = true;
            pinchStartSpan = span_(event);
            pinchStartScale = scale;
            pinchStartFocusX = focusX_(event);
            pinchStartFocusY = focusY_(event);
            pinchStartTranslationX = translationX;
            pinchStartTranslationY = translationY;
            return true;
        }

        if (pinching && event.getPointerCount() >= 2 && event.getActionMasked() == MotionEvent.ACTION_MOVE) {
            float span = span_(event);
            if (pinchStartSpan > 0.0f) {
                scale = clamp_(pinchStartScale * span / pinchStartSpan, MIN_SCALE, MAX_SCALE);
                float contentX = (pinchStartFocusX - pinchStartTranslationX) / pinchStartScale;
                float contentY = (pinchStartFocusY - pinchStartTranslationY) / pinchStartScale;
                translationX = focusX_(event) - contentX * scale;
                translationY = focusY_(event) - contentY * scale;
                applyTransform_();
            }
            return true;
        }

        if (pinching && (event.getActionMasked() == MotionEvent.ACTION_POINTER_UP ||
                event.getActionMasked() == MotionEvent.ACTION_UP ||
                event.getActionMasked() == MotionEvent.ACTION_CANCEL)) {
            pinching = false;
            lastX = event.getX();
            lastY = event.getY();
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

    private static float span_(MotionEvent event) {
        float dx = event.getX(0) - event.getX(1);
        float dy = event.getY(0) - event.getY(1);
        return (float) Math.sqrt(dx * dx + dy * dy);
    }

    private static float focusX_(MotionEvent event) {
        return (event.getX(0) + event.getX(1)) / 2.0f;
    }

    private static float focusY_(MotionEvent event) {
        return (event.getY(0) + event.getY(1)) / 2.0f;
    }

    private static float clamp_(float value, float minimum, float maximum) {
        return Math.max(minimum, Math.min(maximum, value));
    }
}

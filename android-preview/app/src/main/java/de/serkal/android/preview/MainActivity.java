package de.serkal.android.preview;

import android.app.Activity;
import android.graphics.Color;
import android.graphics.Typeface;
import android.os.Build;
import android.os.Bundle;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;

public class MainActivity extends Activity {
    private static final int BG = Color.rgb(8, 13, 18);
    private static final int PANEL = Color.rgb(18, 27, 36);
    private static final int CARD = Color.rgb(27, 39, 51);
    private static final int TEXT = Color.rgb(232, 239, 245);
    private static final int MUTED = Color.rgb(151, 167, 181);
    private static final int BLUE = Color.rgb(80, 167, 238);
    private static final int RED = Color.rgb(215, 75, 75);
    private boolean english = false;
    private ZoomPanLayout zoomSurface;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        try {
            configureFullscreen_();
            buildScreen();
        } catch (Throwable error) {
            showStartupError_(error);
        }
    }

    @Override public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) hideSystemBars_();
    }

    private void configureFullscreen_() {
        Window window = getWindow();
        window.setStatusBarColor(BG);
        window.setNavigationBarColor(BG);
        hideSystemBars_();
    }

    private void hideSystemBars_() {
        getWindow().getDecorView().setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY |
            View.SYSTEM_UI_FLAG_FULLSCREEN |
            View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
        );
    }

    private void showStartupError_(Throwable error) {
        TextView message = text("SerKal 0.0.4f3\n\nStartfehler: " + error.getClass().getSimpleName() +
            "\n" + String.valueOf(error.getMessage()), 15, Color.WHITE);
        message.setBackgroundColor(Color.rgb(80, 0, 0));
        message.setPadding(dp(24), dp(24), dp(24), dp(24));
        setContentView(message);
    }

    private int dp(int value) {
        return Math.round(value * getResources().getDisplayMetrics().density);
    }

    private TextView text(String value, float size, int color) {
        TextView view = new TextView(this);
        view.setText(value);
        // DIP statt SP: Die Vorschau bleibt auch bei großer Android-Systemschrift kompakt.
        view.setTextSize(TypedValue.COMPLEX_UNIT_DIP, size);
        view.setTextColor(color);
        view.setIncludeFontPadding(false);
        view.setPadding(dp(5), dp(3), dp(5), dp(3));
        return view;
    }

    private TextView heading(String value) {
        TextView view = text(value, 10, TEXT);
        view.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        view.setBackgroundColor(Color.rgb(13, 21, 29));
        return view;
    }

    private TextView row(String value, boolean selected) {
        TextView view = text(value, 8.5f, TEXT);
        view.setBackgroundColor(selected ? Color.rgb(34, 71, 99) : CARD);
        LinearLayout.LayoutParams p = new LinearLayout.LayoutParams(-1, -2);
        p.setMargins(0, 0, 0, dp(2));
        view.setLayoutParams(p);
        return view;
    }

    private LinearLayout panel(int weight) {
        LinearLayout p = new LinearLayout(this);
        p.setOrientation(LinearLayout.VERTICAL);
        p.setPadding(dp(5), dp(5), dp(5), dp(5));
        p.setBackgroundColor(PANEL);
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(0, -1, weight);
        lp.setMargins(dp(3), 0, dp(3), 0);
        p.setLayoutParams(lp);
        return p;
    }

    private Button button(String label) {
        Button b = new Button(this);
        b.setText(label);
        b.setTextSize(TypedValue.COMPLEX_UNIT_DIP, 7.5f);
        b.setIncludeFontPadding(false);
        b.setMinHeight(0);
        b.setMinimumHeight(0);
        b.setPadding(dp(3), 0, dp(3), 0);
        b.setTextColor(TEXT);
        b.setAllCaps(false);
        b.setBackgroundColor(Color.rgb(38, 70, 94));
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(0, dp(30), 1);
        lp.setMargins(dp(2), dp(3), dp(2), dp(3));
        b.setLayoutParams(lp);
        return b;
    }

    private void buildScreen() {
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(BG);
        root.setPadding(dp(4), dp(3), dp(4), dp(4));

        LinearLayout top = new LinearLayout(this);
        top.setGravity(Gravity.CENTER_VERTICAL);
        TextView title = text("SerKal", 13, TEXT);
        title.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        top.addView(title, new LinearLayout.LayoutParams(0, dp(31), 1));
        TextView preview = text(english ? "0.0.4f3 · pinch to zoom · drag to move" : "0.0.4f3 · mit 2 Fingern zoomen · mit 1 Finger bewegen", 7.5f, MUTED);
        preview.setGravity(Gravity.CENTER_VERTICAL | Gravity.RIGHT);
        top.addView(preview, new LinearLayout.LayoutParams(-2, dp(31)));
        Button zoomOut = new Button(this);
        zoomOut.setText("−");
        styleTopButton_(zoomOut);
        zoomOut.setOnClickListener(v -> { if (zoomSurface != null) zoomSurface.zoomBy(0.8f); });
        top.addView(zoomOut, new LinearLayout.LayoutParams(dp(38), dp(28)));
        Button resetZoom = new Button(this);
        resetZoom.setText("100 %");
        styleTopButton_(resetZoom);
        resetZoom.setOnClickListener(v -> { if (zoomSurface != null) zoomSurface.reset(); });
        top.addView(resetZoom, new LinearLayout.LayoutParams(dp(58), dp(28)));
        Button zoomIn = new Button(this);
        zoomIn.setText("+");
        styleTopButton_(zoomIn);
        zoomIn.setOnClickListener(v -> { if (zoomSurface != null) zoomSurface.zoomBy(1.25f); });
        top.addView(zoomIn, new LinearLayout.LayoutParams(dp(38), dp(28)));
        Button language = new Button(this);
        language.setText(english ? "DE" : "EN");
        styleTopButton_(language);
        language.setOnClickListener(v -> { english = !english; buildScreen(); });
        language.setMinHeight(0);
        language.setMinimumHeight(0);
        top.addView(language, new LinearLayout.LayoutParams(dp(42), dp(28)));
        root.addView(top);

        zoomSurface = new ZoomPanLayout(this);
        zoomSurface.setBackgroundColor(BG);
        zoomSurface.setOnScaleChangedListener(value -> resetZoom.setText(Math.round(value * 100) + " %"));
        LinearLayout columns = new LinearLayout(this);
        columns.setOrientation(LinearLayout.HORIZONTAL);
        zoomSurface.addView(columns, new ZoomPanLayout.LayoutParams(-1, -1));
        root.addView(zoomSurface, new LinearLayout.LayoutParams(-1, 0, 1));

        // Verbindliche Reihenfolge wie am Desktop: Suche – Anzeige/Bearbeitung – Archiv.
        LinearLayout left = panel(29);
        left.addView(heading(english ? "SEARCH / CALENDAR" : "SUCHE / KALENDER"));
        left.addView(text(english ? "Search for a series" : "Serie suchen", 8.5f, MUTED));
        left.addView(row("Lucky", true));
        left.addView(row("Lucky Hank", false));
        left.addView(row("The Luckiest Man", false));
        left.addView(text(english ? "NEXT DATES" : "NÄCHSTE TERMINE", 8.5f, BLUE));
        left.addView(row(english ? "24 Sep · Lucky · Episode 7" : "24. Sep · Lucky · Folge 7", false));
        left.addView(row(english ? "01 Oct · Lucky · Episode 8" : "01. Okt · Lucky · Folge 8", false));
        TextView note = text(english ? "Display test only — no archive or calendar is changed." : "Nur Darstellungstest – Archiv und Kalender werden nicht verändert.", 7.5f, Color.rgb(255, 202, 112));
        left.addView(note, new LinearLayout.LayoutParams(-1, 0, 1));
        LinearLayout leftButtons = new LinearLayout(this);
        leftButtons.addView(button(english ? "Search" : "Suchen"));
        leftButtons.addView(button(english ? "Add" : "Eintragen"));
        left.addView(leftButtons);
        columns.addView(left);

        LinearLayout middle = panel(43);
        middle.addView(heading(english ? "ENTRY" : "EINTRAG"));
        TextView name = text("Lucky", 14, TEXT);
        name.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        middle.addView(name);
        middle.addView(text(english ? "Drama · United Kingdom · 2024" : "Drama · Großbritannien · 2024", 8, MUTED));
        TextView poster = text(english ? "POSTER\npreview area" : "POSTER\nVorschaubereich", 10, MUTED);
        poster.setGravity(Gravity.CENTER);
        poster.setBackgroundColor(Color.rgb(31, 45, 58));
        middle.addView(poster, new LinearLayout.LayoutParams(-1, 0, 1));
        LinearLayout facts = new LinearLayout(this);
        facts.setOrientation(LinearLayout.HORIZONTAL);
        facts.addView(text(english ? "Season 1" : "Staffel 1", 8.5f, TEXT), new LinearLayout.LayoutParams(0, -2, 1));
        facts.addView(text(english ? "8 episodes" : "8 Folgen", 8.5f, TEXT), new LinearLayout.LayoutParams(0, -2, 1));
        facts.addView(text(english ? "Status: running" : "Status: läuft", 8.5f, TEXT), new LinearLayout.LayoutParams(0, -2, 1));
        middle.addView(facts);
        LinearLayout buttons = new LinearLayout(this);
        buttons.addView(button(english ? "Refresh" : "Aktualisieren"));
        buttons.addView(button(english ? "Correct" : "Korrigieren"));
        Button delete = button(english ? "Delete" : "Löschen");
        delete.setTextColor(Color.rgb(255, 215, 215));
        buttons.addView(delete);
        middle.addView(buttons);
        columns.addView(middle);

        LinearLayout right = panel(28);
        right.addView(heading(english ? "ARCHIVE · 77 series" : "ARCHIV · 77 Serien"));
        String[] series = {"1923", "A Gentleman in Moscow", "Adolescence", "Alien: Earth", "Andor", "Black Snow", "Dark Winds", "Dexter: Resurrection", "Fallout", "High Potential", "Lucky", "Paradise", "Reacher", "The Last of Us"};
        ScrollView listScroll = new ScrollView(this);
        LinearLayout list = new LinearLayout(this);
        list.setOrientation(LinearLayout.VERTICAL);
        for (String s : series) list.addView(row(s, s.equals("Lucky")));
        listScroll.addView(list);
        right.addView(listScroll, new LinearLayout.LayoutParams(-1, 0, 1));
        columns.addView(right);

        setContentView(root);
    }

    private void styleTopButton_(Button button) {
        button.setTextSize(TypedValue.COMPLEX_UNIT_DIP, 8);
        button.setTextColor(Color.BLACK);
        button.setBackgroundColor(Color.WHITE);
        button.setAllCaps(false);
        button.setMinHeight(0);
        button.setMinimumHeight(0);
        button.setPadding(dp(2), 0, dp(2), 0);
    }
}

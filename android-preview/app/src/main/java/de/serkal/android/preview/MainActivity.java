package de.serkal.android.preview;

import android.app.Activity;
import android.graphics.Color;
import android.graphics.Typeface;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.widget.Button;
import android.widget.HorizontalScrollView;
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

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        buildScreen();
    }

    private int dp(int value) {
        return Math.round(value * getResources().getDisplayMetrics().density);
    }

    private TextView text(String value, float size, int color) {
        TextView view = new TextView(this);
        view.setText(value);
        view.setTextSize(size);
        view.setTextColor(color);
        view.setPadding(dp(8), dp(5), dp(8), dp(5));
        return view;
    }

    private TextView heading(String value) {
        TextView view = text(value, 16, TEXT);
        view.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        view.setBackgroundColor(Color.rgb(13, 21, 29));
        return view;
    }

    private TextView row(String value, boolean selected) {
        TextView view = text(value, 13, TEXT);
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
        b.setTextSize(11);
        b.setTextColor(TEXT);
        b.setAllCaps(false);
        b.setBackgroundColor(Color.rgb(38, 70, 94));
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(0, dp(42), 1);
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
        TextView title = text("SerKal", 19, TEXT);
        title.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        top.addView(title, new LinearLayout.LayoutParams(0, dp(42), 1));
        TextView preview = text(english ? "Android preview 0.0.2 · landscape" : "Android-Präversion 0.0.2 · Querformat", 11, MUTED);
        preview.setGravity(Gravity.CENTER_VERTICAL | Gravity.RIGHT);
        top.addView(preview, new LinearLayout.LayoutParams(-2, dp(42)));
        Button language = new Button(this);
        language.setText(english ? "DE" : "EN");
        language.setTextSize(11);
        language.setTextColor(TEXT);
        language.setAllCaps(false);
        language.setOnClickListener(v -> { english = !english; buildScreen(); });
        top.addView(language, new LinearLayout.LayoutParams(dp(56), dp(38)));
        root.addView(top);

        LinearLayout columns = new LinearLayout(this);
        columns.setOrientation(LinearLayout.HORIZONTAL);
        root.addView(columns, new LinearLayout.LayoutParams(-1, 0, 1));

        LinearLayout left = panel(28);
        left.addView(heading(english ? "ARCHIVE · 77 series" : "ARCHIV · 77 Serien"));
        String[] series = {"1923", "A Gentleman in Moscow", "Adolescence", "Alien: Earth", "Andor", "Black Snow", "Dark Winds", "Dexter: Resurrection", "Fallout", "High Potential", "Lucky", "Paradise", "Reacher", "The Last of Us"};
        ScrollView listScroll = new ScrollView(this);
        LinearLayout list = new LinearLayout(this);
        list.setOrientation(LinearLayout.VERTICAL);
        for (String s : series) list.addView(row(s, s.equals("Lucky")));
        listScroll.addView(list);
        left.addView(listScroll, new LinearLayout.LayoutParams(-1, 0, 1));
        columns.addView(left);

        LinearLayout middle = panel(43);
        middle.addView(heading(english ? "ENTRY" : "EINTRAG"));
        TextView name = text("Lucky", 22, TEXT);
        name.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        middle.addView(name);
        middle.addView(text(english ? "Drama · United Kingdom · 2024" : "Drama · Großbritannien · 2024", 12, MUTED));
        TextView poster = text(english ? "POSTER\npreview area" : "POSTER\nVorschaubereich", 16, MUTED);
        poster.setGravity(Gravity.CENTER);
        poster.setBackgroundColor(Color.rgb(31, 45, 58));
        middle.addView(poster, new LinearLayout.LayoutParams(-1, 0, 1));
        LinearLayout facts = new LinearLayout(this);
        facts.setOrientation(LinearLayout.HORIZONTAL);
        facts.addView(text(english ? "Season 1" : "Staffel 1", 13, TEXT), new LinearLayout.LayoutParams(0, -2, 1));
        facts.addView(text(english ? "8 episodes" : "8 Folgen", 13, TEXT), new LinearLayout.LayoutParams(0, -2, 1));
        facts.addView(text(english ? "Status: running" : "Status: läuft", 13, TEXT), new LinearLayout.LayoutParams(0, -2, 1));
        middle.addView(facts);
        LinearLayout buttons = new LinearLayout(this);
        buttons.addView(button(english ? "Refresh" : "Aktualisieren"));
        buttons.addView(button(english ? "Correct" : "Korrigieren"));
        Button delete = button(english ? "Delete" : "Löschen");
        delete.setTextColor(Color.rgb(255, 215, 215));
        buttons.addView(delete);
        middle.addView(buttons);
        columns.addView(middle);

        LinearLayout right = panel(29);
        right.addView(heading(english ? "SEARCH / CALENDAR" : "SUCHE / KALENDER"));
        right.addView(text(english ? "Search for a series" : "Serie suchen", 13, MUTED));
        right.addView(row("Lucky", true));
        right.addView(row("Lucky Hank", false));
        right.addView(row("The Luckiest Man", false));
        right.addView(text(english ? "NEXT DATES" : "NÄCHSTE TERMINE", 13, BLUE));
        right.addView(row(english ? "24 Sep · Lucky · Episode 7" : "24. Sep · Lucky · Folge 7", false));
        right.addView(row(english ? "01 Oct · Lucky · Episode 8" : "01. Okt · Lucky · Folge 8", false));
        TextView note = text(english ? "Display test only — no archive or calendar is changed." : "Nur Darstellungstest – Archiv und Kalender werden nicht verändert.", 11, Color.rgb(255, 202, 112));
        right.addView(note, new LinearLayout.LayoutParams(-1, 0, 1));
        LinearLayout rightButtons = new LinearLayout(this);
        rightButtons.addView(button(english ? "Search" : "Suchen"));
        rightButtons.addView(button(english ? "Add" : "Eintragen"));
        right.addView(rightButtons);
        columns.addView(right);

        setContentView(root);
    }
}

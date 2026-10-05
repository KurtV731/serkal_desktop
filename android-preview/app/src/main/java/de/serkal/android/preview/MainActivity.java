package de.serkal.android.preview;

import android.app.Activity;
import android.app.AlertDialog;
import android.widget.EditText;
import android.text.TextWatcher;
import android.text.Editable;
import android.text.InputType;
import android.os.Handler;
import android.os.Looper;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import org.json.JSONObject;
import java.util.List;
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
    private final Handler handler = new Handler(Looper.getMainLooper());
    private final ExecutorService network = Executors.newSingleThreadExecutor();
    private int requestGeneration = 0;
    private String credential = "";
    private EditText queryField;
    private LinearLayout suggestions;
    private TextView statusText, selectedName, selectedInfo;
    private Runnable pendingSearch;
    private int selectedTmdbId;

    @Override protected void onDestroy() {
        requestGeneration++;
        handler.removeCallbacksAndMessages(null);
        network.shutdownNow();
        super.onDestroy();
    }

    private void askForKey() {
        EditText input = new EditText(this);
        input.setTextColor(Color.BLACK);
        input.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_PASSWORD);
        new AlertDialog.Builder(this)
            .setTitle(english ? "TMDB API key / read access token" : "TMDB API-Key / Lesezugriffstoken")
            .setView(input)
            .setPositiveButton(english ? "Check" : "Prüfen", (dialog, which) -> {
                String candidate = input.getText().toString().trim();
                if (candidate.isEmpty()) return;
                final int generation = ++requestGeneration;
                statusText.setText(english ? "Checking key…" : "Schlüssel wird geprüft…");
                network.execute(() -> {
                    try {
                        new TmdbClient(candidate).validate();
                        handler.post(() -> {
                            if (generation != requestGeneration) return;
                            credential = candidate;
                            statusText.setText(english ? "Key accepted. Enter a series." : "Schlüssel gültig. Serie eingeben.");
                            searchNow();
                        });
                    } catch (Exception error) { showNetworkError(generation, error); }
                });
            })
            .setNegativeButton(english ? "Cancel" : "Abbrechen", null).show();
    }

    private void showNetworkError(int generation, Exception error) {
        String code = error.getMessage();
        handler.post(() -> {
            if (generation != requestGeneration) return;
            statusText.setText("KEY".equals(code)
                ? (english ? "TMDB key rejected. Check the key." : "TMDB-Schlüssel abgelehnt. Bitte prüfen.")
                : (english ? "TMDB unavailable. Please retry." : "TMDB nicht erreichbar. Bitte erneut versuchen."));
        });
    }

    private void searchNow() {
        if (pendingSearch != null) handler.removeCallbacks(pendingSearch);
        final String query = queryField.getText().toString().trim();
        final int generation = ++requestGeneration;
        final boolean language = english;
        suggestions.removeAllViews();
        selectedTmdbId = 0;
        selectedName.setText(english ? "Select a series" : "Serie auswählen");
        selectedInfo.setText("");
        if (query.length() < 2) return;
        if (credential.isEmpty()) { askForKey(); return; }
        final String key = credential;
        statusText.setText(english ? "Searching…" : "Suche läuft…");
        network.execute(() -> {
            try {
                List<JSONObject> results = new TmdbClient(key).search(query, language);
                handler.post(() -> {
                    if (generation != requestGeneration) return;
                    statusText.setText(results.isEmpty()
                        ? (english ? "No results found." : "Keine Ergebnisse gefunden.")
                        : (english ? "Tap a series." : "Serie antippen."));
                    for (JSONObject entry : results) {
                        String date = entry.optString("first_air_date");
                        TextView result = row(entry.optString("name") +
                            (date.length() >= 4 ? " · " + date.substring(0, 4) : ""), false);
                        result.setMinHeight(dp(40));
                        result.setOnClickListener(v -> selectSeries(entry, key, language));
                        suggestions.addView(result);
                    }
                });
            } catch (Exception error) { showNetworkError(generation, error); }
        });
    }

    private void selectSeries(JSONObject entry, String key, boolean language) {
        final int generation = ++requestGeneration;
        final int id = entry.optInt("id");
        selectedName.setText(entry.optString("name"));
        statusText.setText(english ? "Loading series…" : "Serie wird geladen…");
        network.execute(() -> {
            try {
                JSONObject detail = new TmdbClient(key).details(id, language);
                handler.post(() -> {
                    if (generation != requestGeneration) return;
                    selectedTmdbId = id;
                    // Name is display text; the immutable TMDB ID is the identity.
                    selectedName.setText(detail.optString("name", entry.optString("name")));
                    selectedInfo.setText("TMDB " + id + " · " + detail.optInt("number_of_seasons") +
                        (english ? " seasons" : " Staffeln") + "\n" + detail.optString("overview"));
                    statusText.setText(english ? "Series loaded. Shared archive not connected yet."
                        : "Serie geladen. Gemeinsames Archiv noch nicht verbunden.");
                });
            } catch (Exception error) { showNetworkError(generation, error); }
        });
    }
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
        TextView message = text("SerKal 0.0.5-dev\n\nStartfehler: " + error.getClass().getSimpleName() +
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
        requestGeneration++;
        if (pendingSearch != null) handler.removeCallbacks(pendingSearch);
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(BG);
        root.setPadding(dp(4), dp(3), dp(4), dp(4));

        LinearLayout top = new LinearLayout(this);
        top.setGravity(Gravity.CENTER_VERTICAL);
        TextView title = text("SerKal", 13, TEXT);
        title.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        top.addView(title, new LinearLayout.LayoutParams(0, dp(31), 1));
        TextView preview = text(english ? "0.0.5-dev · pinch to zoom · drag to move" : "0.0.5-dev · mit 2 Fingern zoomen · mit 1 Finger bewegen", 7.5f, MUTED);
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
        queryField = new EditText(this);
        queryField.setSingleLine(true);
        queryField.setTextColor(TEXT);
        queryField.setHintTextColor(MUTED);
        queryField.setHint(english ? "Series title" : "Serientitel");
        left.addView(queryField);
        suggestions = new LinearLayout(this);
        suggestions.setOrientation(LinearLayout.VERTICAL);
        ScrollView resultsScroll = new ScrollView(this);
        resultsScroll.addView(suggestions);
        left.addView(resultsScroll, new LinearLayout.LayoutParams(-1, 0, 1));
        statusText = text(english ? "TMDB key required." : "TMDB-Schlüssel erforderlich.", 9, MUTED);
        left.addView(statusText);
        queryField.addTextChangedListener(new TextWatcher() {
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {}
            public void onTextChanged(CharSequence s, int start, int before, int count) {
                requestGeneration++;
                if (pendingSearch != null) handler.removeCallbacks(pendingSearch);
                if (!credential.isEmpty()) {
                    pendingSearch = () -> searchNow();
                    handler.postDelayed(pendingSearch, 450);
                }
            }
            public void afterTextChanged(Editable value) {}
        });
        LinearLayout leftButtons = new LinearLayout(this);
        Button search = button(english ? "Search" : "Suchen");
        search.setOnClickListener(v -> searchNow());
        leftButtons.addView(search);
        Button keyButton = button(english ? "API key" : "API-Key");
        keyButton.setOnClickListener(v -> askForKey());
        leftButtons.addView(keyButton);
        left.addView(leftButtons);
        columns.addView(left);

        LinearLayout middle = panel(43);
        middle.addView(heading(english ? "ENTRY" : "EINTRAG"));
        selectedName = text(english ? "Select a series" : "Serie auswählen", 14, TEXT);
        selectedName.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        middle.addView(selectedName);
        selectedInfo = text("", 11, TEXT);
        ScrollView detailScroll = new ScrollView(this);
        detailScroll.addView(selectedInfo);
        middle.addView(detailScroll, new LinearLayout.LayoutParams(-1, 0, 1));
        Button add = button(english ? "Shared archive pending" : "Archivverbindung folgt");
        add.setEnabled(false);
        middle.addView(add);
        columns.addView(middle);

        LinearLayout right = panel(28);
        right.addView(heading(english ? "SHARED ARCHIVE" : "GEMEINSAMES ARCHIV"));
        right.addView(text(english ? "Google Drive connection is being implemented. No example entries are shown."
            : "Die Google-Drive-Anbindung wird vorbereitet. Hier werden keine Beispieldaten angezeigt.", 11, MUTED));
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


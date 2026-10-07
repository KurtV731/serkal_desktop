package de.serkal.android.preview;

import android.app.Activity;
import com.google.android.gms.auth.api.identity.Identity;
import com.google.android.gms.auth.api.identity.AuthorizationRequest;
import com.google.android.gms.auth.api.identity.AuthorizationResult;
import com.google.android.gms.common.api.Scope;
import com.google.android.gms.common.api.ApiException;
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

    private static final int GOOGLE_REQUEST = 505;
    private String googleAccessToken = "";
    private SharedKeyClient.Result googleUser;
    private boolean googleBusy;
    private int googleGeneration;
    private int pendingGoogleGeneration;

    private void connectGoogle(boolean chooseAccount) {
        if (googleBusy) return;
        requestGeneration++;
        credential = "";
        googleAccessToken = "";
        googleUser = null;
        archiveSnapshot=null; archiveGeneration++; archiveBusy=false; archiveError=""; renderArchive();
        selectedTmdbId=0; selectedInfo.setText(""); selectedName.setText(english ? "Select a series" : "Serie auswählen"); suggestions.removeAllViews();
        googleBusy = true;
        final int generation = ++googleGeneration;
        pendingGoogleGeneration = generation;
        statusText.setText(english ? "Connecting to Google…" : "Google wird verbunden…");
        AuthorizationRequest.Builder builder = AuthorizationRequest.builder().setRequestedScopes(java.util.Arrays.asList(
            new Scope("https://www.googleapis.com/auth/drive.appdata"),
            new Scope("openid"), new Scope("https://www.googleapis.com/auth/userinfo.email")));
        if (chooseAccount) builder.setPrompt(AuthorizationRequest.Prompt.SELECT_ACCOUNT);
        Identity.getAuthorizationClient(this).authorize(builder.build())
            .addOnSuccessListener(result -> {
                if (generation != googleGeneration || isFinishing()) return;
                if (result.hasResolution()) {
                    try { startIntentSenderForResult(result.getPendingIntent().getIntentSender(), GOOGLE_REQUEST, null, 0, 0, 0); }
                    catch (Exception error) { googleFailure(error); }
                } else useGoogleResult(result, generation);
            })
            .addOnFailureListener(error -> { if (generation == googleGeneration) googleFailure(error); });
    }

    @Override protected void onActivityResult(int requestCode, int resultCode, android.content.Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode != GOOGLE_REQUEST) return;
        if (pendingGoogleGeneration != googleGeneration) return;
        if (resultCode != RESULT_OK || data == null) {
            googleBusy = false;
            statusText.setText(english ? "Google connection cancelled." : "Google-Verbindung abgebrochen.");
            return;
        }
        try { useGoogleResult(Identity.getAuthorizationClient(this).getAuthorizationResultFromIntent(data), pendingGoogleGeneration); }
        catch (Exception error) { googleFailure(error); }
    }

    private void useGoogleResult(AuthorizationResult result, int generation) {
        if (!result.getGrantedScopes().contains("https://www.googleapis.com/auth/drive.appdata")) {
            googleFailure(new Exception("GOOGLE_HTTP_403")); return;
        }
        String accessToken = result.getAccessToken();
        if (accessToken == null || accessToken.isEmpty()) { googleFailure(new Exception("GOOGLE_TOKEN_MISSING")); return; }
        googleAccessToken = accessToken;
        network.execute(() -> {
            try {
                SharedKeyClient client = new SharedKeyClient(accessToken);
                SharedKeyClient.Result user = client.identify();
                SharedKeyClient.Result loaded = client.load(user);
                String cached = loaded.key.isEmpty() ? KeyCache.load(this, user.owner) : "";
                if (!loaded.key.isEmpty()) {
                    new TmdbClient(loaded.key).validate();
                    KeyCache.save(this, user.owner, loaded.key);
                }
                handler.post(() -> {
                    if (generation != googleGeneration || isFinishing()) return;
                    googleBusy = false;
                    googleUser = user;
                    loadArchive();
                    if (!loaded.key.isEmpty()) {
                        credential = loaded.key;
                        statusText.setText(user.email + (english ? "\nTMDB key adopted automatically." : "\nTMDB-Schlüssel automatisch übernommen."));
                        if (queryField.getText().length() >= 2) searchNow();
                    } else if (!cached.isEmpty()) {
                        confirmPublish(cached);
                    } else {
                        statusText.setText(user.email + (english
                            ? "\nNo shared key yet. On Desktop use “TMDB · Google”. Then tap Google again."
                            : "\nNoch kein gemeinsamer Schlüssel. Am Desktop „TMDB · Google“ drücken. Danach hier erneut Google antippen."));
                    }
                });
            } catch (Exception error) {
                handler.post(() -> { if (generation == googleGeneration) googleFailure(error); });
            }
        });
    }

    private void confirmPublish(String key) {
        if (googleUser == null || googleAccessToken.isEmpty()) return;
        new AlertDialog.Builder(this).setTitle(english ? "Share TMDB key" : "TMDB-Schlüssel bereitstellen")
            .setMessage(googleUser.email + (english ? "\nUse this key for your other SerKal installations?"
                : "\nDiesen Schlüssel für deine weiteren SerKal-Installationen bereitstellen?"))
            .setPositiveButton(english ? "Share" : "Bereitstellen", (dialog, which) -> publishKey(key))
            .setNegativeButton(english ? "Cancel" : "Abbrechen", null).show();
    }

    private void publishKey(String key) {
        if (googleBusy || googleUser == null) return;
        googleBusy = true;
        final int generation = googleGeneration;
        final SharedKeyClient.Result user = googleUser;
        final String accessToken = googleAccessToken;
        network.execute(() -> {
            try {
                SharedKeyClient.Result result = new SharedKeyClient(accessToken).publish(user,key);
                KeyCache.save(this,result.owner,result.key);
                handler.post(() -> {
                    if (generation != googleGeneration || isFinishing()) return;
                    googleBusy = false; credential = result.key;
                    statusText.setText(result.email + (english ? "\nKey ready for your other devices." : "\nSchlüssel für deine anderen Geräte bereit."));
                });
            } catch(Exception error) { handler.post(() -> { if(generation==googleGeneration) googleFailure(error); }); }
        });
    }

    private void googleFailure(Exception error) {
        googleBusy = false;
        String code = error.getMessage() == null ? "" : error.getMessage();
        String message;
        if (code.contains("SHARED_KEY_CONFLICT")) message = english ? "Different shared keys found. Nothing overwritten."
            : "Unterschiedliche gemeinsame Schlüssel gefunden. Nichts überschrieben.";
        else if (code.contains("GOOGLE_HTTP_403")) message = english ? "Google denied access. Check Drive API and app-data permission."
            : "Google verweigert Zugriff. Drive-API und App-Daten-Berechtigung prüfen.";
        else if (error instanceof ApiException) message = (english ? "Google setup error " : "Google-Einrichtungsfehler ")
            + ((ApiException)error).getStatusCode() + (english ? ". Check Android OAuth package and signing SHA-1." : ". Android-OAuth-Paket und Signatur-SHA-1 prüfen.");
        else message = english ? "Google/key connection failed. Please retry." : "Google-/Schlüsselverbindung fehlgeschlagen. Bitte erneut versuchen.";
        statusText.setText(message);
    }

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
    private JSONObject archiveSnapshot;
    private String archiveError="";
    private int archiveGeneration;
    private boolean archiveBusy;
    private LinearLayout archiveRows;
    private TextView archiveStatus;

    private String archiveText(String key) { return ArchiveTexts.text(english,key); }
    private void loadArchive() {
        if(googleUser==null || googleAccessToken.isEmpty()) {
            archiveError="connect"; renderArchive(); return;
        }
        final int generation=++archiveGeneration;
        final int accountGeneration=googleGeneration;
        final String token=googleAccessToken,owner=googleUser.owner;
        archiveBusy=true; archiveError=""; renderArchive();
        network.execute(() -> {
            try {
                JSONObject snapshot=new SharedArchiveClient(token).load(owner);
                handler.post(() -> {
                    if(generation!=archiveGeneration || accountGeneration!=googleGeneration || isFinishing()) return;
                    archiveSnapshot=snapshot; archiveBusy=false; archiveError=""; renderArchive();
                });
            } catch(Exception error) {
                handler.post(() -> {
                    if(generation!=archiveGeneration || accountGeneration!=googleGeneration || isFinishing()) return;
                    archiveSnapshot=null; archiveBusy=false;
                    archiveError=String.valueOf(error.getMessage()); renderArchive();
                });
            }
        });
    }
    private void renderArchive() {
        if(archiveRows==null || archiveStatus==null) return;
        archiveRows.removeAllViews();
        if(archiveBusy) { archiveStatus.setText(archiveText("LOADING")); return; }
        if(!archiveError.isEmpty()) {
            String message;
            if(archiveError.contains("MISSING")) message=archiveText("MISSING");
            else if(archiveError.contains("CONFLICT")) message=archiveText("CONFLICT");
            else if(archiveError.contains("401") || archiveError.equals("connect")) message=archiveText("CONNECT");
            else message=archiveText("FAILED");
            archiveStatus.setText(message); return;
        }
        if(archiveSnapshot==null) { archiveStatus.setText(archiveText("INITIAL")); return; }
        org.json.JSONArray entries=archiveSnapshot.optJSONArray("entries");
        archiveStatus.setText((archiveText("SNAPSHOT"))+entries.length()+
            (archiveText("COUNT"))+archiveSnapshot.optString("generatedAt"));
        if(entries.length()==0) archiveRows.addView(text(archiveText("EMPTY_ARCHIVE"),10,MUTED));
        for(int i=0;i<entries.length();i++) {
            JSONObject e=entries.optJSONObject(i);
            TextView item=row(e.optString("title")+" · "+e.optString("seasonLabel"),false);
            item.setOnClickListener(v -> {
                requestGeneration++; if(pendingSearch!=null) handler.removeCallbacks(pendingSearch);
                selectedTmdbId=e.optInt("tmdbId"); selectedName.setText(e.optString("title"));
                String description=e.optString((english ? "descEN" : "descDE"));
                org.json.JSONArray dates=e.optJSONArray("dates");
                StringBuilder detail=new StringBuilder(e.optString("seasonLabel"));
                detail.append(archiveText("EPISODES")).append(e.optInt("eps"));
                if(!description.isEmpty()) detail.append("\n\n").append(description);
                detail.append(archiveText("DATES"));
                for(int j=0;j<dates.length();j++) detail.append(dates.optString(j)).append("\n");
                if(!e.optString("note").isEmpty()) detail.append(archiveText("NOTES")).append(e.optString("note"));
                selectedInfo.setText(detail.toString());
            });
            archiveRows.addView(item);
        }
    }


    @Override protected void onDestroy() {
        requestGeneration++;
        googleGeneration++;
        archiveGeneration++;
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
                            if (googleUser != null) confirmPublish(candidate);
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
            handler.post(() -> { if (!isFinishing()) connectGoogle(false); });
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
        TextView message = text("SerKal 0.0.5a4\n\nStartfehler: " + error.getClass().getSimpleName() +
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
        TextView preview = text(english ? "0.0.5a4 · pinch to zoom · drag to move" : "0.0.5a4 · mit 2 Fingern zoomen · mit 1 Finger bewegen", 7.5f, MUTED);
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
        Button google = button("Google");
        google.setOnClickListener(v -> connectGoogle(true));
        leftButtons.addView(google);
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
        Button add = button(archiveText("READ_ONLY"));
        add.setEnabled(false);
        middle.addView(add);
        columns.addView(middle);

        LinearLayout right = panel(28);
        right.addView(heading(english ? "SHARED ARCHIVE" : "GEMEINSAMES ARCHIV"));
        archiveStatus=text("",9,MUTED);
        right.addView(archiveStatus);
        archiveRows=new LinearLayout(this); archiveRows.setOrientation(LinearLayout.VERTICAL);
        ScrollView archiveScroll=new ScrollView(this); archiveScroll.addView(archiveRows);
        right.addView(archiveScroll,new LinearLayout.LayoutParams(-1,0,1));
        Button reload=button(archiveText("RELOAD"));
        reload.setOnClickListener(v -> loadArchive()); right.addView(reload);
        renderArchive();
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


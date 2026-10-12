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
    private JSONObject selectedArchiveEntry;
    private boolean writeBusy;
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
                    archiveSnapshot=snapshot; archiveBusy=false; archiveError=""; renderArchive(); checkPendingRequest();
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
        archiveStatus.setText((english ? "Shared archive: " : "Gemeinsames Archiv: ")+entries.length()+"\n"+archiveSnapshot.optString("generatedAt"));
        if(entries.length()==0) archiveRows.addView(text(archiveText("EMPTY_ARCHIVE"),10,MUTED));
        for(int i=0;i<entries.length();i++) {
            JSONObject e=entries.optJSONObject(i);
            TextView item=row(e.optString("title")+" · "+e.optString("seasonLabel"),false);
            item.setOnClickListener(v -> {
                requestGeneration++; if(pendingSearch!=null) handler.removeCallbacks(pendingSearch);
                selectedArchiveEntry=e; selectedTmdbId=e.optInt("tmdbId"); selectedName.setText(e.optString("title"));
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



    private boolean writeReady() {
        if(writeBusy) return false;
        if(googleUser==null || googleAccessToken.isEmpty() || archiveSnapshot==null){
            statusText.setText(english ? "Connect Google and load archive first." : "Zuerst Google verbinden und Archiv laden."); return false;
        }
        String pending=getPreferences(0).getString("request-"+googleUser.owner,"");
        if(!pending.isEmpty()){checkPendingRequest();return false;}
        return true;
    }
    private void sendRequest(String action,JSONObject payload) {
        if(!writeReady())return;
        writeBusy=true;
        final int generation=googleGeneration;
        final String token=googleAccessToken,owner=googleUser.owner;
        final JSONObject snapshot=archiveSnapshot;
        final String requestId=java.util.UUID.randomUUID().toString();
        try {
            JSONObject saved=new JSONObject().put("snapshot",new JSONObject().put("owner",owner).put("publisher",snapshot.getString("publisher")).put("generatedAt",snapshot.getString("generatedAt")))
                .put("action",action).put("payload",payload);
            getPreferences(0).edit().putString("request-"+owner,requestId).putString("requestData-"+owner,saved.toString()).commit();
        } catch(Exception error){writeBusy=false;return;}
        statusText.setText(english ? "Sending request…" : "Auftrag wird gesendet…");
        network.execute(() -> {
            try{
                String id=new SharedArchiveClient(token).submit(snapshot,action,payload,requestId);
                getPreferences(0).edit().putString("request-"+owner,id).apply();
                handler.post(() -> {
                    if(generation!=googleGeneration || isFinishing())return;
                    writeBusy=false; statusText.setText(english ? "Request waiting. Keep the source desktop running. Tap Reload to check." : "Auftrag wartet. Quell-Desktop laufen lassen. Mit Archiv laden prüfen.");
                });
            }catch(Exception e){handler.post(() -> {if(generation!=googleGeneration)return;writeBusy=false;statusText.setText(english ? "Request could not be confirmed. Reload before retrying." : "Auftrag nicht bestätigt. Vor erneutem Versuch Archiv laden.");});}
        });
    }
    private void checkPendingRequest() {
        if(googleUser==null || googleAccessToken.isEmpty() || writeBusy)return;
        final String owner=googleUser.owner,token=googleAccessToken,id=getPreferences(0).getString("request-"+googleUser.owner,"");
        if(id.isEmpty())return;
        final int generation=googleGeneration;
        network.execute(() -> {
            try{
                SharedArchiveClient client=new SharedArchiveClient(token);
                JSONObject result=client.result(owner,id);
                if(result==null){
                    String saved=getPreferences(0).getString("requestData-"+owner,"");
                    if(!saved.isEmpty()) { JSONObject request=new JSONObject(saved);client.submit(request.getJSONObject("snapshot"),request.getString("action"),request.getJSONObject("payload"),id); }
                }
                final JSONObject receipt=result;
                handler.post(() -> {
                    if(generation!=googleGeneration || isFinishing())return;
                    if(receipt==null){statusText.setText(english ? "Request still waiting for source desktop." : "Auftrag wartet noch auf den Quell-Desktop.");return;}
                    getPreferences(0).edit().remove("request-"+owner).remove("requestData-"+owner).apply();
                    String code=receipt.optString("code");
                    statusText.setText(receipt.optBoolean("ok") ? (english ? "Archive request completed by desktop." : "Archivauftrag vom Desktop abgeschlossen.") :
                        (code.equals("REQUEST_STALE") ? (english ? "Archive changed meanwhile. Reload and repeat your change." : "Archiv inzwischen geändert. Neu laden und Änderung wiederholen.") : (english ? "Request failed. Check desktop log." : "Auftrag fehlgeschlagen. Desktop-Log prüfen.")));
                    loadArchive();
                });
            }catch(Exception e){handler.post(() -> {if(generation==googleGeneration)statusText.setText(english ? "Request status unavailable. Please retry Reload." : "Auftragsstatus nicht erreichbar. Archiv laden erneut versuchen.");});}
        });
    }
    private void askForSeason() {
        if(!writeReady() || selectedTmdbId<=0)return;
        EditText input=new EditText(this);input.setText("1");input.setTextColor(Color.BLACK);input.setInputType(InputType.TYPE_CLASS_NUMBER);
        new AlertDialog.Builder(this).setTitle(english ? "Season number" : "Staffelnummer").setView(input)
            .setPositiveButton(english ? "Prepare" : "Vorbereiten",(d,w)->{
                int season;try{season=Integer.parseInt(input.getText().toString());}catch(Exception e){return;}
                if(season<1 || season>999)return;
                final int id=selectedTmdbId,generation=googleGeneration;final String key=credential;final boolean language=english;
                network.execute(() -> {
                    try{
                        TmdbClient tmdb=new TmdbClient(key);JSONObject de=tmdb.details(id,false),en=tmdb.details(id,true);
                        JSONObject detail=language?en:de;
                        JSONObject episodeData=tmdb.get("tv/"+id+"/season/"+season,"language="+(language?"en-US":"de-DE"));
                        org.json.JSONArray episodes=episodeData.getJSONArray("episodes"),dates=new org.json.JSONArray();
                        for(int i=0;i<episodes.length();i++){String date=episodes.getJSONObject(i).optString("air_date");if(!date.matches("\\d{4}-\\d{2}-\\d{2}"))throw new Exception("DATES");dates.put(date);}
                        if(dates.length()==0)throw new Exception("DATES");
                        String first=detail.optString("first_air_date");if(first.length()<4)throw new Exception("YEAR");
                        JSONObject payload=new JSONObject().put("tmdbId",id).put("titel",detail.getString("name")).put("jahr",first.substring(0,4))
                            .put("staffelNummer",season).put("episoden",dates.length()).put("termindaten",dates)
                            .put("descDE",de.optString("overview")).put("descEN",en.optString("overview"));
                        handler.post(() -> {if(generation!=googleGeneration || isFinishing())return;
                            new AlertDialog.Builder(this).setTitle(english ? "Archive and calendar" : "Archiv und Kalender")
                                .setMessage(detail.optString("name")+" · S"+season+" · "+dates.length()+(english ? " episodes. Process on source desktop?" : " Folgen. Am Quell-Desktop verarbeiten?"))
                                .setPositiveButton(english ? "Send" : "Senden",(dialog,which)->sendRequest("insert",payload))
                                .setNegativeButton(english ? "Cancel" : "Abbrechen",null).show();});
                    }catch(Exception e){handler.post(()->{if(generation==googleGeneration)statusText.setText(english ? "Season unavailable or episode dates incomplete. Nothing sent." : "Staffel nicht verfügbar oder Folgentermine unvollständig. Nichts gesendet.");});}
                });
            }).setNegativeButton(english ? "Cancel" : "Abbrechen",null).show();
    }
    private void editArchiveNotes() {
        if(!writeReady() || selectedArchiveEntry==null)return;
        final JSONObject entry=selectedArchiveEntry;EditText input=new EditText(this);input.setTextColor(Color.BLACK);input.setText(entry.optString("note"));
        new AlertDialog.Builder(this).setTitle(english ? "Notes (e.g. OffsetDE: +1D)" : "Notiz (z.B. OffsetDE: +1D)").setView(input)
            .setPositiveButton(english ? "Send" : "Senden",(d,w)->{try{sendRequest("notes",new JSONObject().put("tmdbId",entry.getInt("tmdbId")).put("seasonLabel",entry.getString("seasonLabel")).put("note",input.getText().toString()));}catch(Exception ignored){}})
            .setNegativeButton(english ? "Cancel" : "Abbrechen",null).show();
    }
    private void deleteArchiveSeries() {
        if(!writeReady() || selectedArchiveEntry==null)return;
        final JSONObject entry=selectedArchiveEntry;
        new AlertDialog.Builder(this).setTitle(english ? "Delete all archived seasons?" : "Alle archivierten Staffeln löschen?")
            .setMessage(entry.optString("title")+(english ? " – including its calendar events." : " – einschließlich ihrer Kalendertermine."))
            .setPositiveButton(english ? "Delete" : "Löschen",(d,w)->{try{sendRequest("delete",new JSONObject().put("tmdbId",entry.getInt("tmdbId")).put("seasonLabel",entry.getString("seasonLabel")));}catch(Exception ignored){}})
            .setNegativeButton(english ? "Cancel" : "Abbrechen",null).show();
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
        selectedTmdbId = 0; selectedArchiveEntry=null;
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
                    selectedTmdbId = id; selectedArchiveEntry=null;
                    // Name is display text; the immutable TMDB ID is the identity.
                    selectedName.setText(detail.optString("name", entry.optString("name")));
                    selectedInfo.setText("TMDB " + id + " · " + detail.optInt("number_of_seasons") +
                        (english ? " seasons" : " Staffeln") + "\n" + detail.optString("overview"));
                    statusText.setText(english ? "Series loaded. Choose Add to archive." : "Serie geladen. Mit Ins Archiv übernehmen.");
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
        TextView message = text("SerKal 0.0.5a6\n\nStartfehler: " + error.getClass().getSimpleName() +
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

    private Button verticalButton(String label) {
        Button b=button(label);
        LinearLayout.LayoutParams lp=new LinearLayout.LayoutParams(-1,dp(42));
        lp.setMargins(dp(2),dp(3),dp(2),dp(3));
        b.setLayoutParams(lp);
        b.setTextSize(TypedValue.COMPLEX_UNIT_DIP,10);
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
        TextView preview = text(english ? "0.0.5a6 · pinch to zoom · drag to move" : "0.0.5a6 · mit 2 Fingern zoomen · mit 1 Finger bewegen", 7.5f, MUTED);
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
        Button add = verticalButton(english ? "Add to archive + calendar" : "Ins Archiv + Kalender");
        add.setOnClickListener(v -> askForSeason());
        middle.addView(add);
        Button notes=verticalButton(english ? "Edit notes / offset" : "Notiz / Offset ändern");
        notes.setOnClickListener(v -> editArchiveNotes()); middle.addView(notes);
        Button remove=verticalButton(english ? "Delete complete series" : "Ganze Serie löschen");
        remove.setOnClickListener(v -> deleteArchiveSeries()); middle.addView(remove);
        columns.addView(middle);

        LinearLayout right = panel(28);
        right.addView(heading(english ? "SHARED ARCHIVE" : "GEMEINSAMES ARCHIV"));
        archiveStatus=text("",9,MUTED);
        right.addView(archiveStatus);
        archiveRows=new LinearLayout(this); archiveRows.setOrientation(LinearLayout.VERTICAL);
        ScrollView archiveScroll=new ScrollView(this); archiveScroll.addView(archiveRows);
        right.addView(archiveScroll,new LinearLayout.LayoutParams(-1,0,1));
        Button reload=verticalButton(archiveText("RELOAD"));
        reload.setOnClickListener(v -> { loadArchive(); checkPendingRequest(); }); right.addView(reload);
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


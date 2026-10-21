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
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.widget.ImageView;
import android.util.LruCache;
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

    private AlertDialog.Builder dialogBuilder() {
        return new AlertDialog.Builder(new android.view.ContextThemeWrapper(this,
            dark ? android.R.style.Theme_Material_Dialog_Alert : android.R.style.Theme_Material_Light_Dialog_Alert));
    }

    private void googleMenu() {
        if(googleBusy){
            dialogBuilder().setTitle(english?"Google connection":"Google-Verbindung")
                .setMessage(english?"Cancel the current connection attempt?":"Den laufenden Verbindungsversuch abbrechen?")
                .setPositiveButton(english?"Cancel connection":"Verbindung abbrechen",(d,w)->cancelGoogleConnection())
                .setNegativeButton(english?"Keep waiting":"Weiter warten",null).show();
            return;
        }
        dialogBuilder().setTitle(english?"Google account":"Google-Konto")
            .setMessage(googleUser==null?(english?"Connect Google to load your shared archive?":"Google verbinden, um dein gemeinsames Archiv zu laden?"):
                googleUser.email+(english?"\nReconnect or choose another account?":"\nNeu verbinden oder ein anderes Konto auswählen?"))
            .setPositiveButton(english?"Continue":"Weiter",(d,w)->connectGoogle(true))
            .setNegativeButton(english?"Cancel":"Abbrechen",null).show();
    }

    private void cancelGoogleConnection(){
        googleGeneration++; googleBusy=false;
        if(googleUser==null)restoreLocalArchive();else if(!googleAccessToken.isEmpty())loadArchive();
        statusText.setText(english?"Google connection cancelled. Your local archive is unchanged.":"Google-Verbindung abgebrochen. Dein lokales Archiv bleibt unverändert.");
    }

    @Override public void onBackPressed(){
        if(googleBusy){cancelGoogleConnection();return;}
        super.onBackPressed();
    }

    private void connectGoogle(boolean chooseAccount) {
        if (googleBusy) return;
        // Keep the current account, local archive and selection until a new login succeeds.
        googleBusy = true;
        final int generation = ++googleGeneration;
        pendingGoogleGeneration = generation;
        statusText.setText(english ? "Connecting to Google…" : "Google wird verbunden…");
        AuthorizationRequest.Builder builder = AuthorizationRequest.builder().setRequestedScopes(java.util.Arrays.asList(
            new Scope("https://www.googleapis.com/auth/drive.appdata"),
            new Scope("openid"), new Scope("https://www.googleapis.com/auth/userinfo.email"),
            new Scope("https://www.googleapis.com/auth/calendar.app.created"), new Scope("https://www.googleapis.com/auth/calendar.calendarlist.readonly")));
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
            cancelGoogleConnection();
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
                    boolean accountChanged=googleUser==null || !googleUser.owner.equals(user.owner);
                    if(accountChanged){
                        requestGeneration++; clearPoster(); selectedDetail=null; selectedArchiveEntry=null; displayedResults.clear();
                        credential=""; archiveSnapshot=null; archiveGeneration++; archiveBusy=false; archiveError="";
                        selectedTmdbId=0; selectedInfo.setText(""); selectedName.setText(english ? "Select a series" : "Serie auswählen"); suggestions.removeAllViews();
                    }
                    googleAccessToken=accessToken; archiveObserver=new SharedArchiveClient(accessToken);
                    googleUser = user;
                    getPreferences(0).edit().putString("lastOwner",user.owner).putString("lastEmail",user.email).apply();
                    loadArchive();
                    if (!loaded.key.isEmpty()) {
                        credential = loaded.key;
                        statusText.setText(user.email + (english ? "\nTMDB key adopted automatically." : "\nTMDB-Schlüssel automatisch übernommen."));
                        if (queryField.getText().length() >= 2) searchNow();
                    } else if (!cached.isEmpty()) {
                        confirmPublish(cached);
                    } else {
                        statusText.setText(user.email + (english
                            ? "\nNo shared key yet. Enter or paste your TMDB key using API key."
                            : "\nNoch kein gemeinsamer Schlüssel. Deinen TMDB-Schlüssel mit API-Key eingeben oder einfügen."));
                    }
                });
            } catch (Exception error) {
                handler.post(() -> { if (generation == googleGeneration) googleFailure(error); });
            }
        });
    }

    private void confirmPublish(String key) {
        if (googleUser == null || googleAccessToken.isEmpty()) return;
        archiveDialogOpen=true;
        dialogBuilder().setTitle(english ? "Share TMDB key" : "TMDB-Schlüssel bereitstellen")
            .setMessage(googleUser.email + (english ? "\nUse this key for your other SerKal installations?"
                : "\nDiesen Schlüssel für deine weiteren SerKal-Installationen bereitstellen?"))
            .setPositiveButton(english ? "Share" : "Bereitstellen", (dialog, which) -> publishKey(key))
            .setNegativeButton(english ? "Cancel" : "Abbrechen", null).setOnDismissListener(_closedDialog -> archiveDialogOpen=false).show();
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
        if(googleUser==null)restoreLocalArchive();else if(!googleAccessToken.isEmpty())loadArchive();
        statusText.setText(message);
    }
    private void restoreLocalArchive() {
        String owner=getPreferences(0).getString("lastOwner","");if(owner.isEmpty())return;
        try {
            googleAccessToken="";
            if(archiveCopy==null || !archiveCopy.owner.equals(owner)){
                if(archiveCopy!=null)archiveCopy.close();archiveCopy=new AndroidArchiveCopy(this,owner,"",()->handler.post(this::refreshLocalCopy));
            }
            if(!archiveCopy.useOfflineCache())return;
            credential=KeyCache.load(this,owner);googleUser=new SharedKeyClient.Result(credential,owner,getPreferences(0).getString("lastEmail",""));
            refreshLocalCopy();statusText.setText(googleUser.email+(english ? "\nOffline local archive. Google transfer is pending." : "\nLokales Archiv ohne Verbindung. Google-Übertragung ausstehend."));
        }catch(Exception ignored){}
    }

    private int BG = Color.rgb(8, 13, 18);
    private int PANEL = Color.rgb(18, 27, 36);
    private int CARD = Color.rgb(27, 39, 51);
    private int TEXT = Color.rgb(232, 239, 245);
    private int MUTED = Color.rgb(151, 167, 181);
    private static final int BLUE = Color.rgb(80, 167, 238);
    private static final int RED = Color.rgb(215, 75, 75);
    private boolean english = false;
    private boolean dark = true;
    private final ExecutorService pictures = Executors.newSingleThreadExecutor();
    private final LruCache<String,Bitmap> posterCache = new LruCache<String,Bitmap>(4 * 1024 * 1024) {
        @Override protected int sizeOf(String path, Bitmap bitmap) { return bitmap.getByteCount(); }
    };
    private int posterGeneration;
    private ImageView posterImage;
    private TextView posterStatus;
    private Bitmap selectedPoster;
    private String selectedPosterPath = "";
    private List<JSONObject> displayedResults = new java.util.ArrayList<>();
    private JSONObject selectedDetail;

    private void setPalette() {
        BG = dark ? Color.rgb(8,13,18) : Color.rgb(237,242,247);
        PANEL = dark ? Color.rgb(18,27,36) : Color.WHITE;
        CARD = dark ? Color.rgb(27,39,51) : Color.rgb(224,234,244);
        TEXT = dark ? Color.rgb(232,239,245) : Color.rgb(24,39,55);
        MUTED = dark ? Color.rgb(151,167,181) : Color.rgb(72,88,105);
    }
    private void clearPoster() {
        posterGeneration++; selectedPoster = null; selectedPosterPath = "";
        if (posterImage != null) posterImage.setImageDrawable(null);
        if (posterStatus != null) posterStatus.setText("");
    }
    private void showPoster(int id, String knownPath) {
        clearPoster();
        if (id <= 0 || credential.isEmpty()) return;
        final int generation = posterGeneration, account = googleGeneration;
        final String key = credential;
        final ImageView target = posterImage;
        posterStatus.setText(english ? "Loading image…" : "Bild wird geladen…");
        pictures.execute(() -> {
            try {
                String path = knownPath;
                if (path == null) path = new TmdbClient(key).details(id, false).optString("poster_path");
                if (!PosterClient.validPath(path)) throw new Exception("NO_POSTER");
                Bitmap bitmap = posterCache.get(path);
                if (bitmap == null) {
                    byte[] bytes = PosterClient.load(path);
                    BitmapFactory.Options bounds = new BitmapFactory.Options(); bounds.inJustDecodeBounds = true;
                    BitmapFactory.decodeByteArray(bytes,0,bytes.length,bounds);
                    if (bounds.outWidth <= 0 || bounds.outHeight <= 0 || bounds.outWidth > 1024 || bounds.outHeight > 2048)
                        throw new Exception("POSTER_INVALID");
                    bitmap = BitmapFactory.decodeByteArray(bytes,0,bytes.length);
                    if (bitmap == null) throw new Exception("POSTER_INVALID");
                    posterCache.put(path,bitmap);
                }
                final Bitmap result = bitmap; final String loadedPath = path;
                handler.post(() -> {
                    if (generation != posterGeneration || account != googleGeneration || target != posterImage || isFinishing()) return;
                    selectedPoster = result; selectedPosterPath = loadedPath;
                    posterImage.setImageBitmap(result); posterStatus.setText("");
                });
            } catch (Exception error) {
                handler.post(() -> {
                    if (generation != posterGeneration || account != googleGeneration || target != posterImage || isFinishing()) return;
                    posterStatus.setText(english ? "No image available" : "Kein Bild verfügbar");
                });
            }
        });
    }

    private final Handler handler = new Handler(Looper.getMainLooper());
    private final ExecutorService maintenanceWorker = Executors.newSingleThreadExecutor();
    private boolean maintenanceBusy;
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
    private boolean archiveDialogOpen,archiveProbeBusy,archiveObserveActive;
    private SharedArchiveClient archiveObserver;
    private final Runnable archiveProbeTask= new Runnable(){public void run(){if(!archiveObserveActive)return;probeArchiveChanges();handler.postDelayed(this,10000);}};
    private JSONObject archiveSnapshot;
    private String archiveError="";
    private int archiveGeneration;
    private boolean archiveBusy;
    private LinearLayout archiveRows;
    private TextView archiveStatus,copySyncStatus;
    private Button copySyncButton;
    private AndroidArchiveCopy archiveCopy;

    private void refreshLocalCopy() {
        if(archiveCopy==null || googleUser==null || !archiveCopy.owner.equals(googleUser.owner) || isFinishing())return;
        try {JSONObject local=archiveCopy.snapshot();if(local!=null){archiveSnapshot=local;archiveError="";renderArchive();}}catch(Exception error){archiveError=String.valueOf(error.getMessage());renderArchive();}
        String code=archiveCopy.status();String label;
        if(code.equals("saved"))label=english ? "Saved on Google · available on other devices" : "Bei Google gespeichert · auf anderen Geräten verfügbar";
        else if(code.equals("syncing"))label=english ? "Transferring · you can keep working" : "Übertragung läuft · du kannst weiterarbeiten";
        else if(code.equals("pending"))label=english ? "Saved locally · transfer pending" : "Lokal gespeichert · Übertragung ausstehend";
        else if(code.equals("COPY_LOW_SPACE"))label=english ? "Not enough storage · reading only" : "Zu wenig freier Speicher · nur Lesen möglich";
        else if(code.equals("COPY_CONFLICT"))label=english ? "Newer archive on Google · local copy preserved" : "Neuerer Archivstand bei Google · lokale Kopie bleibt erhalten";
        else if(code.equals("COPY_NEEDS_SOURCE"))label=english ? "First transfer: start the new desktop version on the previous source PC" : "Erste Übernahme: neue Desktop-Version am bisherigen Quell-PC starten";
        else if(code.equals("COPY_CALENDAR_PROTECTED"))label=english ? "Manual Calendar changes protected · synchronization paused" : "Manuelle Kalenderänderungen geschützt · Abgleich angehalten";
        else if(code.equals("COPY_CONNECT"))label=english ? "Local copy · connect Google to transfer" : "Lokale Kopie · zum Übertragen Google verbinden";
        else if(code.equals("COPY_ACCOUNT_CHANGED"))label=english ? "Google account does not match archive" : "Google-Konto passt nicht zum Archiv";
        else if(code.equals("loading"))label=english ? "Loading archive…" : "Archiv wird geladen…";
        else label=english ? "Transfer pending · local copy preserved · retry Sync now" : "Übertragung ausstehend · lokale Kopie bleibt erhalten · Jetzt synchronisieren versuchen";
        if(copySyncStatus!=null){copySyncStatus.setText(label);copySyncStatus.setContentDescription(label);}
        if(copySyncButton!=null)copySyncButton.setEnabled(!archiveCopy.busy());
    }

    private String archiveText(String key) { return ArchiveTexts.text(english,key); }
    private void loadArchive() {
        if(googleUser==null || googleAccessToken.isEmpty()){archiveError="connect";renderArchive();return;}
        try {
            final int generation=googleGeneration;
            if(archiveCopy==null || !archiveCopy.owner.equals(googleUser.owner)){
                if(archiveCopy!=null)archiveCopy.close();
                archiveCopy=new AndroidArchiveCopy(this,googleUser.owner,googleAccessToken,()->handler.post(()->{
                    if(generation==googleGeneration && !isFinishing())refreshLocalCopy();
                }));
            }else archiveCopy.updateToken(googleAccessToken);
            archiveCopy.setListener(()->handler.post(()->{if(generation==googleGeneration && !isFinishing())refreshLocalCopy();}));
            archiveBusy=false;archiveError="";refreshLocalCopy();archiveCopy.schedule(0);
        }catch(Exception error){archiveError=String.valueOf(error.getMessage());renderArchive();}
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
        archiveStatus.setText((english ? "Archive: " : "Archiv: ")+entries.length());
        if(entries.length()==0) archiveRows.addView(text(archiveText("EMPTY_ARCHIVE"),10,MUTED));
        final boolean byDate=getPreferences(0).getString("archiveSort","date").equals("date");
        String today=new java.text.SimpleDateFormat("yyyy-MM-dd",java.util.Locale.ROOT).format(new java.util.Date());
        for(JSONObject e:ArchiveOrder.sorted(entries,byDate,english)) {
            LinearLayout item=new LinearLayout(this);item.setOrientation(LinearLayout.HORIZONTAL);item.setGravity(Gravity.CENTER_VERTICAL);item.setBackgroundColor(CARD);item.setMinimumHeight(dp(38));
            LinearLayout.LayoutParams rowParams=new LinearLayout.LayoutParams(-1,-2);rowParams.setMargins(0,0,0,dp(2));item.setLayoutParams(rowParams);
            TextView title=text(ArchiveOrder.label(e,english),10,TEXT);title.setMaxLines(2);title.setEllipsize(android.text.TextUtils.TruncateAt.END);item.addView(title,new LinearLayout.LayoutParams(0,-2,1));
            String iso=ArchiveOrder.start(e);String display=iso.isEmpty()?"—":iso.substring(8,10)+"."+iso.substring(5,7)+"."+iso.substring(0,4);
            TextView date=text(display,8,MUTED);date.setSingleLine(true);date.setGravity(Gravity.RIGHT);item.addView(date,new LinearLayout.LayoutParams(dp(59),-2));
            int status=ArchiveOrder.status(e,today);TextView mark=text(ArchiveOrder.icon(status),16,status==4?Color.rgb(40,170,110):status==3?RED:status==1?Color.rgb(210,160,30):BLUE);
            mark.setGravity(Gravity.CENTER);mark.setContentDescription(archiveStatusLabel(e));item.addView(mark,new LinearLayout.LayoutParams(dp(32),dp(38)));
            item.setContentDescription(ArchiveOrder.label(e,english)+" · "+display+" · "+archiveStatusLabel(e));item.setOnClickListener(v->showArchiveEntry(e));
            if(status==3 || status==4)mark.setOnClickListener(v->toggleArchiveSeen(e));
            archiveRows.addView(item);
        }
    }



    private void showArchiveEntry(JSONObject e) {

                requestGeneration++; if(pendingSearch!=null) handler.removeCallbacks(pendingSearch);
                selectedArchiveEntry=e; selectedTmdbId=e.optInt("tmdbId"); selectedName.setText(archiveTitle(e));
                String description=e.optString((english ? "descEN" : "descDE"));
                org.json.JSONArray dates=e.optJSONArray("dates");
                StringBuilder detail=new StringBuilder(archiveStatusLabel(e)+" · "+e.optString("seasonLabel"));
                String providers=WatchProviders.text(e.optJSONObject("watchProviders"),e.optString("note"),english);
                detail.append(archiveText("EPISODES")).append(e.optInt("eps"));
                if(!description.isEmpty()) detail.append("\n\n").append(description);
                if(!providers.isEmpty())detail.append("\n\n").append(providers);
                detail.append(archiveText("DATES"));
                for(int j=0;j<dates.length();j++) detail.append(dates.optString(j)).append("\n");
                if(!e.optString("note").isEmpty()) detail.append(archiveText("NOTES")).append(e.optString("note"));
                selectedDetail=null; selectedInfo.setText(detail.toString());
                showPoster(selectedTmdbId,null);
    }

    @Override protected void onResume(){super.onResume();archiveObserveActive=true;handler.removeCallbacks(archiveProbeTask);handler.postDelayed(archiveProbeTask,2500);}
    @Override protected void onPause(){archiveObserveActive=false;handler.removeCallbacks(archiveProbeTask);super.onPause();}
    private void probeArchiveChanges(){
        // Transfers are triggered by startup, edits and the explicit button; no cloud polling.
    }

    private boolean writeReady() {
        if(archiveCopy==null || !archiveCopy.writable()){
            refreshLocalCopy();statusText.setText(english ? "Archive currently read-only. See synchronization status." : "Archiv derzeit nur lesbar. Synchronisationsstatus beachten.");return false;
        }return true;
    }
    private void sendRequest(String action,JSONObject payload) {
        if(!writeReady())return;
        try {
            archiveCopy.edit(action,payload);refreshLocalCopy();
            if((action.equals("notes") || action.equals("seen")) && archiveSnapshot!=null){
                org.json.JSONArray entries=archiveSnapshot.getJSONArray("entries");
                for(int i=0;i<entries.length();i++){JSONObject entry=entries.getJSONObject(i);if(entry.optInt("tmdbId")==payload.getInt("tmdbId") && entry.optString("seasonLabel").equals(payload.getString("seasonLabel"))){showArchiveEntry(entry);break;}}
            } else if(action.equals("delete")){
                selectedArchiveEntry=null;selectedTmdbId=0;selectedName.setText(english ? "Select a series" : "Serie auswählen");selectedInfo.setText("");clearPoster();
            }
            statusText.setText(english ? "Saved locally. Google transfer runs in the background." : "Lokal gespeichert. Google-Übertragung läuft im Hintergrund.");
        }catch(Exception error){statusText.setText(english ? "Could not save locally. Nothing confirmed." : "Lokal konnte nicht gespeichert werden. Nichts bestätigt.");}
    }
    private void checkPendingRequest() { refreshLocalCopy(); }
    private String archiveTitle(JSONObject e){return ArchiveOrder.title(e,english);}
    private String archiveStatusLabel(JSONObject e){
        if(e.optInt("seen")==1)return english?"✓ Watched":"✓ Gesehen";
        org.json.JSONArray dates=e.optJSONArray("dates");if(dates==null || dates.length()==0)return english?"○ Waiting":"○ Wartet";
        String today=new java.text.SimpleDateFormat("yyyy-MM-dd",java.util.Locale.ROOT).format(new java.util.Date());
        if(dates.optString(0).compareTo(today)>0)return english?"◷ Upcoming":"◷ Geplant";
        if(dates.optString(dates.length()-1).compareTo(today)>=0)return english?"● Running":"● Läuft";
        return english?"○ Unwatched":"○ Ungesehen";
    }
    private void askMaintenanceCountry(){
        if(maintenanceBusy || !writeReady() || credential.isEmpty())return;
        EditText input=new EditText(new android.view.ContextThemeWrapper(this, dark ? android.R.style.Theme_Material : android.R.style.Theme_Material_Light));input.setTextColor(TEXT);input.setSingleLine(true);input.setText(getPreferences(0).getString("watchCountry","DE"));
        archiveDialogOpen=true;dialogBuilder().setTitle(english?"Streaming country (DE, AU, US, GB …)":"Streaming-Land (DE, AU, US, GB …)").setView(input)
            .setPositiveButton(english?"Start":"Starten",(d,w)->{String country=input.getText().toString().trim().toUpperCase(java.util.Locale.ROOT);if(country.matches("[A-Z]{2}")){getPreferences(0).edit().putString("watchCountry",country).apply();runMaintenance(country);}})
            .setNegativeButton(english?"Cancel":"Abbrechen",null).setOnDismissListener(d->archiveDialogOpen=false).show();
    }
    private void runMaintenance(String country){
        if(maintenanceBusy || !writeReady())return;
        final AndroidArchiveCopy target=archiveCopy;final JSONObject initial;try{initial=target.snapshot();}catch(Exception e){return;}
        if(initial==null)return;final int generation=googleGeneration;final boolean language=english;final String key=credential;
        maintenanceBusy=true;statusText.setText(english?"Maintenance running · you can keep working":"Wartung läuft · du kannst weiterarbeiten");
        maintenanceWorker.execute(()->{
            try{TmdbClient client=new TmdbClient(key);String now=new java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ssXXX",java.util.Locale.ROOT).format(new java.util.Date());
                JSONObject result=Maintenance.run(initial.getJSONArray("entries"),client::get,country,language,now);
                if(Thread.currentThread().isInterrupted())return;
                // This checks the local epoch under the same lock as every local edit.
                try{target.maintenance(initial.getLong("epoch"),result.getJSONArray("patches"));result.put("applied",true);}catch(Exception changed){result.put("applied",false);}
                result.remove("patches");
                handler.post(()->{maintenanceBusy=false;if(generation!=googleGeneration || target!=archiveCopy || isFinishing())return;
                    getPreferences(0).edit().putString("maintenanceReport",result.toString()).apply();refreshLocalCopy();showMaintenanceReport(result);
                    statusText.setText(english?"Maintenance checked. See results and Google transfer status.":"Wartung geprüft. Ergebnis und Google-Übertragungsstatus beachten.");});
            }catch(Exception error){handler.post(()->{maintenanceBusy=false;if(generation==googleGeneration)statusText.setText(english?"Maintenance stopped. Local archive preserved.":"Wartung angehalten. Lokales Archiv bleibt erhalten.");});}
        });
    }
    private void showMaintenanceReport(JSONObject result){
        StringBuilder b=new StringBuilder();b.append(result.optString("checkedAt")).append(" · ").append(result.optString("country"));
        b.append(english?"\nNew seasons are suggestions, never added automatically.\n":"\nNeue Staffeln sind Vorschläge und werden nicht automatisch eingetragen.\n");
        if(result.has("applied") && !result.optBoolean("applied"))b.append(english?"\nNOT APPLIED: archive changed or currently read-only. Repeat maintenance.\n":"\nNICHT ÜBERNOMMEN: Archiv geändert oder derzeit nur lesbar. Wartung wiederholen.\n");
        org.json.JSONArray rows=result.optJSONArray("report");if(rows!=null)for(int i=0;i<rows.length();i++){JSONObject row=rows.optJSONObject(i);String kind=row.optString("kind");
            String label=kind.equals("missing-season")?(english?"Missing season":"Fehlende Staffel"):kind.equals("upcoming-episode")?(english?"Upcoming episode":"Anstehende Episode"):kind.equals("new-episode")?(english?"New episode":"Neue Episode"):(english?"Changed date":"Termin geändert");
            b.append("\n").append(row.optString("title")).append(" · S").append(row.optInt("season"));if(row.has("episode"))b.append("E").append(row.optInt("episode"));b.append(" · ").append(row.optString("date")).append(" · ").append(label).append('\n');}
        if(rows==null || rows.length()==0)b.append(english?"\nNo new seasons or episode changes found.\n":"\nKeine neuen Staffeln oder Episodenänderungen gefunden.\n");
        b.append(english?"\nProvider information is available in each archive entry.\n":"\nAnbieterangaben findest du direkt beim jeweiligen Archiveintrag.\n");
        org.json.JSONArray errors=result.optJSONArray("errors");if(errors!=null && errors.length()>0)b.append(english?"\nIncomplete checks: ":"\nUnvollständige Prüfungen: ").append(errors.length());
        TextView text=text(b.toString(),12,TEXT);text.setTextIsSelectable(true);ScrollView scroll=new ScrollView(this);scroll.addView(text);
        archiveDialogOpen=true;dialogBuilder().setTitle(english?"Maintenance results":"Wartungsergebnis").setView(scroll).setPositiveButton(english?"Close":"Schließen",null).setOnDismissListener(d->archiveDialogOpen=false).show();
    }

    private void toggleArchiveSeen(JSONObject entry){
        try{sendRequest("seen",new JSONObject().put("tmdbId",entry.getInt("tmdbId")).put("seasonLabel",entry.getString("seasonLabel")).put("seen",entry.optInt("seen")!=1));}catch(Exception ignored){}
    }
    private void showArchiveMenu(){
        archiveDialogOpen=true;dialogBuilder().setTitle(english?"Archive actions":"Archivaktionen")
            .setItems(english?new String[]{"Sync now","Reload archive","Maintenance","Last maintenance results","Log"}:new String[]{"Jetzt synchronisieren","Archiv neu laden","Wartung","Letztes Wartungsergebnis","Log"},(d,which)->handler.post(()->runArchiveMenuAction(which)))
            .setNegativeButton(english?"Close":"Schließen",null).setOnDismissListener(d->archiveDialogOpen=false).show();
    }
    private void runArchiveMenuAction(int which){
        if(which==0){if(archiveCopy!=null && !archiveCopy.busy())archiveCopy.schedule(0);return;}
        if(which==1){loadArchive();checkPendingRequest();return;}
        if(which==2){askMaintenanceCountry();return;}
        if(which==3){try{String result=getPreferences(0).getString("maintenanceReport","");if(!result.isEmpty())showMaintenanceReport(new JSONObject(result));else statusText.setText(english?"No maintenance results yet.":"Noch kein Wartungsergebnis vorhanden.");}catch(Exception ignored){}return;}
        try{TextView lines=text(archiveCopy==null?"":archiveCopy.readLog(),11,TEXT);lines.setTextIsSelectable(true);ScrollView scroll=new ScrollView(this);scroll.addView(lines);
            archiveDialogOpen=true;dialogBuilder().setTitle("SerKal Log").setView(scroll).setPositiveButton(english?"Close":"Schließen",null).setOnDismissListener(d->archiveDialogOpen=false).show();
        }catch(Exception error){statusText.setText(english?"Log unavailable":"Log nicht verfügbar");}
    }

    private void askForSeason() {
        if(!writeReady() || selectedTmdbId<=0)return;
        EditText input=new EditText(new android.view.ContextThemeWrapper(this, dark ? android.R.style.Theme_Material : android.R.style.Theme_Material_Light));input.setText("1");input.setTextColor(TEXT);input.setInputType(InputType.TYPE_CLASS_NUMBER);
        archiveDialogOpen=true;
        dialogBuilder().setTitle(english ? "Season number" : "Staffelnummer").setView(input)
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
                            .put("descDE",de.optString("overview")).put("descEN",en.optString("overview"))
                            .put("titleDE",de.optString("name")).put("titleEN",en.optString("name")).put("calendarLanguage",language?"en":"de");
                        handler.post(() -> {if(generation!=googleGeneration || isFinishing())return;
                            archiveDialogOpen=true;
        dialogBuilder().setTitle(english ? "Archive and calendar" : "Archiv und Kalender")
                                .setMessage(detail.optString("name")+" · S"+season+" · "+dates.length()+(english ? " episodes. Save on this device?" : " Folgen. Auf diesem Gerät speichern?"))
                                .setPositiveButton(english ? "Send" : "Senden",(dialog,which)->sendRequest("insert",payload))
                                .setNegativeButton(english ? "Cancel" : "Abbrechen",null).setOnDismissListener(_closedDialog -> archiveDialogOpen=false).show();});
                    }catch(Exception e){handler.post(()->{if(generation==googleGeneration)statusText.setText(english ? "Season unavailable or episode dates incomplete. Nothing sent." : "Staffel nicht verfügbar oder Folgentermine unvollständig. Nichts gesendet.");});}
                });
            }).setNegativeButton(english ? "Cancel" : "Abbrechen",null).setOnDismissListener(_closedDialog -> archiveDialogOpen=false).show();
    }
    private void editArchiveNotes() {
        if(!writeReady() || selectedArchiveEntry==null)return;
        final JSONObject entry=selectedArchiveEntry;EditText input=new EditText(new android.view.ContextThemeWrapper(this, dark ? android.R.style.Theme_Material : android.R.style.Theme_Material_Light));input.setTextColor(TEXT);input.setText(entry.optString("note"));
        archiveDialogOpen=true;
        dialogBuilder().setTitle(english ? "Notes: Provider: … / OffsetDE: +1D" : "Notiz: Anbieter: … / OffsetDE: +1D").setView(input)
            .setPositiveButton(english ? "Send" : "Senden",(d,w)->{try{sendRequest("notes",new JSONObject().put("tmdbId",entry.getInt("tmdbId")).put("seasonLabel",entry.getString("seasonLabel")).put("note",input.getText().toString()));}catch(Exception ignored){}})
            .setNegativeButton(english ? "Cancel" : "Abbrechen",null).setOnDismissListener(_closedDialog -> archiveDialogOpen=false).show();
    }
    private void deleteArchiveSeries() {
        if(!writeReady() || selectedArchiveEntry==null)return;
        final JSONObject entry=selectedArchiveEntry;
        archiveDialogOpen=true;
        dialogBuilder().setTitle(english ? "Delete all archived seasons?" : "Alle archivierten Staffeln löschen?")
            .setMessage(entry.optString("title")+(english ? " – including its calendar events." : " – einschließlich ihrer Kalendertermine."))
            .setPositiveButton(english ? "Delete" : "Löschen",(d,w)->{try{sendRequest("delete",new JSONObject().put("tmdbId",entry.getInt("tmdbId")).put("seasonLabel",entry.getString("seasonLabel")));}catch(Exception ignored){}})
            .setNegativeButton(english ? "Cancel" : "Abbrechen",null).setOnDismissListener(_closedDialog -> archiveDialogOpen=false).show();
    }

    @Override protected void onDestroy() {
        requestGeneration++;
        googleGeneration++;
        archiveGeneration++;
        handler.removeCallbacksAndMessages(null);
        if(archiveCopy!=null)archiveCopy.close();
        network.shutdownNow(); maintenanceWorker.shutdownNow(); pictures.shutdownNow(); posterCache.evictAll(); posterGeneration++;
        super.onDestroy();
    }

    private void askForKey() {
        EditText input = new EditText(new android.view.ContextThemeWrapper(this, dark ? android.R.style.Theme_Material : android.R.style.Theme_Material_Light));
        input.setTextColor(TEXT);
        input.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_PASSWORD);
        archiveDialogOpen=true;
        dialogBuilder()
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
            .setNegativeButton(english ? "Cancel" : "Abbrechen", null).setOnDismissListener(_closedDialog -> archiveDialogOpen=false).show();
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
        suggestions.removeAllViews(); displayedResults.clear(); selectedDetail=null; clearPoster();
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
                    displayedResults = results;
                    renderSuggestions(results);
                });
            } catch (Exception error) { showNetworkError(generation, error); }
        });
    }

    private void renderSuggestions(List<JSONObject> results) {
        suggestions.removeAllViews();
        final String key = credential; final boolean language=english;
        for (JSONObject entry : results) {
                        String date = entry.optString("first_air_date");
                        TextView result = row(entry.optString("name") +
                            (date.length() >= 4 ? " · " + date.substring(0, 4) : ""), false);
                        result.setMinHeight(dp(40));
                        result.setOnClickListener(v -> selectSeries(entry, key, language));
                        suggestions.addView(result);
                    }
    }

    private void selectSeries(JSONObject entry, String key, boolean language) {
        final int generation = ++requestGeneration;
        final int id = entry.optInt("id");
        clearPoster(); selectedDetail=null; selectedArchiveEntry=null; selectedTmdbId=0;
        selectedName.setText(entry.optString("name"));
        statusText.setText(english ? "Loading series…" : "Serie wird geladen…");
        network.execute(() -> {
            try {
                JSONObject detail = new TmdbClient(key).details(id, language);
                handler.post(() -> {
                    if (generation != requestGeneration) return;
                    selectedTmdbId = id; selectedArchiveEntry=null; selectedDetail=detail;
                    showPoster(id,detail.optString("poster_path"));
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
            english=getPreferences(0).getBoolean("english",false);
            dark=getPreferences(0).getBoolean("dark",true); setPalette();
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
        TextView message = text("SerKal " + BuildConfig.VERSION_NAME + "\n\nStartfehler: " + error.getClass().getSimpleName() +
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
        view.setBackgroundColor(dark ? Color.rgb(13,21,29) : Color.rgb(208,224,240));
        return view;
    }

    private TextView row(String value, boolean selected) {
        TextView view = text(value, 10, TEXT);
        view.setBackgroundColor(selected ? (dark ? Color.rgb(34,71,99) : Color.rgb(183,214,240)) : CARD);
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
        b.setTextSize(TypedValue.COMPLEX_UNIT_DIP, 10);
        b.setIncludeFontPadding(false);
        b.setMinHeight(0);
        b.setMinimumHeight(0);
        b.setPadding(dp(3), 0, dp(3), 0);
        b.setTextColor(Color.WHITE);
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
        String previousQuery = queryField == null ? "" : queryField.getText().toString();
        CharSequence previousStatus = statusText == null ? "" : statusText.getText();
        CharSequence previousName = selectedName == null ? "" : selectedName.getText();
        CharSequence previousInfo = selectedInfo == null ? "" : selectedInfo.getText();
        Bitmap previousPoster=selectedPoster; String previousPath=selectedPosterPath;
        posterGeneration++;
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
        TextView preview = text(BuildConfig.VERSION_NAME + (english ? " · zoom / move" : " · zoomen / bewegen"), 7.5f, MUTED);
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
        language.setOnClickListener(v -> {
            english = !english; getPreferences(0).edit().putBoolean("english",english).apply(); buildScreen();
            if (selectedArchiveEntry != null) showArchiveEntry(selectedArchiveEntry);
            else if (selectedTmdbId > 0) {
                try { selectSeries(new JSONObject().put("id",selectedTmdbId).put("name",selectedName.getText().toString()),credential,english); }
                catch(Exception ignored) {}
            } else if (queryField.getText().length() >= 2 && !credential.isEmpty()) searchNow();
        });
        language.setMinHeight(0);
        language.setMinimumHeight(0);
        top.addView(language, new LinearLayout.LayoutParams(dp(42), dp(28)));
        Button theme = new Button(this); theme.setText(english ? (dark ? "Light" : "Dark") : (dark ? "Hell" : "Dunkel"));
        styleTopButton_(theme);
        theme.setOnClickListener(v -> { dark=!dark;getPreferences(0).edit().putBoolean("dark",dark).apply();setPalette();configureFullscreen_();buildScreen(); });
        top.addView(theme,new LinearLayout.LayoutParams(dp(58),dp(28)));
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
        queryField = new EditText(new android.view.ContextThemeWrapper(this, dark ? android.R.style.Theme_Material : android.R.style.Theme_Material_Light));
        queryField.setSingleLine(true);
        queryField.setTextColor(TEXT);
        queryField.setHintTextColor(MUTED);
        queryField.setHint(english ? "Series title" : "Serientitel");
        queryField.setText(previousQuery);
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
        google.setOnClickListener(v -> googleMenu());
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
        LinearLayout detailBody=new LinearLayout(this);detailBody.setOrientation(LinearLayout.HORIZONTAL);
        LinearLayout posterColumn=new LinearLayout(this);posterColumn.setOrientation(LinearLayout.VERTICAL);
        posterImage=new ImageView(this);posterImage.setAdjustViewBounds(true);posterImage.setScaleType(ImageView.ScaleType.FIT_CENTER);
        posterImage.setContentDescription(english ? "Series poster" : "Serienposter");
        posterColumn.addView(posterImage,new LinearLayout.LayoutParams(dp(90),dp(140)));
        posterStatus=text("",9,MUTED);posterColumn.addView(posterStatus);
        detailBody.addView(posterColumn,new LinearLayout.LayoutParams(dp(95),-2));
        detailBody.addView(selectedInfo,new LinearLayout.LayoutParams(0,-2,1));
        detailScroll.addView(detailBody);
        middle.addView(detailScroll, new LinearLayout.LayoutParams(-1, 0, 1));
        LinearLayout editBar=new LinearLayout(this);editBar.setOrientation(LinearLayout.HORIZONTAL);
        Button add=button(english ? "Add to archive" : "Ins Archiv");add.setOnClickListener(v->askForSeason());editBar.addView(add);
        Button edit=button(english ? "Edit ▾" : "Bearbeiten ▾");
        edit.setOnClickListener(v->{archiveDialogOpen=true;dialogBuilder().setTitle(english?"Selected series":"Ausgewählte Serie")
            .setItems(english?new String[]{"Edit notes / offset / provider","Toggle watched","Delete complete series"}:new String[]{"Notiz / Offset / Anbieter ändern","Gesehen umschalten","Ganze Serie löschen"},(d,which)->handler.post(()->{if(which==0)editArchiveNotes();else if(which==1 && selectedArchiveEntry!=null)toggleArchiveSeen(selectedArchiveEntry);else if(which==2)deleteArchiveSeries();}))
            .setNegativeButton(english?"Close":"Schließen",null).setOnDismissListener(d->archiveDialogOpen=false).show();});editBar.addView(edit);middle.addView(editBar);
        columns.addView(middle);

        LinearLayout right = panel(28);
        right.addView(heading(english ? "SHARED ARCHIVE" : "GEMEINSAMES ARCHIV"));
        LinearLayout archiveBar=new LinearLayout(this);archiveBar.setOrientation(LinearLayout.HORIZONTAL);
        Button sort=button(getPreferences(0).getString("archiveSort","date").equals("date")?(english?"Date ↓":"Datum ↓"):"A–Z");
        sort.setContentDescription(english?"Switch archive sorting between date and alphabet":"Archivsortierung zwischen Datum und Alphabet wechseln");
        sort.setOnClickListener(v->{boolean date=getPreferences(0).getString("archiveSort","date").equals("date");getPreferences(0).edit().putString("archiveSort",date?"alpha":"date").apply();sort.setText(date?"A–Z":(english?"Date ↓":"Datum ↓"));renderArchive();});archiveBar.addView(sort);
        Button menu=button(english?"Menu ▾":"Menü ▾");menu.setOnClickListener(v->showArchiveMenu());archiveBar.addView(menu);right.addView(archiveBar);
        archiveStatus=text("",9,MUTED);archiveStatus.setMaxLines(1);right.addView(archiveStatus);
        archiveRows=new LinearLayout(this);archiveRows.setOrientation(LinearLayout.VERTICAL);
        ScrollView archiveScroll=new ScrollView(this);archiveScroll.addView(archiveRows);right.addView(archiveScroll,new LinearLayout.LayoutParams(-1,0,1));
        copySyncButton=null;copySyncStatus=text("",9,MUTED);copySyncStatus.setMaxLines(2);copySyncStatus.setEllipsize(android.text.TextUtils.TruncateAt.END);right.addView(copySyncStatus);
        copySyncStatus.setOnClickListener(v->{archiveDialogOpen=true;dialogBuilder().setTitle(english?"Synchronization":"Synchronisation").setMessage(copySyncStatus.getText()).setPositiveButton(english?"Close":"Schließen",null).setOnDismissListener(d->archiveDialogOpen=false).show();});
        renderArchive();
        columns.addView(right);

        setContentView(root);
        if (!previousName.toString().isEmpty()) selectedName.setText(previousName);
        selectedInfo.setText(previousInfo);
        if (!previousStatus.toString().isEmpty()) statusText.setText(previousStatus);
        if (googleBusy) statusText.setText(english ? "Connecting to Google…" : "Google wird verbunden…");
        selectedPoster=previousPoster;selectedPosterPath=previousPath;posterImage.setImageBitmap(previousPoster);
        renderSuggestions(displayedResults);
        refreshLocalCopy();
        if (selectedTmdbId>0 && previousPoster==null) showPoster(selectedTmdbId, selectedDetail==null ? null : selectedDetail.optString("poster_path"));
        else if (selectedTmdbId==0 && displayedResults.isEmpty() && previousQuery.length()>=2 && !credential.isEmpty()) searchNow();
    }

    private void styleTopButton_(Button button) {
        button.setTextSize(TypedValue.COMPLEX_UNIT_DIP, 10);
        button.setTextColor(Color.BLACK);
        button.setBackgroundColor(Color.WHITE);
        button.setAllCaps(false);
        button.setMinHeight(0);
        button.setMinimumHeight(0);
        button.setPadding(dp(2), 0, dp(2), 0);
    }
}




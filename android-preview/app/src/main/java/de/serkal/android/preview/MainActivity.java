package de.serkal.android.preview;

import android.app.Activity;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import androidx.core.view.ViewCompat;
import androidx.core.graphics.Insets;
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
    private volatile int googleGeneration;
    private int pendingGoogleGeneration;
    private long googleStarted;
    private volatile String googleStep = "idle";
    private Runnable googleTimeout;
    private boolean googleWelcomeOpen;
    private boolean setupActive, driveChecked, calendarChecked, keyChecked, keySetupOpen, keyPrompted;
    private String setupIssue = "";
    private AlertDialog setupDialog;

    private boolean setupReady() {
        return googleUser != null && !googleAccessToken.isEmpty() && calendarChecked && keyChecked
            && driveChecked;
    }
    private void openIntroduction() {
        openPublicLink(english ? "https://serkal.de/tmdb-help.html" : "https://serkal.de/serkal-einfach-erklaert.html");
    }
    private void updateSetup() {
        if (!setupActive || googleWelcomeOpen || keySetupOpen || archiveDialogOpen || isFinishing() || isDestroyed()) return;
        if (setupReady()) {
            if (setupDialog != null) setupDialog.dismiss();
            setupActive = false;
            return;
        }
        boolean connected = googleUser != null && !googleAccessToken.isEmpty();
        boolean drive = connected && driveChecked;
        boolean checking = googleBusy;
        String message = (english ? "1. Google account\n" : "1. Google-Konto\n") + (connected ? "✓ " : "○ ") + (english ? "Google account" : "Google-Konto") +
            (connected ? ": " + googleUser.email : "") +
            "\n" + (drive ? "✓ " : "○ ") + "Google Drive" +
            "\n" + (calendarChecked ? "✓ " : "○ ") + (english ? "Google Calendar" : "Google Kalender") +
            "\n\n" + (english ? "2. TMDB\n" : "2. TMDB\n") + (keyChecked ? "✓ " : "○ ") + (english ? "TMDB API key" : "API-Key von TMDB") +
            "\n\n" + (checking ? (english ? "Checking requirements…" : "Voraussetzungen werden geprüft…") :
                !setupIssue.isEmpty() ? setupIssue :
                connected && !keyChecked ? (english ? "Set up your API key to search for series." :
                    "Richte deinen API-Key ein, damit du Serien suchen kannst.") :
                (english ? "Connect Google and grant the required access." :
                    "Verbinde Google und erlaube den erforderlichen Zugriff."));
        if (setupDialog == null || !setupDialog.isShowing()) {
            setupDialog = dialogBuilder().setTitle(english ? "Set up SerKal" : "SerKal einrichten")
                .setMessage(message).setCancelable(false)
                .setPositiveButton(english ? "Continue" : "Weiter",null)
                .setNeutralButton(english ? "Help" : "Hilfe",null)
                .setNegativeButton(english ? "Exit" : "Beenden",(d,w)->exitSerKal()).create();
            setupDialog.show();
            setupDialog.getButton(AlertDialog.BUTTON_NEUTRAL).setOnClickListener(v->openIntroduction());
        } else setupDialog.setMessage(message);
        Button next = setupDialog.getButton(AlertDialog.BUTTON_POSITIVE);
        boolean keyStep = connected && drive && calendarChecked && !keyChecked;
        if (keyStep && !checking && !keyPrompted) {
            keyPrompted=true; setupDialog.dismiss(); handler.post(this::askForKey); return;
        }
        next.setText(keyStep ? (english ? "Set up API key" : "API-Key einrichten") :
            (english ? "Connect Google" : "Google verbinden"));
        next.setEnabled(!checking);
        next.setOnClickListener(v->{
            setupDialog.dismiss();
            if (keyStep) askForKey(); else connectGoogle(true);
        });
    }


    private void googleTrace(String event) {
        GoogleHttpFailure.event(this,event,googleGeneration,googleStep,
            googleStarted == 0 ? 0 : android.os.SystemClock.elapsedRealtime()-googleStarted);
    }
    private void stopGoogleTimeout() {
        if(googleTimeout!=null)handler.removeCallbacks(googleTimeout);
        googleTimeout=null;
    }
    private void googleStage(String step,long limitMillis) {
        googleStep=step;googleTrace("STEP");stopGoogleTimeout();
        final int generation=googleGeneration;
        googleTimeout=()->{
            if(generation!=googleGeneration || !googleBusy || isFinishing())return;
            googleTrace("TIMEOUT");
            // Invalidate before accepting any late SDK/network callback.
            googleGeneration++;
            try{finishActivity(GOOGLE_REQUEST);}catch(Exception ignored){}
            googleFailure(new Exception("GOOGLE_AUTHORIZATION_TIMEOUT"));
        };
        handler.postDelayed(googleTimeout,limitMillis);
    }
    private void openPrivacy() {
        try{startActivity(new android.content.Intent(android.content.Intent.ACTION_VIEW,
            android.net.Uri.parse(english?"https://serkal.de/privacy-en.html":"https://serkal.de/privacy.html")));}
        catch(Exception error){statusText.setText(english?"Privacy policy: https://serkal.de/privacy-en.html":"Datenschutz: https://serkal.de/privacy.html");}
    }
    private void showGoogleWelcome(boolean chooseAccount) {
        if(googleWelcomeOpen)return;
        googleWelcomeOpen=true;
        AlertDialog welcome=dialogBuilder().setTitle(english?"Welcome to SerKal":"Willkommen bei SerKal")
            .setMessage(english
                ? "SerKal connects to your Google account to use your own archive and calendar.\n\nGoogle Drive: stores your SerKal archive and API key in SerKal's hidden app-data area for use on your devices. This permission does not grant access to your other Drive documents.\n\nGoogle Calendar: reads your calendar list and creates and updates calendars and series events created by SerKal.\n\nYour account ID and email associate the archive with your account. You grant access directly to the app on this device. SerKal needs both your Google account and TMDB API key."
                : "SerKal verbindet sich mit deinem Google-Konto, um dein eigenes Archiv und deinen Kalender zu nutzen.\n\nGoogle Drive: speichert dein SerKal-Archiv und deinen API-Key im verborgenen App-Datenbereich von SerKal für deine Geräte. Diese Berechtigung gibt keinen Zugriff auf deine anderen Drive-Dokumente.\n\nGoogle Kalender: liest deine Kalenderliste und erstellt und aktualisiert von SerKal angelegte Kalender und Serientermine.\n\nKontokennung und E-Mail ordnen das Archiv deinem Konto zu. Du erteilst den Zugriff direkt der App auf diesem Gerät. Ohne Google-Konto und API-Key von TMDB kann SerKal nicht vollständig arbeiten.")
            .setPositiveButton(english?"Continue to Google":"Weiter zu Google",(d,w)->{
                getPreferences(0).edit().putBoolean("googleWelcomeAccepted",true).apply();handler.post(()->connectGoogle(chooseAccount));
            })
            .setCancelable(true)
            .setOnCancelListener(d->exitSerKal())
            .setNegativeButton(english?"Try demo":"Demo ausprobieren",(d,w)->handler.post(()->showReviewDemo(chooseAccount)))
            .setNeutralButton(english?"Privacy policy":"Datenschutz",null)
            .setOnDismissListener(d->googleWelcomeOpen=false).create();
        welcome.setCanceledOnTouchOutside(false);
        welcome.show();
        welcome.getButton(AlertDialog.BUTTON_NEUTRAL).setOnClickListener(v->openPrivacy());
    }


    // The demo owns its sample data. No app sessions, credentials or network clients are used.
    private void showReviewDemo(boolean chooseAccount) {
        LinearLayout content = new LinearLayout(this);
        content.setOrientation(LinearLayout.VERTICAL);
        content.setPadding(dp(20), dp(8), dp(20), dp(8));

        TextView intro = text(english
            ? "Try a series search, save a sample season and view its calendar dates. The demo uses fictional local data."
            : "Suche eine Serie, speichere eine Beispielstaffel und sieh dir ihre Kalendertermine an. Die Demo verwendet erfundene, lokale Daten.", 14, TEXT);
        content.addView(intro);
        content.addView(text(english
            ? "Sample titles: Harbor Lights, Moon Station, Forest Trails."
            : "Beispieltitel: Hafenlichter, Mondstation, Waldpfade.", 14, TEXT));

        EditText query = new EditText(new android.view.ContextThemeWrapper(this,
            dark ? android.R.style.Theme_Material : android.R.style.Theme_Material_Light));
        query.setSingleLine(true);
        query.setTextColor(TEXT);
        query.setText(english ? "Harbor" : "Hafen");
        query.setHint(english ? "Series title" : "Serientitel");
        content.addView(query);

        Button search = verticalButton(english ? "Search" : "Suchen");
        Button add = verticalButton(english ? "Add season to archive" : "Staffel ins Archiv");
        Button calendar = verticalButton(english ? "Show dates" : "Termine anzeigen");
        Button remove = verticalButton(english ? "Remove season" : "Staffel löschen");
        TextView result = text("", 14, TEXT);
        TextView archive = text("", 14, TEXT);
        LinearLayout archiveChoices = new LinearLayout(this);
        archiveChoices.setOrientation(LinearLayout.VERTICAL);
        TextView dates = text("", 14, TEXT);
        String[] samples = english
            ? new String[]{"Harbor Lights (2026), season 1", "Moon Station (2027), season 2", "Forest Trails (2027), season 1"}
            : new String[]{"Hafenlichter (2026), Staffel 1", "Mondstation (2027), Staffel 2", "Waldpfade (2027), Staffel 1"};
        String[][] episodeDates = english
            ? new String[][]{{"10 February", "17 February"}, {"8 March", "15 March"}, {"2 April", "9 April"}}
            : new String[][]{{"10. Februar", "17. Februar"}, {"8. März", "15. März"}, {"2. April", "9. April"}};
        java.util.Set<Integer> saved = new java.util.LinkedHashSet<>();
        int[] selected = {-1};

        content.addView(search);
        content.addView(result);
        content.addView(add);
        content.addView(archive);
        content.addView(archiveChoices);
        content.addView(calendar);
        content.addView(dates);
        content.addView(remove);
        Runnable refreshArchive = () -> {
            archive.setText(saved.isEmpty()
                ? (english ? "Sample archive is empty." : "Das Beispielarchiv ist leer.")
                : (english ? "Sample archive · select a season" : "Beispielarchiv · Staffel auswählen"));
            for (int index = 0; index < samples.length; index++) {
                Button row = (Button) archiveChoices.getChildAt(index);
                boolean active = selected[0] == index;
                row.setVisibility(saved.contains(index) ? View.VISIBLE : View.GONE);
                row.setSelected(active);
                row.setText((active ? "✓ " : "") + samples[index]);
            }
            boolean selectedIsSaved = saved.contains(selected[0]);
            add.setEnabled(selected[0] >= 0 && !selectedIsSaved);
            calendar.setEnabled(selectedIsSaved);
            remove.setEnabled(selectedIsSaved);
        };
        for (int index = 0; index < samples.length; index++) {
            final int choice = index;
            Button row = verticalButton(samples[index]);
            archiveChoices.addView(row);
            row.setOnClickListener(view -> {
                selected[0] = choice;
                dates.setText("");
                refreshArchive.run();
            });
        }
        refreshArchive.run();

        Runnable runSearch = () -> {
            String input = query.getText().toString().trim().toLowerCase(java.util.Locale.ROOT);
            selected[0] = -1;
            if (!input.isEmpty()) {
                for (int index = 0; index < samples.length; index++) {
                    if (samples[index].toLowerCase(java.util.Locale.ROOT).contains(input)) {
                        selected[0] = index;
                        break;
                    }
                }
            }
            result.setText(selected[0] >= 0 ? samples[selected[0]]
                : (english ? "No match. Try a sample title above." : "Kein Treffer. Versuche einen der Beispieltitel oben."));
            dates.setText("");
            refreshArchive.run();
            android.view.inputmethod.InputMethodManager keyboard =
                (android.view.inputmethod.InputMethodManager) getSystemService(INPUT_METHOD_SERVICE);
            if (keyboard != null) keyboard.hideSoftInputFromWindow(query.getWindowToken(), 0);
            content.requestFocus();
        };
        search.setOnClickListener(view -> runSearch.run());
        query.setImeOptions(android.view.inputmethod.EditorInfo.IME_ACTION_SEARCH);
        query.setOnEditorActionListener((view, action, event) -> {
            if (action != android.view.inputmethod.EditorInfo.IME_ACTION_SEARCH) return false;
            runSearch.run();
            return true;
        });
        add.setOnClickListener(view -> {
            if (selected[0] >= 0) saved.add(selected[0]);
            refreshArchive.run();
        });
        calendar.setOnClickListener(view -> {
            int index = selected[0];
            if (saved.contains(index)) {
                String heading = english ? "Sample dates" : "Beispieltermine";
                String episode = english ? "Episode" : "Folge";
                dates.setText(heading + "\n" + episode + " 1 · " + episodeDates[index][0]
                    + " 2027\n" + episode + " 2 · " + episodeDates[index][1] + " 2027");
            }
        });
        remove.setOnClickListener(view -> {
            saved.remove(selected[0]);
            selected[0] = -1;
            result.setText("");
            dates.setText("");
            refreshArchive.run();
        });

        ScrollView scroll = new ScrollView(this);
        scroll.addView(content);
        content.setFocusableInTouchMode(true);
        content.requestFocus();
        AlertDialog demo = dialogBuilder().setTitle(english ? "SerKal demo" : "SerKal-Demo")
            .setView(scroll)
            .setPositiveButton(english ? "Back to setup" : "Zur Einrichtung", null)
            .setOnDismissListener(dialog -> {
                if (!isFinishing() && !isDestroyed()) showGoogleWelcome(chooseAccount);
            }).create();
        demo.setCanceledOnTouchOutside(false);
        demo.show();
        if (demo.getWindow() != null) demo.getWindow().setSoftInputMode(
            WindowManager.LayoutParams.SOFT_INPUT_STATE_ALWAYS_HIDDEN | WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE);
    }

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
        googleTrace("CANCELLED");stopGoogleTimeout();
        getPreferences(0).edit().putBoolean("googleAttemptPending",false).apply();
        googleGeneration++; googleBusy=false;
        setupIssue = english ? "Google connection cancelled." : "Google-Verbindung abgebrochen."; handler.post(this::updateSetup);
        if(googleUser==null)restoreLocalArchive();else if(!googleAccessToken.isEmpty())loadArchive();
        statusText.setText(english?"Google connection cancelled. Your local archive is unchanged.":"Google-Verbindung abgebrochen. Dein lokales Archiv bleibt unverändert.");
    }

    private boolean exitPending;private long exitStarted;
    private android.widget.ProgressBar closeProgress;
    private final Runnable closeProgressTicker=new Runnable(){public void run(){if(!exitPending||isFinishing())return;refreshCloseProgress();handler.postDelayed(this,500);}};
    private void refreshCloseProgress(){if(archiveCopy==null)return;String text=archiveCopy.progress(english);if(text.isEmpty()&&exitPending)text=(english?"Checking Google connection":"Google-Verbindung prüfen")+" · "+((System.nanoTime()-exitStarted)/1000000000L)+" s";if(!text.isEmpty()&&copySyncStatus!=null)copySyncStatus.setText(text);
        if(closeProgress!=null){closeProgress.setVisibility(exitPending?View.VISIBLE:View.GONE);int total=archiveCopy.progressTotal();closeProgress.setIndeterminate(total<=0);if(total>0){closeProgress.setMax(total);closeProgress.setProgress(archiveCopy.progressCurrent());}}
    }
    private void exitSerKal(){
        if(exitPending)return;
        if(maintenanceBusy){statusText.setText(english?"Please wait for maintenance to finish.":"Bitte den Wartungslauf abschließen lassen.");return;}
        if(archiveCopy==null){finishAndRemoveTask();return;}
        if(archiveCopy.busy()){
            dialogBuilder().setMessage(english?"A transfer is running. Close without saving?":"Eine Übertragung läuft. Ohne Speichern beenden?")
                .setPositiveButton(english?"Close":"Beenden",(d,w)->finishAndRemoveTask()).setNegativeButton(english?"Keep open":"Geöffnet lassen",null).show();return;
        }
        if(!archiveCopy.requiresFinish()){archiveCopy.finish(()->finishAndRemoveTask());return;}
        exitPending=true;exitStarted=System.nanoTime();handler.post(closeProgressTicker);
        final java.util.concurrent.atomic.AtomicBoolean proceeding=new java.util.concurrent.atomic.AtomicBoolean();
        final long authStart=System.nanoTime();final java.util.concurrent.atomic.AtomicBoolean authorized=new java.util.concurrent.atomic.AtomicBoolean();
        Runnable proceed=()->{if(isFinishing())return;if(proceeding.compareAndSet(false,true)){archiveCopy.authorizationTime(authStart,authorized.get());finishArchiveSession();}};
        handler.postDelayed(()->{if(!proceeding.get()){archiveCopy.recordFailure(new Exception("GOOGLE_AUTHORIZATION_TIMEOUT: refreshing Google access did not finish within 10 seconds"));proceed.run();}},10000);
        AuthorizationRequest request=AuthorizationRequest.builder().setRequestedScopes(java.util.Arrays.asList(
            new Scope("https://www.googleapis.com/auth/drive.appdata"),new Scope("openid"),new Scope("https://www.googleapis.com/auth/userinfo.email"),
            new Scope("https://www.googleapis.com/auth/calendar.app.created"),new Scope("https://www.googleapis.com/auth/calendar.calendarlist.readonly"))).build();
        Identity.getAuthorizationClient(this).authorize(request).addOnSuccessListener(result->{
            if(!proceeding.get()&&!result.hasResolution()&&result.getAccessToken()!=null){archiveCopy.updateToken(result.getAccessToken());authorized.set(true);}
            proceed.run();
        }).addOnFailureListener(error->{archiveCopy.recordFailure(error);proceed.run();});
    }
    private void finishArchiveSession(){
        archiveCopy.finish(()->handler.post(()->{
            exitPending=false;handler.removeCallbacks(closeProgressTicker);if(isFinishing())return;refreshLocalCopy();
            if(!archiveCopy.needsExitWarning()){finishAndRemoveTask();return;}
            TextView detail=text(archiveCopy.message(),12,TEXT);detail.setTextIsSelectable(true);ScrollView scroll=new ScrollView(this);scroll.addView(detail);
            dialogBuilder().setTitle(english?"Session closing report":"Abschluss der Sitzung").setView(scroll)
                .setPositiveButton(archiveCopy.calendarIncomplete()?(english?"Close – archive saved":"Beenden – Archiv gespeichert"):(english?"Close":"Beenden"),(d,w)->finishAndRemoveTask())
                .setNegativeButton(english?"Keep open":"Geöffnet lassen",null).show();
        }));
    }
    @Override public void onBackPressed(){exitSerKal();}

    private void connectGoogle(boolean chooseAccount) {
        if (googleBusy) return;
        if(!getPreferences(0).getBoolean("googleWelcomeAccepted",false)){showGoogleWelcome(chooseAccount);return;}
        // Keep the current account, local archive and selection until a new login succeeds.
        googleBusy = true;
        setupActive = true; driveChecked = false; calendarChecked = false; keyChecked = false; keyPrompted = false; setupIssue = "";
        updateSetup();
        final int generation = ++googleGeneration;
        pendingGoogleGeneration = generation;
        googleStarted=android.os.SystemClock.elapsedRealtime();
        getPreferences(0).edit().putBoolean("googleAttemptPending",true).apply();
        googleStage("authorize",45000);
        statusText.setText(english ? "Connecting to Google…" : "Google wird verbunden…");
        AuthorizationRequest.Builder builder = AuthorizationRequest.builder().setRequestedScopes(java.util.Arrays.asList(
            new Scope("https://www.googleapis.com/auth/drive.appdata"),
            new Scope("openid"), new Scope("https://www.googleapis.com/auth/userinfo.email"),
            new Scope("https://www.googleapis.com/auth/calendar.app.created"), new Scope("https://www.googleapis.com/auth/calendar.calendarlist.readonly")));
        if (chooseAccount) builder.setPrompt(AuthorizationRequest.Prompt.SELECT_ACCOUNT);
        try { Identity.getAuthorizationClient(this).authorize(builder.build())
            .addOnSuccessListener(result -> {
                if (generation != googleGeneration || isFinishing()) return;
                if (result.hasResolution()) {
                    googleStage("account_and_permissions",120000);
                    try { startIntentSenderForResult(result.getPendingIntent().getIntentSender(), GOOGLE_REQUEST, null, 0, 0, 0); }
                    catch (Exception error) { googleFailure(error); }
                } else useGoogleResult(result, generation);
            })
            .addOnFailureListener(error -> { if (generation == googleGeneration) googleFailure(error); })
            .addOnCanceledListener(() -> { if(generation==googleGeneration)cancelGoogleConnection(); });
        } catch(Exception error) { if(generation==googleGeneration)googleFailure(error); }
    }

    @Override protected void onActivityResult(int requestCode, int resultCode, android.content.Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode != GOOGLE_REQUEST) return;
        if (pendingGoogleGeneration != googleGeneration || !googleBusy){googleTrace("LATE_RESULT_IGNORED");return;}
        googleTrace("ACTIVITY_RESULT_"+resultCode+(data==null?"_NO_DATA":""));
        if (resultCode != RESULT_OK || data == null) {
            cancelGoogleConnection();
            return;
        }
        try { useGoogleResult(Identity.getAuthorizationClient(this).getAuthorizationResultFromIntent(data), pendingGoogleGeneration); }
        catch (Exception error) { googleFailure(error); }
    }

    private void useGoogleResult(AuthorizationResult result, int generation) {
        if(generation!=googleGeneration || !googleBusy || isFinishing())return;
        googleStage("permissions_returned",180000);
        googleTrace(result.getGrantedScopes().contains("https://www.googleapis.com/auth/calendar.app.created")?"CALENDAR_PERMISSION_GRANTED":"CALENDAR_PERMISSION_NOT_GRANTED");
        if (!result.getGrantedScopes().contains("https://www.googleapis.com/auth/drive.appdata")
            || !result.getGrantedScopes().contains("https://www.googleapis.com/auth/calendar.app.created")
            || !result.getGrantedScopes().contains("https://www.googleapis.com/auth/calendar.calendarlist.readonly")) {
            googleFailure(new Exception("GOOGLE_PERMISSION_MISSING\nGoogle did not grant all required app-data and calendar permissions.")); return;
        }
        String accessToken = result.getAccessToken();
        if (accessToken == null || accessToken.isEmpty()) { googleFailure(new Exception("GOOGLE_TOKEN_MISSING")); return; }
        network.execute(() -> {
            try {
                SharedKeyClient client = new SharedKeyClient(accessToken);
                if(generation!=googleGeneration || isFinishing())return;
                googleTrace("IDENTITY_REQUEST");
                SharedKeyClient.Result user = client.identify();
                if(generation!=googleGeneration || isFinishing())return;
                googleTrace("IDENTITY_OK");
                SharedKeyClient.Result value;Exception keyProblem=null;
                googleTrace("DRIVE_KEY_REQUEST");
                try{value=client.load(user);googleTrace("DRIVE_KEY_OK");}catch(Exception failure){value=user;keyProblem=failure;googleTrace("DRIVE_KEY_FAILED");}
                if(generation!=googleGeneration || isFinishing())return;
                final SharedKeyClient.Result loaded=value;final Exception keyFailure=keyProblem;
                String candidate = loaded.key.isEmpty() ? KeyCache.load(this,user.owner) : loaded.key;
                String validKey = "";
                boolean calendarOK = false;
                boolean driveOK = false;
                String issue = "";
                try {
                    new ArchiveCopyClient(accessToken).get("https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&pageSize=1&fields=files(id)");
                    driveOK = true;
                } catch (Exception failure) {
                    GoogleHttpFailure.record(this,failure);
                    issue = english ? "Google Drive could not be reached. See Log." : "Google Drive konnte nicht erreicht werden. Details stehen im Log.";
                }
                try {
                    googleTrace("CALENDAR_CHECK");
                    new ArchiveCopyClient(accessToken).get("https://www.googleapis.com/calendar/v3/users/me/calendarList?maxResults=1");
                    calendarOK = true;
                } catch (Exception failure) {
                    GoogleHttpFailure.record(this,failure);
                    issue = english ? "Google Calendar could not be reached. See Log." : "Google Kalender konnte nicht erreicht werden. Details stehen im Log.";
                }
                if (!candidate.isEmpty()) {
                    try {
                        googleTrace("TMDB_VALIDATE_REQUEST");
                        tmdbClient(candidate).validate();
                        if(generation!=googleGeneration || isFinishing())return;
                        KeyCache.save(this,user.owner,candidate);
                        validKey = candidate;
                        googleTrace("TMDB_VALIDATE_OK");
                    } catch(Exception failure) {
                        googleTrace("TMDB_VALIDATE_FAILED");
                        if(issue.isEmpty()) issue = english ? "API key could not be verified." : "API-Key konnte nicht geprüft werden.";
                    }
                }
                final String checkedKey = validKey;
                final boolean checkedCalendar = calendarOK;
                final boolean checkedDrive = driveOK;
                final String checkedIssue = issue;
                handler.post(() -> {
                    if (generation != googleGeneration || isFinishing()) return;
                    googleTrace("CONNECTED");stopGoogleTimeout();
                    getPreferences(0).edit().putBoolean("googleAttemptPending",false).apply();
                    googleBusy = false;
                    boolean accountChanged=googleUser==null || !googleUser.owner.equals(user.owner);
                    if(accountChanged){
                        requestGeneration++; clearPoster(); selectedDetail=null; selectedArchiveEntry=null; displayedResults.clear();
                        credential=""; archiveSnapshot=null; archiveGeneration++; archiveBusy=false; archiveError="";
                        selectedTmdbId=0;updateTmdbReference(); selectedInfo.setText(""); selectedName.setText(english ? "Select a series" : "Serie auswählen"); suggestions.removeAllViews();
                    }
                    googleAccessToken=accessToken; archiveObserver=new SharedArchiveClient(accessToken);
                    googleUser = user;
                    getPreferences(0).edit().putString("lastOwner",user.owner).putString("lastEmail",user.email).apply();
                    loadArchive();
                    if(keyFailure!=null){GoogleHttpFailure.record(this,keyFailure);if(archiveCopy!=null)archiveCopy.recordFailure(keyFailure);}
                    credential = checkedKey;
                    driveChecked = checkedDrive;
                    calendarChecked = checkedCalendar;
                    keyChecked = !checkedKey.isEmpty();
                    setupIssue = checkedIssue;
                    statusText.setText(user.email + (keyChecked ?
                        (english ? "\nAPI key verified." : "\nAPI-Key geprüft.") :
                        (english ? "\nSet up your API key." : "\nBitte API-Key einrichten.")));
                    updateSetup();
                    if (keyChecked && loaded.key.isEmpty() && keyFailure==null && setupReady()) confirmPublish(checkedKey);

                });
            } catch (Exception error) {
                handler.post(() -> { if (generation == googleGeneration) googleFailure(error); });
            }
        });
    }

    private void confirmPublish(String key) {
        if (googleUser == null || googleAccessToken.isEmpty()) return;
        archiveDialogOpen=true;
        dialogBuilder().setTitle(english ? "Share API key" : "API-Key bereitstellen")
            .setMessage(googleUser.email + (english ? "\nUse this key for your other SerKal installations?"
                : "\nDiesen API-Key für deine weiteren SerKal-Installationen bereitstellen?"))
            .setPositiveButton(english ? "Share" : "Bereitstellen", (dialog, which) -> publishKey(key))
            .setNegativeButton(english ? "Cancel" : "Abbrechen", null).setOnDismissListener(_closedDialog -> {archiveDialogOpen=false;handler.post(this::updateSetup);}).show();
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
                    statusText.setText(result.email + (english ? "\nKey ready for your other devices." : "\nAPI-Key für deine anderen Geräte bereit."));
                });
            } catch(Exception error) { handler.post(() -> { if(generation==googleGeneration) googleFailure(error); }); }
        });
    }

    private void googleFailure(Exception error) {
        googleTrace("FAILED_"+error.getClass().getSimpleName());stopGoogleTimeout();
        GoogleHttpFailure.record(this,error);
        getPreferences(0).edit().putBoolean("googleAttemptPending",false).apply();
        googleBusy = false;
        String code = error.getMessage() == null ? "" : error.getMessage();
        String message;
        if(code.contains("GOOGLE_AUTHORIZATION_TIMEOUT"))message=english
            ? "Google connection timed out. Open Menu > Google account to retry. Details are in Log."
            : "Zeitüberschreitung bei der Google-Verbindung. Erneut versuchen über Menü > Google-Konto. Details stehen im Log.";
        else if(code.contains("GOOGLE_PERMISSION_MISSING"))message=english
            ? "Required Google permissions are missing. Open Menu > Google account and grant SerKal access to its app data and calendars."
            : "Erforderliche Google-Berechtigungen fehlen. Öffne Menü > Google-Konto und erlaube SerKal den Zugriff auf seine App-Daten und Kalender.";
        else if (code.contains("SHARED_KEY_CONFLICT")) message = english ? "Different API keys found. Nothing overwritten."
            : "Unterschiedliche API-Keys gefunden. Nichts überschrieben.";
        else if (code.contains("GOOGLE_HTTP_403")) message = english ? "Google denied access. Check Drive API and app-data permission."
            : "Google verweigert Zugriff. Drive-API und App-Daten-Berechtigung prüfen.";
        else if (error instanceof ApiException) message = (english ? "Google setup error " : "Google-Einrichtungsfehler ")
            + ((ApiException)error).getStatusCode() + (english ? ". Check Android OAuth package and signing SHA-1." : ". Android-OAuth-Paket und Signatur-SHA-1 prüfen.");
        else message = english ? "Google connection failed. Please retry. See Log for details." : "Google-Verbindung fehlgeschlagen. Bitte erneut versuchen. Details stehen im Log.";
        if(googleUser==null)restoreLocalArchive();else if(!googleAccessToken.isEmpty())loadArchive();
        if(archiveCopy!=null)archiveCopy.recordFailure(error);
        String stage = googleStep.equals("authorize") || googleStep.equals("account_and_permissions") ? (english?"Google sign-in and permissions":"Google-Anmeldung und Berechtigungen") : (english?"Checking Google services":"Prüfung der Google-Dienste");
        message = stage + ": " + message;
        statusText.setText(message+"\n"+(english?"Full Google response is in Log.":"Die vollständige Google-Antwort steht im Log."));
        setupActive = true; setupIssue = message; updateSetup();
    }
    private void restoreLocalArchive() {
        String owner=getPreferences(0).getString("lastOwner","");if(owner.isEmpty())return;
        try {
            googleAccessToken="";
            if(archiveCopy==null || !archiveCopy.owner.equals(owner)){
                if(archiveCopy!=null)archiveCopy.close();archiveCopy=new AndroidArchiveSession(this,owner,"",()->handler.post(this::refreshLocalCopy));
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
    private EditText yearField;
    private EditText seasonField;
    private LinearLayout suggestions;
    private TextView statusText, selectedName, selectedInfo, tmdbReference;
    private Runnable pendingSearch;
    private boolean resettingSearch;
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
    private TextView archiveStatus,archiveCount,copySyncStatus;
    private Button copySyncButton,authorityButton;
    private AndroidArchiveSession archiveCopy;

    private void refreshLocalCopy() {
        if(exitPending){refreshCloseProgress();return;}
        if(archiveCopy==null || googleUser==null || !archiveCopy.owner.equals(googleUser.owner) || isFinishing())return;
        try {JSONObject local=archiveCopy.snapshot();if(local!=null){archiveSnapshot=local;archiveError="";renderArchive();}}catch(Exception error){archiveError=String.valueOf(error.getMessage());renderArchive();}
        String code=archiveCopy.status();String label;
        updateSetup();
        if(code.equals("saved"))label=archiveCopy.calendarIncomplete()?(english?"Archive saved · Calendar update pending at exit":"Archiv gespeichert · Kalenderabgleich beim Beenden noch offen"):(english ? "No changes · exit without transfer" : "Keine Änderungen · Beenden ohne Übertragung");
        else if(code.equals("authority-pending"))label=english ? "This device is locally set as authoritative · Google confirmation is pending" : "Dieser Rechner ist lokal als maßgeblich festgelegt · Google-Bestätigung steht aus";
        else if(code.equals("authority-applied"))label=english ? "The authoritative Google archive was applied. Local differences were replaced." : "Der verbindliche Google-Archivstand wurde übernommen. Abweichende lokale Einträge wurden ersetzt.";
        else if(code.equals("syncing"))label=english ? "Saving session to Google…" : "Sitzung wird bei Google gespeichert…";
        else if(code.equals("pending"))label=english ? "Changes will be saved to Google when exiting" : "Änderungen werden beim Beenden bei Google gespeichert";
        else if(code.equals("COPY_VERSION_MISMATCH"))label=english ? "Different SerKal versions · install the same version on all devices" : "Unterschiedliche SerKal-Versionen · bitte auf allen Geräten dieselbe Version installieren";
        else if(code.equals("COPY_LOW_SPACE"))label=english ? "Not enough storage · reading only" : "Zu wenig freier Speicher · nur Lesen möglich";
        else if(code.equals("COPY_CONFLICT"))label=english ? "Newer archive on Google · local copy preserved" : "Neuerer Archivstand bei Google · lokale Kopie bleibt erhalten";
        else if(code.equals("COPY_HISTORY_MISSING"))label=english ? "Google archive history is incomplete · choose this local archive or sync the authoritative version" : "Google-Archivhistorie unvollständig · diesen lokalen Stand festlegen oder verbindlichen Stand synchronisieren";
        else if(code.equals("COPY_NEEDS_SOURCE"))label=english ? "First transfer: start the new desktop version on the previous source PC" : "Erste Übernahme: neue Desktop-Version am bisherigen Quell-PC starten";
        else if(code.equals("COPY_CALENDAR_PROTECTED"))label=english ? "Manual Calendar changes protected · synchronization paused" : "Manuelle Kalenderänderungen geschützt · Abgleich angehalten";
        else if(code.equals("COPY_CONNECT"))label=english ? "Local copy · connect Google to transfer" : "Lokale Kopie · zum Übertragen Google verbinden";
        else if(code.equals("COPY_ACCOUNT_CHANGED"))label=english ? "Google account does not match archive" : "Google-Konto passt nicht zum Archiv";
        else if(code.equals("loading"))label=english ? "Loading archive…" : "Archiv wird geladen…";
        else label=english ? "Transfer pending · local copy preserved · retry Sync now" : "Übertragung ausstehend · lokale Kopie bleibt erhalten · Jetzt synchronisieren versuchen";
        if(!archiveCopy.message().isEmpty())label=(archiveCopy.hasChanges()?(english?"Changes will be saved to Google when exiting\n":"Änderungen werden beim Beenden bei Google gespeichert\n"):"")+(english?"Google error · working locally\n":"Google-Fehler · lokale Arbeit möglich\n")+archiveCopy.status()+(english?" · Full response: Log":" · Vollständige Antwort: Log");
        if(archiveCopy.calendarIncomplete())label=(english?"Archive saved · Calendar update pending at exit":"Archiv gespeichert · Kalenderabgleich beim Beenden noch offen")+(archiveCopy.message().isEmpty()?"":(english?" · Full response: Log":" · Vollständige Antwort: Log"));
        if(copySyncStatus!=null){copySyncStatus.setText(label);copySyncStatus.setContentDescription(label);}
        if(copySyncButton!=null){copySyncButton.setEnabled(!archiveCopy.busy());copySyncButton.setVisibility(archiveCopy.status().equals("loading")||!archiveCopy.message().isEmpty()?View.VISIBLE:View.GONE);}
        if(authorityButton!=null){boolean available=archiveCopy.canMakeAuthoritative();authorityButton.setVisibility(available?View.VISIBLE:View.GONE);authorityButton.setEnabled(available);}
    }

    private void confirmMakeLocalAuthoritative(){
        if(archiveCopy==null || !archiveCopy.canMakeAuthoritative())return;
        String message=english
            ? "The archive currently stored on this Android device will become the shared Google archive, including its current entries. Existing Google archive files will be retained as backups. No archive entry will be edited or deleted. Continue?"
            : "Das Archiv, das gerade auf diesem Android-Gerät liegt, wird zum gemeinsamen Google-Archiv – einschließlich aller darin enthaltenen Einträge. Die bisherigen Google-Archivdateien bleiben als Sicherungen erhalten. Kein Archiveintrag wird bearbeitet oder gelöscht. Fortfahren?";
        archiveDialogOpen=true;
        dialogBuilder().setTitle(english?"Make this archive authoritative":"Diesen Archivstand festlegen")
            .setMessage(message)
            .setPositiveButton(english?"Set as shared archive":"Diesen Stand übernehmen",(d,w)->archiveCopy.makeAuthoritative())
            .setNegativeButton(english?"Cancel":"Abbrechen",null)
            .setOnDismissListener(d->archiveDialogOpen=false).show();
    }

    private String archiveText(String key) { return ArchiveTexts.text(english,key); }
    private void loadArchive() {
        if(googleUser==null || googleAccessToken.isEmpty()){archiveError="connect";renderArchive();return;}
        try {
            final int generation=googleGeneration;
            if(archiveCopy==null || !archiveCopy.owner.equals(googleUser.owner)){
                if(archiveCopy!=null)archiveCopy.close();
                archiveCopy=new AndroidArchiveSession(this,googleUser.owner,googleAccessToken,()->handler.post(()->{
                    if(generation==googleGeneration && !isFinishing())refreshLocalCopy();
                }));
            }else archiveCopy.updateToken(googleAccessToken);
            archiveCopy.setListener(()->handler.post(()->{if(generation==googleGeneration && !isFinishing())refreshLocalCopy();}));
            archiveBusy=false;archiveError="";refreshLocalCopy();googleTrace("ARCHIVE_LOAD_SCHEDULED");archiveCopy.schedule(0);
        }catch(Exception error){GoogleHttpFailure.record(this,error);googleTrace("ARCHIVE_LOAD_FAILED");archiveError=String.valueOf(error.getMessage());renderArchive();}
    }
    private void renderArchive() {
        if(archiveRows==null || archiveStatus==null) return;
        archiveRows.removeAllViews();
        if(archiveBusy) { archiveStatus.setVisibility(View.VISIBLE);archiveStatus.setText(archiveText("LOADING"));if(archiveCount!=null)archiveCount.setText("…");return; }
        if(!archiveError.isEmpty()) {
            String message;
            if(archiveError.contains("MISSING")) message=archiveText("MISSING");
            else if(archiveError.contains("CONFLICT")) message=archiveText("CONFLICT");
            else if(archiveError.contains("401") || archiveError.equals("connect")) message=archiveText("CONNECT");
            else message=archiveText("FAILED");
            archiveStatus.setVisibility(View.VISIBLE);archiveStatus.setText(message);if(archiveCount!=null)archiveCount.setText("!");return;
        }
        if(archiveSnapshot==null) { archiveStatus.setVisibility(View.VISIBLE);archiveStatus.setText(archiveText("INITIAL"));if(archiveCount!=null)archiveCount.setText("—");return; }
        org.json.JSONArray entries=archiveSnapshot.optJSONArray("entries");
        archiveStatus.setText("");archiveStatus.setVisibility(View.GONE);if(archiveCount!=null)archiveCount.setText(String.valueOf(entries.length()));
        if(entries.length()==0) archiveRows.addView(text(archiveText("EMPTY_ARCHIVE"),10,MUTED));
        final boolean byDate=getPreferences(0).getString("archiveSort","date").equals("date");
        String today=new java.text.SimpleDateFormat("yyyy-MM-dd",java.util.Locale.ROOT).format(new java.util.Date());
        for(JSONObject e:ArchiveOrder.sorted(entries,byDate,english)) {
            LinearLayout item=new LinearLayout(this);item.setOrientation(LinearLayout.HORIZONTAL);item.setGravity(Gravity.CENTER_VERTICAL);item.setBackgroundColor(CARD);item.setMinimumHeight(dp(32));
            LinearLayout.LayoutParams rowParams=new LinearLayout.LayoutParams(-1,-2);rowParams.setMargins(0,0,0,dp(1));item.setLayoutParams(rowParams);
            TextView title=text(ArchiveOrder.label(e,english),9.5f,TEXT);title.setMaxLines(2);title.setEllipsize(android.text.TextUtils.TruncateAt.END);item.addView(title,new LinearLayout.LayoutParams(0,-2,1));
            String iso=ArchiveOrder.start(e);String display=iso.isEmpty()?"—":iso.substring(8,10)+"."+iso.substring(5,7)+"."+iso.substring(0,4);
            if(e.optBoolean("announcementOnly"))display+=" (?)";
            TextView date=text(display,7.5f,MUTED);date.setSingleLine(true);date.setGravity(Gravity.RIGHT);item.addView(date,new LinearLayout.LayoutParams(dp(55),-2));
            int status=ArchiveOrder.status(e,today);TextView mark=text(ArchiveOrder.icon(status),14,status==4?Color.rgb(40,170,110):status==3?RED:status==1?Color.rgb(210,160,30):BLUE);
            mark.setGravity(Gravity.CENTER);mark.setContentDescription(archiveStatusLabel(e));item.addView(mark,new LinearLayout.LayoutParams(dp(27),dp(32)));
            item.setContentDescription(ArchiveOrder.label(e,english)+" · "+display+" · "+archiveStatusLabel(e));item.setOnClickListener(v->showArchiveEntry(e));
            if(status==3 || status==4)mark.setOnClickListener(v->toggleArchiveSeen(e));
            archiveRows.addView(item);
        }
    }



    private void openPublicLink(String url) {
        try { startActivity(new android.content.Intent(android.content.Intent.ACTION_VIEW, android.net.Uri.parse(url))); }
        catch (android.content.ActivityNotFoundException error) { statusText.setText(english?"No browser or calendar app available.":"Kein Browser oder Kalenderprogramm verfügbar."); }
    }
    private void openCalendar() {
        String id=archiveCopy==null?"":archiveCopy.calendarId();
        String encoded=id.isEmpty()?"":android.util.Base64.encodeToString(id.getBytes(java.nio.charset.StandardCharsets.UTF_8),android.util.Base64.NO_WRAP);
        openPublicLink(PublicLinks.calendar(encoded,googleUser==null?"":googleUser.email,english));
    }
    private void updateTmdbReference() {
        if(tmdbReference==null)return;
        tmdbReference.setText(selectedTmdbId>0?"TMDB #"+selectedTmdbId+" ↗":(english?"TMDB: select a series":"TMDB: Serie auswählen"));
        tmdbReference.setEnabled(selectedTmdbId>0);
    }
    private void showTmdbLinks() {
        if(selectedTmdbId<=0)return;
        final int id=selectedTmdbId; final boolean lang=english;
        archiveDialogOpen=true;
        dialogBuilder().setTitle("TMDB #"+id)
            .setItems(lang?new String[]{"Open series on TMDB","Open season…","Share series link…"}:new String[]{"Serie auf TMDB öffnen","Staffel öffnen…","Serienlink teilen…"},(d,which)->{
                if(which==0)openPublicLink(PublicLinks.series(id,0,lang));
                else if(which==1)handler.post(()->askTmdbSeason(id,lang));
                else {android.content.Intent share=new android.content.Intent(android.content.Intent.ACTION_SEND);share.setType("text/plain");share.putExtra(android.content.Intent.EXTRA_TEXT,PublicLinks.series(id,0,lang));startActivity(android.content.Intent.createChooser(share,lang?"Share TMDB link":"TMDB-Link teilen"));}
            }).setNegativeButton(lang?"Close":"Schließen",null).setOnDismissListener(d->archiveDialogOpen=false).show();
    }
    private void askTmdbSeason(int id,boolean lang) {
        EditText input=new EditText(new android.view.ContextThemeWrapper(this,dark?android.R.style.Theme_Material:android.R.style.Theme_Material_Light));
        input.setInputType(InputType.TYPE_CLASS_NUMBER);input.setSingleLine(true);
        String season=selectedArchiveEntry==null?"1":selectedArchiveEntry.optString("seasonLabel").replaceAll("[^0-9]","");input.setText(season);
        archiveDialogOpen=true;
        dialogBuilder().setTitle(lang?"TMDB season number":"TMDB-Staffelnummer").setView(input)
            .setPositiveButton(lang?"Open":"Öffnen",(d,w)->{try{int n=Integer.parseInt(input.getText().toString());if(n<1 || n>999)throw new IllegalArgumentException();openPublicLink(PublicLinks.series(id,n,lang));}catch(Exception error){statusText.setText(lang?"Enter a season number from 1 to 999.":"Bitte Staffelnummer von 1 bis 999 eingeben.");}})
            .setNegativeButton(lang?"Cancel":"Abbrechen",null).setOnDismissListener(d->archiveDialogOpen=false).show();
    }

    private void showArchiveEntry(JSONObject e) {
        showPanel_(1);

                requestGeneration++; if(pendingSearch!=null) handler.removeCallbacks(pendingSearch);
                selectedArchiveEntry=e; selectedTmdbId=e.optInt("tmdbId"); updateTmdbReference(); selectedName.setText(archiveTitle(e));
                String description=e.optString((english ? "descEN" : "descDE"));
                org.json.JSONArray dates=e.optJSONArray("dates");
                StringBuilder detail=new StringBuilder(archiveStatusLabel(e)+" · "+e.optString("seasonLabel"));
                String providers=WatchProviders.text(e.optJSONObject("watchProviders"),e.optString("note"),english);
                detail.append(archiveText("EPISODES")).append(e.optInt("eps"));
            if(e.optBoolean("announcementOnly"))detail.append(english?"\nAnnounced start; episode dates are not confirmed.":"\nAngekündigter Start; Folgentermine sind noch nicht bestätigt.");
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
            refreshLocalCopy();statusText.setText(english ? "An archive operation is still running." : "Ein Archivvorgang läuft noch.");return false;
        }return true;
    }
    private void sendRequest(String action,JSONObject payload) {
        if(!writeReady())return;
        try {
            archiveCopy.edit(action,payload);refreshLocalCopy();
            if((action.equals("notes") || action.equals("seen")) && archiveSnapshot!=null){
                org.json.JSONArray entries=archiveSnapshot.getJSONArray("entries");
                for(int i=0;i<entries.length();i++){JSONObject entry=entries.getJSONObject(i);if(entry.optInt("tmdbId")==payload.getInt("tmdbId") && entry.optString("seasonLabel").equals(payload.getString("seasonLabel"))){showArchiveEntry(entry);break;}}
            } else if(action.equals("insert") || action.equals("delete")){
                resetSearch();
            }
            statusText.setText(english ? "Saved locally. Google transfer runs in the background." : "Lokal gespeichert. Google-Übertragung läuft im Hintergrund.");
        }catch(Exception error){statusText.setText(english ? "Could not save locally. Nothing confirmed." : "Lokal konnte nicht gespeichert werden. Nichts bestätigt.");}
    }
    private void resetSearch() {
        // Invalidate in-flight searches before clearing anything they could refill.
        requestGeneration++;
        if(pendingSearch!=null){handler.removeCallbacks(pendingSearch);pendingSearch=null;}
        resettingSearch=true;
        try {queryField.setText("");yearField.setText("");seasonField.setText("");}
        finally {resettingSearch=false;}
        suggestions.removeAllViews();displayedResults.clear();selectedDetail=null;selectedArchiveEntry=null;
        selectedTmdbId=0;updateTmdbReference();clearPoster();
        selectedName.setText(english?"Select a series":"Serie auswählen");selectedInfo.setText("");
        statusText.setText(english?"Ready.":"Bereit.");
        queryField.requestFocus();queryField.setSelection(0);
    }

    private void showHelp() {
        dialogBuilder().setTitle(english?"SerKal help":"SerKal-Hilfe")
            .setMessage(english
                ? "Enter a series title; year and season are optional. Choose a result, then Add to archive. After saving, the fields are cleared for the next series.\n\nTap an archive entry to view it. Edit opens notes, watched status and deletion. Google and TMDB settings are in the archive menu."
                : "Serientitel eingeben; Jahr und Staffel sind optional. Einen Treffer auswählen und mit Ins Archiv übernehmen. Nach dem Speichern sind die Felder für die nächste Serie wieder leer.\n\nEinen Archiveintrag zum Anzeigen antippen. Bearbeiten öffnet Notizen, Gesehen-Status und Löschen. Google- und TMDB-Einstellungen stehen im Archivmenü.")
            .setNeutralButton(english?"Privacy policy":"Datenschutz",(d,w)->openPrivacy())
            .setNegativeButton(english?"Setup guide":"SerKal einfach erklärt",(d,w)->openIntroduction())
            .setPositiveButton(english?"Close":"Schließen",null).show();
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
        final AndroidArchiveSession target=archiveCopy;final JSONObject initial;try{initial=target.snapshot();}catch(Exception e){return;}
        if(initial==null)return;final int generation=googleGeneration;final boolean language=english;final String key=credential;
        maintenanceBusy=true;statusText.setText(english?"Maintenance running · you can keep working":"Wartung läuft · du kannst weiterarbeiten");
        maintenanceWorker.execute(()->{
            try{TmdbClient client=new TmdbClient(key);String now=new java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ssXXX",java.util.Locale.ROOT).format(new java.util.Date());
                JSONObject result=Maintenance.run(initial.getJSONArray("entries"),client::get,country,language,now);
                if(Thread.currentThread().isInterrupted())return;
                // This checks the local epoch under the same lock as every local edit.
                try{target.maintenance(initial.getLong("epoch"),result.getJSONArray("patches"));result.put("applied",true);}catch(Exception changed){result.put("applied",false).put("applyError",String.valueOf(changed.getMessage()));}
                org.json.JSONArray datePatches=result.getJSONArray("patches");
                for(int pi=0;pi<datePatches.length();pi++){JSONObject patch=datePatches.getJSONObject(pi);if(patch.has("applyError"))result.getJSONArray("errors").put(new JSONObject().put("kind","date-preserved").put("fileName",patch.optString("fileName")).put("seasonLabel",patch.optString("seasonLabel")).put("code",patch.optString("applyError")));}
                result.remove("patches");
                handler.post(()->{maintenanceBusy=false;if(generation!=googleGeneration || target!=archiveCopy || isFinishing())return;
                    getPreferences(0).edit().putString("maintenanceReport",result.toString()).apply();refreshLocalCopy();showMaintenanceReport(result);
                    statusText.setText(english?"Maintenance checked. See results and Google transfer status.":"Wartung geprüft. Ergebnis und Google-Übertragungsstatus beachten.");});
            }catch(Exception error){handler.post(()->{maintenanceBusy=false;if(generation==googleGeneration)statusText.setText(english?"Maintenance stopped. Local archive preserved.":"Wartung angehalten. Lokales Archiv bleibt erhalten.");});}
        });
    }
    private void showMaintenanceReport(JSONObject result){
        StringBuilder b=new StringBuilder();b.append(result.optString("checkedAt")).append(" · ").append(result.optString("country"));
        b.append(english?"\nNew seasons of watched series are added automatically; incomplete dates remain announcements.\n":"\nNeue Staffeln geschauter Serien werden automatisch übernommen; unvollständige Termine bleiben Ankündigungen.\n");
        if(result.has("applied") && !result.optBoolean("applied"))b.append(english?"\nNOT APPLIED: archive changed or currently read-only. Nothing was overwritten. Reason: ":"\nNICHT ÜBERNOMMEN: Archiv geändert oder derzeit nur lesbar. Nichts wurde überschrieben. Grund: ");
        if(result.has("applied") && !result.optBoolean("applied"))b.append(result.optString("applyError")).append("\n");
        org.json.JSONArray rows=result.optJSONArray("report");if(rows!=null)for(int i=0;i<rows.length();i++){JSONObject row=rows.optJSONObject(i);String kind=row.optString("kind");
            String label=kind.equals("added-season")?(english?"Season added":"Staffel übernommen"):kind.equals("announced-season")?(english?"Announced season":"Angekündigte Staffel"):kind.equals("announcement-changed")?(english?"Announced start changed":"Angekündigter Start geändert"):kind.equals("missing-season")?(english?"Missing season":"Fehlende Staffel"):kind.equals("upcoming-episode")?(english?"Upcoming episode":"Anstehende Episode"):kind.equals("new-episode")?(english?"New episode":"Neue Episode"):(english?"Changed date":"Termin geändert");
            b.append("\n").append(row.optString("title")).append(" · S").append(row.optInt("season"));if(row.has("episode"))b.append("E").append(row.optInt("episode"));b.append(" · ").append(row.optString("date").matches("\\d{4}-\\d{2}-\\d{2}")?row.optString("date"):(english?"Date unknown":"Termin unbekannt")).append(" · ").append(label).append('\n');}
        if(rows==null || rows.length()==0)b.append(english?"\nNo new seasons or episode changes found.\n":"\nKeine neuen Staffeln oder Episodenänderungen gefunden.\n");
        b.append(english?"\nProvider information is available in each archive entry.\n":"\nAnbieterangaben findest du direkt beim jeweiligen Archiveintrag.\n");
        org.json.JSONArray errors=result.optJSONArray("errors");if(errors!=null && errors.length()>0)b.append(english?"\nIncomplete checks: ":"\nUnvollständige Prüfungen: ").append(errors.length());
        if(errors!=null)for(int ei=0;ei<errors.length();ei++){JSONObject problem=errors.optJSONObject(ei);if(problem!=null && problem.optString("kind").equals("date-preserved"))b.append("\n").append(problem.optString("fileName")).append(" · ").append(problem.optString("seasonLabel")).append(english?" · Dates preserved; note/date format needs review: ":" · Termine unverändert; Notiz-/Datumsformat prüfen: ").append(problem.optString("code"));}
        TextView text=text(b.toString(),12,TEXT);text.setTextIsSelectable(true);ScrollView scroll=new ScrollView(this);scroll.addView(text);
        archiveDialogOpen=true;dialogBuilder().setTitle(english?"Maintenance results":"Wartungsergebnis").setView(scroll).setPositiveButton(english?"Close":"Schließen",null).setOnDismissListener(d->archiveDialogOpen=false).show();
    }

    private void toggleArchiveSeen(JSONObject entry){
        try{sendRequest("seen",new JSONObject().put("tmdbId",entry.getInt("tmdbId")).put("seasonLabel",entry.getString("seasonLabel")).put("seen",entry.optInt("seen")!=1));}catch(Exception ignored){}
    }
    private void showArchiveMenu(){
        archiveDialogOpen=true;dialogBuilder().setTitle(english?"Archive actions":"Archivaktionen")
            .setItems(english?new String[]{"TMDB API key","Google account","Sync now","Reload archive","Maintenance","Last maintenance results","Log"}:new String[]{"TMDB API-Key","Google-Konto","Jetzt synchronisieren","Archiv neu laden","Wartung","Letztes Wartungsergebnis","Log"},(d,which)->handler.post(()->runArchiveMenuAction(which)))
            .setNegativeButton(english?"Close":"Schließen",null).setOnDismissListener(d->archiveDialogOpen=false).show();
    }
    private void runArchiveMenuAction(int which){
        if(which==0){askForKey();return;}
        if(which==1){googleMenu();return;}
        if(which==2){if(archiveCopy!=null && !archiveCopy.busy())archiveCopy.schedule(0);return;}
        if(which==3){loadArchive();checkPendingRequest();return;}
        if(which==4){askMaintenanceCountry();return;}
        if(which==5){try{String result=getPreferences(0).getString("maintenanceReport","");if(!result.isEmpty())showMaintenanceReport(new JSONObject(result));else statusText.setText(english?"No maintenance results yet.":"Noch kein Wartungsergebnis vorhanden.");}catch(Exception ignored){}return;}
        try{TextView lines=text((archiveCopy==null?"":archiveCopy.readLog())+GoogleHttpFailure.readLog(this),11,TEXT);lines.setTextIsSelectable(true);ScrollView scroll=new ScrollView(this);scroll.addView(lines);
            archiveDialogOpen=true;dialogBuilder().setTitle("SerKal Log").setView(scroll).setPositiveButton(english?"Close":"Schließen",null).setOnDismissListener(d->archiveDialogOpen=false).show();
        }catch(Exception error){statusText.setText(english?"Log unavailable":"Log nicht verfügbar");}
    }

    private void askForSeason() {
        if(!writeReady() || selectedTmdbId<=0)return;
        EditText input=new EditText(new android.view.ContextThemeWrapper(this, dark ? android.R.style.Theme_Material : android.R.style.Theme_Material_Light));
        String preferred=seasonField==null?"":seasonField.getText().toString().trim();input.setText(preferred.isEmpty()?"1":preferred);input.setTextColor(TEXT);input.setInputType(InputType.TYPE_CLASS_NUMBER);
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
                        JSONObject payload=SeasonInput.schedule(detail,episodeData,season);
                        String first=detail.optString("first_air_date");if(first.length()<4)throw new Exception("YEAR");
                        payload.put("tmdbId",id).put("titel",detail.getString("name")).put("jahr",first.substring(0,4))
                            .put("staffelNummer",season)
                            .put("descDE",de.optString("overview")).put("descEN",en.optString("overview"))
                            .put("titleDE",de.optString("name")).put("titleEN",en.optString("name")).put("calendarLanguage",language?"en":"de");
                        handler.post(() -> {if(generation!=googleGeneration || isFinishing())return;
                            archiveDialogOpen=true;
        dialogBuilder().setTitle(english ? "Archive and calendar" : "Archiv und Kalender")
                                .setMessage(detail.optString("name")+" · S"+season+" · "+payload.optInt("episoden")+(english ? " episodes. " : " Folgen. ")+(payload.optBoolean("announcementOnly")?(english?"Announced start: ":"Angekündigter Start: ")+payload.optString("announcedStart")+(english?". Episode dates remain unknown. ":". Folgentermine sind noch unbekannt. "):"")+(english?"Save on this device?":"Auf diesem Gerät speichern?"))
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
        if(googleBusy)googleTrace("ACTIVITY_DESTROYED_DURING_LOGIN");
        stopGoogleTimeout();
        handler.removeCallbacks(closeProgressTicker);
        requestGeneration++;
        googleGeneration++;
        archiveGeneration++;
        handler.removeCallbacksAndMessages(null);
        if(archiveCopy!=null)archiveCopy.close();
        network.shutdownNow(); maintenanceWorker.shutdownNow(); pictures.shutdownNow(); posterCache.evictAll(); posterGeneration++;
        super.onDestroy();
    }

    protected TmdbClient tmdbClient(String key) { return new TmdbClient(key); }
    private void openTmdbPage(boolean help) {
        String url=help?(english?"https://serkal.de/tmdb-help.html":"https://serkal.de/tmdb-hilfe.html")
            :"https://www.themoviedb.org/settings/api?language="+(english?"en-US":"de-DE");
        try{startActivity(new android.content.Intent(android.content.Intent.ACTION_VIEW,android.net.Uri.parse(url)));}
        catch(Exception error){statusText.setText((english?"Open in your browser: ":"Im Browser öffnen: ")+url);}
    }
    private void askForKey() {
        if (keySetupOpen) return;
        keySetupOpen=true;
        android.widget.LinearLayout content=new android.widget.LinearLayout(this);content.setOrientation(android.widget.LinearLayout.VERTICAL);content.setPadding(24,12,24,12);
        TextView explanation=text(english
            ? "SerKal needs your Google account and your personal TMDB API key. The API key lets SerKal search for series. Request it once from TMDB, then paste it here. This is not your Google password. Your other devices can use the same key through your Google account. The guide explains each step."
            : "SerKal braucht dein Google-Konto und deinen persönlichen API-Key von TMDB. Der API-Key ermöglicht die Seriensuche. Beantrage ihn einmal bei TMDB und füge ihn hier ein. Das ist nicht dein Google-Passwort. Auf deinen weiteren Geräten kann SerKal ihn über dasselbe Google-Konto übernehmen. Die Anleitung erklärt jeden Schritt.",14,TEXT);
        content.addView(explanation);
        EditText input = new EditText(new android.view.ContextThemeWrapper(this, dark ? android.R.style.Theme_Material : android.R.style.Theme_Material_Light));
        input.setTextColor(TEXT);input.setHint(english?"TMDB API key or read access token":"API-Key von TMDB oder Lesezugriffstoken");
        input.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_PASSWORD);content.addView(input);
        android.widget.Button create=new android.widget.Button(this);create.setText(english?"Open API key guide":"API-Key anfordern");create.setOnClickListener(v->openTmdbPage(true));content.addView(create);
        ScrollView scroll=new ScrollView(this);scroll.addView(content);
        archiveDialogOpen=true;
        AlertDialog keyDialog=dialogBuilder().setTitle(english?"Set up TMDB":"TMDB einrichten").setView(scroll)
            .setPositiveButton(english?"Check":"Prüfen",null)
            .setNeutralButton(english?"Open Help":"Hilfe öffnen",null)
            .setNegativeButton(english?"Cancel":"Abbrechen",null)
            .setOnDismissListener(d->{archiveDialogOpen=false;keySetupOpen=false;handler.post(this::updateSetup);}).create();
        keyDialog.show();keyDialog.getButton(AlertDialog.BUTTON_NEUTRAL).setOnClickListener(v->openTmdbPage(true));
        keyDialog.getButton(AlertDialog.BUTTON_POSITIVE).setOnClickListener(v->{
            final String candidate=input.getText().toString().trim();
            if(candidate.isEmpty()){input.setError(english?"Please enter an API key or token.":"Bitte einen API-Key oder Token eingeben.");return;}
            final int generation=++requestGeneration;final String keyOwner=googleUser==null?"":googleUser.owner;
            keyDialog.getButton(AlertDialog.BUTTON_POSITIVE).setEnabled(false);
            statusText.setText(english?"Checking key…":"API-Key wird geprüft…");
            network.execute(()->{
                try{
                    tmdbClient(candidate).validate();
                    handler.post(()->{
                        if(generation!=requestGeneration||isFinishing()||!keyDialog.isShowing())return;
                        try{if(!keyOwner.isEmpty())KeyCache.save(this,keyOwner,candidate);}
                        catch(Exception saveError){keyDialog.getButton(AlertDialog.BUTTON_POSITIVE).setEnabled(true);input.setError(english?"Key could not be saved. Please retry.":"API-Key konnte nicht gespeichert werden. Bitte erneut versuchen.");return;}
                        credential=candidate;keyChecked=true;setupIssue="";keyDialog.dismiss();
                        updateSetup();
                        statusText.setText(english?"Key accepted. Enter a series.":"API-Key gültig. Serie eingeben.");
                        if(googleUser!=null && !googleAccessToken.isEmpty()) confirmPublish(candidate);
                        if(queryField.getText().length()>=2)searchNow();
                    });
                }catch(Exception error){
                    handler.post(()->{
                        if(generation!=requestGeneration||isFinishing()||!keyDialog.isShowing())return;
                        keyDialog.getButton(AlertDialog.BUTTON_POSITIVE).setEnabled(true);
                        input.setError("KEY".equals(error.getMessage())?(english?"Key rejected. Please check it.":"API-Key abgelehnt. Bitte prüfen.")
                            :(english?"Could not verify or save the key. Please retry.":"API-Key konnte nicht geprüft oder gespeichert werden. Bitte erneut versuchen."));
                    });
                    showNetworkError(generation,error);
                }
            });
        });
    }

    private void showNetworkError(int generation, Exception error) {
        String code = error.getMessage();
        handler.post(() -> {
            if (generation != requestGeneration) return;
            statusText.setText("KEY".equals(code)
                ? (english ? "API key rejected. Check the key." : "API-Key abgelehnt. Bitte prüfen.")
                : (english ? "TMDB unavailable. Please retry." : "TMDB nicht erreichbar. Bitte erneut versuchen."));
        });
    }

    private void closeSearchKeyboard_() {
        View focused=getCurrentFocus();
        if(queryField!=null)queryField.clearFocus();
        if(focused!=null&&focused!=queryField)focused.clearFocus();
        if(insetRoot!=null){insetRoot.setFocusableInTouchMode(true);insetRoot.requestFocus();}
        WindowCompat.getInsetsController(getWindow(),getWindow().getDecorView()).hide(WindowInsetsCompat.Type.ime());
        android.view.inputmethod.InputMethodManager keyboard=(android.view.inputmethod.InputMethodManager)getSystemService(INPUT_METHOD_SERVICE);
        if(keyboard!=null&&queryField!=null)keyboard.hideSoftInputFromWindow(queryField.getWindowToken(),0);
    }
    private void searchExplicitly_() {
        closeSearchKeyboard_();
        searchNow();
    }

    private void searchNow() {
        if (pendingSearch != null) handler.removeCallbacks(pendingSearch);
        final String query = queryField.getText().toString().trim();
        final String year = yearField==null?"":yearField.getText().toString().trim();
        final int generation = ++requestGeneration;
        final boolean language = english;
        suggestions.removeAllViews(); displayedResults.clear(); selectedDetail=null; selectedArchiveEntry=null; selectedTmdbId=0; updateTmdbReference(); clearPoster();
        selectedTmdbId = 0; selectedArchiveEntry=null;
        selectedName.setText(english ? "Select a series" : "Serie auswählen");
        selectedInfo.setText("");
        if (query.length() < 2) return;
        if(!year.isEmpty() && !year.matches("\\d{4}")){statusText.setText(english?"Enter a four-digit year or leave it blank.":"Bitte ein vierstelliges Jahr eingeben oder das Feld leeren.");return;}
        if (setupActive && !setupReady()) { updateSetup(); return; }
        if (credential.isEmpty()) { askForKey(); return; }
        final String key = credential;
        statusText.setText(english ? "Searching…" : "Suche läuft…");
        network.execute(() -> {
            try {
                List<JSONObject> results = new TmdbClient(key).search(query, language, year);
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
        showPanel_(1);
        final int generation = ++requestGeneration;
        final int id = entry.optInt("id");
        clearPoster(); selectedDetail=null; selectedArchiveEntry=null; selectedTmdbId=0;updateTmdbReference();
        selectedName.setText(entry.optString("name"));
        statusText.setText(english ? "Loading series…" : "Serie wird geladen…");
        network.execute(() -> {
            try {
                JSONObject detail = new TmdbClient(key).details(id, language);
                handler.post(() -> {
                    if (generation != requestGeneration) return;
                    selectedTmdbId = id; updateTmdbReference(); selectedArchiveEntry=null; selectedDetail=detail;
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
            preferLandscape_();
            configureFullscreen_();
            buildScreen();
            boolean interrupted=getPreferences(0).getBoolean("googleAttemptPending",false);
            GoogleHttpFailure.event(this,"APP_START",0,"startup",0);
            if(interrupted){
                googleTrace("PREVIOUS_ATTEMPT_INTERRUPTED");
                getPreferences(0).edit().putBoolean("googleAttemptPending",false).apply();
                restoreLocalArchive();
                statusText.setText(english?"Previous Google connection did not finish. Retry through Menu > Google account. Details are in Log.":"Die letzte Google-Verbindung wurde nicht abgeschlossen. Erneut versuchen über Menü > Google-Konto. Details stehen im Log.");
            }else handler.post(() -> { if (!isFinishing()) connectGoogle(false); });
        } catch (Throwable error) {
            showStartupError_(error);
        }
    }

    @Override public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) hideSystemBars_();
    }

    private void preferLandscape_() {
        boolean flexible=getResources().getConfiguration().smallestScreenWidthDp>=600
            || (android.os.Build.VERSION.SDK_INT>=24 && isInMultiWindowMode());
        int preferred=flexible?android.content.pm.ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED
            :android.content.pm.ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE;
        if(getRequestedOrientation()!=preferred)setRequestedOrientation(preferred);
    }
    @Override public void onConfigurationChanged(android.content.res.Configuration configuration){
        super.onConfigurationChanged(configuration);preferLandscape_();
        if(insetRoot!=null)ViewCompat.requestApplyInsets(insetRoot);
    }
    private void configureFullscreen_() {
        Window window=getWindow();
        window.setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE);
        window.setBackgroundDrawable(new android.graphics.drawable.ColorDrawable(BG));
        // Android 15+ already enforces edge-to-edge for our target SDK.
        // On older versions opt into layout under the bars without changing their colors.
        if (android.os.Build.VERSION.SDK_INT < 35) {
            WindowCompat.setDecorFitsSystemWindows(window,false);
        }
        WindowInsetsControllerCompat bars=WindowCompat.getInsetsController(window,window.getDecorView());
        bars.setAppearanceLightStatusBars(!dark);bars.setAppearanceLightNavigationBars(!dark);
        hideSystemBars_();
    }
    private void hideSystemBars_() {
        WindowInsetsControllerCompat bars=WindowCompat.getInsetsController(getWindow(),getWindow().getDecorView());
        bars.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
        bars.hide(WindowInsetsCompat.Type.systemBars());
    }
    private LinearLayout insetRoot,adaptiveColumns,adaptiveTabs;
    private final java.util.List<View> adaptivePanels=new java.util.ArrayList<>();
    private int activePanel;
    private Button keyboardCloseButton;
    private void showPanel_(int panel){activePanel=panel;adaptPanels_();}
    private boolean titleTypingMode;
    private void adaptPanels_(){
        if(insetRoot==null||adaptiveColumns==null)return;
        int usableWidth=insetRoot.getWidth()-insetRoot.getPaddingLeft()-insetRoot.getPaddingRight();
        int usableHeight=insetRoot.getHeight();
        // Keep the established three-column landscape layout on ordinary phones.
        boolean compact=titleTypingMode||usableWidth<dp(700)||(usableWidth<dp(840)&&usableWidth<usableHeight);
        adaptiveTabs.setVisibility(compact&&!titleTypingMode?View.VISIBLE:View.GONE);
        float[] weights={29,42,29};
        for(int i=0;i<adaptivePanels.size();i++){
            View panel=adaptivePanels.get(i);LinearLayout.LayoutParams lp=(LinearLayout.LayoutParams)panel.getLayoutParams();
            int width=compact?-1:0;float weight=compact?0:weights[i];
            if(lp.width!=width||lp.weight!=weight){lp.width=width;lp.weight=weight;panel.setLayoutParams(lp);}
            panel.setVisibility(!compact||i==(titleTypingMode?0:activePanel)?View.VISIBLE:View.GONE);
            if(i<adaptiveTabs.getChildCount())adaptiveTabs.getChildAt(i).setSelected(i==activePanel);
        }
    }
    private android.widget.HorizontalScrollView scrollBar_(View content){
        android.widget.HorizontalScrollView scroll=new android.widget.HorizontalScrollView(this);scroll.setFillViewport(true);scroll.setHorizontalScrollBarEnabled(false);
        content.setMinimumWidth(dp(540));scroll.addView(content,new android.widget.FrameLayout.LayoutParams(-1,-2));return scroll;
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
        titleTypingMode=false;
        String previousQuery = queryField == null ? "" : queryField.getText().toString();
        String previousYear = yearField == null ? "" : yearField.getText().toString();
        String previousSeason = seasonField == null ? "" : seasonField.getText().toString();
        CharSequence previousStatus = statusText == null ? "" : statusText.getText();
        CharSequence previousName = selectedName == null ? "" : selectedName.getText();
        CharSequence previousInfo = selectedInfo == null ? "" : selectedInfo.getText();
        Bitmap previousPoster=selectedPoster; String previousPath=selectedPosterPath;
        posterGeneration++;
        requestGeneration++;
        if (pendingSearch != null) handler.removeCallbacks(pendingSearch);
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setTag("insetRoot");insetRoot=root;adaptivePanels.clear();
        root.setBackgroundColor(BG);
        root.setPadding(dp(4), dp(3), dp(4), dp(4));

        LinearLayout top = new LinearLayout(this);
        top.setGravity(Gravity.CENTER_VERTICAL);
        keyboardCloseButton=footerButton(english?"Close keyboard":"Tastatur schließen");
        keyboardCloseButton.setTag("closeKeyboard");keyboardCloseButton.setVisibility(View.GONE);
        keyboardCloseButton.setOnClickListener(v->closeSearchKeyboard_());
        // The keyboard controls stay attached to the search row throughout the session.
        TextView title = text("SerKal", 13, TEXT);
        title.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        title.setTag("appTitle");
        top.addView(title, new LinearLayout.LayoutParams(0, dp(31), 1));
        Button headerSearch=footerButton(english?"Search":"Suchen");
        headerSearch.setTag("headerSearch");headerSearch.setVisibility(View.GONE);
        headerSearch.setOnClickListener(v->searchExplicitly_());
        TextView preview = text(BuildConfig.VERSION_NAME, 7.5f, MUTED);
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
        Button theme = new Button(this); theme.setText(english ? (dark ? "Light" : "Dark") : (dark ? "Hell" : "Dunkel"));
        styleTopButton_(theme);
        theme.setOnClickListener(v -> { dark=!dark;getPreferences(0).edit().putBoolean("dark",dark).apply();setPalette();configureFullscreen_();buildScreen(); });

        View topBar=scrollBar_(top);
        root.addView(topBar,new LinearLayout.LayoutParams(-1,-2));
        adaptiveTabs=new LinearLayout(this);adaptiveTabs.setOrientation(LinearLayout.HORIZONTAL);adaptiveTabs.setTag("adaptiveTabs");
        String[] tabs=english?new String[]{"Search","Entry","Archive"}:new String[]{"Suche","Eintrag","Archiv"};
        for(int i=0;i<tabs.length;i++){final int index=i;Button tab=button(tabs[i]);tab.setTag("panelTab"+i);tab.setOnClickListener(v->showPanel_(index));adaptiveTabs.addView(tab);}
        root.addView(adaptiveTabs,new LinearLayout.LayoutParams(-1,-2));

        zoomSurface = new ZoomPanLayout(this);
        zoomSurface.setBackgroundColor(BG);
        zoomSurface.setOnScaleChangedListener(value -> resetZoom.setText(Math.round(value * 100) + " %"));
        LinearLayout columns = new LinearLayout(this);
        columns.setOrientation(LinearLayout.HORIZONTAL);adaptiveColumns=columns;columns.setTag("adaptiveColumns");
        zoomSurface.addView(columns, new ZoomPanLayout.LayoutParams(-1, -1));
        root.addView(zoomSurface, new LinearLayout.LayoutParams(-1, 0, 1));

        // Verbindliche Reihenfolge wie am Desktop: Suche – Anzeige/Bearbeitung – Archiv.
        LinearLayout left = panel(29);
        View searchHeading=heading(english ? "SEARCH & ENTRY" : "SUCHE & EINTRAG");
        left.addView(searchHeading);
        LinearLayout searchFields=new LinearLayout(this);searchFields.setOrientation(LinearLayout.HORIZONTAL);searchFields.setGravity(Gravity.CENTER_VERTICAL);
        TextView titleLabel=text(english?"Title":"Titel",9,TEXT);titleLabel.setTypeface(Typeface.DEFAULT,Typeface.BOLD);searchFields.addView(titleLabel,new LinearLayout.LayoutParams(-2,dp(34)));
        queryField = new EditText(new android.view.ContextThemeWrapper(this, dark ? android.R.style.Theme_Material : android.R.style.Theme_Material_Light));
        queryField.setSingleLine(true);
        queryField.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_FLAG_CAP_SENTENCES);
        queryField.setTag("seriesTitleInput");
        // Keep the real title field and suggestions visible in landscape.
        queryField.setImeOptions(android.view.inputmethod.EditorInfo.IME_FLAG_NO_EXTRACT_UI
            | android.view.inputmethod.EditorInfo.IME_FLAG_NO_FULLSCREEN
            | android.view.inputmethod.EditorInfo.IME_ACTION_SEARCH);
        queryField.setOnEditorActionListener((view,action,event)->{
            boolean enter=event!=null&&event.getKeyCode()==android.view.KeyEvent.KEYCODE_ENTER;
            if(action==android.view.inputmethod.EditorInfo.IME_ACTION_SEARCH||action==android.view.inputmethod.EditorInfo.IME_ACTION_DONE||enter){
                if(!enter||event.getAction()==android.view.KeyEvent.ACTION_DOWN)searchExplicitly_();
                return true;
            }
            return false;
        });
        queryField.setTextSize(14);
        queryField.setPadding(dp(5),dp(2),dp(4),dp(2));
        queryField.setTextColor(TEXT);
        queryField.setHintTextColor(MUTED);
        queryField.setHint(english ? "Series title" : "Serientitel");
        queryField.setText(previousQuery);
        LinearLayout.LayoutParams inlineQueryParams = new LinearLayout.LayoutParams(0,dp(34),1);
        searchFields.addView(queryField,inlineQueryParams);
        yearField=new EditText(new android.view.ContextThemeWrapper(this,dark?android.R.style.Theme_Material:android.R.style.Theme_Material_Light));
        yearField.setSingleLine(true);yearField.setInputType(InputType.TYPE_CLASS_NUMBER);yearField.setTextSize(TypedValue.COMPLEX_UNIT_DIP,9);
        yearField.setTextColor(TEXT);yearField.setHintTextColor(MUTED);yearField.setHint(english?"Year":"Jahr");yearField.setGravity(Gravity.CENTER);
        yearField.setPadding(dp(2),0,dp(2),0);yearField.setText(previousYear);searchFields.addView(yearField,new LinearLayout.LayoutParams(dp(44),dp(34)));
        seasonField=new EditText(new android.view.ContextThemeWrapper(this,dark?android.R.style.Theme_Material:android.R.style.Theme_Material_Light));
        seasonField.setSingleLine(true);seasonField.setInputType(InputType.TYPE_CLASS_NUMBER);seasonField.setTextSize(TypedValue.COMPLEX_UNIT_DIP,9);
        seasonField.setTextColor(TEXT);seasonField.setHintTextColor(MUTED);seasonField.setHint("S");seasonField.setGravity(Gravity.CENTER);
        seasonField.setPadding(dp(2),0,dp(2),0);seasonField.setText(previousSeason);searchFields.addView(seasonField,new LinearLayout.LayoutParams(dp(32),dp(34)));
        searchFields.addView(keyboardCloseButton,0,new LinearLayout.LayoutParams(-2,dp(34)));
        searchFields.addView(headerSearch,new LinearLayout.LayoutParams(-2,dp(34)));
        left.addView(searchFields);
        suggestions = new LinearLayout(this);
        suggestions.setOrientation(LinearLayout.VERTICAL);
        ScrollView resultsScroll = new ScrollView(this);
        resultsScroll.addView(suggestions);
        left.addView(resultsScroll, new LinearLayout.LayoutParams(-1, 0, 1));
        statusText = text(english ? "API key required." : "API-Key erforderlich.", 9, MUTED);
        left.addView(statusText);
        queryField.addTextChangedListener(new TextWatcher() {
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {}
            public void onTextChanged(CharSequence s, int start, int before, int count) {
                if(resettingSearch)return;
                requestGeneration++;
                if (pendingSearch != null) handler.removeCallbacks(pendingSearch);
                if (!credential.isEmpty()) {
                    pendingSearch = () -> searchNow();
                    handler.postDelayed(pendingSearch, 450);
                }
            }
            public void afterTextChanged(Editable value) {}
        });
        LinearLayout leftButtons = new LinearLayout(this);leftButtons.setOrientation(LinearLayout.HORIZONTAL);
        leftButtons.setTag("searchActions");
        Button reset=button("Reset");reset.setTag("resetSearch");reset.setOnClickListener(v->resetSearch());leftButtons.addView(reset);
        Button search=button(english?"Search":"Suchen");search.setTag("submitSearch");search.setOnClickListener(v->searchExplicitly_());leftButtons.addView(search);
        Button add=button(english?"Add to archive":"Ins Archiv");add.setTag("addToArchive");add.setOnClickListener(v->askForSeason());leftButtons.addView(add);
        left.addView(leftButtons,2);
        left.setTag("panelSearch");adaptivePanels.add(left);columns.addView(left);

        LinearLayout middle = panel(43);
        middle.addView(heading(english ? "ENTRY" : "EINTRAG"));
        selectedName = text(english ? "Select a series" : "Serie auswählen", 14, TEXT);
        selectedName.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        middle.addView(selectedName);
        tmdbReference=text("",11,BLUE);tmdbReference.setPadding(0,dp(6),0,dp(6));
        tmdbReference.setOnClickListener(v->showTmdbLinks());
        tmdbReference.setOnLongClickListener(v->{if(selectedTmdbId<=0)return false;android.content.ClipboardManager clip=(android.content.ClipboardManager)getSystemService(CLIPBOARD_SERVICE);clip.setPrimaryClip(android.content.ClipData.newPlainText("TMDB",String.valueOf(selectedTmdbId)));statusText.setText(english?"TMDB number copied":"TMDB-Nummer kopiert");return true;});
        middle.addView(tmdbReference);updateTmdbReference();
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
        Button edit=button(english ? "Edit ▾" : "Bearbeiten ▾");
        edit.setTag("editEntry");edit.setMinWidth(0);edit.setMinimumWidth(0);
        edit.setPadding(dp(8),0,dp(8),0);edit.setLayoutParams(new LinearLayout.LayoutParams(-2,dp(30)));
        edit.setOnClickListener(v->{archiveDialogOpen=true;dialogBuilder().setTitle(english?"Selected series":"Ausgewählte Serie")
            .setItems(english?new String[]{"Edit notes / offset / provider","Toggle watched","Delete complete series"}:new String[]{"Notiz / Offset / Anbieter ändern","Gesehen umschalten","Ganze Serie löschen"},(d,which)->handler.post(()->{if(which==0)editArchiveNotes();else if(which==1 && selectedArchiveEntry!=null)toggleArchiveSeen(selectedArchiveEntry);else if(which==2)deleteArchiveSeries();}))
            .setNegativeButton(english?"Close":"Schließen",null).setOnDismissListener(d->archiveDialogOpen=false).show();});editBar.addView(edit);middle.addView(editBar);
        middle.setTag("panelEntry");adaptivePanels.add(middle);columns.addView(middle);

        LinearLayout right = panel(28);
        LinearLayout archiveBar=new LinearLayout(this);archiveBar.setOrientation(LinearLayout.HORIZONTAL);archiveBar.setGravity(Gravity.CENTER_VERTICAL);
        archiveBar.addView(heading(english ? "SHARED ARCHIVE" : "GEMEINSAMES ARCHIV"),new LinearLayout.LayoutParams(0,dp(26),1));
        Button sort=button(getPreferences(0).getString("archiveSort","date").equals("date")?(english?"Date ↓":"Datum ↓"):"A–Z");
        sort.setContentDescription(english?"Switch archive sorting between date and alphabet":"Archivsortierung zwischen Datum und Alphabet wechseln");
        sort.setTextSize(TypedValue.COMPLEX_UNIT_DIP,8);sort.setLayoutParams(new LinearLayout.LayoutParams(-2,dp(26)));sort.setPadding(dp(4),0,dp(4),0);
        sort.setOnClickListener(v->{boolean date=getPreferences(0).getString("archiveSort","date").equals("date");getPreferences(0).edit().putString("archiveSort",date?"alpha":"date").apply();sort.setText(date?"A–Z":(english?"Date ↓":"Datum ↓"));renderArchive();});archiveBar.addView(sort);
        Button menu=button(english?"Menu ▾":"Menü ▾");menu.setTextSize(TypedValue.COMPLEX_UNIT_DIP,8);menu.setLayoutParams(new LinearLayout.LayoutParams(-2,dp(26)));menu.setPadding(dp(4),0,dp(4),0);menu.setOnClickListener(v->showArchiveMenu());archiveBar.addView(menu);
        archiveCount=text("—",8,TEXT);archiveCount.setGravity(Gravity.CENTER);archiveCount.setBackgroundColor(CARD);archiveCount.setMinWidth(dp(28));archiveCount.setPadding(dp(4),0,dp(4),0);archiveBar.addView(archiveCount,new LinearLayout.LayoutParams(-2,dp(26)));right.addView(archiveBar);
        archiveStatus=text("",9,MUTED);archiveStatus.setMaxLines(1);right.addView(archiveStatus);
        authorityButton=button(english?"Make archive authoritative":"Diesen Stand festlegen");authorityButton.setLayoutParams(new LinearLayout.LayoutParams(-1,dp(30)));
        authorityButton.setTextColor(Color.WHITE);authorityButton.setBackgroundColor(RED);
        authorityButton.setOnClickListener(v->confirmMakeLocalAuthoritative());authorityButton.setVisibility(View.GONE);right.addView(authorityButton);
        archiveRows=new LinearLayout(this);archiveRows.setOrientation(LinearLayout.VERTICAL);
        ScrollView archiveScroll=new ScrollView(this);archiveScroll.setFillViewport(true);archiveScroll.setVerticalScrollBarEnabled(true);archiveScroll.addView(archiveRows);right.addView(archiveScroll,new LinearLayout.LayoutParams(-1,0,1));
        copySyncButton=null;copySyncStatus=text("",9,MUTED);copySyncStatus.setMaxLines(2);copySyncStatus.setEllipsize(android.text.TextUtils.TruncateAt.END);right.addView(copySyncStatus);
        closeProgress=new android.widget.ProgressBar(this,null,android.R.attr.progressBarStyleHorizontal);closeProgress.setVisibility(View.GONE);right.addView(closeProgress,new LinearLayout.LayoutParams(-1,dp(6)));
        copySyncStatus.setOnClickListener(v->{archiveDialogOpen=true;dialogBuilder().setTitle(english?"Synchronization":"Synchronisation").setMessage(copySyncStatus.getText()).setPositiveButton(english?"Close":"Schließen",null).setOnDismissListener(d->archiveDialogOpen=false).show();});
        renderArchive();
        right.setTag("panelArchive");adaptivePanels.add(right);columns.addView(right);

        LinearLayout footer=new LinearLayout(this);footer.setOrientation(LinearLayout.HORIZONTAL);footer.setGravity(Gravity.CENTER_VERTICAL);footer.setTag("globalFooter");
        for(boolean en:new boolean[]{false,true}){
            android.widget.ImageButton flag=new android.widget.ImageButton(this);
            flag.setImageDrawable(new LanguageFlagDrawable(en));flag.setScaleType(ImageView.ScaleType.FIT_CENTER);
            flag.setPadding(dp(6),dp(5),dp(6),dp(5));flag.setBackgroundColor(en==english?BLUE:CARD);
            flag.setContentDescription(en?"English":"Deutsch");flag.setTag(en?"languageEN":"languageDE");
            flag.setOnClickListener(v->selectLanguage(en));footer.addView(flag,new LinearLayout.LayoutParams(dp(40),dp(32)));
        }
        theme.setTag("themeToggle");theme.setMinWidth(0);theme.setMinimumWidth(0);theme.setPadding(dp(8),0,dp(8),0);footer.addView(theme,new LinearLayout.LayoutParams(-2,dp(32)));
        Button calendarButton=footerButton(english?"Open calendar":"Kalender öffnen");calendarButton.setTag("openCalendar");calendarButton.setOnClickListener(v->openCalendar());footer.addView(calendarButton);
        Button help=footerButton(english?"Help":"Hilfe");help.setTag("help");help.setOnClickListener(v->showHelp());footer.addView(help);
        footer.addView(new View(this),new LinearLayout.LayoutParams(0,1,1));
        Button quitButton=footerButton(english?"Exit SerKal":"SerKal beenden");quitButton.setTag("exitSerKal");quitButton.setOnClickListener(v->exitSerKal());footer.addView(quitButton);
        View footerBar=scrollBar_(footer);
        root.addView(footerBar,new LinearLayout.LayoutParams(-1,dp(36)));
        ViewCompat.setOnApplyWindowInsetsListener(root,(view,insets)->{
            boolean keyboardVisible = insets.isVisible(WindowInsetsCompat.Type.ime());
            boolean typingTitle = keyboardVisible && queryField.hasFocus();
            titleTypingMode=typingTitle;
            keyboardCloseButton.setVisibility(keyboardVisible ? View.VISIBLE : View.GONE);
            headerSearch.setVisibility(typingTitle ? View.VISIBLE : View.GONE);
            search.setVisibility(typingTitle ? View.GONE : View.VISIBLE);
            // Keep the original editor attached: reparenting interrupts Android's input connection.
            topBar.setVisibility(typingTitle ? View.GONE : View.VISIBLE);
            footerBar.setVisibility(typingTitle ? View.GONE : View.VISIBLE);
            title.setVisibility(typingTitle ? View.GONE : View.VISIBLE);
            searchHeading.setVisibility(typingTitle ? View.GONE : View.VISIBLE);
            titleLabel.setVisibility(typingTitle ? View.GONE : View.VISIBLE);
            yearField.setVisibility(typingTitle ? View.GONE : View.VISIBLE);
            seasonField.setVisibility(typingTitle ? View.GONE : View.VISIBLE);
            Insets visible = insets.getInsets(WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.ime());
            Insets cutout = insets.getInsetsIgnoringVisibility(WindowInsetsCompat.Type.displayCutout());
            Insets safe = Insets.max(visible,cutout);
            view.setPadding(dp(4)+safe.left,dp(3)+safe.top,dp(4)+safe.right,dp(4)+safe.bottom);
            adaptPanels_();
            return insets;
        });
        root.addOnLayoutChangeListener((v,l,t,r,b,ol,ot,or,ob)->{if(r-l!=or-ol||b-t!=ob-ot)adaptPanels_();});
        setContentView(root);ViewCompat.requestApplyInsets(root);root.post(this::adaptPanels_);
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

    private Button footerButton(String label){
        Button b=button(label);b.setMinWidth(0);b.setMinimumWidth(0);b.setPadding(dp(8),0,dp(8),0);
        LinearLayout.LayoutParams params=new LinearLayout.LayoutParams(-2,dp(32));params.setMargins(dp(2),0,dp(2),0);b.setLayoutParams(params);return b;
    }
    private void selectLanguage(boolean en){
        if(english==en)return;
        english=en;getPreferences(0).edit().putBoolean("english",english).apply();buildScreen();
        if(selectedArchiveEntry!=null)showArchiveEntry(selectedArchiveEntry);
        else if(selectedTmdbId>0){try{selectSeries(new JSONObject().put("id",selectedTmdbId).put("name",selectedName.getText().toString()),credential,english);}catch(Exception ignored){}}
        else if(queryField.getText().length()>=2 && !credential.isEmpty())searchNow();
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






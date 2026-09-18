package de.serkal.android.training;

import android.app.Activity;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.os.Bundle;
import android.text.InputType;
import android.view.Gravity;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;

public final class MainActivity extends Activity {
    private static final String PREFS = "serkal_training";
    private static final String KEY_ENTRY = "test_entry";
    private static final String KEY_LANG = "language";

    private SharedPreferences prefs;
    private boolean english;
    private TextView heading;
    private TextView explanation;
    private EditText entryInput;
    private Button saveButton;
    private Button clearButton;
    private Button languageButton;
    private TextView savedHeading;
    private TextView savedValue;
    private TextView result;

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        prefs = getSharedPreferences(PREFS, MODE_PRIVATE);
        english = "en".equals(prefs.getString(KEY_LANG, "de"));
        setContentView(buildScreen());
        refreshTexts();
        showSavedEntry();
    }

    private View buildScreen() {
        int pad = dp(22);
        LinearLayout content = new LinearLayout(this);
        content.setOrientation(LinearLayout.VERTICAL);
        content.setPadding(pad, pad, pad, pad);
        content.setBackgroundColor(Color.rgb(245, 247, 252));

        heading = text(28, true);
        explanation = text(17, false);
        explanation.setPadding(0, dp(14), 0, dp(18));

        entryInput = new EditText(this);
        entryInput.setTextSize(19);
        entryInput.setSingleLine(true);
        entryInput.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_FLAG_CAP_SENTENCES);

        saveButton = button();
        clearButton = button();
        languageButton = button();

        savedHeading = text(18, true);
        savedHeading.setPadding(0, dp(24), 0, dp(8));
        savedValue = text(22, false);
        savedValue.setTextColor(Color.rgb(36, 59, 130));
        result = text(16, false);
        result.setPadding(0, dp(18), 0, dp(10));

        TextView version = text(15, false);
        version.setText("SerKal Android Training 0.0.1");
        version.setTextColor(Color.DKGRAY);
        version.setGravity(Gravity.CENTER_HORIZONTAL);
        version.setPadding(0, dp(30), 0, dp(8));

        saveButton.setOnClickListener(v -> saveEntry());
        clearButton.setOnClickListener(v -> clearEntry());
        languageButton.setOnClickListener(v -> switchLanguage());

        content.addView(heading);
        content.addView(explanation);
        content.addView(entryInput, matchWrap());
        content.addView(saveButton, matchWrap());
        content.addView(clearButton, matchWrap());
        content.addView(savedHeading);
        content.addView(savedValue);
        content.addView(result);
        content.addView(languageButton, matchWrap());
        content.addView(version);

        ScrollView scroll = new ScrollView(this);
        scroll.addView(content);
        return scroll;
    }

    private void saveEntry() {
        String value = entryInput.getText().toString().trim();
        if (value.isEmpty()) {
            result.setText(english ? "Please enter a test series first." : "Bitte zuerst eine Testserie eingeben.");
            return;
        }
        prefs.edit().putString(KEY_ENTRY, value).apply();
        result.setText(english ? "Saved. Now close and reopen the app." : "Gespeichert. Schließe und öffne die App jetzt erneut.");
        showSavedEntry();
    }

    private void clearEntry() {
        prefs.edit().remove(KEY_ENTRY).apply();
        entryInput.setText("");
        result.setText(english ? "The training entry was removed." : "Der Übungseintrag wurde entfernt.");
        showSavedEntry();
    }

    private void switchLanguage() {
        english = !english;
        prefs.edit().putString(KEY_LANG, english ? "en" : "de").apply();
        refreshTexts();
        showSavedEntry();
    }

    private void refreshTexts() {
        heading.setText(english ? "Welcome to SerKal Android" : "Willkommen bei SerKal Android");
        explanation.setText(english
                ? "This training version checks installation, saving, restarting, and later updating. Enter any series title."
                : "Diese Übungsversion prüft Installation, Speichern, Neustart und später das Aktualisieren. Gib irgendeinen Serientitel ein.");
        entryInput.setHint(english ? "Test series, e.g. Reacher" : "Testserie, z. B. Reacher");
        saveButton.setText(english ? "Save training entry" : "Übungseintrag speichern");
        clearButton.setText(english ? "Remove training entry" : "Übungseintrag entfernen");
        languageButton.setText(english ? "Auf Deutsch wechseln" : "Switch to English");
        savedHeading.setText(english ? "Saved on this phone:" : "Auf diesem Handy gespeichert:");
    }

    private void showSavedEntry() {
        String value = prefs.getString(KEY_ENTRY, "");
        savedValue.setText(value.isEmpty() ? (english ? "Nothing yet" : "Noch nichts") : value);
    }

    private TextView text(int sp, boolean bold) {
        TextView view = new TextView(this);
        view.setTextSize(sp);
        view.setTextColor(Color.rgb(17, 24, 39));
        if (bold) view.setTypeface(view.getTypeface(), android.graphics.Typeface.BOLD);
        return view;
    }

    private Button button() {
        Button view = new Button(this);
        view.setTextSize(17);
        view.setAllCaps(false);
        return view;
    }

    private LinearLayout.LayoutParams matchWrap() {
        LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT);
        params.setMargins(0, dp(8), 0, 0);
        return params;
    }

    private int dp(int value) {
        return Math.round(value * getResources().getDisplayMetrics().density);
    }
}

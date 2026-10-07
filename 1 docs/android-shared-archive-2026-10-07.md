# Shared archive preview — 2026-10-07

Desktop 1.2 Alpha 03 publishes a display-only snapshot of its configured TXT archive into the same Google project's private app-data area already used for the shared TMDB key. Android 0.0.5a4 loads the snapshot after Google login and via Reload archive. There are no added OAuth scopes, no Google Calendar writes and no changes to the original archive files from Android.

Each snapshot contains title, year, season, TMDB ID, episode count, effective episode dates, DE/EN description, notes and seen state. Raw archive lines, local paths, tokens and TMDB credentials are excluded. Data is validated against the verified Google account and limited to 8 MiB / 20,000 season entries.

The first Desktop profile and archive folder to publish become this snapshot's source. Another Desktop profile or a newly selected archive folder cannot overwrite that source. Updates are queued after load, insert, edit and deletion; key connection explicitly reports publication results. Android labels its data as a read-only Desktop snapshot and shows its generation time. Data is kept in memory, cleared on account switch, and asynchronous results are discarded after switching accounts or closing the Activity. An entry opens its existing description, dates and notes.

This is a snapshot, not direct access to the original Drive archive folder. A change on another Desktop sharing the same folder becomes visible after the source Desktop reloads and republishes that folder. If the source Desktop is closed the snapshot remains at its previous generation time. Publisher handoff, Android insert/edit/delete, conflict-safe concurrent writes, calendar synchronization and pictures remain subsequent work. They must not be described as completed by this preview.

## Signing correction

The previous workflow cached ~/.android/debug.keystore, but Gradle actually generated /home/runner/.config/.android/debug.keystore. Consequently the 0.0.5a1 private signing key was never retained and cannot be recovered from its APK. Intermediate CI artifacts a2/a3 are not user deliveries.

The CI workflow now tests and exports an unsigned a4 APK and the official Android SDK apksigner tool. CE signs the final deliverable with the privately retained SerKal-Android-Preview-Signing.jks. The private key is never uploaded to GitHub or to an Actions artifact/cache. Restore that same key for every future preview and compare the certificate before delivery; do not generate a replacement silently.

New certificate SHA-1: 0D:63:F5:08:DC:1F:E1:4E:97:6C:22:1A:0C:27:98:D3:A1:51:59:86
Application ID: de.serkal.android.preview.v005
Alias: serkal-preview (preview JKS, standard Android debug passwords)

One-time migration requires a new Android OAuth client for this package and certificate in the existing serkal-desktop Google project, plus uninstalling a1 before installing a4. No client JSON is needed in Android. The TMDB key remains stored in the user's Google app-data area and is adopted again after login; uninstalling does not delete it or the Desktop TXT archive. Future APKs must be signed with this same retained key so ordinary updates work.

## Validation and manual acceptance

Desktop tests cover account mismatch, duplicate/conflicting records, authority mismatch, creation, updates, no-op updates, schema/date validation and exclusion of raw files/credentials. Existing archive, maintenance, language, calendar repair, OAuth packaging, title localization, intelligent search and shared-key tests pass. Android tests validate account binding, entries, dates and an empty archive. The built APK must additionally pass apksigner verification, package/version/minimum-SDK checks and certificate equality.

1. On the chosen source PC, close the current development instance, pull the CE branch and start it. Confirm Alpha 03 and the correct existing archive. Press TMDB · Google, use the same account as Android, and confirm the archive-ready message.
2. After the one-time Android OAuth/signature migration, install a4 on Pixel 8, sign into that same account, and compare archive season entries and a known title's description/dates/notes with the source Desktop.
3. Edit a note on the source Desktop, save, wait for publication, then Reload archive on Android. Confirm it changed. Switch DE/EN and repeat selection; dates and entry count must remain unchanged.
4. Repeat the read test on Samsung. On the second Desktop, confirm its key still loads and that it reports the other Desktop as snapshot source instead of replacing the snapshot.
5. Switch to another Google account on Android: previous archive rows and detail must disappear, and old network responses must not restore them. Switch back and reload.

These are manual acceptance steps, not claims that a physical Pixel/Samsung or the user's live account has already been tested in this build.

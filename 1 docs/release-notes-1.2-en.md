# SerKal 1.2 — What's new

SerKal 1.2 brings Windows and Android closer together, with a shared archive, improved maintenance and more consistent handling of series titles and episode dates.

## New features

- **An Android app for your shared archive.** Look up series, add seasons, edit notes, change watched status and manage calendar entries from your phone or tablet.
- **One archive across your devices.** Use the same Google account on Windows and Android. Changes are saved locally first and transferred to Google in the background. A running desktop PC is no longer required for Android changes.
- **Smarter series search on Windows.** Suggestions appear as you type, with title, year and TMDB ID. Choose with the mouse or keyboard. Exact title matches are prioritised, and an additional search can help with names entered with extra spaces.
- **Maintenance with a results list.** Check the series you follow for missing seasons, new episodes, changed dates and title corrections. Reopen the last result; Windows can also print it.
- **Streaming provider information by country.** See subscription, free, ad-supported, rental and purchase offers reported by JustWatch via TMDB. Your provider country is independent of the interface language. A manual provider note can take priority.
- **Announced season starts.** A season can be kept in the archive before its full episode schedule is known. A known start date gets a clearly marked provisional calendar entry; an unknown date stays unknown.
- **An explicit choice of authoritative archive.** If your archive copies disagree, you can choose which complete archive should be used. Other updated devices adopt that choice when they next synchronise. Entries absent from the chosen archive are removed from the active archive on those devices.

## Improvements

- More consistent German and English title selection across search, details, archive displays and calendar entries.
- Maintenance can refresh stored translated titles without requiring you to delete and re-add a series.
- When the latest archived season is marked as watched, maintenance can add newer seasons. It does not automatically fill your archive with seasons from before the point where you started following the series.
- A single known episode is no longer enough to treat an announced season as a complete schedule. Expected episode counts do not generate invented dates.
- Newly confirmed schedules can replace provisional entries. Less complete later data does not shorten an already confirmed schedule or erase a known announced start.
- Clearer distinction between a local save, a pending transfer and a Google-confirmed save.
- Shared-archive version checks and improved recovery after interrupted transfers.
- Easier reuse of a configured TMDB API key on devices using the same Google account.
- More consistent light/dark presentation, menus and archive status indicators.
- A compact Android footer with German and English flag buttons, light/dark selection, calendar access, help and Exit. The Edit button now uses only the space it needs.

## Bug fixes

- Fixed incorrect title choices caused by regional aliases taking priority over the appropriate English title.
- Fixed calendar entries using a German archive filename even when the correct translated title was already stored.
- Fixed duplicate archive files for the same TMDB series when its displayed title changed.
- Fixed watched-status switching so a season can be marked watched and then switched back again.
- Fixed edits being undone by repeatedly reapplying an already accepted authoritative archive.
- Fixed a misleading “archive is being prepared” message that could hide an actual synchronisation conflict and block deletion.
- Improved calendar-target detection and error handling when a previously selected calendar is missing or inaccessible.
- Improved recovery when an upload succeeds but its confirmation is interrupted.
- Fixed Android lists using only part of the available screen height.
- Fixed Android search fields and results remaining after a successful archive entry. Reset now returns focus to the series-title field, and delayed search responses cannot refill cleared fields.
- Fixed Android's Exit button putting the app in the background instead of closing its task.
- Improved Windows closing and update handling, including open save dialogs and pending changes.

## Updating and using 1.2

- Update all devices that use the shared archive before resuming normal use.
- After an edit, wait for the Google-confirmed save before switching devices, or use **Sync now** when needed.
- For older archive entries with incorrect translated titles, select the required language and run **Maintenance**. Existing manually protected values remain protected.
- Episode dates and provider information are refreshed through maintenance; they are not a continuous live feed. Provider information applies to a series and does not guarantee that a particular season or episode is available in your region.
- Android is supplied as an APK. These notes do not announce Google Play Store availability.

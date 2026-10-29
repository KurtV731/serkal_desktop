# SerKal 1.2.3 / release 37 — Calendar quota correction

Status: source corrections prepared; Desktop tests passed locally and in CI; Android tests/build passed; signed APK ready. No Windows installer or public deployment claimed.

## Confirmed report

VelcroFist reports that Maintenance repaired the English titles. On exit, Calendar synchronization stopped around 9/124 operations with HTTP 403, reason `rateLimitExceeded`. After choosing Keep open and trying Exit repeatedly, the remaining count fell until completion. Successful operations were therefore retained. His later 21:26 report explicitly confirms that the correct Calendar was updated and all German titles are now English. This is a Calendar rate-limit report; it does not retrospectively prove the cause of his earlier Drive archive-list 403.

## Code findings

1. ArchiveSession.finish uploads the whole archive before calendarSync. Calendar failure becomes `warning`, with dirty=false. The old session-close dialog nevertheless called this failure to save changes and offered Exit without saving: misleading.
2. Calendar operations used up to four workers without pacing or quota backoff.
3. Pending Calendar state existed only in memory and disappeared after process exit/restart.
4. Desktop googleCalendarUrl_ accepted the saved calendar ID but ignored it and opened /u/0/r. The browser account view is separate from the Calendar API write target; the screenshot does not prove a wrong write target or that SerKal created a new Chrome profile.

## Corrections

- Existing program and Calendar reconciliation retained; no archive architecture rewrite.
- One Calendar request at a time, at least 250 ms between starts. Quota 403 (`rateLimitExceeded` or `userRateLimitExceeded`) and 429 retry up to three times with exponential 1/2/4-second base delays plus jitter; numeric Retry-After respected. Ordinary permission 403 is not retried. This reduces bursts, but does not guarantee that Google will lift an exhausted limit.
- Existing 45-second close network budget retained. If a quota retry cannot fit, retain the full failure, stop scheduling further calls, report Calendar incomplete. No infinite retry or background timer introduced.
- Failed writes are not counted as completed.
- A small local, account-scoped pending flag survives restart. At the next regular exit on that device, read/reconcile the current archive against current Calendar events; completed changes are not intentionally resent. The flag contains no duplicate working archive or event queue. Archive remains one full upload per changed session; a Calendar-only retry does not upload it again.
- Desktop close says archive is saved and only Calendar is incomplete, with Close — archive saved / Keep open. A real archive-upload failure retains the discard/keep-open path.
- Desktop browser URL now includes the saved calendar ID (base64 cid), language, and an email account hint when a locally stored OAuth ID token supplies it. Token contents never enter the URL. Session mode uses persisted Calendar settings, not stale UI copies. Existing separate-window launcher retained; no Chrome profile or browser cookie manipulation. Actual target selection/login in the user's browser still needs practical acceptance.
- Android uses the same pacing/backoff/pending behaviour and accurate Calendar-only status. No new ongoing cloud synchronization.

## Source and release

- Product version 1.2.3, common release 37, Android versionCode 46.
- Desktop build source: 6f196e982e18babebf31437fd26d042174e7c4ac.
- Android build source: b2dba8fab9cd1ea03940a10d2f0109680b3148c8.
- PR #16 and #17. Both pull requests merged after tests passed.
- New Windows build entry: serkal-1-2-3-ersatz-bauen.bat. Uses existing local OAuth/icon/build pipeline, 41 tests, distinct setup filename and new output C:\\ppd\\serkal\\veroeffentlichungen\\1.2.3. Does not replace earlier artifacts or publish automatically.

## Tests / practical acceptance

Desktop: 41 scripts pass locally and in final CI run 40763843221 (https://github.com/KurtV731/serkal_desktop/actions/runs/40763843221), including injected exact rateLimitExceeded response, serialized request starts, increasing delays, deadline exhaustion/no more requests, non-retryable permission denial, archive saved independently, persistent retry after restart without second upload, saved-archive close/cancel paths, and actual Calendar URL helper with calendar/account/language. Frontend scripts parse.

Android: 81 tests, 0 failures/errors/skips, including new policy and restart retry tests; final successful build 40763850955 (https://github.com/KurtV731/serkal_desktop/actions/runs/40763850955). The first CI attempts failed on stale version assertions only; no installable APK was produced by those failed runs.

Practical acceptance still required: large Maintenance change; Google quota temporary denial and later successful continuation; close report distinguishes archive and Calendar; saved calendar/account displayed with multiple browser accounts. No real private Calendar/archive used by CE tests.

Google documentation consulted: https://developers.google.com/workspace/calendar/api/guides/errors and https://developers.google.com/workspace/calendar/api/guides/quota . Google identifies this reason as a request-rate limit and recommends bounded exponential backoff.

## Signed Android artifact

037-SerKal-Android-1.2.3.apk — 2290075 bytes.
SHA-256: c540a17601786cc1e93fab35e408e0e5a94914985e246caf6f1c95be924c7705.
Original certificate unchanged; v2/v3 signatures verified; version 1.2.3/code46 and package checked; signed and unsigned manifests byte-identical. Delivered directly to Kurt. No signing secrets published. Do not rebuild or re-sign this artifact.

Windows source and build command are ready; CE has not produced a Windows EXE in this Linux environment. Installer must build on Kurt's Windows machine using the existing private OAuth configuration, then record EXE size/hash and practical acceptance. Do not publish 1.2.3 before acceptance.

## Reporter acknowledgement for release notes

Kurt's changelog rule of 29.10.2026: credit the public reporter handle in the relevant fix entry. The Calendar rate-limit handling and correction of the misleading archive-save/exit warning should each carry **(Thanks to VelcroFist)**. Credit his Calendar-navigation report in its eventual fix entry as well; the 29.10.2026 browser Add-calendar/account-selection follow-up remains open and must not be advertised as fully fixed.

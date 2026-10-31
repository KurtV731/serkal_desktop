SerKal 1.2.4 — Calendar change tracking
Common release 38; Android versionCode 47.

- Normal exit reconciles only series/seasons whose Calendar content changed. Unrelated existing Calendar differences no longer cause a small edit to update hundreds of other events. (Thanks to Kurt)
- Pending Calendar flags contain the affected series/seasons. A flag is cleared only after the group's last successful operation, or after reading a matching remote state. After interruption/restart only unfinished scopes are retried, using the current loaded archive. (Thanks to Kurt)
- Calendar-only retries do not upload the archive again. Watched-only/archive-only changes do not create event writes.
- Logs show scoped plan counts and operation reasons/changed field names without logging whole private event bodies.

Retained: paced Calendar requests, bounded quota retries, and the corrected archive-saved/Calendar-incomplete exit report. (Thanks to VelcroFist)

Compatibility notes: changing the configured Calendar target requires full reconciliation of that target. An older pending flag that has no series/season scope must be reconciled once before it can become a precise scoped flag. Existing permanent announcement cards remain permanent.

Known open issue: Calendar-button browser account/Add-calendar navigation is not corrected by this update.

Automated tests pass; real Windows/Android device acceptance and publication are separate steps. Install matching versions before switching devices. Do not uninstall or clear the archive.

# SerKal Desktop 1.2.6

Google sign-in now opens in a separate, normally sized external browser window on Windows. The existing browser window stays unchanged. A cancel dialog remains available in SerKal, and the app returns to the foreground when sign-in finishes. The browser completion window attempts to close itself; if the browser prevents this, use its title-bar close button.

The connection confirmation now shows the actual number of loaded archive entries instead of “undefined”. Loading an archive is described accurately without claiming it has already been published to Android.

All calendar-stability improvements from 1.2.5 are retained. Archive format 38 is unchanged.

Source and isolated Windows browser tests pass. Windows installer build and acceptance with a real Google account remain pending; this is not a public-release announcement.

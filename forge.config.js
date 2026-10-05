const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');
const fs = require('fs');
const path = require('path');

// Die Desktop-OAuth-Clientkennung wird erst beim privaten Windows-Build
// beigelegt und bleibt aus GitHub heraus. Persönliche Google-Tokens werden
// niemals mitgeliefert, sondern pro Benutzer im SerKal-Profil gespeichert.
const googleOauthSource = String(process.env.SERKAL_GOOGLE_OAUTH_FILE || '').trim()
  || path.resolve(__dirname, '..', 'serkal_private', 'google_oauth_client.json');

if (!fs.existsSync(googleOauthSource)) {
  throw new Error(`Google-OAuth-Konfiguration für den Installer fehlt: ${googleOauthSource}`);
}

module.exports = {
  packagerConfig: {
    asar: true,

    // Außerhalb von app.asar in resources/google_oauth_client.json ablegen,
    // damit eine Installation auf einem fremden Rechner Google einrichten kann.
    extraResource: [googleOauthSource],

    // SERKAL Desktop 1.1:
    // Nur Laufzeit-Abhaengigkeiten ins Paket nehmen. Forge/Electron-
    // Entwicklungswerkzeuge gehoeren nicht in app.asar.
    prune: true,

    // Eigenes SERKAL-Programmsymbol fuer Windows-EXE, Taskleiste und Verknuepfungen.
    icon: '4 assets/icon/serkal',

    // Entwicklungs- und Hilfsdateien nicht an den Endnutzer ausliefern.
    // 3 data bleibt absichtlich enthalten: Das Archiv wird in 0.0.5
    // weiterverwendet und soll derzeit NICHT entfernt werden.
    ignore: [
      /^\/1 docs(?:\/|$)/,
      /^\/5 tools(?:\/|$)/,
      /^\/6 tests(?:\/|$)/,
      /^\/hinweis_.*\.txt$/i,
      /^\/install_serkal\.cmd$/i,
      /^\/start_serkal\.cmd$/i,
      /^\/tasklist\.txt$/i,
      /^\/part\.zip$/i,
      /^\/serkal_desktop\.zip$/i,
    ],
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'SerKalDesktop',
        authors: 'Kurt Vogelsaenger',
        description: 'SERKAL Desktop – Serienkalender',
        setupExe: 'SerKal_1.1_Setup.exe',
        setupIcon: '4 assets/icon/serkal.ico',

        // Squirrel versucht sonst zusaetzlich, Update.exe mit demselben Icon
        // per rcedit zu patchen. Das ist fuer SERKAL nicht erforderlich und
        // kann mit "Fatal error: Unable to set icon" abbrechen.
        // Das Setup selbst behaelt setupIcon; das Programm-Icon kommt aus
        // packagerConfig.icon.
        skipUpdateIcon: true,
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-deb',
      config: {},
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {},
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};

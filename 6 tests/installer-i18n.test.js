const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(
  path.join(root, '5 tools', 'installer', 'SerKalInstaller.cs'),
  'utf8'
);

assert.match(source, /CurrentUICulture\.TwoLetterISOLanguageName/);
assert.match(source, /"de"/);
assert.match(source, /private static string T\(string german, string english\)/);

const requiredGerman = [
  'Die Installation/Aktualisierung wurde abgebrochen.',
  'SerKal Desktop wurde erfolgreich installiert/aktualisiert.',
  'SerKal Desktop wird automatisch geschlossen in ',
  'Abbrechen'
];

const requiredEnglish = [
  'Installation/update was cancelled.',
  'SerKal Desktop was installed/updated successfully.',
  'SerKal Desktop will close automatically in ',
  'Cancel'
];

for (const text of requiredGerman.concat(requiredEnglish)) {
  assert.ok(source.includes(text), `Installer text missing: ${text}`);
}

assert.match(source, /AssemblyFileVersion\("1\.0\.7\.1"\)/);
assert.match(source, /SerKal_1\.007f1_Setup\.exe/);

console.log('SERKAL installer DE/EN test: OK');

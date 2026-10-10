const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const backend = fs.readFileSync(path.join(root, '2 src', 'backend', 'main.js'), 'utf8');
const forge = fs.readFileSync(path.join(root, 'forge.config.js'), 'utf8');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

assert.strictEqual(pkg.version, '1.2.0-alpha.5');
assert.match(backend, /path\.join\(process\.resourcesPath,\s*["']google_oauth_client\.json["']\)/);
assert.match(forge, /extraResource:\s*\[googleOauthSource\]/);
assert.match(forge, /SERKAL_GOOGLE_OAUTH_FILE/);
assert.match(forge, /SerKal_1\.007f2_Setup\.exe/);
assert.doesNotMatch(forge, /client_secret/);
assert.doesNotMatch(forge, /client_id/);

console.log('OAuth packaging test passed.');

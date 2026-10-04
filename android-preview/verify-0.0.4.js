const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = __dirname;
const activity = fs.readFileSync(path.join(root, 'app/src/main/java/de/serkal/android/preview/MainActivity.java'), 'utf8');
const zoom = fs.readFileSync(path.join(root, 'app/src/main/java/de/serkal/android/preview/ZoomPanLayout.java'), 'utf8');
const manifest = fs.readFileSync(path.join(root, 'app/src/main/AndroidManifest.xml'), 'utf8');
const build = fs.readFileSync(path.join(root, 'app/build.gradle'), 'utf8');

assert.match(build, /versionCode\s+6/);
assert.match(build, /versionName\s+'0\.0\.4f2'/);
assert.match(build, /applicationId\s+'de\.serkal\.android\.preview\.v004f2'/);
assert.match(manifest, /0\.0\.4f2 - SerKal Android Präversion/);
assert.match(manifest, /screenOrientation="sensorLandscape"/);
assert.match(manifest, /de\.serkal\.android\.preview\.MainActivity/);
assert.match(activity, /showStartupError_/);
assert.match(activity, /resetZoom\.setTextColor\(Color\.BLACK\)/);
assert.match(activity, /language\.setBackgroundColor\(Color\.WHITE\)/);
assert.match(activity, /new ZoomPanLayout\(this\)/);
assert.match(activity, /zoomSurface\.reset\(\)/);
assert.match(zoom, /MAX_SCALE = 3\.0f/);
assert.match(zoom, /onDoubleTap/);
assert.match(zoom, /translationX \+= x - lastX/);

const search = activity.indexOf('"SEARCH / CALENDAR"');
const entry = activity.indexOf('"ENTRY"');
const archive = activity.indexOf('"ARCHIVE · 77 series"');
assert.ok(search >= 0 && entry > search && archive > entry, 'column order must be search, entry, archive');

console.log('SerKal Android 0.0.4 structure test: OK');

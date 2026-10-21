'use strict';
const assert=require('node:assert/strict'),{eligible}=require('../2 src/common/maintenance-follow');
assert.equal(eligible([{seasonLabel:'S07',seen:1}],8),true);
assert.equal(eligible([{seasonLabel:'S07',seen:1}],6),false);
assert.equal(eligible([{seasonLabel:'S07',seen:0}],8),false);
assert.equal(eligible([{seasonLabel:'S07',seen:1},{seasonLabel:'S08',seen:0}],9),false);
assert.equal(eligible([{seasonLabel:'S07',seen:0},{seasonLabel:'S08',seen:1}],9),true);
console.log('Maintenance follow: only newer seasons of the latest watched entry; no backfill or duplicates');

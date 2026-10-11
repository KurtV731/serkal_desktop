'use strict';
// Resume one explicit archive rebuild; never read or modify the old calendar.
async function rebuild(deps, payloads) {
  let state = deps.read();
  if (state && state.phase === 'creating') throw new Error('CALENDAR_REBUILD_UNCERTAIN');
  if (!state) {
    state = {schema:1, phase:'creating', oldId:deps.oldId, newId:'', completed:0};
    deps.save(state); // Persist intent before a potentially ambiguous network result.
    const id = await deps.create();
    if (!id || id === deps.oldId) throw new Error('CALENDAR_REBUILD_INVALID_TARGET');
    state = {...state, newId:id, phase:'copying'};
    deps.save(state);
  }
  if (!state.newId || state.newId === state.oldId) throw new Error('CALENDAR_REBUILD_INVALID_TARGET');
  await deps.check(state.newId);
  deps.select(state.newId);
  if (state.phase === 'complete') return state;
  // Repeat all entries after interruption: existing deterministic event IDs make this idempotent.
  for (const payload of payloads) {
    const result = await deps.insert(payload);
    if (!result || !result.ok) throw new Error(result && result.message || 'CALENDAR_REBUILD_WRITE_FAILED');
    state = {...state, completed:state.completed + 1};
    deps.save(state);
  }
  state = {...state, phase:'complete', completed:payloads.length};
  deps.save(state);
  return state;
}
module.exports = {rebuild};

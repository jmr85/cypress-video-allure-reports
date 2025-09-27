const { promises: fsp } = require('fs');

async function deleteVideoIfSpecPassed(_spec, results) {
  if (!results?.video) return;
  const hasFailures =
    (results.tests || []).some(t => (t.attempts || []).some(a => a.state === 'failed')) ||
    (results.stats?.failures > 0);
  if (!hasFailures) {
    try { await fsp.unlink(results.video); }
    catch (e) { console.warn('[after:spec] No se pudo borrar el video:', e?.message); }
  }
}

module.exports = { deleteVideoIfSpecPassed };
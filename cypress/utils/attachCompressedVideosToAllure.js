const { promises: fsp } = require('fs');
const path = require('path');

async function attachCompressedVideosToAllure(runResults, { resultsDir = 'allure-results' } = {}) {
  if (!runResults?.runs?.length) return;
  const resultsAbs = path.resolve(resultsDir);

  // Indexar JSONs
  let jsonFiles = [];
  try {
    jsonFiles = (await fsp.readdir(resultsAbs)).filter(f => f.endsWith('.json'));
  } catch { return; }

  const index = (await Promise.all(jsonFiles.map(async (f) => {
    try { return { file: f, fullPath: path.join(resultsAbs, f), data: JSON.parse(await fsp.readFile(path.join(resultsAbs, f), 'utf8')) }; }
    catch { return null; }
  }))).filter(Boolean);

  await Promise.all(runResults.runs.map(async (r) => {
    const video = r?.video;
    if (!video) return;
    try {
      const specName = path.basename(r.spec?.relative || r.spec?.name || video);
      const specKey  = (r.spec?.relative || specName).replace(/[\/\\]/g, '__');
      const target   = `video__${specKey}.mp4`;
      await fsp.copyFile(video, path.join(resultsAbs, target));

      const related = index.filter(it => JSON.stringify(it.data?.labels || []).includes(specName));
      await Promise.all(related.map(async (it) => {
        let touched = false;
        for (const att of (it.data.attachments || [])) {
          if (att?.type === 'video/mp4') { att.source = target; touched = true; }
        }
        if (touched) await fsp.writeFile(it.fullPath, JSON.stringify(it.data), 'utf8');
      }));
    } catch (e) {
      console.error('[after:run]', e?.message);
    }
  }));
}

module.exports = { attachCompressedVideosToAllure };
const { defineConfig } = require("cypress");
const fs = require('fs');
const path = require('path');
const allureWriter = require('@shelex/cypress-allure-plugin/writer');

function safeReadJson(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; }
}

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      allureWriter(on, config);
            
      on('after:run', (runResults) => {
        const resultsDir = path.resolve('allure-results');
        if (!runResults?.runs?.length || !fs.existsSync(resultsDir)) return;

        // 0) Cargar TODOS los JSON una sola vez
        const jsonFiles = fs.readdirSync(resultsDir).filter(f => f.endsWith('.json'));
        const jsonIndex = []; // [{file, fullPath, data, labelsText}]
        for (const f of jsonFiles) {
          const full = path.join(resultsDir, f);
          const data = safeReadJson(full);
          if (data) jsonIndex.push({ file: f, fullPath: full, data, labelsText: JSON.stringify(data.labels || []) });
        }

        for (const r of runResults.runs) {
          const compressedVideoPath = r?.video;
          if (!compressedVideoPath || !fs.existsSync(compressedVideoPath)) continue;

          const specName = path.basename(r.spec?.relative || r.spec?.name || compressedVideoPath);
          const specKey = (r.spec?.relative || specName).replace(/[\/\\]/g, '__');
          const targetName = `video__${specKey}.mp4`;
          const targetPath = path.join(resultsDir, targetName);

          // 1) Copiar el MP4 comprimido una vez
          fs.copyFileSync(compressedVideoPath, targetPath);

          // 2) Tocar SOLO los JSON relacionados con este spec
          for (const item of jsonIndex) {
            if (!item.labelsText.includes(specName)) continue;

            let touched = false;
            if (Array.isArray(item.data.attachments)) {
              for (const att of item.data.attachments) {
                if (att?.type === 'video/mp4') {
                  att.source = targetName;
                  touched = true;
                }
              }
            }
            if (touched) {
              fs.writeFileSync(item.fullPath, JSON.stringify(item.data), 'utf8');
            }
          }
        }
      });

      return config;
    },
  },
  env: {
    allure: true,
    allureAddVideoOnPass: false
  },
  video: true,  
  videosFolder: 'cypress/videos',
  videoCompression: 32,
  screenshotOnRunFailure: false
});
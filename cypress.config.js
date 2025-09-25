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

        for (const r of runResults.runs) {
          const compressedVideoPath = r?.video; // este ya es el MP4 comprimido por Cypress
          if (!compressedVideoPath || !fs.existsSync(compressedVideoPath)) continue;

          const specKey = r.spec?.relative?.replace(/[\/\\]/g, '__') || path.basename(compressedVideoPath);
          const targetName = `video__${specKey}.mp4`;
          const targetPath = path.join(resultsDir, targetName);
          fs.copyFileSync(compressedVideoPath, targetPath);

          const files = fs.readdirSync(resultsDir).filter(f => f.endsWith('.json'));
          for (const f of files) {
            const full = path.join(resultsDir, f);
            const data = safeReadJson(full);
            if (!data) continue;

            const labels = data.labels || [];
            const labelText = JSON.stringify(labels);
            const appearsRelated =
              (r.spec?.relative && labelText.includes(path.basename(r.spec.relative))) ||
              (r.spec?.name && labelText.includes(r.spec.name));

            if (!appearsRelated) continue;

            let touched = false;
            if (Array.isArray(data.attachments)) {
              for (const att of data.attachments) {
                if (att?.type === 'video/mp4') {
                  att.source = targetName;
                  touched = true;
                }
              }
            }
            if (touched) {
              fs.writeFileSync(full, JSON.stringify(data), 'utf8');
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
const { defineConfig } = require("cypress");
const fs = require('fs');
const path = require('path');
const allureWriter = require('@shelex/cypress-allure-plugin/writer');

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      allureWriter(on, config);
      
      on('after:spec', (spec, results) => {
        if (results && results.video) {
          const failures =
            (results.tests || []).some(t => t.state === 'failed') ||
            results.stats.failures > 0;
          if (!failures) {
            fs.unlinkSync(results.video);
          }
        }
      });

      on('after:run', () => {
        // Reemplaza en allure-results por los MP4 ya comprimidos de cypress/videos
        const resultsDir = path.resolve('allure-results');
        const videosDir = path.resolve('cypress/videos');
        if (!fs.existsSync(resultsDir) || !fs.existsSync(videosDir)) return;

        const allureFiles = fs.readdirSync(resultsDir)
          .filter(f => f.toLowerCase().endsWith('.mp4'));

        for (const f of allureFiles) {
          // El plugin usa el mismo basename del video al copiarlo; mapeamos 1:1
          const compressed = path.join(videosDir, f);
          if (fs.existsSync(compressed)) {
            fs.copyFileSync(compressed, path.join(resultsDir, f));
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
  videoCompression: true,
});

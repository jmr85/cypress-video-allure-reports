const { defineConfig } = require("cypress");
const fs = require('fs');
const { promises: fsPromises } = require('fs');
const path = require('path');
const allureWriter = require('@shelex/cypress-allure-plugin/writer');

async function safeReadJson(file) {
  try { 
    const content = await fsPromises.readFile(file, 'utf8');
    return JSON.parse(content);
  } catch { 
    return null; 
  }
}

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      allureWriter(on, config);
      
      on('after:spec', async (spec, results) => {
        if (results && results.video) {
          // Verificar si hay fallas en algún intento
          const failures = results.tests.some(test =>
            test.attempts.some(attempt => attempt.state === 'failed')
          )
          if (!failures) {
            // eliminar el video si pasó todo y no hubo reintentos fallidos
            await fsPromises.unlink(results.video)
          }
        }
      })

      on('after:run', async (runResults) => {
        const resultsDir = path.resolve('allure-results');
        if (!runResults?.runs?.length || !fs.existsSync(resultsDir)) return;

        try {
          const allFiles = await fsPromises.readdir(resultsDir);
          const jsonFiles = allFiles.filter(f => f.endsWith('.json'));
          
          // Cargar todos los JSON en paralelo
          const jsonIndex = await Promise.all(
            jsonFiles.map(async (f) => {
              const fullPath = path.join(resultsDir, f);
              const data = await safeReadJson(fullPath);
              if (data) {
                return {
                  file: f,
                  fullPath,
                  data,
                  labelsText: JSON.stringify(data.labels || [])
                };
              }
              return null;
            })
          );

          const validJsons = jsonIndex.filter(item => item !== null);

          await Promise.all(
            runResults.runs.map(async (r) => {
              const compressedVideoPath = r?.video;
              if (!compressedVideoPath || !fs.existsSync(compressedVideoPath)) return;

              const specName = path.basename(r.spec?.relative || r.spec?.name || compressedVideoPath);
              const specKey = (r.spec?.relative || specName).replace(/[**\/\\**]/g, '__');
              const targetName = `video__${specKey}.mp4`;
              const targetPath = path.join(resultsDir, targetName);

              await fsPromises.copyFile(compressedVideoPath, targetPath);

              const updatePromises = validJsons
                .filter(item => item.labelsText.includes(specName))
                .map(async (item) => {
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
                    await fsPromises.writeFile(
                      item.fullPath, 
                      JSON.stringify(item.data), 
                      'utf8'
                    );
                  }
                });

              await Promise.all(updatePromises);
            })
          );

        } catch (error) {
          console.error('Error en after:run hook:', error);
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
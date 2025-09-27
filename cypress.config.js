const { defineConfig } = require("cypress");
const allureWriter = require('@shelex/cypress-allure-plugin/writer');

const { deleteVideoIfSpecPassed } = require('./cypress/utils/deleteVideoIfSpecPassed');
const { attachCompressedVideosToAllure } = require('./cypress/utils/attachCompressedVideosToAllure');

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      allureWriter(on, config);
      
      on('after:spec', deleteVideoIfSpecPassed);
      on('after:run', (runResults) => attachCompressedVideosToAllure(runResults, { resultsDir: 'allure-results' }));

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
const { defineConfig } = require("cypress");
const { allureCypress } = require('allure-cypress/reporter');

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      allureCypress(on, config, { 
        resultsDir: 'allure-results' 
      }) 
			on('after:spec', (spec, results) => { 
				if (results?.video) { 
					const hasFailures = (results.tests || []).some(t => t.attempts?.some(a => a.state === 'failed')) || results.stats?.failures > 0 
					if (!hasFailures) { 
						const fs = require('fs') 
						if (fs.existsSync(results.video)) fs.unlinkSync(results.video) 
					} 
				} 
			}) 
			return config 
    },
  },
  video: true, 
	videoCompression: true, 
	screenshotOnRunFailure: true 
});

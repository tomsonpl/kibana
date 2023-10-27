/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { defineCypressConfig } from '@kbn/cypress-config';
import fs from 'fs';
import { setupUserDataLoader } from '../../../test_serverless/functional/test_suites/security/cypress/support/setup_data_loader_tasks';

// eslint-disable-next-line import/no-default-export
export default defineCypressConfig({
  reporter: '../../../node_modules/cypress-multi-reporters',
  reporterOptions: {
    configFile: './cypress/reporter_config.json',
  },

  defaultCommandTimeout: 60000,
  execTimeout: 60000,
  pageLoadTimeout: 60000,
  responseTimeout: 60000,
  screenshotsFolder: '../../../target/kibana-osquery/cypress/screenshots',
  trashAssetsBeforeRuns: false,
  video: true,
  videosFolder: '../../../target/kibana-osquery/cypress/videos',
  videoCompression: true,
  viewportHeight: 946,
  viewportWidth: 1680,

  env: {
    'cypress-react-selector': {
      root: '#osquery-app',
    },
    grepFilterSpecs: true,
    grepTags: '@serverless --@brokenInServerless',
    grepOmitFiltered: true,
  },
  e2e: {
    specPattern: './cypress/e2e/**/*.cy.ts',
    experimentalRunAllSpecs: true,
    experimentalMemoryManagement: true,
    numTestsKeptInMemory: 3,
    setupNodeEvents: (on, config) => {
      setupUserDataLoader(on, config, { additionalRoleName: 'viewer' });

      on('after:spec', (spec: Cypress.Spec, results: CypressCommandLine.RunResult) => {
        console.log({ results });
        if (results && results.video) {
          // Do we have failures for any retry attempts?
          const failures = results.tests.some((test) =>
            test.attempts.some((attempt) => attempt.state === 'failed')
          );
          if (!failures) {
            // delete the video if the spec passed and no tests retried
            fs.unlinkSync(results.video);
          }
        }
      });

      return config;
    },
  },
});

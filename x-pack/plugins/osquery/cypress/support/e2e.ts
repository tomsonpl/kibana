/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

// / <reference types="cypress" />

// ***********************************************************
// This example support/index.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// @ts-expect-error check this
import registerCypressGrep from '@cypress/grep';

// force ESM in this module
import type { ServerlessRoleName } from '../../../../test_serverless/shared/lib';

export {};

import 'cypress-react-selector';
import { login } from '../tasks/login';
// import './coverage';

registerCypressGrep();

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      getBySel(...args: Parameters<Cypress.Chainable['get']>): Chainable<JQuery<HTMLElement>>;

      getBySelContains(
        ...args: Parameters<Cypress.Chainable['get']>
      ): Chainable<JQuery<HTMLElement>>;

      clickOutside(): Chainable<JQuery<HTMLBodyElement>>;

      loginKibana(role?: ServerlessRoleName): void;
    }
  }
}

Cypress.Commands.add('getBySel', (selector, ...args) =>
  cy.get(`[data-test-subj="${selector}"]`, ...args)
);

// finds elements that start with the given selector
Cypress.Commands.add('getBySelContains', (selector, ...args) =>
  cy.get(`[data-test-subj^="${selector}"]`, ...args)
);

Cypress.Commands.add(
  'clickOutside',
  () => cy.get('body').click(0, 0) // 0,0 here are the x and y coordinates
);

Cypress.Commands.add('loginKibana', login);

// Alternatively you can use CommonJS syntax:
// require('./commands')
Cypress.on('uncaught:exception', () => false);

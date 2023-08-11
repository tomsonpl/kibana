/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { request } from '@kbn/security-solution-plugin/public/management/cypress/tasks/common';
import { isLocalhost } from '@kbn/securitysolution-runtime-services/src/is_localhost';
import { STANDARD_HTTP_HEADERS } from '../../../../test_serverless/shared/lib/security/default_http_headers';
import type { ServerlessRoleName } from '../../../../test_serverless/shared/lib';

/**
 * Send login via API
 * @param username
 * @param password
 *
 * @private
 */
const sendApiLoginRequest = (
  username: string,
  password: string
): Cypress.Chainable<{ username: string; password: string }> => {
  const url = new URL(Cypress.config().baseUrl ?? '');
  url.pathname = '/internal/security/login';

  cy.log(`Authenticating [${username}] via ${url.toString()}`);

  return request({
    headers: { ...STANDARD_HTTP_HEADERS },
    method: 'POST',
    url: url.toString(),
    body: {
      providerType: 'basic',
      providerName: isLocalhost(url.hostname) ? 'basic' : 'cloud-basic',
      currentURL: '/',
      params: {
        username,
        password,
      },
    },
  }).then(() => ({
    username,
    password,
  }));
};

interface CyLoginTask {
  (user?: ServerlessRoleName): ReturnType<typeof sendApiLoginRequest>;

  /**
   * Login using any username/password
   * @param username
   * @param password
   */
  with(username: string, password: string): ReturnType<typeof sendApiLoginRequest>;
}

/**
 * Login to Kibana using API (not login page). By default, user will be logged in using
 * the username and password defined via `KIBANA_USERNAME` and `KIBANA_PASSWORD` cypress env
 * variables.
 * @param user Defaults to `soc_manager`
 */
export const login: CyLoginTask = (
  user: ServerlessRoleName | 'elastic' = 'soc_manager'
): ReturnType<typeof sendApiLoginRequest> => {
  let username = Cypress.env('KIBANA_USERNAME');
  let password = Cypress.env('KIBANA_PASSWORD');

  if (user && user !== 'elastic') {
    return cy.task('loadUserAndRole', { name: user }).then((loadedUser) => {
      username = loadedUser.username;
      password = loadedUser.password;

      return sendApiLoginRequest(username, password);
    });
  } else {
    return sendApiLoginRequest(username, password);
  }
};

login.with = (username: string, password: string): ReturnType<typeof sendApiLoginRequest> =>
  sendApiLoginRequest(username, password);

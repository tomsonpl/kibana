/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { tag } from '../../tags';
import { checkResults, submitQuery } from '../../tasks/live_query';
import { loadRule, cleanupRule } from '../../tasks/api_fixtures';

describe('Alert Test', { tags: [tag.ESS, tag.SERVERLESS] }, () => {
  let ruleId: string;

  before(() => {
    loadRule().then((data) => {
      ruleId = data.id;
    });
  });

  beforeEach(() => {
    cy.loginKibana('t1_analyst');

    cy.visit(`/app/security/rules/id/${ruleId}/alerts`);
    cy.getBySel('expand-event').first().click();

    cy.wait(500);
    cy.contains('Get processes').click();
  });

  after(() => {
    cleanupRule(ruleId);
  });

  it('should be able to run rule investigation guide query', () => {
    submitQuery();
    checkResults();
  });

  it('should not be able to run custom query', () => {
    cy.intercept('POST', '/api/osquery/live_queries', (req) => {
      req.body.query = 'select * from processes limit 10';
    });
    submitQuery();
    cy.contains('Forbidden');
  });
});

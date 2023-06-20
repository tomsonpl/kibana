/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { generateRandomStringName } from '@kbn/osquery-plugin/cypress/tasks/integrations';
import { APP_ALERTS_PATH } from '../../../../../../common/constants';
import { closeAllToasts } from '../../../tasks/toasts';
import { fillUpNewRule } from '../../../tasks/response_actions';
import { login, loginWithRole, ROLE } from '../../../tasks/login';
import type { ReturnTypeFromChainable } from '../../../types';
import { indexEndpointHosts } from '../../../tasks/index_endpoint_hosts';
import { openAlertDetails } from '../../../tasks/isolate';
import { indexEndpointRuleAlerts } from '../../../tasks/index_endpoint_rule_alerts';

describe('No License', { env: { ftrConfig: { license: 'basic' } } }, () => {
  describe('User without license should not be able to use response actions even though RBAC is correct', () => {
    const [ruleName, ruleDescription] = generateRandomStringName(2);

    before(() => {
      loginWithRole(ROLE.endpoint_response_actions_access);
    });

    it('response actions are disabled', () => {
      fillUpNewRule(ruleName, ruleDescription);
      // addEndpointResponseAction();
      cy.getByTestSubj('response-actions-wrapper').within(() => {
        cy.getByTestSubj('Endpoint Security-response-action-type-selection-option').should(
          'be.disabled'
        );
      });
    });
  });

  describe('User cannot see results', () => {
    let endpointData: ReturnTypeFromChainable<typeof indexEndpointHosts> | undefined;
    let alertData: ReturnTypeFromChainable<typeof indexEndpointRuleAlerts> | undefined;

    before(() => {
      login();
      return indexEndpointRuleAlerts({
        endpointAgentId: 'agentId',
        endpointHostname: 'agentName',
        endpointIsolated: false,
      }).then((indexedAlert) => {
        alertData = indexedAlert;
        const alertId = alertData.alerts[0]._id;
        console.log({ alertId });
        return indexEndpointHosts({
          withResponseActions: true,
          numResponseActions: 1,
          alertIds: [alertId],
        }).then((indexEndpoints) => {
          endpointData = indexEndpoints;
        });
      });
    });

    after(() => {
      if (endpointData) {
        endpointData.cleanup();
        endpointData = undefined;
      }

      if (alertData) {
        alertData.cleanup();
        alertData = undefined;
      }
    });
    it('render the permission denied screense', () => {
      cy.visit(APP_ALERTS_PATH);
      closeAllToasts();

      openAlertDetails();
      cy.getByTestSubj('response-actions-notification').should('not.have.text', '0');
      cy.getByTestSubj('responseActionsViewTab').click();
      cy.contains('Permission denied');
      cy.contains(
        'To access these results, ask your administrator for Elastic Defend Kibana privileges.'
      );
    });
  });
});

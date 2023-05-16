/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { EuiComment, EuiLoadingSpinner } from '@elastic/eui';
import { FormattedRelative } from '@kbn/i18n-react';
import React from 'react';
import { useUserPrivileges } from '../user_privileges';
import type { LogsEndpointAction } from '../../../../common/endpoint/types';
import { useGetAutomatedActionResponseList } from '../../../management/hooks/response_actions/use_get_automated_action_list';
import { ActionsLogExpandedTray } from '../../../management/components/endpoint_response_actions_list/components/action_log_expanded_tray';
import type { ResponseActionsApiCommandNames } from '../../../../common/endpoint/service/response_actions/constants';
import { ENDPOINT_COMMANDS } from '../event_details/translations';
import { ResponseActionsEmptyPrompt } from './response_actions_empty_prompt';

interface EndpointResponseActionResultsProps {
  action: LogsEndpointAction;
}

export const EndpointResponseActionResults = ({ action }: EndpointResponseActionResultsProps) => {
  const { rule, agent } = action;
  const { action_id: actionId, expiration } = action.EndpointActions;
  const {
    endpointPrivileges: { canReadActionsLogManagement, canAccessEndpointActionsLogManagement },
  } = useUserPrivileges();

  const canReadEndpoint = canReadActionsLogManagement && canAccessEndpointActionsLogManagement;
  const { data: expandedAction } = useGetAutomatedActionResponseList(
    { actionId, expiration, agent },
    { skip: !canReadEndpoint, action }
  );

  const eventText = getCommentText(action.EndpointActions.data.command);

  return (
    <EuiComment
      username={rule?.name}
      timestamp={<FormattedRelative value={action['@timestamp']} />}
      event={eventText}
      data-test-subj={'endpoint-results-comment'}
    >
      {canReadEndpoint ? (
        expandedAction ? (
          <ActionsLogExpandedTray action={expandedAction} />
        ) : (
          <EuiLoadingSpinner />
        )
      ) : (
        <ResponseActionsEmptyPrompt type="endpoint" />
      )}
    </EuiComment>
  );
};

const getCommentText = (command: ResponseActionsApiCommandNames): string => {
  if (command === 'isolate') {
    return ENDPOINT_COMMANDS.isolated;
  }
  if (command === 'unisolate') {
    return ENDPOINT_COMMANDS.released;
  }
  return ENDPOINT_COMMANDS.generic(command);
};

/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { map } from 'lodash';
import React from 'react';
import type { EcsSecurityExtension as Ecs } from '@kbn/securitysolution-ecs';
import { EndpointResponseActionResults } from './endpoint_action_results';
import type { LogsEndpointAction } from '../../../../common/endpoint/types';
import type { LogsOsqueryAction } from '../../../../common/search_strategy/security_solution/response_actions/actions';
import { useKibana } from '../../lib/kibana';

interface ResponseActionsResultsProps {
  actions: Array<LogsEndpointAction | LogsOsqueryAction>;
  ruleName?: string[];
  ecsData: Ecs;
}

export const ResponseActionsResults = ({
  actions,
  ruleName,
  ecsData,
}: ResponseActionsResultsProps) => {
  const {
    services: { osquery, application },
  } = useKibana();
  const { OsqueryResult } = osquery;
  const canReadOsquery = !!application?.capabilities?.osquery?.read;

  return (
    <>
      {map(actions, (action) => {
        if (isOsquery(action)) {
          const actionId = action.action_id;
          const queryId = action.queries[0].id;
          const startDate = action['@timestamp'];

          return (
            <OsqueryResult
              key={actionId}
              actionId={actionId}
              queryId={queryId}
              startDate={startDate}
              ruleName={ruleName}
              ecsData={ecsData}
              canReadOsquery={canReadOsquery}
            />
          );
        }
        if (isEndpoint(action)) {
          return <EndpointResponseActionResults action={action} />;
        }
      })}
    </>
  );
};

const isOsquery = (item: LogsEndpointAction | LogsOsqueryAction): item is LogsOsqueryAction => {
  return item && 'input_type' in item && item?.input_type === 'osquery';
};
const isEndpoint = (item: LogsEndpointAction | LogsOsqueryAction): item is LogsEndpointAction => {
  return item && 'EndpointActions' in item && item?.EndpointActions.input_type === 'endpoint';
};

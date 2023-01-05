/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { ElasticsearchClient } from '@kbn/core/server';
import type { SearchRequest } from '@kbn/data-plugin/public';
import type * as estypes from '@elastic/elasticsearch/lib/api/typesWithBodyKey';
import type { TransportResult } from '@elastic/elasticsearch';
import { fromKueryExpression, toElasticsearchQuery } from '@kbn/es-query';

import { map, reduce } from 'lodash';
import {
  transformToEndpointActions,
  transformToEndpointResponse,
} from './transform_to_endpoint_actions';
import {
  ENDPOINT_ACTIONS_INDEX,
  OSQUERY_ACTIONS_INDEX,
  OSQUERY_ACTION_RESPONSES_INDEX,
} from '../../../common/endpoint/constants';
import type {
  LogsEndpointAction,
  EndpointActionResponse,
  LogsEndpointActionResponse,
  LogsOsqueryAction,
  LogsOsqueryResponse,
  OsqueryResponse,
} from '../../../common/endpoint/types';
import { ACTIONS_SEARCH_PAGE_SIZE, ACTION_RESPONSE_INDICES } from '../services/actions/constants';
import { catchAndWrapError } from './wrap_errors';
import type { GetActionDetailsListParam } from '../services/actions/action_list';
import { getDateFilters, isLogsOsqueryAction } from '../services/actions/utils';

const queryOptions = Object.freeze({
  ignore: [404],
});

export const getActions = async ({
  commands,
  elasticAgentIds,
  esClient,
  endDate,
  from,
  size,
  startDate,
  userIds,
  unExpiredOnly,
}: Omit<GetActionDetailsListParam, 'logger'>): Promise<{
  actionIds: string[];
  actionRequests: TransportResult<
    estypes.SearchResponse<LogsEndpointAction | LogsOsqueryAction>,
    unknown
  >;
}> => {
  const additionalFilters = [];
  const commandFilter = [];

  if (commands?.length) {
    const endpointCommands = commands.filter((command) => command !== 'osquery');

    if (endpointCommands.length) {
      commandFilter.push({
        terms: {
          'data.command': endpointCommands,
        },
      });
    }
    if (commands.includes('osquery')) {
      commandFilter.push({
        term: {
          input_type: 'osquery',
        },
      });
    }
  }

  if (elasticAgentIds?.length) {
    additionalFilters.push({ terms: { agents: elasticAgentIds } });
  }

  if (unExpiredOnly) {
    additionalFilters.push({ range: { expiration: { gte: 'now' } } });
  }

  const dateFilters = getDateFilters({ startDate, endDate });

  const actionsFilters = [{ term: { type: 'INPUT_ACTION' } }, ...dateFilters, ...additionalFilters];

  const must: SearchRequest = [
    {
      bool: {
        filter: actionsFilters,
        ...(commandFilter.length
          ? {
              should: commandFilter,
              minimum_should_match: 1,
            }
          : {}),
      },
    },
  ];
  if (userIds?.length) {
    const userIdsKql = userIds.map((userId) => `user_id:${userId}`).join(' or ');
    const mustClause = toElasticsearchQuery(fromKueryExpression(userIdsKql));
    must.push(mustClause);
  }

  const actionsSearchQuery: SearchRequest = {
    index: [ENDPOINT_ACTIONS_INDEX, OSQUERY_ACTIONS_INDEX],
    size,
    from,
    body: {
      query: {
        bool: { must },
      },
      sort: [
        {
          '@timestamp': {
            order: 'desc',
          },
        },
      ],
    },
  };

  const actionRequests: TransportResult<
    estypes.SearchResponse<LogsEndpointAction | LogsOsqueryAction>,
    unknown
  > = await esClient
    .search<LogsEndpointAction | LogsOsqueryAction>(actionsSearchQuery, {
      ...queryOptions,
      meta: true,
    })
    .catch(catchAndWrapError);

  const transformedActions = transformToEndpointActions(actionRequests.body?.hits.hits);
  // only one type of actions
  const actionIds = reduce(
    transformedActions,
    (acc, action) => {
      // TODO here, add only specific to the action responses
      const source = action._source as LogsEndpointAction | LogsOsqueryAction;
      if (isLogsOsqueryAction(source)) {
        return [
          ...acc,
          ...map(source.EndpointActions.queries, (query) => {
            return query.action_id;
          }),
        ] as string[];
      }
      return [...acc, source.EndpointActions.action_id];
    },
    [] as string[]
  );

  actionRequests.body.hits.hits = transformedActions;

  return { actionIds, actionRequests };
};

export const getActionResponses = async ({
  actionIds,
  elasticAgentIds,
  esClient,
}: {
  actionIds: string[];
  elasticAgentIds?: string[];
  esClient: ElasticsearchClient;
}): Promise<
  TransportResult<
    estypes.SearchResponse<EndpointActionResponse | LogsEndpointActionResponse>,
    unknown
  >
> => {
  const filter = [];
  if (elasticAgentIds?.length) {
    filter.push({ terms: { agent_id: elasticAgentIds } });
  }
  if (actionIds.length) {
    filter.push({ terms: { action_id: actionIds } });
  }

  const responsesSearchQuery: SearchRequest = {
    index: [...ACTION_RESPONSE_INDICES, OSQUERY_ACTION_RESPONSES_INDEX],
    size: ACTIONS_SEARCH_PAGE_SIZE,
    from: 0,
    body: {
      query: {
        bool: {
          filter: filter.length ? filter : [],
        },
      },
    },
  };

  const actionResponses: TransportResult<
    estypes.SearchResponse<
      EndpointActionResponse | LogsEndpointActionResponse | LogsOsqueryResponse
    >,
    unknown
  > = await esClient
    .search<EndpointActionResponse | LogsEndpointActionResponse | OsqueryResponse>(
      responsesSearchQuery,
      {
        ...queryOptions,
        headers: {
          'X-elastic-product-origin': 'fleet',
        },
        meta: true,
      }
    )
    .catch(catchAndWrapError);
  // TODO CHECK this type

  const transformedResponses = transformToEndpointResponse(actionResponses.body?.hits.hits);
  actionResponses.body.hits.hits = transformedResponses;

  return actionResponses;
};

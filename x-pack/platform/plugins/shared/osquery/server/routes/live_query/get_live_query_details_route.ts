/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { IRouter } from '@kbn/core/server';
import { every, map, mapKeys, pick, reduce } from 'lodash';
import type { Observable } from 'rxjs';
import { lastValueFrom, zip } from 'rxjs';
import type { DataRequestHandlerContext } from '@kbn/data-plugin/server';
import { DEFAULT_SPACE_ID } from '@kbn/spaces-utils';
import type {
  GetLiveQueryDetailsRequestParamsSchema,
  GetLiveQueryDetailsRequestQuerySchema,
} from '../../../common/api';
import { buildRouteValidation } from '../../utils/build_validation/route_validation';
import { API_VERSIONS } from '../../../common/constants';
import { PLUGIN_ID } from '../../../common';
import { getActionResponses } from './utils';

import type {
  ActionDetailsRequestOptions,
  ActionDetailsStrategyResponse,
} from '../../../common/search_strategy';
import { OsqueryQueries } from '../../../common/search_strategy';
import {
  getLiveQueryDetailsRequestParamsSchema,
  getLiveQueryDetailsRequestQuerySchema,
} from '../../../common/api';
import type { OsqueryAppContext } from '../../lib/osquery_app_context_services';

export const getLiveQueryDetailsRoute = (
  router: IRouter<DataRequestHandlerContext>,
  osqueryContext: OsqueryAppContext
) => {
  router.versioned
    .get({
      access: 'public',
      path: '/api/osquery/live_queries/{id}',
      security: {
        authz: {
          requiredPrivileges: [`${PLUGIN_ID}-readLiveQueries`],
        },
      },
    })
    .addVersion(
      {
        version: API_VERSIONS.public.v1,
        validate: {
          request: {
            params: buildRouteValidation<
              typeof getLiveQueryDetailsRequestParamsSchema,
              GetLiveQueryDetailsRequestParamsSchema
            >(getLiveQueryDetailsRequestParamsSchema),
            query: buildRouteValidation<
              typeof getLiveQueryDetailsRequestQuerySchema,
              GetLiveQueryDetailsRequestQuerySchema
            >(getLiveQueryDetailsRequestQuerySchema),
          },
        },
      },
      async (context, request, response) => {
        const abortSignal = getRequestAbortedSignal(request.events.aborted$);

        try {
          const spaceId = osqueryContext?.service?.getActiveSpace
            ? (await osqueryContext.service.getActiveSpace(request))?.id || DEFAULT_SPACE_ID
            : DEFAULT_SPACE_ID;

          const search = await context.search;
          const { actionDetails } = await lastValueFrom(
            search.search<ActionDetailsRequestOptions, ActionDetailsStrategyResponse>(
              {
                actionId: request.params.id,
                factoryQueryType: OsqueryQueries.actionDetails,
                spaceId,
              },
              { abortSignal, strategy: 'osquerySearchStrategy' }
            )
          );

          const queries = actionDetails?._source?.queries;
          const expirationDate = actionDetails?.fields?.expiration[0];

          const expired = !expirationDate ? true : new Date(expirationDate) < new Date();

          const responseData = await lastValueFrom(
            zip(
              ...map(queries, (query) =>
                getActionResponses(search, query.action_id, query.agents?.length ?? 0)
              )
            )
          );

          const isCompleted = expired || (responseData && every(responseData, ['pending', 0]));
          const agentByActionIdStatusMap = mapKeys(responseData, 'action_id');

          // Track live query completion for telemetry
          if (isCompleted && osqueryContext.completionTracker) {
            const completionTracker = osqueryContext.completionTracker;
            const actionId = actionDetails._source?.action_id;
            if (actionId && !completionTracker.hasReported(actionId)) {
              completionTracker.markReported(actionId);

              const agentsExpected = queries?.reduce(
                (sum: number, q: { agents?: string[] }) => sum + (q.agents?.length ?? 0),
                0
              ) ?? 0;
              const agentsResponded = responseData?.reduce(
                (sum: number, r: { responded?: number }) => sum + (r.responded ?? 0),
                0
              ) ?? 0;
              const agentsFailed = responseData?.reduce(
                (sum: number, r: { failed?: number }) => sum + (r.failed ?? 0),
                0
              ) ?? 0;

              const createdAt = actionDetails._source?.['@timestamp'];
              const durationSeconds = createdAt
                ? Math.round((Date.now() - new Date(createdAt).getTime()) / 1000)
                : 0;

              try {
                osqueryContext.telemetry.reportLiveQueryCompleted({
                  action_id: actionId,
                  agents_expected: agentsExpected,
                  agents_responded: agentsResponded,
                  agents_failed: agentsFailed,
                  total_result_rows: 0,
                  was_timeout: expired,
                  query_count: queries?.length ?? 0,
                  duration_seconds: durationSeconds,
                });
              } catch (e) {
                // Telemetry should never block the main flow
              }
            }
          }

          return response.ok({
            body: {
              data: {
                ...pick(
                  actionDetails._source,
                  'action_id',
                  'expiration',
                  '@timestamp',
                  'agent_selection',
                  'agents',
                  'user_id',
                  'pack_id',
                  'pack_name',
                  'prebuilt_pack'
                ),
                queries: reduce<
                  {
                    action_id: string;
                    id: string;
                    query: string;
                    agents: string[];
                    ecs_mapping?: unknown;
                    version?: string;
                    platform?: string;
                    saved_query_id?: string;
                  },
                  Array<Record<string, unknown>>
                >(
                  actionDetails._source?.queries,
                  (acc, query) => {
                    const agentStatus = agentByActionIdStatusMap[query.action_id];

                    acc.push({
                      ...query,
                      ...agentStatus,
                      status: isCompleted || agentStatus?.pending === 0 ? 'completed' : 'running',
                    });

                    return acc;
                  },
                  [] as Array<Record<string, unknown>>
                ),
                status: isCompleted ? 'completed' : 'running',
              },
            },
          });
        } catch (e) {
          return response.customError({
            statusCode: e.statusCode ?? 500,
            body: {
              message: e.message,
            },
          });
        }
      }
    );
};

function getRequestAbortedSignal(aborted$: Observable<void>): AbortSignal {
  const controller = new AbortController();
  aborted$.subscribe(() => controller.abort());

  return controller.signal;
}

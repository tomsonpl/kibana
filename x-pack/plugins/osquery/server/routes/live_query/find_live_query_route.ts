/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { IRouter } from '@kbn/core/server';
import { omit } from 'lodash';
import type { Observable } from 'rxjs';
import { lastValueFrom } from 'rxjs';
import type { DataRequestHandlerContext } from '@kbn/data-plugin/server';
import type { FindLiveQueryRequestQuerySchema } from '../../../common/api';
import { buildRouteValidation } from '../../utils/build_validation/route_validation';
import { API_VERSIONS } from '../../../common/constants';
import { PLUGIN_ID } from '../../../common';

import type {
  ActionsRequestOptions,
  ActionsStrategyResponse,
  Direction,
} from '../../../common/search_strategy';
import { OsqueryQueries } from '../../../common/search_strategy';
import { createFilter, generateTablePaginationOptions } from '../../../common/utils/build_query';
import { findLiveQueryRequestQuerySchema } from '../../../common/api';

export const findLiveQueryRoute = (router: IRouter<DataRequestHandlerContext>) => {
  router.versioned
    .get({
      access: 'public',
      path: '/api/osquery/live_queries',
      options: { tags: [`access:${PLUGIN_ID}-read`] },
    })
    .addVersion(
      {
        version: API_VERSIONS.public.v1,
        validate: {
          request: {
            query: buildRouteValidation<
              typeof findLiveQueryRequestQuerySchema,
              FindLiveQueryRequestQuerySchema
            >(findLiveQueryRequestQuerySchema),
          },
        },
      },
      async (context, request, response) => {
        const abortSignal = getRequestAbortedSignal(request.events.aborted$);

        console.log({ requestQuery: request.query });
        try {
          const search = await context.search;
          const res = await lastValueFrom(
            search.search<ActionsRequestOptions, ActionsStrategyResponse>(
              {
                factoryQueryType: OsqueryQueries.actions,
                filterQuery: createFilter(request.query.filterQuery),
                pagination: generateTablePaginationOptions(
                  Number(request.query.page) ?? 0,
                  Number(request.query.pageSize) ?? 100
                ),
                sort: {
                  direction: (request.query.sortOrder ?? 'desc') as Direction,
                  field: request.query.sort ?? 'created_at',
                },
              },
              { abortSignal, strategy: 'osquerySearchStrategy' }
            )
          );

          return response.ok({
            body: {
              data: {
                ...omit(res, 'edges'),
                items: res.edges,
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

/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { IEsSearchResponse } from '@kbn/data-plugin/common';
import { inspectStringifyObject } from '../../../../../utils/build_query';
import { DEFAULT_MAX_TABLE_QUERY_SIZE } from '../../../../../../common/constants';

import { buildActionsQuery } from './query.all_actions.dsl';
import type { SecuritySolutionFactory } from '../../types';
import type { ResponseActionsQueries } from '../../../../../../common/search_strategy/security_solution/response_actions';

export const allActions: SecuritySolutionFactory<ResponseActionsQueries.actions> = {
  buildDsl: (options: any) => {
    // buildDsl: (options: ActionsRequestOptions) => {
    if (options.pagination && options.pagination.querySize >= DEFAULT_MAX_TABLE_QUERY_SIZE) {
      throw new Error(`No query size above ${DEFAULT_MAX_TABLE_QUERY_SIZE}`);
    }

    return buildActionsQuery(options);
  },
  parse: async (
    options: any,
    // options: ActionsRequestOptions,
    response: IEsSearchResponse<object>
  ): Promise<any> => {
    // ): Promise<ActionsStrategyResponse> => {
    const inspect = {
      dsl: [inspectStringifyObject(buildActionsQuery(options))],
    };

    return {
      ...response,
      inspect,
      edges: response.rawResponse.hits.hits,
    };
  },
};

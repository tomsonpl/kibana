/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { RequestHandler } from '@kbn/core/server';
import type { TypeOf } from '@kbn/config-schema';
import type { ExperimentalFeatures } from '../../../../../common';
import { EXCLUDE_COLD_AND_FROZEN_TIERS_IN_ANALYZER } from '../../../../../common/constants';
import type { validateEntities } from '../../../../../common/endpoint/schema/resolver';
import type { ResolverEntityIndex } from '../../../../../common/endpoint/types';
import { resolverEntity } from './utils/build_resolver_entity';
import { createSharedFilters } from '../utils/shared_filters';

/**
 * This is used to get an 'entity_id' which is an internal-to-Resolver concept, from an `_id`, which
 * is the artificial ID generated by ES for each document.
 */
export function handleEntities(
  experimentalFeatures: ExperimentalFeatures
): RequestHandler<unknown, TypeOf<typeof validateEntities.query>> {
  return async (context, request, response) => {
    const {
      query: { _id, indices },
    } = request;

    const esClient = (await context.core).elasticsearch.client;
    const excludeColdAndFrozenTiers = await (
      await context.core
    ).uiSettings.client.get<boolean>(EXCLUDE_COLD_AND_FROZEN_TIERS_IN_ANALYZER);

    const queryResponse = await esClient.asCurrentUser.search({
      ignore_unavailable: true,
      index: indices,
      body: {
        // only return 1 match at most
        size: 1,
        query: {
          bool: {
            filter: [
              ...createSharedFilters({ excludeColdAndFrozenTiers }),
              {
                // only return documents with the matching _id
                ids: {
                  values: _id,
                },
              },
            ],
          },
        },
      },
    });

    const responseBody: ResolverEntityIndex = resolverEntity(
      queryResponse.hits.hits,
      experimentalFeatures
    );
    return response.ok({ body: responseBody });
  };
}

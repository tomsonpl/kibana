/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { filter, find, isEmpty, pick, isString } from 'lodash';
import type { PackagePolicy } from '@kbn/fleet-plugin/common';
import { LEGACY_AGENT_POLICY_SAVED_OBJECT_TYPE } from '@kbn/fleet-plugin/common';
import type { PackSavedObject, SavedQuerySavedObject } from '../../common/types';

/**
 * Constructs the configs telemetry schema from a collection of config saved objects
 */
export const templateConfigs = (configsData: PackagePolicy[]) =>
  configsData.map((item) => {
    const osqueryConfig = find(item.inputs, ['type', 'osquery'])?.config?.osquery.value;
    const packs = osqueryConfig?.packs;
    const numPacks = packs ? Object.keys(packs).length : 0;
    const hasCustomConfig = !!osqueryConfig?.options;

    return {
      id: item.id,
      version: item.package?.version,
      enabled: item.enabled,
      config: osqueryConfig,
      num_packs: numPacks,
      has_custom_config: hasCustomConfig,
    };
  });

/**
 * Constructs the packs telemetry schema from a collection of packs saved objects
 */
export const templatePacks = (packsData: PackSavedObject[]) => {
  const nonEmptyQueryPacks = filter(packsData, (pack) => !isEmpty(pack.queries));

  return nonEmptyQueryPacks.map((item) => {
    const queries = item.queries || [];
    const queryCount = Array.isArray(queries) ? queries.length : Object.keys(queries).length;
    const queryArray = Array.isArray(queries) ? queries : Object.values(queries);

    const hasShards = !!(item as unknown as { shards?: unknown[] }).shards &&
      ((item as unknown as { shards?: unknown[] }).shards?.length ?? 0) > 0;

    const queriesWithPlatform = queryArray.filter(
      (q: Record<string, unknown>) => !!q.platform
    ).length;
    const queriesWithEcsMapping = queryArray.filter(
      (q: Record<string, unknown>) => !isEmpty(q.ecs_mapping)
    ).length;

    const policyRefs = filter(item.references, ['type', LEGACY_AGENT_POLICY_SAVED_OBJECT_TYPE]);

    return pick(
      {
        name: item.name,
        enabled: item.enabled,
        queries: item.queries,
        policies: policyRefs.length,
        prebuilt:
          !!filter(item.references, ['type', 'osquery-pack-asset']).length &&
          item.version !== undefined,
        query_count: queryCount,
        has_shards: hasShards,
        queries_with_platform: queriesWithPlatform,
        queries_with_ecs_mapping: queriesWithEcsMapping,
      },
      [
        'name',
        'queries',
        'policies',
        'prebuilt',
        'enabled',
        'query_count',
        'has_shards',
        'queries_with_platform',
        'queries_with_ecs_mapping',
      ]
    );
  });
};

/**
 * Constructs the saved queries telemetry schema from a collection of saved query saved objects
 */
export const templateSavedQueries = (
  savedQueriesData: SavedQuerySavedObject[],
  prebuiltSavedQueryIds: string[]
) =>
  savedQueriesData.map((item) => ({
    id: item.id,
    query: item.query,
    platform: item.platform,
    interval: isString(item.interval) ? parseInt(item.interval, 10) : item.interval,
    ...(!isEmpty(item.snapshot) ? { snapshot: item.snapshot } : {}),
    ...(!isEmpty(item.removed) ? { removed: item.removed } : {}),
    ...(!isEmpty(item.ecs_mapping) ? { ecs_mapping: item.ecs_mapping } : {}),
    prebuilt: prebuiltSavedQueryIds.includes(item.id),
    query_length: item.query?.length ?? 0,
    has_ecs_mapping: !isEmpty(item.ecs_mapping),
    ecs_mapping_count: Array.isArray(item.ecs_mapping) ? item.ecs_mapping.length : 0,
  }));

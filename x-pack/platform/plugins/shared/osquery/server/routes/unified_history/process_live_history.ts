/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { Logger } from '@kbn/core/server';

import type {
  LiveHistoryRow,
  SourceFilter,
} from '../../../common/api/unified_history/types';
import type { OsqueryAppContext } from '../../lib/osquery_app_context_services';
import { getResultCountsForActions } from '../../lib/get_result_counts_for_actions';
import type { SortValues } from './query_live_actions_dsl';
import { mapLiveHitToRow } from './map_live_hit_to_row';
import type { LiveActionHit } from './map_live_hit_to_row';

export interface ProcessLiveHistoryParams {
  liveHits: LiveActionHit[];
  osqueryContext: OsqueryAppContext;
  spaceId: string;
  activeFilters?: Set<SourceFilter>;
  logger: Logger;
}

export interface ProcessLiveHistoryResult {
  liveRows: LiveHistoryRow[];
  sortValuesMap: Map<string, SortValues>;
}

export const processLiveHistory = async ({
  liveHits,
  osqueryContext,
  spaceId,
  activeFilters,
  logger,
}: ProcessLiveHistoryParams): Promise<ProcessLiveHistoryResult> => {
  const liveRows: LiveHistoryRow[] = liveHits.map(mapLiveHitToRow);

  if (liveRows.length > 0) {
    try {
      await enrichWithResultCounts(liveHits, liveRows, osqueryContext, spaceId);
    } catch (err) {
      logger.warn(
        `Failed to enrich live rows with result counts: ${(err as Error).message}`
      );
    }
  }

  const sortValuesMap = buildSortValuesMap(liveHits);

  const filteredRows = activeFilters
    ? liveRows.filter((row) => {
        if (row.source === 'Rule') return activeFilters.has('rule');

        return activeFilters.has('live');
      })
    : liveRows;

  return { liveRows: filteredRows, sortValuesMap };
};

const enrichWithResultCounts = async (
  liveHits: LiveActionHit[],
  liveRows: LiveHistoryRow[],
  osqueryContext: OsqueryAppContext,
  spaceId: string
): Promise<void> => {
  const [coreStartServices] = await osqueryContext.getStartServices();
  const internalEsClient = coreStartServices.elasticsearch.client.asInternalUser;

  const allSubActionIds: string[] = [];
  const hitQueriesMap = new Map<string, Array<{ action_id?: string; query?: string }>>();

  for (const hit of liveHits) {
    const source = (hit._source ?? {}) as Record<string, unknown>;
    const queries = (source.queries ?? []) as Array<{
      action_id?: string;
      query?: string;
    }>;
    const actionId =
      (hit.fields?.action_id as string[] | undefined)?.[0] ??
      (source.action_id as string | undefined) ??
      '';

    hitQueriesMap.set(actionId, queries);
    for (const q of queries) {
      if (q.action_id) {
        allSubActionIds.push(q.action_id);
      }
    }
  }

  const resultCountsMap = await getResultCountsForActions(
    internalEsClient,
    allSubActionIds,
    spaceId
  );

  for (const row of liveRows) {
    const queries = hitQueriesMap.get(row.actionId ?? '') ?? [];

    if (row.packId || row.packName) {
      let totalRows = 0;
      let queriesWithResults = 0;
      let successfulAgents = 0;
      let errorAgents = 0;
      let maxRespondedAgents = 0;

      for (const q of queries) {
        if (q.action_id) {
          const counts = resultCountsMap.get(q.action_id);
          if (counts) {
            totalRows += counts.totalRows;
            if (counts.totalRows > 0) {
              queriesWithResults++;
            }

            if (counts.respondedAgents > maxRespondedAgents) {
              maxRespondedAgents = counts.respondedAgents;
              successfulAgents = counts.successfulAgents;
              errorAgents = counts.errorAgents;
            }
          }
        }
      }

      row.successCount = successfulAgents;
      row.errorCount = errorAgents;
      row.totalRows = totalRows;
      row.queriesWithResults = queriesWithResults;
      row.queriesTotal = queries.length;
    } else {
      const queryActionId = queries[0]?.action_id;
      const counts = queryActionId ? resultCountsMap.get(queryActionId) : undefined;

      row.successCount = counts?.successfulAgents ?? 0;
      row.errorCount = counts?.errorAgents ?? 0;
      row.totalRows = counts?.totalRows ?? 0;
    }
  }
};

const buildSortValuesMap = (liveHits: LiveActionHit[]): Map<string, SortValues> => {
  const sortValuesMap = new Map<string, SortValues>();
  for (const hit of liveHits) {
    if (hit.sort) {
      const actionId =
        hit.fields?.action_id ?? (hit._source as Record<string, unknown>)?.action_id;
      const id = Array.isArray(actionId) ? actionId[0] : actionId;
      if (typeof id === 'string') {
        sortValuesMap.set(id, hit.sort);
      }
    }
  }

  return sortValuesMap;
};

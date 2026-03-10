/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { SavedObjectsClientContract } from '@kbn/core/server';

import { packSavedObjectType } from '../../../common/types';
import type { PackSavedObject } from '../../common/types';
import type { ScheduledHistoryRow } from '../../../common/api/unified_history/types';
import { buildPackLookup } from './pack_lookup';

export interface ScheduledExecutionBucket {
  key: [string, number];
  key_as_string: string;
  doc_count: number;
  planned_time: { value: number | null; value_as_string?: string };
  max_timestamp: { value: number; value_as_string: string };
  agent_count: { value: number };
  total_rows: { value: number };
  success_count: { doc_count: number };
  error_count: { doc_count: number };
  pack_id_hit?: {
    hits: {
      hits: Array<{ _source?: { pack_id?: string } }>;
    };
  };
}

export interface ScheduledAggregations {
  scheduled_executions?: {
    buckets: ScheduledExecutionBucket[];
  };
}

export const extractPackIdFromBucket = (bucket: ScheduledExecutionBucket): string | undefined =>
  bucket.pack_id_hit?.hits?.hits?.[0]?._source?.pack_id;

// --- resolvePackFilterForKuery ---

export interface ResolvePackFilterResult {
  packIds?: string[];
  scheduleIds?: string[];
}

export const resolvePackFilterForKuery = async (
  spaceScopedClient: SavedObjectsClientContract,
  kuery: string
): Promise<ResolvePackFilterResult> => {
  const term = kuery.replace(/\*/g, '').toLowerCase();
  const matchingPacks = await spaceScopedClient.find<PackSavedObject>({
    type: packSavedObjectType,
    perPage: 1000,
  });

  const matchingPackIds: string[] = [];
  const matchingScheduleIds: string[] = [];

  for (const so of matchingPacks.saved_objects) {
    if (so.attributes.name?.toLowerCase().includes(term)) {
      matchingPackIds.push(so.id);
    } else if (so.attributes.queries) {
      for (const q of so.attributes.queries) {
        if (
          q.name?.toLowerCase().includes(term) ||
          q.id?.toLowerCase().includes(term) ||
          q.query?.toLowerCase().includes(term)
        ) {
          if (q.schedule_id) {
            matchingScheduleIds.push(q.schedule_id);
          }
        }
      }
    }
  }

  const result: ResolvePackFilterResult = {};

  if (matchingPackIds.length > 0) {
    result.packIds = matchingPackIds;
  }

  if (matchingScheduleIds.length > 0) {
    result.scheduleIds = matchingScheduleIds;
  }

  if (matchingPackIds.length === 0 && matchingScheduleIds.length === 0) {
    result.packIds = [];
  }

  return result;
};

// --- processScheduledHistory ---

export interface ProcessScheduledHistoryParams {
  scheduledBuckets: ScheduledExecutionBucket[];
  spaceScopedClient: SavedObjectsClientContract;
  spaceId: string;
}

export const processScheduledHistory = async ({
  scheduledBuckets,
  spaceScopedClient,
  spaceId,
}: ProcessScheduledHistoryParams): Promise<ScheduledHistoryRow[]> => {
  const bucketPackIds = scheduledBuckets
    .map(extractPackIdFromBucket)
    .filter((id): id is string => !!id);
  const uniquePackIds = [...new Set(bucketPackIds)];

  let packSOs: Array<{ id: string; attributes: PackSavedObject }>;
  if (uniquePackIds.length > 0) {
    const bulkResult = await spaceScopedClient.bulkGet<PackSavedObject>(
      uniquePackIds.map((id) => ({ id, type: packSavedObjectType }))
    );
    packSOs = bulkResult.saved_objects
      .filter((so) => !so.error)
      .map((so) => ({ id: so.id, attributes: so.attributes }));
  } else {
    packSOs = [];
  }

  const packLookup = buildPackLookup(packSOs);

  return scheduledBuckets.map((bucket) => {
    const scheduleId = bucket.key[0];
    const executionCount = bucket.key[1];
    const bucketPackId = extractPackIdFromBucket(bucket);
    const packContext = packLookup.get(scheduleId);

    return {
      id: `${scheduleId}_${executionCount}`,
      sourceType: 'scheduled' as const,
      timestamp: bucket.max_timestamp.value_as_string,
      plannedTime: bucket.planned_time.value_as_string,
      queryText: packContext?.queryText ?? '',
      queryName: packContext?.queryName,
      source: 'Scheduled' as const,
      packName: packContext?.packName,
      packId: packContext?.packId ?? bucketPackId,
      spaceId,
      agentCount: bucket.agent_count.value,
      successCount: bucket.success_count.doc_count,
      errorCount: bucket.error_count.doc_count,
      totalRows: bucket.total_rows.value,
      scheduleId,
      executionCount,
    };
  });
};

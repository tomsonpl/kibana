/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { savedObjectsClientMock } from '@kbn/core-saved-objects-api-server-mocks';

import type { ScheduledExecutionBucket } from './process_scheduled_history';
import {
  extractPackIdFromBucket,
  resolvePackFilterForKuery,
  processScheduledHistory,
} from './process_scheduled_history';

const makeBucket = (
  scheduleId: string,
  executionCount: number,
  overrides: Partial<ScheduledExecutionBucket> = {}
): ScheduledExecutionBucket => ({
  key: [scheduleId, executionCount],
  key_as_string: `${scheduleId}|${executionCount}`,
  doc_count: 3,
  planned_time: { value: Date.now(), value_as_string: '2025-01-01T00:00:00Z' },
  max_timestamp: { value: Date.now(), value_as_string: '2025-01-01T00:01:00Z' },
  agent_count: { value: 5 },
  total_rows: { value: 42 },
  success_count: { doc_count: 4 },
  error_count: { doc_count: 1 },
  ...overrides,
});

describe('process_scheduled_history', () => {
  describe('extractPackIdFromBucket', () => {
    it('returns pack_id from top hit', () => {
      const bucket = makeBucket('sched-1', 1, {
        pack_id_hit: {
          hits: { hits: [{ _source: { pack_id: 'pack-abc' } }] },
        },
      });
      expect(extractPackIdFromBucket(bucket)).toBe('pack-abc');
    });

    it('returns undefined when no pack_id_hit', () => {
      const bucket = makeBucket('sched-1', 1);
      expect(extractPackIdFromBucket(bucket)).toBeUndefined();
    });
  });

  describe('resolvePackFilterForKuery', () => {
    it('returns matching pack ids when pack name matches', async () => {
      const soClient = savedObjectsClientMock.create();
      soClient.find.mockResolvedValue({
        saved_objects: [
          {
            id: 'pack-1',
            type: 'osquery-pack',
            attributes: { name: 'My Test Pack', queries: [] },
            references: [],
            score: 0,
          },
        ],
        total: 1,
        per_page: 1000,
        page: 1,
      });

      const result = await resolvePackFilterForKuery(soClient, 'test');
      expect(result.packIds).toEqual(['pack-1']);
    });

    it('returns matching schedule ids when query matches', async () => {
      const soClient = savedObjectsClientMock.create();
      soClient.find.mockResolvedValue({
        saved_objects: [
          {
            id: 'pack-1',
            type: 'osquery-pack',
            attributes: {
              name: 'Some Pack',
              queries: [
                { id: 'q1', name: 'uptime', query: 'SELECT * FROM uptime', schedule_id: 'sid-1' },
              ],
            },
            references: [],
            score: 0,
          },
        ],
        total: 1,
        per_page: 1000,
        page: 1,
      });

      const result = await resolvePackFilterForKuery(soClient, 'uptime');
      expect(result.scheduleIds).toEqual(['sid-1']);
      expect(result.packIds).toBeUndefined();
    });

    it('returns empty packIds when nothing matches', async () => {
      const soClient = savedObjectsClientMock.create();
      soClient.find.mockResolvedValue({
        saved_objects: [
          {
            id: 'pack-1',
            type: 'osquery-pack',
            attributes: { name: 'Unrelated', queries: [] },
            references: [],
            score: 0,
          },
        ],
        total: 1,
        per_page: 1000,
        page: 1,
      });

      const result = await resolvePackFilterForKuery(soClient, 'nonexistent');
      expect(result.packIds).toEqual([]);
    });
  });

  describe('processScheduledHistory', () => {
    it('maps buckets to ScheduledHistoryRow', async () => {
      const soClient = savedObjectsClientMock.create();
      soClient.bulkGet.mockResolvedValue({
        saved_objects: [
          {
            id: 'pack-abc',
            type: 'osquery-pack',
            attributes: {
              name: 'TestPack',
              queries: [
                {
                  id: 'q1',
                  name: 'uptime_query',
                  query: 'SELECT * FROM uptime',
                  schedule_id: 'sched-1',
                },
              ],
            },
            references: [],
          },
        ],
      });

      const buckets = [
        makeBucket('sched-1', 1, {
          pack_id_hit: {
            hits: { hits: [{ _source: { pack_id: 'pack-abc' } }] },
          },
        }),
      ];

      const rows = await processScheduledHistory({
        scheduledBuckets: buckets,
        spaceScopedClient: soClient,
        spaceId: 'default',
      });

      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({
        id: 'sched-1_1',
        sourceType: 'scheduled',
        source: 'Scheduled',
        packName: 'TestPack',
        queryName: 'uptime_query',
        agentCount: 5,
        successCount: 4,
        errorCount: 1,
        totalRows: 42,
      });
    });

    it('returns rows with defaults when no pack found', async () => {
      const soClient = savedObjectsClientMock.create();

      const buckets = [makeBucket('unknown-schedule', 1)];

      const rows = await processScheduledHistory({
        scheduledBuckets: buckets,
        spaceScopedClient: soClient,
        spaceId: 'default',
      });

      expect(rows).toHaveLength(1);
      expect(rows[0].queryText).toBe('');
      expect(rows[0].queryName).toBeUndefined();
      expect(rows[0].packName).toBeUndefined();
    });

    it('returns empty array for no buckets', async () => {
      const soClient = savedObjectsClientMock.create();
      const rows = await processScheduledHistory({
        scheduledBuckets: [],
        spaceScopedClient: soClient,
        spaceId: 'default',
      });
      expect(rows).toEqual([]);
    });
  });
});

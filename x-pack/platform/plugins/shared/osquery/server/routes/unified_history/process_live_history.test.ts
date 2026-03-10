/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { LiveActionHit } from './map_live_hit_to_row';
import { processLiveHistory } from './process_live_history';

jest.mock('../../lib/get_result_counts_for_actions', () => ({
  getResultCountsForActions: jest.fn(),
}));

const { getResultCountsForActions } = jest.requireMock(
  '../../lib/get_result_counts_for_actions'
) as { getResultCountsForActions: jest.Mock };

const mockOsqueryContext = {
  getStartServices: jest.fn().mockResolvedValue([
    {
      elasticsearch: {
        client: { asInternalUser: {} },
      },
    },
  ]),
} as any;

const mockLogger = {
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
} as any;

const makeHit = (
  actionId: string,
  queries: Array<{ action_id: string; query: string }>,
  overrides: Partial<LiveActionHit> = {}
): LiveActionHit => ({
  _source: {
    action_id: actionId,
    '@timestamp': '2025-01-01T00:00:00Z',
    queries,
    agents: ['agent-1', 'agent-2'],
    type: 'INPUT_ACTION',
    input_type: 'osquery',
  },
  fields: {
    action_id: [actionId],
  },
  sort: [actionId, 1],
  ...overrides,
});

describe('processLiveHistory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('maps hits to rows and builds sortValuesMap', async () => {
    getResultCountsForActions.mockResolvedValue(
      new Map([
        [
          'sub-action-1',
          { totalRows: 10, respondedAgents: 2, successfulAgents: 2, errorAgents: 0 },
        ],
      ])
    );

    const hits = [
      makeHit('action-1', [{ action_id: 'sub-action-1', query: 'SELECT 1' }]),
    ];

    const { liveRows, sortValuesMap } = await processLiveHistory({
      liveHits: hits,
      osqueryContext: mockOsqueryContext,
      spaceId: 'default',
      logger: mockLogger,
    });

    expect(liveRows).toHaveLength(1);
    expect(liveRows[0].successCount).toBe(2);
    expect(liveRows[0].errorCount).toBe(0);
    expect(liveRows[0].totalRows).toBe(10);
    expect(sortValuesMap.get('action-1')).toEqual(['action-1', 1]);
  });

  it('enriches pack rows with aggregated counts', async () => {
    getResultCountsForActions.mockResolvedValue(
      new Map([
        [
          'sub-1',
          { totalRows: 5, respondedAgents: 3, successfulAgents: 2, errorAgents: 1 },
        ],
        [
          'sub-2',
          { totalRows: 10, respondedAgents: 4, successfulAgents: 3, errorAgents: 1 },
        ],
      ])
    );

    const hits = [
      makeHit('action-1', [
        { action_id: 'sub-1', query: 'SELECT 1' },
        { action_id: 'sub-2', query: 'SELECT 2' },
      ], {
        _source: {
          action_id: 'action-1',
          '@timestamp': '2025-01-01T00:00:00Z',
          queries: [
            { action_id: 'sub-1', query: 'SELECT 1' },
            { action_id: 'sub-2', query: 'SELECT 2' },
          ],
          agents: ['agent-1', 'agent-2'],
          pack_id: 'pack-1',
          pack_name: 'My Pack',
          type: 'INPUT_ACTION',
          input_type: 'osquery',
        },
      }),
    ];

    const { liveRows } = await processLiveHistory({
      liveHits: hits,
      osqueryContext: mockOsqueryContext,
      spaceId: 'default',
      logger: mockLogger,
    });

    expect(liveRows[0].totalRows).toBe(15);
    expect(liveRows[0].queriesWithResults).toBe(2);
    expect(liveRows[0].queriesTotal).toBe(2);
    expect(liveRows[0].successCount).toBe(3);
    expect(liveRows[0].errorCount).toBe(1);
  });

  it('applies source filters', async () => {
    getResultCountsForActions.mockResolvedValue(new Map());

    const hits = [
      makeHit('action-1', [{ action_id: 'sub-1', query: 'SELECT 1' }]),
      makeHit('action-2', [{ action_id: 'sub-2', query: 'SELECT 2' }], {
        _source: {
          action_id: 'action-2',
          '@timestamp': '2025-01-01T00:00:00Z',
          queries: [{ action_id: 'sub-2', query: 'SELECT 2' }],
          agents: ['agent-1'],
          alert_ids: ['alert-1'],
          type: 'INPUT_ACTION',
          input_type: 'osquery',
        },
      }),
    ];

    const { liveRows } = await processLiveHistory({
      liveHits: hits,
      osqueryContext: mockOsqueryContext,
      spaceId: 'default',
      activeFilters: new Set(['rule']),
      logger: mockLogger,
    });

    expect(liveRows).toHaveLength(1);
    expect(liveRows[0].source).toBe('Rule');
  });

  it('logs warning and continues when enrichment fails', async () => {
    getResultCountsForActions.mockRejectedValue(new Error('ES unavailable'));

    const hits = [
      makeHit('action-1', [{ action_id: 'sub-1', query: 'SELECT 1' }]),
    ];

    const { liveRows } = await processLiveHistory({
      liveHits: hits,
      osqueryContext: mockOsqueryContext,
      spaceId: 'default',
      logger: mockLogger,
    });

    expect(liveRows).toHaveLength(1);
    expect(liveRows[0].successCount).toBeUndefined();
    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.stringContaining('Failed to enrich live rows with result counts')
    );
  });

  it('returns empty results for no hits', async () => {
    const { liveRows, sortValuesMap } = await processLiveHistory({
      liveHits: [],
      osqueryContext: mockOsqueryContext,
      spaceId: 'default',
      logger: mockLogger,
    });

    expect(liveRows).toEqual([]);
    expect(sortValuesMap.size).toBe(0);
    expect(getResultCountsForActions).not.toHaveBeenCalled();
  });
});

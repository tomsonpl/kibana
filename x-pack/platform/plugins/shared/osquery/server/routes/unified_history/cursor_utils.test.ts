/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { UnifiedHistoryRow } from '../../../common/api/unified_history/types';
import type { MergeResult } from './merge_rows';
import { decodeCursor, encodeCursor, computePaginationCursors } from './cursor_utils';

describe('cursor_utils', () => {
  describe('decodeCursor', () => {
    it('returns empty object for undefined', () => {
      expect(decodeCursor(undefined)).toEqual({});
    });

    it('returns empty object for empty string', () => {
      expect(decodeCursor('')).toEqual({});
    });

    it('round-trips with encodeCursor', () => {
      const cursor = {
        actionSearchAfter: ['2025-01-01T00:00:00Z', 42],
        scheduledCursor: '2025-01-01T00:00:00Z',
        scheduledOffset: 3,
      };
      const encoded = encodeCursor(cursor);
      expect(decodeCursor(encoded)).toEqual(cursor);
    });

    it('returns empty object for invalid base64', () => {
      expect(decodeCursor('not-valid-json-base64!!!')).toEqual({});
    });
  });

  describe('encodeCursor', () => {
    it('produces a base64 string', () => {
      const encoded = encodeCursor({ scheduledOffset: 5 });
      expect(typeof encoded).toBe('string');
      const decoded = JSON.parse(Buffer.from(encoded, 'base64').toString('utf8'));
      expect(decoded).toEqual({ scheduledOffset: 5 });
    });
  });

  describe('computePaginationCursors', () => {
    const makeLiveRow = (id: string, actionId: string, ts: string): UnifiedHistoryRow => ({
      id,
      sourceType: 'live' as const,
      source: 'Live' as const,
      timestamp: ts,
      queryText: '',
      agentCount: 1,
      successCount: undefined,
      errorCount: undefined,
      totalRows: undefined,
      actionId,
    });

    const makeScheduledRow = (
      id: string,
      ts: string,
      plannedTime: string
    ): UnifiedHistoryRow => ({
      id,
      sourceType: 'scheduled' as const,
      source: 'Scheduled' as const,
      timestamp: ts,
      queryText: '',
      agentCount: 1,
      successCount: 1,
      errorCount: 0,
      totalRows: 10,
      plannedTime,
    });

    it('returns last live row sort values for nextActionSearchAfter', () => {
      const sortValuesMap = new Map([
        ['action-1', ['2025-01-01', 1]],
        ['action-2', ['2025-01-02', 2]],
      ]);

      const mergeResult: MergeResult<UnifiedHistoryRow> = {
        rows: [makeLiveRow('r1', 'action-1', '2025-01-01'), makeLiveRow('r2', 'action-2', '2025-01-02')],
        hasMore: false,
        scheduledConsumedOnPage: 0,
      };

      const result = computePaginationCursors({
        mergeResult,
        sortValuesMap,
        decoded: {},
        scheduledOffset: 0,
      });

      expect(result.nextActionSearchAfter).toEqual(['2025-01-02', 2]);
    });

    it('falls back to decoded.actionSearchAfter when no live rows on page', () => {
      const mergeResult: MergeResult<UnifiedHistoryRow> = {
        rows: [makeScheduledRow('s1', '2025-01-01', '2025-01-01')],
        hasMore: false,
        scheduledConsumedOnPage: 1,
      };

      const result = computePaginationCursors({
        mergeResult,
        sortValuesMap: new Map(),
        decoded: { actionSearchAfter: ['prev-ts', 99] },
        scheduledOffset: 0,
      });

      expect(result.nextActionSearchAfter).toEqual(['prev-ts', 99]);
    });

    it('advances scheduled cursor when planned time changes', () => {
      const mergeResult: MergeResult<UnifiedHistoryRow> = {
        rows: [
          makeScheduledRow('s1', '2025-01-02', '2025-01-02T00:00:00Z'),
          makeScheduledRow('s2', '2025-01-01', '2025-01-01T00:00:00Z'),
        ],
        hasMore: true,
        scheduledConsumedOnPage: 2,
      };

      const result = computePaginationCursors({
        mergeResult,
        sortValuesMap: new Map(),
        decoded: { scheduledCursor: '2025-01-03T00:00:00Z' },
        scheduledOffset: 0,
      });

      expect(result.nextScheduledCursor).toBe('2025-01-01T00:00:00Z');
      expect(result.nextScheduledOffset).toBe(1);
    });

    it('increments offset when cursor stays the same', () => {
      const mergeResult: MergeResult<UnifiedHistoryRow> = {
        rows: [
          makeScheduledRow('s1', '2025-01-01', '2025-01-01T00:00:00Z'),
          makeScheduledRow('s2', '2025-01-01', '2025-01-01T00:00:00Z'),
        ],
        hasMore: true,
        scheduledConsumedOnPage: 2,
      };

      const result = computePaginationCursors({
        mergeResult,
        sortValuesMap: new Map(),
        decoded: { scheduledCursor: '2025-01-01T00:00:00Z' },
        scheduledOffset: 3,
      });

      expect(result.nextScheduledCursor).toBe('2025-01-01T00:00:00Z');
      expect(result.nextScheduledOffset).toBe(5);
    });

    it('does not advance scheduled cursor when no scheduled rows', () => {
      const mergeResult: MergeResult<UnifiedHistoryRow> = {
        rows: [makeLiveRow('r1', 'action-1', '2025-01-01')],
        hasMore: false,
        scheduledConsumedOnPage: 0,
      };

      const result = computePaginationCursors({
        mergeResult,
        sortValuesMap: new Map([['action-1', ['2025-01-01', 1]]]),
        decoded: { scheduledCursor: 'old-cursor', scheduledOffset: 5 },
        scheduledOffset: 5,
      });

      expect(result.nextScheduledCursor).toBe('old-cursor');
      expect(result.nextScheduledOffset).toBe(5);
    });
  });
});

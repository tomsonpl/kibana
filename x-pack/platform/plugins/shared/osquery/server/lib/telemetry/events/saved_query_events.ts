/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { EventTypeOpts } from '@kbn/core/server';
import {
  TELEMETRY_EBT_SAVED_QUERY_EVENT,
  TELEMETRY_EBT_SAVED_QUERY_CREATED_EVENT,
  TELEMETRY_EBT_SAVED_QUERY_UPDATED_EVENT,
  TELEMETRY_EBT_SAVED_QUERY_DELETED_EVENT,
  TELEMETRY_EBT_SAVED_QUERY_COPIED_EVENT,
} from '../constants';

export const savedQueryEvent: EventTypeOpts<Record<string, unknown>> = {
  eventType: TELEMETRY_EBT_SAVED_QUERY_EVENT,
  schema: {
    id: {
      type: 'keyword',
      _meta: { description: 'User-defined ID of the saved query' },
    },
    query: {
      type: 'text',
      _meta: { description: 'The osquery SQL query text' },
    },
    platform: {
      type: 'keyword',
      _meta: { description: 'Target platform filter (windows, linux, macos)', optional: true },
    },
    interval: {
      type: 'short',
      _meta: { description: 'Query execution interval in seconds', optional: true },
    },
    snapshot: {
      type: 'boolean',
      _meta: { description: 'Whether the query runs in snapshot mode' },
    },
    removed: {
      type: 'boolean',
      _meta: { description: 'Whether removed results are tracked', optional: true },
    },
    prebuilt: {
      type: 'boolean',
      _meta: { description: 'Whether this is an Elastic prebuilt saved query', optional: true },
    },
    ecs_mapping: {
      type: 'pass_through',
      _meta: { description: 'ECS field mapping configuration', optional: true },
    },
    query_length: {
      type: 'short',
      _meta: {
        description: 'Character length of the query text',
        optional: true,
      },
    },
    has_ecs_mapping: {
      type: 'boolean',
      _meta: {
        description: 'Whether the saved query has ECS mappings defined',
        optional: true,
      },
    },
    ecs_mapping_count: {
      type: 'short',
      _meta: {
        description: 'Number of ECS mapping fields defined',
        optional: true,
      },
    },
  },
};

const resultSchema = {
  result: {
    type: 'keyword' as const,
    _meta: { description: 'Operation result: success or failed' },
  },
  error_message: {
    type: 'keyword' as const,
    _meta: {
      description: 'Error category if the operation failed',
      optional: true as const,
    },
  },
};

export const savedQueryCreatedEvent: EventTypeOpts<Record<string, unknown>> = {
  eventType: TELEMETRY_EBT_SAVED_QUERY_CREATED_EVENT,
  schema: {
    saved_query_id: {
      type: 'keyword',
      _meta: { description: 'User-defined ID of the created saved query' },
    },
    has_ecs_mapping: {
      type: 'boolean',
      _meta: { description: 'Whether the saved query includes ECS mappings' },
    },
    ecs_mapping_count: {
      type: 'short',
      _meta: { description: 'Number of ECS mapping fields defined' },
    },
    has_platform_filter: {
      type: 'boolean',
      _meta: { description: 'Whether a platform filter is applied' },
    },
    has_interval: {
      type: 'boolean',
      _meta: { description: 'Whether a custom interval is configured' },
    },
    snapshot_mode: {
      type: 'boolean',
      _meta: { description: 'Whether snapshot mode is enabled' },
    },
    ...resultSchema,
  },
};

export const savedQueryUpdatedEvent: EventTypeOpts<Record<string, unknown>> = {
  eventType: TELEMETRY_EBT_SAVED_QUERY_UPDATED_EVENT,
  schema: {
    saved_query_id: {
      type: 'keyword',
      _meta: { description: 'User-defined ID of the updated saved query' },
    },
    query_changed: {
      type: 'boolean',
      _meta: { description: 'Whether the query text was modified in this update' },
    },
    has_ecs_mapping: {
      type: 'boolean',
      _meta: { description: 'Whether the saved query includes ECS mappings after update' },
    },
    ecs_mapping_count: {
      type: 'short',
      _meta: { description: 'Number of ECS mapping fields after update' },
    },
    ...resultSchema,
  },
};

export const savedQueryDeletedEvent: EventTypeOpts<Record<string, unknown>> = {
  eventType: TELEMETRY_EBT_SAVED_QUERY_DELETED_EVENT,
  schema: {
    saved_query_id: {
      type: 'keyword',
      _meta: { description: 'User-defined ID of the deleted saved query' },
    },
    ...resultSchema,
  },
};

export const savedQueryCopiedEvent: EventTypeOpts<Record<string, unknown>> = {
  eventType: TELEMETRY_EBT_SAVED_QUERY_COPIED_EVENT,
  schema: {
    source_saved_query_id: {
      type: 'keyword',
      _meta: { description: 'User-defined ID of the source saved query' },
    },
    new_saved_query_id: {
      type: 'keyword',
      _meta: { description: 'User-defined ID of the new saved query copy' },
    },
    ...resultSchema,
  },
};

export const savedQueryEvents = [
  savedQueryEvent,
  savedQueryCreatedEvent,
  savedQueryUpdatedEvent,
  savedQueryDeletedEvent,
  savedQueryCopiedEvent,
];

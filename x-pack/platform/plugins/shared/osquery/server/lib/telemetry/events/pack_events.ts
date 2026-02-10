/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { EventTypeOpts } from '@kbn/core/server';
import {
  TELEMETRY_EBT_PACK_EVENT,
  TELEMETRY_EBT_PACK_CREATED_EVENT,
  TELEMETRY_EBT_PACK_UPDATED_EVENT,
  TELEMETRY_EBT_PACK_DELETED_EVENT,
  TELEMETRY_EBT_PACK_COPIED_EVENT,
} from '../constants';

export const packEvent: EventTypeOpts<Record<string, unknown>> = {
  eventType: TELEMETRY_EBT_PACK_EVENT,
  schema: {
    name: {
      type: 'keyword',
      _meta: { description: 'Name of the osquery pack' },
    },
    queries: {
      type: 'pass_through',
      _meta: { description: 'Pack queries configuration' },
    },
    policies: {
      type: 'short',
      _meta: { description: 'Number of agent policies assigned to the pack' },
    },
    prebuilt: {
      type: 'boolean',
      _meta: { description: 'Whether this is an Elastic prebuilt pack' },
    },
    enabled: {
      type: 'boolean',
      _meta: { description: 'Whether the pack is enabled' },
    },
    query_count: {
      type: 'short',
      _meta: {
        description: 'Number of queries in the pack',
        optional: true,
      },
    },
    has_shards: {
      type: 'boolean',
      _meta: {
        description: 'Whether the pack uses shard-based agent targeting',
        optional: true,
      },
    },
    queries_with_platform: {
      type: 'short',
      _meta: {
        description: 'Number of queries with platform filter set',
        optional: true,
      },
    },
    queries_with_ecs_mapping: {
      type: 'short',
      _meta: {
        description: 'Number of queries with ECS mappings defined',
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

export const packCreatedEvent: EventTypeOpts<Record<string, unknown>> = {
  eventType: TELEMETRY_EBT_PACK_CREATED_EVENT,
  schema: {
    pack_id: {
      type: 'keyword',
      _meta: { description: 'Saved object ID of the created pack' },
    },
    num_queries: {
      type: 'short',
      _meta: { description: 'Number of queries in the created pack' },
    },
    num_policies: {
      type: 'short',
      _meta: { description: 'Number of agent policies assigned' },
    },
    has_shards: {
      type: 'boolean',
      _meta: { description: 'Whether the pack uses shard-based agent targeting' },
    },
    is_enabled: {
      type: 'boolean',
      _meta: { description: 'Whether the pack was created in enabled state' },
    },
    space_id: {
      type: 'keyword',
      _meta: { description: 'Kibana space where the pack was created' },
    },
    ...resultSchema,
  },
};

export const packUpdatedEvent: EventTypeOpts<Record<string, unknown>> = {
  eventType: TELEMETRY_EBT_PACK_UPDATED_EVENT,
  schema: {
    pack_id: {
      type: 'keyword',
      _meta: { description: 'Saved object ID of the updated pack' },
    },
    num_queries: {
      type: 'short',
      _meta: { description: 'Number of queries after update' },
    },
    num_policies: {
      type: 'short',
      _meta: { description: 'Number of agent policies assigned after update' },
    },
    has_shards: {
      type: 'boolean',
      _meta: { description: 'Whether the pack uses shard-based agent targeting' },
    },
    is_enabled: {
      type: 'boolean',
      _meta: { description: 'Whether the pack is enabled after update' },
    },
    queries_added: {
      type: 'short',
      _meta: { description: 'Number of queries added in this update' },
    },
    queries_removed: {
      type: 'short',
      _meta: { description: 'Number of queries removed in this update' },
    },
    policies_changed: {
      type: 'boolean',
      _meta: { description: 'Whether agent policy assignments changed' },
    },
    ...resultSchema,
  },
};

export const packDeletedEvent: EventTypeOpts<Record<string, unknown>> = {
  eventType: TELEMETRY_EBT_PACK_DELETED_EVENT,
  schema: {
    pack_id: {
      type: 'keyword',
      _meta: { description: 'Saved object ID of the deleted pack' },
    },
    was_prebuilt: {
      type: 'boolean',
      _meta: { description: 'Whether the deleted pack was an Elastic prebuilt pack' },
    },
    ...resultSchema,
  },
};

export const packCopiedEvent: EventTypeOpts<Record<string, unknown>> = {
  eventType: TELEMETRY_EBT_PACK_COPIED_EVENT,
  schema: {
    source_pack_id: {
      type: 'keyword',
      _meta: { description: 'Saved object ID of the source pack' },
    },
    new_pack_id: {
      type: 'keyword',
      _meta: { description: 'Saved object ID of the new pack copy' },
    },
    was_prebuilt: {
      type: 'boolean',
      _meta: { description: 'Whether the source pack was an Elastic prebuilt pack' },
    },
    ...resultSchema,
  },
};

export const packEvents = [
  packEvent,
  packCreatedEvent,
  packUpdatedEvent,
  packDeletedEvent,
  packCopiedEvent,
];

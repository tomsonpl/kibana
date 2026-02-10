/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { EventTypeOpts } from '@kbn/core/server';
import {
  TELEMETRY_EBT_LIVE_QUERY_EVENT,
  TELEMETRY_EBT_LIVE_QUERY_COMPLETED_EVENT,
} from '../constants';

export const liveQueryEvent: EventTypeOpts<Record<string, unknown>> = {
  eventType: TELEMETRY_EBT_LIVE_QUERY_EVENT,
  schema: {
    action_id: {
      type: 'keyword',
      _meta: { description: 'Unique identifier for the live query action' },
    },
    '@timestamp': {
      type: 'date',
      _meta: { description: 'Timestamp when the live query was created' },
    },
    expiration: {
      type: 'date',
      _meta: { description: 'Expiration time of the live query action' },
    },
    agent_ids: {
      type: 'pass_through',
      _meta: { description: 'List of specific agent IDs targeted', optional: true },
    },
    agent_all: {
      type: 'boolean',
      _meta: { description: 'Whether all agents were selected', optional: true },
    },
    agent_platforms: {
      type: 'pass_through',
      _meta: { description: 'Agent platforms targeted', optional: true },
    },
    agent_policy_ids: {
      type: 'pass_through',
      _meta: { description: 'Agent policy IDs targeted', optional: true },
    },
    agents: {
      type: 'long',
      _meta: { description: 'Total number of agents that received the query' },
    },
    metadata: {
      type: 'pass_through',
      _meta: { description: 'Additional metadata attached to the action', optional: true },
    },
    queries: {
      type: 'pass_through',
      _meta: { description: 'Array of queries included in the live query action' },
    },
    alert_ids: {
      type: 'pass_through',
      _meta: { description: 'Associated alert IDs', optional: true },
    },
    event_ids: {
      type: 'pass_through',
      _meta: { description: 'Associated event IDs', optional: true },
    },
    case_ids: {
      type: 'pass_through',
      _meta: { description: 'Associated case IDs', optional: true },
    },
    pack_id: {
      type: 'keyword',
      _meta: { description: 'Pack ID if query was from a pack', optional: true },
    },
    pack_name: {
      type: 'keyword',
      _meta: { description: 'Pack name if query was from a pack', optional: true },
    },
    pack_prebuilt: {
      type: 'boolean',
      _meta: {
        description: 'Whether the pack is an Elastic prebuilt pack',
        optional: true,
      },
    },
    space_id: {
      type: 'keyword',
      _meta: { description: 'Kibana space where the query was executed', optional: true },
    },
    has_ecs_mapping: {
      type: 'boolean',
      _meta: {
        description: 'Whether the query includes ECS field mappings',
        optional: true,
      },
    },
    ecs_mapping_field_count: {
      type: 'short',
      _meta: {
        description: 'Number of ECS mapping fields defined',
        optional: true,
      },
    },
  },
};

export const liveQueryCompletedEvent: EventTypeOpts<Record<string, unknown>> = {
  eventType: TELEMETRY_EBT_LIVE_QUERY_COMPLETED_EVENT,
  schema: {
    action_id: {
      type: 'keyword',
      _meta: { description: 'Unique identifier for the completed live query action' },
    },
    agents_expected: {
      type: 'long',
      _meta: { description: 'Number of agents expected to respond' },
    },
    agents_responded: {
      type: 'long',
      _meta: { description: 'Number of agents that responded successfully' },
    },
    agents_failed: {
      type: 'long',
      _meta: { description: 'Number of agents that failed to respond' },
    },
    total_result_rows: {
      type: 'long',
      _meta: { description: 'Total number of result rows returned across all agents' },
    },
    was_timeout: {
      type: 'boolean',
      _meta: { description: 'Whether the action completed due to timeout expiry' },
    },
    query_count: {
      type: 'short',
      _meta: { description: 'Number of individual queries in the action' },
    },
    duration_seconds: {
      type: 'long',
      _meta: { description: 'Duration in seconds from creation to completion' },
    },
  },
};

export const liveQueryEvents = [liveQueryEvent, liveQueryCompletedEvent];

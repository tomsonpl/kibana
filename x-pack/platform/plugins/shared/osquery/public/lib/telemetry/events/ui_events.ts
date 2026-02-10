/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { EventTypeOpts } from '@kbn/core/public';
import {
  TELEMETRY_EBT_PAGE_VIEW_EVENT,
  TELEMETRY_EBT_LIVE_QUERY_FORM_SUBMITTED_EVENT,
  TELEMETRY_EBT_QUERY_SOURCE_SELECTED_EVENT,
  TELEMETRY_EBT_RESULTS_VIEWED_EVENT,
  TELEMETRY_EBT_RESULTS_EXPORTED_EVENT,
  TELEMETRY_EBT_CONFIG_UPLOADED_EVENT,
  TELEMETRY_EBT_FORM_VALIDATION_FAILED_EVENT,
} from '../../../../server/lib/telemetry/constants';

export const pageViewEvent: EventTypeOpts<Record<string, unknown>> = {
  eventType: TELEMETRY_EBT_PAGE_VIEW_EVENT,
  schema: {
    page: {
      type: 'keyword',
      _meta: { description: 'Page identifier for the viewed page' },
    },
    timestamp: {
      type: 'date',
      _meta: { description: 'Timestamp when the page was viewed' },
    },
  },
};

export const liveQueryFormSubmittedEvent: EventTypeOpts<Record<string, unknown>> = {
  eventType: TELEMETRY_EBT_LIVE_QUERY_FORM_SUBMITTED_EVENT,
  schema: {
    query_source: {
      type: 'keyword',
      _meta: { description: 'Source of the query: single, pack, or saved_query' },
    },
    agent_selection_type: {
      type: 'keyword',
      _meta: { description: 'How agents were selected: all, policy, agents' },
    },
    num_agents_selected: {
      type: 'long',
      _meta: { description: 'Number of agents selected for the query' },
    },
    num_queries: {
      type: 'short',
      _meta: { description: 'Number of queries submitted' },
    },
    has_ecs_mapping: {
      type: 'boolean',
      _meta: { description: 'Whether ECS mappings were configured' },
    },
  },
};

export const querySourceSelectedEvent: EventTypeOpts<Record<string, unknown>> = {
  eventType: TELEMETRY_EBT_QUERY_SOURCE_SELECTED_EVENT,
  schema: {
    source: {
      type: 'keyword',
      _meta: { description: 'Selected query source type: single, pack, or saved_query' },
    },
  },
};

export const resultsViewedEvent: EventTypeOpts<Record<string, unknown>> = {
  eventType: TELEMETRY_EBT_RESULTS_VIEWED_EVENT,
  schema: {
    action_id: {
      type: 'keyword',
      _meta: { description: 'Action ID of the live query whose results were viewed' },
    },
    query_count: {
      type: 'short',
      _meta: { description: 'Number of queries in the results' },
    },
  },
};

export const resultsExportedEvent: EventTypeOpts<Record<string, unknown>> = {
  eventType: TELEMETRY_EBT_RESULTS_EXPORTED_EVENT,
  schema: {
    action_id: {
      type: 'keyword',
      _meta: { description: 'Action ID of the live query whose results were exported' },
    },
    export_type: {
      type: 'keyword',
      _meta: { description: 'Export destination: discover or lens' },
    },
  },
};

export const configUploadedEvent: EventTypeOpts<Record<string, unknown>> = {
  eventType: TELEMETRY_EBT_CONFIG_UPLOADED_EVENT,
  schema: {
    file_size_bytes: {
      type: 'long',
      _meta: { description: 'Size of the uploaded configuration file in bytes' },
    },
    result: {
      type: 'keyword',
      _meta: { description: 'Upload result: success or failed' },
    },
  },
};

export const formValidationFailedEvent: EventTypeOpts<Record<string, unknown>> = {
  eventType: TELEMETRY_EBT_FORM_VALIDATION_FAILED_EVENT,
  schema: {
    form_type: {
      type: 'keyword',
      _meta: { description: 'Type of form that failed validation: saved_query, pack_query, live_query' },
    },
    error_fields: {
      type: 'pass_through',
      _meta: { description: 'List of fields that failed validation' },
    },
  },
};

export const uiEvents = [
  pageViewEvent,
  liveQueryFormSubmittedEvent,
  querySourceSelectedEvent,
  resultsViewedEvent,
  resultsExportedEvent,
  configUploadedEvent,
  formValidationFailedEvent,
];

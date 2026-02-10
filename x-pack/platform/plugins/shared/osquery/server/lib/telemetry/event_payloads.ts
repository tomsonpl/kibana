/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

/**
 * Error category union type for classifying telemetry errors.
 */
export type ErrorCategory =
  | 'validation_error'
  | 'permission_error'
  | 'not_found_error'
  | 'conflict_error'
  | 'internal_error'
  | 'unknown_error';

/**
 * Classifies an error into one of the defined error categories
 * based on HTTP status codes and error types.
 */
export const classifyError = (error: unknown): ErrorCategory => {
  if (error instanceof Error) {
    const statusCode = (error as { statusCode?: number }).statusCode;
    if (statusCode) {
      if (statusCode === 400) return 'validation_error';
      if (statusCode === 401 || statusCode === 403) return 'permission_error';
      if (statusCode === 404) return 'not_found_error';
      if (statusCode === 409) return 'conflict_error';
      if (statusCode >= 500) return 'internal_error';
    }
  }

  return 'unknown_error';
};

// --- Live Query Payloads ---

export interface LiveQueryCreatedPayload {
  action_id: string;
  '@timestamp': string;
  expiration: string;
  agent_ids?: unknown;
  agent_all?: boolean;
  agent_platforms?: unknown;
  agent_policy_ids?: unknown;
  agents: number;
  metadata?: unknown;
  queries: unknown;
  alert_ids?: unknown;
  event_ids?: unknown;
  case_ids?: unknown;
  pack_id?: string;
  pack_name?: string;
  pack_prebuilt?: boolean;
  space_id?: string;
  has_ecs_mapping?: boolean;
  ecs_mapping_field_count?: number;
}

export interface LiveQueryCompletedPayload {
  action_id: string;
  agents_expected: number;
  agents_responded: number;
  agents_failed: number;
  total_result_rows: number;
  was_timeout: boolean;
  query_count: number;
  duration_seconds: number;
}

// --- Pack Payloads ---

export interface PackCreatedPayload {
  pack_id: string;
  num_queries: number;
  num_policies: number;
  has_shards: boolean;
  is_enabled: boolean;
  space_id: string;
  result: 'success' | 'failed';
  error_message?: string;
}

export interface PackUpdatedPayload {
  pack_id: string;
  num_queries: number;
  num_policies: number;
  has_shards: boolean;
  is_enabled: boolean;
  queries_added: number;
  queries_removed: number;
  policies_changed: boolean;
  result: 'success' | 'failed';
  error_message?: string;
}

export interface PackDeletedPayload {
  pack_id: string;
  was_prebuilt: boolean;
  result: 'success' | 'failed';
  error_message?: string;
}

export interface PackCopiedPayload {
  source_pack_id: string;
  new_pack_id: string;
  was_prebuilt: boolean;
  result: 'success' | 'failed';
  error_message?: string;
}

// --- Saved Query Payloads ---

export interface SavedQueryCreatedPayload {
  saved_query_id: string;
  has_ecs_mapping: boolean;
  ecs_mapping_count: number;
  has_platform_filter: boolean;
  has_interval: boolean;
  snapshot_mode: boolean;
  result: 'success' | 'failed';
  error_message?: string;
}

export interface SavedQueryUpdatedPayload {
  saved_query_id: string;
  query_changed: boolean;
  has_ecs_mapping: boolean;
  ecs_mapping_count: number;
  result: 'success' | 'failed';
  error_message?: string;
}

export interface SavedQueryDeletedPayload {
  saved_query_id: string;
  result: 'success' | 'failed';
  error_message?: string;
}

export interface SavedQueryCopiedPayload {
  source_saved_query_id: string;
  new_saved_query_id: string;
  result: 'success' | 'failed';
  error_message?: string;
}

// --- Client-side UI Payloads ---

export interface PageViewPayload {
  page: string;
  timestamp: string;
}

export interface LiveQueryFormSubmittedPayload {
  query_source: string;
  agent_selection_type: string;
  num_agents_selected: number;
  num_queries: number;
  has_ecs_mapping: boolean;
}

export interface QuerySourceSelectedPayload {
  source: string;
}

export interface ResultsViewedPayload {
  action_id: string;
  query_count: number;
}

export interface ResultsExportedPayload {
  action_id: string;
  export_type: string;
}

export interface ConfigUploadedPayload {
  file_size_bytes: number;
  result: 'success' | 'failed';
}

export interface FormValidationFailedPayload {
  form_type: string;
  error_fields: string[];
}

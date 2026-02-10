/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

// Existing event types (scheduled tasks + live query creation)
export const TELEMETRY_EBT_LIVE_QUERY_EVENT = 'osquery_live_query';
export const TELEMETRY_EBT_PACK_EVENT = 'osquery_pack';
export const TELEMETRY_EBT_SAVED_QUERY_EVENT = 'osquery_saved_query';
export const TELEMETRY_EBT_CONFIG_EVENT = 'osquery_config';

// New server-side CRUD event types
export const TELEMETRY_EBT_LIVE_QUERY_COMPLETED_EVENT = 'osquery_live_query_completed';
export const TELEMETRY_EBT_PACK_CREATED_EVENT = 'osquery_pack_created';
export const TELEMETRY_EBT_PACK_UPDATED_EVENT = 'osquery_pack_updated';
export const TELEMETRY_EBT_PACK_DELETED_EVENT = 'osquery_pack_deleted';
export const TELEMETRY_EBT_PACK_COPIED_EVENT = 'osquery_pack_copied';
export const TELEMETRY_EBT_SAVED_QUERY_CREATED_EVENT = 'osquery_saved_query_created';
export const TELEMETRY_EBT_SAVED_QUERY_UPDATED_EVENT = 'osquery_saved_query_updated';
export const TELEMETRY_EBT_SAVED_QUERY_DELETED_EVENT = 'osquery_saved_query_deleted';
export const TELEMETRY_EBT_SAVED_QUERY_COPIED_EVENT = 'osquery_saved_query_copied';

// New client-side UI event types
export const TELEMETRY_EBT_PAGE_VIEW_EVENT = 'osquery_page_view';
export const TELEMETRY_EBT_LIVE_QUERY_FORM_SUBMITTED_EVENT = 'osquery_live_query_form_submitted';
export const TELEMETRY_EBT_QUERY_SOURCE_SELECTED_EVENT = 'osquery_query_source_selected';
export const TELEMETRY_EBT_RESULTS_VIEWED_EVENT = 'osquery_results_viewed';
export const TELEMETRY_EBT_RESULTS_EXPORTED_EVENT = 'osquery_results_exported';
export const TELEMETRY_EBT_CONFIG_UPLOADED_EVENT = 'osquery_config_uploaded';
export const TELEMETRY_EBT_FORM_VALIDATION_FAILED_EVENT = 'osquery_form_validation_failed';

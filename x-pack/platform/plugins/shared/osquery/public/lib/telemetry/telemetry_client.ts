/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { AnalyticsServiceSetup } from '@kbn/core/public';
import {
  TELEMETRY_EBT_PAGE_VIEW_EVENT,
  TELEMETRY_EBT_LIVE_QUERY_FORM_SUBMITTED_EVENT,
  TELEMETRY_EBT_QUERY_SOURCE_SELECTED_EVENT,
  TELEMETRY_EBT_RESULTS_VIEWED_EVENT,
  TELEMETRY_EBT_RESULTS_EXPORTED_EVENT,
  TELEMETRY_EBT_CONFIG_UPLOADED_EVENT,
  TELEMETRY_EBT_FORM_VALIDATION_FAILED_EVENT,
} from '../../../server/lib/telemetry/constants';
import type {
  PageViewPayload,
  LiveQueryFormSubmittedPayload,
  QuerySourceSelectedPayload,
  ResultsViewedPayload,
  ResultsExportedPayload,
  ConfigUploadedPayload,
  FormValidationFailedPayload,
} from '../../../server/lib/telemetry/event_payloads';

export class OsqueryClientTelemetryClient {
  private readonly analytics: AnalyticsServiceSetup | null;

  constructor(analytics: AnalyticsServiceSetup | null) {
    this.analytics = analytics;
  }

  /**
   * Creates a no-op client where all reporting methods do nothing.
   * Used as fallback when telemetry is unavailable.
   */
  public static createNoOpClient(): OsqueryClientTelemetryClient {
    return new OsqueryClientTelemetryClient(null);
  }

  public reportPageView(payload: PageViewPayload): void {
    this.analytics?.reportEvent(TELEMETRY_EBT_PAGE_VIEW_EVENT, payload);
  }

  public reportLiveQueryFormSubmitted(payload: LiveQueryFormSubmittedPayload): void {
    this.analytics?.reportEvent(TELEMETRY_EBT_LIVE_QUERY_FORM_SUBMITTED_EVENT, payload);
  }

  public reportQuerySourceSelected(payload: QuerySourceSelectedPayload): void {
    this.analytics?.reportEvent(TELEMETRY_EBT_QUERY_SOURCE_SELECTED_EVENT, payload);
  }

  public reportResultsViewed(payload: ResultsViewedPayload): void {
    this.analytics?.reportEvent(TELEMETRY_EBT_RESULTS_VIEWED_EVENT, payload);
  }

  public reportResultsExported(payload: ResultsExportedPayload): void {
    this.analytics?.reportEvent(TELEMETRY_EBT_RESULTS_EXPORTED_EVENT, payload);
  }

  public reportConfigUploaded(payload: ConfigUploadedPayload): void {
    this.analytics?.reportEvent(TELEMETRY_EBT_CONFIG_UPLOADED_EVENT, payload);
  }

  public reportFormValidationFailed(payload: FormValidationFailedPayload): void {
    this.analytics?.reportEvent(TELEMETRY_EBT_FORM_VALIDATION_FAILED_EVENT, payload);
  }
}

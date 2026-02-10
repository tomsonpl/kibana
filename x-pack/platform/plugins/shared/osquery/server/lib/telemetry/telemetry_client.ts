/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { AnalyticsServiceSetup, Logger } from '@kbn/core/server';
import {
  TELEMETRY_EBT_LIVE_QUERY_EVENT,
  TELEMETRY_EBT_LIVE_QUERY_COMPLETED_EVENT,
  TELEMETRY_EBT_PACK_CREATED_EVENT,
  TELEMETRY_EBT_PACK_UPDATED_EVENT,
  TELEMETRY_EBT_PACK_DELETED_EVENT,
  TELEMETRY_EBT_PACK_COPIED_EVENT,
  TELEMETRY_EBT_SAVED_QUERY_CREATED_EVENT,
  TELEMETRY_EBT_SAVED_QUERY_UPDATED_EVENT,
  TELEMETRY_EBT_SAVED_QUERY_DELETED_EVENT,
  TELEMETRY_EBT_SAVED_QUERY_COPIED_EVENT,
} from './constants';
import type {
  LiveQueryCreatedPayload,
  LiveQueryCompletedPayload,
  PackCreatedPayload,
  PackUpdatedPayload,
  PackDeletedPayload,
  PackCopiedPayload,
  SavedQueryCreatedPayload,
  SavedQueryUpdatedPayload,
  SavedQueryDeletedPayload,
  SavedQueryCopiedPayload,
} from './event_payloads';

export class OsqueryTelemetryClient {
  private readonly analytics: AnalyticsServiceSetup;
  private readonly logger: Logger;

  constructor(analytics: AnalyticsServiceSetup, logger: Logger) {
    this.analytics = analytics;
    this.logger = logger;
  }

  // --- Generic method for scheduled tasks ---

  public reportEvent(
    ...args: Parameters<AnalyticsServiceSetup['reportEvent']>
  ): ReturnType<AnalyticsServiceSetup['reportEvent']> {
    try {
      this.analytics.reportEvent(...args);
    } catch (e) {
      this.logger.debug(`Failed to report telemetry event: ${e.message}`);
    }
  }

  // --- Live Query Events ---

  public reportLiveQueryCreated(payload: LiveQueryCreatedPayload): void {
    try {
      this.analytics.reportEvent(TELEMETRY_EBT_LIVE_QUERY_EVENT, payload);
    } catch (e) {
      this.logger.debug(`Failed to report live query created event: ${e.message}`);
    }
  }

  public reportLiveQueryCompleted(payload: LiveQueryCompletedPayload): void {
    try {
      this.analytics.reportEvent(TELEMETRY_EBT_LIVE_QUERY_COMPLETED_EVENT, payload);
    } catch (e) {
      this.logger.debug(`Failed to report live query completed event: ${e.message}`);
    }
  }

  // --- Pack Events ---

  public reportPackCreated(payload: PackCreatedPayload): void {
    try {
      this.analytics.reportEvent(TELEMETRY_EBT_PACK_CREATED_EVENT, payload);
    } catch (e) {
      this.logger.debug(`Failed to report pack created event: ${e.message}`);
    }
  }

  public reportPackUpdated(payload: PackUpdatedPayload): void {
    try {
      this.analytics.reportEvent(TELEMETRY_EBT_PACK_UPDATED_EVENT, payload);
    } catch (e) {
      this.logger.debug(`Failed to report pack updated event: ${e.message}`);
    }
  }

  public reportPackDeleted(payload: PackDeletedPayload): void {
    try {
      this.analytics.reportEvent(TELEMETRY_EBT_PACK_DELETED_EVENT, payload);
    } catch (e) {
      this.logger.debug(`Failed to report pack deleted event: ${e.message}`);
    }
  }

  public reportPackCopied(payload: PackCopiedPayload): void {
    try {
      this.analytics.reportEvent(TELEMETRY_EBT_PACK_COPIED_EVENT, payload);
    } catch (e) {
      this.logger.debug(`Failed to report pack copied event: ${e.message}`);
    }
  }

  // --- Saved Query Events ---

  public reportSavedQueryCreated(payload: SavedQueryCreatedPayload): void {
    try {
      this.analytics.reportEvent(TELEMETRY_EBT_SAVED_QUERY_CREATED_EVENT, payload);
    } catch (e) {
      this.logger.debug(`Failed to report saved query created event: ${e.message}`);
    }
  }

  public reportSavedQueryUpdated(payload: SavedQueryUpdatedPayload): void {
    try {
      this.analytics.reportEvent(TELEMETRY_EBT_SAVED_QUERY_UPDATED_EVENT, payload);
    } catch (e) {
      this.logger.debug(`Failed to report saved query updated event: ${e.message}`);
    }
  }

  public reportSavedQueryDeleted(payload: SavedQueryDeletedPayload): void {
    try {
      this.analytics.reportEvent(TELEMETRY_EBT_SAVED_QUERY_DELETED_EVENT, payload);
    } catch (e) {
      this.logger.debug(`Failed to report saved query deleted event: ${e.message}`);
    }
  }

  public reportSavedQueryCopied(payload: SavedQueryCopiedPayload): void {
    try {
      this.analytics.reportEvent(TELEMETRY_EBT_SAVED_QUERY_COPIED_EVENT, payload);
    } catch (e) {
      this.logger.debug(`Failed to report saved query copied event: ${e.message}`);
    }
  }
}

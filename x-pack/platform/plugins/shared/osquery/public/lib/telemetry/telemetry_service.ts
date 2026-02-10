/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { AnalyticsServiceSetup } from '@kbn/core/public';
import { OsqueryClientTelemetryClient } from './telemetry_client';
import { osqueryClientTelemetryEvents } from './events';

export class OsqueryClientTelemetryService {
  private analytics?: AnalyticsServiceSetup;
  private isSetup = false;

  public setup(analytics: AnalyticsServiceSetup) {
    this.analytics = analytics;
    this.isSetup = true;

    // Register all client-side event types
    for (const eventOpts of osqueryClientTelemetryEvents) {
      analytics.registerEventType(eventOpts);
    }
  }

  public start(): OsqueryClientTelemetryClient {
    if (!this.isSetup || !this.analytics) {
      // Return a no-op client if setup was not called
      return OsqueryClientTelemetryClient.createNoOpClient();
    }

    return new OsqueryClientTelemetryClient(this.analytics);
  }
}

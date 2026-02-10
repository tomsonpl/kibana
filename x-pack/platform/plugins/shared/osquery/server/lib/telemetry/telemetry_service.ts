/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { AnalyticsServiceSetup, Logger } from '@kbn/core/server';
import type {
  TaskManagerSetupContract,
  TaskManagerStartContract,
} from '@kbn/task-manager-plugin/server';
import type { TelemetryReceiver } from './receiver';
import { OsqueryTelemetryClient } from './telemetry_client';
import { osqueryServerTelemetryEvents } from './events';
import { createTelemetryTaskConfigs } from './tasks';
import type { OsqueryTelemetryTaskConfig } from './task';
import { OsqueryTelemetryTask } from './task';
import { CompletionTracker } from './completion_tracker';

export class OsqueryTelemetryService {
  private readonly logger: Logger;
  private analytics?: AnalyticsServiceSetup;
  private telemetryTasks?: OsqueryTelemetryTask[];
  private client?: OsqueryTelemetryClient;
  private completionTracker?: CompletionTracker;
  private isSetup = false;

  constructor(logger: Logger) {
    this.logger = logger.get('telemetry_events');
  }

  public setup(
    telemetryReceiver: TelemetryReceiver,
    taskManager?: TaskManagerSetupContract,
    analytics?: AnalyticsServiceSetup
  ) {
    if (analytics) {
      this.analytics = analytics;
      this.isSetup = true;

      // Register all event types from domain modules
      for (const eventOpts of osqueryServerTelemetryEvents) {
        analytics.registerEventType(eventOpts);
      }

      this.completionTracker = new CompletionTracker();

      // Create a temporary client for scheduled tasks (uses reportEvent directly)
      this.client = new OsqueryTelemetryClient(analytics, this.logger);

      if (taskManager) {
        this.telemetryTasks = createTelemetryTaskConfigs().map(
          (config: OsqueryTelemetryTaskConfig) => {
            const task = new OsqueryTelemetryTask(config, this.logger, this.client!, telemetryReceiver);
            task.register(taskManager);

            return task;
          }
        );
      }
    }
  }

  public start(taskManager?: TaskManagerStartContract, receiver?: TelemetryReceiver) {
    if (!this.isSetup) {
      throw new Error('OsqueryTelemetryService.setup() must be called before start()');
    }

    if (taskManager && this.telemetryTasks) {
      this.logger.debug('Starting osquery telemetry tasks');
      this.telemetryTasks.forEach((task) => task.start(taskManager));
    }

    return this.client!;
  }

  public getCompletionTracker(): CompletionTracker | undefined {
    return this.completionTracker;
  }

  public stop() {
    this.completionTracker?.cleanup();
  }
}

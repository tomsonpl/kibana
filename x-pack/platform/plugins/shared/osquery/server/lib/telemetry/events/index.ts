/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { liveQueryEvents } from './live_query_events';
import { packEvents } from './pack_events';
import { savedQueryEvents } from './saved_query_events';
import { configEvents } from './config_events';

/**
 * All server-side telemetry event definitions for the osquery plugin.
 * Used by OsqueryTelemetryService to register all event types at setup time.
 */
export const osqueryServerTelemetryEvents = [
  ...liveQueryEvents,
  ...packEvents,
  ...savedQueryEvents,
  ...configEvents,
];

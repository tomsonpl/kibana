/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { uiEvents } from './ui_events';

/**
 * All client-side telemetry event definitions for the osquery plugin.
 * Used by OsqueryClientTelemetryService to register all event types at setup time.
 */
export const osqueryClientTelemetryEvents = [...uiEvents];

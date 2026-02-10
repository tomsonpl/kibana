/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { useMemo } from 'react';
import { useKibana } from '../../../common/lib/kibana';
import { OsqueryClientTelemetryClient } from '../telemetry_client';

/**
 * React hook that returns the OsqueryClientTelemetryClient from the Kibana services context.
 * Falls back to a no-op client if the telemetry client is not available.
 */
export const useOsqueryTelemetry = (): OsqueryClientTelemetryClient => {
  const services = useKibana().services as Record<string, unknown>;
  const telemetryClient = services.osqueryTelemetry as OsqueryClientTelemetryClient | undefined;

  return useMemo(
    () => telemetryClient ?? OsqueryClientTelemetryClient.createNoOpClient(),
    [telemetryClient]
  );
};

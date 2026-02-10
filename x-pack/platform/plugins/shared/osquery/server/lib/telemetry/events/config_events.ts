/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { EventTypeOpts } from '@kbn/core/server';
import { TELEMETRY_EBT_CONFIG_EVENT } from '../constants';

export const configEvent: EventTypeOpts<Record<string, unknown>> = {
  eventType: TELEMETRY_EBT_CONFIG_EVENT,
  schema: {
    id: {
      type: 'keyword',
      _meta: { description: 'Package policy ID for the osquery integration config' },
    },
    version: {
      type: 'keyword',
      _meta: { description: 'Osquery manager integration version' },
    },
    enabled: {
      type: 'boolean',
      _meta: { description: 'Whether the osquery integration is enabled' },
    },
    config: {
      type: 'pass_through',
      _meta: { description: 'Osquery package policy configuration object' },
    },
    num_packs: {
      type: 'short',
      _meta: {
        description: 'Number of packs configured in this integration policy',
        optional: true,
      },
    },
    has_custom_config: {
      type: 'boolean',
      _meta: {
        description: 'Whether a custom osquery.conf has been uploaded',
        optional: true,
      },
    },
  },
};

export const configEvents = [configEvent];

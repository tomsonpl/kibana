/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { TypeOf } from '@kbn/config-schema';
import {
  CrowdstrikeBaseApiResponseSchema,
  CrowdstrikeConfigSchema,
  CrowdstrikeGetAgentsParamsSchema,
  CrowdstrikeGetAgentsResponseSchema,
  CrowdstrikeIsolateHostParamsSchema,
  CrowdstrikeSecretsSchema,
  CrowdstrikeActionParamsSchema,
} from './schema';

export type CrowdstrikeConfig = TypeOf<typeof CrowdstrikeConfigSchema>;
export type CrowdstrikeSecrets = TypeOf<typeof CrowdstrikeSecretsSchema>;

export type CrowdstrikeBaseApiResponse = TypeOf<typeof CrowdstrikeBaseApiResponseSchema>;

export type CrowdstrikeGetAgentsParams = Partial<TypeOf<typeof CrowdstrikeGetAgentsParamsSchema>>;
export type CrowdstrikeGetAgentsResponse = TypeOf<typeof CrowdstrikeGetAgentsResponseSchema>;

export type CrowdstrikeIsolateHostParams = TypeOf<typeof CrowdstrikeIsolateHostParamsSchema>;

export type CrowdstrikeActionParams = TypeOf<typeof CrowdstrikeActionParamsSchema>;

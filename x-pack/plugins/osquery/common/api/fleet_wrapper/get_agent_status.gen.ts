/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

/*
 * NOTICE: Do not edit this file manually.
 * This file is automatically generated by the OpenAPI Generator, @kbn/openapi-generator.
 *
 * info:
 *   title: Get agent status schema
 *   version: 1
 */

import { z } from 'zod';

import { KueryOrUndefined, Id } from '../model/schema/common_attributes.gen';

export type GetAgentStatusRequestParams = z.infer<typeof GetAgentStatusRequestParams>;
export const GetAgentStatusRequestParams = z.object({});

export type GetAgentStatusRequestQueryParams = z.infer<typeof GetAgentStatusRequestQueryParams>;
export const GetAgentStatusRequestQueryParams = z.object({
  kuery: KueryOrUndefined.optional(),
  policyId: Id.optional(),
});

export type SuccessResponse = z.infer<typeof SuccessResponse>;
export const SuccessResponse = z.object({});

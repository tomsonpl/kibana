/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { z } from 'zod';

/*
 * NOTICE: Do not edit this file manually.
 * This file is automatically generated by the OpenAPI Generator `yarn openapi:generate`.
 */

import { BaseActionSchema } from '../model/schema/common.yaml';

export type GetFileActionRequestBody = z.infer<typeof GetFileActionRequestBody>;
export const GetFileActionRequestBody = BaseActionSchema.and(
  z.object({
    parameters: z.object({
      path: z.string(),
    }),
  })
);

export type SuccessResponse = z.infer<typeof SuccessResponse>;
export const SuccessResponse = z.object({});

export type EndpointGetFileActionRequestBody = z.infer<typeof EndpointGetFileActionRequestBody>;
export const EndpointGetFileActionRequestBody = GetFileActionRequestBody;
export type EndpointGetFileActionRequestBodyInput = z.input<
  typeof EndpointGetFileActionRequestBody
>;

export type EndpointGetFileActionResponse = z.infer<typeof EndpointGetFileActionResponse>;
export const EndpointGetFileActionResponse = SuccessResponse;

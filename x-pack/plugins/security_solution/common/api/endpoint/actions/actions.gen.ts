/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { z } from 'zod';

/*
 * NOTICE: Do not edit this file manually.
 * This file is automatically generated by the OpenAPI Generator `yarn openapi:generate`.
 */

import {
  SuccessResponse,
  BaseActionSchema,
  ProcessActionSchemas,
} from '../model/schema/common.yaml';

export type EndpointGetActionsStateResponse = z.infer<typeof EndpointGetActionsStateResponse>;
export const EndpointGetActionsStateResponse = SuccessResponse;

export type EndpointGetRunningProcessesActionRequestBody = z.infer<
  typeof EndpointGetRunningProcessesActionRequestBody
>;
export const EndpointGetRunningProcessesActionRequestBody = BaseActionSchema;
export type EndpointGetRunningProcessesActionRequestBodyInput = z.input<
  typeof EndpointGetRunningProcessesActionRequestBody
>;

export type EndpointGetRunningProcessesActionResponse = z.infer<
  typeof EndpointGetRunningProcessesActionResponse
>;
export const EndpointGetRunningProcessesActionResponse = SuccessResponse;

export type EndpointIsolateHostActionRequestBody = z.infer<
  typeof EndpointIsolateHostActionRequestBody
>;
export const EndpointIsolateHostActionRequestBody = BaseActionSchema;
export type EndpointIsolateHostActionRequestBodyInput = z.input<
  typeof EndpointIsolateHostActionRequestBody
>;

export type EndpointIsolateHostActionResponse = z.infer<typeof EndpointIsolateHostActionResponse>;
export const EndpointIsolateHostActionResponse = SuccessResponse;

export type EndpointKillProcessActionRequestBody = z.infer<
  typeof EndpointKillProcessActionRequestBody
>;
export const EndpointKillProcessActionRequestBody = ProcessActionSchemas;
export type EndpointKillProcessActionRequestBodyInput = z.input<
  typeof EndpointKillProcessActionRequestBody
>;

export type EndpointKillProcessActionResponse = z.infer<typeof EndpointKillProcessActionResponse>;
export const EndpointKillProcessActionResponse = SuccessResponse;

export type EndpointSuspendProcessActionRequestBody = z.infer<
  typeof EndpointSuspendProcessActionRequestBody
>;
export const EndpointSuspendProcessActionRequestBody = ProcessActionSchemas;
export type EndpointSuspendProcessActionRequestBodyInput = z.input<
  typeof EndpointSuspendProcessActionRequestBody
>;

export type EndpointSuspendProcessActionResponse = z.infer<
  typeof EndpointSuspendProcessActionResponse
>;
export const EndpointSuspendProcessActionResponse = SuccessResponse;

export type EndpointUnisolateHostActionRequestBody = z.infer<
  typeof EndpointUnisolateHostActionRequestBody
>;
export const EndpointUnisolateHostActionRequestBody = BaseActionSchema;
export type EndpointUnisolateHostActionRequestBodyInput = z.input<
  typeof EndpointUnisolateHostActionRequestBody
>;

export type EndpointUnisolateHostActionResponse = z.infer<
  typeof EndpointUnisolateHostActionResponse
>;
export const EndpointUnisolateHostActionResponse = SuccessResponse;

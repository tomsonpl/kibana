/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { z } from 'zod';

/*
 * NOTICE: Do not edit this file manually.
 * This file is automatically generated by the OpenAPI Generator, @kbn/openapi-generator.
 */

import {
  KueryOrUndefined,
  PageOrUndefined,
  PageSizeOrUndefined,
  SortOrUndefined,
  SortOrderOrUndefined,
} from '../model/schema/common_attributes.gen';

export type FindLiveQueryRequestQuery = z.infer<typeof FindLiveQueryRequestQuery>;
export const FindLiveQueryRequestQuery = z.object({
  kuery: KueryOrUndefined.optional(),
  page: PageOrUndefined.optional(),
  pageSize: PageSizeOrUndefined.optional(),
  sort: SortOrUndefined.optional(),
  sortOrder: SortOrderOrUndefined.optional(),
});

export type SuccessResponse = z.infer<typeof SuccessResponse>;
export const SuccessResponse = z.object({});

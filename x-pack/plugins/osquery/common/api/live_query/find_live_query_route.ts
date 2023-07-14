/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import * as t from 'io-ts';

export const findLiveQueryRequestQuerySchema = t.type({
  filterQuery: t.union([t.string, t.undefined]),
  page: t.union([t.number, t.undefined]),
  pageSize: t.union([t.number, t.undefined]),
  sort: t.union([t.string, t.undefined]),
  sortOrder: t.union([t.union([t.literal('asc'), t.literal('desc')]), t.undefined]),
});

export type FindLiveQueryRequestQuerySchema = t.OutputOf<typeof findLiveQueryRequestQuerySchema>;

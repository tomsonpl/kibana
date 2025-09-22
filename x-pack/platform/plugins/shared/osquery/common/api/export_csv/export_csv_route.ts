/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import * as t from 'io-ts';
import { toNumberRt } from '@kbn/io-ts-utils';
import { Direction } from '../../search_strategy';

export const exportCsvRequestQuerySchema = t.type({
  /** KQL query string for filtering results */
  kuery: t.union([t.string, t.undefined]),
  /** Starting date for filtering results */
  startDate: t.union([t.string, t.undefined]),
  /** Field to sort by */
  sort: t.union([t.string, t.undefined]),
  /** Sort direction */
  sortOrder: t.union([t.literal(Direction.asc), t.literal(Direction.desc), t.undefined]),
  /** Array format for CSV output */
  arrayFormat: t.union([t.literal('json'), t.literal('pipe-separated'), t.undefined]),
  /** Object format for CSV output */
  objectFormat: t.union([t.literal('json'), t.literal('key-value'), t.undefined]),
  /** Maximum depth for nested objects */
  maxDepth: t.union([toNumberRt, t.undefined]),
  /** Whether to flatten nested objects using dot notation */
  flattenObjects: t.union([t.boolean, t.undefined]),
  /** Include row numbers in the CSV */
  includeRowNumbers: t.union([t.boolean, t.undefined]),
  /** Custom filename prefix */
  filenamePrefix: t.union([t.string, t.undefined]),
  /** Columns to include in export (comma-separated string) */
  columns: t.union([t.string, t.undefined]),
});

export type ExportCsvRequestQuerySchema = t.OutputOf<typeof exportCsvRequestQuerySchema>;

export const exportCsvRequestParamsSchema = t.type({
  /** Live query ID */
  liveQueryActionId: t.string,
  /** Action ID for the specific query execution */
  actionId: t.string,
});

export type ExportCsvRequestParamsSchema = t.OutputOf<typeof exportCsvRequestParamsSchema>;
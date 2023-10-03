/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */
import type { DatatableColumn } from '@kbn/expressions-plugin/common';
import type { AggregateQuery } from '@kbn/es-query';
import type { DataViewField, DataViewSpec, DataView } from '@kbn/data-views-plugin/public';
import { ActionInternal } from './actions/action_internal';
import { TriggerInternal } from './triggers/trigger_internal';

export type TriggerRegistry = Map<string, TriggerInternal<object>>;
export type ActionRegistry = Map<string, ActionInternal>;
export type TriggerToActionsRegistry = Map<string, string[]>;

export interface VisualizeFieldContext {
  fieldName: string;
  dataViewSpec: DataViewSpec;
  contextualFields?: string[];
  textBasedColumns?: DatatableColumn[];
  originatingApp?: string;
  query?: AggregateQuery;
}

export interface CategorizeFieldContext {
  field: DataViewField;
  dataView: DataView;
  originatingApp: string;
}

export const ACTION_VISUALIZE_FIELD = 'ACTION_VISUALIZE_FIELD';
export const ACTION_VISUALIZE_GEO_FIELD = 'ACTION_VISUALIZE_GEO_FIELD';
export const ACTION_VISUALIZE_LENS_FIELD = 'ACTION_VISUALIZE_LENS_FIELD';
export const ACTION_CATEGORIZE_FIELD = 'ACTION_CATEGORIZE_FIELD';

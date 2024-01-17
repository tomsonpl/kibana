/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type {
  DefaultParams,
  ExecuteParams,
  ProcessesParams,
  RuleResponseEndpointAction,
} from '../../../../common/api/detection_engine';

export const isExecuteAction = (
  params: RuleResponseEndpointAction['params']
): params is ExecuteParams => {
  return params.command === 'execute';
};

export const isGetFileAction = (
  params: RuleResponseEndpointAction['params']
): params is DefaultParams => {
  return params.command === 'get-file';
};
export const isIsolateAction = (
  params: RuleResponseEndpointAction['params']
): params is DefaultParams => {
  return params.command === 'isolate';
};

export const isProcessesAction = (
  params: RuleResponseEndpointAction['params']
): params is ProcessesParams => {
  return params.command === 'kill-process' || params.command === 'suspend-process';
};

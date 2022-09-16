/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { map, uniq } from 'lodash';
import type { SetupPlugins } from '../../../plugin_contract';

interface OsqueryQuery {
  id: string;
  query: string;
  ecs_mapping: Record<string, Record<'field', string>>;
  version: string;
  platform: string;
}

interface OsqueryResponseAction {
  actionTypeId: string;
  params: {
    id: string;
    queries: OsqueryQuery[];
    savedQueryId: string;
    query: string;
    packId: string;
    ecs_mapping?: Record<string, { field?: string; value?: string }>;
  };
}

export interface ResponseAction {
  actionTypeId: string;
  params: { [p: string]: unknown };
}

interface ScheduleNotificationActions {
  signals: unknown[];
  responseActions: ResponseAction[];
}

interface IAlert {
  agent: {
    id: string;
  };
}

export const scheduleNotificationResponseActions = (
  { signals, responseActions }: ScheduleNotificationActions,
  osqueryCreateAction?: SetupPlugins['osquery']['osqueryCreateAction']
) => {
  const filteredAlerts = (signals as IAlert[]).filter((alert) => alert.agent?.id);
  const agentIds = uniq(filteredAlerts.map((alert: IAlert) => alert.agent?.id));
  const alertIds = map(filteredAlerts, '_id');

  responseActions.forEach((responseActionParam) => {
    if (responseActionParam.actionTypeId === '.osquery' && osqueryCreateAction) {
      const {
        savedQueryId,
        packId,
        queries,
        ecs_mapping: ecsMapping,
        ...rest
      } = (responseActionParam as OsqueryResponseAction).params;

      return osqueryCreateAction({
        ...rest,
        queries,
        ecs_mapping: ecsMapping,
        saved_query_id: savedQueryId,
        agent_ids: agentIds,
        alert_ids: alertIds,
      });
    }
  });
};

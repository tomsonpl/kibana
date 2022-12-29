/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { AlertEcsData } from '../../common/contexts';

export interface OsqueryActionResultsProps {
  agentIds?: string[];
  ruleName?: string[];
  alertId?: string;
  ecsData: AlertEcsData | null;
  actionId?: string;
}

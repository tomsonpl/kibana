/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type React from 'react';

export interface OsqueryActionResultsProps {
  agentIds?: string[];
  ruleName?: string[];
  alertId: string;
  eventDetailId: string;
  addToTimeline?: (payload: { query: [string, string]; isIcon?: true }) => React.ReactElement;
}

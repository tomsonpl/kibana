/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type * as estypes from '@elastic/elasticsearch/lib/api/typesWithBodyKey';
import type { AlertEcsData } from '../../common/contexts';

export interface OsqueryActionResultsProps {
  agentIds?: string[];
  ruleName?: string[];
  ecsData: AlertEcsData;
  actionItems?: estypes.SearchResponse<object>['hits']['hits'];
}

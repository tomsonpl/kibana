/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { EuiBadge } from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import type { UnifiedHistorySource } from '../../../common/api/unified_history/types';

const LIVE_LABEL = i18n.translate('xpack.osquery.liveQueryActions.table.sourceColumn.live', {
  defaultMessage: 'Live',
});

const RULE_LABEL = i18n.translate('xpack.osquery.liveQueryActions.table.sourceColumn.rule', {
  defaultMessage: 'Rule',
});

const SCHEDULED_LABEL = i18n.translate(
  'xpack.osquery.liveQueryActions.table.sourceColumn.scheduled',
  { defaultMessage: 'Scheduled' }
);

const SOURCE_BADGE_CONFIG: Record<UnifiedHistorySource, { label: string; color: string }> = {
  Live: { label: LIVE_LABEL, color: 'primary' },
  Rule: { label: RULE_LABEL, color: 'warning' },
  Scheduled: { label: SCHEDULED_LABEL, color: 'accent' },
};

interface SourceBadgeProps {
  source: UnifiedHistorySource;
}

const SourceBadgeComponent: React.FC<SourceBadgeProps> = ({ source }) => {
  const { label, color } = SOURCE_BADGE_CONFIG[source];

  return <EuiBadge color={color}>{label}</EuiBadge>;
};

SourceBadgeComponent.displayName = 'SourceBadge';

export const SourceBadge = React.memo(SourceBadgeComponent);

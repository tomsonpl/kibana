/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { EuiContextMenuItem } from '@elastic/eui';
import { i18n } from '@kbn/i18n';

export const ACTION_OSQUERY = i18n.translate('xpack.osquery.alerts.osqueryAlertTitle', {
  defaultMessage: 'Run Osquery',
});

interface IProps {
  onClick: () => void;
}
export const OsqueryActionItem = ({ onClick }: IProps) => {
  return (
    <EuiContextMenuItem
      key="osquery-action-item"
      data-test-subj="osquery-action-item"
      onClick={onClick}
    >
      {ACTION_OSQUERY}
    </EuiContextMenuItem>
  );
};

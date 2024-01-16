/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import React from 'react';
import { UseField } from '@kbn/es-ui-shared-plugin/static/forms/hook_form_lib';
import { i18n } from '@kbn/i18n';
import { FormattedMessage } from '@kbn/i18n-react';
import { NumericField } from '@kbn/es-ui-shared-plugin/static/forms/components';
import { fieldFormatters } from '@kbn/es-ui-shared-plugin/static/forms/helpers';

interface ActionTypeFieldProps {
  path: string;
  disabled: boolean;
  readDefaultValueOnForm: boolean;
}

const CONFIG = {
  label: i18n.translate('xpack.securitySolution.responseActions.endpoint.config.script', {
    defaultMessage: 'Timeout',
  }),
  helpText: (
    <FormattedMessage
      id="xpack.securitySolution.responseActions.endpoint.config.scriptDescription"
      defaultMessage="TODO: SPECIFY TIMEOUT  DESCRIPTION "
    />
  ),
  formatters: [fieldFormatters.toInt],
};

// TODO: TC - change field to be number field
const TimeoutFieldComponent = ({
  path,
  disabled,
  readDefaultValueOnForm,
}: ActionTypeFieldProps) => (
  <UseField
    path={path}
    readDefaultValueOnForm={readDefaultValueOnForm}
    config={CONFIG}
    isDisabled={disabled}
    component={NumericField}
    required={true}
  />
);

export const TimeoutField = React.memo(TimeoutFieldComponent);

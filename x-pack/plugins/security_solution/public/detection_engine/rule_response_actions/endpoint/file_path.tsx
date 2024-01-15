/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import React from 'react';
import { UseField } from '@kbn/es-ui-shared-plugin/static/forms/hook_form_lib';
import { TextField } from '@kbn/es-ui-shared-plugin/static/forms/components';
import { i18n } from '@kbn/i18n';
import { FormattedMessage } from '@kbn/i18n-react';

interface ActionTypeFieldProps {
  path: string;
  disabled: boolean;
  readDefaultValueOnForm: boolean;
}

const CONFIG = {
  label: i18n.translate('xpack.securitySolution.responseActions.endpoint.config.filePath', {
    defaultMessage: 'File Path',
  }),
  helpText: (
    <FormattedMessage
      id="xpack.securitySolution.responseActions.endpoint.commentDescription"
      defaultMessage="TODO: SPECIFY FILE PATH DESCRIPTION "
    />
  ),
};

const FilePathFieldComponent = ({
  path,
  disabled,
  readDefaultValueOnForm,
}: ActionTypeFieldProps) => (
  <UseField
    path={path}
    readDefaultValueOnForm={readDefaultValueOnForm}
    config={CONFIG}
    isDisabled={disabled}
    component={TextField}
    required={true}
  />
);

export const FilePathField = React.memo(FilePathFieldComponent);

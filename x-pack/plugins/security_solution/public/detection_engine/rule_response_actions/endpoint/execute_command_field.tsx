/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import React, { useEffect, useState, useCallback } from 'react';

import { UseField } from '@kbn/es-ui-shared-plugin/static/forms/hook_form_lib';
import { TextAreaField } from '@kbn/es-ui-shared-plugin/static/forms/components';
import { i18n } from '@kbn/i18n';
import { FormattedMessage } from '@kbn/i18n-react';
import { CodeEditor } from '@kbn/code-editor';

import useDebounce from 'react-use/lib/useDebounce';

interface ActionTypeFieldProps {
  path: string;
  disabled: boolean;
  readDefaultValueOnForm: boolean;
}
const editorOptions = {
  theme: 'osquery',
  automaticLayout: true,
};
const CONFIG = {
  label: i18n.translate('xpack.securitySolution.responseActions.endpoint.config.command', {
    defaultMessage: 'Command',
  }),
  helpText: (
    <FormattedMessage
      id="xpack.securitySolution.responseActions.endpoint.config.commandDescription"
      defaultMessage="A shell command to run on the host. The command must be supported by bash for Linux and macOS hosts, and cmd.exe for Windows."
    />
  ),
};
const MIN_HEIGHT = 100;
const ExecuteCommandFieldComponent = ({
  path,
  disabled,
  readDefaultValueOnForm,
}: ActionTypeFieldProps) => {
  const [editorValue, setEditorValue] = useState('');
  const [height, setHeight] = useState(MIN_HEIGHT);
  useDebounce(
    () => {
      // TODO update form's field value
      // onChange(editorValue);
    },
    500,
    [editorValue]
  );

  const editorDidMount = useCallback((editor: monaco.editor.IStandaloneCodeEditor) => {
    const minHeight = 100;
    const maxHeight = 1000;

    const updateHeight = () => {
      const contentHeight = Math.min(maxHeight, Math.max(minHeight, editor.getContentHeight()));
      setHeight(contentHeight);
    };

    editor.onDidContentSizeChange(updateHeight);
  }, []);

  useEffect(() => setEditorValue('defaultValue'), []);
  return (
    <>
      <UseField
        path={path}
        readDefaultValueOnForm={readDefaultValueOnForm}
        config={CONFIG}
        isDisabled={disabled}
        component={TextAreaField}
        required={true}
      />

      <CodeEditor
        languageId={'shell'}
        value={editorValue}
        onChange={setEditorValue}
        options={editorOptions}
        height={height + 'px'}
        width="100%"
        editorDidMount={editorDidMount}
      />
    </>
  );
};

export const ExecuteCommandField = React.memo(ExecuteCommandFieldComponent);

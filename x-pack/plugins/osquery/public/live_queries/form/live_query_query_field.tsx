/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { EuiCodeBlock, EuiFormRow } from '@elastic/eui';
import React, { useCallback } from 'react';
import styled from 'styled-components';

import { EuiCodeEditorProps, FieldHook } from '../../shared_imports';
import { OsqueryEditor } from '../../editor';
import { useKibana } from '../../common/lib/kibana';

const StyledEuiCodeBlock = styled(EuiCodeBlock)`
  min-height: 100px;
`;

interface LiveQueryQueryFieldProps {
  disabled?: boolean;
  field: FieldHook<string>;
  commands?: EuiCodeEditorProps['commands'];
  onChange?: (value: string) => void;
  onChange?: (value: string) => void;
}

const LiveQueryQueryFieldComponent: React.FC<LiveQueryQueryFieldProps> = ({
  disabled,
  field,
  commands,
  onChange,
}) => {
  const permissions = useKibana().services.application.capabilities.osquery;
  const { value, setValue, errors } = field;
  const error = errors[0]?.message;

  const handleEditorChange = useCallback(
    (newValue) => {
      if (onChange) {
        onChange(newValue);
      }

      setValue(newValue);
    },
    [onChange, setValue]
  );

  return (
    <EuiFormRow
      isInvalid={typeof error === 'string'}
      error={error}
      fullWidth
      isDisabled={!permissions.writeLiveQueries || disabled}
    >
      {!permissions.writeLiveQueries || disabled ? (
        <StyledEuiCodeBlock
          language="sql"
          fontSize="m"
          paddingSize="m"
          transparentBackground={!value.length}
        >
          {value}
        </StyledEuiCodeBlock>
      ) : (
        <OsqueryEditor defaultValue={value} onChange={handleEditorChange} commands={commands} />
      )}
    </EuiFormRow>
  );
};

export const LiveQueryQueryField = React.memo(LiveQueryQueryFieldComponent);

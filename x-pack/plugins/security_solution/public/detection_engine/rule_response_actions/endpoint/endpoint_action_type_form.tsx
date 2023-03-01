/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useEffect } from 'react';
import type { FieldErrors } from 'react-hook-form';
import { useForm as useHookForm, FormProvider } from 'react-hook-form';
import { CommentField } from './comment_field';
import { ActionTypeField } from './action_type_field';

export interface EndpointResponseActionsValues {
  command?: string;
  comment?: string;
}

interface OsqueryResponseActionsParamsFormFields {
  command?: string;
  comment?: string;
}

export interface OsqueryResponseActionsParamsFormProps {
  defaultValues: EndpointResponseActionsValues;
  onChange: (data: EndpointResponseActionsValues) => void;
  onError: (error: FieldErrors<OsqueryResponseActionsParamsFormFields>) => void;
  editDisabled: boolean;
}

const EndpointResponseActionParamsFormComponent = ({
  defaultValues,
  onError,
  onChange,
  editDisabled,
}: OsqueryResponseActionsParamsFormProps) => {
  const hooksForm = useHookForm<OsqueryResponseActionsParamsFormFields>({
    mode: 'all',
    defaultValues: defaultValues ?? {
      command: '',
      comment: '',
    },
  });

  const { watch, formState } = hooksForm;

  useEffect(() => {
    onError(formState.errors);
  }, [onError, formState]);

  useEffect(() => {
    const subscription = watch((formData) => {
      onChange({
        command: formData.command,
        comment: formData.comment,
      });
    });

    return () => subscription.unsubscribe();
  }, [onChange, watch]);

  return (
    <>
      <FormProvider {...hooksForm}>
        <ActionTypeField disabled={editDisabled} />
        <CommentField disabled={editDisabled} />
      </FormProvider>
    </>
  );
};

// Export as default in order to support lazy loading
// move to lazy loading
export const EndpointResponseActionParamsForm = React.memo(
  EndpointResponseActionParamsFormComponent
);

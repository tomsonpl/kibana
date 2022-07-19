/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useMemo, useCallback } from 'react';
import { isEmpty } from 'lodash';
import type { IResponseAction } from './types';
import { ResponseActionsHeader } from './response_actions_header';

import { useSupportedResponseActionTypes } from './use_supported_response_action_types';
import type { FieldHook } from '../../../shared_imports';
import { UseField, useFormData } from '../../../shared_imports';
import { ResponseActionsList } from './response_actions_list';

const GhostFormField = () => <></>;

interface IProps {
  field: FieldHook<IResponseAction[]>;
}

export const ResponseActionsForm = ({ field }: IProps) => {
  const supportedResponseActionTypes = useSupportedResponseActionTypes();

  const actions: IResponseAction[] = useMemo(() => {
    return !isEmpty(field.value) ? field.value : [];
  }, [field.value]);

  const handleAdd = useCallback(
    (item: IResponseAction) => {
      field.setValue((prevValue) => {
        const updatedActions = [...prevValue, item];

        return updatedActions;
      });
    },
    [field]
  );

  const [data] = useFormData();

  console.log({ data });

  const setActionParamsProperty = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (key: string, value: any, index: number) => {
      console.log({ key, value, index });
      field.setValue((prevValue: any[]) => {
        const updatedActions = [...prevValue];
        updatedActions[index] = {
          ...updatedActions[index],
          params: {
            ...updatedActions[index].params,
            [key]: value,
          },
        };
        return updatedActions;
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [field.setValue]
  );

  const handleRemove = useCallback(
    (id) => {
      field.setValue((prevValue) => {
        const updatedActions = prevValue.filter((action) => action.params.id !== id);
        console.log('Remove:', prevValue, updatedActions, id);

        return updatedActions;
      });
    },
    [field]
  );
  const form = useMemo(() => {
    if (!supportedResponseActionTypes?.length) {
      return <UseField path="responseActions" component={GhostFormField} />;
    }
    return (
      <ResponseActionsList
        items={actions}
        removeItem={handleRemove}
        supportedResponseActionTypes={supportedResponseActionTypes}
        addItem={handleAdd}
        updateFormAction={setActionParamsProperty}
      />
    );
  }, [actions, handleAdd, handleRemove, supportedResponseActionTypes]);

  return (
    <>
      <ResponseActionsHeader />
      {form}
    </>
  );
};

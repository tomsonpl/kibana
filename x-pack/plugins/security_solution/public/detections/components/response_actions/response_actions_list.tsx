/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useMemo } from 'react';
import type { IResponseAction } from './types';
import { ResponseActionTypeForm } from './response_action_type_form';
import type { ResponseActionType } from './get_supported_response_actions';
import { ResponseActionAddButton } from './response_action_add_button';

interface IResponseActionsListProps {
  items: IResponseAction[];
  removeItem: (id: string) => void;
  addItem: (item: IResponseAction) => void;
  supportedResponseActionTypes: ResponseActionType[];
  updateFormAction: (key: string, value: any, index: number) => void;
}

export const ResponseActionsList = ({
  items,
  removeItem,
  supportedResponseActionTypes,
  addItem,
  updateFormAction,
}: IResponseActionsListProps) => {
  const renderButton = useMemo(() => {
    return (
      <ResponseActionAddButton
        supportedResponseActionTypes={supportedResponseActionTypes}
        addActionType={addItem}
      />
    );
  }, [addItem, supportedResponseActionTypes]);

  return (
    <>
      {items.map((actionItem, index) => {
        return (
          <div key={actionItem.params.id}>
            <ResponseActionTypeForm
              item={actionItem}
              onDeleteAction={removeItem}
              index={index}
              updateFormAction={updateFormAction}
            />
          </div>
        );
      })}

      {renderButton}
    </>
  );
};

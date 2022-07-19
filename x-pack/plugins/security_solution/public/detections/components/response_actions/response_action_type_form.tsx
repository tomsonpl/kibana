/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import React, { useState, useCallback, useMemo } from 'react';

import {
  EuiAccordion,
  EuiButtonIcon,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
  EuiText,
} from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import { OsqueryResponseAction } from './osquery/osquery_response_action';
import { getLogo, RESPONSE_ACTION_TYPES } from './constants';
import type { IResponseAction } from './types';

interface IProps {
  item: IResponseAction;
  onDeleteAction: (id: string) => void;
  updateFormAction: (key: string, value: any, index: number) => void;
}

export const ResponseActionTypeForm = React.memo((props: IProps) => {
  const { item, onDeleteAction, index, updateFormAction } = props;
  const [_isOpen, setIsOpen] = useState(true);

  const getResponseActionTypeForm = useCallback(() => {
    if (item?.actionTypeId === RESPONSE_ACTION_TYPES.OSQUERY) {
      return (
        <OsqueryResponseAction item={item} index={index} updateFormAction={updateFormAction} />
      );
    }
    // Place for other ResponseActionTypes
    return null;
  }, [index, item, updateFormAction]);

  const handleDelete = useCallback(() => {
    console.log('handledelete id:', item, item.params.id);
    onDeleteAction(item.params.id);
  }, [item, onDeleteAction]);

  const renderButtonContent = useMemo(() => {
    return (
      <EuiFlexGroup gutterSize="l" alignItems="center">
        <EuiFlexItem grow={false}>
          <EuiIcon type={getLogo(item?.actionTypeId)} size="m" />
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiText>
            <EuiFlexGroup gutterSize="s">
              <EuiFlexItem grow={false}>{item?.actionTypeId}</EuiFlexItem>
            </EuiFlexGroup>
          </EuiText>
        </EuiFlexItem>
      </EuiFlexGroup>
    );
  }, [item?.actionTypeId]);

  const renderExtraContent = useMemo(() => {
    return (
      <EuiButtonIcon
        iconType="minusInCircle"
        color="danger"
        className="actAccordionActionForm__extraAction"
        aria-label={i18n.translate(
          'xpack.triggersActionsUI.sections.actionTypeForm.accordion.deleteIconAriaLabel',
          {
            defaultMessage: 'Delete',
          }
        )}
        onClick={handleDelete}
      />
    );
  }, [handleDelete]);
  return (
    <EuiAccordion
      initialIsOpen={true}
      key={item?.id || 0}
      id={item?.id?.toString() || '0'}
      onToggle={setIsOpen}
      paddingSize="l"
      className="actAccordionActionForm"
      buttonContentClassName="actAccordionActionForm__button"
      data-test-subj={`alertActionAccordion`}
      buttonContent={renderButtonContent}
      extraAction={renderExtraContent}
    >
      {getResponseActionTypeForm()}
    </EuiAccordion>
  );
});

ResponseActionTypeForm.displayName = 'ResponseActionTypeForm';

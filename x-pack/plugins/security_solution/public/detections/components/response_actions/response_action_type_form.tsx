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
import { get } from 'lodash';
import { OsqueryResponseAction } from './osquery/osquery_response_action';
import { getLogo, RESPONSE_ACTION_TYPES } from './constants';
import { useFormData } from '../../../shared_imports';
import type { ArrayItem } from '../../../shared_imports';

interface IProps {
  item: ArrayItem;
  onDeleteAction: (id: number) => void;
  formRef: React.RefObject<{ validation: () => Promise<{ isValid: boolean }> }>;
}

export const ResponseActionTypeForm = React.memo((props: IProps) => {
  const { item, onDeleteAction, formRef } = props;
  const [_isOpen, setIsOpen] = useState(true);

  const [data] = useFormData();
  const action = get(data, item.path);

  const getResponseActionTypeForm = useCallback(() => {
    if (action?.actionTypeId === RESPONSE_ACTION_TYPES.OSQUERY) {
      return <OsqueryResponseAction item={item} formRef={formRef} />;
    }
    // Place for other ResponseActionTypes
    return null;
  }, [action?.actionTypeId, formRef, item]);

  const handleDelete = useCallback(() => {
    onDeleteAction(item.id);
  }, [item, onDeleteAction]);

  const renderButtonContent = useMemo(() => {
    return (
      <EuiFlexGroup gutterSize="l" alignItems="center">
        <EuiFlexItem grow={false}>
          <EuiIcon type={getLogo(action?.actionTypeId)} size="m" />
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiText>
            <EuiFlexGroup gutterSize="s">
              <EuiFlexItem grow={false}>{action?.actionTypeId}</EuiFlexItem>
            </EuiFlexGroup>
          </EuiText>
        </EuiFlexItem>
      </EuiFlexGroup>
    );
  }, [action?.actionTypeId]);

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
      key={item.id}
      id={item.id.toString()}
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

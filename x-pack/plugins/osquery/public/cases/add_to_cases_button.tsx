/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useCallback } from 'react';
import { CommentType, ExternalReferenceStorageType } from '@kbn/cases-plugin/common';
import { EuiButtonEmpty, EuiButtonIcon, EuiFlexItem, EuiToolTip } from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import type { CaseAttachmentsWithoutOwner } from '@kbn/cases-plugin/public';
import { useGetUserCasesPermissions } from './use_get_cases_permissions';
import { useKibana } from '../common/lib/kibana';

const ADD_TO_CASE = i18n.translate(
  'xpack.osquery.pack.queriesTable.addToCaseResultsActionAriaLabel',
  {
    defaultMessage: 'Add to Case',
  }
);

interface IProps {
  queryId: string;
  agentIds?: string[];
  actionId: string;
  isIcon?: boolean;
  isDisabled?: boolean;
  iconProps?: Record<string, string>;
}

export const AddToCaseButton: React.FC<IProps> = ({
  actionId,
  agentIds = [],
  queryId = '',
  isIcon = false,
  isDisabled,
  iconProps,
}) => {
  const { cases: casesUi } = useKibana().services;

  const casePermissions = useGetUserCasesPermissions();
  const hasReadPermissions = casePermissions.read && casePermissions.update && casePermissions.push;
  const hasWritePermissions = casePermissions.create && hasReadPermissions;

  const createCaseFlyout = casesUi.hooks.getUseCasesAddToNewCaseFlyout({});
  const selectCaseModal = casesUi.hooks.getUseCasesAddToExistingCaseModal({});

  const handleClick = useCallback(() => {
    const attachments: CaseAttachmentsWithoutOwner = [
      {
        type: CommentType.externalReference,
        externalReferenceId: actionId,
        externalReferenceStorage: {
          type: ExternalReferenceStorageType.elasticSearchDoc,
        },
        externalReferenceAttachmentTypeId: 'osquery',
        externalReferenceMetadata: { actionId, agentIds, queryId },
      },
    ];
    if (hasWritePermissions) {
      selectCaseModal.open({ attachments });
    } else if (hasReadPermissions) {
      createCaseFlyout.open({ attachments });
    }
  }, [
    actionId,
    agentIds,
    createCaseFlyout,
    hasReadPermissions,
    hasWritePermissions,
    queryId,
    selectCaseModal,
  ]);

  if (isIcon) {
    return (
      <EuiToolTip content={<EuiFlexItem>Add to Case</EuiFlexItem>}>
        <EuiButtonIcon
          iconType={'casesApp'}
          onClick={handleClick}
          isDisabled={isDisabled || !hasReadPermissions}
          {...iconProps}
        />
      </EuiToolTip>
    );
  }

  return (
    <EuiButtonEmpty
      size="xs"
      iconType="casesApp"
      onClick={handleClick}
      isDisabled={isDisabled || !hasReadPermissions}
    >
      {ADD_TO_CASE}
    </EuiButtonEmpty>
  );
};

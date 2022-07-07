/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { EuiButtonEmpty, EuiToolTip } from '@elastic/eui';
import React, { useCallback, useMemo } from 'react';

import { usePostPushToService } from '../../containers/use_post_push_to_service';
import { CaseCallOut } from './callout';
import {
  getLicenseError,
  getKibanaConfigError,
  getConnectorMissingInfo,
  getDeletedConnectorError,
  getCaseClosedInfo,
} from './helpers';
import * as i18n from './translations';
import { CaseConnector, ActionConnector, CaseStatuses } from '../../../common/api';
import { CaseServices } from '../../containers/use_get_case_user_actions';
import { ErrorMessage } from './callout/types';
import { useRefreshCaseViewPage } from '../case_view/use_on_refresh_case_view_page';
import { useGetActionLicense } from '../../containers/use_get_action_license';
import { useCasesContext } from '../cases_context/use_cases_context';

export interface UsePushToService {
  caseId: string;
  caseServices: CaseServices;
  caseStatus: string;
  connector: CaseConnector;
  connectors: ActionConnector[];
  hasDataToPush: boolean;
  isValidConnector: boolean;
  onEditClick: () => void;
}

export interface ReturnUsePushToService {
  pushButton: JSX.Element;
  pushCallouts: JSX.Element | null;
}

export const usePushToService = ({
  caseId,
  caseServices,
  caseStatus,
  connector,
  connectors,
  hasDataToPush,
  isValidConnector,
  onEditClick,
}: UsePushToService): ReturnUsePushToService => {
  const { permissions } = useCasesContext();
  const { isLoading, pushCaseToExternalService } = usePostPushToService();

  const { isLoading: loadingLicense, data: actionLicense = null } = useGetActionLicense();
  const hasLicenseError = actionLicense != null && !actionLicense.enabledInLicense;
  const refreshCaseViewPage = useRefreshCaseViewPage();

  const handlePushToService = useCallback(async () => {
    if (connector.id != null && connector.id !== 'none') {
      const theCase = await pushCaseToExternalService({
        caseId,
        connector,
      });

      if (theCase != null) {
        refreshCaseViewPage();
      }
    }
  }, [caseId, connector, pushCaseToExternalService, refreshCaseViewPage]);

  const errorsMsg = useMemo(() => {
    const errors: ErrorMessage[] = [];

    // these message require that the user do some sort of write action as a result of the message, readonly users won't
    // be able to perform such an action so let's not display the error to the user in that situation
    if (!permissions.all) {
      return errors;
    }

    /**
     * We show only one message to the user depending the scenario. The messages have a priority of importance.
     * Messages with higher priority are being shown first. The priority is defined by the order each message is returned.
     *
     * By priority of importance:
     * 1. Show license error.
     * 2. Show configuration error.
     * 3. Show connector configuration error if the connector is set to none or no connectors have been created.
     * 4. Show an error message if the connector has been deleted or the user does not have access to it.
     * 5. Show case closed message.
     */

    if (hasLicenseError) {
      return [getLicenseError()];
    }

    if (actionLicense != null && !actionLicense.enabledInConfig) {
      return [getKibanaConfigError()];
    }

    if (connector.id === 'none' && !loadingLicense && !hasLicenseError) {
      return [getConnectorMissingInfo()];
    }

    if (!isValidConnector && !loadingLicense && !hasLicenseError) {
      return [getDeletedConnectorError()];
    }

    if (caseStatus === CaseStatuses.closed) {
      return [getCaseClosedInfo()];
    }

    return errors;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actionLicense, caseStatus, connectors.length, connector, loadingLicense, permissions.all]);

  const pushToServiceButton = useMemo(
    () => (
      <EuiButtonEmpty
        data-test-subj="push-to-external-service"
        iconType="importAction"
        onClick={handlePushToService}
        disabled={
          isLoading ||
          loadingLicense ||
          errorsMsg.length > 0 ||
          !permissions.all ||
          !isValidConnector ||
          !hasDataToPush
        }
        isLoading={isLoading}
      >
        {caseServices[connector.id]
          ? i18n.UPDATE_THIRD(connector.name)
          : i18n.PUSH_THIRD(connector.name)}
      </EuiButtonEmpty>
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      connector,
      connectors,
      errorsMsg,
      handlePushToService,
      hasDataToPush,
      isLoading,
      loadingLicense,
      permissions.all,
      isValidConnector,
    ]
  );

  const objToReturn = useMemo(() => {
    const hidePushButton = errorsMsg.length > 0 || !hasDataToPush || !permissions.all;

    return {
      pushButton: hidePushButton ? (
        <EuiToolTip
          position="top"
          title={errorsMsg.length > 0 ? errorsMsg[0].title : i18n.PUSH_LOCKED_TITLE(connector.name)}
          content={<p>{errorsMsg.length > 0 ? errorsMsg[0].description : i18n.PUSH_LOCKED_DESC}</p>}
        >
          {pushToServiceButton}
        </EuiToolTip>
      ) : (
        <>{pushToServiceButton}</>
      ),
      pushCallouts:
        errorsMsg.length > 0 ? (
          <CaseCallOut
            hasConnectors={connectors.length > 0}
            hasLicenseError={hasLicenseError}
            messages={errorsMsg}
            onEditClick={onEditClick}
          />
        ) : null,
    };
  }, [
    connector.name,
    connectors.length,
    errorsMsg,
    hasDataToPush,
    hasLicenseError,
    onEditClick,
    pushToServiceButton,
    permissions.all,
  ]);

  return objToReturn;
};

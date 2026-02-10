/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import {
  EuiBottomBar,
  EuiButtonEmpty,
  EuiButton,
  EuiFlexGroup,
  EuiFlexItem,
  EuiSpacer,
} from '@elastic/eui';
import React, { useCallback, useEffect, useRef } from 'react';
import { FormattedMessage } from '@kbn/i18n-react';

import type { FieldErrors } from 'react-hook-form';
import { FormProvider } from 'react-hook-form';
import { useRouterNavigate } from '../../../common/lib/kibana';
import { useOsqueryTelemetry } from '../../../lib/telemetry';
import { SavedQueryForm } from '../../../saved_queries/form';
import type {
  SavedQueryFormData,
  SavedQuerySOFormData,
} from '../../../saved_queries/form/use_saved_query_form';
import { useSavedQueryForm } from '../../../saved_queries/form/use_saved_query_form';

interface EditSavedQueryFormProps {
  defaultValue?: SavedQuerySOFormData;
  handleSubmit: (payload: unknown) => Promise<void>;
  viewMode?: boolean;
}

const EditSavedQueryFormComponent: React.FC<EditSavedQueryFormProps> = ({
  defaultValue,
  handleSubmit,
  viewMode,
}) => {
  const savedQueryListProps = useRouterNavigate('saved_queries');
  const telemetry = useOsqueryTelemetry();

  useEffect(() => {
    telemetry.reportPageView({ page: 'edit_saved_query', timestamp: new Date().toISOString() });
  }, [telemetry]);

  const hooksForm = useSavedQueryForm({
    defaultValue,
  });

  const {
    serializer,
    idSet,
    handleSubmit: formSubmit,
    formState: { isSubmitting },
  } = hooksForm;

  const reportedErrorsRef = useRef<Set<string>>(new Set());

  const onSubmit = async (payload: SavedQueryFormData) => {
    const serializedData = serializer(payload);
    try {
      await handleSubmit(serializedData);
      // eslint-disable-next-line no-empty
    } catch (e) {}
  };

  const onFormError = useCallback(
    (formErrors: FieldErrors<SavedQueryFormData>) => {
      const errorFields = Object.keys(formErrors).sort();
      const errorKey = errorFields.join(',');
      if (!reportedErrorsRef.current.has(errorKey)) {
        reportedErrorsRef.current.add(errorKey);
        try {
          telemetry.reportFormValidationFailed({
            form_type: 'saved_query',
            error_fields: errorFields,
          });
        } catch {
          // Telemetry should never block the main flow
        }
      }
    },
    [telemetry]
  );

  return (
    <FormProvider {...hooksForm}>
      <SavedQueryForm viewMode={viewMode} hasPlayground idSet={idSet} />
      {!viewMode && (
        <>
          <EuiBottomBar>
            <EuiFlexGroup justifyContent="flexEnd">
              <EuiFlexItem grow={false}>
                <EuiFlexGroup gutterSize="m">
                  <EuiFlexItem grow={false}>
                    <EuiButtonEmpty color="text" {...savedQueryListProps}>
                      <FormattedMessage
                        id="xpack.osquery.editSavedQuery.form.cancelButtonLabel"
                        defaultMessage="Cancel"
                      />
                    </EuiButtonEmpty>
                  </EuiFlexItem>
                  <EuiFlexItem grow={false}>
                    <EuiButton
                      data-test-subj="update-query-button"
                      isLoading={isSubmitting}
                      color="primary"
                      fill
                      size="m"
                      iconType="save"
                      onClick={formSubmit(onSubmit, onFormError)}
                    >
                      <FormattedMessage
                        id="xpack.osquery.editSavedQuery.form.updateQueryButtonLabel"
                        defaultMessage="Update query"
                      />
                    </EuiButton>
                  </EuiFlexItem>
                </EuiFlexGroup>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiBottomBar>
          <EuiSpacer size="xxl" />
          <EuiSpacer size="xxl" />
          <EuiSpacer size="xxl" />
        </>
      )}
    </FormProvider>
  );
};

export const EditSavedQueryForm = React.memo(EditSavedQueryFormComponent);

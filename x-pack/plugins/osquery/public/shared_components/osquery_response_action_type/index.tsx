/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useCallback, useMemo, useState } from 'react';

import { QueryClientProvider } from 'react-query';
import type { EuiAccordionProps } from '@elastic/eui';
import { EuiSpacer } from '@elastic/eui';

import uuid from 'uuid';
import { convertECSMappingToFormValue } from '../../../common/schemas/common/utils';
import { ECSMappingEditorField } from '../../packs/queries/lazy_ecs_mapping_editor_field';
import { UseField, useFormContext } from '../../shared_imports';
import { useKibana } from '../../common/lib/kibana';
import { SavedQueriesDropdown } from '../../saved_queries/saved_queries_dropdown';
import { LiveQueryQueryField } from '../../live_queries/form/live_query_query_field';
import { queryClient } from '../../query_client';
import { StyledEuiAccordion } from '../../components/accordion';

const GhostFormField = () => <></>;

interface IProps {
  item: {
    actionTypeId: string;
    params: {
      id: string;
      ecs_mapping: [];
      query: string;
    };
  };
  updateAction: (key: string, value: any, index: number) => void;
}

// eslint-disable-next-line react/display-name
export const OsqueryResponseActionParamsForm: React.FunctionComponent<IProps> = React.memo(
  ({ item, index, updateFormAction }) => {
    console.log({ item });
    const uniqueId = useMemo(() => uuid.v4(), []);
    const permissions = useKibana().services.application.capabilities.osquery;
    const [advancedContentState, setAdvancedContentState] =
      useState<EuiAccordionProps['forceState']>('closed');
    const handleToggle = useCallback((isOpen) => {
      const newState = isOpen ? 'open' : 'closed';
      setAdvancedContentState(newState);
    }, []);

    const isSavedQueryDisabled = useMemo(
      () => !permissions.runSavedQueries || !permissions.readSavedQueries,
      [permissions.readSavedQueries, permissions.runSavedQueries]
    );

    const context = useFormContext();

    const handleSavedQueryChange = useCallback(
      (savedQuery) => {
        if (savedQuery) {
          const params = {
            savedQueryId: savedQuery.savedQueryId,
            query: savedQuery.query,
            ecs_mapping: [],
          };

          // uncomment to see first 2 fields value in form
          // context.updateFieldValues({
          //   [`responseActions[${index}]`]: { actionTypeId: '.osquery', params },
          // });
          const convertedECS = convertECSMappingToFormValue(savedQuery.ecs_mapping);
          updateFormAction('query', savedQuery.query, index);
          updateFormAction('savedQueryId', savedQuery.savedQueryId, index);
          updateFormAction('ecs_mapping', convertedECS, index);
        } else {
          context.setFieldValue(`responseActions[${index}].params.savedQueryId`, null);
        }
      },
      [context, index, updateFormAction]
    );

    return (
      <QueryClientProvider client={queryClient}>
        {!isSavedQueryDisabled && (
          <>
            <SavedQueriesDropdown
              disabled={isSavedQueryDisabled}
              onChange={handleSavedQueryChange}
            />
          </>
        )}
        <UseField path={`responseActions[${index}].params.query`} component={LiveQueryQueryField} />
        <UseField
          path={`responseActions[${index}].actionTypeId`}
          component={GhostFormField}
          defaultValue={'.osquery'}
        />
        <UseField
          path={`responseActions[${index}].params.savedQueryId`}
          component={GhostFormField}
        />
        <UseField
          path={`responseActions[${index}].params.id`}
          component={GhostFormField}
          defaultValue={uniqueId}
        />
        <>
          <EuiSpacer size="m" />
          <StyledEuiAccordion
            id="advanced"
            forceState={advancedContentState}
            onToggle={handleToggle}
            buttonContent="Advanced"
          >
            <EuiSpacer size="xs" />
            <ECSMappingEditorField
              path={`responseActions[${index}].params.ecs_mapping`}
              queryFieldPath={`responseActions[${index}].params.query`}
            />
          </StyledEuiAccordion>
        </>
      </QueryClientProvider>
    );
  }
);

// Export as default in order to support lazy loading
// eslint-disable-next-line import/no-default-export
export { OsqueryResponseActionParamsForm as default };

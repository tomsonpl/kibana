/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { EuiButton, EuiFlexGroup, EuiFlexItem, EuiText } from '@elastic/eui';
import { FormattedMessage } from '@kbn/i18n-react';
import React, { useEffect, useMemo } from 'react';

import { useKibana, useRouterNavigate } from '../../../common/lib/kibana';
import { useOsqueryTelemetry } from '../../../lib/telemetry';
import { ActionsTable } from '../../../actions/actions_table';
import { WithHeaderLayout } from '../../../components/layouts';
import { useBreadcrumbs } from '../../../common/hooks/use_breadcrumbs';

const LiveQueriesPageComponent = () => {
  useBreadcrumbs('live_queries');
  const telemetry = useOsqueryTelemetry();

  useEffect(() => {
    telemetry.reportPageView({ page: 'live_queries_list', timestamp: new Date().toISOString() });
  }, [telemetry]);

  const LeftColumn = useMemo(
    () => (
      <EuiFlexGroup direction="column" gutterSize="m">
        <EuiFlexItem>
          <EuiText>
            <h1>
              <FormattedMessage
                id="xpack.osquery.liveQueriesHistory.pageTitle"
                defaultMessage="Live queries history"
              />
            </h1>
          </EuiText>
        </EuiFlexItem>
      </EuiFlexGroup>
    ),
    []
  );

  return (
    <WithHeaderLayout
      leftColumn={LeftColumn}
      rightColumn={<NewLiveQueryButton />}
      rightColumnGrow={false}
    >
      <ActionsTable />
    </WithHeaderLayout>
  );
};

export const LiveQueriesPage = React.memo(LiveQueriesPageComponent);

const NewLiveQueryButton = React.memo(() => {
  const permissions = useKibana().services.application.capabilities.osquery;
  const newQueryLinkProps = useRouterNavigate('live_queries/new');

  return (
    <EuiButton
      fill
      {...newQueryLinkProps}
      iconType="plusInCircle"
      isDisabled={
        !(
          permissions.writeLiveQueries ||
          (permissions.runSavedQueries && (permissions.readSavedQueries || permissions.readPacks))
        )
      }
    >
      <FormattedMessage
        id="xpack.osquery.liveQueriesHistory.newLiveQueryButtonLabel"
        defaultMessage="New live query"
      />
    </EuiButton>
  );
});
NewLiveQueryButton.displayName = 'NewLiveQueryButton';

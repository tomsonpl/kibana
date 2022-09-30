/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import React, { useMemo } from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiSpacer, EuiText } from '@elastic/eui';
import { FormattedMessage } from '@kbn/i18n-react';
import styled from 'styled-components';
import { AddToCaseWrapper } from '../../cases/add_to_cases';

interface PackResultsHeadersProps {
  actionId?: string;
  queryIds: Array<{ value: string; field: string }>;
  agentIds?: string[];
}

const StyledResultsHeading = styled(EuiFlexItem)`
  padding-right: 20px;
  border-right: 2px solid #d3dae6;
`;

const StyledIconsList = styled(EuiFlexItem)`
  align-content: center;
  justify-content: center;
  padding-left: 10px;
`;

export const PackResultsHeader = ({ actionId, agentIds }: PackResultsHeadersProps) => {
  const iconProps = useMemo(() => ({ color: 'text', size: 'xs', iconSize: 'l' }), []);

  return (
    <>
      <EuiSpacer size={'l'} />
      <EuiFlexGroup direction="row" gutterSize="m">
        <StyledResultsHeading grow={false}>
          <EuiText>
            <h2>
              <FormattedMessage
                id="xpack.osquery.liveQueryActionResults.results"
                defaultMessage="Results"
              />
            </h2>
          </EuiText>
        </StyledResultsHeading>
        <StyledIconsList grow={false}>
          <span>
            {actionId && (
              <AddToCaseWrapper
                actionId={actionId}
                agentIds={agentIds}
                isIcon={true}
                iconProps={iconProps}
              />
            )}
          </span>
        </StyledIconsList>
      </EuiFlexGroup>
      <EuiSpacer size={'l'} />
    </>
  );
};

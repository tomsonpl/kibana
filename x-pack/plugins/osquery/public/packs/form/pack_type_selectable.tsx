/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { EuiCard, EuiFlexGroup, EuiFlexItem, EuiFormRow, EuiRadio } from '@elastic/eui';
import React, { useCallback, useMemo, memo } from 'react';
import { i18n } from '@kbn/i18n';
import styled from 'styled-components';
import { noop } from 'lodash';

const StyledEuiCard = styled(EuiCard)`
  padding: 16px 92px 16px 16px !important;

  .euiTitle {
    font-size: 1rem;
  }

  .euiText {
    margin-top: 0;
    margin-left: 25px;
    color: ${(props) => props.theme.eui.EuiTextSubduedColor};
  }

  > button[role='switch'] {
    display: none;
  }
`;

interface PackTypeSelectableProps {
  packType: string;
  setPackType: (type: 'global' | 'policy' | 'shards') => void;
  isGlobalDisabled: boolean;
  resetFormFields?: () => void;
}

export const PackTypeSelectable = memo(
  ({ packType, setPackType, isGlobalDisabled, resetFormFields }: PackTypeSelectableProps) => {
    const handleChange = useCallback(
      (type) => {
        setPackType(type);
        if (resetFormFields) {
          resetFormFields();
        }
      },
      [resetFormFields, setPackType]
    );
    const policyCardSelectable = useMemo(
      () => ({
        onClick: () => handleChange('policy'),
        isSelected: packType === 'policy',
      }),
      [packType, handleChange]
    );

    const globalCardSelectable = useMemo(
      () => ({
        onClick: () => handleChange('global'),
        isSelected: packType === 'global',
      }),
      [packType, handleChange]
    );
    const advancedCardSelectable = useMemo(
      () => ({
        onClick: () => handleChange('shards'),
        isSelected: packType === 'shards',
      }),
      [packType, handleChange]
    );

    // Couldn't pass styles through StyleEuiCard, becasue 'color' conflicts with layout 'horizontal'
    const getRadioStyle = useCallback(
      (selected) => ({
        ...(selected && { color: '#006BB4' }),
      }),
      []
    );

    return (
      <EuiFlexItem>
        <EuiFormRow label="Type" fullWidth>
          <EuiFlexGroup gutterSize="m">
            <EuiFlexItem>
              <StyledEuiCard
                layout="horizontal"
                title={
                  <EuiRadio
                    style={getRadioStyle(policyCardSelectable.isSelected)}
                    id={'osquery_pack_type_policy'}
                    label={i18n.translate('xpack.osquery.pack.form.policyLabel', {
                      defaultMessage: 'Policy',
                    })}
                    onChange={noop}
                    checked={packType === 'policy'}
                  />
                }
                titleSize="xs"
                hasBorder
                description={i18n.translate('xpack.osquery.pack.form.policyDescription', {
                  defaultMessage: 'Schedule pack for specific policy.',
                })}
                selectable={policyCardSelectable}
              />
            </EuiFlexItem>
            <EuiFlexItem>
              <StyledEuiCard
                layout="horizontal"
                title={
                  <EuiRadio
                    style={getRadioStyle(globalCardSelectable.isSelected)}
                    id={'osquery_pack_type_global'}
                    label={i18n.translate('xpack.osquery.pack.form.globalLabel', {
                      defaultMessage: 'Global',
                    })}
                    onChange={noop}
                    checked={packType === 'global'}
                  />
                }
                titleSize="xs"
                hasBorder
                description={i18n.translate('xpack.osquery.pack.form.globalDescription', {
                  defaultMessage: 'Use pack across all policies',
                })}
                selectable={globalCardSelectable}
                isDisabled={isGlobalDisabled}
              />
            </EuiFlexItem>
            <EuiFlexItem>
              <StyledEuiCard
                layout="horizontal"
                title={
                  <EuiRadio
                    style={getRadioStyle(globalCardSelectable.isSelected)}
                    id={'osquery_pack_type_advanced'}
                    label={i18n.translate('xpack.osquery.pack.form.advancedLabel', {
                      defaultMessage: 'Advanced',
                    })}
                    onChange={noop}
                    checked={packType === 'shards'}
                  />
                }
                titleSize="xs"
                hasBorder
                description={i18n.translate('xpack.osquery.pack.form.advancedDescription', {
                  defaultMessage: 'Specify shards and agents to run pack on',
                })}
                selectable={advancedCardSelectable}
              />
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFormRow>
      </EuiFlexItem>
    );
  }
);
PackTypeSelectable.displayName = 'PackTypeSelectable';

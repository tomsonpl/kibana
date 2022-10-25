/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { reduce } from 'lodash';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiButtonEmpty,
  EuiButton,
  EuiSpacer,
  EuiBottomBar,
  EuiHorizontalRule,
} from '@elastic/eui';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FormattedMessage } from '@kbn/i18n-react';
import deepEqual from 'fast-deep-equal';
import { FormProvider, useForm as useHookForm } from 'react-hook-form';

import { useRouterNavigate } from '../../common/lib/kibana';
import { PolicyIdComboBoxField } from './policy_id_combobox_field';
import { QueriesField } from './queries_field';
import { ConfirmDeployAgentPolicyModal } from './confirmation_modal';
import { useAgentPolicies } from '../../agent_policies';
import { useCreatePack } from '../use_create_pack';
import { useUpdatePack } from '../use_update_pack';
import { convertPackQueriesToSO, convertSOQueriesToPack } from './utils';
import type { PackItem } from '../types';
import { NameField } from './name_field';
import { DescriptionField } from './description_field';
import type { PackQueryFormData } from '../queries/use_pack_query_form';
import { PackTypeSelectable } from './pack_type_selectable';

type PackFormData = Omit<PackItem, 'id' | 'queries'> & { queries: PackQueryFormData[] };

interface PackFormProps {
  defaultValue?: PackItem;
  editMode?: boolean;
  isReadOnly?: boolean;
}

const PackFormComponent: React.FC<PackFormProps> = ({
  defaultValue,
  editMode = false,
  isReadOnly = false,
}) => {
  const [packType, setPackType] = useState('policy');
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const handleHideConfirmationModal = useCallback(() => setShowConfirmationModal(false), []);

  const { data: { agentPoliciesById } = {} } = useAgentPolicies();

  const cancelButtonProps = useRouterNavigate(`packs/${editMode ? defaultValue?.id : ''}`);

  const { mutateAsync: createAsync } = useCreatePack({
    withRedirect: true,
  });
  const { mutateAsync: updateAsync } = useUpdatePack({
    withRedirect: true,
  });

  const deserializer = (payload: PackItem) => ({
    ...payload,
    policy_ids: payload.policy_ids ?? [],
    queries: convertPackQueriesToSO(payload.queries),
  });

  const hooksForm = useHookForm({
    defaultValues: defaultValue
      ? deserializer(defaultValue)
      : {
          name: '',
          description: '',
          policy_ids: [],
          enabled: true,
          queries: [],
        },
  });

  useEffect(() => {
    if (defaultValue?.is_global) {
      setPackType('global');
    }
  }, [defaultValue?.is_global]);

  const {
    handleSubmit,
    watch,
    formState: { isSubmitting },
  } = hooksForm;

  const onSubmit = useCallback(
    async (values: PackFormData) => {
      const serializer = (payload: PackFormData) => ({
        ...payload,
        is_global: packType === 'global',
        queries: convertSOQueriesToPack(payload.queries),
      });

      try {
        if (editMode && defaultValue?.id) {
          await updateAsync({ id: defaultValue?.id, ...serializer(values) });
        } else {
          await createAsync(serializer(values));
        }
        // eslint-disable-next-line no-empty
      } catch (e) {}
    },
    [createAsync, defaultValue?.id, editMode, packType, updateAsync]
  );

  const handleSubmitForm = useMemo(() => handleSubmit(onSubmit), [handleSubmit, onSubmit]);

  const { policy_ids: policyIds, namespaces = [] } = watch();

  // TODO need to figure out how to verify namespace, because at the beginning the namespace is empty
  const isDefaultNamespace = namespaces.length === 0 || namespaces?.[0] === 'default';

  const agentCount = useMemo(
    () =>
      reduce(
        policyIds,
        (acc, policyId) => {
          const agentPolicy = agentPoliciesById && agentPoliciesById[policyId];

          return acc + (agentPolicy?.agents ?? 0);
        },
        0
      ),
    [policyIds, agentPoliciesById]
  );

  const handleSaveClick = useCallback(() => {
    if (agentCount) {
      setShowConfirmationModal(true);

      return;
    }

    handleSubmitForm();
  }, [agentCount, handleSubmitForm]);

  const handleConfirmConfirmationClick = useCallback(() => {
    handleSubmitForm();
    setShowConfirmationModal(false);
  }, [handleSubmitForm]);

  const euiFieldProps = useMemo(() => ({ isDisabled: isReadOnly }), [isReadOnly]);
  // const policyIdsFieldProps = useMemo(() => ({ isDisabled: isGlobalEnabled }), [isGlobalEnabled]);

  const changePackType = useCallback(
    (type: 'global' | 'policy') => {
      setPackType(type);
    },
    [setPackType]
  );

  return (
    <>
      <FormProvider {...hooksForm}>
        <EuiFlexGroup>
          <EuiFlexItem>
            <NameField euiFieldProps={euiFieldProps} />
          </EuiFlexItem>
        </EuiFlexGroup>

        <EuiFlexGroup>
          <EuiFlexItem>
            <DescriptionField euiFieldProps={euiFieldProps} />
          </EuiFlexItem>
        </EuiFlexGroup>

        <EuiFlexGroup>
          <PackTypeSelectable
            packType={packType}
            setPackType={changePackType}
            isGlobalEnabled={isDefaultNamespace}
          />
        </EuiFlexGroup>
        {/* <EuiSpacer size="xxl" />*/}

        {packType === 'policy' && (
          <EuiFlexGroup>
            <EuiFlexItem>
              <PolicyIdComboBoxField />
            </EuiFlexItem>
          </EuiFlexGroup>
        )}
        {/* {isDefaultNamespace && (*/}
        {/*  <EuiFlexItem>*/}
        {/*  <GlobalPackField />*/}
        {/*  </EuiFlexItem>*/}
        {/*  )}*/}
        <EuiSpacer size="xxl" />

        <EuiHorizontalRule />

        <QueriesField euiFieldProps={euiFieldProps} />
      </FormProvider>
      <EuiSpacer size="xxl" />
      <EuiSpacer size="xxl" />
      <EuiSpacer size="xxl" />
      <EuiBottomBar>
        <EuiFlexGroup justifyContent="flexEnd">
          <EuiFlexItem grow={false}>
            <EuiFlexGroup gutterSize="m">
              <EuiFlexItem grow={false}>
                <EuiButtonEmpty color="ghost" {...cancelButtonProps}>
                  <FormattedMessage
                    id="xpack.osquery.pack.form.cancelButtonLabel"
                    defaultMessage="Cancel"
                  />
                </EuiButtonEmpty>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiButton
                  isLoading={isSubmitting}
                  color="primary"
                  fill
                  size="m"
                  iconType="save"
                  onClick={handleSaveClick}
                >
                  {editMode ? (
                    <FormattedMessage
                      id="xpack.osquery.pack.form.updatePackButtonLabel"
                      defaultMessage="Update pack"
                    />
                  ) : (
                    <FormattedMessage
                      id="xpack.osquery.pack.form.savePackButtonLabel"
                      defaultMessage="Save pack"
                    />
                  )}
                </EuiButton>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiBottomBar>
      {showConfirmationModal && (
        <ConfirmDeployAgentPolicyModal
          onCancel={handleHideConfirmationModal}
          onConfirm={handleConfirmConfirmationClick}
          agentCount={agentCount}
          agentPolicyCount={policyIds.length}
        />
      )}
    </>
  );
};

export const PackForm = React.memo(PackFormComponent, deepEqual);

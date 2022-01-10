/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { set } from 'lodash';
import satisfies from 'semver/functions/satisfies';
import { produce } from 'immer';
import { OSQUERY_INTEGRATION_NAME } from '../../common';
import { PutPackagePolicyUpdateCallback } from '../../../fleet/server';

export const preparePackagePolicyInput: PutPackagePolicyUpdateCallback = async (
  updatePackagePolicy
) => {
  if (updatePackagePolicy?.package?.name === OSQUERY_INTEGRATION_NAME) {
    if (satisfies(updatePackagePolicy?.package?.version, '>=0.6.0')) {
      const updatedPolicy = produce(updatePackagePolicy, (draft) => {
        set(draft, 'inputs[0]', {
          type: 'osquery',
          enabled: true,
          streams: [],
          policy_template: 'osquery_manager',
        });
      });
      return updatedPolicy;
    }
  }

  return updatePackagePolicy;
};

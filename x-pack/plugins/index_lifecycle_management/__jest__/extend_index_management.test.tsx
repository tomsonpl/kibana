/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import moment from 'moment-timezone';

import { init } from '../integration_tests/helpers/http_requests';
import { mountWithIntl } from '@kbn/test-jest-helpers';
import { usageCollectionPluginMock } from '@kbn/usage-collection-plugin/public/mocks';
import { Index } from '../common/types';
import {
  retryLifecycleActionExtension,
  removeLifecyclePolicyActionExtension,
  addLifecyclePolicyActionExtension,
  ilmBannerExtension,
  ilmFilterExtension,
} from '../public/extend_index_management';
import { init as initHttp } from '../public/application/services/http';
import { init as initUiMetric } from '../public/application/services/ui_metric';
import { IndexLifecycleSummary } from '../public/extend_index_management/components/index_lifecycle_summary';
import React from 'react';

const { httpSetup } = init();

initHttp(httpSetup);
initUiMetric(usageCollectionPluginMock.createSetupContract());

jest.mock('@kbn/index-management-plugin/public', async () => {
  const { indexManagementMock } = await import('@kbn/index-management-plugin/public/mocks');
  return indexManagementMock.createSetup();
});

const indexWithoutLifecyclePolicy: Index = {
  health: 'yellow',
  status: 'open',
  name: 'noPolicy',
  uuid: 'BJ-nrZYuSrG-jaofr6SeLg',
  primary: 1,
  replica: 1,
  documents: 1,
  documents_deleted: 0,
  size: '3.4kb',
  primary_size: '3.4kb',
  aliases: 'none',
  isFrozen: false,
  hidden: false,
  ilm: {
    index: 'testy1',
    managed: false,
  },
};

const indexWithLifecyclePolicy: Index = {
  health: 'yellow',
  status: 'open',
  name: 'testy3',
  uuid: 'XL11TLa3Tvq298_dMUzLHQ',
  primary: 1,
  replica: 1,
  documents: 2,
  documents_deleted: 0,
  size: '6.5kb',
  primary_size: '6.5kb',
  aliases: 'none',
  isFrozen: false,
  hidden: false,
  ilm: {
    index: 'testy3',
    managed: true,
    policy: 'testy',
    lifecycle_date_millis: 1544020872361,
    phase: 'new',
    phase_time_millis: 1544187775867,
    action: 'complete',
    action_time_millis: 1544187775867,
    step: 'complete',
    step_time_millis: 1544187775867,
  },
};

const indexWithLifecycleError: Index = {
  health: 'yellow',
  status: 'open',
  name: 'testy3',
  uuid: 'XL11TLa3Tvq298_dMUzLHQ',
  primary: 1,
  replica: 1,
  documents: 2,
  documents_deleted: 0,
  size: '6.5kb',
  primary_size: '6.5kb',
  aliases: 'none',
  isFrozen: false,
  hidden: false,
  ilm: {
    index: 'testy3',
    managed: true,
    policy: 'testy',
    lifecycle_date_millis: 1544020872361,
    phase: 'hot',
    phase_time_millis: 1544187775891,
    action: 'rollover',
    action_time_millis: 1544187775891,
    step: 'ERROR',
    step_time_millis: 1544187776208,
    failed_step: 'check-rollover-ready',
    step_info: {
      type: 'illegal_argument_exception',
      reason: 'setting [index.lifecycle.rollover_alias] for index [testy3] is empty or not defined',
    },
    phase_execution: {
      policy: 'testy',
      phase_definition: { min_age: '0s', actions: { rollover: { max_size: '1gb' } } },
      version: 1,
      modified_date_in_millis: 1544031699844,
    },
  },
};

moment.tz.setDefault('utc');

const getUrlForApp = (appId: string, options: any) => {
  return appId + '/' + (options ? options.path : '');
};

const reloadIndices = () => {};

describe('extend index management', () => {
  describe('retry lifecycle action extension', () => {
    test('should return null when no indices have index lifecycle policy', () => {
      const extension = retryLifecycleActionExtension({ indices: [indexWithoutLifecyclePolicy] });
      expect(extension).toBeNull();
    });

    test('should return null when no index has lifecycle errors', () => {
      const extension = retryLifecycleActionExtension({
        indices: [indexWithLifecyclePolicy, indexWithLifecyclePolicy],
      });
      expect(extension).toBeNull();
    });

    test('should return null when not all indices have lifecycle errors', () => {
      const extension = retryLifecycleActionExtension({
        indices: [indexWithLifecyclePolicy, indexWithLifecycleError],
      });
      expect(extension).toBeNull();
    });

    test('should return extension when all indices have lifecycle errors', () => {
      const extension = retryLifecycleActionExtension({
        indices: [indexWithLifecycleError, indexWithLifecycleError],
      });
      expect(extension).toBeDefined();
      expect(extension).toMatchSnapshot();
    });
  });

  describe('remove lifecycle action extension', () => {
    test('should return null when no indices have index lifecycle policy', () => {
      const extension = removeLifecyclePolicyActionExtension({
        indices: [indexWithoutLifecyclePolicy],
        reloadIndices,
      });
      expect(extension).toBeNull();
    });

    test('should return null when some indices have index lifecycle policy', () => {
      const extension = removeLifecyclePolicyActionExtension({
        indices: [indexWithoutLifecyclePolicy, indexWithLifecyclePolicy],
        reloadIndices,
      });
      expect(extension).toBeNull();
    });

    test('should return extension when all indices have lifecycle policy', () => {
      const extension = removeLifecyclePolicyActionExtension({
        indices: [indexWithLifecycleError, indexWithLifecycleError],
        reloadIndices,
      });
      expect(extension).toBeDefined();
      expect(extension).toMatchSnapshot();
    });
  });

  describe('add lifecycle policy action extension', () => {
    test('should return null when index has index lifecycle policy', () => {
      const extension = addLifecyclePolicyActionExtension({
        indices: [indexWithLifecyclePolicy],
        reloadIndices,
        getUrlForApp,
      });
      expect(extension).toBeNull();
    });

    test('should return null when more than one index is passed', () => {
      const extension = addLifecyclePolicyActionExtension({
        indices: [indexWithoutLifecyclePolicy, indexWithoutLifecyclePolicy],
        reloadIndices,
        getUrlForApp,
      });
      expect(extension).toBeNull();
    });

    test('should return extension when one index is passed and it does not have lifecycle policy', () => {
      const extension = addLifecyclePolicyActionExtension({
        indices: [indexWithoutLifecyclePolicy],
        reloadIndices,
        getUrlForApp,
      });
      expect(extension?.renderConfirmModal).toBeDefined();
      const component = extension!.renderConfirmModal(jest.fn());
      const rendered = mountWithIntl(component);
      expect(rendered.exists('.euiModal--confirmation'));
    });
  });

  describe('ilm banner extension', () => {
    test('should return null when no index has index lifecycle policy', () => {
      const extension = ilmBannerExtension([
        indexWithoutLifecyclePolicy,
        indexWithoutLifecyclePolicy,
      ]);
      expect(extension).toBeNull();
    });

    test('should return null no index has lifecycle error', () => {
      const extension = ilmBannerExtension([indexWithoutLifecyclePolicy, indexWithLifecyclePolicy]);
      expect(extension).toBeNull();
    });

    test('should return extension when any index has lifecycle error', () => {
      const extension = ilmBannerExtension([
        indexWithoutLifecyclePolicy,
        indexWithLifecyclePolicy,
        indexWithLifecycleError,
      ]);
      expect(extension).toBeDefined();
      expect(extension).toMatchSnapshot();
    });
  });

  describe('ilm summary extension', () => {
    test('should render null when index has no index lifecycle policy', () => {
      const extension = (
        <IndexLifecycleSummary index={indexWithoutLifecyclePolicy} getUrlForApp={getUrlForApp} />
      );
      const rendered = mountWithIntl(extension);
      expect(rendered.isEmptyRender()).toBeTruthy();
    });

    test('should return extension when index has lifecycle policy', () => {
      const extension = (
        <IndexLifecycleSummary index={indexWithLifecyclePolicy} getUrlForApp={getUrlForApp} />
      );
      expect(extension).toBeDefined();
      const rendered = mountWithIntl(extension);
      expect(rendered.render()).toMatchSnapshot();
    });

    test('should return extension when index has lifecycle error', () => {
      const extension = (
        <IndexLifecycleSummary index={indexWithLifecycleError} getUrlForApp={getUrlForApp} />
      );
      expect(extension).toBeDefined();
      const rendered = mountWithIntl(extension);
      expect(rendered.render()).toMatchSnapshot();
    });
  });

  describe('ilm filter extension', () => {
    test('should return empty array when no indices have index lifecycle policy', () => {
      const extension = ilmFilterExtension([
        indexWithoutLifecyclePolicy,
        indexWithoutLifecyclePolicy,
      ]);
      expect(extension.length).toBe(0);
    });

    test('should return extension when any index has lifecycle policy', () => {
      const extension = ilmFilterExtension([
        indexWithLifecyclePolicy,
        indexWithoutLifecyclePolicy,
        indexWithoutLifecyclePolicy,
      ]);
      expect(extension).toBeDefined();
      expect(extension).toMatchSnapshot();
    });
  });
});

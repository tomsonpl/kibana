/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import {
  SubActionConnectorType,
  ValidatorType,
} from '@kbn/actions-plugin/server/sub_action_framework/types';
import { SecurityConnectorFeatureId } from '@kbn/actions-plugin/common';
import { urlAllowListValidator } from '@kbn/actions-plugin/server';
import { CROWDSTRIKE_CONNECTOR_ID, CROWDSTRIKE_TITLE } from '../../../common/crowdstrike/constants';
import {
  SentinelOneConfigSchema,
  SentinelOneSecretsSchema,
} from '../../../common/crowdstrike/schema';
import { SentinelOneConfig, SentinelOneSecrets } from '../../../common/crowdstrike/types';
import { CrowdstrikeConnector } from './crowdstrike';
import { renderParameterTemplates } from './render';

export const getCrowdstrikeConnectorType = (): SubActionConnectorType<
  SentinelOneConfig,
  SentinelOneSecrets
> => ({
  id: CROWDSTRIKE_CONNECTOR_ID,
  name: CROWDSTRIKE_TITLE,
  getService: (params) => new CrowdstrikeConnector(params),
  schema: {
    config: SentinelOneConfigSchema,
    secrets: SentinelOneSecretsSchema,
  },
  validators: [{ type: ValidatorType.CONFIG, validator: urlAllowListValidator('url') }],
  supportedFeatureIds: [SecurityConnectorFeatureId],
  minimumLicenseRequired: 'enterprise' as const,
  renderParameterTemplates,
});

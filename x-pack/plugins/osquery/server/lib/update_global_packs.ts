/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type {
  ElasticsearchClient,
  SavedObjectsClient,
  SavedObjectsFindResponse,
} from '@kbn/core/server';
import { has, map, mapKeys, set, unset } from 'lodash';
import type { PackagePolicy } from '@kbn/fleet-plugin/common';
import { AGENT_POLICY_SAVED_OBJECT_TYPE } from '@kbn/fleet-plugin/common';
import { produce } from 'immer';
import type { OsqueryAppContextService } from './osquery_app_context_services';
import type { PackSavedObjectAttributes } from '../common/types';
import { packSavedObjectType } from '../../common/types';
import { convertSOQueriesToPack } from '../routes/pack/utils';

export const updateGlobalPacksCreateCallback = async (
  packagePolicy: PackagePolicy,
  packsClient: SavedObjectsClient,
  foundPacks: SavedObjectsFindResponse<PackSavedObjectAttributes>,
  osqueryContext: OsqueryAppContextService,
  esClient: ElasticsearchClient
) => {
  const agentPolicyService = osqueryContext.getAgentPolicyService();

  const packagePolicyService = osqueryContext.getPackagePolicyService();
  const agentPoliciesResult = await agentPolicyService?.getByIds(packsClient, [
    packagePolicy.policy_id,
  ]);
  const list = map(agentPoliciesResult, 'id');
  const agentPolicies = agentPoliciesResult
    ? mapKeys(await agentPolicyService?.getByIds(packsClient, list), 'id')
    : {};

  await Promise.all(
    map(foundPacks.saved_objects, (pack) =>
      packsClient.update(
        packSavedObjectType,
        pack.id,
        {},
        {
          references: [
            ...pack.references,
            {
              id: packagePolicy.policy_id,
              name: agentPolicies[packagePolicy.policy_id]?.name,
              type: AGENT_POLICY_SAVED_OBJECT_TYPE,
            },
          ],
        }
      )
    )
  );
  await packagePolicyService?.update(
    packsClient,
    esClient,
    packagePolicy.id,
    produce<PackagePolicy>(packagePolicy, (draft) => {
      unset(draft, 'id');
      if (!has(draft, 'inputs[0].streams')) {
        set(draft, 'inputs[0].streams', []);
      }

      map(foundPacks.saved_objects, (pack) => {
        set(draft, `inputs[0].config.osquery.value.packs.${pack.attributes.name}`, {
          queries: convertSOQueriesToPack(pack.attributes.queries, {
            removeMultiLines: true,
            removeResultType: true,
          }),
        });
      });

      return draft;
    })
  );
};

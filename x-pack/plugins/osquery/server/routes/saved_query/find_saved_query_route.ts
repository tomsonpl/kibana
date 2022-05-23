/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { schema } from '@kbn/config-schema';
import { IRouter } from '@kbn/core/server';
import { filter } from 'lodash/fp';
import { mapKeys } from 'lodash';
import { OsqueryAppContext } from '../../lib/osquery_app_context_services';
import { OSQUERY_INTEGRATION_NAME, PLUGIN_ID } from '../../../common';
import { savedQuerySavedObjectType } from '../../../common/types';
import { convertECSMappingToObject } from '../utils';

export const findSavedQueryRoute = (router: IRouter, osqueryContext: OsqueryAppContext) => {
  router.get(
    {
      path: '/internal/osquery/saved_query',
      validate: {
        query: schema.object(
          {
            pageIndex: schema.maybe(schema.string()),
            pageSize: schema.maybe(schema.number()),
            sortField: schema.maybe(schema.string()),
            sortOrder: schema.maybe(schema.string()),
          },
          { unknowns: 'allow' }
        ),
      },
      options: { tags: [`access:${PLUGIN_ID}-readSavedQueries`] },
    },
    async (context, request, response) => {
      const coreContext = await context.core;
      const savedObjectsClient = coreContext.savedObjects.client;

      const savedQueries = await savedObjectsClient.find<{
        ecs_mapping: Array<{ field: string; value: string }>;
        prebuilt?: boolean;
      }>({
        type: savedQuerySavedObjectType,
        page: parseInt(request.query.pageIndex ?? '0', 10) + 1,
        perPage: request.query.pageSize,
        sortField: request.query.sortField,
        // @ts-expect-error update types
        sortOrder: request.query.sortDirection ?? 'desc',
      });
      const installation = await osqueryContext.service
        .getPackageService()
        ?.asInternalUser?.getInstallation(OSQUERY_INTEGRATION_NAME);

      let installedWithIntegrationMap: Record<string, unknown>;
      if (installation) {
        const installationSavedQueries = filter(
          ['type', savedQuerySavedObjectType],
          installation.installed_kibana
        );
        installedWithIntegrationMap = mapKeys(installationSavedQueries, (value) => value.id);
      }

      const savedObjects = savedQueries.saved_objects.map((savedObject) => {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        const ecs_mapping = savedObject.attributes.ecs_mapping;

        if (installedWithIntegrationMap[savedObject.id]) {
          savedObject.attributes.prebuilt = true;
        }

        if (ecs_mapping) {
          // @ts-expect-error update types
          savedObject.attributes.ecs_mapping = convertECSMappingToObject(ecs_mapping);
        }

        return savedObject;
      });

      return response.ok({
        body: {
          ...savedQueries,
          saved_objects: savedObjects,
        },
      });
    }
  );
};

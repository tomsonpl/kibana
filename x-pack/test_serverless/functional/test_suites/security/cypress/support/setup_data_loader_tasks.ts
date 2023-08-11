/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import type { LoadedRoleAndUser } from '@kbn/securitysolution-runtime-services';
import {
  createRuntimeServices,
  SecurityRoleAndUserLoader,
} from '@kbn/securitysolution-runtime-services';
import { LoadUserAndRoleCyTaskOptions } from '../cypress';

export const setupUserDataLoader = (
  on: Cypress.PluginEvents,
  config: Cypress.PluginConfigOptions
) => {
  const stackServicesPromise = createRuntimeServices({
    kibanaUrl: config.env.KIBANA_URL,
    elasticsearchUrl: config.env.ELASTICSEARCH_URL,
    fleetServerUrl: config.env.FLEET_SERVER_URL,
    username: config.env.KIBANA_USERNAME,
    password: config.env.KIBANA_PASSWORD,
    esUsername: config.env.ELASTICSEARCH_USERNAME,
    esPassword: config.env.ELASTICSEARCH_PASSWORD,
  });

  const roleAndUserLoaderPromise: Promise<SecurityRoleAndUserLoader> = stackServicesPromise.then(
    ({ kbnClient, log }) => {
      return new SecurityRoleAndUserLoader(kbnClient, log, {});
    }
  );

  on('task', {
    /**
     * Loads a user/role into Kibana. Used from `login()` task.
     * @param name
     */
    loadUserAndRole: async ({ name }: LoadUserAndRoleCyTaskOptions): Promise<LoadedRoleAndUser> => {
      return (await roleAndUserLoaderPromise).load(name);
    },
  });
};

/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import Url from 'url';

import { startRuntimeServices } from '@kbn/security-solution-plugin/scripts/endpoint/endpoint_agent_runner/runtime';
import { FtrProviderContext } from './ftr_provider_context';

import { AgentManager } from './agent';
import { FleetManager } from './fleet_server';
import { createAgentPolicy, getLatestAvailableAgentVersion } from './utils';
export const replaceLocalhostWithDockerInternal = (inputString) => {
  if (typeof inputString === 'string') {
    return inputString.replace(/localhost/g, 'host.docker.internal');
  }
  return inputString;
};
async function setupFleetAgent({ getService }: FtrProviderContext) {
  const log = getService('log');
  const config = getService('config');
  const kbnClient = getService('kibanaServer');

  console.log('1111', config.get('servers.elasticsearch'));
  const elasticUrl = Url.format({
    ...config.get('servers.elasticsearch'),
    hostname: 'host.docker.internal',
  });
  console.log({ elasticUrl });
  const kibanaUrl = Url.format(config.get('servers.kibana'));
  const fleetServerUrl = Url.format({
    protocol: config.get('servers.kibana.protocol'),
    hostname: replaceLocalhostWithDockerInternal(config.get('servers.kibana.hostname')),
    port: config.get('servers.fleetserver.port'),
  });
  const username = config.get('servers.elasticsearch.username');
  const password = config.get('servers.elasticsearch.password');

  await startRuntimeServices({
    log,
    elasticUrl,
    kibanaUrl,
    fleetServerUrl,
    username,
    password,
    version: await getLatestAvailableAgentVersion(kbnClient),
  });

  await new FleetManager(log).setup();

  const policyEnrollmentKey = await createAgentPolicy(kbnClient, log, 'Default policy');
  const policyEnrollmentKeyTwo = await createAgentPolicy(kbnClient, log, 'Osquery policy');

  console.log(
    'SERVERS FLEET SERVER PORT when creating agents',
    config.get('servers.fleetserver.port'),
    elasticUrl,
    fleetServerUrl
  );
  await new AgentManager(policyEnrollmentKey, config.get('servers.fleetserver.port'), log).setup();
  await new AgentManager(
    policyEnrollmentKeyTwo,
    config.get('servers.fleetserver.port'),
    log
  ).setup();
}

export async function startOsqueryCypress(context: FtrProviderContext) {
  const config = context.getService('config');

  await setupFleetAgent(context);

  // Give more time for agent to establish connection with ES
  await new Promise((resolve) => {
    setTimeout(() => {
      resolve('Promise resolved after one minute!');
    }, 60000); // 60000 milliseconds = 1 minute
  });

  return {
    FORCE_COLOR: '1',
    baseUrl: Url.format({
      protocol: config.get('servers.kibana.protocol'),
      hostname: replaceLocalhostWithDockerInternal(config.get('servers.kibana.hostname')),
      port: config.get('servers.kibana.port'),
    }),
    protocol: config.get('servers.kibana.protocol'),
    hostname: replaceLocalhostWithDockerInternal(config.get('servers.kibana.hostname')),
    configport: config.get('servers.kibana.port'),
    ELASTICSEARCH_URL: replaceLocalhostWithDockerInternal(
      Url.format(config.get('servers.elasticsearch'))
    ),
    ELASTICSEARCH_USERNAME: config.get('servers.kibana.username'),
    ELASTICSEARCH_PASSWORD: config.get('servers.kibana.password'),
    KIBANA_URL: Url.format({
      protocol: config.get('servers.kibana.protocol'),
      hostname: replaceLocalhostWithDockerInternal(config.get('servers.kibana.hostname')),
      port: config.get('servers.kibana.port'),
    }),
  };
}

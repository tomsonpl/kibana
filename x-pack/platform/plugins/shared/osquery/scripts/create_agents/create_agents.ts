/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import fetch from 'node-fetch';
import { ToolingLog } from '@kbn/tooling-log';
import { v4 as uuidv4 } from 'uuid';
import yargs from 'yargs';

const logger = new ToolingLog({
  level: 'info',
  writeTo: process.stdout,
});

const AGENTS_INDEX = '.fleet-agents';
const AGENT_ID_PREFIX = 'load-test-agent-';
const AGENT_VERSION = '9.1.0';

const argv = yargs(process.argv.slice(2))
  .usage(
    'Create synthetic Fleet agents for osquery scale testing.\n\n' +
      'Usage:\n' +
      '  node scripts/create_agents --count 50000 --policyId <id>\n\n' +
      'The policyId must be an existing agent policy with the osquery_manager integration.\n' +
      'Find it in Fleet > Agent policies, or create one first.'
  )
  .option('count', {
    alias: 'c',
    type: 'number',
    default: 50000,
    description: 'Number of agents to create',
  })
  .option('policyId', {
    alias: 'p',
    type: 'string',
    demandOption: true,
    description: 'Agent policy ID (must have osquery_manager integration)',
  })
  .option('es', {
    alias: 'e',
    type: 'string',
    default: 'http://elastic:changeme@127.0.0.1:9200',
    description: 'Elasticsearch URL',
  })
  .option('kibana', {
    alias: 'k',
    type: 'string',
    default: 'http://elastic:changeme@127.0.0.1:5601',
    description: 'Kibana URL (for policy validation)',
  })
  .option('batchSize', {
    alias: 'bs',
    type: 'number',
    default: 5000,
    description: 'Documents per bulk request',
  })
  .option('delete', {
    alias: 'd',
    type: 'boolean',
    default: false,
    description: 'Delete previously created load-test agents first',
  })
  .option('deleteOnly', {
    type: 'boolean',
    default: false,
    description: 'Only delete existing agents, do not create new ones',
  })
  .help().argv;

const {
  count,
  policyId,
  es: esUrl,
  kibana: kibanaUrl,
  batchSize,
  delete: deleteFirst,
  deleteOnly,
} = argv;

function getAuth(rawUrl: string): string {
  const url = new URL(rawUrl);
  return (
    'Basic ' +
    Buffer.from(`${url.username || 'elastic'}:${url.password || 'changeme'}`).toString('base64')
  );
}

function getBaseUrl(rawUrl: string): string {
  const url = new URL(rawUrl);
  return `${url.protocol}//${url.host}`;
}

const esAuth = getAuth(esUrl as string);
const esBaseUrl = getBaseUrl(esUrl as string);
const kbnAuth = getAuth(kibanaUrl as string);
const kbnBaseUrl = getBaseUrl(kibanaUrl as string);

/**
 * .fleet-agents is a restricted system index. Even superuser can't write to it
 * via the normal REST API or API keys. We create a Fleet Server service token
 * which has internal access to fleet indices (same mechanism Fleet Server uses).
 */
async function createFleetServiceToken(): Promise<string> {
  const tokenName = `load-test-${Date.now()}`;

  const res = await fetch(
    `${esBaseUrl}/_security/service/elastic/fleet-server/credential/token/${tokenName}`,
    {
      method: 'POST',
      headers: {
        Authorization: esAuth,
        'Content-Type': 'application/json',
      },
    }
  );

  const data = await res.json();
  if (data.error) {
    throw new Error(`Failed to create service token: ${JSON.stringify(data.error)}`);
  }

  logger.info(`  Created Fleet Server service token: ${data.token?.name}`);
  return `Bearer ${data.token?.value}`;
}

let fleetAuth: string;

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const PLATFORMS = ['linux', 'windows', 'darwin'] as const;
const HOSTNAMES_PREFIX = ['web', 'api', 'db', 'worker', 'cache', 'monitor', 'gateway', 'proxy'];

interface AgentDocument {
  access_api_key_id: string;
  active: boolean;
  agent: {
    id: string;
    version: string;
  };
  enrolled_at: string;
  last_checkin: string;
  last_checkin_status: string;
  local_metadata: {
    elastic: {
      agent: {
        id: string;
        version: string;
        snapshot: boolean;
        log_level: string;
        unprivileged: boolean;
      };
    };
    host: {
      architecture: string;
      hostname: string;
      id: string;
      ip: string[];
      mac: string[];
      name: string;
      platform: string;
    };
    os: {
      family: string;
      full: string;
      kernel: string;
      name: string;
      platform: string;
      version: string;
    };
  };
  policy_id: string;
  policy_revision_idx: number;
  type: string;
  tags: string[];
}

function generateAgentDoc(index: number, agentPolicyId: string): AgentDocument {
  const agentId = `${AGENT_ID_PREFIX}${String(index).padStart(6, '0')}`;
  const platform = randomElement([...PLATFORMS]);
  const hostname = `${randomElement(HOSTNAMES_PREFIX)}-${index}`;
  const now = new Date().toISOString();

  const osMap: Record<string, { family: string; full: string; name: string; version: string }> = {
    linux: {
      family: 'debian',
      full: 'Ubuntu 22.04.3 LTS',
      name: 'Ubuntu',
      version: '22.04.3',
    },
    windows: {
      family: 'windows',
      full: 'Windows Server 2022 Datacenter',
      name: 'Windows Server 2022',
      version: '10.0.20348',
    },
    darwin: {
      family: 'darwin',
      full: 'macOS 14.2.1',
      name: 'macOS',
      version: '14.2.1',
    },
  };

  const os = osMap[platform];

  return {
    access_api_key_id: `fake-key-${agentId}`,
    active: true,
    agent: { id: agentId, version: AGENT_VERSION },
    enrolled_at: now,
    last_checkin: now,
    last_checkin_status: 'online',
    local_metadata: {
      elastic: {
        agent: {
          id: agentId,
          version: AGENT_VERSION,
          snapshot: false,
          log_level: 'info',
          unprivileged: false,
        },
      },
      host: {
        architecture: platform === 'darwin' ? 'aarch64' : 'x86_64',
        hostname,
        id: uuidv4(),
        ip: [`10.${Math.floor(index / 65536) % 256}.${Math.floor(index / 256) % 256}.${(index % 256) || 1}`],
        mac: ['00:00:00:00:00:00'],
        name: hostname,
        platform,
      },
      os: {
        family: os.family,
        full: os.full,
        kernel: '5.15.0-91-generic',
        name: os.name,
        platform,
        version: os.version,
      },
    },
    policy_id: agentPolicyId,
    policy_revision_idx: 1,
    type: 'PERMANENT',
    tags: ['load-test'],
  };
}

async function validatePolicy(agentPolicyId: string): Promise<boolean> {
  try {
    const res = await fetch(`${kbnBaseUrl}/api/fleet/agent_policies/${agentPolicyId}`, {
      headers: {
        Authorization: kbnAuth,
        'kbn-xsrf': 'true',
      },
    });

    if (!res.ok) {
      logger.error(`Agent policy ${agentPolicyId} not found (HTTP ${res.status})`);
      return false;
    }

    const data = await res.json();
    const packagePolicies = data.item?.package_policies || [];
    const hasOsquery = packagePolicies.some(
      (pp: { package?: { name: string } }) => pp.package?.name === 'osquery_manager'
    );

    if (!hasOsquery) {
      logger.warning(
        `Policy ${agentPolicyId} exists but does NOT have osquery_manager integration. ` +
          `Agents will be created but won't have osquery until you add the integration.`
      );
    } else {
      logger.info(`Policy ${agentPolicyId} has osquery_manager integration.`);
    }

    return true;
  } catch (err) {
    logger.warning(`Could not validate policy (Kibana may be down): ${err}`);
    logger.info('Proceeding anyway — agents will be created with the provided policy ID.');
    return true;
  }
}

async function deleteExistingAgents(): Promise<void> {
  logger.info('Deleting existing load-test agents...');

  const res = await fetch(`${esBaseUrl}/${AGENTS_INDEX}/_delete_by_query?refresh=true`, {
    method: 'POST',
    headers: {
      Authorization: fleetAuth,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: {
        prefix: { 'agent.id': AGENT_ID_PREFIX },
      },
    }),
  });

  const data = await res.json();
  logger.info(`  Deleted ${data.deleted || 0} agents (took ${data.took || 0}ms)`);
}

async function bulkIndexAgents(
  agents: AgentDocument[]
): Promise<{ success: number; errors: number }> {
  let totalSuccess = 0;
  let totalErrors = 0;
  const batches = Math.ceil(agents.length / batchSize);

  for (let i = 0; i < batches; i++) {
    const start = i * batchSize;
    const end = Math.min(start + batchSize, agents.length);
    const batch = agents.slice(start, end);

    const body =
      batch
        .flatMap((doc) => [
          JSON.stringify({ index: { _index: AGENTS_INDEX, _id: doc.agent.id } }),
          JSON.stringify(doc),
        ])
        .join('\n') + '\n';

    const res = await fetch(`${esBaseUrl}/_bulk`, {
      method: 'POST',
      headers: {
        Authorization: fleetAuth,
        'Content-Type': 'application/x-ndjson',
      },
      body,
    });

    const data = await res.json();

    if (data.errors) {
      const errorItems =
        data.items?.filter(
          (item: { index?: { error?: unknown } }) => item.index?.error
        ) || [];
      totalErrors += errorItems.length;
      totalSuccess += batch.length - errorItems.length;
      if (errorItems.length > 0) {
        logger.warning(`  Batch ${i + 1}/${batches}: ${errorItems.length} errors`);
        logger.warning(`    Sample: ${JSON.stringify(errorItems[0]?.index?.error)}`);
      }
    } else {
      totalSuccess += batch.length;
    }

    logger.info(
      `  Batch ${i + 1}/${batches}: ${batch.length} agents indexed (took ${data.took || 0}ms)`
    );
  }

  return { success: totalSuccess, errors: totalErrors };
}

async function run(): Promise<void> {
  logger.info('Fleet Agent Load Test Generator');
  logger.info('================================');
  logger.info(`  Agents to create: ${count.toLocaleString()}`);
  logger.info(`  Policy ID: ${policyId}`);
  logger.info(`  Agent ID pattern: ${AGENT_ID_PREFIX}000000 .. ${AGENT_ID_PREFIX}${String(count - 1).padStart(6, '0')}`);
  logger.info(`  Batch size: ${batchSize.toLocaleString()}`);
  logger.info(`  Elasticsearch: ${esBaseUrl}`);
  logger.info('');

  logger.info('Creating Fleet Server service token...');
  fleetAuth = await createFleetServiceToken();
  logger.info('');

  if (deleteFirst || deleteOnly) {
    await deleteExistingAgents();
    logger.info('');

    if (deleteOnly) {
      logger.info('Delete only mode — done.');
      return;
    }
  }

  const policyValid = await validatePolicy(policyId as string);
  if (!policyValid) {
    process.exit(1);
  }

  logger.info('');
  logger.info(`Generating ${count.toLocaleString()} agent documents...`);

  const startGen = Date.now();
  const agents: AgentDocument[] = [];
  for (let i = 0; i < count; i++) {
    agents.push(generateAgentDoc(i, policyId as string));
  }
  logger.info(`  Generated in ${((Date.now() - startGen) / 1000).toFixed(1)}s`);

  logger.info('');
  logger.info('Bulk indexing agents...');
  const startIndex = Date.now();
  const { success, errors } = await bulkIndexAgents(agents);
  const indexTime = ((Date.now() - startIndex) / 1000).toFixed(1);

  // Refresh so agents are immediately visible
  await fetch(`${esBaseUrl}/${AGENTS_INDEX}/_refresh`, {
    method: 'POST',
    headers: { Authorization: fleetAuth },
  });

  logger.info('');
  logger.info('================================');
  logger.info(`Done! ${success.toLocaleString()} agents created, ${errors} errors, took ${indexTime}s`);
  logger.info('');
  logger.info('Next steps:');
  logger.info('  1. Open Fleet > Agents in Kibana — you should see the agents');
  logger.info('  2. Run a live query targeting all agents or the policy');
  logger.info(`  3. To clean up: node scripts/create_agents --deleteOnly --policyId ${policyId}`);
}

run().catch((err) => {
  logger.error(`Fatal error: ${err.message}`);
  process.exit(1);
});

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

const ACTIONS_INDEX = '.logs-osquery_manager.actions-default';
const RESPONSES_INDEX = 'logs-osquery_manager.action.responses-default';
const RESULTS_INDEX = 'logs-osquery_manager.result-default';
const AGENT_ID_PREFIX = 'load-test-agent-';

const argv = yargs(process.argv.slice(2))
  .usage(
    'Create a single osquery action with many agent responses and results.\n\n' +
      'Usage:\n' +
      '  node scripts/create_large_action --agents 50000 --resultsPerAgent 10\n\n' +
      'Creates:\n' +
      '  - 1 action document in .logs-osquery_manager.actions-default\n' +
      '  - N response documents in logs-osquery_manager.action.responses-default\n' +
      '  - N×M result documents in logs-osquery_manager.result-default\n\n' +
      'Open the action in Kibana at /app/osquery/live_queries/<action_id>'
  )
  .option('agents', {
    alias: 'a',
    type: 'number',
    default: 50000,
    description: 'Number of agents (= number of response documents)',
  })
  .option('resultsPerAgent', {
    alias: 'r',
    type: 'number',
    default: 10,
    description: 'Result rows per agent',
  })
  .option('errorRate', {
    alias: 'er',
    type: 'number',
    default: 0.02,
    description: 'Fraction of responses that are errors (0.0-1.0)',
  })
  .option('es', {
    alias: 'e',
    type: 'string',
    default: 'http://elastic:changeme@127.0.0.1:9200',
    description: 'Elasticsearch URL',
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
    description: 'Delete previously created load-test action data first',
  })
  .option('deleteOnly', {
    type: 'boolean',
    default: false,
    description: 'Only delete existing data, do not create new action',
  })
  .help().argv;

const {
  agents: agentCount,
  resultsPerAgent,
  errorRate,
  es: esUrl,
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

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function agentId(index: number): string {
  return `${AGENT_ID_PREFIX}${String(index).padStart(6, '0')}`;
}

async function deleteExistingData(): Promise<void> {
  const indices = [
    { index: ACTIONS_INDEX, field: 'agents', prefix: AGENT_ID_PREFIX, label: 'actions' },
    { index: RESPONSES_INDEX, field: 'agent_id', prefix: AGENT_ID_PREFIX, label: 'responses' },
    {
      index: RESULTS_INDEX,
      field: 'elastic_agent.id',
      prefix: AGENT_ID_PREFIX,
      label: 'results',
    },
  ];

  for (const { index, field, prefix, label } of indices) {
    logger.info(`Deleting existing load-test ${label}...`);
    try {
      const res = await fetch(`${esBaseUrl}/${index}/_delete_by_query?conflicts=proceed`, {
        method: 'POST',
        headers: {
          Authorization: esAuth,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: { prefix: { [field]: prefix } } }),
      });
      const data = await res.json();
      logger.info(`  Deleted ${data.deleted || 0} ${label} (took ${data.took || 0}ms)`);
    } catch (err) {
      logger.warning(`  Failed to delete ${label}: ${err}`);
    }
  }
}

async function bulkIndex(
  index: string,
  documents: object[],
  label: string,
  useCreate: boolean = true
): Promise<{ success: number; errors: number; took: number }> {
  let totalSuccess = 0;
  let totalErrors = 0;
  let totalTook = 0;
  const batches = Math.ceil(documents.length / batchSize);

  for (let i = 0; i < batches; i++) {
    const start = i * batchSize;
    const end = Math.min(start + batchSize, documents.length);
    const batch = documents.slice(start, end);

    const action = useCreate ? '{ "create": {} }' : null;
    const body = useCreate
      ? batch.flatMap((doc) => [action, JSON.stringify(doc)]).join('\n') + '\n'
      : batch
          .flatMap((doc) => [JSON.stringify({ index: { _index: index } }), JSON.stringify(doc)])
          .join('\n') + '\n';

    const url = useCreate ? `${esBaseUrl}/${index}/_bulk` : `${esBaseUrl}/_bulk`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: esAuth,
        'Content-Type': 'application/x-ndjson',
      },
      body,
    });

    const data = await res.json();
    const opKey = useCreate ? 'create' : 'index';

    if (data.errors) {
      const errorItems =
        data.items?.filter((item: Record<string, { error?: unknown }>) => item[opKey]?.error) || [];
      totalErrors += errorItems.length;
      totalSuccess += batch.length - errorItems.length;
      if (errorItems.length > 0) {
        logger.warning(`  ${label} batch ${i + 1}/${batches}: ${errorItems.length} errors`);
        logger.warning(`    Sample: ${JSON.stringify(errorItems[0]?.[opKey]?.error)}`);
      }
    } else {
      totalSuccess += batch.length;
    }

    totalTook += data.took || 0;

    if (batches <= 20 || (i + 1) % Math.max(1, Math.floor(batches / 20)) === 0 || i === batches - 1) {
      const pct = (((i + 1) / batches) * 100).toFixed(0);
      logger.info(
        `  ${label}: batch ${i + 1}/${batches} (${pct}%) — ${totalSuccess.toLocaleString()} indexed so far`
      );
    }
  }

  return { success: totalSuccess, errors: totalErrors, took: totalTook };
}

/**
 * Disable ingest pipelines on backing indices, run update_by_query to copy
 * @timestamp into event.ingested, then restore pipelines. This is needed
 * because the Fleet final pipeline overwrites event.ingested with "now",
 * but the osquery results DSL filters by event.ingested within 30 min of @timestamp.
 */
async function fixEventIngested(
  dataStream: string,
  identifierField: string,
  label: string
): Promise<void> {
  logger.info(`  Patching event.ingested on ${label}...`);

  // Resolve backing indices
  const dsRes = await fetch(`${esBaseUrl}/_data_stream/${dataStream}`, {
    headers: { Authorization: esAuth },
  });
  const dsData = await dsRes.json();
  const backingIndices: string[] =
    dsData.data_streams?.[0]?.indices?.map((i: { index_name: string }) => i.index_name) ?? [];

  if (!backingIndices.length) {
    logger.warning(`    No backing indices for ${dataStream}`);
    return;
  }

  // Save and disable pipelines
  const saved: Array<{ index: string; defaultPipeline: string; finalPipeline: string }> = [];

  for (const idx of backingIndices) {
    const settingsRes = await fetch(
      `${esBaseUrl}/${idx}/_settings/index.default_pipeline,index.final_pipeline`,
      { headers: { Authorization: esAuth } }
    );
    const settingsData = await settingsRes.json();
    const s = settingsData[idx]?.settings?.index ?? {};
    saved.push({
      index: idx,
      defaultPipeline: s.default_pipeline ?? '_none',
      finalPipeline: s.final_pipeline ?? '_none',
    });

    await fetch(`${esBaseUrl}/${idx}/_settings`, {
      method: 'PUT',
      headers: { Authorization: esAuth, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        'index.default_pipeline': '_none',
        'index.final_pipeline': '_none',
      }),
    });
  }

  try {
    const ubqRes = await fetch(
      `${esBaseUrl}/${dataStream}/_update_by_query?conflicts=proceed&wait_for_completion=true`,
      {
        method: 'POST',
        headers: { Authorization: esAuth, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: { prefix: { [identifierField]: AGENT_ID_PREFIX } },
          script: {
            source: `
            if (ctx._source.event == null) { ctx._source.event = new HashMap(); }
            ctx._source.event.ingested = ctx._source['@timestamp'];
          `,
            lang: 'painless',
          },
        }),
      }
    );

    const ubqData = await ubqRes.json();
    logger.info(`    Patched ${ubqData.updated || 0} docs (took ${ubqData.took || 0}ms)`);
  } finally {
    for (const { index, defaultPipeline, finalPipeline } of saved) {
      await fetch(`${esBaseUrl}/${index}/_settings`, {
        method: 'PUT',
        headers: { Authorization: esAuth, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          'index.default_pipeline': defaultPipeline,
          'index.final_pipeline': finalPipeline,
        }),
      });
    }
  }
}

async function run(): Promise<void> {
  const totalResults = agentCount * resultsPerAgent;

  logger.info('Osquery Large Action Generator');
  logger.info('================================');
  logger.info(`  Agents (responses): ${agentCount.toLocaleString()}`);
  logger.info(`  Results per agent: ${resultsPerAgent}`);
  logger.info(`  Total result rows: ${totalResults.toLocaleString()}`);
  logger.info(`  Error rate: ${(errorRate * 100).toFixed(1)}%`);
  logger.info(`  Batch size: ${batchSize.toLocaleString()}`);
  logger.info(`  Elasticsearch: ${esBaseUrl}`);
  logger.info('');

  if (deleteFirst || deleteOnly) {
    await deleteExistingData();
    logger.info('');

    if (deleteOnly) {
      logger.info('Delete only mode — done.');
      return;
    }
  }

  const actionId = uuidv4();
  const queryActionId = uuidv4();
  const now = new Date();
  const timestamp = now.toISOString();
  // Set expiration far in the past so the action shows as "completed"
  const expiration = new Date(now.getTime() - 60 * 1000).toISOString();

  // Build agent ID list
  const agentIds: string[] = [];
  for (let i = 0; i < agentCount; i++) {
    agentIds.push(agentId(i));
  }

  // --- 1. Create action document ---
  logger.info('Creating action document...');
  const actionDoc = {
    action_id: actionId,
    '@timestamp': timestamp,
    expiration,
    type: 'INPUT_ACTION',
    input_type: 'osquery',
    agents: agentIds,
    user_id: 'load-test-user',
    user_profile_uid: 'u_load_test_0',
    space_id: 'default',
    metadata: { createdBy: 'load-test-large-action' },
    queries: [
      {
        action_id: queryActionId,
        id: 'load-test-query',
        query: 'SELECT pid, name, path, cmdline, uid FROM processes;',
        agents: agentIds,
      },
    ],
  };

  const actionRes = await fetch(`${esBaseUrl}/${ACTIONS_INDEX}/_doc/${actionId}`, {
    method: 'PUT',
    headers: {
      Authorization: esAuth,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(actionDoc),
  });

  const actionResult = await actionRes.json();
  if (actionResult.error) {
    logger.error(`Failed to create action: ${JSON.stringify(actionResult.error)}`);
    process.exit(1);
  }
  logger.info(`  Action created: ${actionId}`);
  logger.info(`  Query action ID: ${queryActionId}`);

  // --- 2. Create response documents (one per agent) ---
  logger.info('');
  logger.info(`Generating ${agentCount.toLocaleString()} response documents...`);

  const responses: object[] = [];
  const errorAgents = new Set<number>();

  for (let i = 0; i < agentCount; i++) {
    const isError = Math.random() < errorRate;
    if (isError) errorAgents.add(i);

    const startedAt = new Date(now.getTime() + randomInt(1, 5) * 1000);
    const completedAt = new Date(startedAt.getTime() + randomInt(1, 30) * 1000);

    const responseDoc: Record<string, unknown> = {
      '@timestamp': completedAt.toISOString(),
      action_id: queryActionId,
      action_input_type: 'osquery',
      agent_id: agentId(i),
      action_data: {
        id: 'load-test-query',
        query: 'SELECT pid, name, path, cmdline, uid FROM processes;',
      },
      action_response: {
        osquery: {
          count: isError ? 0 : resultsPerAgent,
        },
      },
      started_at: startedAt.toISOString(),
      completed_at: completedAt.toISOString(),
    };

    if (isError) {
      responseDoc.error = randomElement([
        'Query execution timeout',
        'osquery process not running',
        'Agent disconnected',
        'Query syntax error',
      ]);
    }

    responses.push(responseDoc);
  }

  const respResult = await bulkIndex(RESPONSES_INDEX, responses, 'Responses');
  logger.info(
    `  Responses: ${respResult.success.toLocaleString()} indexed, ${respResult.errors} errors (took ${respResult.took}ms)`
  );

  // --- 3. Create result documents (N per successful agent) ---
  logger.info('');
  const successfulAgents = agentCount - errorAgents.size;
  const actualTotalResults = successfulAgents * resultsPerAgent;
  logger.info(
    `Generating ${actualTotalResults.toLocaleString()} result documents (${successfulAgents.toLocaleString()} successful agents × ${resultsPerAgent} rows)...`
  );

  // Generate and index results in streaming batches to avoid OOM
  let resultsIndexed = 0;
  let resultsErrors = 0;
  let batch: object[] = [];

  const PROCESS_NAMES = [
    'systemd',
    'sshd',
    'nginx',
    'node',
    'python3',
    'bash',
    'cron',
    'dockerd',
    'kubelet',
    'containerd',
    'chrome',
    'postgres',
    'redis-server',
    'java',
    'go',
  ];

  const PROCESS_PATHS = [
    '/usr/bin/node',
    '/usr/sbin/sshd',
    '/usr/sbin/nginx',
    '/usr/bin/python3',
    '/bin/bash',
    '/usr/sbin/cron',
    '/usr/bin/dockerd',
    '/usr/bin/kubelet',
    '/usr/bin/chrome',
    '/usr/bin/postgres',
    '/usr/bin/redis-server',
    '/usr/bin/java',
    '/usr/local/go/bin/go',
  ];

  let totalBatches = 0;

  for (let i = 0; i < agentCount; i++) {
    if (errorAgents.has(i)) continue;

    const aid = agentId(i);
    const completedAt = new Date(now.getTime() + randomInt(2, 35) * 1000).toISOString();

    for (let row = 0; row < resultsPerAgent; row++) {
      batch.push({
        '@timestamp': completedAt,
        action_id: queryActionId,
        agent: { name: `host-${aid}`, id: aid },
        elastic_agent: { id: aid },
        event: { ingested: completedAt },
        osquery: {
          pid: randomInt(1, 65535),
          name: randomElement(PROCESS_NAMES),
          path: randomElement(PROCESS_PATHS),
          cmdline: `${randomElement(PROCESS_PATHS)} --flag-${randomInt(1, 100)}`,
          uid: randomInt(0, 1000),
        },
      });

      if (batch.length >= batchSize) {
        totalBatches++;
        const res = await bulkIndex(RESULTS_INDEX, batch, 'Results');
        resultsIndexed += res.success;
        resultsErrors += res.errors;
        batch = [];
      }
    }
  }

  // Flush remaining
  if (batch.length > 0) {
    const res = await bulkIndex(RESULTS_INDEX, batch, 'Results');
    resultsIndexed += res.success;
    resultsErrors += res.errors;
  }

  logger.info(
    `  Results: ${resultsIndexed.toLocaleString()} indexed, ${resultsErrors} errors`
  );

  // --- 4. Fix event.ingested timestamps ---
  logger.info('');
  logger.info('Refreshing indices...');
  await fetch(`${esBaseUrl}/${RESPONSES_INDEX},${RESULTS_INDEX}/_refresh`, {
    method: 'POST',
    headers: { Authorization: esAuth },
  });

  logger.info('Fixing event.ingested timestamps (required for time-range filters)...');
  await fixEventIngested(RESPONSES_INDEX, 'agent_id', 'responses');
  await fixEventIngested(RESULTS_INDEX, 'elastic_agent.id', 'results');

  // --- Done ---
  logger.info('');
  logger.info('================================');
  logger.info('Done!');
  logger.info(`  Action ID: ${actionId}`);
  logger.info(`  Query Action ID: ${queryActionId}`);
  logger.info(`  Responses: ${respResult.success.toLocaleString()} (${errorAgents.size} errors, ${successfulAgents.toLocaleString()} successful)`);
  logger.info(`  Results: ${resultsIndexed.toLocaleString()} rows`);
  logger.info('');
  logger.info('Open in Kibana:');
  logger.info(`  http://localhost:5601/app/osquery/live_queries/${actionId}`);
  logger.info('');
  logger.info('API test endpoints:');
  logger.info(`  GET /api/osquery/live_queries/${actionId}`);
  logger.info(`  GET /api/osquery/live_queries/${actionId}/results/${queryActionId}`);
  logger.info('');
  logger.info('To clean up:');
  logger.info('  node scripts/create_large_action --deleteOnly');
}

run().catch((err) => {
  logger.error(`Fatal error: ${err.message}`);
  process.exit(1);
});

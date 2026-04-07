/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import fetch from 'node-fetch';
import { ToolingLog } from '@kbn/tooling-log';
import yargs from 'yargs';

const logger = new ToolingLog({
  level: 'info',
  writeTo: process.stdout,
});

const ACTIONS_INDEX = '.logs-osquery_manager.actions-*';
const RESPONSES_INDEX = 'logs-osquery_manager.action.responses-default';
const RESULTS_INDEX = 'logs-osquery_manager.result-default';

const argv = yargs(process.argv.slice(2))
  .usage(
    'Simulate agent responses for a live osquery action.\n\n' +
      'Usage:\n' +
      '  1. Fire a live query in Kibana targeting your mock agents\n' +
      '  2. Run: node scripts/simulate_responses --actionId <id>\n' +
      '     OR:  node scripts/simulate_responses --watch\n\n' +
      'In --watch mode, polls for new actions every few seconds and auto-responds.'
  )
  .option('actionId', {
    alias: 'id',
    type: 'string',
    description: 'Action ID to simulate responses for',
  })
  .option('watch', {
    alias: 'w',
    type: 'boolean',
    default: false,
    description: 'Watch for new actions and auto-respond',
  })
  .option('pollInterval', {
    type: 'number',
    default: 3,
    description: 'Seconds between polls in watch mode',
  })
  .option('resultsPerAgent', {
    alias: 'r',
    type: 'number',
    default: 10,
    description: 'Result rows per agent per query',
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
  .check((args) => {
    if (!args.actionId && !args.watch) {
      throw new Error('Provide --actionId <id> or --watch');
    }
    return true;
  })
  .help().argv;

const {
  actionId: targetActionId,
  watch,
  pollInterval,
  resultsPerAgent,
  errorRate,
  es: esUrl,
  batchSize,
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

const PROCESS_NAMES = [
  'systemd', 'sshd', 'nginx', 'node', 'python3', 'bash', 'cron',
  'dockerd', 'kubelet', 'containerd', 'chrome', 'postgres', 'redis-server',
];

const PROCESS_PATHS = [
  '/usr/bin/node', '/usr/sbin/sshd', '/usr/sbin/nginx', '/usr/bin/python3',
  '/bin/bash', '/usr/sbin/cron', '/usr/bin/dockerd', '/usr/bin/kubelet',
];

interface ActionSource {
  action_id: string;
  agents: string[];
  queries: Array<{
    action_id: string;
    id: string;
    query: string;
    agents: string[];
  }>;
}

async function fetchAction(actionId: string): Promise<ActionSource | null> {
  const res = await fetch(`${esBaseUrl}/${ACTIONS_INDEX}/_search`, {
    method: 'POST',
    headers: { Authorization: esAuth, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: { term: { action_id: actionId } },
      size: 1,
    }),
  });

  const data = await res.json();
  const hit = data.hits?.hits?.[0];
  return hit?._source ?? null;
}

async function hasResponses(queryActionId: string): Promise<boolean> {
  const res = await fetch(`${esBaseUrl}/${RESPONSES_INDEX}/_count`, {
    method: 'POST',
    headers: { Authorization: esAuth, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: { term: { action_id: queryActionId } },
    }),
  });

  const data = await res.json();
  return (data.count || 0) > 0;
}

async function bulkIndex(
  index: string,
  documents: object[],
  label: string
): Promise<number> {
  let totalSuccess = 0;
  const batches = Math.ceil(documents.length / batchSize);

  for (let i = 0; i < batches; i++) {
    const start = i * batchSize;
    const end = Math.min(start + batchSize, documents.length);
    const batch = documents.slice(start, end);

    const body =
      batch.flatMap((doc) => ['{ "create": {} }', JSON.stringify(doc)]).join('\n') + '\n';

    const res = await fetch(`${esBaseUrl}/${index}/_bulk`, {
      method: 'POST',
      headers: { Authorization: esAuth, 'Content-Type': 'application/x-ndjson' },
      body,
    });

    const data = await res.json();

    if (data.errors) {
      const errorItems =
        data.items?.filter((item: { create?: { error?: unknown } }) => item.create?.error) || [];
      totalSuccess += batch.length - errorItems.length;
      if (errorItems.length > 0) {
        logger.warning(`  ${label} batch ${i + 1}/${batches}: ${errorItems.length} errors`);
        logger.warning(`    Sample: ${JSON.stringify(errorItems[0]?.create?.error)}`);
      }
    } else {
      totalSuccess += batch.length;
    }

    if (batches <= 20 || (i + 1) % Math.max(1, Math.floor(batches / 10)) === 0 || i === batches - 1) {
      logger.info(`  ${label}: batch ${i + 1}/${batches} — ${totalSuccess.toLocaleString()} so far`);
    }
  }

  return totalSuccess;
}

async function fixEventIngested(
  dataStream: string,
  identifierField: string,
  identifierValues: string[],
  label: string
): Promise<void> {
  logger.info(`  Patching event.ingested on ${label}...`);

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

  const saved: Array<{ index: string; defaultPipeline: string; finalPipeline: string }> = [];

  for (const idx of backingIndices) {
    const sRes = await fetch(
      `${esBaseUrl}/${idx}/_settings/index.default_pipeline,index.final_pipeline`,
      { headers: { Authorization: esAuth } }
    );
    const sData = await sRes.json();
    const s = sData[idx]?.settings?.index ?? {};
    saved.push({
      index: idx,
      defaultPipeline: s.default_pipeline ?? '_none',
      finalPipeline: s.final_pipeline ?? '_none',
    });

    await fetch(`${esBaseUrl}/${idx}/_settings`, {
      method: 'PUT',
      headers: { Authorization: esAuth, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 'index.default_pipeline': '_none', 'index.final_pipeline': '_none' }),
    });
  }

  try {
    // Use terms query with a sample of agent IDs to match synthetic data
    const prefixes = [...new Set(identifierValues.map((v) => v.substring(0, 20)))];
    const prefixQueries = prefixes.slice(0, 100).map((p) => ({ prefix: { [identifierField]: p } }));

    const ubqRes = await fetch(
      `${esBaseUrl}/${dataStream}/_update_by_query?conflicts=proceed`,
      {
        method: 'POST',
        headers: { Authorization: esAuth, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: { bool: { should: prefixQueries, minimum_should_match: 1 } },
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

async function simulateResponses(action: ActionSource): Promise<void> {
  const startTime = Date.now();
  logger.info(`Simulating responses for action ${action.action_id}`);
  logger.info(`  Queries: ${action.queries.length}`);
  logger.info(`  Agents: ${action.agents.length.toLocaleString()}`);
  logger.info(`  Results per agent: ${resultsPerAgent}`);
  logger.info('');

  const now = new Date();
  let totalResponses = 0;
  let totalResults = 0;
  const allAgentIds: string[] = [];

  for (const query of action.queries) {
    const agents = query.agents?.length ? query.agents : action.agents;
    logger.info(`Query "${query.id}" (${query.action_id}) — ${agents.length.toLocaleString()} agents`);

    // --- Responses ---
    const responses: object[] = [];
    const errorAgents = new Set<number>();

    for (let i = 0; i < agents.length; i++) {
      const isError = Math.random() < errorRate;
      if (isError) errorAgents.add(i);

      const startedAt = new Date(now.getTime() + randomInt(1, 5) * 1000);
      const completedAt = new Date(startedAt.getTime() + randomInt(1, 30) * 1000);

      const doc: Record<string, unknown> = {
        '@timestamp': completedAt.toISOString(),
        action_id: query.action_id,
        action_input_type: 'osquery',
        agent_id: agents[i],
        action_data: { id: query.id, query: query.query },
        action_response: { osquery: { count: isError ? 0 : resultsPerAgent } },
        started_at: startedAt.toISOString(),
        completed_at: completedAt.toISOString(),
      };

      if (isError) {
        doc.error = randomElement([
          'Query execution timeout',
          'osquery process not running',
          'Agent disconnected',
        ]);
      }

      responses.push(doc);
    }

    const respCount = await bulkIndex(RESPONSES_INDEX, responses, 'Responses');
    totalResponses += respCount;
    logger.info(`  ${respCount.toLocaleString()} responses indexed (${errorAgents.size} errors)`);

    // --- Results ---
    logger.info(`  Generating results...`);
    let batch: object[] = [];
    let queryResults = 0;

    for (let i = 0; i < agents.length; i++) {
      if (errorAgents.has(i)) continue;

      const aid = agents[i];
      allAgentIds.push(aid);
      const completedAt = new Date(now.getTime() + randomInt(2, 35) * 1000).toISOString();

      for (let row = 0; row < resultsPerAgent; row++) {
        batch.push({
          '@timestamp': completedAt,
          action_id: query.action_id,
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
          queryResults += await bulkIndex(RESULTS_INDEX, batch, 'Results');
          batch = [];
        }
      }
    }

    if (batch.length > 0) {
      queryResults += await bulkIndex(RESULTS_INDEX, batch, 'Results');
    }

    totalResults += queryResults;
    logger.info(`  ${queryResults.toLocaleString()} results indexed`);
    logger.info('');
  }

  // Refresh and fix timestamps
  logger.info('Refreshing indices...');
  await fetch(`${esBaseUrl}/${RESPONSES_INDEX},${RESULTS_INDEX}/_refresh`, {
    method: 'POST',
    headers: { Authorization: esAuth },
  });

  logger.info('Fixing event.ingested timestamps...');
  await fixEventIngested(RESPONSES_INDEX, 'agent_id', allAgentIds, 'responses');
  await fixEventIngested(RESULTS_INDEX, 'elastic_agent.id', allAgentIds, 'results');

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  logger.info('');
  logger.info(`Done! ${totalResponses.toLocaleString()} responses + ${totalResults.toLocaleString()} results in ${elapsed}s`);
}

async function findNewActions(): Promise<ActionSource[]> {
  const res = await fetch(`${esBaseUrl}/${ACTIONS_INDEX}/_search`, {
    method: 'POST',
    headers: { Authorization: esAuth, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: {
        bool: {
          must: [
            { term: { input_type: 'osquery' } },
            { range: { '@timestamp': { gte: 'now-5m' } } },
          ],
        },
      },
      sort: [{ '@timestamp': 'desc' }],
      size: 10,
    }),
  });

  const data = await res.json();
  return (data.hits?.hits || []).map((h: { _source: ActionSource }) => h._source);
}

const processedActions = new Set<string>();

async function watchLoop(): Promise<void> {
  logger.info(`Watching for new actions (polling every ${pollInterval}s)...`);
  logger.info('Fire a live query in Kibana and responses will appear automatically.');
  logger.info('Press Ctrl+C to stop.\n');

  while (true) {
    try {
      const actions = await findNewActions();

      for (const action of actions) {
        if (processedActions.has(action.action_id)) continue;

        // Check if responses already exist
        const firstQueryId = action.queries?.[0]?.action_id;
        if (firstQueryId && (await hasResponses(firstQueryId))) {
          processedActions.add(action.action_id);
          continue;
        }

        if (!action.queries?.length || !action.agents?.length) {
          processedActions.add(action.action_id);
          continue;
        }

        logger.info(`\nNew action detected: ${action.action_id} (${action.agents.length.toLocaleString()} agents)\n`);
        processedActions.add(action.action_id);

        await simulateResponses(action);
        logger.info('\nResuming watch...\n');
      }
    } catch (err) {
      logger.warning(`Poll error: ${err}`);
    }

    await new Promise((resolve) => setTimeout(resolve, pollInterval * 1000));
  }
}

async function run(): Promise<void> {
  logger.info('Osquery Response Simulator');
  logger.info('================================\n');

  if (watch) {
    await watchLoop();
  } else {
    const action = await fetchAction(targetActionId as string);
    if (!action) {
      logger.error(`Action ${targetActionId} not found`);
      process.exit(1);
    }
    await simulateResponses(action);
  }
}

run().catch((err) => {
  logger.error(`Fatal error: ${err.message}`);
  process.exit(1);
});

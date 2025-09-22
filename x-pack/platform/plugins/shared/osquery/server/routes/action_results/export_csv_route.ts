/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { lastValueFrom } from 'rxjs';
import type { IRouter } from '@kbn/core/server';
import type { DataRequestHandlerContext } from '@kbn/data-plugin/server';
import { getRequestAbortedSignal } from '@kbn/data-plugin/server';
import { get, isEmpty } from 'lodash/fp';
import type {
  ExportCsvRequestQuerySchema,
  ExportCsvRequestParamsSchema,
} from '../../../common/api/export_csv/export_csv_route';
import {
  exportCsvRequestQuerySchema,
  exportCsvRequestParamsSchema,
} from '../../../common/api/export_csv/export_csv_route';
import { buildRouteValidation } from '../../utils/build_validation/route_validation';

import { API_VERSIONS } from '../../../common/constants';
import { PLUGIN_ID, OSQUERY_INTEGRATION_NAME } from '../../../common';
import type { OsqueryAppContext } from '../../lib/osquery_app_context_services';
import { Direction, OsqueryQueries } from '../../../common/search_strategy';
import type { ResultsRequestOptions, ResultsStrategyResponse, ResultEdges } from '../../../common/search_strategy';
import { generateTablePaginationOptions } from '../../../common/utils/build_query';
import { createInternalSavedObjectsClientForSpaceId } from '../../utils/get_internal_saved_object_client';

// Server-side CSV formatting utilities
const escapeCsvValue = (value: unknown): string => {
  if (value == null) return '';

  const stringValue = String(value);

  // Check if escaping is needed
  if (
    stringValue.includes(',') ||
    stringValue.includes('"') ||
    stringValue.includes('\n') ||
    stringValue.includes('\r') ||
    /^[=+\-@]/.test(stringValue)
  ) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
};

const formatArrayValue = (arr: unknown[], format: 'json' | 'pipe-separated'): string => {
  if (format === 'pipe-separated') {
    return arr.map(item =>
      typeof item === 'object' && item !== null
        ? JSON.stringify(item)
        : String(item)
    ).join(' | ');
  }
  return JSON.stringify(arr);
};

const formatObjectValue = (
  obj: Record<string, unknown>,
  format: 'json' | 'key-value',
  depth: number = 0,
  maxDepth: number = 3
): string => {
  if (depth >= maxDepth) {
    return '[Object - Max Depth Reached]';
  }

  if (format === 'key-value') {
    const pairs = Object.entries(obj)
      .filter(([, value]) => value != null)
      .map(([key, value]) => {
        if (typeof value === 'object' && value !== null) {
          if (Array.isArray(value)) {
            return `${key}: [${formatArrayValue(value, 'pipe-separated')}]`;
          }
          return `${key}: {${formatObjectValue(value as Record<string, unknown>, format, depth + 1, maxDepth)}}`;
        }
        return `${key}: ${String(value)}`;
      });
    return pairs.join(', ');
  }
  return JSON.stringify(obj);
};

const formatFieldValue = (
  fieldValue: unknown,
  columnId: string,
  options: {
    arrayFormat?: 'json' | 'pipe-separated';
    objectFormat?: 'json' | 'key-value';
    maxDepth?: number;
  } = {}
): string => {
  const {
    arrayFormat = 'pipe-separated',
    objectFormat = 'key-value',
    maxDepth = 3,
  } = options;

  if (fieldValue == null) {
    return '';
  }

  if (columnId === 'agent.name') {
    return String(fieldValue);
  }

  if (Array.isArray(fieldValue)) {
    if (fieldValue.length === 0) {
      return '[]';
    }
    try {
      return formatArrayValue(fieldValue, arrayFormat);
    } catch (error) {
      return `[Array with ${fieldValue.length} items]`;
    }
  }

  if (typeof fieldValue === 'object' && fieldValue !== null) {
    try {
      return formatObjectValue(fieldValue as Record<string, unknown>, objectFormat, 0, maxDepth);
    } catch (error) {
      return '[Object - Formatting Error]';
    }
  }

  if (typeof fieldValue === 'boolean') {
    return fieldValue ? 'true' : 'false';
  }

  if (typeof fieldValue === 'number') {
    return isFinite(fieldValue) ? String(fieldValue) : 'Invalid Number';
  }

  return String(fieldValue);
};


export const exportCsvRoute = (
  router: IRouter<DataRequestHandlerContext>,
  osqueryContext: OsqueryAppContext
) => {
  router.versioned
    .get({
      access: 'public',
      path: '/api/osquery/live_queries/{liveQueryActionId}/results/{actionId}/export',
      security: {
        authz: {
          requiredPrivileges: [`${PLUGIN_ID}-readLiveQueries`],
        },
      },
    })
    .addVersion(
      {
        version: API_VERSIONS.public.v1,
        validate: {
          request: {
            params: buildRouteValidation<
              typeof exportCsvRequestParamsSchema,
              ExportCsvRequestParamsSchema
            >(exportCsvRequestParamsSchema),
            query: buildRouteValidation<
              typeof exportCsvRequestQuerySchema,
              ExportCsvRequestQuerySchema
            >(exportCsvRequestQuerySchema),
          },
        },
      },
      async (context, request, response) => {
        const abortSignal = getRequestAbortedSignal(request.events.aborted$);

        try {
          const logger = osqueryContext.logFactory.get('export_csv');
          logger.debug(`CSV export requested for action: ${request.params.actionId}`);

          // Get integration namespaces (same pattern as other routes)
          let integrationNamespaces: Record<string, string[]> = {};
          if (osqueryContext?.service?.getIntegrationNamespaces) {
            const spaceScopedClient = await createInternalSavedObjectsClientForSpaceId(
              osqueryContext,
              request
            );
            integrationNamespaces = await osqueryContext.service.getIntegrationNamespaces(
              [OSQUERY_INTEGRATION_NAME],
              spaceScopedClient,
              logger
            );
          }

          const search = await context.search;

          // Fetch all results by iterating through pages
          const allResults: ResultEdges = [];
          const columns: string[] = [];
          let currentPage = 0;
          const pageSize = 1000; // Fixed page size for internal data fetching
          let hasMoreData = true;
          let totalCount = 0;

          while (hasMoreData) {
            const res = await lastValueFrom(
              search.search<ResultsRequestOptions, ResultsStrategyResponse>(
                {
                  actionId: request.params.actionId,
                  factoryQueryType: OsqueryQueries.results,
                  kuery: request.query.kuery,
                  startDate: request.query.startDate,
                  pagination: generateTablePaginationOptions(currentPage, pageSize),
                  sort: [{
                    direction: (request.query.sortOrder === 'asc' ? Direction.asc : Direction.desc),
                    field: request.query.sort ?? '@timestamp',
                  }],
                  integrationNamespaces: integrationNamespaces[OSQUERY_INTEGRATION_NAME]?.length
                    ? integrationNamespaces[OSQUERY_INTEGRATION_NAME]
                    : undefined,
                },
                { abortSignal, strategy: 'osquerySearchStrategy' }
              )
            );

            const pageResults = res.edges || [];
            allResults.push(...pageResults);

            // Get columns from first page
            if (currentPage === 0 && pageResults.length > 0) {
              const firstRowFields = pageResults[0].fields || {};
              columns.push(...Object.keys(firstRowFields).sort());
              totalCount = res.total || 0;
            }

            // Check if we have more pages
            hasMoreData = pageResults.length === pageSize && allResults.length < totalCount;
            currentPage++;

            // Safety break
            if (currentPage > 100) {
              logger.warn('Reached maximum page limit during CSV export');
              break;
            }
          }

          logger.debug(`Fetched ${allResults.length} results for CSV export`);

          if (!allResults.length || !columns.length) {
            return response.ok({
              body: '',
              headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="osquery-results-${request.params.actionId}-${new Date().toISOString().split('T')[0]}.csv"`,
              },
            });
          }

          // Generate CSV content
          const csvOptions = {
            arrayFormat: request.query.arrayFormat || 'pipe-separated',
            objectFormat: request.query.objectFormat || 'key-value',
            maxDepth: request.query.maxDepth || 3,
          };

          // Create headers
          const headers = columns.map(col => escapeCsvValue(col));
          if (request.query.includeRowNumbers) {
            headers.unshift('Row #');
          }
          const csvLines = [headers.join(',')];

          // Process each row
          allResults.forEach((row, rowIndex) => {
            const csvRow = columns.map((columnId) => {
              // Get field value from row data, trying both fields and _source
              let fieldValue: unknown = row.fields?.[columnId];

              // If not found in fields, try _source (for ECS fields)
              if (fieldValue === undefined || fieldValue === null) {
                fieldValue = get(columnId, row._source);
              }

              // Extract first element from array (Elasticsearch pattern)
              if (Array.isArray(fieldValue) && fieldValue.length > 0) {
                fieldValue = fieldValue[0];
              }

              // Use empty value for null/undefined
              if (isEmpty(fieldValue)) {
                fieldValue = '-';
              }

              const formattedValue = formatFieldValue(fieldValue, columnId, csvOptions);
              return escapeCsvValue(formattedValue);
            });

            if (request.query.includeRowNumbers) {
              csvRow.unshift(String(rowIndex + 1));
            }

            csvLines.push(csvRow.join(','));
          });

          const csvContent = csvLines.join('\n');
          const filename = `osquery-results-${request.params.actionId.substring(0, 8)}-${new Date().toISOString().split('T')[0]}.csv`;

          logger.debug(`Generated CSV with ${csvLines.length - 1} rows`);

          return response.ok({
            body: csvContent,
            headers: {
              'Content-Type': 'text/csv; charset=utf-8',
              'Content-Disposition': `attachment; filename="${filename}"`,
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache',
            },
          });

        } catch (err) {
          const error = err as Error;
          const logger = osqueryContext.logFactory.get('export_csv');
          logger.error(`CSV export failed: ${error.message}`);

          return response.customError({
            statusCode: 500,
            body: { message: `CSV export failed: ${error.message}` },
          });
        }
      }
    );
};
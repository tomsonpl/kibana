/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { useCallback, useState } from 'react';
import type { EuiDataGridColumn } from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import { useKibana } from '../../common/lib/kibana';
import type { ResultEdges, Direction } from '../../../common/search_strategy';
import type { ECSMapping } from 'src/platform/packages/shared/kbn-osquery-io-ts-types/src/live_query';
import {
  formatResultsAsCSV,
  generateCsvFilename,
  type CsvExportOptions,
} from '../../../common/utils/csv_formatter';
import { API_VERSIONS } from '../../../common/constants';

export interface UseCsvExportProps {
  actionId: string;
  data: ResultEdges;
  columns: EuiDataGridColumn[];
  ecsMapping?: ECSMapping;
  /** Current page data for page-specific exports */
  currentPageData?: ResultEdges;
  /** Additional parameters for fetching all results */
  liveQueryActionId?: string;
  startDate?: string;
  sort: Array<{ field: string; direction: Direction }>;
  kuery?: string;
}

export interface ExportProgress {
  /** Export phase description */
  phase: 'preparing' | 'formatting' | 'downloading' | 'complete';
  /** Progress percentage (0-100) */
  percentage: number;
  /** Number of rows processed */
  processedRows?: number;
  /** Total rows to process */
  totalRows?: number;
}

export interface UseCsvExportReturn {
  exportToCsv: (options?: CsvExportOptions) => void;
  isExporting: boolean;
  progress?: ExportProgress;
  error?: string;
}

export const useCsvExport = ({
  actionId,
  data,
  columns,
  ecsMapping,
  currentPageData,
  liveQueryActionId,
  startDate,
  sort,
  kuery,
}: UseCsvExportProps): UseCsvExportReturn => {
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState<ExportProgress | undefined>();
  const [error, setError] = useState<string | undefined>();
  const { notifications, http } = useKibana().services;

  // Threshold for switching to server-side processing
  const SERVER_SIDE_THRESHOLD = 1000;

  // Function to use server-side CSV export for large datasets
  const fetchCsvFromServer = useCallback(async (options: CsvExportOptions): Promise<void> => {
    try {
      const queryParams = new URLSearchParams({
        ...(sort.length > 0 && {
          sort: sort[0].field,
          sortOrder: sort[0].direction,
        }),
        ...(kuery && { kuery }),
        ...(startDate && { startDate }),
        // CSV formatting options
        arrayFormat: options.arrayFormat || 'pipe-separated',
        objectFormat: options.objectFormat || 'key-value',
        maxDepth: String(options.maxDepth || 3),
        ...(options.includeRowNumbers && { includeRowNumbers: 'true' }),
      });

      const url = `/api/osquery/live_queries/${liveQueryActionId}/results/${actionId}/export`;

      // Use Kibana HTTP client for proper authentication
      const response = await http.fetch(url, {
        method: 'GET',
        version: API_VERSIONS.public.v1,
        query: Object.fromEntries(queryParams.entries()),
        asResponse: true,
        asSystemRequest: false,
      });

      if (!response.response?.ok) {
        throw new Error(`Server responded with ${response.response?.status}: ${response.response?.statusText}`);
      }

      // Get filename from Content-Disposition header
      const contentDisposition = response.response.headers.get('Content-Disposition') || '';
      const filenameMatch = contentDisposition.match(/filename="(.+)"/);
      const filename = filenameMatch?.[1] || `osquery-results-${actionId.substring(0, 8)}-server-${new Date().toISOString().split('T')[0]}.csv`;


      // Create blob and download
      const blob = new Blob([response.body as string], { type: 'text/csv' });
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      link.style.display = 'none';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);

    } catch (error) {
      throw new Error(`Server-side CSV export failed: ${error}`);
    }
  }, [actionId, liveQueryActionId, startDate, sort, kuery]);

  // Function to manually fetch all results by fetching multiple pages
  const fetchAllResultsData = useCallback(async (): Promise<ResultEdges> => {
    try {
      const allResults: ResultEdges = [];
      let currentPage = 0;
      const pageSize = 1000; // Use a reasonable page size (less than 10,000 limit)
      let hasMoreData = true;

      // Memory safety limits
      const MAX_ROWS = 50000; // Maximum rows to fetch to prevent memory issues
      const MAX_PAGES = 50; // Maximum pages to prevent infinite loops

      while (hasMoreData) {
        const response = await http.get<{ data: any }>(
          `/api/osquery/live_queries/${liveQueryActionId}/results/${actionId}`,
          {
            version: API_VERSIONS.public.v1,
            query: {
              page: currentPage,
              pageSize,
              ...(sort.length > 0 && {
                sort: sort[0].field,
                sortOrder: sort[0].direction,
              }),
              ...(kuery && { kuery }),
              ...(startDate && { startDate }),
            },
          }
        );

        const pageResults = response.data.edges || [];
        allResults.push(...pageResults);

        // Update progress
        setProgress({
          phase: 'preparing',
          percentage: Math.min(20 + (currentPage * 10), 80),
          processedRows: allResults.length,
          totalRows: response.data.total || allResults.length,
        });

        // Check memory safety limits
        if (allResults.length >= MAX_ROWS) {
          notifications.toasts.addWarning({
            title: i18n.translate('xpack.osquery.results.csvExport.memoryLimitWarning', {
              defaultMessage: 'Large dataset detected',
            }),
            text: i18n.translate('xpack.osquery.results.csvExport.memoryLimitWarningText', {
              defaultMessage: 'Limiting export to {maxRows} rows to prevent memory issues. Use server-side export for larger datasets.',
              values: { maxRows: MAX_ROWS },
            }),
          });
          break;
        }

        // Check if we have more pages to fetch
        hasMoreData = pageResults.length === pageSize && allResults.length < (response.data.total || 0);
        currentPage++;

        // Safety break to prevent infinite loops
        if (currentPage >= MAX_PAGES) {
          notifications.toasts.addWarning({
            title: i18n.translate('xpack.osquery.results.csvExport.pageLimitWarning', {
              defaultMessage: 'Page limit reached',
            }),
            text: i18n.translate('xpack.osquery.results.csvExport.pageLimitWarningText', {
              defaultMessage: 'Stopped fetching after {maxPages} pages to prevent performance issues.',
              values: { maxPages: MAX_PAGES },
            }),
          });
          break;
        }
      }

      return allResults;
    } catch (error) {
      throw new Error(`Failed to fetch all results: ${error}`);
    }
  }, [actionId, liveQueryActionId, startDate, sort, kuery, http, notifications]);

  /**
   * Processes CSV export in chunks to prevent blocking the UI
   */
  const processInChunks = async (
    exportData: ResultEdges,
    options: CsvExportOptions,
    chunkSize: number = 100
  ): Promise<string[]> => {
    const totalRows = exportData.length;
    const chunks: string[] = [];

    // Process headers first
    setProgress({
      phase: 'preparing',
      percentage: 5,
      processedRows: 0,
      totalRows,
    });

    for (let i = 0; i < totalRows; i += chunkSize) {
      const chunk = exportData.slice(i, i + chunkSize);
      const chunkCsv = formatResultsAsCSV(chunk, columns, ecsMapping, options);

      if (i === 0) {
        // Include headers only for first chunk
        chunks.push(chunkCsv);
      } else {
        // Skip header row for subsequent chunks
        const lines = chunkCsv.split('\n');
        chunks.push(lines.slice(1).join('\n'));
      }

      // Update progress
      const processedRows = Math.min(i + chunkSize, totalRows);
      const percentage = Math.round((processedRows / totalRows) * 80) + 15; // 15-95% for processing

      setProgress({
        phase: 'formatting',
        percentage,
        processedRows,
        totalRows,
      });

      // Yield control to prevent UI blocking
      if (i % (chunkSize * 5) === 0) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }

    return chunks;
  };

  const exportToCsv = useCallback(async (options: CsvExportOptions = {}) => {

    // Determine export data
    let exportData = data;
    if (options.scope?.type === 'current-page' && currentPageData) {
      exportData = currentPageData;
    } else if (options.scope?.type === 'all-results' || !options.scope) {
      // For all results, check if we should use server-side processing
      const totalRows = data?.length || 0;
      const estimatedTotalRows = totalRows * 10; // Rough estimation based on current page

      if (estimatedTotalRows > SERVER_SIDE_THRESHOLD) {
        // Use server-side processing for large datasets
        setProgress({
          phase: 'preparing',
          percentage: 20,
          processedRows: 0,
          totalRows: estimatedTotalRows,
        });

        setProgress({
          phase: 'downloading',
          percentage: 90,
          processedRows: estimatedTotalRows,
          totalRows: estimatedTotalRows,
        });

        try {
          await fetchCsvFromServer(options);

          setProgress({
            phase: 'complete',
            percentage: 100,
            processedRows: estimatedTotalRows,
            totalRows: estimatedTotalRows,
          });

          // Show success notification for server-side export
          notifications.toasts.addSuccess({
            title: i18n.translate('xpack.osquery.results.csvExport.serverSuccess', {
              defaultMessage: '🚀 Server-side CSV export completed',
            }),
            text: i18n.translate('xpack.osquery.results.csvExport.serverSuccessText', {
              defaultMessage: 'Large dataset processed on server for optimal performance.',
            }),
          });

          return; // Exit early for server-side processing
        } catch (serverError) {
          // Notify user about server failure and fallback
          notifications.toasts.addWarning({
            title: i18n.translate('xpack.osquery.results.csvExport.serverFallbackWarning', {
              defaultMessage: 'Server-side export failed',
            }),
            text: i18n.translate('xpack.osquery.results.csvExport.serverFallbackWarningText', {
              defaultMessage: 'Server-side processing failed. Falling back to client-side processing which may be slower for large datasets.',
            }),
          });
        }
      }

      // Client-side processing for smaller datasets or fallback

      setProgress({
        phase: 'preparing',
        percentage: 10,
        processedRows: 0,
        totalRows: data?.length || 0,
      });

      try {
        exportData = await fetchAllResultsData();
      } catch (fetchError) {
        throw new Error(`Failed to fetch all results: ${fetchError}`);
      }
    }

    if (!exportData?.length || !columns?.length) {
      const warningMessage = i18n.translate('xpack.osquery.results.csvExport.noDataWarning', {
        defaultMessage: 'No data available to export',
      });
      notifications.toasts.addWarning({
        title: warningMessage,
      });
      setError(warningMessage);
      return;
    }

    setIsExporting(true);
    setError(undefined);
    setProgress({
      phase: 'preparing',
      percentage: 0,
      processedRows: 0,
      totalRows: exportData.length,
    });

    try {
      const isLargeDataset = exportData.length > 1000;
      let csvContent: string;

      if (isLargeDataset) {
        // Process large datasets in chunks
        const chunks = await processInChunks(exportData, options);
        csvContent = chunks.join('\n');
      } else {
        // Process small datasets directly
        setProgress({
          phase: 'formatting',
          percentage: 50,
          processedRows: 0,
          totalRows: exportData.length,
        });

        csvContent = formatResultsAsCSV(exportData, columns, ecsMapping, options);
      }

      if (!csvContent) {
        throw new Error('Failed to generate CSV content');
      }

      setProgress({
        phase: 'downloading',
        percentage: 95,
        processedRows: exportData.length,
        totalRows: exportData.length,
      });

      // Generate filename
      const filename = generateCsvFilename(actionId, options);

      // Create and trigger download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      link.href = url;
      link.download = filename;
      link.style.display = 'none';

      // Append to body, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Cleanup the URL object
      URL.revokeObjectURL(url);

      setProgress({
        phase: 'complete',
        percentage: 100,
        processedRows: exportData.length,
        totalRows: exportData.length,
      });

      // Show success notification for client-side export
      const scopeText = options.scope?.type === 'current-page' ? 'current page' : 'all results';
      notifications.toasts.addSuccess({
        title: i18n.translate('xpack.osquery.results.csvExport.success', {
          defaultMessage: '💻 Client-side CSV export completed',
        }),
        text: i18n.translate('xpack.osquery.results.csvExport.successText', {
          defaultMessage: 'Downloaded {filename} with {rowCount} rows from {scope} using client-side processing',
          values: {
            filename,
            rowCount: exportData.length,
            scope: scopeText,
          },
        }),
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(errorMessage);

      // Show specific error notifications based on error type
      let title = i18n.translate('xpack.osquery.results.csvExport.error', {
        defaultMessage: 'Failed to export CSV',
      });
      let toastMessage = i18n.translate('xpack.osquery.results.csvExport.errorText', {
        defaultMessage: 'An error occurred while generating the CSV file. Please try again.',
      });

      if (errorMessage.includes('memory') || errorMessage.includes('Memory')) {
        title = i18n.translate('xpack.osquery.results.csvExport.memoryError', {
          defaultMessage: 'Export failed due to memory limitations',
        });
        toastMessage = i18n.translate('xpack.osquery.results.csvExport.memoryErrorText', {
          defaultMessage: 'The dataset is too large to export. Try exporting the current page or contact your administrator.',
        });
      } else if (errorMessage.includes('network') || errorMessage.includes('Network')) {
        title = i18n.translate('xpack.osquery.results.csvExport.networkError', {
          defaultMessage: 'Export failed due to network issues',
        });
        toastMessage = i18n.translate('xpack.osquery.results.csvExport.networkErrorText', {
          defaultMessage: 'A network error occurred. Please check your connection and try again.',
        });
      }

      notifications.toasts.addError(error as Error, {
        title,
        toastMessage,
      });
    } finally {
      setIsExporting(false);
      // Clear progress after a short delay to show completion
      setTimeout(() => setProgress(undefined), 2000);
    }
  }, [actionId, data, columns, ecsMapping, currentPageData, notifications, fetchAllResultsData, fetchCsvFromServer]);

  return {
    exportToCsv,
    isExporting,
    progress,
    error,
  };
};

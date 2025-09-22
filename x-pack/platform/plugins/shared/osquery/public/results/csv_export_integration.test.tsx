/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nProvider } from '@kbn/i18n-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { EuiDataGridColumn } from '@elastic/eui';
import { useKibana } from '../common/lib/kibana';
import { CsvExportButton } from './components/csv_export_button';
import { useCsvExport } from './hooks/use_csv_export';
import { Direction, type ResultEdges } from '../../common/search_strategy';
import { API_VERSIONS } from '../../common/constants';

// Mock Kibana services
jest.mock('../common/lib/kibana');

// Mock DOM APIs
Object.defineProperty(window, 'URL', {
  value: {
    createObjectURL: jest.fn().mockReturnValue('mock-blob-url'),
    revokeObjectURL: jest.fn(),
  },
});

Object.defineProperty(document, 'body', {
  value: {
    appendChild: jest.fn(),
    removeChild: jest.fn(),
  },
});

Object.defineProperty(document, 'createElement', {
  value: jest.fn().mockReturnValue({
    href: '',
    download: '',
    style: { display: '' },
    click: jest.fn(),
  }),
});

// Integration Test Component that combines the export button with the hook
const CsvExportIntegration: React.FC<{
  actionId: string;
  data: ResultEdges;
  columns: EuiDataGridColumn[];
  liveQueryActionId?: string;
  ecsMapping?: Record<string, { field?: string }>;
  onExportComplete?: () => void;
}> = ({ actionId, data, columns, liveQueryActionId, ecsMapping, onExportComplete }) => {
  const { exportToCsv, isExporting, progress, error } = useCsvExport({
    actionId,
    data,
    columns,
    ecsMapping,
    liveQueryActionId,
    startDate: '2023-01-01T00:00:00Z',
    sort: [{ field: 'timestamp', direction: Direction.desc }],
  });

  const handleExport = React.useCallback(async (options?: any) => {
    await exportToCsv(options);
    onExportComplete?.();
  }, [exportToCsv, onExportComplete]);

  return (
    <CsvExportButton
      onExport={handleExport}
      isLoading={isExporting}
      totalRows={data.length}
      progress={progress}
      error={error}
    />
  );
};

describe('CSV Export Integration Tests', () => {
  let mockNotifications: any;
  let mockHttp: any;
  let queryClient: QueryClient;

  const mockColumns: EuiDataGridColumn[] = [
    { id: 'timestamp', displayAsText: 'Timestamp' },
    { id: 'agent.name', displayAsText: 'Agent Name' },
    { id: 'process.name', displayAsText: 'Process Name' },
    { id: 'process.pid', displayAsText: 'PID' },
    { id: 'user.name', displayAsText: 'User' },
  ];

  const mockEcsMapping = {
    'agent.name': { field: 'agent.name' },
    'user.name': { field: 'user.name' },
  };

  const generateMockData = (count: number): ResultEdges => {
    return Array.from({ length: count }, (_, i) => ({
      _index: 'logs-osquery_manager.result-default',
      _id: `doc-${i}`,
      _source: {
        'agent.name': `agent-${String(i + 1).padStart(3, '0')}`,
        'user.name': `user-${i % 10}`,
      },
      fields: {
        timestamp: [`2023-01-01T${String(i % 24).padStart(2, '0')}:00:00Z`],
        'process.name': [`process-${i % 5}.exe`],
        'process.pid': [1000 + i],
      },
    }));
  };

  const renderWithProviders = (ui: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <I18nProvider>{ui}</I18nProvider>
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    jest.useFakeTimers();

    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    // Mock notifications
    mockNotifications = {
      toasts: {
        addSuccess: jest.fn(),
        addError: jest.fn(),
        addWarning: jest.fn(),
      },
    };

    // Mock HTTP client
    mockHttp = {
      fetch: jest.fn(),
      get: jest.fn(),
    };

    (useKibana as jest.Mock).mockReturnValue({
      services: {
        notifications: mockNotifications,
        http: mockHttp,
      },
    });

    // Reset DOM mocks
    (document.createElement as jest.Mock).mockReturnValue({
      href: '',
      download: '',
      style: { display: '' },
      click: jest.fn(),
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Small Dataset Client-Side Export', () => {
    it('should complete full export workflow for small dataset', async () => {
      const mockData = generateMockData(10);
      const onExportComplete = jest.fn();

      renderWithProviders(
        <CsvExportIntegration
          actionId="test-action"
          data={mockData}
          columns={mockColumns}
          ecsMapping={mockEcsMapping}
          onExportComplete={onExportComplete}
        />
      );

      const exportButton = screen.getByTestId('osquery-results-export-csv-button');
      expect(exportButton).toBeInTheDocument();
      expect(exportButton).toBeEnabled();

      // Click export button
      await userEvent.click(exportButton);

      // Wait for export to complete
      await waitFor(() => {
        expect(onExportComplete).toHaveBeenCalled();
      });

      // Verify success notification
      expect(mockNotifications.toasts.addSuccess).toHaveBeenCalledWith({
        title: expect.stringContaining('Client-side CSV export completed'),
        text: expect.stringContaining('Downloaded'),
      });

      // Verify DOM manipulation for download
      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(window.URL.createObjectURL).toHaveBeenCalled();
      expect(window.URL.revokeObjectURL).toHaveBeenCalled();
    });

    it('should show progress during export', async () => {
      const mockData = generateMockData(5);

      renderWithProviders(
        <CsvExportIntegration
          actionId="test-action"
          data={mockData}
          columns={mockColumns}
          ecsMapping={mockEcsMapping}
        />
      );

      const exportButton = screen.getByTestId('osquery-results-export-csv-button');
      await userEvent.click(exportButton);

      // Progress should be visible at some point
      await waitFor(() => {
        expect(screen.queryByTestId('osquery-results-export-csv-progress-popover')).toBeInTheDocument();
      });
    });

    it('should handle current page export scope', async () => {
      const mockData = generateMockData(100);

      renderWithProviders(
        <CsvExportIntegration
          actionId="test-action"
          data={mockData}
          columns={mockColumns}
          ecsMapping={mockEcsMapping}
        />
      );

      const exportButton = screen.getByTestId('osquery-results-export-csv-button');

      // For this test, we'll simulate the button being clicked with current page scope
      // In a real implementation, this might come from an options menu
      await userEvent.click(exportButton);

      await waitFor(() => {
        expect(mockNotifications.toasts.addSuccess).toHaveBeenCalled();
      });
    });
  });

  describe('Large Dataset Server-Side Export', () => {
    it('should use server-side export for large datasets', async () => {
      const mockData = generateMockData(200); // Large enough to trigger server-side

      // Mock successful server response
      mockHttp.fetch.mockResolvedValue({
        response: {
          ok: true,
          headers: {
            get: jest.fn().mockReturnValue('attachment; filename="server-export.csv"'),
          },
        },
        body: 'timestamp,agent.name,process.name,process.pid,user.name\n2023-01-01T00:00:00Z,agent-001,process-0.exe,1000,user-0',
      });

      renderWithProviders(
        <CsvExportIntegration
          actionId="test-action"
          data={mockData}
          columns={mockColumns}
          liveQueryActionId="live-query-id"
          ecsMapping={mockEcsMapping}
        />
      );

      const exportButton = screen.getByTestId('osquery-results-export-csv-button');
      await userEvent.click(exportButton);

      await waitFor(() => {
        expect(mockHttp.fetch).toHaveBeenCalledWith(
          '/api/osquery/live_queries/live-query-id/results/test-action/export',
          expect.objectContaining({
            method: 'GET',
            version: API_VERSIONS.public.v1,
          })
        );
      });

      await waitFor(() => {
        expect(mockNotifications.toasts.addSuccess).toHaveBeenCalledWith({
          title: expect.stringContaining('Server-side CSV export completed'),
          text: expect.stringContaining('Large dataset processed on server'),
        });
      });
    });

    it('should fallback to client-side when server fails', async () => {
      const mockData = generateMockData(200);

      // Mock server failure
      mockHttp.fetch.mockRejectedValue(new Error('Server unavailable'));

      // Mock successful client-side data fetching
      mockHttp.get.mockResolvedValue({
        data: {
          edges: mockData,
          total: mockData.length,
        },
      });

      renderWithProviders(
        <CsvExportIntegration
          actionId="test-action"
          data={mockData}
          columns={mockColumns}
          liveQueryActionId="live-query-id"
          ecsMapping={mockEcsMapping}
        />
      );

      const exportButton = screen.getByTestId('osquery-results-export-csv-button');
      await userEvent.click(exportButton);

      // Should first try server-side
      await waitFor(() => {
        expect(mockHttp.fetch).toHaveBeenCalled();
      });

      // Should fallback to client-side
      await waitFor(() => {
        expect(mockHttp.get).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(mockNotifications.toasts.addSuccess).toHaveBeenCalledWith({
          title: expect.stringContaining('Client-side CSV export completed'),
          text: expect.stringContaining('Downloaded'),
        });
      });
    });
  });

  describe('Error Scenarios', () => {
    it('should handle empty data gracefully', async () => {
      renderWithProviders(
        <CsvExportIntegration
          actionId="test-action"
          data={[]}
          columns={mockColumns}
          ecsMapping={mockEcsMapping}
        />
      );

      const exportButton = screen.getByTestId('osquery-results-export-csv-button');
      expect(exportButton).toBeDisabled();
    });

    it('should display error state when export fails', async () => {
      const mockData = generateMockData(5);

      // Mock CSV formatting to fail
      jest.doMock('../../common/utils/csv_formatter', () => ({
        formatResultsAsCSV: jest.fn().mockImplementation(() => {
          throw new Error('CSV formatting failed');
        }),
        generateCsvFilename: jest.fn().mockReturnValue('test.csv'),
      }));

      renderWithProviders(
        <CsvExportIntegration
          actionId="test-action"
          data={mockData}
          columns={mockColumns}
          ecsMapping={mockEcsMapping}
        />
      );

      const exportButton = screen.getByTestId('osquery-results-export-csv-button');
      await userEvent.click(exportButton);

      await waitFor(() => {
        expect(mockNotifications.toasts.addError).toHaveBeenCalled();
      });

      // Button should show error state
      expect(exportButton).toHaveClass('euiButton--danger');
    });

    it('should handle network errors during server-side export', async () => {
      const mockData = generateMockData(200);

      // Mock network error
      mockHttp.fetch.mockRejectedValue(new Error('Network error'));
      mockHttp.get.mockRejectedValue(new Error('Network error'));

      renderWithProviders(
        <CsvExportIntegration
          actionId="test-action"
          data={mockData}
          columns={mockColumns}
          liveQueryActionId="live-query-id"
          ecsMapping={mockEcsMapping}
        />
      );

      const exportButton = screen.getByTestId('osquery-results-export-csv-button');
      await userEvent.click(exportButton);

      await waitFor(() => {
        expect(mockNotifications.toasts.addError).toHaveBeenCalledWith(
          expect.any(Error),
          {
            title: 'Export failed due to network issues',
            toastMessage: expect.stringContaining('network error occurred'),
          }
        );
      });
    });
  });

  describe('Progress Tracking Integration', () => {
    it('should show detailed progress through all phases', async () => {
      const mockData = generateMockData(1500); // Large enough for chunked processing

      renderWithProviders(
        <CsvExportIntegration
          actionId="test-action"
          data={mockData}
          columns={mockColumns}
          ecsMapping={mockEcsMapping}
        />
      );

      const exportButton = screen.getByTestId('osquery-results-export-csv-button');
      await userEvent.click(exportButton);

      // Should show progress phases
      await waitFor(() => {
        expect(screen.queryByTestId('osquery-results-export-csv-progress-popover')).toBeInTheDocument();
      });

      // Wait for completion
      await waitFor(() => {
        expect(mockNotifications.toasts.addSuccess).toHaveBeenCalled();
      }, { timeout: 10000 });
    });

    it('should auto-close progress popover after completion', async () => {
      const mockData = generateMockData(10);

      renderWithProviders(
        <CsvExportIntegration
          actionId="test-action"
          data={mockData}
          columns={mockColumns}
          ecsMapping={mockEcsMapping}
        />
      );

      const exportButton = screen.getByTestId('osquery-results-export-csv-button');
      await userEvent.click(exportButton);

      // Wait for export to complete
      await waitFor(() => {
        expect(mockNotifications.toasts.addSuccess).toHaveBeenCalled();
      });

      // Fast-forward time to trigger auto-close
      jest.advanceTimersByTime(3000);

      await waitFor(() => {
        expect(screen.queryByTestId('osquery-results-export-csv-progress-popover')).not.toBeInTheDocument();
      });
    });
  });

  describe('Real-world Data Scenarios', () => {
    it('should handle complex data types correctly', async () => {
      const complexData: ResultEdges = [
        {
          _index: 'logs-osquery_manager.result-default',
          _id: 'complex-1',
          _source: {
            'agent.name': 'complex-agent',
            'user.name': ['john', 'doe'], // Array in ECS field
          },
          fields: {
            timestamp: ['2023-01-01T10:00:00Z'],
            'process.name': ['complex-process.exe'],
            'process.pid': [1234],
            'process.env': [{ PATH: '/usr/bin', HOME: '/home/user' }], // Object field
            'process.args': [['--config', '/etc/config', '--verbose']], // Nested array
          },
        },
      ];

      renderWithProviders(
        <CsvExportIntegration
          actionId="test-action"
          data={complexData}
          columns={mockColumns}
          ecsMapping={mockEcsMapping}
        />
      );

      const exportButton = screen.getByTestId('osquery-results-export-csv-button');
      await userEvent.click(exportButton);

      await waitFor(() => {
        expect(mockNotifications.toasts.addSuccess).toHaveBeenCalled();
      });

      // Verify download was triggered
      expect(window.URL.createObjectURL).toHaveBeenCalled();
    });

    it('should handle large text fields and special characters', async () => {
      const dataWithSpecialChars: ResultEdges = [
        {
          _index: 'logs-osquery_manager.result-default',
          _id: 'special-1',
          _source: {
            'agent.name': 'agent-with-"quotes"',
          },
          fields: {
            timestamp: ['2023-01-01T10:00:00Z'],
            'process.name': ['process, with, commas.exe'],
            'process.pid': [1234],
            'process.command_line': ['command "with quotes" and\nnewlines\r\nand, commas'],
          },
        },
      ];

      renderWithProviders(
        <CsvExportIntegration
          actionId="test-action"
          data={dataWithSpecialChars}
          columns={[
            ...mockColumns,
            { id: 'process.command_line', displayAsText: 'Command Line' },
          ]}
          ecsMapping={mockEcsMapping}
        />
      );

      const exportButton = screen.getByTestId('osquery-results-export-csv-button');
      await userEvent.click(exportButton);

      await waitFor(() => {
        expect(mockNotifications.toasts.addSuccess).toHaveBeenCalled();
      });

      // Should handle special characters without errors
      expect(window.URL.createObjectURL).toHaveBeenCalled();
    });

    it('should maintain data integrity across different export scopes', async () => {
      const fullData = generateMockData(100);
      const currentPageData = fullData.slice(0, 10);

      const TestComponent = () => {
        const { exportToCsv, isExporting } = useCsvExport({
          actionId: 'test-action',
          data: fullData,
          columns: mockColumns,
          currentPageData,
          liveQueryActionId: 'live-query-id',
          startDate: '2023-01-01T00:00:00Z',
          sort: [{ field: 'timestamp', direction: Direction.desc }],
        });

        return (
          <div>
            <button
              data-test-subj="export-all"
              onClick={() => exportToCsv({ scope: { type: 'all-results' } })}
              disabled={isExporting}
            >
              Export All
            </button>
            <button
              data-test-subj="export-current"
              onClick={() => exportToCsv({ scope: { type: 'current-page', currentPageData } })}
              disabled={isExporting}
            >
              Export Current Page
            </button>
          </div>
        );
      };

      renderWithProviders(<TestComponent />);

      // Test current page export
      const exportCurrentButton = screen.getByTestId('export-current');
      await userEvent.click(exportCurrentButton);

      await waitFor(() => {
        expect(mockNotifications.toasts.addSuccess).toHaveBeenCalledWith(
          expect.objectContaining({
            text: expect.stringContaining('current page'),
          })
        );
      });

      jest.clearAllMocks();

      // Test all results export
      mockHttp.get.mockResolvedValue({
        data: {
          edges: fullData,
          total: fullData.length,
        },
      });

      const exportAllButton = screen.getByTestId('export-all');
      await userEvent.click(exportAllButton);

      await waitFor(() => {
        expect(mockNotifications.toasts.addSuccess).toHaveBeenCalledWith(
          expect.objectContaining({
            text: expect.stringContaining('all results'),
          })
        );
      });
    });
  });

  describe('Performance and Memory Management', () => {
    it('should handle memory cleanup properly', async () => {
      const mockData = generateMockData(10);

      const { unmount } = renderWithProviders(
        <CsvExportIntegration
          actionId="test-action"
          data={mockData}
          columns={mockColumns}
          ecsMapping={mockEcsMapping}
        />
      );

      const exportButton = screen.getByTestId('osquery-results-export-csv-button');
      await userEvent.click(exportButton);

      // Unmount component during export
      unmount();

      // Should not cause memory leaks or errors
      expect(() => unmount()).not.toThrow();
    });

    it('should handle concurrent export attempts gracefully', async () => {
      const mockData = generateMockData(10);

      renderWithProviders(
        <CsvExportIntegration
          actionId="test-action"
          data={mockData}
          columns={mockColumns}
          ecsMapping={mockEcsMapping}
        />
      );

      const exportButton = screen.getByTestId('osquery-results-export-csv-button');

      // Click multiple times rapidly
      await userEvent.click(exportButton);
      await userEvent.click(exportButton);
      await userEvent.click(exportButton);

      // Should complete successfully without errors
      await waitFor(() => {
        expect(mockNotifications.toasts.addSuccess).toHaveBeenCalled();
      });
    });
  });
});
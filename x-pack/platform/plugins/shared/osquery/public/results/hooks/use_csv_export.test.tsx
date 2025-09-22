/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { renderHook, act } from '@testing-library/react';
import { waitFor } from '@testing-library/react';
import type { EuiDataGridColumn } from '@elastic/eui';
import { useKibana } from '../../common/lib/kibana';
import { useCsvExport, type UseCsvExportProps } from './use_csv_export';
import { Direction, type ResultEdges } from '../../../common/search_strategy';
import { API_VERSIONS } from '../../../common/constants';

// Mock dependencies
jest.mock('../../common/lib/kibana');
jest.mock('../../../common/utils/csv_formatter', () => ({
  formatResultsAsCSV: jest.fn().mockReturnValue('mocked,csv,content\nrow1,value1,value2'),
  generateCsvFilename: jest.fn().mockReturnValue('test-export.csv'),
}));

// Mock DOM APIs
Object.defineProperty(window, 'URL', {
  value: {
    createObjectURL: jest.fn().mockReturnValue('mock-url'),
    revokeObjectURL: jest.fn(),
  },
});

// Mock document.body methods
Object.defineProperty(document, 'body', {
  value: {
    appendChild: jest.fn(),
    removeChild: jest.fn(),
  },
});

// Mock document.createElement
Object.defineProperty(document, 'createElement', {
  value: jest.fn().mockReturnValue({
    href: '',
    download: '',
    style: { display: '' },
    click: jest.fn(),
  }),
});

describe('useCsvExport Hook', () => {
  const mockNotifications = {
    toasts: {
      addSuccess: jest.fn(),
      addError: jest.fn(),
      addWarning: jest.fn(),
    },
  };

  const mockHttp = {
    fetch: jest.fn(),
    get: jest.fn(),
  };

  const mockKibanaServices = {
    notifications: mockNotifications,
    http: mockHttp,
  };

  const mockColumns: EuiDataGridColumn[] = [
    { id: 'timestamp', displayAsText: 'Timestamp' },
    { id: 'agent.name', displayAsText: 'Agent Name' },
    { id: 'process.name', displayAsText: 'Process' },
  ];

  const mockData: ResultEdges = [
    {
      _index: 'logs-osquery_manager.result-default',
      _id: '1',
      _source: { 'agent.name': 'agent-001' },
      fields: {
        timestamp: ['2023-01-01T10:00:00Z'],
        'process.name': ['chrome.exe'],
      },
    },
    {
      _index: 'logs-osquery_manager.result-default',
      _id: '2',
      _source: { 'agent.name': 'agent-002' },
      fields: {
        timestamp: ['2023-01-01T11:00:00Z'],
        'process.name': ['firefox.exe'],
      },
    },
  ];

  const defaultProps: UseCsvExportProps = {
    actionId: 'test-action-id',
    data: mockData,
    columns: mockColumns,
    liveQueryActionId: 'live-query-id',
    startDate: '2023-01-01T00:00:00Z',
    sort: [{ field: 'timestamp', direction: Direction.desc }],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useKibana as jest.Mock).mockReturnValue({
      services: mockKibanaServices,
    });

    // Reset DOM mocks
    jest.clearAllMocks();
    (document.createElement as jest.Mock).mockReturnValue({
      href: '',
      download: '',
      style: { display: '' },
      click: jest.fn(),
    });
  });

  describe('Basic Functionality', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() => useCsvExport(defaultProps));

      expect(result.current.isExporting).toBe(false);
      expect(result.current.progress).toBeUndefined();
      expect(result.current.error).toBeUndefined();
      expect(typeof result.current.exportToCsv).toBe('function');
    });

    it('should export small dataset using client-side processing', async () => {
      const { result } = renderHook(() => useCsvExport(defaultProps));

      await act(async () => {
        result.current.exportToCsv();
      });

      await waitFor(() => {
        expect(result.current.isExporting).toBe(false);
      });

      expect(mockNotifications.toasts.addSuccess).toHaveBeenCalledWith({
        title: expect.stringContaining('Client-side CSV export completed'),
        text: expect.stringContaining('Downloaded test-export.csv'),
      });
    });

    it('should handle current page export scope', async () => {
      const currentPageData = [mockData[0]];
      const { result } = renderHook(() => useCsvExport({
        ...defaultProps,
        currentPageData,
      }));

      await act(async () => {
        result.current.exportToCsv({
          scope: { type: 'current-page', currentPageData },
        });
      });

      await waitFor(() => {
        expect(result.current.isExporting).toBe(false);
      });

      expect(mockNotifications.toasts.addSuccess).toHaveBeenCalled();
    });
  });

  describe('Server-side Processing', () => {
    it('should use server-side processing for large datasets', async () => {
      // Mock large dataset by reducing threshold
      const largeDataProps = {
        ...defaultProps,
        data: new Array(200).fill(mockData[0]) // Create large dataset
      };

      mockHttp.fetch.mockResolvedValueOnce({
        response: {
          ok: true,
          headers: {
            get: jest.fn().mockReturnValue('attachment; filename="server-export.csv"'),
          },
        },
        body: 'server,csv,content\nrow1,val1,val2',
      });

      const { result } = renderHook(() => useCsvExport(largeDataProps));

      await act(async () => {
        result.current.exportToCsv();
      });

      await waitFor(() => {
        expect(result.current.isExporting).toBe(false);
      });

      expect(mockHttp.fetch).toHaveBeenCalledWith(
        `/api/osquery/live_queries/${defaultProps.liveQueryActionId}/results/${defaultProps.actionId}/export`,
        expect.objectContaining({
          method: 'GET',
          version: API_VERSIONS.public.v1,
        })
      );

      expect(mockNotifications.toasts.addSuccess).toHaveBeenCalledWith({
        title: expect.stringContaining('Server-side CSV export completed'),
        text: expect.stringContaining('Large dataset processed on server'),
      });
    });

    it('should fallback to client-side when server fails', async () => {
      const largeDataProps = {
        ...defaultProps,
        data: new Array(200).fill(mockData[0])
      };

      mockHttp.fetch.mockRejectedValueOnce(new Error('Server error'));
      mockHttp.get.mockResolvedValue({
        data: {
          edges: mockData,
          total: mockData.length,
        },
      });

      const { result } = renderHook(() => useCsvExport(largeDataProps));

      await act(async () => {
        result.current.exportToCsv();
      });

      await waitFor(() => {
        expect(result.current.isExporting).toBe(false);
      });

      // Should fallback to client-side processing
      expect(mockNotifications.toasts.addSuccess).toHaveBeenCalledWith({
        title: expect.stringContaining('Client-side CSV export completed'),
        text: expect.stringMatching(/Downloaded.*with.*rows/),
      });
    });
  });

  describe('Progress Tracking', () => {
    it('should track progress during export', async () => {
      const { result } = renderHook(() => useCsvExport(defaultProps));
      const progressStates: any[] = [];

      // Monitor progress changes
      renderHook(() => {
        if (result.current.progress) {
          progressStates.push({ ...result.current.progress });
        }
      });

      await act(async () => {
        result.current.exportToCsv();
      });

      await waitFor(() => {
        expect(result.current.isExporting).toBe(false);
      });

      // Should have gone through progress phases
      expect(progressStates.length).toBeGreaterThan(0);
    });

    it('should show progress for chunked processing of large datasets', async () => {
      const largeData = new Array(1500).fill(mockData[0]).map((item, index) => ({
        ...item,
        _id: `id-${index}`,
      }));

      const { result } = renderHook(() => useCsvExport({
        ...defaultProps,
        data: largeData,
      }));

      await act(async () => {
        result.current.exportToCsv();
      });

      await waitFor(() => {
        expect(result.current.isExporting).toBe(false);
      });

      // Should complete successfully with chunked processing
      expect(mockNotifications.toasts.addSuccess).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle empty data gracefully', async () => {
      const { result } = renderHook(() => useCsvExport({
        ...defaultProps,
        data: [],
      }));

      await act(async () => {
        result.current.exportToCsv();
      });

      expect(mockNotifications.toasts.addWarning).toHaveBeenCalledWith({
        title: 'No data available to export',
      });
      expect(result.current.error).toBe('No data available to export');
    });

    it('should handle empty columns gracefully', async () => {
      const { result } = renderHook(() => useCsvExport({
        ...defaultProps,
        columns: [],
      }));

      await act(async () => {
        result.current.exportToCsv();
      });

      expect(mockNotifications.toasts.addWarning).toHaveBeenCalledWith({
        title: 'No data available to export',
      });
    });

    it('should handle CSV generation errors', async () => {
      const { formatResultsAsCSV } = require('../../../common/utils/csv_formatter');
      formatResultsAsCSV.mockReturnValueOnce(''); // Simulate CSV generation failure

      const { result } = renderHook(() => useCsvExport(defaultProps));

      await act(async () => {
        result.current.exportToCsv();
      });

      await waitFor(() => {
        expect(result.current.isExporting).toBe(false);
      });

      expect(mockNotifications.toasts.addError).toHaveBeenCalled();
      expect(result.current.error).toContain('Failed to generate CSV content');
    });

    it('should handle memory errors with specific message', async () => {
      const { formatResultsAsCSV } = require('../../../common/utils/csv_formatter');
      formatResultsAsCSV.mockImplementationOnce(() => {
        throw new Error('Memory allocation failed');
      });

      const { result } = renderHook(() => useCsvExport(defaultProps));

      await act(async () => {
        result.current.exportToCsv();
      });

      await waitFor(() => {
        expect(result.current.isExporting).toBe(false);
      });

      expect(mockNotifications.toasts.addError).toHaveBeenCalledWith(
        expect.any(Error),
        {
          title: 'Export failed due to memory limitations',
          toastMessage: expect.stringContaining('dataset is too large'),
        }
      );
    });

    it('should handle network errors with specific message', async () => {
      mockHttp.get.mockRejectedValueOnce(new Error('Network failure'));

      const { result } = renderHook(() => useCsvExport(defaultProps));

      await act(async () => {
        result.current.exportToCsv();
      });

      await waitFor(() => {
        expect(result.current.isExporting).toBe(false);
      });

      expect(mockNotifications.toasts.addError).toHaveBeenCalledWith(
        expect.any(Error),
        {
          title: 'Export failed due to network issues',
          toastMessage: expect.stringContaining('network error occurred'),
        }
      );
    });

    it('should handle server-side export errors', async () => {
      const largeDataProps = {
        ...defaultProps,
        data: new Array(200).fill(mockData[0])
      };

      mockHttp.fetch.mockResolvedValueOnce({
        response: {
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
        },
      });

      const { result } = renderHook(() => useCsvExport(largeDataProps));

      await act(async () => {
        result.current.exportToCsv();
      });

      // Should not throw, should fallback gracefully
      expect(result.current.error).toBeUndefined(); // Should fallback to client-side
    });
  });

  describe('Custom Options', () => {
    it('should apply custom CSV formatting options', async () => {
      const { formatResultsAsCSV } = require('../../../common/utils/csv_formatter');

      const { result } = renderHook(() => useCsvExport(defaultProps));

      const customOptions = {
        arrayFormat: 'json' as const,
        objectFormat: 'json' as const,
        maxDepth: 5,
        includeRowNumbers: true,
      };

      await act(async () => {
        result.current.exportToCsv(customOptions);
      });

      await waitFor(() => {
        expect(result.current.isExporting).toBe(false);
      });

      expect(formatResultsAsCSV).toHaveBeenCalledWith(
        expect.any(Array),
        mockColumns,
        undefined,
        expect.objectContaining(customOptions)
      );
    });

    it('should handle ECS mapping correctly', async () => {
      const ecsMapping = {
        'agent.name': { field: 'agent.name' },
        'user.name': { field: 'user.name' },
      };

      const { result } = renderHook(() => useCsvExport({
        ...defaultProps,
        ecsMapping,
      }));

      const { formatResultsAsCSV } = require('../../../common/utils/csv_formatter');

      await act(async () => {
        result.current.exportToCsv();
      });

      await waitFor(() => {
        expect(result.current.isExporting).toBe(false);
      });

      expect(formatResultsAsCSV).toHaveBeenCalledWith(
        expect.any(Array),
        mockColumns,
        ecsMapping,
        expect.any(Object)
      );
    });

    it('should handle kuery and sorting parameters', async () => {
      const propsWithQuery = {
        ...defaultProps,
        kuery: 'agent.name: "test-agent"',
        sort: [{ field: 'timestamp', direction: Direction.asc }],
      };

      mockHttp.get.mockResolvedValue({
        data: {
          edges: mockData,
          total: mockData.length,
        },
      });

      const { result } = renderHook(() => useCsvExport(propsWithQuery));

      await act(async () => {
        result.current.exportToCsv();
      });

      await waitFor(() => {
        expect(result.current.isExporting).toBe(false);
      });

      expect(mockHttp.get).toHaveBeenCalledWith(
        expect.stringContaining(`/results/${defaultProps.actionId}`),
        expect.objectContaining({
          query: expect.objectContaining({
            kuery: 'agent.name: "test-agent"',
            sort: 'timestamp',
            sortOrder: 'asc',
          }),
        })
      );
    });
  });

  describe('Cleanup and Progress Management', () => {
    it('should clear progress after completion', async () => {
      jest.useFakeTimers();

      const { result } = renderHook(() => useCsvExport(defaultProps));

      await act(async () => {
        result.current.exportToCsv();
      });

      await waitFor(() => {
        expect(result.current.isExporting).toBe(false);
      });

      // Progress should still be visible initially
      expect(result.current.progress).toBeDefined();

      // Fast-forward time to trigger progress cleanup
      act(() => {
        jest.advanceTimersByTime(3000);
      });

      expect(result.current.progress).toBeUndefined();

      jest.useRealTimers();
    });

    it('should cleanup URL objects', async () => {
      const { result } = renderHook(() => useCsvExport(defaultProps));

      await act(async () => {
        result.current.exportToCsv();
      });

      await waitFor(() => {
        expect(result.current.isExporting).toBe(false);
      });

      expect(window.URL.createObjectURL).toHaveBeenCalled();
      expect(window.URL.revokeObjectURL).toHaveBeenCalled();
    });

    it('should handle component unmount during export', async () => {
      const { result, unmount } = renderHook(() => useCsvExport(defaultProps));

      act(() => {
        result.current.exportToCsv();
      });

      // Unmount while exporting
      unmount();

      // Should not throw errors
      expect(() => unmount()).not.toThrow();
    });
  });

  describe('Data Fetching for All Results', () => {
    it('should fetch all results in pages when exporting all data', async () => {
      mockHttp.get
        .mockResolvedValueOnce({
          data: {
            edges: mockData.slice(0, 1),
            total: 2,
          },
        })
        .mockResolvedValueOnce({
          data: {
            edges: mockData.slice(1, 2),
            total: 2,
          },
        });

      const { result } = renderHook(() => useCsvExport({
        ...defaultProps,
        data: mockData.slice(0, 1), // Only first item in current data
      }));

      await act(async () => {
        result.current.exportToCsv({ scope: { type: 'all-results' } });
      });

      await waitFor(() => {
        expect(result.current.isExporting).toBe(false);
      });

      // Should have made multiple requests to fetch all pages
      expect(mockHttp.get).toHaveBeenCalledTimes(2);
      expect(mockNotifications.toasts.addSuccess).toHaveBeenCalled();
    });

    it('should handle pagination safety limit', async () => {
      // Mock many pages to trigger safety limit
      const mockPages = Array.from({ length: 105 }, (_, i) => ({
        data: {
          edges: [{ ...mockData[0], _id: `id-${i}` }],
          total: 10000,
        },
      }));

      mockHttp.get.mockImplementation(() => Promise.resolve(mockPages[0]));

      const { result } = renderHook(() => useCsvExport(defaultProps));

      await act(async () => {
        result.current.exportToCsv();
      });

      await waitFor(() => {
        expect(result.current.isExporting).toBe(false);
      }, { timeout: 10000 });

      // Should complete even with safety limit
      expect(mockNotifications.toasts.addSuccess).toHaveBeenCalled();
    });
  });
});
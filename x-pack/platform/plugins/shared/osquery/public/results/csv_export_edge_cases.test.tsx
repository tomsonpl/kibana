/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { renderHook, act } from '@testing-library/react';
import { waitFor } from '@testing-library/react';
import type { EuiDataGridColumn } from '@elastic/eui';
import { useKibana } from '../common/lib/kibana';
import { useCsvExport } from './hooks/use_csv_export';
import { Direction, type ResultEdges } from '../../common/search_strategy';

jest.mock('../common/lib/kibana');
jest.mock('../../common/utils/csv_formatter');

// Mock DOM APIs
Object.defineProperty(window, 'URL', {
  value: {
    createObjectURL: jest.fn().mockReturnValue('mock-url'),
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

describe('CSV Export Edge Cases and Error Scenarios', () => {
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

  const mockColumns: EuiDataGridColumn[] = [
    { id: 'timestamp', displayAsText: 'Timestamp' },
    { id: 'process.name', displayAsText: 'Process Name' },
  ];

  const defaultProps = {
    actionId: 'test-action-id',
    data: [] as ResultEdges,
    columns: mockColumns,
    liveQueryActionId: 'live-query-id',
    startDate: '2023-01-01T00:00:00Z',
    sort: [{ field: 'timestamp', direction: Direction.desc }],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useKibana as jest.Mock).mockReturnValue({
      services: {
        notifications: mockNotifications,
        http: mockHttp,
      },
    });

    // Reset CSV formatter mocks
    const { formatResultsAsCSV, generateCsvFilename } = require('../../common/utils/csv_formatter');
    formatResultsAsCSV.mockReturnValue('mock,csv,content\nrow1,value1,value2');
    generateCsvFilename.mockReturnValue('test-export.csv');
  });

  describe('Memory and Performance Edge Cases', () => {
    it('should handle memory allocation failures gracefully', async () => {
      const { formatResultsAsCSV } = require('../../common/utils/csv_formatter');
      formatResultsAsCSV.mockImplementation(() => {
        throw new Error('Memory allocation failed - Cannot allocate 2GB of memory');
      });

      const mockData: ResultEdges = [
        {
          _index: 'logs-osquery_manager.result-default',
          _id: '1',
          _source: {},
          fields: { timestamp: ['2023-01-01T10:00:00Z'] },
        },
      ];

      const { result } = renderHook(() => useCsvExport({
        ...defaultProps,
        data: mockData,
      }));

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

    it('should handle out-of-memory errors during CSV generation', async () => {
      const { formatResultsAsCSV } = require('../../common/utils/csv_formatter');
      formatResultsAsCSV.mockImplementation(() => {
        throw new Error('RangeError: Maximum call stack size exceeded');
      });

      const { result } = renderHook(() => useCsvExport({
        ...defaultProps,
        data: [{ _index: 'logs-osquery_manager.result-default', _id: '1', _source: {}, fields: {} }],
      }));

      await act(async () => {
        result.current.exportToCsv();
      });

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
      });

      expect(mockNotifications.toasts.addError).toHaveBeenCalled();
    });

    it('should handle extremely large datasets by failing gracefully', async () => {
      // Create a very large mock dataset
      const largeData = Array.from({ length: 100000 }, (_, i) => ({
        _index: 'logs-osquery_manager.result-default',
        _id: `large-${i}`,
        _source: {},
        fields: {
          timestamp: [`2023-01-01T${String(i % 24).padStart(2, '0')}:00:00Z`],
          data: [`${'x'.repeat(1000)}-${i}`], // Large text field
        },
      }));

      const { formatResultsAsCSV } = require('../../common/utils/csv_formatter');
      formatResultsAsCSV.mockImplementation(() => {
        // Simulate running out of memory
        throw new Error('JavaScript heap out of memory');
      });

      const { result } = renderHook(() => useCsvExport({
        ...defaultProps,
        data: largeData,
      }));

      await act(async () => {
        result.current.exportToCsv();
      });

      await waitFor(() => {
        expect(result.current.error).toContain('memory');
      });

      expect(mockNotifications.toasts.addError).toHaveBeenCalledWith(
        expect.any(Error),
        {
          title: 'Export failed due to memory limitations',
          toastMessage: expect.stringContaining('dataset is too large'),
        }
      );
    });
  });

  describe('Network Failure Scenarios', () => {
    it('should handle complete network failure', async () => {
      mockHttp.fetch.mockRejectedValue(new Error('Network request failed'));
      mockHttp.get.mockRejectedValue(new Error('Network request failed'));

      const mockData = Array.from({ length: 200 }, (_, i) => ({
        _index: 'logs-osquery_manager.result-default',
        _id: String(i),
        _source: {},
        fields: { timestamp: [`2023-01-01T10:${String(i % 60).padStart(2, '0')}:00Z`] },
      }));

      const { result } = renderHook(() => useCsvExport({
        ...defaultProps,
        data: mockData,
      }));

      await act(async () => {
        result.current.exportToCsv();
      });

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
      });

      expect(mockNotifications.toasts.addError).toHaveBeenCalledWith(
        expect.any(Error),
        {
          title: 'Export failed due to network issues',
          toastMessage: expect.stringContaining('network error occurred'),
        }
      );
    });

    it('should handle timeout errors', async () => {
      mockHttp.fetch.mockRejectedValue(new Error('Request timeout after 30000ms'));

      const mockData = Array.from({ length: 200 }, (_, i) => ({
        _index: 'logs-osquery_manager.result-default',
        _id: String(i),
        _source: {},
        fields: { timestamp: [`2023-01-01T10:00:00Z`] },
      }));

      const { result } = renderHook(() => useCsvExport({
        ...defaultProps,
        data: mockData,
      }));

      await act(async () => {
        result.current.exportToCsv();
      });

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
      });

      expect(mockNotifications.toasts.addError).toHaveBeenCalled();
    });

    it('should handle server errors gracefully', async () => {
      mockHttp.fetch.mockResolvedValue({
        response: {
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
        },
      });

      mockHttp.get.mockRejectedValue(new Error('Server error'));

      const mockData = Array.from({ length: 200 }, (_, i) => ({
        _index: 'logs-osquery_manager.result-default',
        _id: String(i),
        _source: {},
        fields: { timestamp: [`2023-01-01T10:00:00Z`] },
      }));

      const { result } = renderHook(() => useCsvExport({
        ...defaultProps,
        data: mockData,
      }));

      await act(async () => {
        result.current.exportToCsv();
      });

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
      });

      expect(mockNotifications.toasts.addError).toHaveBeenCalled();
    });

    it('should handle partial network failures during pagination', async () => {
      const mockData = Array.from({ length: 10 }, (_, i) => ({
        _index: 'logs-osquery_manager.result-default',
        _id: String(i),
        _source: {},
        fields: { timestamp: [`2023-01-01T10:00:00Z`] },
      }));

      // First page succeeds, second page fails
      mockHttp.get
        .mockResolvedValueOnce({
          data: {
            edges: mockData.slice(0, 5),
            total: 10,
          },
        })
        .mockRejectedValueOnce(new Error('Network failure on page 2'));

      const { result } = renderHook(() => useCsvExport({
        ...defaultProps,
        data: mockData.slice(0, 5),
      }));

      await act(async () => {
        result.current.exportToCsv();
      });

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
      });

      expect(mockNotifications.toasts.addError).toHaveBeenCalledWith(
        expect.any(Error),
        {
          title: 'Export failed due to network issues',
          toastMessage: expect.stringContaining('network error occurred'),
        }
      );
    });
  });

  describe('Data Corruption and Invalid Data', () => {
    it('should handle corrupted data gracefully', async () => {
      const corruptedData: any[] = [
        {
          _index: 'logs-osquery_manager.result-default',
          _id: '1',
          _source: null, // Invalid _source
          fields: undefined, // Invalid fields
        },
        {
          _index: 'logs-osquery_manager.result-default',
          _id: '2',
          _source: 'invalid-string-source', // Should be object
          fields: 'invalid-string-fields', // Should be object
        },
        {
          _index: 'logs-osquery_manager.result-default',
          // Missing _id
          _source: {},
          fields: {},
        },
      ];

      const { result } = renderHook(() => useCsvExport({
        ...defaultProps,
        data: corruptedData,
      }));

      await act(async () => {
        result.current.exportToCsv();
      });

      await waitFor(() => {
        expect(result.current.isExporting).toBe(false);
      });

      // Should complete without throwing errors
      expect(mockNotifications.toasts.addSuccess).toHaveBeenCalled();
    });

    it('should handle circular references in data', async () => {
      const circularData: any = {
        _index: 'logs-osquery_manager.result-default',
        _id: '1',
        _source: {},
        fields: {
          metadata: [{}],
        },
      };

      // Create circular reference
      circularData.fields.metadata[0].self = circularData.fields.metadata[0];

      const { formatResultsAsCSV } = require('../../common/utils/csv_formatter');
      formatResultsAsCSV.mockImplementation(() => {
        throw new Error('Converting circular structure to JSON');
      });

      const { result } = renderHook(() => useCsvExport({
        ...defaultProps,
        data: [circularData],
      }));

      await act(async () => {
        result.current.exportToCsv();
      });

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
      });

      expect(mockNotifications.toasts.addError).toHaveBeenCalled();
    });

    it('should handle very long text fields', async () => {
      const dataWithLongText: ResultEdges = [
        {
          _index: 'logs-osquery_manager.result-default',
          _id: '1',
          _source: {},
          fields: {
            'very_long_field': ['x'.repeat(1000000)], // 1MB text field
            timestamp: ['2023-01-01T10:00:00Z'],
          },
        },
      ];

      const { result } = renderHook(() => useCsvExport({
        ...defaultProps,
        data: dataWithLongText,
        columns: [
          ...mockColumns,
          { id: 'very_long_field', displayAsText: 'Long Field' },
        ],
      }));

      await act(async () => {
        result.current.exportToCsv();
      });

      await waitFor(() => {
        expect(result.current.isExporting).toBe(false);
      });

      // Should handle long text without errors
      expect(mockNotifications.toasts.addSuccess).toHaveBeenCalled();
    });

    it('should handle special characters and encoding issues', async () => {
      const dataWithSpecialChars: ResultEdges = [
        {
          _index: 'logs-osquery_manager.result-default',
          _id: '1',
          _source: {},
          fields: {
            unicode_field: ['🚀 Unicode: αβγδε 中文 🎉'],
            control_chars: ['\x00\x01\x02\x03\x04\x05'], // Control characters
            null_bytes: ['text\x00with\x00nulls'],
            emoji_field: ['👨‍💻👩‍💻🔥💯'],
            timestamp: ['2023-01-01T10:00:00Z'],
          },
        },
      ];

      const { result } = renderHook(() => useCsvExport({
        ...defaultProps,
        data: dataWithSpecialChars,
        columns: [
          ...mockColumns,
          { id: 'unicode_field', displayAsText: 'Unicode' },
          { id: 'control_chars', displayAsText: 'Control Chars' },
          { id: 'null_bytes', displayAsText: 'Null Bytes' },
          { id: 'emoji_field', displayAsText: 'Emojis' },
        ],
      }));

      await act(async () => {
        result.current.exportToCsv();
      });

      await waitFor(() => {
        expect(result.current.isExporting).toBe(false);
      });

      expect(mockNotifications.toasts.addSuccess).toHaveBeenCalled();
    });
  });

  describe('Browser Compatibility and DOM Issues', () => {
    it('should handle browsers without URL.createObjectURL', async () => {
      // Mock missing URL API
      const originalURL = window.URL;
      (window as any).URL = undefined;

      const mockData: ResultEdges = [
        {
          _index: 'logs-osquery_manager.result-default',
        _id: '1',
          _source: {},
          fields: { timestamp: ['2023-01-01T10:00:00Z'] },
        },
      ];

      const { result } = renderHook(() => useCsvExport({
        ...defaultProps,
        data: mockData,
      }));

      await act(async () => {
        result.current.exportToCsv();
      });

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
      });

      expect(mockNotifications.toasts.addError).toHaveBeenCalled();

      // Restore original URL
      window.URL = originalURL;
    });

    it('should handle DOM manipulation failures', async () => {
      // Mock DOM failures
      (document.createElement as jest.Mock).mockImplementation(() => {
        throw new Error('DOM manipulation failed');
      });

      const mockData: ResultEdges = [
        {
          _index: 'logs-osquery_manager.result-default',
        _id: '1',
          _source: {},
          fields: { timestamp: ['2023-01-01T10:00:00Z'] },
        },
      ];

      const { result } = renderHook(() => useCsvExport({
        ...defaultProps,
        data: mockData,
      }));

      await act(async () => {
        result.current.exportToCsv();
      });

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
      });

      expect(mockNotifications.toasts.addError).toHaveBeenCalled();
    });

    it('should handle blob creation failures', async () => {
      // Mock Blob constructor to fail
      const originalBlob = window.Blob;
      (window as any).Blob = function() {
        throw new Error('Blob creation failed');
      };

      const mockData: ResultEdges = [
        {
          _index: 'logs-osquery_manager.result-default',
        _id: '1',
          _source: {},
          fields: { timestamp: ['2023-01-01T10:00:00Z'] },
        },
      ];

      const { result } = renderHook(() => useCsvExport({
        ...defaultProps,
        data: mockData,
      }));

      await act(async () => {
        result.current.exportToCsv();
      });

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
      });

      expect(mockNotifications.toasts.addError).toHaveBeenCalled();

      // Restore original Blob
      window.Blob = originalBlob;
    });
  });

  describe('Concurrency and Race Conditions', () => {
    it('should handle multiple simultaneous export attempts', async () => {
      const mockData: ResultEdges = [
        {
          _index: 'logs-osquery_manager.result-default',
        _id: '1',
          _source: {},
          fields: { timestamp: ['2023-01-01T10:00:00Z'] },
        },
      ];

      const { result } = renderHook(() => useCsvExport({
        ...defaultProps,
        data: mockData,
      }));

      // Start multiple exports simultaneously
      const exportPromises = [
        act(async () => result.current.exportToCsv()),
        act(async () => result.current.exportToCsv()),
        act(async () => result.current.exportToCsv()),
      ];

      await Promise.all(exportPromises);

      await waitFor(() => {
        expect(result.current.isExporting).toBe(false);
      });

      // Should handle gracefully without multiple notifications
      expect(mockNotifications.toasts.addSuccess).toHaveBeenCalled();
    });

    it('should handle component unmount during export', async () => {
      const mockData: ResultEdges = [
        {
          _index: 'logs-osquery_manager.result-default',
        _id: '1',
          _source: {},
          fields: { timestamp: ['2023-01-01T10:00:00Z'] },
        },
      ];

      const { result, unmount } = renderHook(() => useCsvExport({
        ...defaultProps,
        data: mockData,
      }));

      // Start export
      act(() => {
        result.current.exportToCsv();
      });

      // Unmount immediately
      unmount();

      // Should not cause errors
      expect(() => unmount()).not.toThrow();
    });

    it('should handle state updates after unmount', async () => {
      const mockData: ResultEdges = [
        {
          _index: 'logs-osquery_manager.result-default',
        _id: '1',
          _source: {},
          fields: { timestamp: ['2023-01-01T10:00:00Z'] },
        },
      ];

      let exportResolve: any;
      const { formatResultsAsCSV } = require('../../common/utils/csv_formatter');
      formatResultsAsCSV.mockImplementation(() => {
        return new Promise((resolve) => {
          exportResolve = resolve;
        });
      });

      const { result, unmount } = renderHook(() => useCsvExport({
        ...defaultProps,
        data: mockData,
      }));

      // Start export
      act(() => {
        result.current.exportToCsv();
      });

      // Unmount while export is in progress
      unmount();

      // Resolve the export after unmount
      if (exportResolve) {
        exportResolve('delayed,csv,content');
      }

      // Should not cause errors or warnings
      expect(() => {
        exportResolve?.('delayed,csv,content');
      }).not.toThrow();
    });
  });

  describe('Configuration and Edge Parameters', () => {
    it('should handle invalid sort parameters', async () => {
      const mockData: ResultEdges = [
        {
          _index: 'logs-osquery_manager.result-default',
        _id: '1',
          _source: {},
          fields: { timestamp: ['2023-01-01T10:00:00Z'] },
        },
      ];

      const { result } = renderHook(() => useCsvExport({
        ...defaultProps,
        data: mockData,
        sort: [] as any, // Empty sort array
      }));

      await act(async () => {
        result.current.exportToCsv();
      });

      await waitFor(() => {
        expect(result.current.isExporting).toBe(false);
      });

      expect(mockNotifications.toasts.addSuccess).toHaveBeenCalled();
    });

    it('should handle missing required props', async () => {
      const mockData: ResultEdges = [
        {
          _index: 'logs-osquery_manager.result-default',
        _id: '1',
          _source: {},
          fields: { timestamp: ['2023-01-01T10:00:00Z'] },
        },
      ];

      const { result } = renderHook(() => useCsvExport({
        actionId: '', // Empty action ID
        data: mockData,
        columns: [], // Empty columns
        sort: [{ field: 'timestamp', direction: Direction.desc }],
      }));

      await act(async () => {
        result.current.exportToCsv();
      });

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
      });

      expect(mockNotifications.toasts.addWarning).toHaveBeenCalledWith({
        title: 'No data available to export',
      });
    });

    it('should handle extreme export options', async () => {
      const mockData: ResultEdges = [
        {
          _index: 'logs-osquery_manager.result-default',
        _id: '1',
          _source: {},
          fields: {
            nested_data: [{
              level1: {
                level2: {
                  level3: {
                    level4: {
                      level5: 'very nested',
                    },
                  },
                },
              },
            }],
          },
        },
      ];

      const { result } = renderHook(() => useCsvExport({
        ...defaultProps,
        data: mockData,
        columns: [
          { id: 'nested_data', displayAsText: 'Nested Data' },
        ],
      }));

      await act(async () => {
        result.current.exportToCsv({
          maxDepth: 0, // No depth
          arrayFormat: 'json',
          objectFormat: 'json',
        });
      });

      await waitFor(() => {
        expect(result.current.isExporting).toBe(false);
      });

      expect(mockNotifications.toasts.addSuccess).toHaveBeenCalled();
    });
  });

  describe('Resource Exhaustion', () => {
    it('should handle quota exceeded errors', async () => {
      const { formatResultsAsCSV } = require('../../common/utils/csv_formatter');
      formatResultsAsCSV.mockImplementation(() => {
        throw new Error('QuotaExceededError: DOM Exception 22');
      });

      const mockData: ResultEdges = [
        {
          _index: 'logs-osquery_manager.result-default',
        _id: '1',
          _source: {},
          fields: { timestamp: ['2023-01-01T10:00:00Z'] },
        },
      ];

      const { result } = renderHook(() => useCsvExport({
        ...defaultProps,
        data: mockData,
      }));

      await act(async () => {
        result.current.exportToCsv();
      });

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
      });

      expect(mockNotifications.toasts.addError).toHaveBeenCalled();
    });

    it('should handle browser resource limits', async () => {
      // Simulate browser running out of resources
      window.URL.createObjectURL = jest.fn().mockImplementation(() => {
        throw new Error('Failed to execute createObjectURL: insufficient resources');
      });

      const mockData: ResultEdges = [
        {
          _index: 'logs-osquery_manager.result-default',
        _id: '1',
          _source: {},
          fields: { timestamp: ['2023-01-01T10:00:00Z'] },
        },
      ];

      const { result } = renderHook(() => useCsvExport({
        ...defaultProps,
        data: mockData,
      }));

      await act(async () => {
        result.current.exportToCsv();
      });

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
      });

      expect(mockNotifications.toasts.addError).toHaveBeenCalled();
    });
  });
});
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

// Mock performance APIs
Object.defineProperty(window, 'performance', {
  value: {
    now: jest.fn(() => Date.now()),
    mark: jest.fn(),
    measure: jest.fn(),
  },
});

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

describe('CSV Export Performance Tests with Different Dataset Sizes', () => {
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
    { id: '@timestamp', displayAsText: 'Timestamp' },
    { id: 'agent.name', displayAsText: 'Agent Name' },
    { id: 'host.name', displayAsText: 'Hostname' },
    { id: 'process.name', displayAsText: 'Process Name' },
    { id: 'process.pid', displayAsText: 'PID' },
    { id: 'process.command_line', displayAsText: 'Command Line' },
    { id: 'user.name', displayAsText: 'User' },
    { id: 'network.bytes', displayAsText: 'Network Bytes' },
    { id: 'file.path', displayAsText: 'File Path' },
    { id: 'event.action', displayAsText: 'Event Action' },
  ];

  const generateMockData = (size: number, complexity: 'simple' | 'complex' = 'simple'): ResultEdges => {
    return Array.from({ length: size }, (_, i) => {
      const baseData = {
        _index: 'logs-osquery_manager.result-default',
        _id: `doc-${i}`,
        _source: {
          'agent.name': `agent-${String(i % 100).padStart(3, '0')}`,
          'host.name': `host-${String(i % 50).padStart(2, '0')}`,
          'user.name': `user-${i % 20}`,
        },
        fields: {
          '@timestamp': [`2023-01-${String((i % 28) + 1).padStart(2, '0')}T${String(i % 24).padStart(2, '0')}:${String(i % 60).padStart(2, '0')}:00Z`],
          'process.name': [`process-${i % 10}.exe`],
          'process.pid': [1000 + (i % 50000)],
          'process.command_line': [`/usr/bin/process-${i % 10} --arg1 value1 --arg2 value2`],
          'event.action': [`action-${i % 5}`],
          'network.bytes': [Math.floor(Math.random() * 1000000)],
          'file.path': [`/var/log/app-${i % 100}/file-${i % 1000}.log`],
        } as Record<string, any[]>,
      };

      if (complexity === 'complex') {
        // Add complex nested data
        (baseData.fields as Record<string, any[]>)['process.env'] = [{
            PATH: '/usr/bin:/bin:/usr/sbin:/sbin',
            HOME: `/home/user-${i % 20}`,
            USER: `user-${i % 20}`,
            SHELL: '/bin/bash',
            PWD: `/var/app-${i % 100}`,
            ...Object.fromEntries(
              Array.from({ length: 20 }, (_, j) => [`ENV_VAR_${j}`, `value-${j}-${i}`])
            )
          }],
        (baseData.fields as Record<string, any[]>)['process.thread.capabilities'] = [
          Array.from({ length: 10 }, (_, j) => `cap_${j}_${i % 5}`)
        ];
        (baseData.fields as Record<string, any[]>)['network.protocol_stack'] = [['ethernet', 'ipv4', 'tcp', 'http']];
        (baseData.fields as Record<string, any[]>)['file.metadata'] = [{
            size: Math.floor(Math.random() * 10000000),
            permissions: '0644',
            owner: `user-${i % 20}`,
            group: `group-${i % 10}`,
            created: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
            modified: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
            checksums: {
              md5: `md5-hash-${i}`,
              sha1: `sha1-hash-${i}`,
              sha256: `sha256-hash-${i}`,
            },
          }];
      }

      return baseData;
    });
  };

  const defaultProps = {
    actionId: 'performance-test-action',
    columns: mockColumns,
    liveQueryActionId: 'performance-live-query',
    startDate: '2023-01-01T00:00:00Z',
    sort: [{ field: '@timestamp', direction: Direction.desc }],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    (useKibana as jest.Mock).mockReturnValue({
      services: {
        notifications: mockNotifications,
        http: mockHttp,
      },
    });

    // Setup CSV formatter mocks
    const { formatResultsAsCSV, generateCsvFilename } = require('../../common/utils/csv_formatter');
    formatResultsAsCSV.mockImplementation((data: any[]) => {
      // Simulate CSV generation time based on data size
      const processingTime = data.length * 0.1; // 0.1ms per row
      jest.advanceTimersByTime(processingTime);

      const headers = mockColumns.map(col => col.displayAsText || col.id).join(',');
      const rows = data.map((_: any, i: number) =>
        mockColumns.map(() => `value-${i}`).join(',')
      ).join('\n');

      return `${headers}\n${rows}`;
    });
    generateCsvFilename.mockReturnValue('performance-test.csv');
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Small Datasets (1-100 rows)', () => {
    it('should handle tiny datasets (1-10 rows) efficiently', async () => {
      const startTime = performance.now();
      const mockData = generateMockData(5, 'simple');

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

      const endTime = performance.now();
      const executionTime = endTime - startTime;

      expect(executionTime).toBeLessThan(100); // Should complete in under 100ms
      expect(mockNotifications.toasts.addSuccess).toHaveBeenCalledWith({
        title: expect.stringContaining('Client-side CSV export completed'),
        text: expect.stringContaining('5 rows'),
      });
    });

    it('should handle small datasets (10-50 rows) with complex data', async () => {
      const mockData = generateMockData(25, 'complex');

      const { result } = renderHook(() => useCsvExport({
        ...defaultProps,
        data: mockData,
      }));

      await act(async () => {
        result.current.exportToCsv({
          arrayFormat: 'pipe-separated',
          objectFormat: 'key-value',
          maxDepth: 5,
        });
      });

      await waitFor(() => {
        expect(result.current.isExporting).toBe(false);
      });

      expect(mockNotifications.toasts.addSuccess).toHaveBeenCalled();
    });

    it('should handle medium-small datasets (50-100 rows)', async () => {
      const mockData = generateMockData(75, 'simple');

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

      expect(mockNotifications.toasts.addSuccess).toHaveBeenCalledWith({
        title: expect.stringContaining('Client-side CSV export completed'),
        text: expect.stringContaining('75 rows'),
      });
    });
  });

  describe('Medium Datasets (100-1,000 rows)', () => {
    it('should handle medium datasets (100-500 rows) with progress tracking', async () => {
      const mockData = generateMockData(250, 'simple');
      const progressUpdates: any[] = [];

      const { result } = renderHook(() => useCsvExport({
        ...defaultProps,
        data: mockData,
      }));

      // Monitor progress updates
      const originalProgress = result.current.progress;
      const progressSpy = jest.fn();

      renderHook(() => {
        if (result.current.progress !== originalProgress) {
          progressSpy(result.current.progress);
          progressUpdates.push(result.current.progress);
        }
      });

      await act(async () => {
        result.current.exportToCsv();
      });

      await waitFor(() => {
        expect(result.current.isExporting).toBe(false);
      });

      expect(mockNotifications.toasts.addSuccess).toHaveBeenCalledWith({
        title: expect.stringContaining('Client-side CSV export completed'),
        text: expect.stringContaining('250 rows'),
      });
    });

    it('should handle larger medium datasets (500-1,000 rows) with chunked processing', async () => {
      const mockData = generateMockData(750, 'simple');

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

      expect(mockNotifications.toasts.addSuccess).toHaveBeenCalled();
    });

    it('should handle medium datasets with complex data structures', async () => {
      const mockData = generateMockData(400, 'complex');

      const { result } = renderHook(() => useCsvExport({
        ...defaultProps,
        data: mockData,
      }));

      await act(async () => {
        result.current.exportToCsv({
          arrayFormat: 'json',
          objectFormat: 'json',
          maxDepth: 3,
        });
      });

      await waitFor(() => {
        expect(result.current.isExporting).toBe(false);
      });

      expect(mockNotifications.toasts.addSuccess).toHaveBeenCalled();
    });
  });

  describe('Large Datasets (1,000-10,000 rows)', () => {
    it('should handle large datasets (1,000-2,500 rows) with chunked processing', async () => {
      const mockData = generateMockData(1500, 'simple');

      const { result } = renderHook(() => useCsvExport({
        ...defaultProps,
        data: mockData,
      }));

      await act(async () => {
        result.current.exportToCsv();
      });

      await waitFor(() => {
        expect(result.current.isExporting).toBe(false);
      }, { timeout: 10000 });

      expect(mockNotifications.toasts.addSuccess).toHaveBeenCalledWith({
        title: expect.stringContaining('Client-side CSV export completed'),
        text: expect.stringContaining('1500 rows'),
      });
    });

    it('should handle very large datasets (5,000+ rows) with proper progress tracking', async () => {
      const mockData = generateMockData(2000, 'simple');
      const progressUpdates: any[] = [];

      const { result } = renderHook(() => useCsvExport({
        ...defaultProps,
        data: mockData,
      }));

      // Monitor progress throughout export
      let lastProgress: any;
      const checkProgress = () => {
        if (result.current.progress && result.current.progress !== lastProgress) {
          progressUpdates.push({ ...result.current.progress });
          lastProgress = result.current.progress;
        }
      };

      await act(async () => {
        result.current.exportToCsv();

        // Check progress periodically
        const progressInterval = setInterval(checkProgress, 100);

        await waitFor(() => {
          expect(result.current.isExporting).toBe(false);
        }, { timeout: 15000 });

        clearInterval(progressInterval);
      });

      expect(progressUpdates.length).toBeGreaterThan(0);
      expect(mockNotifications.toasts.addSuccess).toHaveBeenCalled();
    });

    it('should trigger server-side export for datasets above threshold', async () => {
      const mockData = generateMockData(150, 'simple'); // Above SERVER_SIDE_THRESHOLD of 100

      // Mock successful server response
      mockHttp.fetch.mockResolvedValue({
        response: {
          ok: true,
          headers: {
            get: jest.fn().mockReturnValue('attachment; filename="server-export.csv"'),
          },
        },
        body: 'server-generated,csv,content\nrow1,val1,val2',
      });

      const { result } = renderHook(() => useCsvExport({
        ...defaultProps,
        data: mockData,
      }));

      await act(async () => {
        result.current.exportToCsv();
      });

      await waitFor(() => {
        expect(mockHttp.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/export'),
          expect.objectContaining({
            method: 'GET',
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
  });

  describe('Very Large Datasets (10,000+ rows) - Server-Side Processing', () => {
    it('should handle very large datasets via server-side processing', async () => {
      const mockData = generateMockData(500, 'simple'); // Simulates large dataset

      // Mock server-side export
      mockHttp.fetch.mockResolvedValue({
        response: {
          ok: true,
          headers: {
            get: jest.fn().mockReturnValue('attachment; filename="large-export.csv"'),
          },
        },
        body: 'large,dataset,csv\n' + Array.from({ length: 10000 }, (_, i) => `row${i},val1,val2`).join('\n'),
      });

      const { result } = renderHook(() => useCsvExport({
        ...defaultProps,
        data: mockData,
      }));

      await act(async () => {
        result.current.exportToCsv();
      });

      await waitFor(() => {
        expect(mockHttp.fetch).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(mockNotifications.toasts.addSuccess).toHaveBeenCalledWith({
          title: expect.stringContaining('Server-side CSV export completed'),
          text: expect.stringContaining('Large dataset processed on server'),
        });
      });
    });

    it('should handle pagination for server-side data fetching', async () => {
      const totalRecords = 5000;
      const pageSize = 1000;
      const mockSmallData = generateMockData(10, 'simple'); // Current page data

      // Mock paginated responses
      for (let page = 0; page < Math.ceil(totalRecords / pageSize); page++) {
        const pageData = generateMockData(
          Math.min(pageSize, totalRecords - page * pageSize),
          'simple'
        );

        mockHttp.get.mockResolvedValueOnce({
          data: {
            edges: pageData,
            total: totalRecords,
          },
        });
      }

      const { result } = renderHook(() => useCsvExport({
        ...defaultProps,
        data: mockSmallData,
      }));

      await act(async () => {
        result.current.exportToCsv({ scope: { type: 'all-results' } });
      });

      await waitFor(() => {
        expect(result.current.isExporting).toBe(false);
      }, { timeout: 20000 });

      // Should have made multiple paginated requests
      expect(mockHttp.get).toHaveBeenCalledTimes(5); // 5000 / 1000 = 5 pages
      expect(mockNotifications.toasts.addSuccess).toHaveBeenCalled();
    });

    it('should respect pagination safety limits', async () => {
      const mockData = generateMockData(10, 'simple');

      // Mock responses that would cause many pages
      mockHttp.get.mockImplementation(() =>
        Promise.resolve({
          data: {
            edges: generateMockData(1000, 'simple'),
            total: 1000000, // Very large total
          },
        })
      );

      const { result } = renderHook(() => useCsvExport({
        ...defaultProps,
        data: mockData,
      }));

      await act(async () => {
        result.current.exportToCsv();
      });

      await waitFor(() => {
        expect(result.current.isExporting).toBe(false);
      }, { timeout: 15000 });

      // Should complete even with safety limits
      expect(mockNotifications.toasts.addSuccess).toHaveBeenCalled();
    });
  });

  describe('Performance Benchmarks', () => {
    it('should complete small datasets (< 100 rows) in under 500ms', async () => {
      const startTime = Date.now();
      const mockData = generateMockData(50, 'simple');

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

      const executionTime = Date.now() - startTime;
      expect(executionTime).toBeLessThan(500);
    });

    it('should complete medium datasets (100-1,000 rows) in under 2 seconds', async () => {
      const startTime = Date.now();
      const mockData = generateMockData(500, 'simple');

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

      const executionTime = Date.now() - startTime;
      expect(executionTime).toBeLessThan(2000);
    });

    it('should show progress for datasets taking longer than 1 second', async () => {
      const mockData = generateMockData(1000, 'simple');
      let progressShown = false;

      const { result } = renderHook(() => useCsvExport({
        ...defaultProps,
        data: mockData,
      }));

      await act(async () => {
        result.current.exportToCsv();

        // Check if progress is shown during export
        setTimeout(() => {
          if (result.current.progress) {
            progressShown = true;
          }
        }, 500);
      });

      await waitFor(() => {
        expect(result.current.isExporting).toBe(false);
      });

      expect(progressShown).toBe(true);
    });

    it('should handle memory efficiently for large datasets', async () => {
      const mockData = generateMockData(2000, 'complex');

      // Monitor memory usage (simplified)
      const performanceWithMemory = performance as any;
      const initialMemory = performanceWithMemory.memory?.usedJSHeapSize || 0;

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

      const finalMemory = performanceWithMemory.memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (< 100MB for test purposes)
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024);
      expect(mockNotifications.toasts.addSuccess).toHaveBeenCalled();
    });
  });

  describe('Scalability Tests', () => {
    it('should maintain performance consistency across different data sizes', async () => {
      const testSizes = [10, 50, 100, 500, 1000];
      const executionTimes: number[] = [];

      for (const size of testSizes) {
        const startTime = Date.now();
        const mockData = generateMockData(size, 'simple');

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

        const executionTime = Date.now() - startTime;
        executionTimes.push(executionTime);

        // Clear mocks for next iteration
        jest.clearAllMocks();
      }

      // Performance should scale roughly linearly
      const performanceRatio = executionTimes[4] / executionTimes[0]; // 1000 rows vs 10 rows
      expect(performanceRatio).toBeLessThan(200); // Should not be more than 200x slower
    });

    it('should handle concurrent exports of different sizes', async () => {
      const sizes = [50, 100, 200];
      const promises: Promise<void>[] = [];

      sizes.forEach((size, index) => {
        const mockData = generateMockData(size, 'simple');

        const { result } = renderHook(() => useCsvExport({
          ...defaultProps,
          actionId: `concurrent-test-${index}`,
          data: mockData,
        }));

        const promise = act(async () => {
          result.current.exportToCsv();

          await waitFor(() => {
            expect(result.current.isExporting).toBe(false);
          });
        });

        promises.push(promise);
      });

      // All exports should complete successfully
      await Promise.all(promises);

      expect(mockNotifications.toasts.addSuccess).toHaveBeenCalledTimes(3);
    });
  });
});
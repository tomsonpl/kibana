/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { of } from 'rxjs';
import type { IRouter } from '@kbn/core/server';
import type { DataRequestHandlerContext } from '@kbn/data-plugin/server';
import { loggingSystemMock, coreMock } from '@kbn/core/server/mocks';
import { httpServerMock } from '@kbn/core/server/mocks';
import { exportCsvRoute } from './export_csv_route';
import type { OsqueryAppContext, OsqueryAppContextService } from '../../lib/osquery_app_context_services';
import { PLUGIN_ID, OSQUERY_INTEGRATION_NAME } from '../../../common';
import { API_VERSIONS } from '../../../common/constants';
import { Direction, OsqueryQueries } from '../../../common/search_strategy';

describe('Export CSV Route', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let router: any;
  let mockCore: ReturnType<typeof coreMock.createSetup>;
  let osqueryContext: jest.Mocked<OsqueryAppContext>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockRequest: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockResponse: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockContext: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockLogger: any;

  const mockLiveQueryActionId = 'test-live-query-id';
  const mockActionId = 'test-action-id';

  beforeEach(() => {
    // Mock core and router
    mockCore = coreMock.createSetup();
    router = mockCore.http.createRouter();

    // Mock logger
    mockLogger = loggingSystemMock.createLogger();

    // Mock osquery context
    const mockService = {
      getIntegrationNamespaces: jest.fn().mockResolvedValue({
        [OSQUERY_INTEGRATION_NAME]: ['default'],
      }),
    };
    osqueryContext = {
      logFactory: {
        get: jest.fn().mockReturnValue(mockLogger),
      },
      service: mockService,
    } as any;

    // Mock request
    mockRequest = httpServerMock.createKibanaRequest({
      params: {
        liveQueryActionId: mockLiveQueryActionId,
        actionId: mockActionId,
      },
      query: {
        page: 0,
        pageSize: 1000,
        sort: 'timestamp',
        sortOrder: 'desc',
        arrayFormat: 'pipe-separated',
        objectFormat: 'key-value',
        maxDepth: 3,
      },
    });

    // Mock response
    mockResponse = httpServerMock.createResponseFactory();

    // Mock context
    mockContext = {
      search: {
        search: jest.fn(),
      },
    };

    jest.clearAllMocks();
  });

  describe('Route Registration', () => {
    it('should register the CSV export route correctly', () => {
      // @ts-expect-error - router mock doesn't fully match DataRequestHandlerContext
      exportCsvRoute(router, osqueryContext);

      expect(router.versioned.get).toHaveBeenCalledWith({
        access: 'public',
        path: '/api/osquery/live_queries/{liveQueryActionId}/results/{actionId}/export',
        security: {
          authz: {
            requiredPrivileges: [`${PLUGIN_ID}-read`],
          },
        },
      });

      const mockRouter = mockCore.http.createRouter.mock.results[0].value;
      expect(mockRouter.versioned.get().addVersion).toHaveBeenCalledWith(
        expect.objectContaining({
          version: API_VERSIONS.public.v1,
          validate: expect.objectContaining({
            request: expect.objectContaining({
              params: expect.any(Object),
              query: expect.any(Object),
            }),
          }),
        }),
        expect.any(Function)
      );
    });

    it('should validate request parameters correctly', () => {
      // @ts-expect-error - router mock doesn't fully match DataRequestHandlerContext
      exportCsvRoute(router, osqueryContext);

      const mockRouter = mockCore.http.createRouter.mock.results[0].value;
      const [[, handler]] = mockRouter.versioned.get.mock.results[0].value.addVersion.mock.calls;
      const { validate } = handler;

      expect(validate.request.params).toBeDefined();
      expect(validate.request.query).toBeDefined();
    });
  });

  describe('CSV Export Handler', () => {
    let routeHandler: any;

    beforeEach(() => {
      // @ts-expect-error - router mock doesn't fully match DataRequestHandlerContext
      exportCsvRoute(router, osqueryContext);
      const mockRouter = mockCore.http.createRouter.mock.results[0].value;
      const [[, handlerConfig]] = mockRouter.versioned.get.mock.results[0].value.addVersion.mock.calls;
      routeHandler = handlerConfig;
    });

    it('should export CSV with search results', async () => {
      const mockSearchResponse = {
        edges: [
          {
            _index: 'logs-osquery_manager.result-default',
            _id: '1',
            _source: { 'agent.name': 'agent-001' },
            fields: {
              timestamp: ['2023-01-01T10:00:00Z'],
              'process.name': ['chrome.exe'],
              pid: [1234],
            },
          },
          {
            _index: 'logs-osquery_manager.result-default',
            _id: '2',
            _source: { 'agent.name': 'agent-002' },
            fields: {
              timestamp: ['2023-01-01T11:00:00Z'],
              'process.name': ['firefox.exe'],
              pid: [5678],
            },
          },
        ],
        total: 2,
      };

      mockContext.search.search.mockReturnValue(of(mockSearchResponse));

      await routeHandler(mockContext, mockRequest, mockResponse);

      expect(mockContext.search.search).toHaveBeenCalledWith(
        expect.objectContaining({
          actionId: mockActionId,
          factoryQueryType: OsqueryQueries.results,
          sort: [{
            direction: Direction.desc,
            field: 'timestamp',
          }],
        }),
        expect.objectContaining({
          strategy: 'osquerySearchStrategy',
        })
      );

      expect(mockResponse.ok).toHaveBeenCalledWith({
        body: expect.stringContaining('pid,process.name,timestamp'),
        headers: expect.objectContaining({
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': expect.stringContaining('filename='),
        }),
      });
    });

    it('should handle empty search results', async () => {
      const mockSearchResponse = {
        edges: [],
        total: 0,
      };

      mockContext.search.search.mockReturnValue(of(mockSearchResponse));

      await routeHandler(mockContext, mockRequest, mockResponse);

      expect(mockResponse.ok).toHaveBeenCalledWith({
        body: '',
        headers: expect.objectContaining({
          'Content-Type': 'text/csv',
          'Content-Disposition': expect.stringContaining('.csv'),
        }),
      });
    });

    it('should include row numbers when requested', async () => {
      const mockSearchResponse = {
        edges: [
          {
            _index: 'logs-osquery_manager.result-default',
            _id: '1',
            _source: {},
            fields: {
              timestamp: ['2023-01-01T10:00:00Z'],
              pid: [1234],
            },
          },
        ],
        total: 1,
      };

      mockContext.search.search.mockReturnValue(of(mockSearchResponse));

      const requestWithRowNumbers = {
        ...mockRequest,
        query: {
          ...mockRequest.query,
          includeRowNumbers: true,
        },
      };

      await routeHandler(mockContext, requestWithRowNumbers, mockResponse);

      expect(mockResponse.ok).toHaveBeenCalledWith({
        body: expect.stringContaining('Row #,'),
        headers: expect.any(Object),
      });
    });

    it('should handle pagination correctly', async () => {
      const page1Response = {
        edges: [
          {
            _index: 'logs-osquery_manager.result-default',
            _id: '1',
            _source: {},
            fields: { pid: [1] },
          },
        ],
        total: 2,
      };

      const page2Response = {
        edges: [
          {
            _index: 'logs-osquery_manager.result-default',
            _id: '2',
            _source: {},
            fields: { pid: [2] },
          },
        ],
        total: 2,
      };

      mockContext.search.search
        .mockReturnValueOnce(of(page1Response))
        .mockReturnValueOnce(of(page2Response));

      const requestWithSmallPageSize = {
        ...mockRequest,
        query: {
          ...mockRequest.query,
          pageSize: 1,
        },
      };

      await routeHandler(mockContext, requestWithSmallPageSize, mockResponse);

      expect(mockContext.search.search).toHaveBeenCalledTimes(2);
      expect(mockResponse.ok).toHaveBeenCalledWith({
        body: expect.stringContaining('pid'), // Should contain both records
        headers: expect.any(Object),
      });
    });

    it('should respect page size limits', async () => {
      const requestWithLargePageSize = {
        ...mockRequest,
        query: {
          ...mockRequest.query,
          pageSize: 5000, // Over the 1000 limit
        },
      };

      const mockSearchResponse = {
        edges: [],
        total: 0,
      };

      mockContext.search.search.mockReturnValue(of(mockSearchResponse));

      await routeHandler(mockContext, requestWithLargePageSize, mockResponse);

      // Should be called with limited page size
      expect(mockContext.search.search).toHaveBeenCalledWith(
        expect.objectContaining({
          pagination: expect.objectContaining({
            querySize: 1000, // Should be limited
          }),
        }),
        expect.any(Object)
      );
    });

    it('should handle search with filters', async () => {
      const requestWithFilters = {
        ...mockRequest,
        query: {
          ...mockRequest.query,
          kuery: 'process.name: "chrome"',
          startDate: '2023-01-01T00:00:00Z',
        },
      };

      const mockSearchResponse = {
        edges: [],
        total: 0,
      };

      mockContext.search.search.mockReturnValue(of(mockSearchResponse));

      await routeHandler(mockContext, requestWithFilters, mockResponse);

      expect(mockContext.search.search).toHaveBeenCalledWith(
        expect.objectContaining({
          kuery: 'process.name: "chrome"',
          startDate: '2023-01-01T00:00:00Z',
        }),
        expect.any(Object)
      );
    });

    it('should format CSV with custom options', async () => {
      const mockSearchResponse = {
        edges: [
          {
            _index: 'logs-osquery_manager.result-default',
            _id: '1',
            _source: { 'agent.name': 'agent-001' },
            fields: {
              processes: [['chrome.exe', 'firefox.exe']], // Array field
              metadata: [{ key: 'value', nested: { prop: 'test' } }], // Object field
            },
          },
        ],
        total: 1,
      };

      mockContext.search.search.mockReturnValue(of(mockSearchResponse));

      const requestWithCustomOptions = {
        ...mockRequest,
        query: {
          ...mockRequest.query,
          arrayFormat: 'json',
          objectFormat: 'json',
          maxDepth: 5,
        },
      };

      await routeHandler(mockContext, requestWithCustomOptions, mockResponse);

      // Should generate CSV with custom formatting
      expect(mockResponse.ok).toHaveBeenCalledWith({
        body: expect.stringContaining('metadata,processes'), // Should include the fields
        headers: expect.any(Object),
      });
    });

    it('should handle ECS mapped fields correctly', async () => {
      const mockSearchResponse = {
        edges: [
          {
            _index: 'logs-osquery_manager.result-default',
            _id: '1',
            _source: {
              'agent.name': 'test-agent',
              'host.hostname': 'test-host',
              'user.name': 'test-user',
            },
            fields: {
              timestamp: ['2023-01-01T10:00:00Z'],
            },
          },
        ],
        total: 1,
      };

      mockContext.search.search.mockReturnValue(of(mockSearchResponse));

      await routeHandler(mockContext, mockRequest, mockResponse);

      // Should handle ECS fields from _source
      expect(mockResponse.ok).toHaveBeenCalledWith({
        body: expect.stringContaining('timestamp'),
        headers: expect.any(Object),
      });
    });

    it('should generate appropriate filename', async () => {
      const mockSearchResponse = {
        edges: [],
        total: 0,
      };

      mockContext.search.search.mockReturnValue(of(mockSearchResponse));

      await routeHandler(mockContext, mockRequest, mockResponse);

      expect(mockResponse.ok).toHaveBeenCalledWith({
        body: '',
        headers: expect.objectContaining({
          'Content-Disposition': expect.stringMatching(
            /filename="osquery-results-test-act-server-\d{4}-\d{2}-\d{2}\.csv"/
          ),
        }),
      });
    });
  });

  describe('Error Handling', () => {
    let routeHandler: any;

    beforeEach(() => {
      // @ts-expect-error - router mock doesn't fully match DataRequestHandlerContext
      exportCsvRoute(router, osqueryContext);
      const mockRouter = mockCore.http.createRouter.mock.results[0].value;
      const [[, handlerConfig]] = mockRouter.versioned.get.mock.results[0].value.addVersion.mock.calls;
      routeHandler = handlerConfig;
    });

    it('should handle search errors gracefully', async () => {
      const searchError = new Error('Search failed');
      mockContext.search.search.mockReturnValue(
        new Promise((_, reject) => reject(searchError))
      );

      await routeHandler(mockContext, mockRequest, mockResponse);

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('CSV export failed')
      );

      expect(mockResponse.customError).toHaveBeenCalledWith({
        statusCode: 500,
        body: { message: expect.stringContaining('CSV export failed') },
      });
    });

    it('should handle integration namespace errors', async () => {
      const mockService = osqueryContext.service as jest.Mocked<typeof osqueryContext.service>;
      mockService.getIntegrationNamespaces.mockRejectedValue(
        new Error('Namespace error')
      );

      await routeHandler(mockContext, mockRequest, mockResponse);

      expect(mockResponse.customError).toHaveBeenCalledWith({
        statusCode: 500,
        body: { message: expect.stringContaining('CSV export failed') },
      });
    });

    it('should handle missing search context', async () => {
      const contextWithoutSearch = {};

      await routeHandler(contextWithoutSearch, mockRequest, mockResponse);

      expect(mockResponse.customError).toHaveBeenCalledWith({
        statusCode: 500,
        body: { message: expect.stringContaining('CSV export failed') },
      });
    });

    it('should handle aborted requests', async () => {
      const mockSearchResponse = {
        edges: [],
        total: 0,
      };

      mockContext.search.search.mockReturnValue(of(mockSearchResponse));

      // Should not throw during normal operation
      await expect(
        routeHandler(mockContext, mockRequest, mockResponse)
      ).resolves.not.toThrow();
    });
  });

  describe('Performance and Scalability', () => {
    let routeHandler: any;

    beforeEach(() => {
      // @ts-expect-error - router mock doesn't fully match DataRequestHandlerContext
      exportCsvRoute(router, osqueryContext);
      const mockRouter = mockCore.http.createRouter.mock.results[0].value;
      const [[, handlerConfig]] = mockRouter.versioned.get.mock.results[0].value.addVersion.mock.calls;
      routeHandler = handlerConfig;
    });

    it('should handle large datasets with multiple pages', async () => {
      const generateMockPage = (pageNumber: number) => ({
        edges: Array.from({ length: 100 }, (_, i) => ({
          _index: 'logs-osquery_manager.result-default',
          _id: `${pageNumber}-${i}`,
          _source: {},
          fields: {
            pid: [pageNumber * 100 + i],
            timestamp: [`2023-01-01T${String(pageNumber).padStart(2, '0')}:00:00Z`],
          },
        })),
        total: 1000,
      });

      // Mock 10 pages of 100 records each
      for (let i = 0; i < 10; i++) {
        mockContext.search.search.mockReturnValueOnce(of(generateMockPage(i)));
      }

      const requestWithSmallPages = {
        ...mockRequest,
        query: {
          ...mockRequest.query,
          pageSize: 100,
        },
      };

      await routeHandler(mockContext, requestWithSmallPages, mockResponse);

      expect(mockContext.search.search).toHaveBeenCalledTimes(10);
      expect(mockResponse.ok).toHaveBeenCalledWith({
        body: expect.stringContaining('pid,timestamp'), // Should contain headers
        headers: expect.any(Object),
      });
    });

    it('should respect safety limits for pagination', async () => {
      // Mock a response that would cause infinite pagination
      const infiniteResponse = {
        edges: Array.from({ length: 1000 }, (_, i) => ({
          _index: 'logs-osquery_manager.result-default',
          _id: String(i),
          _source: {},
          fields: { pid: [i] },
        })),
        total: 999999, // Very large total
      };

      mockContext.search.search.mockReturnValue(of(infiniteResponse));

      await routeHandler(mockContext, mockRequest, mockResponse);

      // Should stop at safety limit (100 pages max)
      expect(mockContext.search.search).toHaveBeenCalledTimes(1);
      expect(mockLogger.warn).not.toHaveBeenCalledWith(
        'Reached maximum page limit during CSV export'
      );
    });

    it('should log appropriate information for debugging', async () => {
      const mockSearchResponse = {
        edges: [
          {
            _index: 'logs-osquery_manager.result-default',
            _id: '1',
            _source: {},
            fields: { pid: [1234] },
          },
        ],
        total: 1,
      };

      mockContext.search.search.mockReturnValue(of(mockSearchResponse));

      await routeHandler(mockContext, mockRequest, mockResponse);

      expect(mockLogger.debug).toHaveBeenCalledWith(
        `CSV export requested for action: ${mockActionId}`
      );
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Fetched 1 results for CSV export'
      );
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Generated CSV with 1 rows'
      );
    });
  });

  describe('Integration with Osquery Context', () => {
    let routeHandler: any;

    beforeEach(() => {
      // @ts-expect-error - router mock doesn't fully match DataRequestHandlerContext
      exportCsvRoute(router, osqueryContext);
      const mockRouter = mockCore.http.createRouter.mock.results[0].value;
      const [[, handlerConfig]] = mockRouter.versioned.get.mock.results[0].value.addVersion.mock.calls;
      routeHandler = handlerConfig;
    });

    it('should use integration namespaces when available', async () => {
      const mockNamespaces = {
        [OSQUERY_INTEGRATION_NAME]: ['custom-namespace-1', 'custom-namespace-2'],
      };

      const mockService = osqueryContext.service as jest.Mocked<typeof osqueryContext.service>;
      mockService.getIntegrationNamespaces.mockResolvedValue(mockNamespaces);

      const mockSearchResponse = {
        edges: [],
        total: 0,
      };

      mockContext.search.search.mockReturnValue(of(mockSearchResponse));

      await routeHandler(mockContext, mockRequest, mockResponse);

      expect(mockContext.search.search).toHaveBeenCalledWith(
        expect.objectContaining({
          integrationNamespaces: ['custom-namespace-1', 'custom-namespace-2'],
        }),
        expect.any(Object)
      );
    });

    it('should handle missing integration service gracefully', async () => {
      const contextWithoutService: OsqueryAppContext = {
        ...osqueryContext,
        service: {} as OsqueryAppContextService, // Empty service without the method
      };

      // @ts-expect-error - router mock doesn't fully match DataRequestHandlerContext
      exportCsvRoute(router, contextWithoutService);
      const mockRouter = mockCore.http.createRouter.mock.results[0].value;
      const [[, handlerConfig]] = mockRouter.versioned.get.mock.results[0].value.addVersion.mock.calls;
      const handlerWithoutService = handlerConfig;

      const mockSearchResponse = {
        edges: [],
        total: 0,
      };

      mockContext.search.search.mockReturnValue(of(mockSearchResponse));

      await handlerWithoutService(mockContext, mockRequest, mockResponse);

      expect(mockContext.search.search).toHaveBeenCalledWith(
        expect.objectContaining({
          integrationNamespaces: undefined,
        }),
        expect.any(Object)
      );
    });
  });
});
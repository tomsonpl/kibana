/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { EuiDataGridColumn } from '@elastic/eui';
import type { ResultEdges } from '../../common/search_strategy';
import {
  escapeCsvValue,
  formatFieldValue,
  formatResultsAsCSV,
  generateCsvFilename,
  type CsvFormattingOptions,
  type CsvExportOptions,
} from './csv_formatter';

describe('CSV Formatter Utilities', () => {
  describe('escapeCsvValue', () => {
    it('should return empty string for null/undefined values', () => {
      expect(escapeCsvValue(null)).toBe('');
      expect(escapeCsvValue(undefined)).toBe('');
    });

    it('should escape values containing commas', () => {
      expect(escapeCsvValue('hello, world')).toBe('"hello, world"');
    });

    it('should escape values containing quotes', () => {
      expect(escapeCsvValue('say "hello"')).toBe('"say ""hello"""');
    });

    it('should escape values containing newlines', () => {
      expect(escapeCsvValue('line1\nline2')).toBe('"line1\nline2"');
      expect(escapeCsvValue('line1\r\nline2')).toBe('"line1\r\nline2"');
    });

    it('should escape values starting with formula injection characters', () => {
      expect(escapeCsvValue('=SUM(A1:A2)')).toBe('"=SUM(A1:A2)"');
      expect(escapeCsvValue('+123')).toBe('"+123"');
      expect(escapeCsvValue('-123')).toBe('"-123"');
      expect(escapeCsvValue('@user')).toBe('"@user"');
    });

    it('should not escape simple values', () => {
      expect(escapeCsvValue('hello world')).toBe('hello world');
      expect(escapeCsvValue('123')).toBe('123');
      expect(escapeCsvValue('test@email.com')).toBe('test@email.com');
    });

    it('should handle numbers', () => {
      expect(escapeCsvValue(123)).toBe('123');
      expect(escapeCsvValue(0)).toBe('0');
      expect(escapeCsvValue(-456)).toBe('-456');
    });

    it('should handle booleans', () => {
      expect(escapeCsvValue(true)).toBe('true');
      expect(escapeCsvValue(false)).toBe('false');
    });
  });

  describe('formatFieldValue', () => {
    const defaultOptions: CsvFormattingOptions = {
      arrayFormat: 'pipe-separated',
      objectFormat: 'key-value',
      maxDepth: 3,
    };

    it('should handle null/undefined values', () => {
      expect(formatFieldValue(null, 'test', defaultOptions)).toBe('');
      expect(formatFieldValue(undefined, 'test', defaultOptions)).toBe('');
    });

    it('should handle agent.name specially', () => {
      expect(formatFieldValue('agent-001', 'agent.name', defaultOptions)).toBe('agent-001');
    });

    it('should format arrays with pipe-separated format', () => {
      const arr = ['item1', 'item2', 'item3'];
      expect(formatFieldValue(arr, 'test', { arrayFormat: 'pipe-separated' }))
        .toBe('item1 | item2 | item3');
    });

    it('should format arrays with JSON format', () => {
      const arr = ['item1', 'item2'];
      expect(formatFieldValue(arr, 'test', { arrayFormat: 'json' }))
        .toBe('["item1","item2"]');
    });

    it('should handle empty arrays', () => {
      expect(formatFieldValue([], 'test', defaultOptions)).toBe('[]');
    });

    it('should format objects with key-value format', () => {
      const obj = { key1: 'value1', key2: 'value2' };
      const result = formatFieldValue(obj, 'test', { objectFormat: 'key-value' });
      expect(result).toBe('key1: value1, key2: value2');
    });

    it('should format objects with JSON format', () => {
      const obj = { key1: 'value1', key2: 123 };
      expect(formatFieldValue(obj, 'test', { objectFormat: 'json' }))
        .toBe('{"key1":"value1","key2":123}');
    });

    it('should handle nested objects with depth limits', () => {
      const deepObj = {
        level1: {
          level2: {
            level3: {
              level4: 'too deep'
            }
          }
        }
      };
      const result = formatFieldValue(deepObj, 'test', { objectFormat: 'key-value', maxDepth: 2 });
      expect(result).toContain('[Object - Max Depth Reached]');
    });

    it('should handle mixed arrays with objects', () => {
      const mixedArray = ['string', { key: 'value' }, 123];
      const result = formatFieldValue(mixedArray, 'test', { arrayFormat: 'pipe-separated' });
      expect(result).toBe('string | {"key":"value"} | 123');
    });

    it('should handle booleans', () => {
      expect(formatFieldValue(true, 'test', defaultOptions)).toBe('true');
      expect(formatFieldValue(false, 'test', defaultOptions)).toBe('false');
    });

    it('should handle numbers', () => {
      expect(formatFieldValue(123, 'test', defaultOptions)).toBe('123');
      expect(formatFieldValue(0, 'test', defaultOptions)).toBe('0');
      expect(formatFieldValue(-456.78, 'test', defaultOptions)).toBe('-456.78');
    });

    it('should handle invalid numbers', () => {
      expect(formatFieldValue(NaN, 'test', defaultOptions)).toBe('Invalid Number');
      expect(formatFieldValue(Infinity, 'test', defaultOptions)).toBe('Invalid Number');
    });

    it('should handle strings', () => {
      expect(formatFieldValue('hello world', 'test', defaultOptions)).toBe('hello world');
    });

    it('should handle array formatting errors gracefully', () => {
      // Create an array with circular reference to trigger formatting error
      const circularArray: any[] = ['safe'];
      circularArray.push(circularArray);

      const result = formatFieldValue(circularArray, 'test', defaultOptions);
      expect(result).toBe('[Array with 2 items]');
    });

    it('should handle object formatting errors gracefully', () => {
      // Create an object with circular reference to trigger formatting error
      const circularObj: any = { safe: 'value' };
      circularObj.circular = circularObj;

      const result = formatFieldValue(circularObj, 'test', { objectFormat: 'key-value' });
      expect(result).toBe('[Object - Formatting Error]');
    });

    it('should handle flattened objects', () => {
      const nestedObj = {
        user: {
          name: 'John',
          profile: {
            age: 30
          }
        }
      };

      const result = formatFieldValue(nestedObj, 'test', {
        objectFormat: 'key-value',
        flattenObjects: true,
        maxDepth: 3
      });

      expect(result).toContain('user.name: John');
      expect(result).toContain('user.profile.age: 30');
    });
  });

  describe('formatResultsAsCSV', () => {
    const mockColumns: EuiDataGridColumn[] = [
      { id: 'timestamp', displayAsText: 'Timestamp' },
      { id: 'agent.name', displayAsText: 'Agent Name' },
      { id: 'process.name', displayAsText: 'Process' },
      { id: 'user.name', displayAsText: 'User' },
    ];

    const mockData: ResultEdges = [
      {
        _index: 'logs-osquery_manager.result-default',
        _id: '1',
        _source: {
          'agent.name': 'agent-001',
          'user.name': 'john_doe',
        },
        fields: {
          timestamp: ['2023-01-01T10:00:00Z'],
          'process.name': ['chrome.exe'],
        },
      },
      {
        _index: 'logs-osquery_manager.result-default',
        _id: '2',
        _source: {
          'agent.name': 'agent-002',
          'user.name': 'jane_smith',
        },
        fields: {
          timestamp: ['2023-01-01T11:00:00Z'],
          'process.name': ['firefox.exe'],
        },
      },
    ];

    const mockEcsMapping = {
      'agent.name': { field: 'agent.name' },
      'user.name': { field: 'user.name' },
    };

    it('should generate CSV with headers', () => {
      const csv = formatResultsAsCSV(mockData, mockColumns);
      const lines = csv.split('\n');
      expect(lines[0]).toBe('Timestamp,Agent Name,Process,User');
    });

    it('should handle empty data', () => {
      const csv = formatResultsAsCSV([], mockColumns);
      expect(csv).toBe('');
    });

    it('should handle empty columns', () => {
      const csv = formatResultsAsCSV(mockData, []);
      expect(csv).toBe('');
    });

    it('should format data rows correctly', () => {
      const csv = formatResultsAsCSV(mockData, mockColumns, mockEcsMapping);
      const lines = csv.split('\n');

      expect(lines).toHaveLength(3); // header + 2 data rows
      expect(lines[1]).toBe('2023-01-01T10:00:00Z,agent-001,chrome.exe,john_doe');
      expect(lines[2]).toBe('2023-01-01T11:00:00Z,agent-002,firefox.exe,jane_smith');
    });

    it('should include row numbers when requested', () => {
      const options: CsvExportOptions = { includeRowNumbers: true };
      const csv = formatResultsAsCSV(mockData, mockColumns, mockEcsMapping, options);
      const lines = csv.split('\n');

      expect(lines[0]).toBe('Row #,Timestamp,Agent Name,Process,User');
      expect(lines[1]).toBe('1,2023-01-01T10:00:00Z,agent-001,chrome.exe,john_doe');
      expect(lines[2]).toBe('2,2023-01-01T11:00:00Z,agent-002,firefox.exe,jane_smith');
    });

    it('should handle missing field values with dash', () => {
      const dataWithMissing: ResultEdges = [
        {
          _index: 'logs-osquery_manager.result-default',
          _id: '1',
          _source: {
            'agent.name': 'agent-001',
          },
          fields: {
            timestamp: ['2023-01-01T10:00:00Z'],
          },
        },
      ];

      const csv = formatResultsAsCSV(dataWithMissing, mockColumns, mockEcsMapping);
      const lines = csv.split('\n');
      expect(lines[1]).toBe('2023-01-01T10:00:00Z,agent-001,-,-');
    });

    it('should handle array fields by extracting first element', () => {
      const dataWithArrays: ResultEdges = [
        {
          _index: 'logs-osquery_manager.result-default',
          _id: '1',
          _source: {
            'agent.name': 'agent-001',
          },
          fields: {
            timestamp: ['2023-01-01T10:00:00Z', '2023-01-01T10:01:00Z'], // Multiple timestamps
            'process.name': ['chrome.exe'],
          },
        },
      ];

      const csv = formatResultsAsCSV(dataWithArrays, mockColumns, mockEcsMapping);
      const lines = csv.split('\n');
      expect(lines[1]).toBe('2023-01-01T10:00:00Z,agent-001,chrome.exe,-');
    });

    it('should handle complex ECS mapped fields', () => {
      const complexData: ResultEdges = [
        {
          _index: 'logs-osquery_manager.result-default',
          _id: '1',
          _source: {
            'agent.name': 'agent-001',
            'user.name': ['john', 'doe'], // Array in ECS field
          },
          fields: {
            timestamp: ['2023-01-01T10:00:00Z'],
            'process.name': ['chrome.exe'],
          },
        },
      ];

      const csv = formatResultsAsCSV(complexData, mockColumns, mockEcsMapping, {
        arrayFormat: 'pipe-separated'
      });
      const lines = csv.split('\n');
      expect(lines[1]).toBe('2023-01-01T10:00:00Z,agent-001,chrome.exe,"john | doe"');
    });

    it('should apply custom formatting options', () => {
      const dataWithObjects: ResultEdges = [
        {
          _index: 'logs-osquery_manager.result-default',
          _id: '1',
          _source: {
            'agent.name': 'agent-001',
          },
          fields: {
            timestamp: ['2023-01-01T10:00:00Z'],
            'process.name': [{ name: 'chrome.exe', pid: 1234 }],
          },
        },
      ];

      const csv = formatResultsAsCSV(dataWithObjects, mockColumns, mockEcsMapping, {
        objectFormat: 'json',
        arrayFormat: 'json',
      });
      const lines = csv.split('\n');
      expect(lines[1]).toContain('{"name":"chrome.exe","pid":1234}');
    });

    it('should handle current page scope', () => {
      const currentPageData = [mockData[0]]; // Only first row
      const options: CsvExportOptions = {
        scope: {
          type: 'current-page',
          currentPageData,
        },
      };

      const csv = formatResultsAsCSV(mockData, mockColumns, mockEcsMapping, options);
      const lines = csv.split('\n');
      expect(lines).toHaveLength(2); // header + 1 data row
      expect(lines[1]).toBe('2023-01-01T10:00:00Z,agent-001,chrome.exe,john_doe');
    });

    it('should escape CSV values properly in output', () => {
      const dataWithSpecialChars: ResultEdges = [
        {
          _index: 'logs-osquery_manager.result-default',
          _id: '1',
          _source: {
            'agent.name': 'agent-001',
          },
          fields: {
            timestamp: ['2023-01-01T10:00:00Z'],
            'process.name': ['app, with comma'],
          },
        },
      ];

      const csv = formatResultsAsCSV(dataWithSpecialChars, mockColumns, mockEcsMapping);
      const lines = csv.split('\n');
      expect(lines[1]).toBe('2023-01-01T10:00:00Z,agent-001,"app, with comma",-');
    });
  });

  describe('generateCsvFilename', () => {
    const mockActionId = 'abc123def456ghi789';

    beforeEach(() => {
      // Mock Date to ensure consistent testing
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2023-01-15T10:30:00Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should generate basic filename with action ID and timestamp', () => {
      const filename = generateCsvFilename(mockActionId);
      expect(filename).toBe('osquery-results-abc123de-2023-01-15.csv');
    });

    it('should handle short action IDs', () => {
      const filename = generateCsvFilename('short');
      expect(filename).toBe('osquery-results-short-2023-01-15.csv');
    });

    it('should include custom prefix', () => {
      const options: CsvExportOptions = { filenamePrefix: 'custom-export' };
      const filename = generateCsvFilename(mockActionId, options);
      expect(filename).toBe('custom-export-abc123de-2023-01-15.csv');
    });

    it('should include current-page suffix', () => {
      const options: CsvExportOptions = {
        scope: { type: 'current-page' }
      };
      const filename = generateCsvFilename(mockActionId, options);
      expect(filename).toBe('osquery-results-abc123de-current-page-2023-01-15.csv');
    });

    it('should not include suffix for all-results scope', () => {
      const options: CsvExportOptions = {
        scope: { type: 'all-results' }
      };
      const filename = generateCsvFilename(mockActionId, options);
      expect(filename).toBe('osquery-results-abc123de-2023-01-15.csv');
    });

    it('should combine custom prefix and current-page suffix', () => {
      const options: CsvExportOptions = {
        filenamePrefix: 'my-export',
        scope: { type: 'current-page' }
      };
      const filename = generateCsvFilename(mockActionId, options);
      expect(filename).toBe('my-export-abc123de-current-page-2023-01-15.csv');
    });
  });
});
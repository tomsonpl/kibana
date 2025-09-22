/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { get, isEmpty, isArray, isObject, keys } from 'lodash/fp';
import type { EuiDataGridColumn } from '@elastic/eui';
import type { ResultEdges } from '../../common/search_strategy';

/**
 * Escapes a value for CSV format by wrapping in quotes and escaping internal quotes
 * @param value - The value to escape
 * @returns The escaped CSV value
 */
export const escapeCsvValue = (value: unknown): string => {
  if (value == null) return '';

  const stringValue = String(value);

  // Check if escaping is needed (contains comma, quote, newline, or starts with = + - @ which could be formula injection)
  if (
    stringValue.includes(',') ||
    stringValue.includes('"') ||
    stringValue.includes('\n') ||
    stringValue.includes('\r') ||
    /^[=+\-@]/.test(stringValue)
  ) {
    // Escape quotes by doubling them and wrap in quotes
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
};

/**
 * Options for controlling CSV formatting behavior
 */
export interface CsvFormattingOptions {
  /** How to format arrays - 'json' or 'pipe-separated' */
  arrayFormat?: 'json' | 'pipe-separated';
  /** How to format objects - 'json' or 'key-value' */
  objectFormat?: 'json' | 'key-value';
  /** Maximum depth for nested objects */
  maxDepth?: number;
  /** Whether to flatten nested objects using dot notation */
  flattenObjects?: boolean;
}

/**
 * Formats an array value for CSV output
 */
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

/**
 * Formats an object value for CSV output
 */
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

/**
 * Formats a single field value for CSV output, handling different data types appropriately
 * @param fieldValue - The field value to format
 * @param columnId - The column identifier for special formatting
 * @param options - Formatting options for complex data types
 * @returns The formatted value string
 */
export const formatFieldValue = (
  fieldValue: unknown,
  columnId: string,
  options: CsvFormattingOptions = {}
): string => {
  const {
    arrayFormat = 'pipe-separated',
    objectFormat = 'key-value',
    maxDepth = 3,
    flattenObjects = false
  } = options;

  // Handle null/undefined values
  if (fieldValue == null) {
    return '';
  }

  // Handle agent.name specially - extract just the name without link formatting
  if (columnId === 'agent.name') {
    return String(fieldValue);
  }

  // Handle arrays
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

  // Handle objects (excluding null)
  if (typeof fieldValue === 'object' && fieldValue !== null) {
    try {
      const obj = fieldValue as Record<string, unknown>;

      if (flattenObjects && Object.keys(obj).length > 0) {
        // Flatten nested object using dot notation
        const flattened = flattenObject(obj, '', maxDepth);
        return formatObjectValue(flattened, objectFormat, 0, 1);
      }

      return formatObjectValue(obj, objectFormat, 0, maxDepth);
    } catch (error) {
      return '[Object - Formatting Error]';
    }
  }

  // Handle primitive types
  if (typeof fieldValue === 'boolean') {
    return fieldValue ? 'true' : 'false';
  }

  if (typeof fieldValue === 'number') {
    return isFinite(fieldValue) ? String(fieldValue) : 'Invalid Number';
  }

  return String(fieldValue);
};

/**
 * Flattens a nested object using dot notation
 */
const flattenObject = (
  obj: Record<string, unknown>,
  prefix: string = '',
  maxDepth: number = 3,
  currentDepth: number = 0
): Record<string, unknown> => {
  if (currentDepth >= maxDepth) {
    return { [prefix || 'object']: '[Max Depth Reached]' };
  }

  const flattened: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}.${key}` : key;

    if (value != null && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(flattened, flattenObject(
        value as Record<string, unknown>,
        newKey,
        maxDepth,
        currentDepth + 1
      ));
    } else {
      flattened[newKey] = value;
    }
  }

  return flattened;
};

/**
 * Export scope options
 */
export interface ExportScope {
  /** Export type: 'current-page' or 'all-results' */
  type: 'current-page' | 'all-results';
  /** Current page data (for current-page export) */
  currentPageData?: ResultEdges;
}

/**
 * Complete CSV export options
 */
export interface CsvExportOptions extends CsvFormattingOptions {
  /** Export scope configuration */
  scope?: ExportScope;
  /** Include row numbers */
  includeRowNumbers?: boolean;
  /** Custom filename prefix */
  filenamePrefix?: string;
}

/**
 * Formats Osquery results data into CSV format
 * @param data - The results data from useAllResults
 * @param columns - The EuiDataGridColumn configuration
 * @param ecsMapping - The ECS mapping configuration for identifying mapped fields
 * @param options - Export and formatting options
 * @returns The formatted CSV string
 */
export const formatResultsAsCSV = (
  data: ResultEdges,
  columns: EuiDataGridColumn[],
  ecsMapping?: Record<string, { field?: string }>,
  options: CsvExportOptions = {}
): string => {
  const {
    scope,
    includeRowNumbers = false,
    arrayFormat = 'pipe-separated',
    objectFormat = 'key-value',
    maxDepth = 3,
    flattenObjects = false
  } = options;

  // Determine which data to export
  let exportData = data;
  if (scope?.type === 'current-page' && scope.currentPageData) {
    exportData = scope.currentPageData;
  }

  if (!exportData?.length || !columns?.length) {
    return '';
  }

  // Get ECS mapped column names (same logic as results table)
  const ecsMappingColumns = keys(ecsMapping || {});

  // Create header row using displayAsText or id
  const baseHeaders = columns.map((col) => escapeCsvValue(col.displayAsText || col.id));
  const headers = includeRowNumbers ? ['Row #', ...baseHeaders] : baseHeaders;
  const csvRows = [headers.join(',')];

  // Formatting options for field values
  const formatOptions: CsvFormattingOptions = {
    arrayFormat,
    objectFormat,
    maxDepth,
    flattenObjects
  };

  // Process each data row
  exportData.forEach((row, rowIndex) => {
    const csvRow = columns.map((column) => {
      let fieldValue: unknown;

      // Use the same logic as the results table renderCellValue function
      if (ecsMappingColumns.includes(column.id)) {
        // For ECS mapped fields, use lodash get to traverse nested _source
        const ecsFieldValue = get(column.id, row._source);
        if (isArray(ecsFieldValue) || isObject(ecsFieldValue)) {
          // Use enhanced formatting for complex types
          fieldValue = ecsFieldValue;
        } else {
          fieldValue = ecsFieldValue ?? '-';
        }
      } else {
        // For regular fields, use the fields object
        fieldValue = row.fields?.[column.id];

        // Elasticsearch field values are typically arrays, extract first element
        if (Array.isArray(fieldValue) && fieldValue.length > 0) {
          fieldValue = fieldValue[0];
        }

        // Return '-' for empty values (same as results table)
        if (isEmpty(fieldValue)) {
          fieldValue = '-';
        }
      }

      // Format the field value with enhanced options
      const formattedValue = formatFieldValue(fieldValue, column.id, formatOptions);

      // Escape for CSV
      return escapeCsvValue(formattedValue);
    });

    // Add row number if requested
    const finalRow = includeRowNumbers ? [String(rowIndex + 1), ...csvRow] : csvRow;
    csvRows.push(finalRow.join(','));
  });

  return csvRows.join('\n');
};

/**
 * Generates a filename for the CSV export
 * @param actionId - The action ID for the query
 * @param options - Export options that may affect filename
 * @returns A descriptive filename
 */
export const generateCsvFilename = (actionId: string, options: CsvExportOptions = {}): string => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
  const truncatedActionId = actionId.length > 8 ? actionId.substring(0, 8) : actionId;

  const prefix = options.filenamePrefix || 'osquery-results';
  let suffix = '';

  if (options.scope?.type === 'current-page') {
    suffix = '-current-page';
  }

  return `${prefix}-${truncatedActionId}${suffix}-${timestamp}.csv`;
};
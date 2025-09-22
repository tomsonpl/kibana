/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useState } from 'react';
import {
  EuiPopover,
  EuiForm,
  EuiFormRow,
  EuiRadioGroup,
  EuiSwitch,
  EuiButtonEmpty,
  EuiSpacer,
  EuiText,
  EuiCallOut,
  EuiHorizontalRule,
} from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import type { CsvExportOptions as CsvExportConfig } from '../../../common/utils/csv_formatter';

export interface CsvExportOptionsProps {
  /** Current visible rows count */
  currentPageRows: number;
  /** Total rows available */
  totalRows: number;
  /** Whether export is currently in progress */
  isExporting: boolean;
  /** Callback when export is requested with options */
  onExport: (options: CsvExportConfig) => void;
  /** Whether the component is disabled */
  disabled?: boolean;
}

export const CsvExportOptions: React.FC<CsvExportOptionsProps> = ({
  currentPageRows,
  totalRows,
  isExporting,
  onExport,
  disabled = false,
}) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [exportScope, setExportScope] = useState<'current-page' | 'all-results'>('all-results');
  const [includeRowNumbers, setIncludeRowNumbers] = useState(false);
  const [arrayFormat, setArrayFormat] = useState<'json' | 'pipe-separated'>('pipe-separated');
  const [objectFormat, setObjectFormat] = useState<'json' | 'key-value'>('key-value');
  const [flattenObjects, setFlattenObjects] = useState(false);

  const handleExport = () => {
    const options: CsvExportConfig = {
      scope: {
        type: exportScope,
      },
      includeRowNumbers,
      arrayFormat,
      objectFormat,
      flattenObjects,
      maxDepth: 3,
    };

    onExport(options);
    setIsPopoverOpen(false);
  };

  const scopeOptions = [
    {
      id: 'all-results',
      label: i18n.translate('xpack.osquery.results.csvExport.options.allResults', {
        defaultMessage: 'All results ({count} rows)',
        values: { count: totalRows },
      }),
      disabled: false,
    },
    {
      id: 'current-page',
      label: i18n.translate('xpack.osquery.results.csvExport.options.currentPage', {
        defaultMessage: 'Current page ({count} rows)',
        values: { count: currentPageRows },
      }),
      disabled: currentPageRows === 0,
    },
  ];

  const arrayFormatOptions = [
    {
      id: 'pipe-separated',
      label: i18n.translate('xpack.osquery.results.csvExport.options.arrayFormat.pipeSeparated', {
        defaultMessage: 'Pipe separated (item1 | item2 | item3)',
      }),
    },
    {
      id: 'json',
      label: i18n.translate('xpack.osquery.results.csvExport.options.arrayFormat.json', {
        defaultMessage: 'JSON format (["item1", "item2", "item3"])',
      }),
    },
  ];

  const objectFormatOptions = [
    {
      id: 'key-value',
      label: i18n.translate('xpack.osquery.results.csvExport.options.objectFormat.keyValue', {
        defaultMessage: 'Key-value pairs (key1: value1, key2: value2)',
      }),
    },
    {
      id: 'json',
      label: i18n.translate('xpack.osquery.results.csvExport.options.objectFormat.json', {
        defaultMessage: 'JSON format ({"key1": "value1", "key2": "value2"})',
      }),
    },
  ];

  const buttonLabel = i18n.translate('xpack.osquery.results.csvExport.buttonLabel', {
    defaultMessage: 'Export CSV',
  });

  const isLargeDataset = totalRows > 1000;


  const exportButton = (
    <EuiButtonEmpty
      aria-label={buttonLabel}
      size="xs"
      iconType="exportAction"
      iconSide="left"
      color="text"
      onClick={() => setIsPopoverOpen(!isPopoverOpen)}
      isLoading={isExporting}
      disabled={disabled || isExporting || totalRows === 0}
      data-test-subj="osquery-results-export-csv-options-button"
    >
      {buttonLabel}
    </EuiButtonEmpty>
  );

  return (
    <EuiPopover
      button={exportButton}
      isOpen={isPopoverOpen}
      closePopover={() => setIsPopoverOpen(false)}
      panelPaddingSize="m"
      anchorPosition="downLeft"
      data-test-subj="osquery-results-export-csv-options-popover"
    >
      <div style={{ width: '320px' }}>
        <EuiText size="s">
          <h4>
            {i18n.translate('xpack.osquery.results.csvExport.options.title', {
              defaultMessage: 'Export Options',
            })}
          </h4>
        </EuiText>
        <EuiSpacer size="m" />

        <EuiForm>
          <EuiFormRow
            label={i18n.translate('xpack.osquery.results.csvExport.options.scopeLabel', {
              defaultMessage: 'Export scope',
            })}
            helpText={i18n.translate('xpack.osquery.results.csvExport.options.scopeHelp', {
              defaultMessage: 'Choose which data to include in the export',
            })}
          >
            <EuiRadioGroup
              options={scopeOptions}
              idSelected={exportScope}
              onChange={(id) => setExportScope(id as 'current-page' | 'all-results')}
              data-test-subj="osquery-results-export-csv-scope-radio"
            />
          </EuiFormRow>

          {isLargeDataset && (
            <>
              <EuiSpacer size="m" />
              <EuiCallOut
                size="s"
                color="primary"
                title={i18n.translate('xpack.osquery.results.csvExport.options.largeDatasetInfo', {
                  defaultMessage: 'Large dataset optimization',
                })}
              >
                <EuiText size="s">
                  {i18n.translate('xpack.osquery.results.csvExport.options.largeDatasetInfoText', {
                    defaultMessage: 'For datasets over 5,000 rows, we automatically use server-side processing for optimal performance and memory efficiency.',
                  })}
                </EuiText>
              </EuiCallOut>
            </>
          )}

          <EuiSpacer size="m" />
          <EuiHorizontalRule margin="none" />
          <EuiSpacer size="m" />

          <EuiFormRow
            label={i18n.translate('xpack.osquery.results.csvExport.options.includeRowNumbers', {
              defaultMessage: 'Include row numbers',
            })}
          >
            <EuiSwitch
              label=""
              checked={includeRowNumbers}
              onChange={(e) => setIncludeRowNumbers(e.target.checked)}
              data-test-subj="osquery-results-export-csv-row-numbers-switch"
            />
          </EuiFormRow>

          <EuiFormRow
            label={i18n.translate('xpack.osquery.results.csvExport.options.arrayFormatLabel', {
              defaultMessage: 'Array formatting',
            })}
            helpText={i18n.translate('xpack.osquery.results.csvExport.options.arrayFormatHelp', {
              defaultMessage: 'How to format array values in CSV cells',
            })}
          >
            <EuiRadioGroup
              options={arrayFormatOptions}
              idSelected={arrayFormat}
              onChange={(id) => setArrayFormat(id as 'json' | 'pipe-separated')}
              data-test-subj="osquery-results-export-csv-array-format-radio"
            />
          </EuiFormRow>

          <EuiFormRow
            label={i18n.translate('xpack.osquery.results.csvExport.options.objectFormatLabel', {
              defaultMessage: 'Object formatting',
            })}
            helpText={i18n.translate('xpack.osquery.results.csvExport.options.objectFormatHelp', {
              defaultMessage: 'How to format object values in CSV cells',
            })}
          >
            <EuiRadioGroup
              options={objectFormatOptions}
              idSelected={objectFormat}
              onChange={(id) => setObjectFormat(id as 'json' | 'key-value')}
              data-test-subj="osquery-results-export-csv-object-format-radio"
            />
          </EuiFormRow>

          <EuiFormRow
            label={i18n.translate('xpack.osquery.results.csvExport.options.flattenObjects', {
              defaultMessage: 'Flatten nested objects',
            })}
            helpText={i18n.translate('xpack.osquery.results.csvExport.options.flattenObjectsHelp', {
              defaultMessage: 'Convert nested objects to dot notation (e.g., user.name)',
            })}
          >
            <EuiSwitch
              label=""
              checked={flattenObjects}
              onChange={(e) => setFlattenObjects(e.target.checked)}
              data-test-subj="osquery-results-export-csv-flatten-objects-switch"
            />
          </EuiFormRow>

          <EuiSpacer size="l" />

          <EuiButtonEmpty
            color="primary"
            iconType="exportAction"
            onClick={handleExport}
            disabled={isExporting}
            data-test-subj="osquery-results-export-csv-confirm-button"
          >
            {i18n.translate('xpack.osquery.results.csvExport.options.exportButton', {
              defaultMessage: 'Export CSV',
            })}
          </EuiButtonEmpty>
        </EuiForm>
      </div>
    </EuiPopover>
  );
};
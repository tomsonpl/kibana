/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { EuiButtonEmpty, EuiToolTip, EuiPopover, EuiSpacer } from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import type { CsvExportOptions } from '../../../common/utils/csv_formatter';
import type { ExportProgress } from '../hooks/use_csv_export';
import { CsvExportProgress } from './csv_export_progress';

interface CsvExportButtonProps {
  onExport: (options?: CsvExportOptions) => void;
  isLoading?: boolean;
  disabled?: boolean;
  totalRows?: number;
  currentPageRows?: number;
  progress?: ExportProgress;
  error?: string;
  /** Whether to show the simple button (true) or options dropdown (false) */
  simple?: boolean;
}

export const CsvExportButton: React.FC<CsvExportButtonProps> = ({
  onExport,
  isLoading = false,
  disabled = false,
  totalRows = 0,
  currentPageRows = 0,
  progress,
  error,
  simple = false,
}) => {
  const [isProgressPopoverOpen, setIsProgressPopoverOpen] = React.useState(false);

  const buttonLabel = i18n.translate('xpack.osquery.results.csvExport.buttonLabel', {
    defaultMessage: 'Export CSV',
  });

  // Determine tooltip content based on state
  let tooltipContent: string;
  if (disabled) {
    tooltipContent = i18n.translate('xpack.osquery.results.csvExport.disabledTooltip', {
      defaultMessage: 'No data available to export',
    });
  } else if (error) {
    tooltipContent = i18n.translate('xpack.osquery.results.csvExport.errorTooltip', {
      defaultMessage: 'Last export failed: {error}',
      values: { error },
    });
  } else if (progress) {
    tooltipContent = i18n.translate('xpack.osquery.results.csvExport.progressTooltip', {
      defaultMessage: 'Export in progress: {phase} ({percentage}%)',
      values: {
        phase: progress.phase,
        percentage: Math.round(progress.percentage)
      },
    });
  } else {
    tooltipContent = i18n.translate('xpack.osquery.results.csvExport.tooltip', {
      defaultMessage: 'Download {totalRows, plural, one {# result} other {# results}} as CSV file',
      values: { totalRows },
    });
  }

  const handleSimpleExport = () => {
    onExport(); // Use default options for simple export
  };

  // Show progress popover when exporting
  React.useEffect(() => {
    if (progress && !isProgressPopoverOpen) {
      setIsProgressPopoverOpen(true);
    } else if (!progress && isProgressPopoverOpen) {
      // Keep popover open briefly after completion
      const timer = setTimeout(() => setIsProgressPopoverOpen(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [progress, isProgressPopoverOpen]);

  const exportButton = (
    <EuiButtonEmpty
      aria-label={buttonLabel}
      size="xs"
      iconType="exportAction"
      color={error ? 'danger' : 'text'}
      onClick={simple ? handleSimpleExport : () => setIsProgressPopoverOpen(!isProgressPopoverOpen)}
      isLoading={isLoading && !progress}
      disabled={disabled || totalRows === 0}
      data-test-subj="osquery-results-export-csv-button"
    >
      {buttonLabel}
    </EuiButtonEmpty>
  );

  // If simple mode or no progress, show basic tooltip
  if (simple || !progress) {
    return (
      <EuiToolTip content={tooltipContent}>
        {exportButton}
      </EuiToolTip>
    );
  }

  // Show progress popover during export
  return (
    <EuiPopover
      button={exportButton}
      isOpen={isProgressPopoverOpen}
      closePopover={() => setIsProgressPopoverOpen(false)}
      panelPaddingSize="m"
      anchorPosition="downLeft"
      data-test-subj="osquery-results-export-csv-progress-popover"
    >
      <div style={{ width: '300px' }}>
        <CsvExportProgress progress={progress} showDetails={true} />
        {progress.phase === 'complete' && (
          <>
            <EuiSpacer size="s" />
            <EuiButtonEmpty
              size="s"
              onClick={() => setIsProgressPopoverOpen(false)}
              data-test-subj="osquery-results-export-csv-progress-close"
            >
              {i18n.translate('xpack.osquery.results.csvExport.progress.close', {
                defaultMessage: 'Close',
              })}
            </EuiButtonEmpty>
          </>
        )}
      </div>
    </EuiPopover>
  );
};
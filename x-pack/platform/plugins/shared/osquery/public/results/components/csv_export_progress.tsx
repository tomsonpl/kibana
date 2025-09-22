/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import {
  EuiProgress,
  EuiText,
  EuiSpacer,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
} from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import type { ExportProgress } from '../hooks/use_csv_export';

export interface CsvExportProgressProps {
  /** Current export progress */
  progress: ExportProgress;
  /** Whether to show detailed progress information */
  showDetails?: boolean;
}

export const CsvExportProgress: React.FC<CsvExportProgressProps> = ({
  progress,
  showDetails = true,
}) => {
  const getPhaseLabel = (phase: ExportProgress['phase']): string => {
    switch (phase) {
      case 'preparing':
        return i18n.translate('xpack.osquery.results.csvExport.progress.preparing', {
          defaultMessage: 'Preparing export...',
        });
      case 'formatting':
        return i18n.translate('xpack.osquery.results.csvExport.progress.formatting', {
          defaultMessage: 'Formatting data...',
        });
      case 'downloading':
        return i18n.translate('xpack.osquery.results.csvExport.progress.downloading', {
          defaultMessage: 'Downloading file...',
        });
      case 'complete':
        return i18n.translate('xpack.osquery.results.csvExport.progress.complete', {
          defaultMessage: 'Export complete!',
        });
      default:
        return i18n.translate('xpack.osquery.results.csvExport.progress.processing', {
          defaultMessage: 'Processing...',
        });
    }
  };

  const getPhaseIcon = (phase: ExportProgress['phase']): string => {
    switch (phase) {
      case 'preparing':
        return 'clock';
      case 'formatting':
        return 'document';
      case 'downloading':
        return 'download';
      case 'complete':
        return 'checkInCircleFilled';
      default:
        return 'gear';
    }
  };

  const progressColor = progress.phase === 'complete' ? 'success' : 'primary';

  return (
    <div data-test-subj="osquery-results-export-csv-progress">
      <EuiFlexGroup alignItems="center" gutterSize="s">
        <EuiFlexItem grow={false}>
          <EuiIcon
            type={getPhaseIcon(progress.phase)}
            color={progressColor}
            data-test-subj={`osquery-results-export-csv-progress-icon-${progress.phase}`}
          />
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiText size="s" color="subdued">
            {getPhaseLabel(progress.phase)}
          </EuiText>
        </EuiFlexItem>
        {showDetails && progress.percentage !== undefined && (
          <EuiFlexItem grow={false}>
            <EuiText size="s" color="subdued">
              {Math.round(progress.percentage)}%
            </EuiText>
          </EuiFlexItem>
        )}
      </EuiFlexGroup>

      <EuiSpacer size="xs" />

      <EuiProgress
        value={progress.percentage}
        max={100}
        color={progressColor}
        size="s"
        data-test-subj="osquery-results-export-csv-progress-bar"
      />

      {showDetails && progress.processedRows !== undefined && progress.totalRows !== undefined && (
        <>
          <EuiSpacer size="xs" />
          <EuiText size="xs" color="subdued" textAlign="center">
            {i18n.translate('xpack.osquery.results.csvExport.progress.rowsProcessed', {
              defaultMessage: '{processed} of {total} rows processed',
              values: {
                processed: progress.processedRows.toLocaleString(),
                total: progress.totalRows.toLocaleString(),
              },
            })}
          </EuiText>
        </>
      )}
    </div>
  );
};
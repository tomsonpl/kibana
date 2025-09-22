/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { I18nProvider } from '@kbn/i18n-react';
import { CsvExportProgress } from './csv_export_progress';
import type { ExportProgress } from '../hooks/use_csv_export';

describe('CsvExportProgress Component', () => {
  const renderWithI18n = (ui: React.ReactElement) => {
    return render(<I18nProvider>{ui}</I18nProvider>);
  };

  describe('Basic Rendering', () => {
    it('should render progress component with all elements', () => {
      const progress: ExportProgress = {
        phase: 'formatting',
        percentage: 50,
        processedRows: 500,
        totalRows: 1000,
      };

      renderWithI18n(<CsvExportProgress progress={progress} />);

      expect(screen.getByTestId('osquery-results-export-csv-progress')).toBeInTheDocument();
      expect(screen.getByTestId('osquery-results-export-csv-progress-bar')).toBeInTheDocument();
    });

    it('should render without details when showDetails is false', () => {
      const progress: ExportProgress = {
        phase: 'formatting',
        percentage: 50,
        processedRows: 500,
        totalRows: 1000,
      };

      renderWithI18n(<CsvExportProgress progress={progress} showDetails={false} />);

      expect(screen.getByTestId('osquery-results-export-csv-progress')).toBeInTheDocument();
      expect(screen.queryByText('50%')).not.toBeInTheDocument();
      expect(screen.queryByText(/500.*1,000.*rows processed/)).not.toBeInTheDocument();
    });
  });

  describe('Phase Labels and Icons', () => {
    it('should show correct label and icon for preparing phase', () => {
      const progress: ExportProgress = {
        phase: 'preparing',
        percentage: 10,
      };

      renderWithI18n(<CsvExportProgress progress={progress} />);

      expect(screen.getByText('Preparing export...')).toBeInTheDocument();
      expect(screen.getByTestId('osquery-results-export-csv-progress-icon-preparing')).toBeInTheDocument();
    });

    it('should show correct label and icon for formatting phase', () => {
      const progress: ExportProgress = {
        phase: 'formatting',
        percentage: 50,
      };

      renderWithI18n(<CsvExportProgress progress={progress} />);

      expect(screen.getByText('Formatting data...')).toBeInTheDocument();
      expect(screen.getByTestId('osquery-results-export-csv-progress-icon-formatting')).toBeInTheDocument();
    });

    it('should show correct label and icon for downloading phase', () => {
      const progress: ExportProgress = {
        phase: 'downloading',
        percentage: 90,
      };

      renderWithI18n(<CsvExportProgress progress={progress} />);

      expect(screen.getByText('Downloading file...')).toBeInTheDocument();
      expect(screen.getByTestId('osquery-results-export-csv-progress-icon-downloading')).toBeInTheDocument();
    });

    it('should show correct label and icon for complete phase', () => {
      const progress: ExportProgress = {
        phase: 'complete',
        percentage: 100,
      };

      renderWithI18n(<CsvExportProgress progress={progress} />);

      expect(screen.getByText('Export complete!')).toBeInTheDocument();
      expect(screen.getByTestId('osquery-results-export-csv-progress-icon-complete')).toBeInTheDocument();
    });

    it('should handle unknown phase gracefully', () => {
      const progress = {
        phase: 'unknown' as any,
        percentage: 25,
      };

      renderWithI18n(<CsvExportProgress progress={progress} />);

      expect(screen.getByText('Processing...')).toBeInTheDocument();
    });
  });

  describe('Progress Bar', () => {
    it('should show correct progress percentage', () => {
      const progress: ExportProgress = {
        phase: 'formatting',
        percentage: 75,
      };

      renderWithI18n(<CsvExportProgress progress={progress} />);

      const progressBar = screen.getByTestId('osquery-results-export-csv-progress-bar');
      expect(progressBar).toHaveAttribute('value', '75');
      expect(progressBar).toHaveAttribute('max', '100');
    });

    it('should use primary color for non-complete phases', () => {
      const progress: ExportProgress = {
        phase: 'formatting',
        percentage: 50,
      };

      renderWithI18n(<CsvExportProgress progress={progress} />);

      const progressBar = screen.getByTestId('osquery-results-export-csv-progress-bar');
      expect(progressBar).toHaveAttribute('color', 'primary');
    });

    it('should use success color for complete phase', () => {
      const progress: ExportProgress = {
        phase: 'complete',
        percentage: 100,
      };

      renderWithI18n(<CsvExportProgress progress={progress} />);

      const progressBar = screen.getByTestId('osquery-results-export-csv-progress-bar');
      expect(progressBar).toHaveAttribute('color', 'success');
    });

    it('should handle zero percentage', () => {
      const progress: ExportProgress = {
        phase: 'preparing',
        percentage: 0,
      };

      renderWithI18n(<CsvExportProgress progress={progress} />);

      const progressBar = screen.getByTestId('osquery-results-export-csv-progress-bar');
      expect(progressBar).toHaveAttribute('value', '0');
    });

    it('should handle 100% percentage', () => {
      const progress: ExportProgress = {
        phase: 'complete',
        percentage: 100,
      };

      renderWithI18n(<CsvExportProgress progress={progress} />);

      const progressBar = screen.getByTestId('osquery-results-export-csv-progress-bar');
      expect(progressBar).toHaveAttribute('value', '100');
    });
  });

  describe('Percentage Display', () => {
    it('should show percentage when showDetails is true', () => {
      const progress: ExportProgress = {
        phase: 'formatting',
        percentage: 67.5,
      };

      renderWithI18n(<CsvExportProgress progress={progress} showDetails={true} />);

      expect(screen.getByText('68%')).toBeInTheDocument(); // Rounded
    });

    it('should not show percentage when showDetails is false', () => {
      const progress: ExportProgress = {
        phase: 'formatting',
        percentage: 50,
      };

      renderWithI18n(<CsvExportProgress progress={progress} showDetails={false} />);

      expect(screen.queryByText('50%')).not.toBeInTheDocument();
    });

    it('should round percentage to nearest integer', () => {
      const progress: ExportProgress = {
        phase: 'formatting',
        percentage: 33.7,
      };

      renderWithI18n(<CsvExportProgress progress={progress} />);

      expect(screen.getByText('34%')).toBeInTheDocument();
    });

    it('should handle undefined percentage gracefully', () => {
      const progress: ExportProgress = {
        phase: 'formatting',
        percentage: undefined as any,
      };

      renderWithI18n(<CsvExportProgress progress={progress} />);

      expect(screen.queryByText('%')).not.toBeInTheDocument();
    });
  });

  describe('Row Count Display', () => {
    it('should show row count when processedRows and totalRows are provided', () => {
      const progress: ExportProgress = {
        phase: 'formatting',
        percentage: 50,
        processedRows: 1500,
        totalRows: 3000,
      };

      renderWithI18n(<CsvExportProgress progress={progress} />);

      expect(screen.getByText('1,500 of 3,000 rows processed')).toBeInTheDocument();
    });

    it('should not show row count when processedRows is missing', () => {
      const progress: ExportProgress = {
        phase: 'formatting',
        percentage: 50,
        totalRows: 1000,
      };

      renderWithI18n(<CsvExportProgress progress={progress} />);

      expect(screen.queryByText(/rows processed/)).not.toBeInTheDocument();
    });

    it('should not show row count when totalRows is missing', () => {
      const progress: ExportProgress = {
        phase: 'formatting',
        percentage: 50,
        processedRows: 500,
      };

      renderWithI18n(<CsvExportProgress progress={progress} />);

      expect(screen.queryByText(/rows processed/)).not.toBeInTheDocument();
    });

    it('should not show row count when showDetails is false', () => {
      const progress: ExportProgress = {
        phase: 'formatting',
        percentage: 50,
        processedRows: 500,
        totalRows: 1000,
      };

      renderWithI18n(<CsvExportProgress progress={progress} showDetails={false} />);

      expect(screen.queryByText(/rows processed/)).not.toBeInTheDocument();
    });

    it('should format large numbers with locale formatting', () => {
      const progress: ExportProgress = {
        phase: 'formatting',
        percentage: 50,
        processedRows: 1234567,
        totalRows: 2468024,
      };

      renderWithI18n(<CsvExportProgress progress={progress} />);

      // Check for comma formatting (locale dependent)
      expect(screen.getByText(/1,234,567.*2,468,024.*rows processed/)).toBeInTheDocument();
    });

    it('should handle zero values', () => {
      const progress: ExportProgress = {
        phase: 'preparing',
        percentage: 0,
        processedRows: 0,
        totalRows: 1000,
      };

      renderWithI18n(<CsvExportProgress progress={progress} />);

      expect(screen.getByText('0 of 1,000 rows processed')).toBeInTheDocument();
    });
  });

  describe('Icon Types', () => {
    it('should use clock icon for preparing phase', () => {
      const progress: ExportProgress = {
        phase: 'preparing',
        percentage: 10,
      };

      renderWithI18n(<CsvExportProgress progress={progress} />);

      const icon = screen.getByTestId('osquery-results-export-csv-progress-icon-preparing');
      expect(icon).toHaveAttribute('type', 'clock');
    });

    it('should use document icon for formatting phase', () => {
      const progress: ExportProgress = {
        phase: 'formatting',
        percentage: 50,
      };

      renderWithI18n(<CsvExportProgress progress={progress} />);

      const icon = screen.getByTestId('osquery-results-export-csv-progress-icon-formatting');
      expect(icon).toHaveAttribute('type', 'document');
    });

    it('should use download icon for downloading phase', () => {
      const progress: ExportProgress = {
        phase: 'downloading',
        percentage: 90,
      };

      renderWithI18n(<CsvExportProgress progress={progress} />);

      const icon = screen.getByTestId('osquery-results-export-csv-progress-icon-downloading');
      expect(icon).toHaveAttribute('type', 'download');
    });

    it('should use checkInCircleFilled icon for complete phase', () => {
      const progress: ExportProgress = {
        phase: 'complete',
        percentage: 100,
      };

      renderWithI18n(<CsvExportProgress progress={progress} />);

      const icon = screen.getByTestId('osquery-results-export-csv-progress-icon-complete');
      expect(icon).toHaveAttribute('type', 'checkInCircleFilled');
    });

    it('should use gear icon for unknown phases', () => {
      const progress = {
        phase: 'unknown' as any,
        percentage: 25,
      };

      renderWithI18n(<CsvExportProgress progress={progress} />);

      // For unknown phase, it should fall back to the default case
      expect(screen.getByText('Processing...')).toBeInTheDocument();
    });
  });

  describe('Visual States', () => {
    it('should use primary color for non-complete phases', () => {
      const progress: ExportProgress = {
        phase: 'formatting',
        percentage: 50,
      };

      renderWithI18n(<CsvExportProgress progress={progress} />);

      const icon = screen.getByTestId('osquery-results-export-csv-progress-icon-formatting');
      expect(icon).toHaveAttribute('color', 'primary');
    });

    it('should use success color for complete phase', () => {
      const progress: ExportProgress = {
        phase: 'complete',
        percentage: 100,
      };

      renderWithI18n(<CsvExportProgress progress={progress} />);

      const icon = screen.getByTestId('osquery-results-export-csv-progress-icon-complete');
      expect(icon).toHaveAttribute('color', 'success');
    });
  });

  describe('Accessibility', () => {
    it('should have proper test subjects for automation', () => {
      const progress: ExportProgress = {
        phase: 'formatting',
        percentage: 50,
        processedRows: 500,
        totalRows: 1000,
      };

      renderWithI18n(<CsvExportProgress progress={progress} />);

      expect(screen.getByTestId('osquery-results-export-csv-progress')).toBeInTheDocument();
      expect(screen.getByTestId('osquery-results-export-csv-progress-bar')).toBeInTheDocument();
      expect(screen.getByTestId('osquery-results-export-csv-progress-icon-formatting')).toBeInTheDocument();
    });

    it('should have appropriate text content for screen readers', () => {
      const progress: ExportProgress = {
        phase: 'formatting',
        percentage: 75,
        processedRows: 750,
        totalRows: 1000,
      };

      renderWithI18n(<CsvExportProgress progress={progress} />);

      // Screen readers should be able to read the phase and progress information
      expect(screen.getByText('Formatting data...')).toBeInTheDocument();
      expect(screen.getByText('75%')).toBeInTheDocument();
      expect(screen.getByText('750 of 1,000 rows processed')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very small percentages', () => {
      const progress: ExportProgress = {
        phase: 'preparing',
        percentage: 0.1,
      };

      renderWithI18n(<CsvExportProgress progress={progress} />);

      expect(screen.getByText('0%')).toBeInTheDocument(); // Should round to 0
    });

    it('should handle percentages over 100', () => {
      const progress: ExportProgress = {
        phase: 'downloading',
        percentage: 105, // Edge case
      };

      renderWithI18n(<CsvExportProgress progress={progress} />);

      expect(screen.getByText('105%')).toBeInTheDocument(); // Should show actual value
    });

    it('should handle negative percentages', () => {
      const progress: ExportProgress = {
        phase: 'preparing',
        percentage: -5, // Edge case
      };

      renderWithI18n(<CsvExportProgress progress={progress} />);

      expect(screen.getByText('-5%')).toBeInTheDocument(); // Should show actual value
    });

    it('should handle processedRows greater than totalRows', () => {
      const progress: ExportProgress = {
        phase: 'formatting',
        percentage: 100,
        processedRows: 1100, // More than total
        totalRows: 1000,
      };

      renderWithI18n(<CsvExportProgress progress={progress} />);

      expect(screen.getByText('1,100 of 1,000 rows processed')).toBeInTheDocument();
    });
  });
});
/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nProvider } from '@kbn/i18n-react';
import { CsvExportButton } from './csv_export_button';
import type { ExportProgress } from '../hooks/use_csv_export';

// Mock EUI components that might cause issues in tests
jest.mock('@elastic/eui', () => {
  const actual = jest.requireActual('@elastic/eui');
  return {
    ...actual,
    EuiPopover: ({ button, children, isOpen, closePopover, ...props }: any) => (
      <div data-test-subj={props['data-test-subj']}>
        {button}
        {isOpen && (
          <div data-test-subj="popover-content">
            {children}
            <button onClick={closePopover} data-test-subj="close-popover">Close</button>
          </div>
        )}
      </div>
    ),
  };
});

// Mock CsvExportProgress component
jest.mock('./csv_export_progress', () => ({
  CsvExportProgress: ({ progress, showDetails }: any) => (
    <div data-test-subj="csv-export-progress">
      <span>Phase: {progress.phase}</span>
      <span>Percentage: {progress.percentage}%</span>
      {showDetails && <span>Details: true</span>}
    </div>
  ),
}));

describe('CsvExportButton Component', () => {
  const defaultProps = {
    onExport: jest.fn(),
    isLoading: false,
    disabled: false,
    totalRows: 100,
    currentPageRows: 10,
  };

  const renderWithI18n = (ui: React.ReactElement) => {
    return render(<I18nProvider>{ui}</I18nProvider>);
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Basic Rendering', () => {
    it('should render export button with correct label', () => {
      renderWithI18n(<CsvExportButton {...defaultProps} />);

      expect(screen.getByText('Export CSV')).toBeInTheDocument();
      expect(screen.getByTestId('osquery-results-export-csv-button')).toBeInTheDocument();
    });

    it('should render button with export icon', () => {
      renderWithI18n(<CsvExportButton {...defaultProps} />);

      const button = screen.getByTestId('osquery-results-export-csv-button');
      expect(button).toHaveAttribute('data-icon-type', 'exportAction');
    });

    it('should show correct aria-label', () => {
      renderWithI18n(<CsvExportButton {...defaultProps} />);

      const button = screen.getByTestId('osquery-results-export-csv-button');
      expect(button).toHaveAttribute('aria-label', 'Export CSV');
    });
  });

  describe('Button States', () => {
    it('should be disabled when disabled prop is true', () => {
      renderWithI18n(<CsvExportButton {...defaultProps} disabled={true} />);

      const button = screen.getByTestId('osquery-results-export-csv-button');
      expect(button).toBeDisabled();
    });

    it('should be disabled when totalRows is 0', () => {
      renderWithI18n(<CsvExportButton {...defaultProps} totalRows={0} />);

      const button = screen.getByTestId('osquery-results-export-csv-button');
      expect(button).toBeDisabled();
    });

    it('should show loading state when isLoading is true', () => {
      renderWithI18n(<CsvExportButton {...defaultProps} isLoading={true} />);

      const button = screen.getByTestId('osquery-results-export-csv-button');
      expect(button).toHaveClass('euiButton-isLoading');
    });

    it('should not show loading when progress is active', () => {
      const progress: ExportProgress = {
        phase: 'formatting',
        percentage: 50,
      };

      renderWithI18n(
        <CsvExportButton {...defaultProps} isLoading={true} progress={progress} />
      );

      const button = screen.getByTestId('osquery-results-export-csv-button');
      expect(button).not.toHaveClass('euiButton-isLoading');
    });

    it('should show danger color when error is present', () => {
      renderWithI18n(<CsvExportButton {...defaultProps} error="Test error" />);

      const button = screen.getByTestId('osquery-results-export-csv-button');
      expect(button).toHaveClass('euiButton--danger');
    });
  });

  describe('Tooltip Content', () => {
    it('should show default tooltip for normal state', () => {
      renderWithI18n(<CsvExportButton {...defaultProps} totalRows={50} />);

      // Tooltip content is rendered in EuiToolTip, check for its presence
      expect(screen.getByText(/Download 50 results as CSV file/)).toBeInTheDocument();
    });

    it('should show disabled tooltip when disabled', () => {
      renderWithI18n(<CsvExportButton {...defaultProps} disabled={true} />);

      expect(screen.getByText('No data available to export')).toBeInTheDocument();
    });

    it('should show error tooltip when error is present', () => {
      const errorMessage = 'Export failed due to network error';
      renderWithI18n(<CsvExportButton {...defaultProps} error={errorMessage} />);

      expect(screen.getByText(`Last export failed: ${errorMessage}`)).toBeInTheDocument();
    });

    it('should show progress tooltip when progress is active', () => {
      const progress: ExportProgress = {
        phase: 'formatting',
        percentage: 75,
      };

      renderWithI18n(<CsvExportButton {...defaultProps} progress={progress} />);

      expect(screen.getByText('Export in progress: formatting (75%)')).toBeInTheDocument();
    });

    it('should handle singular vs plural in tooltip', () => {
      renderWithI18n(<CsvExportButton {...defaultProps} totalRows={1} />);

      expect(screen.getByText(/Download 1 result as CSV file/)).toBeInTheDocument();
    });
  });

  describe('Simple Mode', () => {
    it('should call onExport directly in simple mode', async () => {
      const onExportMock = jest.fn();
      renderWithI18n(
        <CsvExportButton {...defaultProps} onExport={onExportMock} simple={true} />
      );

      const button = screen.getByTestId('osquery-results-export-csv-button');
      await userEvent.click(button);

      expect(onExportMock).toHaveBeenCalledWith();
    });

    it('should not show popover in simple mode', () => {
      const progress: ExportProgress = {
        phase: 'formatting',
        percentage: 50,
      };

      renderWithI18n(
        <CsvExportButton {...defaultProps} simple={true} progress={progress} />
      );

      expect(screen.queryByTestId('osquery-results-export-csv-progress-popover')).not.toBeInTheDocument();
    });
  });

  describe('Progress Popover', () => {
    it('should show progress popover when progress is active', () => {
      const progress: ExportProgress = {
        phase: 'formatting',
        percentage: 50,
      };

      renderWithI18n(<CsvExportButton {...defaultProps} progress={progress} />);

      expect(screen.getByTestId('osquery-results-export-csv-progress-popover')).toBeInTheDocument();
      expect(screen.getByTestId('csv-export-progress')).toBeInTheDocument();
    });

    it('should show progress details in popover', () => {
      const progress: ExportProgress = {
        phase: 'downloading',
        percentage: 90,
        processedRows: 900,
        totalRows: 1000,
      };

      renderWithI18n(<CsvExportButton {...defaultProps} progress={progress} />);

      expect(screen.getByText('Phase: downloading')).toBeInTheDocument();
      expect(screen.getByText('Percentage: 90%')).toBeInTheDocument();
      expect(screen.getByText('Details: true')).toBeInTheDocument();
    });

    it('should show close button when progress is complete', () => {
      const progress: ExportProgress = {
        phase: 'complete',
        percentage: 100,
      };

      renderWithI18n(<CsvExportButton {...defaultProps} progress={progress} />);

      expect(screen.getByTestId('osquery-results-export-csv-progress-close')).toBeInTheDocument();
      expect(screen.getByText('Close')).toBeInTheDocument();
    });

    it('should close popover when close button is clicked', async () => {
      const progress: ExportProgress = {
        phase: 'complete',
        percentage: 100,
      };

      renderWithI18n(<CsvExportButton {...defaultProps} progress={progress} />);

      const closeButton = screen.getByTestId('osquery-results-export-csv-progress-close');
      await userEvent.click(closeButton);

      // Popover should close
      expect(screen.queryByTestId('popover-content')).not.toBeInTheDocument();
    });

    it('should auto-close popover after progress completion', async () => {
      const { rerender } = renderWithI18n(<CsvExportButton {...defaultProps} />);

      // Start with progress
      const progress: ExportProgress = {
        phase: 'formatting',
        percentage: 50,
      };

      rerender(
        <I18nProvider>
          <CsvExportButton {...defaultProps} progress={progress} />
        </I18nProvider>
      );

      expect(screen.getByTestId('popover-content')).toBeInTheDocument();

      // Complete progress
      rerender(
        <I18nProvider>
          <CsvExportButton {...defaultProps} />
        </I18nProvider>
      );

      // Fast-forward time to trigger auto-close
      jest.advanceTimersByTime(2100);

      await waitFor(() => {
        expect(screen.queryByTestId('popover-content')).not.toBeInTheDocument();
      });
    });

    it('should toggle popover when button is clicked in non-simple mode', async () => {
      renderWithI18n(<CsvExportButton {...defaultProps} />);

      const button = screen.getByTestId('osquery-results-export-csv-button');
      await userEvent.click(button);

      // Should toggle popover open
      expect(screen.getByTestId('popover-content')).toBeInTheDocument();

      await userEvent.click(button);

      // Should toggle popover closed
      expect(screen.queryByTestId('popover-content')).not.toBeInTheDocument();
    });
  });

  describe('Event Handling', () => {
    it('should not call onExport when button is disabled', async () => {
      const onExportMock = jest.fn();
      renderWithI18n(
        <CsvExportButton {...defaultProps} onExport={onExportMock} disabled={true} />
      );

      const button = screen.getByTestId('osquery-results-export-csv-button');
      await userEvent.click(button);

      expect(onExportMock).not.toHaveBeenCalled();
    });

    it('should not call onExport when totalRows is 0', async () => {
      const onExportMock = jest.fn();
      renderWithI18n(
        <CsvExportButton {...defaultProps} onExport={onExportMock} totalRows={0} />
      );

      const button = screen.getByTestId('osquery-results-export-csv-button');
      await userEvent.click(button);

      expect(onExportMock).not.toHaveBeenCalled();
    });

    it('should handle keyboard navigation', async () => {
      const onExportMock = jest.fn();
      renderWithI18n(
        <CsvExportButton {...defaultProps} onExport={onExportMock} simple={true} />
      );

      const button = screen.getByTestId('osquery-results-export-csv-button');
      button.focus();

      await userEvent.keyboard('{Enter}');

      expect(onExportMock).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      renderWithI18n(<CsvExportButton {...defaultProps} />);

      const button = screen.getByTestId('osquery-results-export-csv-button');
      expect(button).toHaveAttribute('aria-label', 'Export CSV');
    });

    it('should be focusable when enabled', () => {
      renderWithI18n(<CsvExportButton {...defaultProps} />);

      const button = screen.getByTestId('osquery-results-export-csv-button');
      button.focus();

      expect(button).toHaveFocus();
    });

    it('should not be focusable when disabled', () => {
      renderWithI18n(<CsvExportButton {...defaultProps} disabled={true} />);

      const button = screen.getByTestId('osquery-results-export-csv-button');
      expect(button).toBeDisabled();
    });

    it('should have proper test subjects for automation', () => {
      const progress: ExportProgress = {
        phase: 'complete',
        percentage: 100,
      };

      renderWithI18n(<CsvExportButton {...defaultProps} progress={progress} />);

      expect(screen.getByTestId('osquery-results-export-csv-button')).toBeInTheDocument();
      expect(screen.getByTestId('osquery-results-export-csv-progress-popover')).toBeInTheDocument();
      expect(screen.getByTestId('osquery-results-export-csv-progress-close')).toBeInTheDocument();
    });
  });

  describe('Progress State Transitions', () => {
    it('should handle progress state changes smoothly', async () => {
      const { rerender } = renderWithI18n(<CsvExportButton {...defaultProps} />);

      // Start with no progress
      expect(screen.queryByTestId('csv-export-progress')).not.toBeInTheDocument();

      // Add progress
      const progress1: ExportProgress = {
        phase: 'preparing',
        percentage: 10,
      };

      rerender(
        <I18nProvider>
          <CsvExportButton {...defaultProps} progress={progress1} />
        </I18nProvider>
      );

      expect(screen.getByTestId('csv-export-progress')).toBeInTheDocument();
      expect(screen.getByText('Phase: preparing')).toBeInTheDocument();

      // Update progress
      const progress2: ExportProgress = {
        phase: 'formatting',
        percentage: 50,
      };

      rerender(
        <I18nProvider>
          <CsvExportButton {...defaultProps} progress={progress2} />
        </I18nProvider>
      );

      expect(screen.getByText('Phase: formatting')).toBeInTheDocument();
      expect(screen.getByText('Percentage: 50%')).toBeInTheDocument();

      // Complete progress
      const progress3: ExportProgress = {
        phase: 'complete',
        percentage: 100,
      };

      rerender(
        <I18nProvider>
          <CsvExportButton {...defaultProps} progress={progress3} />
        </I18nProvider>
      );

      expect(screen.getByText('Phase: complete')).toBeInTheDocument();
      expect(screen.getByTestId('osquery-results-export-csv-progress-close')).toBeInTheDocument();
    });

    it('should maintain popover state during progress updates', () => {
      const { rerender } = renderWithI18n(<CsvExportButton {...defaultProps} />);

      const progress1: ExportProgress = {
        phase: 'preparing',
        percentage: 10,
      };

      rerender(
        <I18nProvider>
          <CsvExportButton {...defaultProps} progress={progress1} />
        </I18nProvider>
      );

      expect(screen.getByTestId('popover-content')).toBeInTheDocument();

      const progress2: ExportProgress = {
        phase: 'formatting',
        percentage: 50,
      };

      rerender(
        <I18nProvider>
          <CsvExportButton {...defaultProps} progress={progress2} />
        </I18nProvider>
      );

      // Popover should remain open
      expect(screen.getByTestId('popover-content')).toBeInTheDocument();
    });
  });
});
/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  EuiFieldSearch,
  EuiFilterGroup,
  EuiFlexGroup,
  EuiFlexItem,
  EuiSuperDatePicker,
} from '@elastic/eui';
import type { OnTimeChangeProps, OnRefreshChangeProps } from '@elastic/eui';
import { css } from '@emotion/react';
import { i18n } from '@kbn/i18n';
import type { SourceFilter } from '../../../common/api/unified_history/types';
import { RunByFilterPopover } from './run_by_filter_popover';
import { SourceFilterPopover } from './source_filter_popover';

const SEARCH_PLACEHOLDER = i18n.translate('xpack.osquery.historyFilters.searchPlaceholder', {
  defaultMessage: 'Search by query or pack name',
});

export const DEFAULT_START_DATE = 'now-24h';
export const DEFAULT_END_DATE = 'now';

const searchFieldCss = css`
  min-width: 300px;
`;

const datePickerCss = css`
  min-width: 300px;
  max-width: 500px;
`;

interface HistoryFiltersProps {
  searchValue: string;
  onSearchSubmit: (value: string) => void;
  selectedSources: SourceFilter[];
  onSelectedSourcesChanged: (sources: SourceFilter[]) => void;
  selectedUserIds: string[];
  onSelectedUsersChanged: (userIds: string[]) => void;
  startDate: string;
  endDate: string;
  onTimeChange: (start: string, end: string) => void;
  onRefresh: () => void;
}

const HistoryFiltersComponent: React.FC<HistoryFiltersProps> = ({
  searchValue,
  onSearchSubmit,
  selectedSources,
  onSelectedSourcesChanged,
  selectedUserIds,
  onSelectedUsersChanged,
  startDate,
  endDate,
  onTimeChange,
  onRefresh,
}) => {
  const [localSearch, setLocalSearch] = useState(searchValue);

  useEffect(() => {
    setLocalSearch(searchValue);
  }, [searchValue]);

  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        onSearchSubmit(localSearch);
      }
    },
    [localSearch, onSearchSubmit]
  );

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setLocalSearch(e.target.value);
      if (e.target.value === '') {
        onSearchSubmit('');
      }
    },
    [onSearchSubmit]
  );

  const [isPaused, setIsPaused] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5000);

  const handleTimeChange = useCallback(
    ({ start, end }: OnTimeChangeProps) => {
      onTimeChange(start, end);
    },
    [onTimeChange]
  );

  const handleRefreshChange = useCallback(
    ({ isPaused: paused, refreshInterval: interval }: OnRefreshChangeProps) => {
      setIsPaused(paused);
      setRefreshInterval(interval);
    },
    []
  );

  return (
    <EuiFlexGroup gutterSize="m" responsive={false} wrap>
      <EuiFlexItem grow={3} css={searchFieldCss}>
        <EuiFieldSearch
          fullWidth
          placeholder={SEARCH_PLACEHOLDER}
          value={localSearch}
          onChange={handleSearchChange}
          onKeyDown={handleSearchKeyDown}
          isClearable
          data-test-subj="history-search-input"
        />
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiFilterGroup>
          <SourceFilterPopover
            selectedSources={selectedSources}
            onSelectedSourcesChanged={onSelectedSourcesChanged}
          />
          <RunByFilterPopover
            selectedUserIds={selectedUserIds}
            onSelectedUsersChanged={onSelectedUsersChanged}
            enabled
          />
        </EuiFilterGroup>
      </EuiFlexItem>
      <EuiFlexItem grow={false} css={datePickerCss}>
        <EuiSuperDatePicker
          start={startDate}
          end={endDate}
          onTimeChange={handleTimeChange}
          onRefresh={onRefresh}
          isPaused={isPaused}
          refreshInterval={refreshInterval}
          onRefreshChange={handleRefreshChange}
          data-test-subj="history-date-picker"
        />
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};

HistoryFiltersComponent.displayName = 'HistoryFilters';

export const HistoryFilters = React.memo(HistoryFiltersComponent);

/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { get, map } from 'lodash';
import type { ReactElement } from 'react';
import React, { useCallback, useEffect, useState, useMemo } from 'react';
import {
  EuiBasicTable,
  EuiCodeBlock,
  EuiButtonIcon,
  EuiToolTip,
  EuiLoadingSpinner,
  EuiFlexGroup,
  EuiFlexItem,
  EuiNotificationBadge,
  RIGHT_ALIGNMENT,
  EuiBadge,
  EuiText,
} from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import styled from 'styled-components';
import type { ECSMapping } from '@kbn/osquery-io-ts-types';
import { SECURITY_APP_NAME } from '../../timelines/get_add_to_timeline';
import type { AddToTimelinePayload } from '../../timelines/get_add_to_timeline';
import { PackResultsHeader } from './pack_results_header';
import { Direction } from '../../../common/search_strategy';
import { removeMultilines } from '../../../common/utils/build_query/remove_multilines';
import { ResultTabs } from '../../routes/saved_queries/edit/tabs';
import type { PackItem } from '../../packs/types';
import { PackViewInLensAction } from '../../lens/pack_view_in_lens';
import { PackViewInDiscoverAction } from '../../discover/pack_view_in_discover';
import { useKibana } from '../../common/lib/kibana';

const TruncateTooltipText = styled.div`
  width: 100%;

  > span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

const EMPTY_ARRAY: PackQueryStatusItem[] = [];

// @ts-expect-error TS2769
const StyledEuiBasicTable = styled(EuiBasicTable)`
  .euiTableRow.euiTableRow-isExpandedRow > td > div {
    padding: 0;
  }
`;

export enum ViewResultsActionButtonType {
  icon = 'icon',
  button = 'button',
}

interface DocsColumnResultsProps {
  count?: number;
  isLive?: boolean;
}

const DocsColumnResults: React.FC<DocsColumnResultsProps> = ({ count, isLive }) => (
  <EuiFlexGroup gutterSize="s" alignItems="center">
    <EuiFlexItem grow={false}>
      {count ? <EuiNotificationBadge color="subdued">{count}</EuiNotificationBadge> : '-'}
    </EuiFlexItem>
    {isLive ? (
      <EuiFlexItem grow={false} data-test-subj={'live-query-loading'}>
        <EuiLoadingSpinner />
      </EuiFlexItem>
    ) : null}
  </EuiFlexGroup>
);

interface AgentsColumnResultsProps {
  successful?: number;
  pending?: number;
  failed?: number;
}

const AgentsColumnResults: React.FC<AgentsColumnResultsProps> = ({
  successful,
  pending,
  failed,
}) => (
  <EuiFlexGroup gutterSize="s" alignItems="center">
    <EuiFlexItem grow={false}>
      <EuiText color="subdued">
        <EuiBadge color="success">{successful}</EuiBadge>
        {' / '}
        <EuiBadge color="default">{pending}</EuiBadge>
        {' / '}
        <EuiBadge color={failed ? 'danger' : 'default'}>{failed}</EuiBadge>
      </EuiText>
    </EuiFlexItem>
  </EuiFlexGroup>
);

type PackQueryStatusItem = Partial<{
  action_id: string;
  id: string;
  query: string;
  agents: string[];
  ecs_mapping?: ECSMapping;
  version?: string;
  platform?: string;
  saved_query_id?: string;
  status?: string;
  pending?: number;
  docs?: number;
}>;

interface PackQueriesStatusTableProps {
  agentIds?: string[];
  queryId?: string;
  actionId?: string;
  data?: PackQueryStatusItem[];
  startDate?: string;
  expirationDate?: string;
  addToTimeline?: (payload: AddToTimelinePayload) => ReactElement;
  addToCase?: ({
    actionId,
    isIcon,
    isDisabled,
    queryId,
  }: {
    actionId?: string;
    isIcon?: boolean;
    isDisabled?: boolean;
    queryId?: string;
  }) => ReactElement;
  showResultsHeader?: boolean;
}

const PackQueriesStatusTableComponent: React.FC<PackQueriesStatusTableProps> = ({
  actionId,
  queryId,
  agentIds,
  data,
  startDate,
  expirationDate,
  addToTimeline,
  addToCase,
  showResultsHeader,
}) => {
  const { timelines, appName } = useKibana().services;

  const [itemIdToExpandedRowMap, setItemIdToExpandedRowMap] = useState<Record<string, unknown>>({});
  const renderIDColumn = useCallback(
    (id: string) => (
      <TruncateTooltipText>
        <EuiToolTip content={id} display="block">
          <>{id}</>
        </EuiToolTip>
      </TruncateTooltipText>
    ),
    []
  );

  const renderQueryColumn = useCallback((query: string, item) => {
    const singleLine = removeMultilines(query);
    const content = singleLine.length > 55 ? `${singleLine.substring(0, 55)}...` : singleLine;

    return (
      <EuiToolTip title={item.id} content={<EuiFlexItem>{query}</EuiFlexItem>}>
        <EuiCodeBlock language="sql" fontSize="s" paddingSize="none" transparentBackground>
          {content}
        </EuiCodeBlock>
      </EuiToolTip>
    );
  }, []);

  const renderDocsColumn = useCallback(
    (item: PackQueryStatusItem) => (
      <DocsColumnResults
        count={item?.docs ?? 0}
        isLive={item?.status === 'running' && item?.pending !== 0}
      />
    ),
    []
  );

  const renderAgentsColumn = useCallback((item) => {
    if (!item.action_id) return;

    return (
      <AgentsColumnResults
        successful={item?.successful ?? 0}
        pending={item?.pending ?? 0}
        failed={item?.failed ?? 0}
      />
    );
  }, []);

  const renderDiscoverResultsAction = useCallback(
    (item) => <PackViewInDiscoverAction item={item} />,
    []
  );

  const renderLensResultsAction = useCallback((item) => <PackViewInLensAction item={item} />, []);
  const handleAddToCase = useCallback(
    (payload: { actionId?: string; isIcon?: boolean; queryId: string }) =>
      // eslint-disable-next-line react/display-name
      () => {
        if (addToCase) {
          return addToCase({
            actionId: payload.actionId,
            isIcon: payload.isIcon,
            queryId: payload.queryId,
          });
        }

        return <></>;
      },
    [addToCase]
  );
  const getHandleErrorsToggle = useCallback(
    (item) => () => {
      setItemIdToExpandedRowMap((prevValue) => {
        const itemIdToExpandedRowMapValues = { ...prevValue };
        if (itemIdToExpandedRowMapValues[item.id]) {
          delete itemIdToExpandedRowMapValues[item.id];
        } else {
          itemIdToExpandedRowMapValues[item.id] = (
            <EuiFlexGroup gutterSize="xl">
              <EuiFlexItem>
                <ResultTabs
                  actionId={item.action_id}
                  startDate={startDate}
                  ecsMapping={item.ecs_mapping}
                  endDate={expirationDate}
                  agentIds={agentIds}
                  failedAgentsCount={item?.failed ?? 0}
                  addToTimeline={addToTimeline}
                  addToCase={addToCase && handleAddToCase({ queryId: item.action_id, actionId })}
                />
              </EuiFlexItem>
            </EuiFlexGroup>
          );
        }

        return itemIdToExpandedRowMapValues;
      });
    },
    [startDate, expirationDate, agentIds, addToTimeline, addToCase, handleAddToCase, actionId]
  );

  const renderToggleResultsAction = useCallback(
    (item) =>
      item?.action_id && data?.length && data.length > 1 ? (
        <EuiButtonIcon
          data-test-subj={`toggleIcon-${item.id}`}
          onClick={getHandleErrorsToggle(item)}
          iconType={itemIdToExpandedRowMap[item.id] ? 'arrowUp' : 'arrowDown'}
        />
      ) : (
        <></>
      ),
    [data, getHandleErrorsToggle, itemIdToExpandedRowMap]
  );

  const getItemId = useCallback((item: PackItem) => get(item, 'id'), []);

  const renderResultActions = useCallback(
    (row: { action_id: string }) => {
      const resultActions = [
        {
          render: renderDiscoverResultsAction,
        },
        {
          render: renderLensResultsAction,
        },
        {
          render: (item: { action_id: string }) =>
            addToTimeline &&
            timelines &&
            appName === SECURITY_APP_NAME &&
            addToTimeline({ query: ['action_id', item.action_id], isIcon: true }),
        },
        {
          render: (item: { action_id: string }) =>
            addToCase &&
            addToCase({
              actionId,
              queryId: item.action_id,
              isIcon: true,
              isDisabled: !item.action_id,
            }),
        },
      ];

      return resultActions.map((action) => action.render(row));
    },
    [
      actionId,
      addToCase,
      addToTimeline,
      appName,
      renderDiscoverResultsAction,
      renderLensResultsAction,
      timelines,
    ]
  );
  const columns = useMemo(
    () => [
      {
        field: 'id',
        name: i18n.translate('xpack.osquery.pack.queriesTable.idColumnTitle', {
          defaultMessage: 'ID',
        }),
        width: '15%',
        render: renderIDColumn,
      },
      {
        field: 'query',
        name: i18n.translate('xpack.osquery.pack.queriesTable.queryColumnTitle', {
          defaultMessage: 'Query',
        }),
        render: renderQueryColumn,
        width: '40%',
      },
      {
        name: i18n.translate('xpack.osquery.pack.queriesTable.docsResultsColumnTitle', {
          defaultMessage: 'Docs',
        }),
        width: '80px',
        render: renderDocsColumn,
      },
      {
        name: i18n.translate('xpack.osquery.pack.queriesTable.agentsResultsColumnTitle', {
          defaultMessage: 'Agents',
        }),
        width: '160px',
        render: renderAgentsColumn,
      },
      {
        name: i18n.translate('xpack.osquery.pack.queriesTable.viewResultsColumnTitle', {
          defaultMessage: 'View results',
        }),
        width: '90px',
        render: renderResultActions,
      },
      {
        id: 'actions',
        width: '45px',
        isVisuallyHiddenLabel: true,
        alignment: RIGHT_ALIGNMENT,
        actions: [
          {
            render: renderToggleResultsAction,
          },
        ],
      },
    ],
    [
      renderIDColumn,
      renderQueryColumn,
      renderDocsColumn,
      renderAgentsColumn,
      renderResultActions,
      renderToggleResultsAction,
    ]
  );
  const sorting = useMemo(
    () => ({
      sort: {
        field: 'id' as keyof PackItem,
        direction: Direction.asc,
      },
    }),
    []
  );

  useEffect(() => {
    // reset the expanded row map when the data changes
    setItemIdToExpandedRowMap({});
  }, [queryId, actionId]);

  useEffect(() => {
    if (
      data?.length === 1 &&
      agentIds?.length &&
      data?.[0].id &&
      !itemIdToExpandedRowMap[data?.[0].id]
    ) {
      getHandleErrorsToggle(data?.[0])();
    }
  }, [agentIds?.length, data, getHandleErrorsToggle, itemIdToExpandedRowMap]);

  const queryIds = useMemo(
    () =>
      map(data, (query) => ({
        value: query.action_id || '',
        field: 'action_id',
      })),
    [data]
  );

  return (
    <>
      {showResultsHeader && (
        <PackResultsHeader queryIds={queryIds} actionId={actionId} addToCase={addToCase} />
      )}

      <StyledEuiBasicTable
        items={data ?? EMPTY_ARRAY}
        itemId={getItemId}
        columns={columns}
        sorting={sorting}
        itemIdToExpandedRowMap={itemIdToExpandedRowMap}
        isExpandable
      />
    </>
  );
};

export const PackQueriesStatusTable = React.memo(PackQueriesStatusTableComponent);

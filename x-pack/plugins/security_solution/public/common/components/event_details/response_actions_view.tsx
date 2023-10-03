/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useMemo } from 'react';
import styled from 'styled-components';
import type { EuiTabbedContentTab } from '@elastic/eui';
import { EuiLink, EuiNotificationBadge, EuiSpacer } from '@elastic/eui';
import type { Ecs } from '@kbn/cases-plugin/common';
import { FormattedMessage } from '@kbn/i18n-react';
import { RESPONSE_NO_DATA_TEST_ID } from '../../../flyout/left/components/test_ids';
import type { SearchHit } from '../../../../common/search_strategy';
import type {
  ExpandedEventFieldsObject,
  RawEventData,
} from '../../../../common/types/response_actions';
import { ResponseActionsResults } from '../response_actions/response_actions_results';
import { expandDottedObject } from '../../../../common/utils/expand_dotted';
import { useGetAutomatedActionList } from '../../../management/hooks/response_actions/use_get_automated_action_list';
import { EventsViewType } from './event_details';
import * as i18n from './translations';

import { useIsExperimentalFeatureEnabled } from '../../hooks/use_experimental_features';

const TabContentWrapper = styled.div`
  height: 100%;
  position: relative;
`;
const InlineBlock = styled.div`
  display: inline-block;
  line-height: 1.7em;
`;

const EmptyResponseActions = () => {
  return (
    <InlineBlock data-test-subj={RESPONSE_NO_DATA_TEST_ID}>
      <FormattedMessage
        id="xpack.securitySolution.flyout.left.response.noDataDescription"
        defaultMessage="There are no response actions defined for this event. To add some, edit the rule's settings and set up {link}."
        values={{
          link: (
            <EuiLink
              href="https://www.elastic.co/guide/en/security/current/rules-ui-create.html#rule-response-action"
              target="_blank"
            >
              <FormattedMessage
                id="xpack.securitySolution.flyout.left.response.noDataLinkText"
                defaultMessage="response actions"
              />
            </EuiLink>
          ),
        }}
      />
    </InlineBlock>
  );
};

export const useResponseActionsView = <T extends object = JSX.Element>({
  rawEventData,
  ecsData,
}: {
  ecsData?: Ecs | null;
  rawEventData: SearchHit | undefined;
}): EuiTabbedContentTab | undefined => {
  const viewData = useMemo(
    () => ({
      id: EventsViewType.responseActionsView,
      'data-test-subj': 'responseActionsViewTab',
      name: i18n.RESPONSE_ACTIONS_VIEW,
    }),
    []
  );
  const responseActionsEnabled = useIsExperimentalFeatureEnabled('endpointResponseActionsEnabled');
  const expandedEventFieldsObject = rawEventData
    ? (expandDottedObject((rawEventData as RawEventData).fields) as ExpandedEventFieldsObject)
    : undefined;

  const shouldEarlyReturn = !rawEventData || !responseActionsEnabled;

  const alertId = rawEventData?._id ?? '';

  const { data: automatedList, isFetched } = useGetAutomatedActionList(
    {
      alertIds: [alertId],
    },
    { enabled: !shouldEarlyReturn }
  );

  if (shouldEarlyReturn) {
    return {
      ...viewData,
      content: <EmptyResponseActions />,
    };
  } else {
    const ruleName = expandedEventFieldsObject?.kibana?.alert?.rule?.name?.[0];

    const totalItemCount = automatedList?.items?.length ?? 0;
    return {
      ...viewData,
      append: (
        <EuiNotificationBadge data-test-subj="response-actions-notification">
          {totalItemCount ?? 0}
        </EuiNotificationBadge>
      ),
      content: (
        <>
          <EuiSpacer size="s" />
          <TabContentWrapper data-test-subj="responseActionsViewWrapper">
            {isFetched && totalItemCount && automatedList?.items.length ? (
              <ResponseActionsResults
                actions={automatedList.items}
                ruleName={ruleName}
                ecsData={ecsData}
              />
            ) : (
              <EmptyResponseActions />
            )}
          </TabContentWrapper>
        </>
      ),
    };
  }
};

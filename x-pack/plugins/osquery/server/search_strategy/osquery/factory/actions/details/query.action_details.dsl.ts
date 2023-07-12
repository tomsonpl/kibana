/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { ISearchRequestParams } from '@kbn/data-plugin/common';
import { AGENT_ACTIONS_INDEX } from '@kbn/fleet-plugin/common';
import { isEmpty } from 'lodash';
import { getQueryFilter } from '../../../../../utils/build_query';
import { ACTIONS_INDEX } from '../../../../../../common/constants';
import type { ActionDetailsRequestOptions } from '../../../../../../common/search_strategy';

export const buildActionDetailsQuery = ({
  actionId,
  kql,
  componentTemplateExists,
}: ActionDetailsRequestOptions): ISearchRequestParams => {
  const actionIdQuery = `action_id: ${actionId}`;
  let filter = actionIdQuery;
  if (!isEmpty(kql)) {
    filter = actionIdQuery + ` and ${kql}`;
  }

  const query = getQueryFilter({ filter });

  const dslQuery = {
    allow_no_indices: true,
    index: componentTemplateExists ? `${ACTIONS_INDEX}*` : AGENT_ACTIONS_INDEX,
    ignore_unavailable: true,
    body: {
      query,
      size: 1,
      fields: ['*'],
    },
  };

  return dslQuery;
};

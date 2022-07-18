/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { useEffect, useState } from 'react';
import type { ResponseActionType } from './get_supported_response_actions';
import { getSupportedResponseActions, responseActionTypes } from './get_supported_response_actions';
import { useOsqueryEnabled } from './useOsqueryEnabled';

export const useSupportedResponseActionTypes = () => {
  const [supportedResponseActionTypes, setSupportedResponseActionTypes] = useState<
    ResponseActionType[] | undefined
  >();

  const isOsqueryEnabled = useOsqueryEnabled();

  useEffect(() => {
    const actionEnabledMap: Record<string, boolean> = {
      '.osquery': isOsqueryEnabled,
    };
    const supportedTypes = getSupportedResponseActions(responseActionTypes, actionEnabledMap);
    setSupportedResponseActionTypes(supportedTypes);
  }, [isOsqueryEnabled]);

  return supportedResponseActionTypes;
};

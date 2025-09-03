/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import {
  type ConsoleResponseActionCommands,
  type ResponseActionsApiCommandNames,
  RESPONSE_CONSOLE_ACTION_COMMANDS_TO_REQUIRED_AUTHZ,
  resolveCommandPermission,
  DYNAMIC_COMMAND_BASED,
} from './constants';
import type { EndpointPrivileges } from '../../types';

export const getRbacControl = ({
  commandName,
  privileges,
  context,
}: {
  commandName: ConsoleResponseActionCommands;
  privileges: EndpointPrivileges;
  context?: { targetActionCommand?: ResponseActionsApiCommandNames };
}): boolean => {
  const authzKey = RESPONSE_CONSOLE_ACTION_COMMANDS_TO_REQUIRED_AUTHZ[commandName];

  // Handle static permissions
  if (authzKey !== DYNAMIC_COMMAND_BASED) {
    return Boolean(privileges[authzKey]);
  }

  // Handle dynamic permissions
  try {
    const requiredPermission = resolveCommandPermission(commandName, context);
    return Boolean(privileges[requiredPermission]);
  } catch (error) {
    // If dynamic resolution fails (e.g., missing context), deny access
    return false;
  }
};

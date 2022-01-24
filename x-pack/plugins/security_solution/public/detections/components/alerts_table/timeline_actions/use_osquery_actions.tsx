/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import { useKibana } from '../../../../common/lib/kibana';

interface IProps {
  onClick: () => void;
  agentId: string;
}

export const useOsqueryActions = ({ onClick, agentId }: IProps) => {
  const {
    osquery: { osqueryMenuItem },
  } = useKibana().services;

  const osqueryActions = osqueryMenuItem({ onClick, agentId });
  return {
    osqueryActions,
  };
};

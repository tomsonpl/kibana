/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import type { Ecs } from '../../common/ecs';

export interface ExpandedAlertEcsData {
  _id: string;
  _index: string;
}

export const AlertAttachmentContext = React.createContext<Ecs | null>(null);

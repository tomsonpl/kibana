/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { lazy, Suspense } from 'react';
import type { ResponseActionValue } from '../rules/response_action_field';

export interface ResponseActionFormProps {
  items: ResponseActionValue[];
  addItem: () => void;
  removeItem: () => void;
}

export const getLazyResponseActionForm = (props: ResponseActionFormProps) => {
  const ResponseActionForm = lazy(() => import('./response_action_form'));

  return (
    <Suspense fallback={null}>
      <ResponseActionForm {...props} />
    </Suspense>
  );
};

/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { lazy, Suspense } from 'react';

// @ts-expect-error update types
// eslint-disable-next-line react/display-name
export const getLazyOsqueryResults = (services) => (props) => {
  const OsqueryResults = lazy(() => import('./osquery_results'));

  return (
    <Suspense fallback={null}>
      <OsqueryResults services={services} {...props} />
    </Suspense>
  );
};

/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { lazy, Suspense } from 'react';
import type { ServicesWrapperProps } from '../services_wrapper';
import ServicesWrapper from '../services_wrapper';

export interface IExternalReferenceMetaDataProps {
  externalReferenceMetadata: {
    actionId: string;
    agentIds: string[];
    queryId: string;
  };
}

export const getLazyExternalContent =
  // eslint-disable-next-line react/display-name
  (services: ServicesWrapperProps['services']) => (props: IExternalReferenceMetaDataProps) => {
    const AttachmentContent = lazy(() => import('./external_references_content'));

    return (
      <Suspense fallback={null}>
        <ServicesWrapper services={services}>
          <AttachmentContent {...props} />
        </ServicesWrapper>
      </Suspense>
    );
  };

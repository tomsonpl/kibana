/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { ExternalReferenceAttachmentType } from '@kbn/cases-plugin/public/client/attachment_framework/types';
import { lazy } from 'react';
// import { EuiButtonIcon } from '@elastic/eui';

const AttachmentContentLazy = lazy(() => import('./external_references_content'));

// TODO not sure yet if we need it
// const AttachmentActions: React.FC = () => (
//   <EuiButtonIcon
//     data-test-subj="test-attachment-action"
//     onClick={() => {}}
//     iconType="arrowRight"
//     aria-label="See attachment"
//   />
// );

export const getExternalReferenceAttachmentRegular: () => ExternalReferenceAttachmentType = () => ({
  id: 'osquery',
  icon: 'osqueryApp',
  displayName: 'Test',
  getAttachmentViewObject: () => ({
    type: 'regular',
    event: 'added a chart',
    timelineIcon: 'casesApp',
    // actions: <AttachmentActions />,
    // @ts-expect-error update types
    children: AttachmentContentLazy,
  }),
});

/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

/*
 * NOTICE: Do not edit this file manually.
 * This file is automatically generated by the OpenAPI Generator, @kbn/openapi-generator.
 *
 * info:
 *   title: Common Exception List Attributes
 *   version: not applicable
 */

import { z } from '@kbn/zod';

import { NonEmptyString } from '@kbn/openapi-common/schemas/primitives.gen';
import { ExceptionListItemEntryArray } from './exception_list_item_entry.gen';

export type ExceptionListId = z.infer<typeof ExceptionListId>;
export const ExceptionListId = NonEmptyString;

/**
 * Human readable string identifier, e.g. `trusted-linux-processes`
 */
export type ExceptionListHumanId = z.infer<typeof ExceptionListHumanId>;
export const ExceptionListHumanId = NonEmptyString;

export type ExceptionListType = z.infer<typeof ExceptionListType>;
export const ExceptionListType = z.enum([
  'detection',
  'rule_default',
  'endpoint',
  'endpoint_trusted_apps',
  'endpoint_events',
  'endpoint_host_isolation_exceptions',
  'endpoint_blocklists',
]);
export type ExceptionListTypeEnum = typeof ExceptionListType.enum;
export const ExceptionListTypeEnum = ExceptionListType.enum;

export type ExceptionListName = z.infer<typeof ExceptionListName>;
export const ExceptionListName = z.string();

export type ExceptionListDescription = z.infer<typeof ExceptionListDescription>;
export const ExceptionListDescription = z.string();

export type ExceptionListMeta = z.infer<typeof ExceptionListMeta>;
export const ExceptionListMeta = z.object({}).catchall(z.unknown());

/**
  * Determines whether the exception container is available in all Kibana spaces or just the space
in which it is created, where:

- `single`: Only available in the Kibana space in which it is created.
- `agnostic`: Available in all Kibana spaces.

  */
export type ExceptionNamespaceType = z.infer<typeof ExceptionNamespaceType>;
export const ExceptionNamespaceType = z.enum(['agnostic', 'single']);
export type ExceptionNamespaceTypeEnum = typeof ExceptionNamespaceType.enum;
export const ExceptionNamespaceTypeEnum = ExceptionNamespaceType.enum;

export type ExceptionListTags = z.infer<typeof ExceptionListTags>;
export const ExceptionListTags = z.array(z.string());

export type ExceptionListOsType = z.infer<typeof ExceptionListOsType>;
export const ExceptionListOsType = z.enum(['linux', 'macos', 'windows']);
export type ExceptionListOsTypeEnum = typeof ExceptionListOsType.enum;
export const ExceptionListOsTypeEnum = ExceptionListOsType.enum;

export type ExceptionListOsTypeArray = z.infer<typeof ExceptionListOsTypeArray>;
export const ExceptionListOsTypeArray = z.array(ExceptionListOsType);

export type ExceptionListVersion = z.infer<typeof ExceptionListVersion>;
export const ExceptionListVersion = z.number().int().min(1);

export type ExceptionList = z.infer<typeof ExceptionList>;
export const ExceptionList = z.object({
  id: ExceptionListId,
  list_id: ExceptionListHumanId,
  type: ExceptionListType,
  name: ExceptionListName,
  description: ExceptionListDescription,
  immutable: z.boolean(),
  namespace_type: ExceptionNamespaceType,
  os_types: ExceptionListOsTypeArray.optional(),
  tags: ExceptionListTags.optional(),
  meta: ExceptionListMeta.optional(),
  version: ExceptionListVersion,
  _version: z.string().optional(),
  tie_breaker_id: z.string(),
  created_at: z.string().datetime(),
  created_by: z.string(),
  updated_at: z.string().datetime(),
  updated_by: z.string(),
});

export type ExceptionListItemId = z.infer<typeof ExceptionListItemId>;
export const ExceptionListItemId = NonEmptyString;

export type ExceptionListItemHumanId = z.infer<typeof ExceptionListItemHumanId>;
export const ExceptionListItemHumanId = NonEmptyString;

export type ExceptionListItemType = z.infer<typeof ExceptionListItemType>;
export const ExceptionListItemType = z.literal('simple');

export type ExceptionListItemName = z.infer<typeof ExceptionListItemName>;
export const ExceptionListItemName = NonEmptyString;

export type ExceptionListItemDescription = z.infer<typeof ExceptionListItemDescription>;
export const ExceptionListItemDescription = z.string();

export type ExceptionListItemMeta = z.infer<typeof ExceptionListItemMeta>;
export const ExceptionListItemMeta = z.object({}).catchall(z.unknown());

export type ExceptionListItemTags = z.infer<typeof ExceptionListItemTags>;
export const ExceptionListItemTags = z.array(NonEmptyString);

export type ExceptionListItemOsType = z.infer<typeof ExceptionListItemOsType>;
export const ExceptionListItemOsType = z.enum(['linux', 'macos', 'windows']);
export type ExceptionListItemOsTypeEnum = typeof ExceptionListItemOsType.enum;
export const ExceptionListItemOsTypeEnum = ExceptionListItemOsType.enum;

export type ExceptionListItemOsTypeArray = z.infer<typeof ExceptionListItemOsTypeArray>;
export const ExceptionListItemOsTypeArray = z.array(ExceptionListOsType);

export type ExceptionListItemComment = z.infer<typeof ExceptionListItemComment>;
export const ExceptionListItemComment = z.object({
  id: NonEmptyString,
  comment: NonEmptyString,
  created_at: z.string().datetime(),
  created_by: NonEmptyString,
  updated_at: z.string().datetime().optional(),
  updated_by: NonEmptyString.optional(),
});

export type ExceptionListItemCommentArray = z.infer<typeof ExceptionListItemCommentArray>;
export const ExceptionListItemCommentArray = z.array(ExceptionListItemComment);

export type ExceptionListItem = z.infer<typeof ExceptionListItem>;
export const ExceptionListItem = z.object({
  id: ExceptionListItemId,
  item_id: ExceptionListItemHumanId,
  list_id: ExceptionListHumanId,
  type: ExceptionListItemType,
  name: ExceptionListItemName,
  description: ExceptionListItemDescription,
  entries: ExceptionListItemEntryArray,
  namespace_type: ExceptionNamespaceType,
  os_types: ExceptionListItemOsTypeArray.optional(),
  tags: ExceptionListItemTags.optional(),
  meta: ExceptionListItemMeta.optional(),
  expire_time: z.string().datetime().optional(),
  comments: ExceptionListItemCommentArray,
  _version: z.string().optional(),
  tie_breaker_id: z.string(),
  created_at: z.string().datetime(),
  created_by: z.string(),
  updated_at: z.string().datetime(),
  updated_by: z.string(),
});

export type ExceptionListSO = z.infer<typeof ExceptionListSO>;
export const ExceptionListSO = z.object({
  item_id: ExceptionListItemHumanId.optional(),
  list_id: ExceptionListHumanId,
  list_type: z.enum(['item', 'list']),
  immutable: z.boolean().optional(),
  type: ExceptionListItemType,
  name: ExceptionListItemName,
  description: ExceptionListItemDescription,
  entries: ExceptionListItemEntryArray.optional(),
  os_types: ExceptionListItemOsTypeArray.optional(),
  tags: ExceptionListItemTags.optional(),
  meta: ExceptionListItemMeta.optional(),
  expire_time: z.string().datetime().optional(),
  comments: ExceptionListItemCommentArray.optional(),
  version: NonEmptyString.optional(),
  tie_breaker_id: z.string(),
  created_at: z.string().datetime(),
  created_by: z.string(),
  updated_by: z.string(),
});

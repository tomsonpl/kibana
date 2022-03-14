/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { isArray, isEmpty, map, reduce } from 'lodash';
import uuid from 'uuid';
import { produce } from 'immer';
import { RefObject, useMemo } from 'react';

import { useForm } from '../../shared_imports';
import { createFormSchema } from '../../packs/queries/schema';
import { PackFormData } from '../../packs/queries/use_pack_query_form';
import { useSavedQueries } from '../use_saved_queries';
import { SavedQueryFormRefObject } from '.';

const SAVED_QUERY_FORM_ID = 'savedQueryForm';

interface UseSavedQueryFormProps {
  defaultValue?: unknown;
  handleSubmit: (payload: unknown) => Promise<void>;
  savedQueryFormRef: RefObject<SavedQueryFormRefObject>;
}
const convertECSMappingToObject = (
  ecsMapping: Array<{ key: string; value: Record<string, object> }>
) =>
  reduce(
    ecsMapping,
    (acc, value) => {
      console.log({ acc, value });
      acc[value.key] = {
        [value.result.type]: value.result.value,
      };
      return acc;
    },
    {} as Record<string, { field?: string; value?: string }>
  );

export const useSavedQueryForm = ({
  defaultValue,
  handleSubmit,
  savedQueryFormRef,
}: UseSavedQueryFormProps) => {
  const { data } = useSavedQueries({});
  const ids: string[] = useMemo<string[]>(
    () => map(data?.saved_objects, 'attributes.id') ?? [],
    [data]
  );
  const idSet = useMemo<Set<string>>(() => {
    const res = new Set<string>(ids);
    // @ts-expect-error update types
    if (defaultValue && defaultValue.id) res.delete(defaultValue.id);
    return res;
  }, [ids, defaultValue]);
  const formSchema = useMemo<ReturnType<typeof createFormSchema>>(
    () => createFormSchema(idSet),
    [idSet]
  );
  return useForm({
    id: SAVED_QUERY_FORM_ID + uuid.v4(),
    schema: formSchema,
    onSubmit: async (formData, isValid) => {
      console.log({ formData, isValid });
      if (isValid) {
        const ecsMapping = formData['ecs_mapping'] ? JSON.parse(formData['ecs_mapping']) : [];
        const objMapping = convertECSMappingToObject(ecsMapping);
        console.log({ ecsMapping, objMapping });
        try {
          await handleSubmit({
            ...formData,
            ecs_mapping: objMapping,
          });
          // eslint-disable-next-line no-empty
        } catch (e) {}
      }
    },
    // @ts-expect-error update types
    defaultValue,
    serializer: (payload) =>
      produce(payload, (draft) => {
        // @ts-expect-error update types
        if (draft.platform?.split(',').length === 3) {
          // if all platforms are checked then use undefined
          // @ts-expect-error update types
          delete draft.platform;
        }
        if (isArray(draft.version)) {
          if (!draft.version.length) {
            // @ts-expect-error update types
            delete draft.version;
          } else {
            draft.version = draft.version[0];
          }
        }
        if (isEmpty(draft.ecs_mapping)) {
          // @ts-expect-error update types
          delete draft.ecs_mapping;
        } else {
          draft.ecs_mapping = JSON.stringify(draft.ecs_mapping);
          // @ts-expect-error update types
          draft.interval = draft.interval + '';
          return draft;
        }
      }),
    // @ts-expect-error update types
    deserializer: (payload) => {
      if (!payload) return {} as PackFormData;

      console.log({ payload });
      return {
        id: payload.id,
        description: payload.description,
        query: payload.query,
        interval: payload.interval ?? 3600,
        platform: payload.platform,
        version: payload.version ? [payload.version] : [],
        ecs_mapping: payload?.ecs_mapping?.map((item) => ({
          key: item.key,
          result: {
            type: Object.keys(item.value)[0],
            value: Object.values(item.value)[0],
          },
        })) ?? [
          {
            key: '',
            result: {
              type: 'field',
              value: '',
            },
          },
        ],
      };
    },
  });
};

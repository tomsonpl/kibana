/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { i18n } from '@kbn/i18n';

import { useKibana } from '../common/lib/kibana';
import { PLUGIN_ID } from '../../common';
import { pagePathGetters } from '../common/page_paths';
import { PACKS_ID } from './constants';
import { useErrorToast } from '../common/hooks/use_error_toast';
import type { PackItem, PackSavedObject } from './types';

interface UseCreatePackProps {
  withRedirect?: boolean;
}

export const useCreatePack = ({ withRedirect }: UseCreatePackProps) => {
  const queryClient = useQueryClient();
  const {
    application: { navigateToApp },
    http,
    notifications: { toasts },
  } = useKibana().services;
  const setErrorToast = useErrorToast();

  return useMutation<
    { data: PackSavedObject },
    { body: { error: string; message: string } },
    Omit<PackItem, 'id'>
  >(
    (payload) =>
      http.post('/api/osquery/packs', {
        version: '2023-10-31',
        body: JSON.stringify(payload),
      }),
    {
      onError: (error) => {
        setErrorToast(error, { title: error.body.error, toastMessage: error.body.message });
      },
      onSuccess: (payload) => {
        queryClient.invalidateQueries([PACKS_ID]);
        if (withRedirect) {
          navigateToApp(PLUGIN_ID, { path: pagePathGetters.packs() });
        }

        toasts.addSuccess(
          i18n.translate('xpack.osquery.newPack.successToastMessageText', {
            defaultMessage: 'Successfully created "{packName}" pack',
            values: {
              packName: payload.data?.name ?? '',
            },
          })
        );
      },
    }
  );
};

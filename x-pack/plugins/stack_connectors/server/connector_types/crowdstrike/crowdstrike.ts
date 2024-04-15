/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { ServiceParams, SubActionConnector } from '@kbn/actions-plugin/server';
import type { AxiosError } from 'axios';
import { SubActionRequestParams } from '@kbn/actions-plugin/server/sub_action_framework/types';
import type {
  CrowdstrikeConfig,
  CrowdstrikeSecrets,
  CrowdstrikeGetAgentsResponse,
  CrowdstrikeGetAgentsParams,
  CrowdstrikeBaseApiResponse,
  CrowdstrikeHostActionsParams,
  CrowdstrikeGetTokenResponse,
} from '../../../common/crowdstrike/types';
import {
  CrowdstrikeGetAgentsResponseSchema,
  CrowdstrikeHostActionsParamsSchema,
  CrowdstrikeGetAgentsParamsSchema,
  CrowdstrikeGetTokenResponseSchema,
  CrowdstrikeHostActionsResponseSchema,
} from '../../../common/crowdstrike/schema';
import { SUB_ACTION } from '../../../common/crowdstrike/constants';

export const API_PATH = 'https://api.crowdstrike.com';

const paramsSerializer = (params: Record<string, string>) => {
  return Object.entries(params)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
};

/**
 * Represents a book.
 * @constructor
 * @param {string} token - Authorization token received from OAuth2 API, that needs to be sent along with each request.
 * @param {number} tokenExpiryTimeout - Tokens are valid for 30 minutes, so we will refresh them every 29 minutes
 */

export class CrowdstrikeConnector extends SubActionConnector<
  CrowdstrikeConfig,
  CrowdstrikeSecrets
> {
  private static token: string | null;
  private static tokenExpiryTimeout: NodeJS.Timeout;
  private static base64encodedData: string;
  private urls: {
    getToken: string;
    agents: string;
    hostAction: string;
  };

  constructor(params: ServiceParams<CrowdstrikeConfig, CrowdstrikeSecrets>) {
    super(params);
    this.urls = {
      getToken: `${API_PATH}/oauth2/token`,
      hostAction: `${API_PATH}/devices/entities/devices-actions/v2`,
      agents: `${API_PATH}/devices/entities/devices/v2`,
    };

    if (!CrowdstrikeConnector.base64encodedData) {
      CrowdstrikeConnector.base64encodedData = Buffer.from(
        this.secrets.clientId + ':' + this.secrets.clientSecret
      ).toString('base64');
    }

    this.registerSubActions();
  }

  private registerSubActions() {
    this.registerSubAction({
      name: SUB_ACTION.GET_AGENT_DETAILS,
      method: 'getAgentDetails',
      schema: CrowdstrikeGetAgentsParamsSchema,
    });

    this.registerSubAction({
      name: SUB_ACTION.HOST_ACTIONS,
      method: 'executeHostActions',
      schema: CrowdstrikeHostActionsParamsSchema,
    });
  }

  public async executeHostActions({ alertIds, ...payload }: CrowdstrikeHostActionsParams) {
    return this.crowdstrikeApiRequest({
      url: this.urls.hostAction,
      method: 'post',
      params: {
        action_name: payload.command,
      },
      data: {
        ids: payload.ids,
        ...(payload.actionParameters
          ? {
              action_parameters: Object.entries(payload.actionParameters).map(([name, value]) => ({
                name,
                value,
              })),
            }
          : {}),
      },
      paramsSerializer,
      responseSchema: CrowdstrikeHostActionsResponseSchema,
    });
  }

  public async getAgentDetails(
    payload: CrowdstrikeGetAgentsParams
  ): Promise<CrowdstrikeGetAgentsResponse> {
    return this.crowdstrikeApiRequest({
      url: this.urls.agents,
      method: 'GET',
      params: {
        ids: payload.ids,
      },
      paramsSerializer,
      responseSchema: CrowdstrikeGetAgentsResponseSchema,
    });
  }

  private async getTokenRequest() {
    const response = await this.request<CrowdstrikeGetTokenResponse>({
      url: this.urls.getToken,
      method: 'post',
      headers: {
        accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        authorization: 'Basic ' + this.base64encodedData,
      },
      responseSchema: CrowdstrikeGetTokenResponseSchema,
    });
    const token = response.data?.access_token;
    if (token) {
      // Clear any existing timeout
      clearTimeout(CrowdstrikeConnector.tokenExpiryTimeout);

      // Set a timeout to reset the token after 29 minutes (it expires after 30 minutes)
      CrowdstrikeConnector.tokenExpiryTimeout = setTimeout(() => {
        CrowdstrikeConnector.token = null;
      }, 29 * 60 * 1000);
    }
    return token;
  }

  private async crowdstrikeApiRequest<R extends CrowdstrikeBaseApiResponse>(
    req: SubActionRequestParams<R>,
    retried?: boolean
  ): Promise<R> {
    try {
      if (!CrowdstrikeConnector.token) {
        CrowdstrikeConnector.token = (await this.getTokenRequest()) as string;
      }

      const response = await this.request<R>({
        ...req,
        headers: {
          ...req.headers,
          Authorization: `Bearer ${CrowdstrikeConnector.token}`,
        },
      });

      return response.data;
    } catch (error) {
      if (error.code === 401 && !retried) {
        CrowdstrikeConnector.token = null;
        return this.crowdstrikeApiRequest(req, true);
      }

      throw new Error(error.message);
    }
  }

  protected getResponseErrorMessage(
    error: AxiosError<{ errors: [{ message: string; code: number }] }>
  ): string {
    const errorData = error.response?.data?.errors?.[0];
    if (errorData) {
      return errorData.message;
    }

    if (!error.response?.status) {
      return 'Unknown API Error';
    }

    return `API Error: ${error.response?.statusText}`;
  }
}

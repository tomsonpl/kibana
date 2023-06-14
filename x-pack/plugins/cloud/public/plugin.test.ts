/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { decodeCloudIdMock, parseDeploymentIdFromDeploymentUrlMock } from './plugin.test.mocks';
import { coreMock } from '@kbn/core/public/mocks';
import { CloudPlugin } from './plugin';
import type { DecodedCloudId } from '../common/decode_cloud_id';

const baseConfig = {
  base_url: 'https://cloud.elastic.co',
  deployment_url: '/abc123',
  profile_url: '/user/settings/',
  organization_url: '/account/',
};

describe('Cloud Plugin', () => {
  beforeEach(() => {
    parseDeploymentIdFromDeploymentUrlMock.mockReset().mockReturnValue('deployment-id');
    decodeCloudIdMock.mockReset().mockReturnValue({});
  });

  describe('#setup', () => {
    describe('interface', () => {
      const setupPlugin = () => {
        const initContext = coreMock.createPluginInitializerContext({
          ...baseConfig,
          id: 'cloudId',
          cname: 'cloud.elastic.co',
        });
        const plugin = new CloudPlugin(initContext);

        const coreSetup = coreMock.createSetup();
        const setup = plugin.setup(coreSetup);

        return { setup };
      };

      it('exposes isCloudEnabled', () => {
        const { setup } = setupPlugin();
        expect(setup.isCloudEnabled).toBe(true);
      });

      it('exposes cloudId', () => {
        const { setup } = setupPlugin();
        expect(setup.cloudId).toBe('cloudId');
      });

      it('exposes baseUrl', () => {
        const { setup } = setupPlugin();
        expect(setup.baseUrl).toBe('https://cloud.elastic.co');
      });

      it('exposes deploymentUrl', () => {
        const { setup } = setupPlugin();
        expect(setup.deploymentUrl).toBe('https://cloud.elastic.co/abc123');
      });

      it('exposes snapshotsUrl', () => {
        const { setup } = setupPlugin();
        expect(setup.snapshotsUrl).toBe('https://cloud.elastic.co/abc123/elasticsearch/snapshots/');
      });

      it('exposes profileUrl', () => {
        const { setup } = setupPlugin();
        expect(setup.profileUrl).toBe('https://cloud.elastic.co/user/settings/');
      });

      it('exposes organizationUrl', () => {
        const { setup } = setupPlugin();
        expect(setup.organizationUrl).toBe('https://cloud.elastic.co/account/');
      });

      it('exposes cname', () => {
        const { setup } = setupPlugin();
        expect(setup.cname).toBe('cloud.elastic.co');
      });

      it('exposes registerCloudService', () => {
        const { setup } = setupPlugin();
        expect(setup.registerCloudService).toBeDefined();
      });

      it('exposes deploymentId', () => {
        parseDeploymentIdFromDeploymentUrlMock.mockReturnValue('some-deployment-id');
        const { setup } = setupPlugin();
        expect(setup.deploymentId).toBe('some-deployment-id');
        expect(parseDeploymentIdFromDeploymentUrlMock).toHaveBeenCalledTimes(2); // called when registering the analytic context too
        expect(parseDeploymentIdFromDeploymentUrlMock).toHaveBeenCalledWith(
          baseConfig.deployment_url
        );
      });

      it('exposes components decoded from the cloudId', () => {
        const decodedId: DecodedCloudId = {
          defaultPort: '9000',
          host: 'host',
          elasticsearchUrl: 'elasticsearch-url',
          kibanaUrl: 'kibana-url',
        };
        decodeCloudIdMock.mockReturnValue(decodedId);
        const { setup } = setupPlugin();
        expect(setup).toEqual(
          expect.objectContaining({
            cloudDefaultPort: '9000',
            cloudHost: 'host',
            elasticsearchUrl: 'elasticsearch-url',
            kibanaUrl: 'kibana-url',
          })
        );
        expect(decodeCloudIdMock).toHaveBeenCalledTimes(1);
        expect(decodeCloudIdMock).toHaveBeenCalledWith('cloudId', expect.any(Object));
      });
    });
  });

  describe('#start', () => {
    const startPlugin = () => {
      const plugin = new CloudPlugin(
        coreMock.createPluginInitializerContext({
          id: 'cloudId',
          base_url: 'https://cloud.elastic.co',
          deployment_url: '/abc123',
          profile_url: '/profile/alice',
          organization_url: '/org/myOrg',
          full_story: {
            enabled: false,
          },
          chat: {
            enabled: false,
          },
        })
      );
      const coreSetup = coreMock.createSetup();

      plugin.setup(coreSetup);

      return { coreSetup, plugin };
    };

    it('registers help support URL', async () => {
      const { plugin } = startPlugin();

      const coreStart = coreMock.createStart();
      plugin.start(coreStart);

      expect(coreStart.chrome.setHelpSupportUrl).toHaveBeenCalledTimes(1);
      expect(coreStart.chrome.setHelpSupportUrl.mock.calls[0]).toMatchInlineSnapshot(`
        Array [
          "https://cloud.elastic.co/support",
        ]
      `);
    });
  });
});

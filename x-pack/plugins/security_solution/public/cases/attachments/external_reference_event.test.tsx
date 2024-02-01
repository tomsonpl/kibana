/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { shallow } from 'enzyme';

import AttachmentContent from './external_reference_event';
import { useNavigation } from '@kbn/security-solution-navigation/src/navigation';

jest.mock('@kbn/security-solution-navigation/src/navigation', () => {
  return {
    useNavigation: jest.fn(),
  };
});

describe('AttachmentContent', () => {
  const mockNavigateTo = jest.fn();

  const mockUseNavigation = useNavigation as jest.Mocked<typeof useNavigation>;
  (mockUseNavigation as jest.Mock).mockReturnValue({
    getAppUrl: jest.fn(),
    navigateTo: mockNavigateTo,
  });

  const defaultProps = {
    externalReferenceMetadata: {
      command: 'isolate',
      targets: [
        {
          endpointId: 'endpoint-1',
          hostname: 'host-1',
          type: 'endpoint' as const,
        },
      ],
    },
  };

  it('renders the expected text based on the command', () => {
    const component = shallow(<AttachmentContent {...defaultProps} />);

    expect(component.text()).toContain('submitted isolate request on host host-1');

    component.setProps({
      externalReferenceMetadata: {
        ...defaultProps.externalReferenceMetadata,
        command: 'unisolate',
      },
    });

    expect(component.text()).toContain('submitted release request on host host-1');
  });

  it('navigates on link click', () => {
    const component = shallow(<AttachmentContent {...defaultProps} />);

    component.find('EuiLink').simulate('click', {
      preventDefault: jest.fn(),
    });

    expect(mockNavigateTo).toHaveBeenCalled();
  });
  it('builds endpoint details URL correctly', () => {
    const mockGetAppUrl = jest.fn().mockReturnValue('http://app.url');
    (mockUseNavigation as jest.Mock).mockReturnValue({
      getAppUrl: mockGetAppUrl,
    });

    shallow(<AttachmentContent {...defaultProps} />);

    expect(mockGetAppUrl).toHaveBeenNthCalledWith(1, {
      path: '/administration/endpoints?selected_endpoint=endpoint-1&show=activity_log',
    });
    expect(mockGetAppUrl).toHaveBeenNthCalledWith(2, {
      path: '/hosts/name/host-1',
      appId: 'security',
    });
  });
});

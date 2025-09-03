/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { ConsoleTestSetup, HelpSidePanelSelectorsAndActions } from '../../../console/mocks';
import {
  getConsoleTestSetup,
  getHelpSidePanelSelectorsAndActionsMock,
} from '../../../console/mocks';
import { getEndpointConsoleCommands } from '../..';
import { EndpointMetadataGenerator } from '../../../../../../common/endpoint/data_generators/endpoint_metadata_generator';
import { getEndpointPrivilegesInitialStateMock } from '../../../../../common/components/user_privileges/endpoint/mocks';
import { sortBy } from 'lodash';
import { HELP_GROUPS } from '../console_commands_definition';
import { ExperimentalFeaturesService } from '../../../../../common/experimental_features_service';
import type { CommandDefinition } from '../../../console';
import type { HostMetadataInterface } from '../../../../../../common/endpoint/types';
import { CONSOLE_RESPONSE_ACTION_COMMANDS } from '../../../../../../common/endpoint/service/response_actions/constants';

jest.mock('../../../../../common/experimental_features_service');

describe('When displaying Endpoint Response Actions', () => {
  let render: ConsoleTestSetup['renderConsole'];
  let renderResult: ReturnType<typeof render>;
  let consoleSelectors: ConsoleTestSetup['selectors'];
  let helpPanelSelectors: HelpSidePanelSelectorsAndActions;
  let commands: CommandDefinition[];
  let endpointMetadata: HostMetadataInterface;

  beforeEach(() => {
    const testSetup = getConsoleTestSetup();
    endpointMetadata = new EndpointMetadataGenerator().generate();
    consoleSelectors = testSetup.selectors;
    render = (props = { commands }) => {
      renderResult = testSetup.renderConsole(props);
      helpPanelSelectors = getHelpSidePanelSelectorsAndActionsMock(renderResult);

      return renderResult;
    };
  });

  describe('for agent type endpoint', () => {
    beforeEach(() => {
      (ExperimentalFeaturesService.get as jest.Mock).mockReturnValue({
        responseActionUploadEnabled: true,
      });
      commands = getEndpointConsoleCommands({
        agentType: 'endpoint',
        endpointAgentId: '123',
        endpointCapabilities: endpointMetadata.Endpoint.capabilities ?? [],
        endpointPrivileges: getEndpointPrivilegesInitialStateMock(),
        platform: 'linux',
      });
    });

    it('should display expected help groups', () => {
      render({ commands });
      consoleSelectors.openHelpPanel();

      expect(helpPanelSelectors.getHelpGroupLabels()).toEqual([
        ...sortBy(Object.values(HELP_GROUPS), 'position').map((group) => group.label),
        'Supporting commands & parameters',
      ]);
    });

    it('should display response action commands in the help panel in expected order', () => {
      render({ commands });
      consoleSelectors.openHelpPanel();
      const commandsInPanel = helpPanelSelectors.getHelpCommandNames(
        HELP_GROUPS.responseActions.label
      );

      const endpointCommands = CONSOLE_RESPONSE_ACTION_COMMANDS.filter(
        (command) => command !== 'runscript' && command !== 'cancel'
      );
      const expectedCommands: string[] = [...endpointCommands];
      // add status to the list of expected commands in that order
      expectedCommands.splice(2, 0, 'status');

      const helpCommandsString = commandsInPanel.map((command) => command.split(' ')[0]).join(',');

      // verify that the help commands map to the command list in the same order
      expect(helpCommandsString).toEqual(expectedCommands.join(','));
    });
  });

  describe('for agent type sentinel_one', () => {
    beforeEach(() => {
      (ExperimentalFeaturesService.get as jest.Mock).mockReturnValue({
        responseActionsCrowdstrikeManualHostIsolationEnabled: true,
        responseActionsSentinelOneV1Enabled: true,
        responseActionsSentinelOneGetFileEnabled: true,
        responseActionsSentinelOneKillProcessEnabled: true,
        responseActionsSentinelOneProcessesEnabled: true,
        responseActionsSentinelOneRunScriptEnabled: true,
      });

      commands = getEndpointConsoleCommands({
        agentType: 'sentinel_one',
        endpointAgentId: '123',
        endpointCapabilities: endpointMetadata.Endpoint.capabilities ?? [],
        endpointPrivileges: getEndpointPrivilegesInitialStateMock(),
        platform: 'linux',
      });
    });

    it('should display expected help groups', () => {
      render({ commands });
      consoleSelectors.openHelpPanel();

      expect(helpPanelSelectors.getHelpGroupLabels()).toEqual([
        ...sortBy(Object.values(HELP_GROUPS), 'position').map((group) => group.label),
        'Supporting commands & parameters',
      ]);
    });

    it('should display response action commands in the help panel in expected order', () => {
      const { queryByTestId } = render({ commands });
      consoleSelectors.openHelpPanel();
      const commandsInPanel = helpPanelSelectors.getHelpCommandNames(
        HELP_GROUPS.responseActions.label
      );

      expect(commandsInPanel).toEqual([
        'isolate',
        'release',
        'processes',
        'kill-process --processName',
        'get-file --path',
        'runscript --script',
      ]);
      expect(queryByTestId('sentineloneProcessesWindowsWarningTooltip')).toBeNull();
    });

    it('should display warning icon on processes command if host is running on windows', () => {
      commands = getEndpointConsoleCommands({
        agentType: 'sentinel_one',
        endpointAgentId: '123',
        endpointCapabilities: endpointMetadata.Endpoint.capabilities ?? [],
        endpointPrivileges: getEndpointPrivilegesInitialStateMock(),
        platform: 'windows',
      });
      const { getByTestId } = render({ commands });
      consoleSelectors.openHelpPanel();

      expect(getByTestId('sentineloneProcessesWindowsWarningTooltip')).not.toBeNull();
    });
  });

  describe('for agent type crowdstrike', () => {
    beforeEach(() => {
      (ExperimentalFeaturesService.get as jest.Mock).mockReturnValue({
        responseActionsCrowdstrikeManualHostIsolationEnabled: true,
        crowdstrikeRunScriptEnabled: true,
      });
      commands = getEndpointConsoleCommands({
        agentType: 'crowdstrike',
        endpointAgentId: '123',
        endpointCapabilities: endpointMetadata.Endpoint.capabilities ?? [],
        endpointPrivileges: getEndpointPrivilegesInitialStateMock(),
        platform: 'linux',
      });
    });

    it('should display expected help groups', () => {
      render({ commands });
      consoleSelectors.openHelpPanel();

      expect(helpPanelSelectors.getHelpGroupLabels()).toEqual([
        ...sortBy(Object.values(HELP_GROUPS), 'position').map((group) => group.label),
        'Supporting commands & parameters',
      ]);
    });

    it('should display response action commands in the help panel in expected order', () => {
      render({ commands });
      consoleSelectors.openHelpPanel();
      const commandsInPanel = helpPanelSelectors.getHelpCommandNames(
        HELP_GROUPS.responseActions.label
      );

      expect(commandsInPanel).toEqual(['isolate', 'release', 'runscript --Raw']);
    });
  });

  describe('for agent type microsoft defender for endpoint', () => {
    beforeEach(() => {
      (ExperimentalFeaturesService.get as jest.Mock).mockReturnValue({
        responseActionsMSDefenderEndpointEnabled: true,
      });

      commands = getEndpointConsoleCommands({
        agentType: 'microsoft_defender_endpoint',
        endpointAgentId: '123',
        endpointCapabilities: endpointMetadata.Endpoint.capabilities ?? [],
        endpointPrivileges: getEndpointPrivilegesInitialStateMock(),
        platform: 'linux',
      });
    });

    it('should display expected help groups', () => {
      render({ commands });
      consoleSelectors.openHelpPanel();

      expect(helpPanelSelectors.getHelpGroupLabels()).toEqual([
        ...sortBy(Object.values(HELP_GROUPS), 'position').map((group) => group.label),
        'Supporting commands & parameters',
      ]);
    });

    it('should display response action commands in the help panel in expected order', () => {
      render({ commands });
      consoleSelectors.openHelpPanel();
      const commandsInPanel = helpPanelSelectors.getHelpCommandNames(
        HELP_GROUPS.responseActions.label
      );

      expect(commandsInPanel).toEqual(['isolate', 'release']);
    });
  });

  describe('for cancel command privileges', () => {
    it('should allow cancel command when user has response action privileges', () => {
      (ExperimentalFeaturesService.get as jest.Mock).mockReturnValue({
        microsoftDefenderEndpointCancelEnabled: true,
      });

      const privilegesWithIsolateHost = {
        ...getEndpointPrivilegesInitialStateMock(),
        canIsolateHost: true,
      };

      commands = getEndpointConsoleCommands({
        agentType: 'microsoft_defender_endpoint',
        endpointAgentId: '123',
        endpointCapabilities: endpointMetadata.Endpoint.capabilities ?? [],
        endpointPrivileges: privilegesWithIsolateHost,
        platform: 'linux',
      });

      const cancelCommand = commands.find((cmd) => cmd.name === 'cancel');
      expect(cancelCommand).toBeDefined();
      expect(cancelCommand?.helpHidden).toBe(false);
      
      // Test the validation function
      if (cancelCommand?.validate) {
        const mockCommand = {
          commandDefinition: cancelCommand,
          args: { hasArg: () => false },
        } as any;
        const validationResult = cancelCommand.validate(mockCommand);
        expect(validationResult).toBe(true);
      }
    });

    it('should deny cancel command when user has no response action privileges', () => {
      (ExperimentalFeaturesService.get as jest.Mock).mockReturnValue({
        microsoftDefenderEndpointCancelEnabled: true,
      });

      const privilegesWithoutResponseActions = {
        ...getEndpointPrivilegesInitialStateMock(),
        canIsolateHost: false,
        canKillProcess: false,
        canSuspendProcess: false,
        canGetRunningProcesses: false,
        canWriteFileOperations: false,
        canWriteExecuteOperations: false,
        canWriteScanOperations: false,
        canWriteRunScript: false,
      };

      commands = getEndpointConsoleCommands({
        agentType: 'microsoft_defender_endpoint',
        endpointAgentId: '123',
        endpointCapabilities: endpointMetadata.Endpoint.capabilities ?? [],
        endpointPrivileges: privilegesWithoutResponseActions,
        platform: 'linux',
      });

      const cancelCommand = commands.find((cmd) => cmd.name === 'cancel');
      expect(cancelCommand).toBeDefined();
      expect(cancelCommand?.helpHidden).toBe(true);
      
      // Test the validation function
      if (cancelCommand?.validate) {
        const mockCommand = {
          commandDefinition: cancelCommand,
          args: { hasArg: () => false },
        } as any;
        const validationResult = cancelCommand.validate(mockCommand);
        expect(validationResult).toContain('You do not have the required privileges');
      }
    });
  });
});

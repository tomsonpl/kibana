/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { getRbacControl } from './utils';
import type { ConsoleResponseActionCommands, ResponseActionsApiCommandNames } from './constants';
import { getEndpointAuthzInitialStateMock } from '../authz/mocks';

describe('getRbacControl', () => {
  describe('static permission commands', () => {
    it.each([
      ['isolate', 'canIsolateHost', true],
      ['isolate', 'canIsolateHost', false],
      ['release', 'canUnIsolateHost', true],
      ['release', 'canUnIsolateHost', false],
      ['execute', 'canWriteExecuteOperations', true],
      ['execute', 'canWriteExecuteOperations', false],
      ['get-file', 'canWriteFileOperations', true],
      ['get-file', 'canWriteFileOperations', false],
      ['upload', 'canWriteFileOperations', true],
      ['upload', 'canWriteFileOperations', false],
      ['processes', 'canGetRunningProcesses', true],
      ['processes', 'canGetRunningProcesses', false],
      ['kill-process', 'canKillProcess', true],
      ['kill-process', 'canKillProcess', false],
      ['suspend-process', 'canSuspendProcess', true],
      ['suspend-process', 'canSuspendProcess', false],
      ['scan', 'canWriteScanOperations', true],
      ['scan', 'canWriteScanOperations', false],
      ['runscript', 'canWriteExecuteOperations', true],
      ['runscript', 'canWriteExecuteOperations', false],
    ])(
      'should return %s for %s command when user has permission: %s',
      (command, permission, hasPermission) => {
        const privileges = {
          ...getEndpointAuthzInitialStateMock({
            [permission]: hasPermission,
          }),
          loading: false,
        };

        const result = getRbacControl({
          commandName: command as ConsoleResponseActionCommands,
          privileges,
        });

        expect(result).toBe(hasPermission);
      }
    );
  });

  describe('dynamic permission commands', () => {
    describe('cancel command', () => {
      it('should return true when user has permission for the target action being cancelled', () => {
        const privileges = {
          ...getEndpointAuthzInitialStateMock({
            canIsolateHost: true,
          }),
          loading: false,
        };

        const result = getRbacControl({
          commandName: 'cancel',
          privileges,
          context: { targetActionCommand: 'isolate' },
        });

        expect(result).toBe(true);
      });

      it('should return false when user lacks permission for the target action being cancelled', () => {
        const privileges = {
          ...getEndpointAuthzInitialStateMock({
            canIsolateHost: false,
          }),
          loading: false,
        };

        const result = getRbacControl({
          commandName: 'cancel',
          privileges,
          context: { targetActionCommand: 'isolate' },
        });

        expect(result).toBe(false);
      });

      it('should return false when context is missing for cancel command', () => {
        const privileges = {
          ...getEndpointAuthzInitialStateMock({
            canIsolateHost: true,
          }),
          loading: false,
        };

        const result = getRbacControl({
          commandName: 'cancel',
          privileges,
          // Missing context
        });

        expect(result).toBe(false);
      });

      it('should return false when target action command is undefined', () => {
        const privileges = {
          ...getEndpointAuthzInitialStateMock({
            canIsolateHost: true,
          }),
          loading: false,
        };

        const result = getRbacControl({
          commandName: 'cancel',
          privileges,
          context: {}, // Empty context
        });

        expect(result).toBe(false);
      });

      it.each([
        ['isolate', 'canIsolateHost'],
        ['unisolate', 'canUnIsolateHost'],
        ['kill-process', 'canKillProcess'],
        ['suspend-process', 'canSuspendProcess'],
        ['running-processes', 'canGetRunningProcesses'],
        ['get-file', 'canWriteFileOperations'],
        ['execute', 'canWriteExecuteOperations'],
        ['upload', 'canWriteFileOperations'],
        ['scan', 'canWriteScanOperations'],
        ['runscript', 'canWriteExecuteOperations'],
      ])(
        'should validate cancel permission for %s target command',
        (targetCommand, expectedPermission) => {
          const privileges = {
            ...getEndpointAuthzInitialStateMock({
              [expectedPermission]: true,
            }),
            loading: false,
          };

          const result = getRbacControl({
            commandName: 'cancel',
            privileges,
            context: { targetActionCommand: targetCommand as ResponseActionsApiCommandNames },
          });

          expect(result).toBe(true);
        }
      );
    });
  });
});

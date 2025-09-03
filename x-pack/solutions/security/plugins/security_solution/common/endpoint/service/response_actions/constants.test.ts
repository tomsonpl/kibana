/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import {
  resolveCommandPermission,
  type ConsoleResponseActionCommands,
  type ResponseActionsApiCommandNames,
} from './constants';

describe('resolveCommandPermission', () => {
  describe('static permission resolution', () => {
    it.each([
      ['isolate', 'canIsolateHost'],
      ['release', 'canUnIsolateHost'],
      ['execute', 'canWriteExecuteOperations'],
      ['get-file', 'canWriteFileOperations'],
      ['upload', 'canWriteFileOperations'],
      ['processes', 'canGetRunningProcesses'],
      ['kill-process', 'canKillProcess'],
      ['suspend-process', 'canSuspendProcess'],
      ['scan', 'canWriteScanOperations'],
      ['runscript', 'canWriteExecuteOperations'],
    ])('should resolve static permission for %s command', (command, expectedPermission) => {
      const result = resolveCommandPermission(command as ConsoleResponseActionCommands);
      expect(result).toBe(expectedPermission);
    });
  });

  describe('dynamic permission resolution', () => {
    // No setup needed - cancel command already uses DYNAMIC_COMMAND_BASED

    it('should resolve cancel permission based on target action command', () => {
      const result = resolveCommandPermission('cancel', { targetActionCommand: 'isolate' });
      expect(result).toBe('canIsolateHost');
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
      'should resolve cancel permission for %s target command',
      (targetCommand, expectedPermission) => {
        const result = resolveCommandPermission('cancel', {
          targetActionCommand: targetCommand as ResponseActionsApiCommandNames,
        });
        expect(result).toBe(expectedPermission);
      }
    );

    it('should throw error when cancel command lacks target action context', () => {
      expect(() => resolveCommandPermission('cancel')).toThrow(
        'Cancel command requires target action command context for permission resolution'
      );
    });

    it('should throw error when cancel command has undefined target action', () => {
      expect(() => resolveCommandPermission('cancel', {})).toThrow(
        'Cancel command requires target action command context for permission resolution'
      );
    });
  });
});

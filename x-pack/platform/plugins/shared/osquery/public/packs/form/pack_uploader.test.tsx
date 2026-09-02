/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

/**
 * Pins file-type validation and parse behavior for OsqueryPackUploader.
 * EUI is stubbed to avoid the uuid ESM OOM in this Jest environment.
 */

import React from 'react';
import { render, act } from '@testing-library/react';
import { __IntlProvider as IntlProvider } from '@kbn/i18n-react';

jest.mock('@elastic/eui', () => {
  const MockReact = jest.requireActual('react');

  return {
    EuiButtonEmpty: ({ children, onClick, 'data-test-subj': testSubj }: any) => (
      <button data-testid={testSubj} onClick={onClick}>
        {children}
      </button>
    ),
    EuiToolTip: ({ children }: any) => <>{children}</>,
    EuiLink: ({ children, href }: any) => <a href={href}>{MockReact.Children.toArray(children)}</a>,
  };
});

import { OsqueryPackUploader } from './pack_uploader';

// ---------------------------------------------------------------------------
// FileReader stub
// ---------------------------------------------------------------------------

class MockFileReader {
  onloadend: (() => void) | null = null;
  result: string | null = null;

  readAsText(file: any) {
    this.result = file._content ?? '';
    Promise.resolve().then(() => this.onloadend?.());
  }
}

const makeFileList = (name: string, type: string, content = '') => {
  const file = { name, type, _content: content } as any;

  // FileList-like object
  return Object.assign([file], { item: (i: number) => (i === 0 ? file : null) }) as any;
};

const renderUploader = (onChange: jest.Mock) =>
  render(
    <IntlProvider locale="en">
      <OsqueryPackUploader onChange={onChange} />
    </IntlProvider>
  );

describe('OsqueryPackUploader', () => {
  let originalFileReader: typeof FileReader;

  beforeAll(() => {
    originalFileReader = global.FileReader;
    (global as any).FileReader = MockFileReader;
  });

  afterAll(() => {
    global.FileReader = originalFileReader;
  });

  describe('file type validation', () => {
    it('should call onChange when a valid JSON file is selected', async () => {
      const onChange = jest.fn();
      const { container } = renderUploader(onChange);
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      const content = JSON.stringify({ queries: { q1: { query: 'SELECT 1;', interval: '60' } } });

      await act(async () => {
        const files = makeFileList('mypack.json', 'application/json', content);
        Object.defineProperty(input, 'files', { value: files, configurable: true });
        input.dispatchEvent(new Event('change', { bubbles: true }));
        await Promise.resolve();
        await Promise.resolve();
      });

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange.mock.calls[0][0]).toHaveProperty('queries');
    });

    it('should NOT call onChange for an unsupported file type', async () => {
      const onChange = jest.fn();
      const { container } = renderUploader(onChange);
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;

      await act(async () => {
        const files = makeFileList('myfile.pdf', 'application/pdf', 'not-json');
        Object.defineProperty(input, 'files', { value: files, configurable: true });
        input.dispatchEvent(new Event('change', { bubbles: true }));
        await Promise.resolve();
      });

      expect(onChange).not.toHaveBeenCalled();
    });
  });
});

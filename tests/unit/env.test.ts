// Unit tests for environment variable helpers
import { describe, it, expect } from 'vitest';
import { requireEnv, optionalEnv } from '../../src/utils/env.js';

describe('env utils', () => {
  it('requireEnv should return value when present', () => {
    process.env['TEST_VAR'] = 'test-value';
    expect(requireEnv('TEST_VAR')).toBe('test-value');
  });

  it('requireEnv should throw when missing', () => {
    delete process.env['MISSING_VAR'];
    expect(() => requireEnv('MISSING_VAR')).toThrow('Missing required env var: MISSING_VAR');
  });

  it('optionalEnv should return value when present', () => {
    process.env['OPTIONAL_VAR'] = 'present';
    expect(optionalEnv('OPTIONAL_VAR', 'default')).toBe('present');
  });

  it('optionalEnv should return fallback when missing', () => {
    delete process.env['MISSING_OPTIONAL'];
    expect(optionalEnv('MISSING_OPTIONAL', 'fallback')).toBe('fallback');
  });
});

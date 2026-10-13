import { describe, expect, it } from 'vitest';
import { isAuthCallbackUrl, isOidcConfigured } from './oidc';

describe('isAuthCallbackUrl', () => {
  it('detects code+state callback urls (hash router keeps query in search)', () => {
    expect(isAuthCallbackUrl('http://localhost:9000/?code=abc&state=xyz#/auth/callback')).toBe(true);
  });

  it('rejects urls without code or state', () => {
    expect(isAuthCallbackUrl('http://localhost:9000/#/auth/login')).toBe(false);
    expect(isAuthCallbackUrl('http://localhost:9000/?code=abc#/auth/callback')).toBe(false);
    expect(isAuthCallbackUrl('http://localhost:9000/?state=xyz#/auth/callback')).toBe(false);
  });
});

describe('isOidcConfigured', () => {
  it('is false without issuer/client env (test env has none)', () => {
    expect(isOidcConfigured()).toBe(false);
  });
});

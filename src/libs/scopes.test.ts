import { describe, expect, it } from 'vitest';
import { parseRolesClaim, resolveScopes, Scopes, ZITADEL_ROLES_CLAIM } from './scopes';

describe('resolveScopes', () => {
  it('maps known roles to scopes', () => {
    expect(resolveScopes(['streamer'])).toEqual([Scopes.STREAMS_WRITE, Scopes.STREAMS_READ]);
    expect(resolveScopes(['org_admin'])).toContain(Scopes.ORG_ADMIN);
    expect(resolveScopes(['org_owner'])).toContain(Scopes.ORG_ADMIN);
  });

  it('unions scopes across roles and matches case-insensitively', () => {
    const scopes = resolveScopes(['viewer', 'STREAMER']);
    expect(scopes).toContain(Scopes.STREAMS_WRITE);
    expect(scopes).toContain(Scopes.STREAMS_READ);
    expect(scopes).toContain(Scopes.NOTIFICATIONS_READ);
  });

  it('returns empty for unknown or empty roles', () => {
    expect(resolveScopes(['unknown_role'])).toEqual([]);
    expect(resolveScopes([])).toEqual([]);
  });
});

describe('parseRolesClaim', () => {
  it('parses zitadel object claim', () => {
    expect(parseRolesClaim({ [ZITADEL_ROLES_CLAIM]: { org_admin: 'org_admin' } })).toEqual([
      'org_admin',
    ]);
  });

  it('parses array claim', () => {
    expect(parseRolesClaim({ [ZITADEL_ROLES_CLAIM]: ['viewer', 'streamer'] })).toEqual([
      'viewer',
      'streamer',
    ]);
  });

  it('returns empty when claim missing or wrong shape', () => {
    expect(parseRolesClaim(undefined)).toEqual([]);
    expect(parseRolesClaim({})).toEqual([]);
    expect(parseRolesClaim({ [ZITADEL_ROLES_CLAIM]: 'not-an-object' })).toEqual([]);
  });
});

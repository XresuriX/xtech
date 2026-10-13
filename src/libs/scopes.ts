export const Scopes = {
  ORG_ADMIN: 'org:admin',
  STREAMS_WRITE: 'org:streams:write',
  STREAMS_READ: 'org:streams:read',
  CONFERENCES_WRITE: 'org:conferences:write',
  MEMBERS_WRITE: 'org:members:write',
  CATALOGUE_WRITE: 'org:catalogue:write',
  NOTIFICATIONS_READ: 'org:notifications:read',
  ECONOMY_WRITE: 'org:economy:write',
  GAMIFICATION_WRITE: 'org:gamification:write',
  NOTIFICATIONS_WRITE: 'org:notifications:write',
} as const;

export type Scope = (typeof Scopes)[keyof typeof Scopes];

export const ORG_ADMIN_SCOPES: Scope[] = Object.values(Scopes);

// Mirror of xt-plat/src/infrastructure/auth/scopes.py ROLE_SCOPES — keep in sync.
const ROLE_SCOPES: Record<string, Scope[]> = {
  org_owner: ORG_ADMIN_SCOPES,
  org_admin: ORG_ADMIN_SCOPES,
  stream_admin: [Scopes.STREAMS_WRITE, Scopes.STREAMS_READ, Scopes.CATALOGUE_WRITE],
  streamer: [Scopes.STREAMS_WRITE, Scopes.STREAMS_READ],
  viewer: [Scopes.STREAMS_READ, Scopes.NOTIFICATIONS_READ],
};

export const ZITADEL_ROLES_CLAIM = 'urn:zitadel:iam:org:project:roles';

export const resolveScopes = (roles: string[]): Scope[] => {
  const scopes = new Set<Scope>();
  for (const role of roles) {
    for (const scope of ROLE_SCOPES[role.toLowerCase()] ?? []) {
      scopes.add(scope);
    }
  }
  return [...scopes];
};

export const parseRolesClaim = (
  claims: Record<string, unknown> | undefined | null
): string[] => {
  const raw = claims?.[ZITADEL_ROLES_CLAIM];
  if (Array.isArray(raw)) {
    return raw.map((role) => String(role));
  }
  if (raw && typeof raw === 'object') {
    return Object.keys(raw as Record<string, unknown>);
  }
  return [];
};

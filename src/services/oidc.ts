import { AppAuthRefeshTokenKey, AppAuthTokenKey, ExpireCookieDays } from '@/libs/constant';
import { parseRolesClaim, resolveScopes } from '@/libs/scopes';
import { useAppStore } from '@/stores/appStore';
import { useAuthenStore } from '@/stores/authenStore';
import type { UserDto } from '@/types/models';
import { addDateByDays } from '@/utils/dateUtil';
import { decodeJWT } from '@/utils/jwtUtil';
import { Cookies } from 'quasar';
import { UserManager } from 'oidc-client-ts';
import type { User } from 'oidc-client-ts';

const RETURN_URL_KEY = 'oidc_return_url';

const issuer = process.env.APP_OIDC_ISSUER || '';
const clientId = process.env.APP_OIDC_CLIENT_ID || '';
const scope = process.env.APP_OIDC_SCOPE || 'openid profile email offline_access';

export const isOidcConfigured = (): boolean => Boolean(issuer && clientId);

export const getRedirectUri = (): string => `${window.location.origin}/#/auth/callback`;

let manager: UserManager | null = null;

export const getUserManager = (): UserManager => {
  if (!manager) {
    manager = new UserManager({
      authority: issuer,
      client_id: clientId,
      redirect_uri: getRedirectUri(),
      post_logout_redirect_uri: `${window.location.origin}/#/`,
      response_type: 'code',
      scope,
      loadUserInfo: false,
      automaticSilentRenew: false,
    });
  }
  return manager;
};

export const isAuthCallbackUrl = (href: string): boolean => {
  const url = new URL(href);
  return url.searchParams.has('code') && url.searchParams.has('state');
};

export const syncAuthSession = (user: User | null): void => {
  if (process.env.SERVER) {
    return;
  }
  const secure = window.location.protocol === 'https:';
  if (user && !user.expired && user.access_token) {
    Cookies.set(AppAuthTokenKey, user.access_token, {
      path: '/',
      expires: addDateByDays(ExpireCookieDays),
      sameSite: 'Lax',
      secure,
    });
    if (user.refresh_token) {
      Cookies.set(AppAuthRefeshTokenKey, user.refresh_token, {
        path: '/',
        expires: addDateByDays(ExpireCookieDays),
        sameSite: 'Strict',
        secure,
      });
    }
    void applyClaims(user);
  } else {
    Cookies.remove(AppAuthTokenKey, { path: '/' });
    Cookies.remove(AppAuthRefeshTokenKey, { path: '/' });
    useAppStore().setScopes([]);
  }
};

const applyClaims = async (user: User): Promise<void> => {
  let claims = { ...user.profile } as Record<string, unknown>;
  if (user.access_token) {
    try {
      const accessClaims = await decodeJWT(user.access_token);
      if (accessClaims) {
        claims = { ...claims, ...accessClaims };
      }
    } catch {
      // keep profile claims when access token is not a JWT
    }
  }
  useAppStore().setScopes(resolveScopes(parseRolesClaim(claims)));
  const profile = claims as Record<string, unknown>;
  const dto: UserDto = {
    id: typeof profile.sub === 'string' ? profile.sub : null,
    email: typeof profile.email === 'string' ? profile.email : '',
    username:
      typeof profile.name === 'string'
        ? profile.name
        : typeof profile.preferred_username === 'string'
          ? profile.preferred_username
          : null,
    active: true,
  };
  useAuthenStore().setAuthen(dto);
};

export const getActiveUser = async (): Promise<User | null> => {
  try {
    return await getUserManager().getUser();
  } catch {
    return null;
  }
};

export const signInRedirect = async (returnUrl?: string): Promise<void> => {
  if (returnUrl) {
    sessionStorage.setItem(RETURN_URL_KEY, returnUrl);
  }
  await getUserManager().signinRedirect();
};

export const handleAuthCallback = async (): Promise<string> => {
  const user = await getUserManager().signinRedirectCallback();
  syncAuthSession(user);
  const returnUrl = sessionStorage.getItem(RETURN_URL_KEY) || '/';
  sessionStorage.removeItem(RETURN_URL_KEY);
  return returnUrl;
};

export const signInSilent = async (): Promise<boolean> => {
  try {
    const user = await getUserManager().signinSilent();
    syncAuthSession(user);
    return Boolean(user && !user.expired);
  } catch {
    return false;
  }
};

export const signOutLocal = async (): Promise<void> => {
  try {
    await getUserManager().removeUser();
  } catch {
    // local cleanup continues
  }
  syncAuthSession(null);
};

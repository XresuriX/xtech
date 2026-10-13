import {
  AppAuthRefeshTokenKey,
  AppAuthTokenKey,
} from '@/libs/constant';
import { isOidcConfigured, signInRedirect, signOutLocal } from '@/services/oidc';
import type { UserDto } from '@/types/models';
import { Cookies } from 'quasar';
import { useAuthenStore } from 'stores/authenStore';
import { useSSRContext } from 'vue';
import { useBase } from './useBase';
import { useCache } from './useCache';
import { useCookie } from './useCookie';
import { useLang } from './useLang';
export const useAuth = () => {
  const ssrContext = process.env.SERVER ? useSSRContext() : null;
  const cookies = process.env.SERVER ? Cookies.parseSSR(ssrContext) : Cookies; // otherwise we're on client
  const authenStore = useAuthenStore();
  const { appConfirm, appLoading, appNavigateTo } = useBase();
  const { t } = useLang();
  const { logoutClear } = useCache();
  const { removeCookie } = useCookie();
  const initAppAuthen = (): void => {
    // OIDC session is restored in boot/oidc.ts
  };
  const getAuthCookieByKey = (key: string): string | null => {
    if (!cookies) {
      return null;
    }
    return cookies.get(key) || null;
  };

  const setAuthen = (auth: UserDto | null) => {
    if (auth != null) {
      authenStore.setAuthen(auth);
    }
  };

  const signIn = async (returnUrl?: string): Promise<void> => {
    if (!isOidcConfigured()) {
      return;
    }
    // never returns - browser navigates to the IdP
    await signInRedirect(returnUrl);
  };

  const signOut = async () => {
    if (!cookies) {
      return;
    }

    const conf = await appConfirm(t('app.monogram'), t('helper.logoutConfirm'));
    if (conf) {
      appLoading();
      await signOutLocal();
      appLoading(false);
      destroyAuthDataAndRedirect();
    }
  };

  const destroyAuthData = () => {
    return new Promise((resolve) => {
      if (cookies) {
        removeCookie(AppAuthTokenKey);
        removeCookie(AppAuthRefeshTokenKey);
      }
      logoutClear();
      resolve(true);
    });
  };
  const destroyAuthDataAndRedirect = async (
    forceRedirectToLoginPage = true
  ) => {
    await destroyAuthData();
    authenStore.logout();
    if (forceRedirectToLoginPage) {
      appNavigateTo('/auth/login', true);
    }
  };

  return {
    initAppAuthen,
    signIn,
    signOut,
    setAuthen,
    getAuthCookieByKey,
    destroyAuthDataAndRedirect,
  };
};

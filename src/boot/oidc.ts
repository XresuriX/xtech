import { getActiveUser, handleAuthCallback, isAuthCallbackUrl, isOidcConfigured, syncAuthSession } from '@/services/oidc';
import { boot } from 'quasar/wrappers';

export default boot(async () => {
  if (process.env.SERVER || !isOidcConfigured()) {
    return;
  }
  if (isAuthCallbackUrl(window.location.href)) {
    try {
      const returnUrl = await handleAuthCallback();
      const path = returnUrl.startsWith('/') ? returnUrl : `/${returnUrl}`;
      // full navigation strips consumed ?code&state from the query string (hash router keeps search)
      window.location.replace(`${window.location.origin}/#${path}`);
    } catch (error) {
      console.error('OIDC callback failed', error);
      window.location.replace(`${window.location.origin}/#/auth/login`);
    }
    return;
  }
  const user = await getActiveUser();
  syncAuthSession(user && !user.expired ? user : null);
});

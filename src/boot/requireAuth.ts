import { AppAuthTokenKey } from '@/libs/constant';
import { decodeJWT } from '@/utils/jwtUtil';
import { boot } from 'quasar/wrappers';
import { Cookies } from 'quasar';
// TODO cannot use external file import in boot file >  https://github.com/quasarframework/quasar/issues/17365

const isTokenUsable = async (token: string): Promise<boolean> => {
  try {
    const payload = await decodeJWT(token);
    if (!payload?.exp) {
      return false;
    }
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
};

export default boot(({ router, ssrContext }) => {
  const cookies = process.env.SERVER ? Cookies.parseSSR(ssrContext) : Cookies; // otherwise we're on client
  router.beforeEach(async (to, from, next) => {
    if (to.meta.requireAuth === true) {
      const token = cookies.get(AppAuthTokenKey);
      // server cannot verify JWT expiry without JWKS here - accept presence (SSR fetches use the token and fail auth server-side)
      if (token && (process.env.SERVER || (await isTokenUsable(token)))) {
        next();
      } else {
        next({
          path: '/auth/login',
          replace: true,
        });
      }
    } else {
      next();
    }
  });
});

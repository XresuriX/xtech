import { AppAuthTokenKey, LocaleKey } from '@/libs/constant';
import { isOidcConfigured, signInSilent, syncAuthSession } from '@/services/oidc';
import type { AxiosInstance } from 'axios';
import axios from 'axios';
import { boot } from 'quasar/wrappers';
// TODO cannot use external file import in boot file >  https://github.com/quasarframework/quasar/issues/17365
import { Cookies } from 'quasar';
import JSONbig from 'json-bigint'
const JSONbigString = JSONbig({ storeAsString: true });
declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $axios: AxiosInstance;
    $api: AxiosInstance;
  }
}

// Be careful when using SSR for cross-request state pollution
// due to creating a Singleton instance here;
// If any client changes this (global) instance, it might be a
// good idea to move this instance creation inside of the
// "export default () => {}" function below (which runs individually
// for each client)
const api = axios.create({
  // baseURL: process.env.NODE_ENV == 'development' ? 'http://192.168.7.249:8080' : 'https://api.example.com',
  baseURL: process.env.APP_BASE_API || '',
  withCredentials: false,
  timeout: process.env.APP_API_TIME_OUT ? +process.env.APP_API_TIME_OUT : 3 * 60000, // 60000 = 1 minute, 0 = no timeout
  headers: {
    // Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Accept-Apiclient': process.env.APP_API_CLIENT
    // 'Accept-Language': DefaultLocale,
  },
  validateStatus: status => status < 400, // Resolve only if the status code is less than 400
  // validateStatus: (status) => status <= 500 // Resolve only if the status code is less than 500
  // transformResponse: [data => data],
  transformResponse: [function (data) {
    if (data) {
      try {
        const parsed = JSONbigString.parse(data);
        return parsed;
      } catch {
        return data;
      }
    }
    return data;
  }]
});

export default boot(({ app, redirect }) => {
  // Check if interceptors are already set up
  const isServer = process.env.SERVER;
  if (!isServer) {
    api.interceptors.request.use(async (config) => {
      config.headers['Accept-Language'] = Cookies.get(LocaleKey);
      const token = Cookies.get(AppAuthTokenKey);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    }, (error) => {
      return Promise.reject(error);
    });
    api.interceptors.response.use((response) => {
      return response;
    }, async (error) => {
      const originalRequest = error?.config;
      const status = error?.response?.status;
      if (
        status === 401 &&
        originalRequest &&
        !originalRequest._retry &&
        isOidcConfigured()
      ) {
        originalRequest._retry = true;
        // oidc-client-ts renews via refresh_token when present, otherwise throws
        const renewed = await signInSilent();
        if (renewed) {
          const token = Cookies.get(AppAuthTokenKey);
          if (token) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return api(originalRequest);
        }
        // session gone - back to login (IdP redirects straight to Zitadel)
        syncAuthSession(null);
        redirect({ path: '/auth/login' });
      }
      return Promise.reject(error);
    });
  }
  app.config.globalProperties.$axios = axios;
  app.config.globalProperties.$api = api;
});

export { api };

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAxios } from './useAxios';

const { apiMock, appToast, appLoading } = vi.hoisted(() => ({
  apiMock: vi.fn(),
  appToast: vi.fn(),
  appLoading: vi.fn(),
}));

vi.mock('boot/axios', () => ({
  api: Object.assign(apiMock, {
    defaults: {
      headers: {} as Record<string, unknown>,
      baseURL: '',
      responseType: 'json' as const,
    },
  }),
}));

vi.mock('@/composables/useBase', () => ({
  useBase: () => ({
    appToast,
    appLoading,
    isDevMode: () => false,
  }),
}));

vi.mock('@/composables/useLang', () => ({
  useLang: () => ({ locale: { value: 'en' } }),
}));

vi.mock('quasar', () => ({
  Cookies: {
    get: vi.fn(() => 'token-abc'),
    parseSSR: vi.fn(),
  },
}));

const ok = <T>(data: T) => Promise.resolve({ status: 200, data });

describe('useAxios callAxios', () => {
  beforeEach(() => {
    apiMock.mockReset();
    appToast.mockReset();
    appLoading.mockReset();
  });

  it('resolves plain payloads without toasting', async () => {
    apiMock.mockReturnValue(ok({ id: 'a' }));
    const res = await useAxios().callAxios<{ id: string }>({ API: '/x', method: 'GET' });
    expect(res).toEqual({ id: 'a' });
    expect(appToast).not.toHaveBeenCalled();
  });

  it('toasts FastAPI string detail on request failure', async () => {
    apiMock.mockReturnValue(
      Promise.reject({ response: { status: 400, data: { detail: 'Stream not found' } } })
    );
    await expect(useAxios().callAxios({ API: '/x', method: 'GET' })).rejects.toBeDefined();
    expect(appToast).toHaveBeenCalledTimes(1);
    expect(appToast).toHaveBeenCalledWith(
      expect.stringContaining('Stream not found'),
      expect.anything()
    );
  });

  it('joins FastAPI validation-error arrays into one toast', async () => {
    apiMock.mockReturnValue(
      Promise.reject({
        response: {
          status: 422,
          data: { detail: [{ msg: 'Field required' }, { msg: 'Invalid uuid' }] },
        },
      })
    );
    await expect(useAxios().callAxios({ API: '/x', method: 'POST', body: {} })).rejects.toBeDefined();
    expect(appToast).toHaveBeenCalledWith(
      expect.stringContaining('Field required'),
      expect.anything()
    );
    expect(appToast).toHaveBeenCalledWith(
      expect.stringContaining('Invalid uuid'),
      expect.anything()
    );
  });

  it('toasts AppException payloads', async () => {
    apiMock.mockReturnValue(
      ok({
        status: 'ERR_TRANSER',
        message: 'Insufficient credits',
        errors: ['balance too low'],
        timestamp: new Date().toISOString(),
      })
    );
    const res = await useAxios().callAxios({ API: '/credits/transfer', method: 'POST' });
    expect(res).toBeNull();
    expect(appToast).toHaveBeenCalledWith(
      expect.stringContaining('Insufficient credits'),
      expect.anything()
    );
    expect(appToast).toHaveBeenCalledWith(
      expect.stringContaining('balance too low'),
      expect.anything()
    );
  });

  it('skips toasting on 401 responses', async () => {
    apiMock.mockReturnValue(
      Promise.resolve({ status: 401, data: { detail: 'Not authenticated' } })
    );
    await useAxios().callAxios({ API: '/x', method: 'GET' });
    expect(appToast).not.toHaveBeenCalled();
  });

  it('toasts FastAPI detail on rejected requests and rethrows', async () => {
    apiMock.mockReturnValue(
      Promise.reject({ response: { status: 500, data: { detail: 'kaboom' } } })
    );
    await expect(useAxios().callAxios({ API: '/x', method: 'GET' })).rejects.toBeDefined();
    expect(appToast).toHaveBeenCalledWith(
      expect.stringContaining('kaboom'),
      expect.anything()
    );
  });
});

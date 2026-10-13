import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Cookies } from 'quasar';
import { decodeJWT } from '@/utils/jwtUtil';
import requireAuth from './requireAuth';

vi.mock('quasar', () => ({
  Cookies: {
    get: vi.fn(),
    parseSSR: vi.fn(),
  },
}));

vi.mock('quasar/wrappers', () => ({
  boot: (fn: unknown) => fn,
}));

vi.mock('@/utils/jwtUtil', () => ({
  decodeJWT: vi.fn(),
}));

type GuardFn = (
  to: { meta: Record<string, unknown> },
  from: unknown,
  next: (to?: unknown) => void
) => Promise<void>;

let guard: GuardFn | undefined;

const setup = requireAuth as unknown as (ctx: {
  router: { beforeEach: (g: GuardFn) => void };
  ssrContext: unknown;
}) => void;

setup({
  router: {
    beforeEach: (g) => {
      guard = g;
    },
  },
  ssrContext: null,
});

const runGuard = async (to: { meta: Record<string, unknown> }): Promise<unknown[]> => {
  const next = vi.fn();
  await guard!(to, {}, next);
  return next.mock.calls[0] ?? [];
};

describe('requireAuth guard', () => {
  beforeEach(() => {
    vi.mocked(Cookies.get).mockReset();
    vi.mocked(decodeJWT).mockReset();
  });

  it('passes through routes without requireAuth', async () => {
    const args = await runGuard({ meta: {} });
    expect(args).toEqual([]);
  });

  it('allows requireAuth routes with a valid unexpired token', async () => {
    vi.mocked(Cookies.get).mockReturnValue('valid.jwt.token');
    vi.mocked(decodeJWT).mockResolvedValue({ exp: Math.floor(Date.now() / 1000) + 3600 });
    const args = await runGuard({ meta: { requireAuth: true } });
    expect(args).toEqual([]);
  });

  it('redirects requireAuth routes when the token is expired', async () => {
    vi.mocked(Cookies.get).mockReturnValue('expired.jwt.token');
    vi.mocked(decodeJWT).mockResolvedValue({ exp: Math.floor(Date.now() / 1000) - 3600 });
    const args = await runGuard({ meta: { requireAuth: true } });
    expect(args).toEqual([{ path: '/auth/login', replace: true }]);
  });

  it('redirects requireAuth routes when no token cookie exists', async () => {
    const args = await runGuard({ meta: { requireAuth: true } });
    expect(args).toEqual([{ path: '/auth/login', replace: true }]);
    expect(decodeJWT).not.toHaveBeenCalled();
  });

  it('redirects requireAuth routes when the token cannot be decoded', async () => {
    vi.mocked(Cookies.get).mockReturnValue('garbage');
    vi.mocked(decodeJWT).mockRejectedValue(new Error('InvalidTokenFormat'));
    const args = await runGuard({ meta: { requireAuth: true } });
    expect(args).toEqual([{ path: '/auth/login', replace: true }]);
  });
});

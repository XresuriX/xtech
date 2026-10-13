import ActivityService from './ActivityService';
import MemberService from './MemberService';
import NotificationService from './NotificationService';
import OrgService from './OrgService';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { callAxios } = vi.hoisted(() => ({ callAxios: vi.fn() }));

vi.mock('@/composables/useAxios', () => ({
  useAxios: () => ({ callAxios }),
}));

describe('org service', () => {
  beforeEach(() => {
    callAxios.mockReset();
  });

  it('me() calls GET /api/v1/organizations/me', async () => {
    callAxios.mockResolvedValue({ id: 'org-1' });
    const res = await OrgService().me();
    expect(callAxios).toHaveBeenCalledWith({ API: '/api/v1/organizations/me', method: 'GET' });
    expect(res).toEqual({ id: 'org-1' });
  });

  it('update() PATCHes the org uuid path', async () => {
    callAxios.mockResolvedValue(null);
    await OrgService().update('org-uuid', { name: 'New name' });
    expect(callAxios).toHaveBeenCalledWith({
      API: '/api/v1/organizations/org-uuid',
      method: 'PATCH',
      body: { name: 'New name' },
    });
  });

  it('create() POSTs the body', async () => {
    callAxios.mockResolvedValue(null);
    await OrgService().create({ name: 'Acme', domain: 'acme.test' });
    expect(callAxios).toHaveBeenCalledWith({
      API: '/api/v1/organizations',
      method: 'POST',
      body: { name: 'Acme', domain: 'acme.test' },
    });
  });
});

describe('member service', () => {
  beforeEach(() => {
    callAxios.mockReset();
  });

  it('list() returns bare array path', async () => {
    callAxios.mockResolvedValue([]);
    await MemberService().list('org-uuid');
    expect(callAxios).toHaveBeenCalledWith({
      API: '/api/v1/organizations/org-uuid/members',
      method: 'GET',
    });
  });

  it('updateRole() PATCHes member id under org', async () => {
    callAxios.mockResolvedValue(null);
    await MemberService().updateRole('org-uuid', 'member-1', { role: 'admin' });
    expect(callAxios).toHaveBeenCalledWith({
      API: '/api/v1/organizations/org-uuid/members/member-1',
      method: 'PATCH',
      body: { role: 'admin' },
    });
  });

  it('remove() DELETEs member id under org', async () => {
    callAxios.mockResolvedValue(null);
    await MemberService().remove('org-uuid', 'member-1');
    expect(callAxios).toHaveBeenCalledWith({
      API: '/api/v1/organizations/org-uuid/members/member-1',
      method: 'DELETE',
    });
  });
});

describe('activity service', () => {
  beforeEach(() => {
    callAxios.mockReset();
  });

  it('list() builds limit/offset query and skips empty values', async () => {
    callAxios.mockResolvedValue([]);
    await ActivityService().list({ limit: 20, offset: 40, junk: undefined });
    expect(callAxios).toHaveBeenCalledWith({
      API: '/api/v1/activities?limit=20&offset=40',
      method: 'GET',
    });
  });

  it('list() omits query string without params', async () => {
    callAxios.mockResolvedValue([]);
    await ActivityService().list();
    expect(callAxios).toHaveBeenCalledWith({
      API: '/api/v1/activities',
      method: 'GET',
    });
  });
});

describe('notification service', () => {
  beforeEach(() => {
    callAxios.mockReset();
  });

  it('inbox() passes include_read flag', async () => {
    callAxios.mockResolvedValue([]);
    await NotificationService().inbox({ include_read: true, limit: 50 });
    expect(callAxios).toHaveBeenCalledWith({
      API: '/api/v1/notifications/inbox?include_read=true&limit=50',
      method: 'GET',
    });
  });

  it('markRead() posts ids, null when empty (mark all)', async () => {
    callAxios.mockResolvedValue({ marked: 3 });
    await NotificationService().markRead([]);
    expect(callAxios).toHaveBeenCalledWith({
      API: '/api/v1/notifications/mark-read',
      method: 'POST',
      body: { ids: null },
    });
  });

  it('send() posts custom notification payload', async () => {
    callAxios.mockResolvedValue(null);
    await NotificationService().send({ recipient_id: 'u1', title: 't', body: 'b' });
    expect(callAxios).toHaveBeenCalledWith({
      API: '/api/v1/notifications/send',
      method: 'POST',
      body: { recipient_id: 'u1', title: 't', body: 'b' },
    });
  });
});

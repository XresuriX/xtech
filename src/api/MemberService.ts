import { useAxios } from '@/composables/useAxios';
import type { MemberAdd, MemberOut, MemberRoleUpdate } from './OrgService';

// Mirrors xt-plat /api/v1/organizations/{org_id}/members (admin-gated backend-side)
export default () => {
  const { callAxios } = useAxios();

  const list = async (orgId: string): Promise<MemberOut[] | null> => {
    return await callAxios<MemberOut[]>({
      API: `/api/v1/organizations/${orgId}/members`,
      method: 'GET',
    });
  };
  const add = async (orgId: string, body: MemberAdd): Promise<MemberOut | null> => {
    return await callAxios<MemberOut>({
      API: `/api/v1/organizations/${orgId}/members`,
      method: 'POST',
      body,
    });
  };
  const updateRole = async (
    orgId: string,
    memberId: string,
    body: MemberRoleUpdate
  ): Promise<MemberOut | null> => {
    return await callAxios<MemberOut>({
      API: `/api/v1/organizations/${orgId}/members/${memberId}`,
      method: 'PATCH',
      body,
    });
  };
  const remove = async (orgId: string, memberId: string): Promise<void> => {
    await callAxios<unknown>({
      API: `/api/v1/organizations/${orgId}/members/${memberId}`,
      method: 'DELETE',
    });
  };

  return {
    list,
    add,
    updateRole,
    remove,
  };
};

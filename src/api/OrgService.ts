import { useAxios } from '@/composables/useAxios';

// Mirrors xt-plat src/domains/organizations/schemas.py
export type OrganizationPlan = 'free' | 'pro' | 'enterprise' | 'xt';
export type MemberRole = 'owner' | 'admin' | 'member' | 'viewer';

export interface OrganizationCreate {
  name: string;
  domain: string;
  plan?: OrganizationPlan;
}
export interface OrganizationUpdate {
  name?: string | null;
  slug?: string | null;
  plan?: OrganizationPlan | null;
  settings?: Record<string, unknown> | null;
}
export interface OrganizationOut {
  id: string;
  name: string;
  domain: string;
  slug: string;
  plan: string;
  is_active: boolean;
  created_at: string;
}
export interface MemberOut {
  id: string;
  user_id: string;
  role: string;
  joined_at: string;
}
export interface OrganizationDetailOut extends OrganizationOut {
  owner_id: string;
  members: MemberOut[];
}
export interface MemberAdd {
  user_id: string;
  role?: MemberRole;
}
export interface MemberRoleUpdate {
  role: MemberRole;
}

export default () => {
  const { callAxios } = useAxios();

  const me = async (): Promise<OrganizationDetailOut | null> => {
    return await callAxios<OrganizationDetailOut>({
      API: '/api/v1/organizations/me',
      method: 'GET',
    });
  };
  const create = async (body: OrganizationCreate): Promise<OrganizationOut | null> => {
    return await callAxios<OrganizationOut>({
      API: '/api/v1/organizations',
      method: 'POST',
      body,
    });
  };
  const get = async (orgId: string): Promise<OrganizationOut | null> => {
    return await callAxios<OrganizationOut>({
      API: `/api/v1/organizations/${orgId}`,
      method: 'GET',
    });
  };
  const update = async (
    orgId: string,
    body: OrganizationUpdate
  ): Promise<OrganizationDetailOut | null> => {
    return await callAxios<OrganizationDetailOut>({
      API: `/api/v1/organizations/${orgId}`,
      method: 'PATCH',
      body,
    });
  };
  const remove = async (orgId: string): Promise<void> => {
    await callAxios<unknown>({
      API: `/api/v1/organizations/${orgId}`,
      method: 'DELETE',
    });
  };
  const getByDomain = async (domain: string): Promise<OrganizationOut | null> => {
    return await callAxios<OrganizationOut>({
      API: `/api/v1/organizations/${domain}`,
      method: 'GET',
    });
  };

  return {
    me,
    create,
    get,
    update,
    remove,
    getByDomain,
  };
};

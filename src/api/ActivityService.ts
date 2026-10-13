import { useAxios } from '@/composables/useAxios';
import { buildQuery } from '@/libs/query';
import type { QueryParams } from '@/libs/query';

// Mirrors xt-plat src/domains/activities/schemas.py
export interface ActivityOut {
  id: string;
  actor_type: string;
  actor_id: string;
  actor_display: string;
  verb: string;
  target_type: string | null;
  target_id: string | null;
  target_display: string | null;
  action_object_type: string | null;
  action_object_id: string | null;
  action_object_display: string | null;
  data: Record<string, unknown>;
  level: string;
  public: boolean;
  description: string;
  emitted_at: string;
}

export interface ActivityListParams extends QueryParams {
  limit?: number;
  offset?: number;
}

export default () => {
  const { callAxios } = useAxios();

  const list = async (params?: ActivityListParams): Promise<ActivityOut[] | null> => {
    return await callAxios<ActivityOut[]>({
      API: `/api/v1/activities${buildQuery(params ?? {})}`,
      method: 'GET',
    });
  };

  return {
    list,
  };
};

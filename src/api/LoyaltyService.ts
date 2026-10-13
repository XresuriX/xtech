import { useAxios } from '@/composables/useAxios';
import { buildQuery } from '@/libs/query';
import type { QueryParams } from '@/libs/query';

// Mirrors xt-plat src/domains/gamification/schemas_custom.py (B2B2C loyalty)
export interface CustomRuleCreate {
  name: string;
  description?: string;
  verb: string;
  points?: number;
  badge_code?: string | null;
  badge_name?: string | null;
  badge_description?: string | null;
  conditions?: Record<string, unknown>;
  cooldown_seconds?: number;
  max_awards_per_user?: number | null;
  is_active?: boolean;
}
export type CustomRuleUpdate = Partial<CustomRuleCreate>;
export interface CustomRuleOut {
  id: string;
  name: string;
  description: string;
  verb: string;
  points: number;
  badge_code: string | null;
  badge_name: string | null;
  badge_description: string | null;
  conditions: Record<string, unknown>;
  cooldown_seconds: number;
  max_awards_per_user: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
export interface TaskCreate {
  title: string;
  description?: string;
  points_reward?: number;
  badge_code?: string | null;
  credits_reward?: number;
  metadata?: Record<string, unknown>;
  is_active?: boolean;
}
export type TaskUpdate = Partial<TaskCreate>;
export interface TaskOut {
  id: string;
  title: string;
  description: string;
  points_reward: number;
  badge_code: string | null;
  credits_reward: number;
  metadata: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
export interface TaskCompletionOut {
  id: string;
  task_id: string;
  user_id: string;
  status: string;
  points_awarded: number;
  credits_awarded: number;
  badge_awarded: boolean;
  completed_at: string | null;
  created_at: string;
}
export interface CampaignCreate {
  title: string;
  description?: string;
  starts_at?: string | null;
  ends_at?: string | null;
  bonus_points?: number;
  bonus_credits?: number;
  bonus_badge_code?: string | null;
  bonus_badge_name?: string | null;
  metadata?: Record<string, unknown>;
  task_ids?: string[];
}
export interface CampaignUpdate extends Partial<CampaignCreate> {
  status?: 'draft' | 'active' | 'completed' | 'cancelled' | null;
}
export interface CampaignTaskOut {
  task_id: string;
  title: string;
  sort_order: number;
  completed: boolean;
}
export interface CampaignProgressOut {
  total_tasks: number;
  completed_tasks: number;
  all_completed: boolean;
}
export interface CampaignOut {
  id: string;
  title: string;
  description: string;
  status: string;
  starts_at: string | null;
  ends_at: string | null;
  bonus_points: number;
  bonus_credits: number;
  bonus_badge_code: string | null;
  bonus_badge_name: string | null;
  metadata: Record<string, unknown>;
  tasks: CampaignTaskOut[];
  progress?: CampaignProgressOut | null;
  created_at: string;
  updated_at: string;
}
export interface LoyaltyListParams extends QueryParams {
  include_inactive?: boolean;
}

export default () => {
  const { callAxios } = useAxios();

  // --- rules ---
  const listRules = async (params?: LoyaltyListParams): Promise<CustomRuleOut[] | null> => {
    return await callAxios<CustomRuleOut[]>({
      API: `/api/v1/gamification/rules${buildQuery(params ?? {})}`,
      method: 'GET',
    });
  };
  const getRule = async (ruleId: string): Promise<CustomRuleOut | null> => {
    return await callAxios<CustomRuleOut>({
      API: `/api/v1/gamification/rules/${ruleId}`,
      method: 'GET',
    });
  };
  const createRule = async (body: CustomRuleCreate): Promise<CustomRuleOut | null> => {
    return await callAxios<CustomRuleOut>({
      API: '/api/v1/gamification/rules',
      method: 'POST',
      body,
    });
  };
  const updateRule = async (ruleId: string, body: CustomRuleUpdate): Promise<CustomRuleOut | null> => {
    return await callAxios<CustomRuleOut>({
      API: `/api/v1/gamification/rules/${ruleId}`,
      method: 'PATCH',
      body,
    });
  };
  const removeRule = async (ruleId: string): Promise<void> => {
    await callAxios<unknown>({ API: `/api/v1/gamification/rules/${ruleId}`, method: 'DELETE' });
  };

  // --- tasks ---
  // NOTE drift §3: my-completions is registered after /tasks/{task_id} on the backend
  // and gets swallowed (422) until xt-plat fixes registration order.
  const listTasks = async (params?: LoyaltyListParams): Promise<TaskOut[] | null> => {
    return await callAxios<TaskOut[]>({
      API: `/api/v1/tasks${buildQuery(params ?? {})}`,
      method: 'GET',
    });
  };
  const getTask = async (taskId: string): Promise<TaskOut | null> => {
    return await callAxios<TaskOut>({ API: `/api/v1/tasks/${taskId}`, method: 'GET' });
  };
  const createTask = async (body: TaskCreate): Promise<TaskOut | null> => {
    return await callAxios<TaskOut>({ API: '/api/v1/tasks', method: 'POST', body });
  };
  const updateTask = async (taskId: string, body: TaskUpdate): Promise<TaskOut | null> => {
    return await callAxios<TaskOut>({ API: `/api/v1/tasks/${taskId}`, method: 'PATCH', body });
  };
  const removeTask = async (taskId: string): Promise<void> => {
    await callAxios<unknown>({ API: `/api/v1/tasks/${taskId}`, method: 'DELETE' });
  };
  const completeTask = async (taskId: string): Promise<TaskCompletionOut | null> => {
    return await callAxios<TaskCompletionOut>({
      API: '/api/v1/tasks/complete',
      method: 'POST',
      body: { task_id: taskId },
    });
  };
  const myCompletions = async (limit = 50): Promise<TaskCompletionOut[] | null> => {
    return await callAxios<TaskCompletionOut[]>({
      API: `/api/v1/tasks/my-completions${buildQuery({ limit })}`,
      method: 'GET',
    });
  };

  // --- campaigns ---
  const listCampaigns = async (): Promise<CampaignOut[] | null> => {
    return await callAxios<CampaignOut[]>({ API: '/api/v1/campaigns', method: 'GET' });
  };
  const getCampaign = async (campaignId: string): Promise<CampaignOut | null> => {
    return await callAxios<CampaignOut>({ API: `/api/v1/campaigns/${campaignId}`, method: 'GET' });
  };
  const createCampaign = async (body: CampaignCreate): Promise<CampaignOut | null> => {
    return await callAxios<CampaignOut>({ API: '/api/v1/campaigns', method: 'POST', body });
  };
  const updateCampaign = async (
    campaignId: string,
    body: CampaignUpdate
  ): Promise<CampaignOut | null> => {
    return await callAxios<CampaignOut>({
      API: `/api/v1/campaigns/${campaignId}`,
      method: 'PATCH',
      body,
    });
  };
  const removeCampaign = async (campaignId: string): Promise<void> => {
    await callAxios<unknown>({ API: `/api/v1/campaigns/${campaignId}`, method: 'DELETE' });
  };
  const campaignProgress = async (campaignId: string): Promise<CampaignProgressOut | null> => {
    return await callAxios<CampaignProgressOut>({
      API: `/api/v1/campaigns/${campaignId}/progress`,
      method: 'GET',
    });
  };

  return {
    listRules,
    getRule,
    createRule,
    updateRule,
    removeRule,
    listTasks,
    getTask,
    createTask,
    updateTask,
    removeTask,
    completeTask,
    myCompletions,
    listCampaigns,
    getCampaign,
    createCampaign,
    updateCampaign,
    removeCampaign,
    campaignProgress,
  };
};

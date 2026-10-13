import { useAxios } from '@/composables/useAxios';
import { buildQuery } from '@/libs/query';
import type { QueryParams } from '@/libs/query';

// Mirrors xt-plat src/domains/gamification/api.py schemas
export interface PointsOut {
  user_id: string;
  total: number;
}
export interface BadgeOut {
  badge_code: string;
  badge_name: string;
  description: string;
  earned_at?: unknown;
}
export interface LeaderboardRow {
  rank: number;
  user_id: string;
  user_display: string;
  total_points: number;
}
export interface WalletOut {
  user_id: string;
  balance: number;
  reserved: number;
}
export interface TransferRequest {
  recipient_id: string;
  amount: number;
  note?: string;
}
export interface TransferOut {
  id?: unknown;
  amount: number;
  sender_id?: string | null;
  recipient_id: string;
  kind: string;
}
export interface LeaderboardParams extends QueryParams {
  limit?: number;
}

export default () => {
  const { callAxios } = useAxios();

  const points = async (): Promise<PointsOut | null> => {
    return await callAxios<PointsOut>({ API: '/api/v1/points', method: 'GET' });
  };
  const badges = async (): Promise<BadgeOut[] | null> => {
    return await callAxios<BadgeOut[]>({ API: '/api/v1/badges', method: 'GET' });
  };
  const leaderboard = async (params?: LeaderboardParams): Promise<LeaderboardRow[] | null> => {
    return await callAxios<LeaderboardRow[]>({
      API: `/api/v1/leaderboard${buildQuery(params ?? { limit: 50 })}`,
      method: 'GET',
    });
  };
  const wallet = async (): Promise<WalletOut | null> => {
    return await callAxios<WalletOut>({ API: '/api/v1/wallet', method: 'GET' });
  };
  // 402 on insufficient funds -> FastAPI {detail} toast (useAxios)
  const transfer = async (body: TransferRequest): Promise<TransferOut | null> => {
    return await callAxios<TransferOut>({
      API: '/api/v1/credits/transfer',
      method: 'POST',
      body,
    });
  };

  return {
    points,
    badges,
    leaderboard,
    wallet,
    transfer,
  };
};

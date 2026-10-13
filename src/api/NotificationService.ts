import { useAxios } from '@/composables/useAxios';
import { buildQuery } from '@/libs/query';
import type { QueryParams } from '@/libs/query';

// Mirrors xt-plat src/domains/activities schemas (inbox) + src/domains/notifications (custom send)
export interface NotificationOut {
  id: string;
  activity_id: string;
  recipient_id: string;
  unread: boolean;
  read_at: string | null;
  actor_display: string;
  verb: string;
  description: string;
  data: Record<string, unknown>;
  created_at: string;
}
export interface MarkReadResponse {
  marked: number;
}
export interface CustomNotificationSend {
  recipient_id: string;
  title: string;
  body: string;
  action_url?: string | null;
  metadata?: Record<string, unknown>;
}
export interface CustomNotificationBroadcast {
  recipient_ids: string[];
  title: string;
  body: string;
  action_url?: string | null;
  metadata?: Record<string, unknown>;
}
export interface CustomNotificationOut {
  id: string;
  sender_id: string;
  recipient_id: string;
  title: string;
  body: string;
  action_url: string | null;
  metadata: Record<string, unknown>;
  unread: boolean;
  read_at: string | null;
  created_at: string;
}
export interface InboxParams extends QueryParams {
  include_read?: boolean;
  limit?: number;
  offset?: number;
}

export default () => {
  const { callAxios } = useAxios();

  const inbox = async (params?: InboxParams): Promise<NotificationOut[] | null> => {
    return await callAxios<NotificationOut[]>({
      API: `/api/v1/notifications/inbox${buildQuery(params ?? {})}`,
      method: 'GET',
    });
  };
  // ids null/empty = mark all read
  const markRead = async (ids?: string[] | null): Promise<MarkReadResponse | null> => {
    return await callAxios<MarkReadResponse>({
      API: '/api/v1/notifications/mark-read',
      method: 'POST',
      body: { ids: ids && ids.length > 0 ? ids : null },
    });
  };
  const send = async (body: CustomNotificationSend): Promise<CustomNotificationOut | null> => {
    return await callAxios<CustomNotificationOut>({
      API: '/api/v1/notifications/send',
      method: 'POST',
      body,
    });
  };
  const broadcast = async (
    body: CustomNotificationBroadcast
  ): Promise<CustomNotificationOut[] | null> => {
    return await callAxios<CustomNotificationOut[]>({
      API: '/api/v1/notifications/broadcast',
      method: 'POST',
      body,
    });
  };

  return {
    inbox,
    markRead,
    send,
    broadcast,
  };
};

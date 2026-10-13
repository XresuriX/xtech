import { useAxios } from '@/composables/useAxios';
import { buildQuery } from '@/libs/query';
import type { QueryParams } from '@/libs/query';
import type { SyncTokenOut } from './CatalogueService';

// Mirrors xt-plat src/domains/conferences/api.py schemas
export interface ConferenceCreate {
  title: string;
  max_participants?: number;
  layout?: 'grid' | 'speaker' | 'presentation';
}
export interface ConferenceUpdate {
  title?: string | null;
  max_participants?: number | null;
  layout?: 'grid' | 'speaker' | 'presentation' | null;
}
export interface ConferenceOut {
  id: string;
  title: string;
  oryx_room_id: string;
  signaling_url: string;
  join_url: string;
  max_participants: number;
  layout: string;
  moq_signaling_url?: string | null;
}
export interface MuteOut {
  ok: boolean;
  participant_id: string;
  [key: string]: unknown;
}
export interface ConferenceListParams extends QueryParams {
  limit?: number;
  offset?: number;
}

export default () => {
  const { callAxios } = useAxios();

  const list = async (params?: ConferenceListParams): Promise<ConferenceOut[] | null> => {
    return await callAxios<ConferenceOut[]>({
      API: `/api/v1/conferences${buildQuery(params ?? {})}`,
      method: 'GET',
    });
  };
  const get = async (roomId: string): Promise<ConferenceOut | null> => {
    return await callAxios<ConferenceOut>({
      API: `/api/v1/conferences/${roomId}`,
      method: 'GET',
    });
  };
  const create = async (body: ConferenceCreate): Promise<ConferenceOut | null> => {
    return await callAxios<ConferenceOut>({
      API: '/api/v1/conferences',
      method: 'POST',
      body,
    });
  };
  const update = async (roomId: string, body: ConferenceUpdate): Promise<ConferenceOut | null> => {
    return await callAxios<ConferenceOut>({
      API: `/api/v1/conferences/${roomId}`,
      method: 'PATCH',
      body,
    });
  };
  const remove = async (roomId: string): Promise<void> => {
    await callAxios<unknown>({ API: `/api/v1/conferences/${roomId}`, method: 'DELETE' });
  };
  const syncToken = async (roomId: string): Promise<SyncTokenOut | null> => {
    return await callAxios<SyncTokenOut>({
      API: `/api/v1/conferences/${roomId}/sync-token`,
      method: 'POST',
    });
  };
  const mute = async (roomId: string, participantId: string, muted: boolean): Promise<MuteOut | null> => {
    return await callAxios<MuteOut>({
      API: `/api/v1/conferences/${roomId}/participants/${participantId}/mute`,
      method: 'POST',
      body: { muted },
    });
  };

  return {
    list,
    get,
    create,
    update,
    remove,
    syncToken,
    mute,
  };
};

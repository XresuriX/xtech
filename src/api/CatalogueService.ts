import { useAxios } from '@/composables/useAxios';
import { buildQuery } from '@/libs/query';
import type { QueryParams } from '@/libs/query';

// Mirrors xt-plat src/domains/catalogue/schemas.py
export interface StreamCreate {
  title: string;
  description?: string;
  enable_recording?: boolean;
  enable_transcoding?: boolean;
  max_duration_seconds?: number;
  category_id?: string | null;
  tags?: string[];
  scheduled_at?: string | null;
}
export interface StreamUpdate {
  title?: string | null;
  description?: string | null;
  category_id?: string | null;
  tags?: string[] | null;
  thumbnail_url?: string | null;
  visibility?: 'public' | 'private' | null;
  required_role?: string | null;
  reward_points?: number | null;
  required_credits?: number | null;
  scheduled_at?: string | null;
}
export interface StreamPlaybackUrls {
  hls_url: string;
  webrtc_url: string;
  moq_url?: string | null;
  moq_quic_url?: string | null;
  moq_ws_url?: string | null;
  transcoded_url?: string | null;
}
export interface StreamCreateOut {
  id: string;
  title: string;
  description: string;
  content_type: string;
  status: string;
  mediamtx_path: string | null;
  playback_url: string | null;
  ingest_url: string | null;
  whip_url: string | null;
  srt_url?: string | null;
  tags: string[];
  visibility: string;
  scheduled_at: string | null;
  created_at: string;
  moq_enabled: boolean;
  playback?: StreamPlaybackUrls | null;
}
// Drift §4: code shape, NOT the docs' {urls:{...}}
export interface SyncTokenOut {
  token: string;
  sync_token: string;
  ws_sync_url: string;
  expires_in: number;
  scope_type: string;
  scope_id: string;
  role: string;
  permissions: string[];
}
export interface RestreamTarget {
  name: string;
  url: string;
  enabled?: boolean;
}
export interface RestreamTargetsOut {
  path: string;
  targets: RestreamTarget[];
}
export interface RecordingItem {
  name: string;
  size_bytes: number;
  modified_at: number;
}
export interface RecordingsOut {
  items: RecordingItem[];
}
export interface RecordingToggle {
  enabled: boolean;
}
export interface TelemetryOut {
  path?: string | null;
  live: boolean;
  publishers: number;
  readers: number;
  bytes_in: number;
  bytes_out: number;
}
export interface CatalogueListParams extends QueryParams {
  content_type?: string;
  status_filter?: string;
  limit?: number;
  offset?: number;
}

export default () => {
  const { callAxios } = useAxios();

  const list = async (params?: CatalogueListParams): Promise<StreamCreateOut[] | null> => {
    return await callAxios<StreamCreateOut[]>({
      API: `/api/v1/catalogue${buildQuery(params ?? {})}`,
      method: 'GET',
    });
  };
  const get = async (itemId: string): Promise<StreamCreateOut | null> => {
    return await callAxios<StreamCreateOut>({
      API: `/api/v1/catalogue/${itemId}`,
      method: 'GET',
    });
  };
  const create = async (body: StreamCreate): Promise<StreamCreateOut | null> => {
    return await callAxios<StreamCreateOut>({
      API: '/api/v1/catalogue/streams',
      method: 'POST',
      body,
    });
  };
  const update = async (itemId: string, body: StreamUpdate): Promise<StreamCreateOut | null> => {
    return await callAxios<StreamCreateOut>({
      API: `/api/v1/catalogue/${itemId}`,
      method: 'PATCH',
      body,
    });
  };
  const remove = async (itemId: string): Promise<void> => {
    await callAxios<unknown>({ API: `/api/v1/catalogue/${itemId}`, method: 'DELETE' });
  };
  const syncToken = async (itemId: string): Promise<SyncTokenOut | null> => {
    return await callAxios<SyncTokenOut>({
      API: `/api/v1/catalogue/streams/${itemId}/sync-token`,
      method: 'POST',
    });
  };
  const getRestreamTargets = async (itemId: string): Promise<RestreamTargetsOut | null> => {
    return await callAxios<RestreamTargetsOut>({
      API: `/api/v1/catalogue/streams/${itemId}/restream-targets`,
      method: 'GET',
    });
  };
  // Drift §5: bare JSON array body, NOT {targets:[...]}
  const setRestreamTargets = async (
    itemId: string,
    targets: RestreamTarget[]
  ): Promise<RestreamTargetsOut | null> => {
    return await callAxios<RestreamTargetsOut>({
      API: `/api/v1/catalogue/streams/${itemId}/restream-targets`,
      method: 'PUT',
      body: targets,
    });
  };
  const clearRestreamTargets = async (itemId: string): Promise<void> => {
    await callAxios<unknown>({
      API: `/api/v1/catalogue/streams/${itemId}/restream-targets`,
      method: 'DELETE',
    });
  };
  const recordings = async (itemId: string): Promise<RecordingsOut | null> => {
    return await callAxios<RecordingsOut>({
      API: `/api/v1/catalogue/streams/${itemId}/recordings`,
      method: 'GET',
    });
  };
  const deleteRecording = async (itemId: string, name: string): Promise<void> => {
    await callAxios<unknown>({
      API: `/api/v1/catalogue/streams/${itemId}/recordings/${encodeURIComponent(name)}`,
      method: 'DELETE',
    });
  };
  const toggleRecording = async (
    itemId: string,
    enabled: boolean
  ): Promise<RecordingToggle | null> => {
    return await callAxios<RecordingToggle>({
      API: `/api/v1/catalogue/streams/${itemId}/recording`,
      method: 'PUT',
      body: { enabled },
    });
  };
  const telemetry = async (itemId: string): Promise<TelemetryOut | null> => {
    return await callAxios<TelemetryOut>({
      API: `/api/v1/catalogue/streams/${itemId}/telemetry`,
      method: 'GET',
    });
  };

  return {
    list,
    get,
    create,
    update,
    remove,
    syncToken,
    getRestreamTargets,
    setRestreamTargets,
    clearRestreamTargets,
    recordings,
    deleteRecording,
    toggleRecording,
    telemetry,
  };
};

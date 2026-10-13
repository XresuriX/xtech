import { useAxios } from '@/composables/useAxios';
import type { OgMeta } from '@/types/models';

export default () => {
  const { callAxios } = useAxios();

  const health = async (): Promise<{ status?: string } | null> => {
    return await callAxios<{ status?: string }>({
      API: '/health',
      method: 'GET',
    });
  };

  // OG-meta endpoint does not exist on the backend (05 matrix: MISSING-BACKEND).
  // Stub returns null; consumers removed in Phase 6 cleanup.
  const getOgMeta = async (_link: string): Promise<OgMeta | null> => {
    return null;
  };

  return {
    health,
    getOgMeta,
  };
};

import NotificationService from '@/api/NotificationService';
import type { NotificationOut } from '@/api/NotificationService';
import { AppAuthTokenKey } from '@/libs/constant';
import { Cookies } from 'quasar';
import { computed, onBeforeUnmount, ref } from 'vue';

const PING_INTERVAL_MS = 30 * 1000;
const RECONNECT_MAX_MS = 30 * 1000;

/**
 * Platform notifications WS: `WS /ws/notifications?token=<zitadel-jwt>`
 * (xt-plat src/interfaces/websocket/notifications.py — ping/pong, close 4401 bad token).
 * Unread count is client-side from the inbox (05 matrix REWORK row).
 */
export const useNotificationsSocket = () => {
  const { inbox: fetchInbox, markRead: apiMarkRead } = NotificationService();
  const connected = ref(false);
  const notifications = ref<NotificationOut[]>([]);
  const inboxLoaded = ref(false);
  const unreadCount = computed(
    () => notifications.value.filter((item) => item.unread).length
  );

  let ws: WebSocket | null = null;
  let pingTimer: ReturnType<typeof setInterval> | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let stopped = false;
  let reconnectDelay = 1000;

  const teardownTimers = (): void => {
    if (pingTimer) {
      clearInterval(pingTimer);
      pingTimer = null;
    }
  };

  const connect = (): void => {
    if (process.env.SERVER || stopped || ws) {
      return;
    }
    const token = Cookies.get(AppAuthTokenKey);
    if (!token) {
      return;
    }
    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
    try {
      ws = new WebSocket(
        `${proto}://${window.location.host}/ws/notifications?token=${encodeURIComponent(token)}`
      );
    } catch {
      ws = null;
      return;
    }
    ws.onopen = () => {
      connected.value = true;
      reconnectDelay = 1000;
      pingTimer = setInterval(() => {
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ping' }));
        }
      }, PING_INTERVAL_MS);
    };
    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(String(event.data));
        const payload = message?.notification ?? message;
        if (payload && typeof payload === 'object' && 'id' in payload && 'recipient_id' in payload) {
          const item = payload as NotificationOut;
          const index = notifications.value.findIndex((n) => n.id === item.id);
          if (index >= 0) {
            notifications.value[index] = item;
          } else {
            notifications.value.unshift(item);
          }
        }
      } catch {
        // non-JSON frames (pong etc.) ignored
      }
    };
    ws.onclose = (event) => {
      connected.value = false;
      teardownTimers();
      ws = null;
      if (event.code === 4401) {
        // bad/expired token - do not reconnect; guard will re-login on next 401
        stopped = true;
        return;
      }
      if (!stopped) {
        reconnectTimer = setTimeout(connect, reconnectDelay);
        reconnectDelay = Math.min(reconnectDelay * 2, RECONNECT_MAX_MS);
      }
    };
    ws.onerror = () => {
      ws?.close();
    };
  };

  const disconnect = (): void => {
    stopped = true;
    teardownTimers();
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    ws?.close();
    ws = null;
    connected.value = false;
  };

  const loadInbox = async (includeRead = true): Promise<void> => {
    const res = await fetchInbox({ include_read: includeRead, limit: 50 });
    if (res) {
      notifications.value = res;
    }
    inboxLoaded.value = true;
  };

  const markRead = async (ids?: string[] | null): Promise<void> => {
    await apiMarkRead(ids ?? null);
    const now = new Date().toISOString();
    notifications.value = notifications.value.map((item) => {
      const hit = ids == null || ids.length === 0 || ids.includes(item.id);
      return hit ? { ...item, unread: false, read_at: now } : item;
    });
  };

  connect();

  onBeforeUnmount(disconnect);

  return {
    connected,
    notifications,
    inboxLoaded,
    unreadCount,
    connect,
    disconnect,
    loadInbox,
    markRead,
  };
};

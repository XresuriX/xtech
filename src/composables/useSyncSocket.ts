import { onBeforeUnmount, ref } from 'vue';

export interface SyncSocketOptions {
  /** Absolute ws_sync_url from POST .../sync-token; built from scope when omitted */
  wsSyncUrl?: string | null;
  /** sync_token (or playback token) from the sync-token response */
  token: string;
  scopeType?: string;
  scopeId?: string;
  deviceId?: string;
  deviceName?: string;
  autoReconnect?: boolean;
}

export interface SyncWelcome {
  scope_type: string;
  scope_id: string;
  member_id: string;
  device_id: string;
  members: Record<string, { devices: Record<string, unknown>; online: boolean }>;
  state: { updated_by: string; updated_at: string; seq: number; data: Record<string, unknown> } | null;
  transport: { updated_by: string; seq: number; state: { command: string; data: Record<string, unknown> } } | null;
  synced_at: string;
  server_time_ms: number;
}

/**
 * Media sync-engine WS: `WS /ws/sync/{scope_type}/{scope_id}?token=&device_id=&device_name=`
 * (xtc-media, API_CONTRACT.md §1b: welcome/presence/state/transport/chat/timesync, close 4401/4408).
 */
export const useSyncSocket = (options: SyncSocketOptions) => {
  const connected = ref(false);
  const closeCode = ref<number | null>(null);
  const welcome = ref<SyncWelcome | null>(null);
  const sharedState = ref<Record<string, unknown> | null>(null);
  const transportState = ref<{ command: string; data: Record<string, unknown> } | null>(null);
  const presenceEvent = ref<{ event: string; member_id: string } | null>(null);
  const lastError = ref<string | null>(null);
  const chatMessages = ref<{ sender_id: string; sender_name: string; text: string; ts: number }[]>([]);

  let ws: WebSocket | null = null;
  let pingTimer: ReturnType<typeof setInterval> | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let stopped = false;
  let reconnectDelay = 1000;

  const buildUrl = (): string | null => {
    let url = options.wsSyncUrl?.trim() || '';
    if (!url) {
      if (!options.scopeType || !options.scopeId) {
        return null;
      }
      const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
      url = `${proto}://${window.location.host}/ws/sync/${options.scopeType}/${options.scopeId}`;
    }
    const [base, query] = url.split('?');
    const params = new URLSearchParams(query ?? '');
    if (!params.has('token')) {
      params.set('token', options.token);
    }
    if (options.deviceId && !params.has('device_id')) {
      params.set('device_id', options.deviceId);
    }
    if (options.deviceName && !params.has('device_name')) {
      params.set('device_name', options.deviceName);
    }
    return `${base}?${params.toString()}`;
  };

  const send = (payload: Record<string, unknown>): boolean => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload));
      return true;
    }
    return false;
  };

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
    const url = buildUrl();
    if (!url) {
      return;
    }
    try {
      ws = new WebSocket(url);
    } catch {
      ws = null;
      return;
    }
    ws.onopen = () => {
      connected.value = true;
      closeCode.value = null;
      reconnectDelay = 1000;
      pingTimer = setInterval(send, 30 * 1000, { type: 'ping' });
    };
    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(String(event.data));
        switch (message?.type) {
          case 'welcome':
            welcome.value = message as SyncWelcome;
            if (message.state?.data) {
              sharedState.value = message.state.data;
            }
            if (message.transport?.state) {
              transportState.value = message.transport.state;
            }
            break;
          case 'state':
            sharedState.value = message.data ?? null;
            break;
          case 'transport':
            transportState.value = message.state ?? null;
            break;
          case 'presence':
            presenceEvent.value = { event: message.event, member_id: message.member_id };
            break;
          case 'chat:message':
            chatMessages.value.push(message.data);
            break;
          case 'error':
            lastError.value = String(message.message ?? 'sync error');
            break;
          default:
            break;
        }
      } catch {
        // ignore malformed frames
      }
    };
    ws.onclose = (event) => {
      connected.value = false;
      teardownTimers();
      ws = null;
      closeCode.value = event.code;
      if (event.code === 4401 || event.code === 4408) {
        // bad token / scope mismatch - do not reconnect
        stopped = true;
        return;
      }
      if (!stopped && options.autoReconnect !== false) {
        reconnectTimer = setTimeout(connect, reconnectDelay);
        reconnectDelay = Math.min(reconnectDelay * 2, 30 * 1000);
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

  const sendState = (data: Record<string, unknown>): boolean => send({ type: 'state', data });
  const sendTransport = (command: string, data: Record<string, unknown> = {}): boolean =>
    send({ type: 'transport', command, data });
  const sendChat = (text: string): boolean => send({ type: 'chat', data: { text } });
  const timesync = (): boolean => send({ type: 'timesync', t1: Date.now() });

  connect();

  onBeforeUnmount(disconnect);

  return {
    connected,
    closeCode,
    welcome,
    sharedState,
    transportState,
    presenceEvent,
    chatMessages,
    lastError,
    connect,
    disconnect,
    sendState,
    sendTransport,
    sendChat,
    timesync,
  };
};

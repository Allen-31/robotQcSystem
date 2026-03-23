export interface SocketMessage<T = unknown> {
  event: string;
  payload: T;
}

export interface WebSocketClientOptions {
  url?: string;
  reconnectIntervalMs?: number;
  reconnectMaxIntervalMs?: number;
  reconnectBackoffFactor?: number;
  reconnectJitterMs?: number;
  maxReconnectAttempts?: number;
  heartbeatIntervalMs?: number;
  heartbeatEvent?: string;
  onOpen?: () => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
  onMessage?: (message: SocketMessage) => void;
  onReconnect?: (retryCount: number) => void;
}

function resolveWsUrl(): string {
  const envWsUrl =
    typeof import.meta !== 'undefined' ? (import.meta as { env?: Record<string, string> }).env?.VITE_WS_BASE_URL?.trim() : '';
  if (envWsUrl) {
    return envWsUrl;
  }

  if (typeof window !== 'undefined' && window.location?.hostname) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.hostname}:8080/ws`;
  }

  return 'ws://localhost:8080/ws';
}

export class WebSocketBridgeClient {
  private ws: WebSocket | null = null;
  private reconnectTimer: number | null = null;
  private heartbeatTimer: number | null = null;
  private manualClose = false;
  private retryCount = 0;

  constructor(private readonly options: WebSocketClientOptions = {}) {}

  connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.manualClose = false;
    const url = this.options.url || resolveWsUrl();
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      this.retryCount = 0;
      this.clearReconnect();
      this.options.onOpen?.();
      this.startHeartbeat();
    };

    this.ws.onclose = (event) => {
      this.stopHeartbeat();
      this.options.onClose?.(event);
      this.ws = null;
      if (!this.manualClose) {
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = (event) => {
      this.options.onError?.(event);
    };

    this.ws.onmessage = (event) => {
      const parsed = this.parseMessage(event.data);
      if (parsed.event === 'heartbeat_ack') {
        this.options.onMessage?.(parsed);
        return;
      }
      this.options.onMessage?.(parsed);
    };
  }

  disconnect() {
    this.manualClose = true;
    this.clearReconnect();
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  send<T>(event: string, payload: T) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return false;
    }
    this.ws.send(JSON.stringify({ event, payload }));
    return true;
  }

  private parseMessage(data: unknown): SocketMessage {
    if (typeof data !== 'string') {
      return { event: 'raw', payload: data };
    }

    try {
      const parsed = JSON.parse(data) as Partial<SocketMessage>;
      if (typeof parsed.event === 'string') {
        return { event: parsed.event, payload: parsed.payload };
      }
      return { event: 'raw', payload: parsed };
    } catch {
      return { event: 'raw', payload: data };
    }
  }

  private scheduleReconnect() {
    const maxAttempts = this.options.maxReconnectAttempts ?? 10;
    if (this.retryCount >= maxAttempts) {
      return;
    }

    this.retryCount += 1;
    this.options.onReconnect?.(this.retryCount);

    const baseDelay = this.options.reconnectIntervalMs ?? 1_500;
    const maxDelay = this.options.reconnectMaxIntervalMs ?? 30_000;
    const factor = this.options.reconnectBackoffFactor ?? 1.8;
    const jitterMs = this.options.reconnectJitterMs ?? 300;

    const exponentialDelay = Math.min(baseDelay * Math.pow(factor, this.retryCount - 1), maxDelay);
    const jitter = Math.floor(Math.random() * Math.max(jitterMs, 0));
    const delay = Math.round(exponentialDelay + jitter);

    this.clearReconnect();
    this.reconnectTimer = window.setTimeout(() => {
      this.connect();
    }, delay);
  }

  private clearReconnect() {
    if (this.reconnectTimer !== null) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    const heartbeatEvent = this.options.heartbeatEvent ?? 'heartbeat';
    const interval = this.options.heartbeatIntervalMs ?? 15_000;
    this.heartbeatTimer = window.setInterval(() => {
      this.send(heartbeatEvent, { timestamp: Date.now() });
    }, interval);
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer !== null) {
      window.clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }
}

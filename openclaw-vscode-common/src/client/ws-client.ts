/**
 * WebSocket Client for OpenClaw Gateway
 * @module openclaw-vscode-common/client/ws-client
 */

import { ConnectionStatus } from '../types/gateway';

export type WsEvent = 'open' | 'close' | 'error' | 'message';
export type WsMessageHandler = (data: unknown) => void;
export type WsStatusHandler = (status: ConnectionStatus) => void;

/**
 * WebSocket client with exponential backoff reconnection
 */
export class WsClient {
    private ws: WebSocket | null = null;
    private url: string;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 20;
    private baseReconnectDelay = 1000;
    private maxReconnectDelay = 30000;
    private jitterMs = 1000;
    private reconnectTimer: NodeJS.Timeout | null = null;
    private status: ConnectionStatus = 'disconnected';
    private messageHandlers: Map<string, WsMessageHandler[]> = new Map();
    private statusHandlers: Set<WsStatusHandler> = new Set();

    constructor(url: string) {
        this.url = url;
    }

    /**
     * Connect to WebSocket server
     */
    connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.ws?.readyState === WebSocket.OPEN) {
                resolve();
                return;
            }

            this.setStatus(this.reconnectAttempts > 0 ? 'reconnecting' : 'connecting');

            try {
                this.ws = new WebSocket(this.url);
            } catch (error) {
                this.setStatus('error');
                reject(error);
                return;
            }

            this.ws.onopen = () => {
                console.log('[WsClient] Connected');
                this.setStatus('connected');
                this.reconnectAttempts = 0;

                resolve();
            };

            this.ws.onclose = event => {
                console.log('[WsClient] Disconnected, code:', event.code);
                this.setStatus('disconnected');
                this.handleReconnect();
            };

            this.ws.onerror = error => {
                console.error('[WsClient] Error:', error);
                this.setStatus('error');
                reject(error);
            };

            this.ws.onmessage = event => {
                try {
                    const data = JSON.parse(event.data as string);
                    this.handleMessage(data);
                } catch (error) {
                    console.error('[WsClient] Failed to parse message:', error);
                }
            };
        });
    }

    /**
     * Disconnect from WebSocket server
     */
    disconnect(): void {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
        this.reconnectAttempts = this.maxReconnectAttempts; // prevent reconnect

        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.setStatus('disconnected');
    }

    /**
     * Send raw message
     */
    send(data: unknown): void {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        } else {
            console.warn('[WsClient] WebSocket not connected, message dropped');
        }
    }

    /**
     * Subscribe to message type
     */
    on(event: string, handler: WsMessageHandler): void {
        const handlers = this.messageHandlers.get(event) || [];
        handlers.push(handler);
        this.messageHandlers.set(event, handlers);
    }

    /**
     * Unsubscribe from message type
     */
    off(event: string, handler: WsMessageHandler): void {
        const handlers = this.messageHandlers.get(event);
        if (handlers) {
            const index = handlers.indexOf(handler);
            if (index >= 0) {
                handlers.splice(index, 1);
            }
        }
    }

    /**
     * Subscribe to status changes
     */
    onStatus(handler: WsStatusHandler): void {
        this.statusHandlers.add(handler);
    }

    /**
     * Get current connection status
     */
    getStatus(): ConnectionStatus {
        return this.status;
    }

    /**
     * Check if connected
     */
    isConnected(): boolean {
        return this.ws?.readyState === WebSocket.OPEN;
    }

    // ========================================================================
    // Private Methods
    // ========================================================================

    private setStatus(status: ConnectionStatus): void {
        this.status = status;
        this.statusHandlers.forEach(handler => handler(status));
    }

    private handleMessage(data: unknown): void {
        const msg = data as { type?: string; event?: string };

        // Handle shutdown event - stop reconnecting
        if (msg.type === 'event' && msg.event === 'shutdown') {
            console.log('[WsClient] Received shutdown event');
            if (this.reconnectTimer) {
                clearTimeout(this.reconnectTimer);
                this.reconnectTimer = null;
            }
            this.reconnectAttempts = this.maxReconnectAttempts;
            this.setStatus('disconnected');
            return;
        }

        if (msg.type === 'event' && msg.event) {
            const handlers = this.messageHandlers.get(msg.event);
            if (handlers) {
                handlers.forEach(handler => handler(data));
            }
        }

        // Also emit to 'message' handlers
        const messageHandlers = this.messageHandlers.get('message');
        if (messageHandlers) {
            messageHandlers.forEach(handler => handler(data));
        }
    }

    private handleReconnect(): void {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.log('[WsClient] Max reconnect attempts reached');
            this.setStatus('failed');
            return;
        }

        this.reconnectAttempts++;

        // Exponential backoff with jitter (same as reference implementation)
        const delay =
            Math.min(this.baseReconnectDelay * Math.pow(2, this.reconnectAttempts - 1), this.maxReconnectDelay) +
            Math.random() * this.jitterMs;

        console.log(`[WsClient] Reconnecting in ${Math.round(delay)}ms (attempt ${this.reconnectAttempts})`);

        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            this.connect().catch(error => {
                console.error('[WsClient] Reconnect failed:', error);
            });
        }, delay);
    }
}

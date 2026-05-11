/**
 * WebSocket Client for OpenClaw Gateway
 * @module openclaw-vscode-common/client/ws-client
 */

import { ConnectionStatus } from '../types/gateway';

export type WsEvent = 'open' | 'close' | 'error' | 'message';
export type WsMessageHandler = (data: unknown) => void;
export type WsStatusHandler = (status: ConnectionStatus) => void;

/**
 * WebSocket client with auto-reconnect
 */
export class WsClient {
    private ws: WebSocket | null = null;
    private url: string;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectDelay = 1000;
    private status: ConnectionStatus = 'disconnected';
    private messageHandlers: Map<string, WsMessageHandler[]> = new Map();
    private statusHandlers: Set<WsStatusHandler> = new Set();
    private messageQueue: string[] = [];

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

            this.setStatus('connecting');

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
                
                // Send queued messages
                while (this.messageQueue.length > 0) {
                    const msg = this.messageQueue.shift();
                    if (msg && this.ws) {
                        this.ws.send(msg);
                    }
                }
                
                resolve();
            };

            this.ws.onclose = () => {
                console.log('[WsClient] Disconnected');
                this.setStatus('disconnected');
                this.handleReconnect();
            };

            this.ws.onerror = (error) => {
                console.error('[WsClient] Error:', error);
                this.setStatus('error');
                reject(error);
            };

            this.ws.onmessage = (event) => {
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
        const message = JSON.stringify(data);
        
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(message);
        } else {
            // Queue message for later
            this.messageQueue.push(message);
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
        // Handle Gateway message format
        const msg = data as { type?: string; event?: string };
        
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
            return;
        }

        this.reconnectAttempts++;
        const delay = this.reconnectDelay * this.reconnectAttempts;
        
        console.log(`[WsClient] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
        
        setTimeout(() => {
            this.connect().catch(console.error);
        }, delay);
    }
}
/**
 * RPC Client for OpenClaw Gateway
 * @module openclaw-vscode-common/client/rpc-client
 */

import { v4 as uuidv4 } from 'uuid';
import { GatewayRequest, GatewayResponse, GatewayResponseOk } from '../types/gateway';

interface PendingRequest {
    resolve: (value: unknown) => void;
    reject: (error: Error) => void;
    timeout: NodeJS.Timeout;
}

/**
 * RPC error with Gateway error code
 */
export class RpcError extends Error {
    readonly code: string;

    constructor(code: string, message: string) {
        super(`RPC error ${code}: ${message}`);
        this.name = 'RpcError';
        this.code = code;
    }
}

export type RpcMessageHandler = (data: unknown) => void;

/**
 * RPC client wrapper with Promise API
 */
export class RpcClient {
    private send: (data: unknown) => void;
    private pendingRequests: Map<string, PendingRequest> = new Map();
    private defaultTimeout = 10000; // 10 seconds (same as reference)

    constructor(sendFn: (data: unknown) => void) {
        this.send = sendFn;
    }

    /**
     * Send RPC request and wait for response
     */
    async request<T = unknown>(method: string, params?: Record<string, unknown>): Promise<T> {
        const id = uuidv4();

        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                this.pendingRequests.delete(id);
                reject(new Error(`RPC request timeout: ${method}`));
            }, this.defaultTimeout);

            this.pendingRequests.set(id, {
                resolve: resolve as (value: unknown) => void,
                reject,
                timeout
            });

            const request: GatewayRequest = {
                type: 'req',
                id,
                method,
                params
            };

            this.send(request);
        });
    }

    /**
     * Handle incoming response
     */
    handleResponse(response: GatewayResponse): void {
        const pending = this.pendingRequests.get(response.id);
        if (!pending) {
            console.warn(`[RpcClient] No pending request for id: ${response.id}`);
            return;
        }

        clearTimeout(pending.timeout);
        this.pendingRequests.delete(response.id);

        if (response.ok) {
            pending.resolve((response as GatewayResponseOk).payload);
        } else {
            const error = response.error;
            pending.reject(new RpcError(error.code, error.message));
        }
    }

    /**
     * Set default timeout for requests
     */
    setTimeout(ms: number): void {
        this.defaultTimeout = ms;
    }

    /**
     * Clear all pending requests
     */
    clear(): void {
        this.pendingRequests.forEach(pending => {
            clearTimeout(pending.timeout);
            pending.reject(new Error('RPC client cleared'));
        });
        this.pendingRequests.clear();
    }
}
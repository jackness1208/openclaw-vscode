/**
 * Gateway Client for OpenClaw
 * @module openclaw-vscode-common/client/gateway-client
 *
 * Provides high-level API for OpenClaw Gateway operations.
 */

import { WsClient } from './ws-client';
import { RpcClient } from './rpc-client';
import { loadOrCreateDeviceIdentity, signDevicePayload } from './device-identity';
import { buildDeviceAuthPayload } from './device-auth';
import {
    GatewayConfig,
    ConnectionStatus,
    AgentInfo,
    AgentListResponse,
    ChatEventPayload,
    SendMessageParams,
    ConnectChallengePayload,
    GatewayMessage
} from '../types/gateway';

export type ChatEventHandler = (payload: ChatEventPayload) => void;
export type StatusHandler = (status: ConnectionStatus) => void;

/**
 * Gateway client with authentication, agent management, and chat
 */
export class GatewayClient {
    private wsClient: WsClient;
    private rpcClient: RpcClient;
    private config: GatewayConfig;
    private authenticated = false;
    private chatHandlers: Set<ChatEventHandler> = new Set();
    private statusHandlers: Set<StatusHandler> = new Set();
    private authResolve: (() => void) | null = null;
    private authReject: ((error: Error) => void) | null = null;

    constructor(config: GatewayConfig) {
        this.config = config;
        this.wsClient = new WsClient(config.gatewayUrl);
        this.rpcClient = new RpcClient(data => this.wsClient.send(data));

        this.setupEventHandlers();
    }

    // ========================================================================
    // Connection
    // ========================================================================

    /**
     * Connect and authenticate with Gateway
     */
    async connect(): Promise<void> {
        await this.wsClient.connect();

        // Wait for the authentication handshake to complete
        // The server sends a connect.challenge event, which triggers
        // handleConnectChallenge -> rpcClient.request('connect', ...)
        // We wait here until that handshake resolves or times out
        return new Promise<void>((resolve, reject) => {
            this.authResolve = resolve;
            this.authReject = reject;

            // Timeout for authentication handshake (10 seconds)
            setTimeout(() => {
                if (this.authReject) {
                    this.authReject(new Error('Authentication handshake timed out'));
                    this.authResolve = null;
                    this.authReject = null;
                }
            }, 10000);
        });
    }

    /**
     * Disconnect from Gateway
     */
    disconnect(): void {
        this.authenticated = false;
        this.wsClient.disconnect();
        this.rpcClient.clear();
    }

    /**
     * Get connection status
     */
    getStatus(): ConnectionStatus {
        return this.wsClient.getStatus();
    }

    /**
     * Check if authenticated
     */
    isAuthenticated(): boolean {
        return this.authenticated && this.wsClient.isConnected();
    }

    /**
     * Subscribe to status changes
     */
    onStatus(handler: StatusHandler): void {
        this.statusHandlers.add(handler);
    }

    // ========================================================================
    // Agent Management
    // ========================================================================

    /**
     * Get list of available agents
     */
    async getAgents(): Promise<AgentInfo[]> {
        const response = await this.rpcClient.request<AgentListResponse>('agents.list', {});

        return response.agents.map(agent => ({
            id: agent.id,
            name: agent.identity?.name || agent.name || agent.id,
            emoji: agent.identity?.emoji || '🤖',
            isDefault: agent.id === response.defaultId,
            workspace: agent.workspace
        }));
    }

    // ========================================================================
    // Chat
    // ========================================================================

    /**
     * Send a chat message
     */
    async sendMessage(sessionKey: string, text: string, attachments?: SendMessageParams['attachments']): Promise<void> {
        await this.rpcClient.request('chat.send', {
            sessionKey,
            message: text,
            idempotencyKey: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            attachments
        });
    }

    /**
     * Subscribe to chat events
     */
    onChat(handler: ChatEventHandler): void {
        this.chatHandlers.add(handler);
    }

    /**
     * Unsubscribe from chat events
     */
    offChat(handler: ChatEventHandler): void {
        this.chatHandlers.delete(handler);
    }

    // ========================================================================
    // Private Methods
    // ========================================================================

    private setupEventHandlers(): void {
        // Handle all messages
        this.wsClient.on('message', data => {
            const msg = data as GatewayMessage;

            // Handle RPC responses
            if (msg.type === 'res') {
                this.rpcClient.handleResponse(msg as any);
            }
        });

        // Handle connect challenge
        this.wsClient.on('connect.challenge', async data => {
            const payload = data as { payload: ConnectChallengePayload };
            await this.handleConnectChallenge(payload.payload);
        });

        // Handle chat events
        this.wsClient.on('chat', data => {
            const payload = data as ChatEventPayload;
            this.chatHandlers.forEach(handler => handler(payload));
        });

        // Handle status changes
        this.wsClient.onStatus(status => {
            if (status === 'disconnected') {
                this.authenticated = false;
            }
            this.statusHandlers.forEach(handler => handler(status));
        });
    }

    private async handleConnectChallenge(challenge: ConnectChallengePayload): Promise<void> {
        try {
            const role = 'operator';
            const scopes = ['operator.admin', 'operator.read'];
            const clientId = 'gateway-client';
            const clientMode = 'backend';

            const params: Record<string, unknown> = {
                minProtocol: 3,
                maxProtocol: 3,
                role,
                client: {
                    id: clientId,
                    version: '0.1.0',
                    platform: 'vscode',
                    mode: clientMode
                },
                scopes,
                locale: Intl.DateTimeFormat().resolvedOptions().locale || 'en-US'
            };

            if (this.config.gatewayToken) {
                params.auth = { token: this.config.gatewayToken };
            }

            // Add device identity signature (Ed25519)
            try {
                const identity = loadOrCreateDeviceIdentity();
                const signedAtMs = Date.now();
                const nonce = challenge.nonce || '';

                const authPayload = buildDeviceAuthPayload({
                    deviceId: identity.deviceId,
                    clientId,
                    clientMode,
                    role,
                    scopes,
                    signedAtMs,
                    token: this.config.gatewayToken || null,
                    nonce
                });

                const signature = signDevicePayload(identity.privateKey, authPayload);

                params.device = {
                    id: identity.deviceId,
                    publicKey: identity.publicKey,
                    signature,
                    signedAt: signedAtMs,
                    nonce
                };

                console.log('[GatewayClient] Sending connect with device signature');
            } catch (deviceError) {
                console.error('[GatewayClient] Device identity failed, falling back to token-only:', deviceError);
            }

            await this.rpcClient.request('connect', params);

            // Connection successful
            this.authenticated = true;
            console.log('[GatewayClient] Authenticated successfully');

            // Notify status handlers
            this.statusHandlers.forEach(handler => handler('connected'));

            // Resolve the connect() promise
            if (this.authResolve) {
                this.authResolve();
                this.authResolve = null;
                this.authReject = null;
            }
        } catch (error) {
            console.error('[GatewayClient] Authentication failed:', error);
            this.authenticated = false;

            // Reject the connect() promise
            if (this.authReject) {
                this.authReject(error instanceof Error ? error : new Error(String(error)));
                this.authResolve = null;
                this.authReject = null;
            }
        }
    }
}

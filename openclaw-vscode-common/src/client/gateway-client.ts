/**
 * Gateway Client for OpenClaw
 * @module openclaw-vscode-common/client/gateway-client
 * 
 * Provides high-level API for OpenClaw Gateway operations.
 */

import { WsClient } from './ws-client';
import { RpcClient } from './rpc-client';
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

    constructor(config: GatewayConfig) {
        this.config = config;
        this.wsClient = new WsClient(config.gatewayUrl);
        this.rpcClient = new RpcClient((data) => this.wsClient.send(data));

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
        
        // Wait for challenge or direct connection
        // The authentication flow is handled by handleConnectChallenge
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
            name: agent.name || agent.id,
            emoji: agent.emoji || '🤖',
            isDefault: agent.id === response.defaultId,
            workspace: agent.workspace,
            status: agent.status
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
            text,
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
        this.wsClient.on('message', (data) => {
            const msg = data as GatewayMessage;
            
            // Handle RPC responses
            if (msg.type === 'res') {
                this.rpcClient.handleResponse(msg as any);
            }
        });

        // Handle connect challenge
        this.wsClient.on('connect.challenge', async (data) => {
            const payload = data as { payload: ConnectChallengePayload };
            await this.handleConnectChallenge(payload.payload);
        });

        // Handle chat events
        this.wsClient.on('chat', (data) => {
            const msg = data as { payload: ChatEventPayload };
            this.chatHandlers.forEach(handler => handler(msg.payload));
        });

        // Handle status changes
        this.wsClient.onStatus((status) => {
            if (status === 'disconnected') {
                this.authenticated = false;
            }
            this.statusHandlers.forEach(handler => handler(status));
        });
    }

    private async handleConnectChallenge(challenge: ConnectChallengePayload): Promise<void> {
        try {
            await this.rpcClient.request('connect', {
                minProtocol: 1,
                maxProtocol: 1,
                role: 'user',
                client: 'vscode-extension',
                auth: {
                    token: this.config.gatewayToken
                }
            });

            // Connection successful
            this.authenticated = true;
            console.log('[GatewayClient] Authenticated successfully');
            
            // Notify status handlers
            this.statusHandlers.forEach(handler => handler('connected'));
        } catch (error) {
            console.error('[GatewayClient] Authentication failed:', error);
            this.authenticated = false;
        }
    }
}
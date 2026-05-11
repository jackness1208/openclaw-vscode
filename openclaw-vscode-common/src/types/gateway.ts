/**
 * OpenClaw Gateway Types
 * @module openclaw-vscode-common/types
 */

// ============================================================================
// Gateway Message Types
// ============================================================================

/**
 * Gateway request message
 */
export interface GatewayRequest {
    type: 'req';
    id: string;
    method: string;
    params?: Record<string, unknown>;
}

/**
 * Gateway success response
 */
export interface GatewayResponseOk {
    type: 'res';
    id: string;
    ok: true;
    payload: unknown;
}

/**
 * Gateway error response
 */
export interface GatewayResponseError {
    type: 'res';
    id: string;
    ok: false;
    error: {
        code: number;
        message: string;
    };
}

export type GatewayResponse = GatewayResponseOk | GatewayResponseError;

/**
 * Gateway event frame
 */
export interface GatewayEventFrame {
    type: 'event';
    event: string;
    payload: unknown;
}

export type GatewayMessage = GatewayRequest | GatewayResponse | GatewayEventFrame;

// ============================================================================
// Agent Types
// ============================================================================

/**
 * Agent information from Gateway
 */
export interface AgentInfo {
    id: string;
    name: string;
    emoji: string;
    isDefault: boolean;
    workspace?: string;
    status?: 'active' | 'idle' | 'busy';
}

/**
 * Agent list response
 */
export interface AgentListResponse {
    agents: AgentInfo[];
    defaultId: string;
}

// ============================================================================
// Chat Types
// ============================================================================

/**
 * Chat message
 */
export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: number;
    agentId?: string;
}

/**
 * Chat event payload
 */
export interface ChatEventPayload {
    sessionId: string;
    agentId: string;
    chunk?: string;
    done?: boolean;
    error?: string;
    messages?: ChatMessage[];
}

/**
 * Send message params
 */
export interface SendMessageParams {
    sessionKey: string;
    text: string;
    attachments?: Attachment[];
}

/**
 * Attachment
 */
export interface Attachment {
    type: 'file' | 'image';
    path: string;
    name?: string;
}

// ============================================================================
// Connection Types
// ============================================================================

/**
 * Connection status
 */
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

/**
 * Connect params
 */
export interface ConnectParams {
    minProtocol: number;
    maxProtocol: number;
    role: string;
    client: string;
    scopes?: string[];
    auth: {
        token: string;
    };
}

/**
 * Connect challenge event
 */
export interface ConnectChallengePayload {
    nonce: string;
}

// ============================================================================
// Config Types
// ============================================================================

/**
 * OpenClaw configuration from ~/.openclaw/openclaw.json
 */
export interface OpenClawConfig {
    gateway: {
        host: string;
        port: number;
        token: string;
    };
    agents?: {
        list?: Array<{
            id: string;
            workspace?: string;
        }>;
    };
}

/**
 * Parsed config for extension use
 */
export interface GatewayConfig {
    gatewayUrl: string;
    gatewayToken: string;
}
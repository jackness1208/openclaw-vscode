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
        code: string;
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
    agents: Array<{
        id: string;
        name?: string;
        identity?: {
            name?: string;
            emoji?: string;
            avatar?: string;
            avatarUrl?: string;
        };
        workspace?: string;
        model?: {
            primary?: string;
        };
    }>;
    defaultId: string;
    mainKey: string;
    scope: 'per-sender' | 'global';
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
 * Chat event payload from Gateway
 * Matches server's ChatEventSchema
 */
export interface ChatEventPayload {
    runId: string;
    sessionKey: string;
    seq: number;
    state: 'delta' | 'final' | 'aborted' | 'error';
    message?: {
        role: 'assistant';
        content: Array<{
            type: 'text';
            text: string;
        }>;
        timestamp: number;
    };
    errorMessage?: string;
    errorKind?: 'refusal' | 'timeout' | 'rate_limit' | 'context_length' | 'unknown';
    usage?: unknown;
    stopReason?: string;
}

/**
 * Send message params
 * Matches server's ChatSendParamsSchema
 */
export interface SendMessageParams {
    sessionKey: string;
    message: string;
    idempotencyKey: string;
    attachments?: Attachment[];
    thinking?: string;
    deliver?: boolean;
    timeoutMs?: number;
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
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'failed' | 'error';

/**
 * Client identity sent during connect handshake
 */
export interface ClientIdentity {
    id: string;
    version: string;
    platform: string;
    mode: string;
}

/**
 * Device auth info for connect handshake
 */
export interface DeviceAuth {
    id: string;
    publicKey: string;
    signature: string;
    signedAt: number;
    nonce: string;
}

/**
 * Connect params
 */
export interface ConnectParams {
    minProtocol: number;
    maxProtocol: number;
    role: string;
    client: ClientIdentity;
    scopes: string[];
    caps?: string[];
    userAgent?: string;
    locale?: string;
    auth?: {
        token: string;
    };
    device?: DeviceAuth;
    [key: string]: unknown;
}

/**
 * Connect challenge event
 */
export interface ConnectChallengePayload {
    nonce: string;
}

/**
 * Hello-ok response from Gateway after successful connect
 */
export interface HelloOk {
    type: 'hello-ok';
    server?: {
        version: string;
        startTime: number;
    };
    auth?: {
        deviceAuthRequired: boolean;
    };
    snapshot?: unknown;
}

// ============================================================================
// Config Types
// ============================================================================

/**
 * OpenClaw configuration from ~/.openclaw/openclaw.json
 */
export interface OpenClawConfig {
    gateway: {
        host?: string;
        port?: number;
        token?: string;
        auth?: {
            mode?: string;
            token?: string;
        };
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

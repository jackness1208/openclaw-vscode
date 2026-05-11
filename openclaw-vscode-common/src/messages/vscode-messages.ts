/**
 * VSCode Messages for OpenClaw
 * @module openclaw-vscode-common/messages
 */

import type { NotificationType, RequestType } from 'vscode-messenger-common';

// ============================================================================
// Message Constants
// ============================================================================

export const VSCODE_MESSAGES = {
    // Lifecycle
    WEBVIEW_READY: 'webviewReady',
    
    // Connection
    CONNECTION_STATUS: 'connectionStatus',
    GATEWAY_STATUS: 'gatewayStatus',
    
    // Agent
    GET_AGENTS: 'getAgents',
    AGENT_LIST: 'agentList',
    SWITCH_AGENT: 'switchAgent',
    CURRENT_AGENT: 'currentAgent',
    
    // Chat
    SEND_MESSAGE: 'sendMessage',
    CHAT_EVENT: 'chatEvent',
    MESSAGE_LIST: 'messageList',
    CLEAR_CHAT: 'clearChat',
    
    // Error
    ERROR: 'error'
};

// ============================================================================
// Notification Types
// ============================================================================

// Lifecycle
export const webviewReady: NotificationType<void> = { method: VSCODE_MESSAGES.WEBVIEW_READY };

// Connection
export const connectionStatus: NotificationType<{ status: string }> = { 
    method: VSCODE_MESSAGES.CONNECTION_STATUS 
};
export const gatewayStatus: NotificationType<{ status: string; authenticated: boolean }> = { 
    method: VSCODE_MESSAGES.GATEWAY_STATUS 
};

// Agent
export const agentList: NotificationType<{ agents: AgentMessage[]; defaultId: string }> = { 
    method: VSCODE_MESSAGES.AGENT_LIST 
};
export const currentAgent: NotificationType<{ agentId: string }> = { 
    method: VSCODE_MESSAGES.CURRENT_AGENT 
};

// Chat
export const chatEvent: NotificationType<ChatEventMessage> = { 
    method: VSCODE_MESSAGES.CHAT_EVENT 
};
export const messageList: NotificationType<{ messages: ChatMessageItem[] }> = { 
    method: VSCODE_MESSAGES.MESSAGE_LIST 
};

// Error
export const error: NotificationType<{ message: string }> = { 
    method: VSCODE_MESSAGES.ERROR 
};

// ============================================================================
// Request Types
// ============================================================================

export const getAgents: RequestType<void, { agents: AgentMessage[]; defaultId: string }> = { 
    method: VSCODE_MESSAGES.GET_AGENTS 
};

export const sendMessage: RequestType<{ sessionKey: string; text: string }, void> = { 
    method: VSCODE_MESSAGES.SEND_MESSAGE 
};

export const switchAgent: RequestType<{ agentId: string }, void> = { 
    method: VSCODE_MESSAGES.SWITCH_AGENT 
};

export const clearChat: RequestType<void, void> = { 
    method: VSCODE_MESSAGES.CLEAR_CHAT 
};

// ============================================================================
// Message Types
// ============================================================================

export interface AgentMessage {
    id: string;
    name: string;
    emoji: string;
    isDefault: boolean;
}

export interface ChatMessageItem {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: number;
    agentId?: string;
}

export interface ChatEventMessage {
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
    errorKind?: string;
    stopReason?: string;
}
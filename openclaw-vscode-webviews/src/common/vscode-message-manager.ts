/**
 * VSCode Message Manager for OpenClaw Webview
 */

import { Messenger } from 'vscode-messenger-webview';
import {
    webviewReady,
    connectionStatus,
    gatewayStatus,
    agentList,
    currentAgent,
    chatEvent,
    messageList,
    error,
    getAgents,
    sendMessage as sendMessageType,
    switchAgent,
    clearChat,
    AgentMessage,
    ChatEventMessage,
    ChatMessageItem
} from 'openclaw-vscode-common';

export class VsCodeMessageManager {
    private messenger: Messenger;

    constructor(messenger: Messenger) {
        this.messenger = messenger;
    }

    // ========================================================================
    // Notifications to Extension
    // ========================================================================

    notifyReady(): void {
        this.messenger.sendNotification(webviewReady, {} as any);
    }

    // ========================================================================
    // Requests to Extension
    // ========================================================================

    async getAgents(): Promise<{ agents: AgentMessage[]; defaultId: string }> {
        return this.messenger.sendRequest(getAgents, {} as any);
    }

    async sendMessage(sessionKey: string, text: string): Promise<void> {
        return this.messenger.sendRequest(sendMessageType, {} as any, { sessionKey, text });
    }

    async switchAgent(agentId: string): Promise<void> {
        return this.messenger.sendRequest(switchAgent, {} as any, { agentId });
    }

    async clearChat(): Promise<void> {
        return this.messenger.sendRequest(clearChat, {} as any);
    }

    // ========================================================================
    // Listen for Notifications from Extension
    // ========================================================================

    onConnectionStatus(callback: (data: { status: string }) => void): void {
        this.messenger.onNotification(connectionStatus, callback);
    }

    onGatewayStatus(callback: (data: { status: string; authenticated: boolean }) => void): void {
        this.messenger.onNotification(gatewayStatus, callback);
    }

    onAgentList(callback: (data: { agents: AgentMessage[]; defaultId: string }) => void): void {
        this.messenger.onNotification(agentList, callback);
    }

    onCurrentAgent(callback: (data: { agentId: string }) => void): void {
        this.messenger.onNotification(currentAgent, callback);
    }

    onChatEvent(callback: (data: ChatEventMessage) => void): void {
        this.messenger.onNotification(chatEvent, callback);
    }

    onMessageList(callback: (data: { messages: ChatMessageItem[] }) => void): void {
        this.messenger.onNotification(messageList, callback);
    }

    onError(callback: (data: { message: string }) => void): void {
        this.messenger.onNotification(error, callback);
    }
}

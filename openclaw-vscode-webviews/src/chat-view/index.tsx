/**
 * Chat View Entry Point
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { Messenger } from 'vscode-messenger-webview';
import { VsCodeMessageManager } from '../common/vscode-message-manager';
import { ChatContainer } from './ChatContainer';
import { useChatStore } from '../store/chat-store';

const messenger = new Messenger();
const messageManager = new VsCodeMessageManager(messenger);

// Set up message handlers
messageManager.onAgentList((data) => {
    useChatStore.getState().setAgents(data.agents.map(a => ({
        id: a.id,
        name: a.name,
        emoji: a.emoji,
        isDefault: a.isDefault
    })));
});

messageManager.onGatewayStatus((data) => {
    useChatStore.getState().setConnectionStatus(data.status, data.authenticated);
});

messageManager.onChatEvent((data) => {
    const store = useChatStore.getState();
    if (data.chunk) {
        store.appendStreamContent(data.chunk);
        store.setStreaming(true);
    }
    if (data.done) {
        // Add the complete message
        store.addMessage({
            role: 'assistant',
            content: useChatStore.getState().streamingContent,
            agentId: data.agentId
        });
        store.clearStreamContent();
        store.setStreaming(false);
        store.setLoading(false);
    }
    if (data.error) {
        console.error('Chat error:', data.error);
        store.setLoading(false);
        store.setStreaming(false);
    }
});

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
    <React.StrictMode>
        <ChatContainer />
    </React.StrictMode>
);

// Notify extension that webview is ready
messageManager.notifyReady();
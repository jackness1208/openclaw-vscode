/**
 * Chat View Entry Point
 */

import './index.css';

import React from 'react';
import ReactDOM from 'react-dom/client';
import { Messenger } from 'vscode-messenger-webview';
import { VsCodeMessageManager } from '../common/vscode-message-manager';
import { ChatContainer } from './ChatContainer';
import { useChatStore } from '../store/chat-store';

// acquireVsCodeApi() is a global provided by VS Code in webviews.
// We call it directly and pass to Messenger, bypassing the empty
// vscode-api module that vscode-messenger-webview ships with.
const vscodeApi = (window as any).acquireVsCodeApi(); // eslint-disable-line @typescript-eslint/no-explicit-any
const messenger = new Messenger(vscodeApi);
const messageManager = new VsCodeMessageManager(messenger);

// Expose messageManager globally so ChatContainer can use it for sending
(window as any).__messageManager = messageManager; // eslint-disable-line @typescript-eslint/no-explicit-any

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

    // Server chat event format: { state: "delta"|"final"|"error"|"aborted", message: { content: [{type, text}] } }
    if (data.state === 'delta' && data.message) {
        // delta contains full accumulated text, not just the increment
        const text = data.message.content
            .filter(c => c.type === 'text')
            .map(c => c.text)
            .join('');
        store.clearStreamContent();
        store.appendStreamContent(text);
        store.setStreaming(true);
    }
    if (data.state === 'final') {
        const text = data.message
            ? data.message.content
                .filter((c: any) => c.type === 'text') // eslint-disable-line @typescript-eslint/no-explicit-any
                .map((c: any) => c.text) // eslint-disable-line @typescript-eslint/no-explicit-any
                .join('')
            : useChatStore.getState().streamingContent;

        if (text) {
            store.addMessage({
                role: 'assistant',
                content: text,
                agentId: data.sessionKey
            });
        }
        store.clearStreamContent();
        store.setStreaming(false);
        store.setLoading(false);
    }
    if (data.state === 'error') {
        console.error('Chat error:', data.errorMessage);
        store.setLoading(false);
        store.setStreaming(false);
    }
    if (data.state === 'aborted') {
        store.clearStreamContent();
        store.setStreaming(false);
        store.setLoading(false);
    }
});

// Debug log listener
messageManager.onDebugLog((data) => {
    useChatStore.getState().addDebugLog(data);
});

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
    <React.StrictMode>
        <ChatContainer />
    </React.StrictMode>
);

// Notify extension that webview is ready
messageManager.notifyReady();
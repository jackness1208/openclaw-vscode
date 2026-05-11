import React from 'react';
import { AgentSelector } from './components/AgentSelector';
import { MessageList } from './components/MessageList';
import { MessageInput } from './components/MessageInput';
import { useChatStore } from '../store/chat-store';

declare const __messageManager: any; // eslint-disable-line @typescript-eslint/no-explicit-any

export const ChatContainer: React.FC = () => {
    const { sendMessage, isLoading } = useChatStore();

    const handleSendMessage = (text: string) => {
        sendMessage(text);

        const agentId = useChatStore.getState().currentAgentId;
        if (agentId) {
            const sessionKey = `agent:${agentId}:${agentId}`;
            __messageManager.sendMessage(sessionKey, text).catch((err: any) => {
                // eslint-disable-line @typescript-eslint/no-explicit-any
                console.error('[ChatContainer] Failed to send message:', err);
                useChatStore.getState().setLoading(false);
            });
        }
    };

    return (
        <div className="chat-container">
            <AgentSelector />
            <MessageList />
            <MessageInput onSend={handleSendMessage} disabled={isLoading} />
        </div>
    );
};

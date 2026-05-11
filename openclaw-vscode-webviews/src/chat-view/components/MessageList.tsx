import React from 'react';
import { useChatStore } from '../../store/chat-store';
import './message-list.css';

export const MessageList: React.FC = () => {
    const { messages, streamingContent, isStreaming } = useChatStore();

    return (
        <div className="message-list">
            {messages.length === 0 && !isStreaming && (
                <div className="message-list__empty">Send a message to start chatting</div>
            )}
            {messages.map(msg => (
                <div key={msg.id} className={`message message--${msg.role}`}>
                    <div className="message__content">{msg.content}</div>
                </div>
            ))}
            {isStreaming && streamingContent && (
                <div className="message message--assistant message--streaming">
                    <div className="message__content">{streamingContent}</div>
                </div>
            )}
        </div>
    );
};

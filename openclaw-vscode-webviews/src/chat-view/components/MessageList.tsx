import React from 'react';
import { useChatStore } from '../../store/chat-store';

export const MessageList: React.FC = () => {
  const { messages, streamingContent, isStreaming } = useChatStore();

  return (
    <div className="message-list" style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
      {messages.map(msg => (
        <div key={msg.id} className={`message message-${msg.role}`} style={{
          marginBottom: '8px',
          padding: '8px 12px',
          borderRadius: '8px',
          backgroundColor: msg.role === 'user' ? '#007acc' : '#2d2d2d',
          color: '#fff',
          marginLeft: msg.role === 'user' ? 'auto' : '0',
          maxWidth: '80%'
        }}>
          <div className="message-content">{msg.content}</div>
        </div>
      ))}
      {isStreaming && streamingContent && (
        <div className="message message-assistant streaming" style={{
          marginBottom: '8px',
          padding: '8px 12px',
          borderRadius: '8px',
          backgroundColor: '#2d2d2d',
          color: '#fff',
          maxWidth: '80%'
        }}>
          <div className="message-content">{streamingContent}</div>
        </div>
      )}
    </div>
  );
};
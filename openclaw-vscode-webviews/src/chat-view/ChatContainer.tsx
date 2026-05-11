import React from 'react';
import { AgentSelector } from './components/AgentSelector';
import { MessageList } from './components/MessageList';
import { MessageInput } from './components/MessageInput';
import { useChatStore } from '../store/chat-store';

export const ChatContainer: React.FC = () => {
  const { sendMessage, isLoading } = useChatStore();

  const handleSendMessage = (text: string) => {
    sendMessage(text);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <AgentSelector />
      <MessageList />
      <MessageInput onSend={handleSendMessage} disabled={isLoading} />
    </div>
  );
};
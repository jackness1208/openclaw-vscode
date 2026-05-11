/**
 * Chat Store using Zustand
 */

import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export interface Agent {
  id: string;
  name: string;
  emoji: string;
  isDefault: boolean;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  agentId?: string;
}

export interface ChatState {
  // Agents
  agents: Agent[];
  currentAgentId: string | null;
  
  // Messages
  messages: Message[];
  streamingContent: string;
  isStreaming: boolean;
  isLoading: boolean;
  
  // Connection
  connectionStatus: string;
  authenticated: boolean;
  
  // Actions
  setAgents: (agents: Agent[]) => void;
  setCurrentAgent: (agentId: string) => void;
  switchAgent: (agentId: string) => void;
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  appendStreamContent: (chunk: string) => void;
  clearStreamContent: () => void;
  setStreaming: (streaming: boolean) => void;
  setLoading: (loading: boolean) => void;
  clearMessages: () => void;
  setConnectionStatus: (status: string, authenticated: boolean) => void;
  sendMessage: (text: string) => void;
  currentAgent: () => Agent | null;
}

export const useChatStore = create<ChatState>((set, get) => ({
  // Initial state
  agents: [],
  currentAgentId: null,
  messages: [],
  streamingContent: '',
  isStreaming: false,
  isLoading: false,
  connectionStatus: 'disconnected',
  authenticated: false,
  
  // Actions
  setAgents: (agents) => {
    const currentAgentId = get().currentAgentId;
    const defaultAgent = agents.find(a => a.isDefault);
    set({ 
      agents,
      currentAgentId: currentAgentId || defaultAgent?.id || agents[0]?.id || null
    });
  },
  
  setCurrentAgent: (agentId) => {
    set({ currentAgentId: agentId, messages: [] });
  },
  
  switchAgent: (agentId) => {
    set({ currentAgentId: agentId, messages: [], streamingContent: '' });
  },
  
  currentAgent: () => {
    const state = get();
    return state.agents.find(a => a.id === state.currentAgentId) || null;
  },
  
  addMessage: (message) => {
    const newMessage: Message = {
      ...message,
      id: uuidv4(),
      timestamp: Date.now()
    };
    set(state => ({ messages: [...state.messages, newMessage] }));
  },
  
  appendStreamContent: (chunk) => {
    set(state => ({ streamingContent: state.streamingContent + chunk }));
  },
  
  clearStreamContent: () => {
    set({ streamingContent: '' });
  },
  
  setStreaming: (streaming) => {
    set({ isStreaming: streaming });
  },
  
  setLoading: (loading) => {
    set({ isLoading: loading });
  },
  
  clearMessages: () => {
    set({ messages: [], streamingContent: '' });
  },
  
  setConnectionStatus: (status, authenticated) => {
    set({ connectionStatus: status, authenticated });
  },
  
  sendMessage: (text: string) => {
    // Add user message
    const state = get();
    const agent = state.currentAgent();
    if (!agent) return;

    get().addMessage({
      role: 'user',
      content: text,
      agentId: agent.id
    });

    set({ isLoading: true, streamingContent: '' });
    // The actual sending is handled by ChatContainer via messageManager
  }
}));

import React from 'react';
import { useChatStore } from '../../store/chat-store';

export const AgentSelector: React.FC = () => {
  const { agents, currentAgentId, switchAgent } = useChatStore();

  return (
    <div className="agent-selector">
      <select 
        value={currentAgentId || ''} 
        onChange={(e) => switchAgent(e.target.value)}
        className="agent-select"
      >
        {agents.map(agent => (
          <option key={agent.id} value={agent.id}>
            {agent.emoji} {agent.name}
          </option>
        ))}
      </select>
    </div>
  );
};

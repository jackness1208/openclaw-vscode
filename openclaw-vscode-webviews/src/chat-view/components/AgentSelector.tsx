import React from 'react';
import { useChatStore } from '../../store/chat-store';
import './agent-selector.css';

export const AgentSelector: React.FC = () => {
    const { agents, currentAgentId, switchAgent } = useChatStore();

    if (agents.length === 0) {
        return <div className="agent-selector__empty">No agents available</div>;
    }

    return (
        <div className="agent-selector">
            <span className="agent-selector__label">Agent:</span>
            <select
                value={currentAgentId || ''}
                onChange={e => switchAgent(e.target.value)}
                className="agent-selector__select"
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

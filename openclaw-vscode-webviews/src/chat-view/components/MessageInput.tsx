import React, { useState, KeyboardEvent } from 'react';
import './message-input.css';

interface MessageInputProps {
    onSend: (text: string) => void;
    disabled?: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({ onSend, disabled }) => {
    const [text, setText] = useState('');

    const handleSend = () => {
        if (text.trim() && !disabled) {
            onSend(text.trim());
            setText('');
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="message-input">
            <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message... (Enter to send)"
                disabled={disabled}
                rows={1}
                className="message-input__textarea"
            />
            <button onClick={handleSend} disabled={disabled || !text.trim()} className="message-input__button">
                Send
            </button>
        </div>
    );
};

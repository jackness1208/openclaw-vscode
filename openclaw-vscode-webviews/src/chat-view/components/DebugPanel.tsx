import React, { useRef, useEffect } from 'react';
import { useChatStore, DebugEntry } from '../../store/chat-store';

export const DebugPanel: React.FC = () => {
  const { debugLogs, isDebugVisible, toggleDebug, clearDebugLogs } = useChatStore();
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isDebugVisible) {
      logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [debugLogs, isDebugVisible]);

  if (!isDebugVisible) {
    return (
      <div style={{
        padding: '4px 8px',
        borderTop: '1px solid var(--vscode-panel-border)',
        cursor: 'pointer',
        fontSize: '11px',
        color: 'var(--vscode-descriptionForeground)',
        textAlign: 'center',
      }}
      onClick={toggleDebug}
      >
        Show Debug Log
      </div>
    );
  }

  return (
    <div style={{
      borderTop: '1px solid var(--vscode-panel-border)',
      display: 'flex',
      flexDirection: 'column',
      height: '200px',
      fontSize: '11px',
      fontFamily: 'var(--vscode-editor-font-family, monospace)',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '4px 8px',
        borderBottom: '1px solid var(--vscode-panel-border)',
        backgroundColor: 'var(--vscode-panel-background)',
      }}>
        <span style={{ fontWeight: 'bold', color: 'var(--vscode-panelTitle-foreground)' }}>
          Debug Log ({debugLogs.length})
        </span>
        <div>
          <button
            onClick={clearDebugLogs}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--vscode-descriptionForeground)',
              cursor: 'pointer',
              fontSize: '11px',
              marginRight: '8px',
            }}
          >
            Clear
          </button>
          <button
            onClick={toggleDebug}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--vscode-descriptionForeground)',
              cursor: 'pointer',
              fontSize: '11px',
            }}
          >
            Hide
          </button>
        </div>
      </div>

      {/* Log entries */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '4px 0',
      }}>
        {debugLogs.length === 0 && (
          <div style={{ padding: '8px', color: 'var(--vscode-descriptionForeground)', textAlign: 'center' }}>
            No debug logs yet. Connect to Gateway to see messages.
          </div>
        )}
        {debugLogs.map((entry: DebugEntry, i: number) => (
          <DebugLogRow key={i} entry={entry} />
        ))}
        <div ref={logEndRef} />
      </div>
    </div>
  );
};

const DebugLogRow: React.FC<{ entry: DebugEntry }> = ({ entry }) => {
  const time = new Date(entry.timestamp).toLocaleTimeString('en-US', {
    hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit'
  });

  const dirColor = entry.direction === 'send'
    ? 'var(--vscode-debugIconStepOutForeground, #73c991)'
    : 'var(--vscode-debugIconStepInForeground, #75beff)';

  const dirLabel = entry.direction === 'send' ? 'OUT' : 'IN ';

  const dataStr = typeof entry.data === 'string' ? entry.data : JSON.stringify(entry.data, null, 2);
  const isLong = dataStr.length > 200;
  const displayData = isLong ? dataStr.slice(0, 200) + '...' : dataStr;

  return (
    <div style={{
      padding: '1px 8px',
      borderBottom: '1px solid var(--vscode-panel-border, transparent)',
    }}>
      <span style={{ color: 'var(--vscode-descriptionForeground)', marginRight: '6px' }}>{time}</span>
      <span style={{ color: dirColor, fontWeight: 'bold', marginRight: '6px' }}>{dirLabel}</span>
      <span style={{ color: 'var(--vscode-symbolIconFunctionForeground, #dcdcaa)', marginRight: '6px' }}>
        {entry.type}
      </span>
      <span style={{ color: 'var(--vscode-descriptionForeground)', wordBreak: 'break-all' }}>
        {displayData}
      </span>
    </div>
  );
};

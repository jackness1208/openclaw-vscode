/**
 * Chat View Provider for OpenClaw
 * @module openclaw-vscode-extension/chat-explorer
 */

import * as vscode from 'vscode';
import { Messenger } from 'vscode-messenger';
import { WebviewIdMessageParticipant, NotificationType, RequestType } from 'vscode-messenger-common';
import { AgentInfo, ChatEventPayload, ConnectionStatus } from 'openclaw-vscode-common';
import { 
    VSCODE_MESSAGES,
    webviewReady,
    gatewayStatus,
    agentList,
    chatEvent,
    currentAgent
} from 'openclaw-vscode-common/lib/messages/vscode-messages';

/**
 * Chat view provider for OpenClaw sidebar
 */
export class ChatViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'openclaw.chatView';
    
    private _view: vscode.WebviewView | undefined;
    private _webviewParticipant: WebviewIdMessageParticipant | undefined;
    private _agents: AgentInfo[] = [];
    private _currentAgentId: string = '';
    private _status: ConnectionStatus = 'disconnected';
    private _authenticated = false;

    constructor(
        private readonly _extensionUri: vscode.Uri,
        private readonly _messenger: Messenger
    ) {}

    resolveWebviewView(
        webviewView: vscode.WebviewView,
        _context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ): void {
        this._view = webviewView;
        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        // Register webview to messenger
        this._webviewParticipant = this._messenger.registerWebviewView(webviewView);
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.joinPath(this._extensionUri, 'pack')
            ]
        };

        // Handle webview ready
        this._messenger.onNotification(webviewReady, () => {
            this._onWebviewReady();
        }, { sender: this._webviewParticipant });

        // Handle messages from webview
        this._setupMessageHandlers();
    }

    private _onWebviewReady(): void {
        // Send current status
        this._sendNotification(gatewayStatus, {
            status: this._status,
            authenticated: this._authenticated
        });

        // Send agent list
        this._sendNotification(agentList, {
            agents: this._agents.map(a => ({
                id: a.id,
                name: a.name,
                emoji: a.emoji,
                isDefault: a.isDefault
            })),
            defaultId: this._agents.find(a => a.isDefault)?.id || 'main'
        });

        // Send current agent
        if (this._currentAgentId) {
            this._sendNotification(currentAgent, { agentId: this._currentAgentId });
        }
    }

    private _setupMessageHandlers(): void {
        // Handle send message
        this._messenger.onRequest(
            { method: VSCODE_MESSAGES.SEND_MESSAGE } as RequestType<any, void>,
            async (params: { sessionKey: string; text: string }) => {
                // This will be handled by the gateway client
                console.log('[ChatViewProvider] Send message:', params);
            },
            { sender: this._webviewParticipant }
        );

        // Handle switch agent
        this._messenger.onRequest(
            { method: VSCODE_MESSAGES.SWITCH_AGENT } as RequestType<any, void>,
            async (params: { agentId: string }) => {
                this._currentAgentId = params.agentId;
                this._sendNotification(currentAgent, { agentId: params.agentId });
            },
            { sender: this._webviewParticipant }
        );

        // Handle clear chat
        this._messenger.onRequest(
            { method: VSCODE_MESSAGES.CLEAR_CHAT } as RequestType<void, void>,
            async () => {
                console.log('[ChatViewProvider] Clear chat');
            },
            { sender: this._webviewParticipant }
        );
    }

    private _sendNotification<T>(type: NotificationType<T>, data: T): void {
        if (this._webviewParticipant) {
            this._messenger.sendNotification(type, this._webviewParticipant, data);
        }
    }

    // ========================================================================
    // Public API
    // ========================================================================

    setAgents(agents: AgentInfo[]): void {
        this._agents = agents;
        if (this._view && this._webviewParticipant) {
            this._sendNotification(agentList, {
                agents: agents.map(a => ({
                    id: a.id,
                    name: a.name,
                    emoji: a.emoji,
                    isDefault: a.isDefault
                })),
                defaultId: agents.find(a => a.isDefault)?.id || 'main'
            });
        }
    }

    setGatewayStatus(status: ConnectionStatus, authenticated: boolean): void {
        this._status = status;
        this._authenticated = authenticated;
        if (this._view && this._webviewParticipant) {
            this._sendNotification(gatewayStatus, { status, authenticated });
        }
    }

    handleChatEvent(payload: ChatEventPayload): void {
        if (this._view && this._webviewParticipant) {
            this._sendNotification(chatEvent, payload as any);
        }
    }

    async refresh(): Promise<void> {
        // Trigger refresh
        if (this._view) {
            this._view.webview.html = this._getHtmlForWebview(this._view.webview);
        }
    }

    clearChat(): void {
        if (this._webviewParticipant) {
            this._messenger.sendNotification(
                { method: VSCODE_MESSAGES.CLEAR_CHAT },
                this._webviewParticipant,
                undefined
            );
        }
    }

    // ========================================================================
    // HTML Generation
    // ========================================================================

    private _getHtmlForWebview(webview: vscode.Webview): string {
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'pack', 'chatPanel.js')
        );
        const nonce = getNonce();

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1,shrink-to-fit=no">
    <title>OpenClaw Chat</title>
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'nonce-${nonce}'; style-src ${webview.cspSource} 'unsafe-inline';">
</head>
<body>
    <div id="root"></div>
    <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
    }
}

function getNonce(): string {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

/**
 * Gateway Status Bar Item
 * @module openclaw-vscode-extension/utils/gateway-status-bar
 */

import * as vscode from 'vscode';
import { ConnectionStatus } from 'openclaw-vscode-common';

/**
 * Status bar item for Gateway connection status
 */
export class GatewayStatusBar implements vscode.Disposable {
    private statusBarItem: vscode.StatusBarItem;

    constructor() {
        this.statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Right,
            100
        );
        this.setStatus('disconnected', false);
        this.statusBarItem.show();
    }

    /**
     * Update status bar display
     */
    setStatus(status: ConnectionStatus, authenticated: boolean): void {
        let text: string;
        let tooltip: string;
        let color: vscode.ThemeColor | undefined;

        switch (status) {
            case 'connected':
                if (authenticated) {
                    text = '$(check) OpenClaw';
                    tooltip = 'OpenClaw Gateway: Connected';
                    color = undefined;
                } else {
                    text = '$(sync~spin) OpenClaw';
                    tooltip = 'OpenClaw Gateway: Authenticating...';
                    color = new vscode.ThemeColor('statusBarItem.warningBackground');
                }
                break;
            case 'connecting':
                text = '$(sync~spin) OpenClaw';
                tooltip = 'OpenClaw Gateway: Connecting...';
                color = new vscode.ThemeColor('statusBarItem.warningBackground');
                break;
            case 'disconnected':
                text = '$(circle-slash) OpenClaw';
                tooltip = 'OpenClaw Gateway: Disconnected (click to connect)';
                color = new vscode.ThemeColor('statusBarItem.errorBackground');
                break;
            case 'error':
                text = '$(error) OpenClaw';
                tooltip = 'OpenClaw Gateway: Connection Error';
                color = new vscode.ThemeColor('statusBarItem.errorBackground');
                break;
            default:
                text = 'OpenClaw';
                tooltip = 'OpenClaw Gateway';
                color = undefined;
        }

        this.statusBarItem.text = text;
        this.statusBarItem.tooltip = tooltip;
        this.statusBarItem.backgroundColor = color;
        this.statusBarItem.command = 'openclaw.gateway.connect';
    }

    dispose(): void {
        this.statusBarItem.dispose();
    }
}

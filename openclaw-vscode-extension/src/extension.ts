/**
 * OpenClaw VSCode Extension Entry Point
 * @module openclaw-vscode-extension
 */

import * as vscode from 'vscode';
import { Messenger } from 'vscode-messenger';
import { 
    GatewayClient, 
    readOpenClawConfig, 
    configExists,
    GatewayConfig
} from 'openclaw-vscode-common';
import { ChatViewProvider } from './chat-explorer/chat-view-provider';
import { GatewayStatusBar } from './utils/gateway-status-bar';

// Global instances
export const messenger = new Messenger({ ignoreHiddenViews: false });
let gatewayClient: GatewayClient | null = null;
let chatProvider: ChatViewProvider | null = null;
let statusBarItem: GatewayStatusBar | null = null;

export async function activate(context: vscode.ExtensionContext): Promise<void> {
    console.log('[OpenClaw] Extension activating...');

    // Create status bar item
    statusBarItem = new GatewayStatusBar();
    context.subscriptions.push(statusBarItem);

    // Register chat view provider
    chatProvider = new ChatViewProvider(
        context.extensionUri,
        messenger
    );
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            ChatViewProvider.viewType, 
            chatProvider
        )
    );

    // Register commands
    registerCommands(context);

    // Check configuration and connect
    await initializeGateway(context);

    console.log('[OpenClaw] Extension activated');
}

function registerCommands(context: vscode.ExtensionContext): void {
    // Refresh command
    context.subscriptions.push(
        vscode.commands.registerCommand('openclaw.refresh', async () => {
            if (chatProvider) {
                await chatProvider.refresh();
            }
        })
    );

    // Clear chat command
    context.subscriptions.push(
        vscode.commands.registerCommand('openclaw.clearChat', () => {
            if (chatProvider) {
                chatProvider.clearChat();
            }
        })
    );

    // Connect command
    context.subscriptions.push(
        vscode.commands.registerCommand('openclaw.gateway.connect', async () => {
            await connectToGateway();
        })
    );

    // Disconnect command
    context.subscriptions.push(
        vscode.commands.registerCommand('openclaw.gateway.disconnect', () => {
            disconnectFromGateway();
        })
    );
}

async function initializeGateway(context: vscode.ExtensionContext): Promise<void> {
    // Check if config exists
    if (!configExists()) {
        showConfigNotFoundMessage();
        statusBarItem?.setStatus('disconnected', false);
        return;
    }

    // Read config
    const config = readOpenClawConfig();
    if (!config) {
        vscode.window.showErrorMessage('Failed to read OpenClaw configuration');
        statusBarItem?.setStatus('error', false);
        return;
    }

    // Try to connect
    await connectToGateway(config);
}

async function connectToGateway(config?: GatewayConfig): Promise<void> {
    if (gatewayClient?.isAuthenticated()) {
        vscode.window.showInformationMessage('Already connected to Gateway');
        return;
    }

    // Get config if not provided
    if (!config) {
        if (!configExists()) {
            showConfigNotFoundMessage();
            return;
        }
        config = readOpenClawConfig() || undefined;
        if (!config) {
            vscode.window.showErrorMessage('Failed to read OpenClaw configuration');
            return;
        }
    }

    // Disconnect existing client
    if (gatewayClient) {
        gatewayClient.disconnect();
    }

    // Create new client
    gatewayClient = new GatewayClient(config);
    
    // Set up status handler
    gatewayClient.onStatus((status) => {
        const authenticated = gatewayClient?.isAuthenticated() ?? false;
        statusBarItem?.setStatus(status, authenticated);
        
        // Update chat provider
        if (chatProvider) {
            chatProvider.setGatewayStatus(status, authenticated);
        }
    });

    // Set up chat handler
    gatewayClient.onChat((payload) => {
        if (chatProvider) {
            chatProvider.handleChatEvent(payload);
        }
    });

    // Connect
    try {
        statusBarItem?.setStatus('connecting', false);
        await gatewayClient.connect();
        
        // Get agents after connection
        const agents = await gatewayClient.getAgents();
        if (chatProvider) {
            chatProvider.setAgents(agents);
        }
        
        vscode.window.showInformationMessage('Connected to OpenClaw Gateway');
    } catch (error) {
        console.error('[OpenClaw] Failed to connect:', error);
        vscode.window.showErrorMessage(`Failed to connect to Gateway: ${error}`);
        statusBarItem?.setStatus('error', false);
    }
}

function disconnectFromGateway(): void {
    if (gatewayClient) {
        gatewayClient.disconnect();
        gatewayClient = null;
    }
    
    if (chatProvider) {
        chatProvider.setAgents([]);
        chatProvider.setGatewayStatus('disconnected', false);
    }
    
    vscode.window.showInformationMessage('Disconnected from Gateway');
}

function showConfigNotFoundMessage(): void {
    vscode.window.showWarningMessage(
        'OpenClaw configuration not found. Please run `openclaw init` first.',
        'Learn More'
    ).then(selection => {
        if (selection === 'Learn More') {
            vscode.env.openExternal(
                vscode.Uri.parse('https://github.com/openclaw/openclaw#configuration')
            );
        }
    });
}

export async function deactivate(): Promise<void> {
    console.log('[OpenClaw] Extension deactivating...');
    
    if (gatewayClient) {
        gatewayClient.disconnect();
        gatewayClient = null;
    }
    
    if (statusBarItem) {
        statusBarItem.dispose();
        statusBarItem = null;
    }
}

// Export for external access
export function getGatewayClient(): GatewayClient | null {
    return gatewayClient;
}
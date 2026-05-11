/**
 * OpenClaw Configuration Reader
 * @module openclaw-vscode-common/config
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { OpenClawConfig, GatewayConfig } from '../types/gateway';

/**
 * Default OpenClaw configuration
 */
const DEFAULT_CONFIG: GatewayConfig = {
    gatewayUrl: 'ws://127.0.0.1:18789',
    gatewayToken: ''
};

/**
 * Read OpenClaw configuration from ~/.openclaw/openclaw.json
 * @returns Gateway configuration or null if file not found
 */
export function readOpenClawConfig(): GatewayConfig | null {
    const configPath = getConfigPath();
    
    if (!fs.existsSync(configPath)) {
        console.warn(`[OpenClaw] Config file not found: ${configPath}`);
        return null;
    }
    
    try {
        const content = fs.readFileSync(configPath, 'utf-8');
        const config: OpenClawConfig = JSON.parse(content);
        
        const host = config.gateway?.host || '127.0.0.1';
        const port = config.gateway?.port || 18789;
        const token = config.gateway?.auth?.token || config.gateway?.token || '';
        
        return {
            gatewayUrl: `ws://${host}:${port}`,
            gatewayToken: token
        };
    } catch (error) {
        console.error(`[OpenClaw] Failed to read config: ${error}`);
        return null;
    }
}

/**
 * Get the path to OpenClaw configuration file
 */
export function getConfigPath(): string {
    // Check environment variable first
    const envPath = process.env.OPENCLAW_CONFIG_PATH;
    if (envPath) {
        return envPath;
    }
    
    // Default path
    return path.join(os.homedir(), '.openclaw', 'openclaw.json');
}

/**
 * Check if OpenClaw configuration exists
 */
export function configExists(): boolean {
    return fs.existsSync(getConfigPath());
}

/**
 * Get default configuration
 */
export function getDefaultConfig(): GatewayConfig {
    return { ...DEFAULT_CONFIG };
}

/**
 * Validate configuration
 */
export function validateConfig(config: GatewayConfig): boolean {
    if (!config.gatewayUrl) {
        return false;
    }
    
    // Check if URL is valid WebSocket URL
    try {
        const url = new URL(config.gatewayUrl);
        return url.protocol === 'ws:' || url.protocol === 'wss:';
    } catch {
        return false;
    }
}
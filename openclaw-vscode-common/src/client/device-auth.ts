/**
 * Device Auth Payload Builder for Gateway Protocol
 * @module openclaw-vscode-common/client/device-auth
 */

export interface DeviceAuthPayloadParams {
    deviceId: string;
    clientId: string;
    clientMode: string;
    role: string;
    scopes: string[];
    signedAtMs: number;
    token?: string | null;
    nonce: string;
}

/**
 * Build device auth payload string
 * Format: v2|{deviceId}|{clientId}|{clientMode}|{role}|{scopes.join(",")}|{signedAtMs}|{token}|{nonce}
 */
export function buildDeviceAuthPayload(params: DeviceAuthPayloadParams): string {
    return [
        'v2',
        params.deviceId,
        params.clientId,
        params.clientMode,
        params.role,
        params.scopes.join(','),
        String(params.signedAtMs),
        params.token ?? '',
        params.nonce
    ].join('|');
}

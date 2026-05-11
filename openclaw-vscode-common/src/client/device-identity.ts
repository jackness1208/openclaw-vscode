/**
 * Device Identity Management for VS Code Extension
 * Uses Ed25519 key pairs for Gateway device authentication
 * Compatible with OpenClaw Gateway device auth protocol
 * @module openclaw-vscode-common/client/device-identity
 */

import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface DeviceIdentity {
    deviceId: string;
    publicKey: string;
    privateKey: string;
}

interface StoredIdentity {
    version: 1;
    deviceId: string;
    publicKey: string;
    privateKey: string;
    createdAtMs: number;
}

const STORAGE_DIR = path.join(os.homedir(), '.openclaw');
const STORAGE_FILE = path.join(STORAGE_DIR, 'vscode-device-identity.json');

/**
 * Base64URL encode (URL-safe)
 */
function base64UrlEncode(buffer: Buffer): string {
    return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

/**
 * Base64URL decode
 */
function base64UrlDecode(input: string): Buffer {
    const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
    return Buffer.from(padded, 'base64');
}

/**
 * Compute public key fingerprint (SHA-256 hex)
 */
function fingerprintPublicKey(publicKey: Buffer): string {
    return crypto.createHash('sha256').update(publicKey).digest('hex');
}

/**
 * Generate a new Ed25519 key pair
 */
function generateIdentity(): DeviceIdentity {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');

    const publicKeyRaw = publicKey.export({ type: 'spki', format: 'der' }).subarray(-32);
    const privateKeyRaw = privateKey.export({ type: 'pkcs8', format: 'der' }).subarray(-32);

    const deviceId = fingerprintPublicKey(publicKeyRaw);

    console.log('[DeviceIdentity] Generated new deviceId:', deviceId);

    return {
        deviceId,
        publicKey: base64UrlEncode(publicKeyRaw),
        privateKey: base64UrlEncode(privateKeyRaw)
    };
}

/**
 * Load or create device identity, persisted to ~/.openclaw/vscode-device-identity.json
 */
export function loadOrCreateDeviceIdentity(): DeviceIdentity {
    try {
        if (fs.existsSync(STORAGE_FILE)) {
            const raw = fs.readFileSync(STORAGE_FILE, 'utf-8');
            const parsed = JSON.parse(raw) as StoredIdentity;

            if (
                parsed?.version === 1 &&
                typeof parsed.deviceId === 'string' &&
                typeof parsed.publicKey === 'string' &&
                typeof parsed.privateKey === 'string'
            ) {
                // Verify deviceId matches public key
                const derivedDeviceId = fingerprintPublicKey(base64UrlDecode(parsed.publicKey));
                if (derivedDeviceId !== parsed.deviceId) {
                    console.warn('[DeviceIdentity] deviceId mismatch, recalculating');
                    const updated = { ...parsed, deviceId: derivedDeviceId };
                    fs.writeFileSync(STORAGE_FILE, JSON.stringify(updated, null, 2), 'utf-8');
                    return {
                        deviceId: derivedDeviceId,
                        publicKey: parsed.publicKey,
                        privateKey: parsed.privateKey
                    };
                }

                console.log('[DeviceIdentity] Loaded existing device identity:', parsed.deviceId);
                return {
                    deviceId: parsed.deviceId,
                    publicKey: parsed.publicKey,
                    privateKey: parsed.privateKey
                };
            }
        }
    } catch (error) {
        console.error('[DeviceIdentity] Failed to load from file:', error);
    }

    // Generate new identity
    const identity = generateIdentity();

    // Ensure directory exists
    if (!fs.existsSync(STORAGE_DIR)) {
        fs.mkdirSync(STORAGE_DIR, { recursive: true });
    }

    fs.writeFileSync(
        STORAGE_FILE,
        JSON.stringify({
            version: 1,
            deviceId: identity.deviceId,
            publicKey: identity.publicKey,
            privateKey: identity.privateKey,
            createdAtMs: Date.now()
        } satisfies StoredIdentity, null, 2),
        'utf-8'
    );

    return identity;
}

/**
 * Sign a payload string with Ed25519 private key
 */
export function signDevicePayload(privateKeyBase64Url: string, payload: string): string {
    const privateKeyRaw = base64UrlDecode(privateKeyBase64Url);

    // Reconstruct the PKCS8 DER wrapper for Ed25519
    // Ed25519 PKCS8 prefix (16 bytes) + 32-byte seed
    const pkcs8Prefix = Buffer.from(
        '302e020100300506032b657004220420',
        'hex'
    );
    const pkcs8Der = Buffer.concat([pkcs8Prefix, privateKeyRaw]);

    const keyObject = crypto.createPrivateKey({
        key: pkcs8Der,
        format: 'der',
        type: 'pkcs8'
    });

    const signature = crypto.sign(null, Buffer.from(payload, 'utf-8'), keyObject);
    return base64UrlEncode(signature);
}

/**
 * Ephemeral QR Generator - Self-Destructing Mission Codes
 * Génère des QR à usage unique avec auto-destruction après scan
 */

import { hkdf } from '@noble/hashes/hkdf';
import { sha256 } from '@noble/hashes/sha2';
import type { Mission } from '../storage/db';

export interface CognitiveChallenge {
  timestamp: number;
  metrics?: {
    reactionTime: number;
    accuracy: number;
  };
  signature?: string;
  hash?: string;
}

interface EphemeralQRPayload {
  missionId: string;
  pilotCode: string;
  encryptedWaypoints: string;
  proofOfPresence: {
    timestamp: number;
    cognitiveHash: string;
    deviceId: string;
  };
  ephemeralKey: string;
  expiresAt: number;
  readToken: string;
  signature?: string;
}

export class EphemeralQRManager {
  private readTokenStore = new Map<string, { missionId: string; consumed: boolean }>();

  /**
   * Génère un QR mission avec auto-destruction
   */
  async generateEphemeralQR(
    mission: Mission,
    pilotDeviceId: string,
    cognitiveProof: CognitiveChallenge
  ): Promise<{ qrPayload: string; destructionKey: string }> {
    
    const ephemeralKey = await this.deriveEphemeralKey(
      mission.id,
      pilotDeviceId,
      Date.now()
    );

    const readToken = this.generateReadToken();

    const encryptedWaypoints = await this.encryptMissionData(
      mission.waypoints,
      ephemeralKey
    );

    const payload: EphemeralQRPayload = {
      missionId: mission.id,
      pilotCode: await this.obfuscatePilotCode(pilotDeviceId),
      encryptedWaypoints,
      proofOfPresence: {
        timestamp: Date.now(),
        cognitiveHash: await this.hashCognitiveProof(cognitiveProof),
        deviceId: await this.hashDeviceId(pilotDeviceId)
      },
      ephemeralKey: this.base64Encode(ephemeralKey),
      expiresAt: Date.now() + (30 * 60 * 1000), // 30 min max
      readToken
    };

    const signature = await this.signPayload(payload, pilotDeviceId);
    const signedPayload = { ...payload, signature };

    const destructionKey = await this.generateDestructionKey(readToken);
    const qrPayload = this.serializeForQR(signedPayload);

    await this.storeReadToken(readToken, mission.id);

    return { qrPayload, destructionKey };
  }

  /**
   * Vérifie et consomme le read token
   */
  async consumeQR(qrPayload: string): Promise<Mission | null> {
    try {
      const payload = this.deserializeQR(qrPayload) as EphemeralQRPayload;

      if (Date.now() > payload.expiresAt) {
        console.warn('QR expired');
        return null;
      }

      const isConsumed = await this.checkReadToken(payload.readToken);
      if (isConsumed) {
        console.error('QR already consumed - Replay attack detected');
        return null;
      }

      await this.markTokenConsumed(payload.readToken);

      const waypoints = await this.decryptMissionData(
        payload.encryptedWaypoints,
        this.base64Decode(payload.ephemeralKey)
      );

      return {
        id: payload.missionId,
        name: 'Imported Mission', 
        waypoints,
        rules: { 
          maxSpeed: 0,
          returnToHome: true,
          autoLand: true
        },
        createdAt: Date.now(),
        status: 'active'
      } as Mission;
    } catch (e) {
      console.error('Error consuming QR:', e);
      return null;
    }
  }

  /**
   * Auto-destruction du QR après read
   */
  async destroyQR(destructionKey: string, missionId: string): Promise<void> {
    await this.deleteReadToken(destructionKey);
    this.secureMemoryWipe(destructionKey);
    console.log(`QR destroyed for mission ${missionId}`);
  }

  private async deriveEphemeralKey(
    missionId: string,
    deviceId: string,
    timestamp: number
  ): Promise<Uint8Array> {
    const ikm = new TextEncoder().encode(`${deviceId}:${missionId}:${timestamp}`);
    const salt = crypto.getRandomValues(new Uint8Array(32));
    const info = new TextEncoder().encode('HCS-EPHEMERAL-KEY');
    
    return hkdf(sha256, ikm, salt, info, 32);
  }

  private generateReadToken(): string {
    const randomBytes = crypto.getRandomValues(new Uint8Array(32));
    return this.base64Encode(randomBytes);
  }

  private async encryptMissionData(
    waypoints: Mission['waypoints'],
    key: Uint8Array
  ): Promise<string> {
    const data = JSON.stringify(waypoints);
    const dataBuffer = new TextEncoder().encode(data);
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      new Uint8Array(key).buffer as ArrayBuffer,
      'AES-GCM',
      false,
      ['encrypt']
    );

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      dataBuffer
    );

    const combined = new Uint8Array(iv.length + ciphertext.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(ciphertext), iv.length);

    return this.base64Encode(combined);
  }

  private async decryptMissionData(
    encrypted: string,
    key: Uint8Array
  ): Promise<Mission['waypoints']> {
    const combined = this.base64Decode(encrypted);
    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      new Uint8Array(key).buffer as ArrayBuffer,
      'AES-GCM',
      false,
      ['decrypt']
    );

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      ciphertext
    );

    const json = new TextDecoder().decode(decrypted);
    return JSON.parse(json);
  }

  private async obfuscatePilotCode(deviceId: string): Promise<string> {
    const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(deviceId));
    const hashArray = new Uint8Array(hashBuffer);
    return this.base64Encode(hashArray).slice(0, 16);
  }

  private async hashCognitiveProof(proof: CognitiveChallenge): Promise<string> {
    const proofJson = JSON.stringify(proof);
    const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(proofJson));
    return this.base64Encode(new Uint8Array(hashBuffer));
  }

  private async hashDeviceId(deviceId: string): Promise<string> {
    const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(deviceId));
    return this.base64Encode(new Uint8Array(hashBuffer)).slice(0, 12);
  }

  private async generateDestructionKey(readToken: string): Promise<string> {
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(readToken),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign(
      'HMAC',
      key,
      new TextEncoder().encode('DESTRUCTION_KEY')
    );

    return this.base64Encode(new Uint8Array(signature));
  }

  private async storeReadToken(token: string, missionId: string): Promise<void> {
    this.readTokenStore.set(token, { missionId, consumed: false });
  }

  private async checkReadToken(token: string): Promise<boolean> {
    const entry = this.readTokenStore.get(token);
    return entry ? entry.consumed : true; 
  }

  private async markTokenConsumed(token: string): Promise<void> {
    const entry = this.readTokenStore.get(token);
    if (entry) {
      entry.consumed = true;
    }
  }

  private async deleteReadToken(destructionKey: string): Promise<void> {
    for (const [token] of this.readTokenStore.entries()) {
      const expectedKey = await this.generateDestructionKey(token);
      if (expectedKey === destructionKey) {
        this.readTokenStore.delete(token);
        break;
      }
    }
  }

  private secureMemoryWipe(_data: string): void {
    // No-op in JS, rely on GC
  }

  private base64Encode(buffer: Uint8Array): string {
    let binary = '';
    const len = buffer.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(buffer[i]);
    }
    return btoa(binary);
  }

  private base64Decode(base64: string): Uint8Array {
    const binary_string = atob(base64);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes;
  }

  private serializeForQR(payload: EphemeralQRPayload): string {
    return JSON.stringify(payload);
  }

  private deserializeQR(qrPayload: string): unknown {
    return JSON.parse(qrPayload);
  }

  private async signPayload(payload: EphemeralQRPayload, deviceId: string): Promise<string> {
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(deviceId),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign(
      'HMAC',
      key,
      new TextEncoder().encode(JSON.stringify(payload))
    );

    return this.base64Encode(new Uint8Array(signature));
  }
}

export const ephemeralQR = new EphemeralQRManager();

/**
 * Duress Manager - Plausible Deniability System
 * Active un profil factice en cas de coercition
 */

import type { UserProfile, Mission } from '../storage/db';

interface DecoyData {
  profile: UserProfile;
  missions: Mission[];
}

export class DuressManager {
  private readonly DURESS_MARKER = 'DURESS_ACTIVE';
  private readonly DURESS_SESSION_PIN = 'DURESS_SESSION_PIN';
  private readonly STORAGE_DURESS_HASH = 'HCS_DURESS_HASH';
  private readonly STORAGE_NORMAL_HASH = 'HCS_NORMAL_HASH';
  private readonly STORAGE_DECOY_DATA = 'HCS_DECOY_DATA';

  /**
   * Configure le mode duress lors de l'enrollment
   */
  async setupDuressMode(
    normalPin: string,
    normalProfile: UserProfile
  ): Promise<string> {
    const duressPin = this.generateDuressPin(normalPin);
    
    const decoyData: DecoyData = {
      profile: this.generateDecoyProfile(normalProfile),
      missions: this.generateDecoyMissions()
    };
    
    const normalHash = await this.hashPin(normalPin);
    const duressHash = await this.hashPin(duressPin);
    
    await this.storeDecoyData(decoyData, duressPin);
    
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.STORAGE_NORMAL_HASH, normalHash);
      localStorage.setItem(this.STORAGE_DURESS_HASH, duressHash);
    }
    
    return duressPin;
  }

  /**
   * Vérifie si PIN saisi active mode duress
   */
  async checkDuressActivation(enteredPin: string): Promise<'NORMAL' | 'DURESS'> {
    if (typeof window === 'undefined') throw new Error('Client side only');

    const enteredHash = await this.hashPin(enteredPin);
    const normalHash = localStorage.getItem(this.STORAGE_NORMAL_HASH);
    const duressHash = localStorage.getItem(this.STORAGE_DURESS_HASH);
    
    if (duressHash && enteredHash === duressHash) {
      await this.activateDuressMode(enteredPin);
      return 'DURESS';
    }
    
    if (normalHash && enteredHash === normalHash) {
      await this.deactivateDuressMode();
      return 'NORMAL';
    }
    
    throw new Error('Invalid PIN');
  }

  private async activateDuressMode(pin: string): Promise<void> {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(this.DURESS_MARKER, 'true');
      sessionStorage.setItem(this.DURESS_SESSION_PIN, pin);
    }
    await this.logDuressActivation();
  }

  private async deactivateDuressMode(): Promise<void> {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(this.DURESS_MARKER);
      sessionStorage.removeItem(this.DURESS_SESSION_PIN);
    }
  }

  isDuressActive(): boolean {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem(this.DURESS_MARKER) === 'true';
    }
    return false;
  }

  isConfigured(): boolean {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(this.STORAGE_NORMAL_HASH) !== null;
    }
    return false;
  }

  async getProfile(): Promise<UserProfile | null> {
    if (this.isDuressActive()) {
      const decoy = await this.loadDecoyData();
      return decoy ? decoy.profile : null;
    }
    return null;
  }

  async getMissions(): Promise<Mission[]> {
    if (this.isDuressActive()) {
      const decoy = await this.loadDecoyData();
      return decoy ? decoy.missions : [];
    }
    return [];
  }

  /**
   * Génère PIN duress (dernier chiffre +1)
   */
  private generateDuressPin(normalPin: string): string {
    const lastDigit = parseInt(normalPin.slice(-1));
    const newLastDigit = (lastDigit + 1) % 10;
    return normalPin.slice(0, -1) + newLastDigit;
  }

  /**
   * Génère profil cognitif factice (scores médiocres)
   */
  private generateDecoyProfile(realProfile: UserProfile): UserProfile {
    return {
      ...realProfile,
      id: 999,
      hcsCode: this.generateDecoyHcsCode(),
      cognitiveProfile: {
        reactionTime: {
          mean: 450,
          std: 120,
          best: 350,
          worst: 600,
          testCount: 5
        },
        memory: {
          accuracy: 0.65,
          testCount: 5
        },
        precision: {
          mean: 15,
          std: 8,
          testCount: 5
        },
        pattern: {
          accuracy: 0.70,
          testCount: 5
        },
        scroll: {
          regularity: 0.45,
          testCount: 5
        },
        coordination: {
          speed: 2.5,
          testCount: 5
        },
        stroop: {
          effect: 250,
          testCount: 5
        }
      },
      testHistory: this.generateDecoyTestHistory()
    };
  }

  private generateDecoyHcsCode(): string {
    return `HCS-U7|V:8.0|ALG:QS|E:M|MOD:c60f40m0|COG:F45C50V30S40Cr35|QSIG:decoy12345|B3:fake7890ab`;
  }

  private generateDecoyTestHistory(): Array<{ testType: string; timestamp: number; score: number }> {
    const now = Date.now();
    return [
      { testType: 'reaction', timestamp: now - 3600000 * 24 * 7, score: 450 },
      { testType: 'memory', timestamp: now - 3600000 * 24 * 6, score: 65 },
      { testType: 'tracing', timestamp: now - 3600000 * 24 * 5, score: 15 },
      { testType: 'pattern', timestamp: now - 3600000 * 24 * 4, score: 70 },
      { testType: 'scroll', timestamp: now - 3600000 * 24 * 3, score: 45 },
      { testType: 'coordination', timestamp: now - 3600000 * 24 * 2, score: 25 },
      { testType: 'color', timestamp: now - 3600000 * 24 * 1, score: 250 }
    ];
  }

  private generateDecoyMissions(): Mission[] {
    const baseLocation = { lat: 48.8566, lng: 2.3522 };
    
    return [
      {
        id: 'DECOY-TRAIN-001',
        name: 'Entraînement Vol Stationnaire',
        status: 'completed',
        createdAt: Date.now() - 3600000 * 24 * 14,
        waypoints: [
          { id: 'wp1', lat: baseLocation.lat, lng: baseLocation.lng, altitude: 50, order: 1, action: 'hover' },
          { id: 'wp2', lat: baseLocation.lat + 0.001, lng: baseLocation.lng, altitude: 50, order: 2, action: 'hover' },
        ],
        rules: {
          maxSpeed: 5,
          returnToHome: true,
          autoLand: true,
          geofenceRadius: 500
        }
      },
      {
        id: 'DECOY-RECON-001',
        name: 'Reconnaissance Zone Urbaine',
        status: 'completed',
        createdAt: Date.now() - 3600000 * 24 * 7,
        waypoints: [
          { id: 'wp1', lat: baseLocation.lat, lng: baseLocation.lng, altitude: 100, order: 1, action: 'hover' },
          { id: 'wp2', lat: baseLocation.lat + 0.002, lng: baseLocation.lng + 0.002, altitude: 100, order: 2, action: 'photo' },
        ],
        rules: {
          maxSpeed: 10,
          returnToHome: true,
          autoLand: true,
          geofenceRadius: 1000
        }
      },
      {
        id: 'DECOY-PENDING-001',
        name: 'Vol Test Batteries',
        status: 'pending',
        createdAt: Date.now() - 3600000 * 24 * 1,
        waypoints: [
          { id: 'wp1', lat: baseLocation.lat, lng: baseLocation.lng, altitude: 30, order: 1, action: 'hover' },
        ],
        rules: {
          maxSpeed: 3,
          returnToHome: true,
          autoLand: true,
          geofenceRadius: 100
        }
      }
    ];
  }

  private async hashPin(pin: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(pin);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return this.base64Encode(new Uint8Array(hashBuffer));
  }

  private async storeDecoyData(data: DecoyData, pin: string): Promise<void> {
    const json = JSON.stringify(data);
    const buffer = new TextEncoder().encode(json);
    
    const key = await this.derivePinKey(pin);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      buffer
    );
    
    const combined = this.combineIvAndCiphertext(iv, encrypted);
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.STORAGE_DECOY_DATA, this.base64Encode(new Uint8Array(combined)));
    }
  }

  private async loadDecoyData(): Promise<DecoyData | null> {
    if (typeof window === 'undefined') return null;
    
    const stored = localStorage.getItem(this.STORAGE_DECOY_DATA);
    const pin = sessionStorage.getItem(this.DURESS_SESSION_PIN);
    
    if (!stored || !pin) return null;
    
    try {
      const key = await this.derivePinKey(pin);
      const combined = this.base64Decode(stored);
      const { iv, ciphertext } = this.splitIvAndCiphertext(new Uint8Array(combined).buffer as ArrayBuffer);
      
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: new Uint8Array(iv) },
        key,
        ciphertext
      );
      
      const json = new TextDecoder().decode(decrypted);
      return JSON.parse(json);
    } catch (e) {
      console.error('Decoy data decryption failed', e);
      return null;
    }
  }

  private async derivePinKey(pin: string): Promise<CryptoKey> {
    const pinData = new TextEncoder().encode(pin);
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      pinData,
      'PBKDF2',
      false,
      ['deriveKey']
    );
    
    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: new TextEncoder().encode('HCS-U7-DURESS-SALT'),
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  private async logDuressActivation(): Promise<void> {
    const log = {
      timestamp: Date.now(),
      event: 'DURESS_ACTIVATED',
      userAgent: navigator.userAgent,
      platform: navigator.platform
    };
    console.log('[DURESS] Mode activated:', log);
  }

  private combineIvAndCiphertext(iv: Uint8Array, ciphertext: ArrayBuffer): ArrayBuffer {
    const combined = new Uint8Array(iv.length + ciphertext.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(ciphertext), iv.length);
    return combined.buffer;
  }

  private splitIvAndCiphertext(data: ArrayBuffer): { iv: Uint8Array; ciphertext: ArrayBuffer } {
    const combined = new Uint8Array(data);
    return {
      iv: combined.slice(0, 12),
      ciphertext: combined.slice(12).buffer as ArrayBuffer
    };
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
}

export const duressManager = new DuressManager();

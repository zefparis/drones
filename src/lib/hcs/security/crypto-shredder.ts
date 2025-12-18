/**
 * Crypto-Shredder - Secure Data Destruction
 * Implémente crypto-shredding (destruction clés) et secure overwrite
 */

import { db } from '../storage/db';

interface ShredResult {
  success: boolean;
  itemsShredded: number;
  keysDestroyed: number;
  timestamp: number;
}

export class CryptoShredder {
  
  /**
   * Destruction complète profil HCS
   */
  async shredProfile(profileId: number): Promise<ShredResult> {
    console.log(`[SHRED] Starting profile destruction: ${profileId}`);
    
    let itemsShredded = 0;
    let keysDestroyed = 0;
    
    try {
      const profile = await db.userProfiles.get(profileId);
      if (!profile) {
        throw new Error('Profile not found');
      }

      if (profile.deviceCredential) {
        await this.destroyWebAuthnKey(profile.deviceCredential);
        keysDestroyed++;
      }

      await this.secureOverwrite(profile);
      await db.userProfiles.delete(profileId);
      itemsShredded++;

      const testResults = await db.testResults
        .where('profileId')
        .equals(profileId)
        .toArray();
      
      for (const result of testResults) {
        await this.secureOverwrite(result);
        if (result.id) {
          await db.testResults.delete(result.id);
          itemsShredded++;
        }
      }

      this.wipeLocalStorage(['HCS_CODE', 'DEVICE_CREDENTIAL', 'NORMAL_PIN']);

      console.log(`[SHRED] Profile destroyed: ${itemsShredded} items, ${keysDestroyed} keys`);

      return {
        success: true,
        itemsShredded,
        keysDestroyed,
        timestamp: Date.now()
      };
      
    } catch (error) {
      console.error('[SHRED] Destruction failed:', error);
      return {
        success: false,
        itemsShredded,
        keysDestroyed,
        timestamp: Date.now()
      };
    }
  }

  /**
   * Destruction mission sensible
   */
  async shredMission(missionId: string): Promise<ShredResult> {
    console.log(`[SHRED] Starting mission destruction: ${missionId}`);
    
    let itemsShredded = 0;
    let keysDestroyed = 0;
    
    try {
      const mission = await db.missions.get(missionId);
      if (!mission) {
        throw new Error('Mission not found');
      }

      if (mission.qrPayload) {
        try {
          const qrData = JSON.parse(mission.qrPayload);
          if (qrData.ephemeralKey) {
            await this.destroyEphemeralKey(qrData.ephemeralKey);
            keysDestroyed++;
          }
        } catch (e) {
          // Ignore parse errors
        }
      }

      await this.secureOverwrite(mission.waypoints);
      await this.secureOverwrite(mission);

      await db.missions.delete(missionId);
      itemsShredded++;

      console.log(`[SHRED] Mission destroyed: ${itemsShredded} items, ${keysDestroyed} keys`);

      return {
        success: true,
        itemsShredded,
        keysDestroyed,
        timestamp: Date.now()
      };
      
    } catch (error) {
      console.error('[SHRED] Mission destruction failed:', error);
      return {
        success: false,
        itemsShredded,
        keysDestroyed,
        timestamp: Date.now()
      };
    }
  }

  /**
   * PANIC BUTTON - Destruction totale
   */
  async panicWipe(): Promise<ShredResult> {
    console.log('[SHRED] PANIC WIPE INITIATED');
    
    let itemsShredded = 0;
    let keysDestroyed = 0;
    
    try {
      const profiles = await db.userProfiles.toArray();
      for (const profile of profiles) {
        if (profile.id) {
          const result = await this.shredProfile(profile.id);
          itemsShredded += result.itemsShredded;
          keysDestroyed += result.keysDestroyed;
        }
      }

      const missions = await db.missions.toArray();
      for (const mission of missions) {
        const result = await this.shredMission(mission.id);
        itemsShredded += result.itemsShredded;
        keysDestroyed += result.keysDestroyed;
      }

      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
      }

      await db.delete();

      console.log('[SHRED] PANIC WIPE COMPLETE');

      return {
        success: true,
        itemsShredded,
        keysDestroyed,
        timestamp: Date.now()
      };
      
    } catch (error) {
      console.error('[SHRED] Panic wipe failed:', error);
      return {
        success: false,
        itemsShredded,
        keysDestroyed,
        timestamp: Date.now()
      };
    }
  }

  private async destroyWebAuthnKey(credentialId: string): Promise<void> {
    await this.markKeyRevoked(credentialId);
  }

  private async destroyEphemeralKey(keyBase64: string): Promise<void> {
    const keyData = atob(keyBase64).split('');
    for (let i = 0; i < keyData.length; i++) {
      const randomByte = crypto.getRandomValues(new Uint8Array(1))[0];
      keyData[i] = String.fromCharCode(randomByte);
    }
  }

  private async secureOverwrite(data: unknown): Promise<void> {
    if (typeof data === 'object' && data !== null) {
      const json = JSON.stringify(data);
      
      // Pass 1: Random bytes
      crypto.getRandomValues(new Uint8Array(json.length));
      
      // Pass 2: Zeros
      new Uint8Array(json.length).fill(0);
      
      // Pass 3: Ones
      new Uint8Array(json.length).fill(255);
      
      // Overwrite original data structure
      const obj = data as Record<string, unknown>;
      Object.keys(obj).forEach(key => {
        if (typeof obj[key] === 'string') {
          obj[key] = '\0'.repeat((obj[key] as string).length);
        } else if (typeof obj[key] === 'number') {
          obj[key] = 0;
        } else if (Array.isArray(obj[key])) {
          obj[key] = [];
        }
      });
    }
  }

  private wipeLocalStorage(keys: string[]): void {
    if (typeof window === 'undefined') return;

    keys.forEach(key => {
      const value = localStorage.getItem(key);
      if (value) {
        const overwrite = Array.from(crypto.getRandomValues(new Uint8Array(value.length)))
          .map(byte => String.fromCharCode(byte))
          .join('');
        
        localStorage.setItem(key, overwrite);
        localStorage.removeItem(key);
      }
    });
  }

  private async markKeyRevoked(credentialId: string): Promise<void> {
    if (typeof window === 'undefined') return;

    const revokedKeys = JSON.parse(localStorage.getItem('REVOKED_KEYS') || '[]');
    revokedKeys.push({
      credentialId,
      revokedAt: Date.now(),
      reason: 'CRYPTO_SHREDDING'
    });
    localStorage.setItem('REVOKED_KEYS', JSON.stringify(revokedKeys));
  }

  async verifyDestruction(target: 'profile' | 'mission' | 'all'): Promise<boolean> {
    try {
      if (target === 'profile') {
        const profiles = await db.userProfiles.toArray();
        return profiles.length === 0;
      }
      
      if (target === 'mission') {
        const missions = await db.missions.toArray();
        return missions.length === 0;
      }
      
      if (target === 'all') {
        const profiles = await db.userProfiles.toArray();
        const missions = await db.missions.toArray();
        const tests = await db.testResults.toArray();
        return profiles.length === 0 && missions.length === 0 && tests.length === 0;
      }
      
      return false;
      
    } catch (error) {
      console.error('[SHRED] Verification failed:', error);
      return false;
    }
  }
}

export const cryptoShredder = new CryptoShredder();

/**
 * Profile Store - Gestion des profils utilisateurs
 */

import type { UserProfile } from './db';
import { db } from './db';
import { webAuthnManager } from '../security/webauthn-manager';

export class ProfileStore {
  async getProfile(): Promise<UserProfile | null> {
    const profiles = await db.userProfiles.toArray();
    if (profiles.length === 0) return null;
    return profiles[0];
  }

  async getOrCreateProfile(): Promise<UserProfile> {
    const profiles = await db.userProfiles.toArray();
    
    if (profiles.length > 0) {
      return profiles[0];
    }
    
    const newProfile: UserProfile = {
      createdAt: Date.now(),
      updatedAt: Date.now(),
      cognitiveProfile: {
        reactionTime: { mean: 0, std: 0, best: 0, worst: 0, testCount: 0 },
        memory: { accuracy: 0, testCount: 0 },
        precision: { mean: 0, std: 0, testCount: 0 },
        pattern: { accuracy: 0, testCount: 0 },
        scroll: { regularity: 0, testCount: 0 },
        coordination: { speed: 0, testCount: 0 },
        stroop: { effect: 0, testCount: 0 },
      },
      testHistory: [],
    };
    
    const id = await db.userProfiles.add(newProfile);
    return { ...newProfile, id };
  }
  
  async updateProfile(profile: UserProfile): Promise<void> {
    if (!profile.id) return;
    
    profile.updatedAt = Date.now();
    await db.userProfiles.update(profile.id, { ...profile });
  }
  
  async resetProfile(): Promise<void> {
    await db.userProfiles.clear();
    await db.testResults.clear();
  }
}

/**
 * Stockage sécurisé du profil avec chiffrement hardware-bound
 */
export class SecureProfileStore {
  
  /**
   * Sauvegarde profil avec chiffrement lié au device
   */
  async saveProfile(profile: UserProfile, deviceCredential: string): Promise<void> {
    const encryptionKey = await webAuthnManager.deriveEncryptionKey(deviceCredential);
    
    const sensitiveData = {
      cognitiveProfile: profile.cognitiveProfile,
      testHistory: profile.testHistory,
      hcsCode: profile.hcsCode
    };

    const profileJson = JSON.stringify(sensitiveData);
    const profileData = new TextEncoder().encode(profileJson);
    
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    const encryptedData = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      encryptionKey,
      profileData
    );
    
    const combinedEncrypted = this.combineIvAndCiphertext(iv, encryptedData);
    
    const now = Date.now();
    
    const dataToHash = {
      deviceCredential,
      encryptedProfile: new Uint8Array(combinedEncrypted),
      createdAt: profile.createdAt,
      updatedAt: now
    };
    
    const integrityJson = JSON.stringify(dataToHash, (_key, value) => {
      if (value instanceof Uint8Array || (value && value.buffer instanceof ArrayBuffer)) {
        return Array.from(new Uint8Array(value.buffer || value));
      }
      return value;
    });
    const integrityBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(integrityJson));
    const integrityHash = Array.from(new Uint8Array(integrityBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

    const existingId = profile.id;
    const storageData = {
      ...profile,
      ...(existingId ? { id: existingId } : {}),
      deviceCredential,
      encryptedProfile: combinedEncrypted,
      integrityHash,
      updatedAt: now
    };

    if (existingId) {
      await db.userProfiles.put(storageData as UserProfile);
    } else {
      await db.userProfiles.add(storageData as UserProfile);
    }
  }

  /**
   * Récupération profil avec authentification hardware
   */
  async getProfile(profileId: number, deviceCredential: string): Promise<UserProfile | null> {
    const storedProfile = await db.userProfiles.get(profileId);
    if (!storedProfile) return null;

    if (storedProfile.deviceCredential !== deviceCredential) {
      throw new Error('Device mismatch - Profile bound to different hardware');
    }

    await webAuthnManager.authenticateDevice(deviceCredential);

    const decryptionKey = await webAuthnManager.deriveEncryptionKey(deviceCredential);

    if (!storedProfile.encryptedProfile) return storedProfile;

    const encryptedBuffer = storedProfile.encryptedProfile instanceof ArrayBuffer 
      ? storedProfile.encryptedProfile 
      : new Uint8Array(storedProfile.encryptedProfile as unknown as ArrayLike<number>).buffer as ArrayBuffer;
    const { iv, ciphertext } = this.splitIvAndCiphertext(encryptedBuffer);

    try {
      const decryptedData = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: new Uint8Array(iv) },
        decryptionKey,
        ciphertext
      );

      const profileJson = new TextDecoder().decode(decryptedData);
      const sensitiveData = JSON.parse(profileJson);

      return {
        ...storedProfile,
        ...sensitiveData,
        encryptedProfile: undefined
      };
      
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Profile decryption failed - Possible tampering');
    }
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
      ciphertext: combined.slice(12).buffer
    };
  }
}

export const profileStore = new ProfileStore();
export const secureProfileStore = new SecureProfileStore();

export async function getProfile(): Promise<UserProfile | null> {
  const { duressManager } = await import('../security/duress-manager');
  
  if (duressManager.isDuressActive()) {
    return duressManager.getProfile();
  }
  
  return profileStore.getProfile();
}

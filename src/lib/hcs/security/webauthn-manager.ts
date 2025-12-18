/**
 * WebAuthn Manager - Hardware-bound authentication
 * Utilise le TPM/Secure Enclave du device pour générer des clés non-extractibles
 */

interface WebAuthnCredential {
  credentialId: string;
  publicKey: ArrayBuffer;
  attestation?: ArrayBuffer;
}

export class WebAuthnManager {
  private readonly RP_NAME = 'HCS-SHIELD';
  private readonly RP_ID = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  
  /**
   * Enrollment - Création credential hardware
   */
  async enrollDevice(pilotId: string): Promise<WebAuthnCredential> {
    const challenge = crypto.getRandomValues(new Uint8Array(32));
    
    try {
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: {
            name: this.RP_NAME,
            id: this.RP_ID
          },
          user: {
            id: new TextEncoder().encode(pilotId),
            name: `pilot-${pilotId}`,
            displayName: `HCS Operator ${pilotId}` 
          },
          pubKeyCredParams: [
            { type: 'public-key', alg: -7 },  // ES256 (ECDSA P-256)
            { type: 'public-key', alg: -257 } // RS256 (RSA)
          ],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required',
            residentKey: 'required'
          },
          timeout: 60000,
          attestation: 'direct'
        }
      });

      if (!credential || credential.type !== 'public-key') {
        throw new Error('WebAuthn enrollment failed');
      }

      const pubKeyCred = credential as PublicKeyCredential;
      const response = pubKeyCred.response as AuthenticatorAttestationResponse;

      return {
        credentialId: this.bufferToBase64(pubKeyCred.rawId),
        publicKey: response.getPublicKey ? response.getPublicKey()! : new ArrayBuffer(0),
        attestation: response.attestationObject
      };
      
    } catch (error) {
      console.error('WebAuthn enrollment error:', error);
      throw new Error('Device binding failed - Hardware security not available');
    }
  }

  /**
   * Authentication - Challenge pour prouver possession device
   */
  async authenticateDevice(credentialId: string): Promise<ArrayBuffer> {
    const challenge = crypto.getRandomValues(new Uint8Array(32));
    
    try {
      const credential = await navigator.credentials.get({
        publicKey: {
          challenge,
          rpId: this.RP_ID,
          allowCredentials: [{
            id: this.base64ToBuffer(credentialId),
            type: 'public-key'
          }],
          userVerification: 'required',
          timeout: 60000
        }
      });

      if (!credential || credential.type !== 'public-key') {
        throw new Error('WebAuthn authentication failed');
      }

      const pubKeyCred = credential as PublicKeyCredential;
      const response = pubKeyCred.response as AuthenticatorAssertionResponse;

      return response.signature;
      
    } catch (error) {
      console.error('WebAuthn auth error:', error);
      throw new Error('Device authentication failed');
    }
  }

  /**
   * Dérive une clé de chiffrement à partir de la clé hardware
   */
  async deriveEncryptionKey(credentialId: string): Promise<CryptoKey> {
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      this.base64ToBuffer(credentialId),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: new TextEncoder().encode('HCS-U7-DEVICE-BINDING'),
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Vérifie si WebAuthn est disponible
   */
  isAvailable(): boolean {
    return window.PublicKeyCredential !== undefined &&
           typeof navigator.credentials?.create === 'function';
  }

  // Helpers
  private bufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private base64ToBuffer(base64: string): ArrayBuffer {
    const binary_string = atob(base64);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
  }
}

export const webAuthnManager = new WebAuthnManager();

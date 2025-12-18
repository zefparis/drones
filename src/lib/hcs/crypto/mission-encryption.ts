/**
 * Mission Encryption - AES-256-GCM with HKDF key derivation
 * Generates encrypted mission payloads for QR codes
 */

import { hkdf } from '@noble/hashes/hkdf';
import { sha256 } from '@noble/hashes/sha2';
import type { MissionData } from '../../../components/hcs/MissionPlanner';
import { B3Hash } from './b3-hash';
import { QSigLocal } from './qsig-local';

export interface EncryptedMissionPayload {
  version: string;
  encrypted: string;
  timestamp: number;
  expiration: number;
  token: string;
  hcsCode: string;
  hmac: string;
}

export interface CognitiveTestResults {
  stroop?: { score: number; avgReactionTime: number; stroopEffect: number };
  nback?: { score: number; dPrime: number };
  gonogo?: { score: number; inhibitionScore: number };
  trail?: { score: number; switchCost: number };
  digit?: { score: number; forwardSpan: number; backwardSpan: number };
  reaction?: { score: number; meanRT: number };
  visual?: { score: number; accuracy: number };
}

/**
 * Generate HCS-U7 Code from cognitive test results
 * Format: HCS-U7|V:8.0|ALG:QS|E:M|MOD:c75f25m0|COG:F97C100V7S15Cr36|QSIG:2ouz/n/kh/|B3:b1d985249e
 */
export async function generateHCSCode(results: CognitiveTestResults): Promise<string> {
  const scores = Object.values(results).filter(Boolean).map(r => r?.score ?? 0);
  
  if (scores.length < 5) {
    throw new Error('Minimum 5 cognitive tests required');
  }

  // Extract individual scores
  const cogScores = {
    F: results.stroop?.score ?? 0,       // Form (Stroop)
    C: results.nback?.score ?? 0,        // Concept (N-Back/Memory)
    V: results.visual?.score ?? 0,       // Vision (Visual Search)
    S: results.reaction?.score ?? 0,     // Speed (Reaction)
    Cr: results.trail?.score ?? 0        // Creativity (Trail Making)
  };

  // Generate B3-Hash (behavioral hash)
  const b3Hash = await B3Hash.generate({
    stroop: results.stroop,
    nback: results.nback,
    gonogo: results.gonogo,
    trail: results.trail,
    digit: results.digit,
    reaction: results.reaction,
    visual: results.visual
  });
  const b3Short = b3Hash.slice(0, 10).toLowerCase();

  // Generate QSIG (quantum-safe signature)
  const qsig = await QSigLocal.sign(JSON.stringify(results));
  const qsigShort = qsig.slice(0, 10).toLowerCase();

  // Calculate modulation (cognitive variability)
  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  const variance = scores.reduce((sum, score) => sum + Math.pow(score - avgScore, 2), 0) / scores.length;
  const stdDev = Math.sqrt(variance);
  
  // Modulation encoding
  const c = Math.round((1 - stdDev / 50) * 100);  // Consistency (0-100)
  const f = Math.round(stdDev);                    // Flexibility (0-100)
  const m = Math.round(avgScore - 50);             // Magnitude offset

  // Energy level (based on reaction time)
  const reactionScore = results.reaction?.score ?? 50;
  const energyLevel = reactionScore > 70 ? 'H' : reactionScore > 40 ? 'M' : 'L';

  // Assemble HCS-U7 code with pipe separators
  const hcsCode = [
    'HCS-U7',
    `V:8.0`,                                                    // Version
    `ALG:QS`,                                                   // Algorithm: Quantum-Safe
    `E:${energyLevel}`,                                         // Energy level
    `MOD:c${c}f${f}m${m}`,                                      // Modulation
    `COG:F${cogScores.F}C${cogScores.C}V${cogScores.V}S${cogScores.S}Cr${cogScores.Cr}`,  // Cognitive scores
    `QSIG:${qsigShort}`,                                        // Quantum signature
    `B3:${b3Short}`                                             // Behavioral hash
  ].join('|');

  return hcsCode;
}

/**
 * Encrypt mission data with AES-256-GCM
 */
export async function encryptMission(
  mission: MissionData, 
  hcsCode: string
): Promise<EncryptedMissionPayload> {
  const timestamp = Math.floor(Date.now() / 1000);
  const expiration = 30 * 60; // 30 minutes
  
  const token = await generateToken();
  
  const key = await deriveKey(hcsCode, timestamp);
  
  const missionJson = JSON.stringify({
    name: mission.name,
    type: mission.type,
    priority: mission.priority,
    waypoints: mission.waypoints.map(wp => ({
      lat: wp.lat,
      lon: wp.lon,
      alt: wp.alt,
      action: wp.action
    })),
    maxDuration: mission.maxDuration,
    gpsAllowed: mission.gpsAllowed
  });
  
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    new Uint8Array(key).buffer as ArrayBuffer,
    'AES-GCM',
    false,
    ['encrypt']
  );
  
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    new TextEncoder().encode(missionJson)
  );
  
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.length);
  
  const encrypted = arrayBufferToBase64(combined.buffer as ArrayBuffer);
  
  const hmac = await generateHMAC({
    encrypted,
    timestamp,
    token
  }, hcsCode);
  
  return {
    version: '1.0',
    encrypted,
    timestamp,
    expiration,
    token,
    hcsCode: await hashHcsCode(hcsCode),
    hmac
  };
}

/**
 * Generate QR data string from encrypted payload
 */
export function generateQRData(payload: EncryptedMissionPayload): string {
  return btoa(JSON.stringify(payload));
}

async function deriveKey(hcsCode: string, timestamp: number): Promise<Uint8Array> {
  const ikm = new TextEncoder().encode(`${hcsCode}:${timestamp}`);
  const salt = new TextEncoder().encode('HCS-MISSION-KEY');
  const info = new TextEncoder().encode('AES-256-GCM');
  
  return hkdf(sha256, ikm, salt, info, 32);
}

async function generateToken(): Promise<string> {
  const randomBytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function generateHMAC(
  data: { encrypted: string; timestamp: number; token: string },
  hcsCode: string
): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(hcsCode),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(JSON.stringify(data))
  );
  
  return arrayBufferToBase64(signature);
}

async function hashHcsCode(hcsCode: string): Promise<string> {
  const hashBuffer = await crypto.subtle.digest(
    'SHA-256', 
    new TextEncoder().encode(hcsCode)
  );
  return arrayBufferToBase64(hashBuffer).slice(0, 16);
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Mission Encryption - AES-256-GCM with HKDF key derivation
 * Generates encrypted mission payloads for QR codes
 */

import { hkdf } from '@noble/hashes/hkdf';
import { sha256 } from '@noble/hashes/sha2';
import type { MissionData } from '../../../components/hcs/MissionPlanner';

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
 */
export async function generateHCSCode(results: CognitiveTestResults): Promise<string> {
  const scores = Object.values(results).filter(Boolean).map(r => r?.score ?? 0);
  
  if (scores.length < 5) {
    throw new Error('Minimum 5 cognitive tests required');
  }

  const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  
  const stroopEffect = results.stroop?.stroopEffect ?? 0;
  const reactionTime = results.reaction?.meanRT ?? 300;
  const memorySpan = (results.digit?.forwardSpan ?? 4) + (results.digit?.backwardSpan ?? 3);
  const inhibition = results.gonogo?.inhibitionScore ?? 50;
  
  const modality = stroopEffect > 50 ? 'V' : reactionTime < 250 ? 'S' : 'C';
  const flexibility = Math.min(99, Math.round(((results.trail?.score ?? 50) + (results.nback?.dPrime ?? 1) * 20) / 2));
  
  const dataToHash = JSON.stringify({
    scores,
    avgScore,
    stroopEffect,
    reactionTime,
    memorySpan,
    inhibition,
    timestamp: Date.now()
  });
  
  const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(dataToHash));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const shortHash = hashArray.slice(0, 4).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
  
  return `F${avgScore}${modality}${memorySpan}S${flexibility}Cr${shortHash.slice(0, 2)}`;
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

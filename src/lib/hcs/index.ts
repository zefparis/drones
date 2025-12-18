/**
 * HCS-U7 Module - Export principal
 */

// Storage
export { db, getDeviceInfo } from './storage/db';
export type { TestResult, UserProfile, CognitiveProfile, Mission, MissionLog } from './storage/db';
export { profileStore, secureProfileStore, getProfile } from './storage/profile-store';
export { testResultsStore } from './storage/test-results-store';

// Crypto
export { b3Hash } from './crypto/b3-hash';
export { qsigLocal } from './crypto/qsig-local';
export { hcsGenerator } from './crypto/hcs-generator';

// Security
export { webAuthnManager } from './security/webauthn-manager';
export { duressManager } from './security/duress-manager';
export { cryptoShredder } from './security/crypto-shredder';
export { tamperDetector } from './security/tamper-detector';
export type { TamperCheck, TamperReport } from './security/tamper-detector';
export { ephemeralQR } from './security/ephemeral-qr';
export type { CognitiveChallenge } from './security/ephemeral-qr';

// Cognitive Tests
export { quickStroop } from './cognitive/quick-stroop';
export type { StroopTrial, StroopTrialResult, StroopResult } from './cognitive/quick-stroop';

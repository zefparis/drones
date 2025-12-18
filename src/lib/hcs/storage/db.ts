import Dexie, { type Table } from 'dexie';

/**
 * Résultat d'un test cognitif
 */
export interface TestResult {
  id?: number;
  profileId?: number;
  testType: 'reaction' | 'memory' | 'tracing' | 'pattern' | 'scroll' | 'coordination' | 'color';
  timestamp: number;
  duration?: number;
  score?: number;
  metadata: Record<string, unknown>;
  deviceInfo: {
    userAgent: string;
    screenWidth: number;
    screenHeight: number;
    pixelRatio: number;
  };
}

/**
 * Profil cognitif - 7 dimensions
 */
export interface CognitiveProfile {
  reactionTime: {
    mean: number;
    std: number;
    best: number;
    worst: number;
    testCount: number;
  };
  memory: {
    accuracy: number;
    testCount: number;
  };
  precision: {
    mean: number;
    std: number;
    testCount: number;
  };
  pattern: {
    accuracy: number;
    testCount: number;
  };
  scroll: {
    regularity: number;
    testCount: number;
  };
  coordination: {
    speed: number;
    testCount: number;
  };
  stroop: {
    effect: number;
    testCount: number;
  };
}

/**
 * Profil utilisateur avec code HCS-U7
 */
export interface UserProfile {
  id?: number;
  createdAt: number;
  updatedAt: number;
  hcsCode?: string;
  deviceCredential?: string;
  encryptedProfile?: ArrayBuffer;
  integrityHash?: string;
  cognitiveProfile?: CognitiveProfile;
  testHistory?: Array<{
    testType: string;
    timestamp: number;
    score: number;
  }>;
}

/**
 * Mission drone
 */
export interface Mission {
  id: string;
  name: string;
  pilotId?: number;
  pilotCode?: string;
  status: 'pending' | 'active' | 'completed' | 'aborted';
  createdAt: number;
  waypoints: Array<{
    id: string;
    lat: number;
    lng: number;
    altitude: number;
    order: number;
    action?: string;
  }>;
  rules: {
    maxSpeed: number;
    returnToHome: boolean;
    autoLand: boolean;
    geofenceRadius?: number;
  };
  qrPayload?: string;
}

/**
 * Log de mission anonymisé
 */
export interface MissionLog {
  id: string;
  missionHash: string;
  pilotFingerprint: string;
  timestamp: number;
  status: string;
  tacticSummary: {
    waypointCount: number;
    totalDistance: number;
    maxAltitude: number;
    duration: number;
    areaOfOperation: {
      centerLat: number;
      centerLng: number;
    };
  };
  performance: {
    completionRate: number;
    deviationScore: number;
    rthTriggered: boolean;
  };
}

/**
 * Database HCS-SHIELD
 */
export class HcsDatabase extends Dexie {
  testResults!: Table<TestResult, number>;
  userProfiles!: Table<UserProfile, number>;
  missions!: Table<Mission, string>;
  missionLogs!: Table<MissionLog, string>;

  constructor() {
    super('hcs-shield-drone');

    this.version(1).stores({
      testResults: '++id, profileId, testType, timestamp',
      userProfiles: '++id, createdAt, updatedAt',
      missions: 'id, createdAt, status, pilotCode, pilotId',
      missionLogs: 'id, timestamp, status, pilotFingerprint'
    });
  }
}

export const db = new HcsDatabase();

/**
 * Helper pour obtenir les infos device
 */
export function getDeviceInfo(): TestResult['deviceInfo'] {
  return {
    userAgent: navigator.userAgent,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    pixelRatio: window.devicePixelRatio || 1
  };
}

/**
 * HCS-SHIELD Types for CORTEX-U7
 * Cognitive authentication and bot detection
 */

export interface TouchData {
  x: number
  y: number
  pressure: number
  timestamp: number
  deltaTime: number
}

export interface QuickTestData {
  testType: 'reaction' | 'stroop' | 'pattern'
  duration: number
  touches: TouchData[]
  results: {
    reactionTime?: number
    accuracy?: number
    errors?: number
    stroopEffect?: number
  }
}

export type Classification = 'HUMAN' | 'BOT' | 'UNCERTAIN'
export type Recommendation = 'ALLOW' | 'BLOCK' | 'CHALLENGE_AGAIN'

export interface ShieldResult {
  classification: Classification
  humanScore: number
  confidence: number
  metrics: {
    reactionTime?: number
    regularity: number
    pressureVariance: number
    errorRate: number
  }
  humanIndicators: string[]
  botIndicators: string[]
  recommendation: Recommendation
  testCount: number
  isReliable: boolean
  timestamp: number
}

export interface CognitiveProfile {
  pilotId: string
  createdAt: number
  updatedAt: number
  hcsCode?: string
  
  reactionTime: {
    mean: number
    std: number
    best: number
    worst: number
    testCount: number
  }
  stroop: {
    effect: number
    accuracy: number
    testCount: number
  }
  pattern: {
    accuracy: number
    testCount: number
  }
}

export interface ShieldSession {
  sessionId: string
  startedAt: number
  tests: QuickTestData[]
  currentScore: number
  testCount: number
  aggregatedMetrics: {
    reactionTimes: number[]
    pressures: number[]
    regularities: number[]
    errorRates: number[]
    stroopEffects: number[]
  }
}

export const SHIELD_CONFIG = {
  // Thresholds
  HUMAN_THRESHOLD: 0.85,
  BOT_THRESHOLD: 0.6,
  
  // Confidence
  MIN_TESTS_FOR_RELIABLE: 2,
  MIN_TESTS_FOR_DEFINITIVE: 3,
  CONFIDENCE_PER_TEST: 0.25,
  MAX_CONFIDENCE: 0.95,
  
  // Reaction time bounds (ms)
  REACTION_MIN_HUMAN: 150,
  REACTION_MAX_HUMAN: 600,
  REACTION_SUSPICIOUS_FAST: 100,
  REACTION_SUSPICIOUS_SLOW: 800,
  
  // Stroop effect (ms) - humans slow down on incongruent
  STROOP_MIN_EFFECT: 30,
  STROOP_MAX_EFFECT: 200,
}

export const STROOP_COLORS = [
  { word: 'ROUGE', color: '#ef4444', actual: 'red' },
  { word: 'BLEU', color: '#3b82f6', actual: 'blue' },
  { word: 'VERT', color: '#22c55e', actual: 'green' },
  { word: 'JAUNE', color: '#eab308', actual: 'yellow' },
] as const

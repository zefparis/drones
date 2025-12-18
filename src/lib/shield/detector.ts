/**
 * HCS-SHIELD Bot Detector for CORTEX-U7
 * Progressive confidence analysis
 */

import type {
  QuickTestData,
  ShieldResult,
  ShieldSession,
  Classification,
  Recommendation,
} from './types'
import { SHIELD_CONFIG } from './types'

class ShieldDetector {
  private sessions: Map<string, ShieldSession> = new Map()

  getOrCreateSession(sessionId?: string): ShieldSession {
    const id = sessionId || crypto.randomUUID()

    if (!this.sessions.has(id)) {
      this.sessions.set(id, {
        sessionId: id,
        startedAt: Date.now(),
        tests: [],
        currentScore: 0.5,
        testCount: 0,
        aggregatedMetrics: {
          reactionTimes: [],
          pressures: [],
          regularities: [],
          errorRates: [],
          stroopEffects: [],
        },
      })
    }

    return this.sessions.get(id)!
  }

  async analyze(testData: QuickTestData, sessionId?: string): Promise<ShieldResult> {
    const session = this.getOrCreateSession(sessionId)

    session.tests.push(testData)
    session.testCount++

    // Extract metrics
    const reactionTime = testData.results.reactionTime ?? testData.duration
    const pressureVariance = this.calculatePressureVariance(testData.touches)
    const regularity = this.calculateRegularity(testData.touches)
    const errorRate = testData.results.errors ?? 0

    // Store in session
    session.aggregatedMetrics.reactionTimes.push(reactionTime)
    session.aggregatedMetrics.pressures.push(pressureVariance)
    session.aggregatedMetrics.regularities.push(regularity)
    session.aggregatedMetrics.errorRates.push(errorRate)

    if (testData.results.stroopEffect !== undefined) {
      session.aggregatedMetrics.stroopEffects.push(testData.results.stroopEffect)
    }

    // Calculate human score
    const humanScore = this.calculateHumanScore(session)
    session.currentScore = humanScore

    // Build indicators
    const humanIndicators: string[] = []
    const botIndicators: string[] = []

    // Reaction time analysis
    if (reactionTime >= SHIELD_CONFIG.REACTION_MIN_HUMAN && reactionTime <= SHIELD_CONFIG.REACTION_MAX_HUMAN) {
      humanIndicators.push(`Temps de réaction naturel (${reactionTime.toFixed(0)}ms)`)
    }
    if (reactionTime < SHIELD_CONFIG.REACTION_SUSPICIOUS_FAST) {
      botIndicators.push(`Réaction suspecte (<${SHIELD_CONFIG.REACTION_SUSPICIOUS_FAST}ms)`)
    }
    if (reactionTime > SHIELD_CONFIG.REACTION_SUSPICIOUS_SLOW) {
      botIndicators.push(`Réaction trop lente (>${SHIELD_CONFIG.REACTION_SUSPICIOUS_SLOW}ms)`)
    }

    // Pressure analysis
    if (pressureVariance > 0.05) {
      humanIndicators.push('Variance pression naturelle')
    } else if (pressureVariance < 0.01) {
      botIndicators.push('Pression trop stable (robotique)')
    }

    // Regularity analysis
    if (regularity >= 0.15 && regularity <= 0.35) {
      humanIndicators.push('Régularité comportementale humaine')
    } else if (regularity < 0.1) {
      botIndicators.push('Régularité parfaite (non-humain)')
    }

    // Stroop effect analysis
    if (testData.testType === 'stroop' && testData.results.stroopEffect !== undefined) {
      const effect = testData.results.stroopEffect
      if (effect >= SHIELD_CONFIG.STROOP_MIN_EFFECT) {
        humanIndicators.push(`Effet Stroop détecté (+${effect.toFixed(0)}ms)`)
      } else if (effect < 10) {
        botIndicators.push('Pas d\'effet Stroop (suspect)')
      }
    }

    // Confidence calculation
    const baseConfidence = Math.min(
      SHIELD_CONFIG.MAX_CONFIDENCE,
      session.testCount * SHIELD_CONFIG.CONFIDENCE_PER_TEST
    )
    const consistency = this.calculateConsistency(session)
    const confidence = baseConfidence * consistency

    // Classification
    const isReliable = session.testCount >= SHIELD_CONFIG.MIN_TESTS_FOR_RELIABLE

    let classification: Classification
    let recommendation: Recommendation

    if (!isReliable) {
      classification = 'UNCERTAIN'
      recommendation = 'CHALLENGE_AGAIN'
    } else if (humanScore >= SHIELD_CONFIG.HUMAN_THRESHOLD) {
      classification = 'HUMAN'
      recommendation = 'ALLOW'
    } else if (humanScore < SHIELD_CONFIG.BOT_THRESHOLD) {
      classification = 'BOT'
      recommendation = 'BLOCK'
    } else {
      classification = 'UNCERTAIN'
      recommendation = 'CHALLENGE_AGAIN'
    }

    return {
      classification,
      humanScore,
      confidence,
      metrics: {
        reactionTime,
        regularity,
        pressureVariance,
        errorRate,
      },
      humanIndicators,
      botIndicators,
      recommendation,
      testCount: session.testCount,
      isReliable,
      timestamp: Date.now(),
    }
  }

  private calculateHumanScore(session: ShieldSession): number {
    const { reactionTimes, pressures, regularities, stroopEffects } = session.aggregatedMetrics

    let score = 0
    let weights = 0

    // Reaction time score (40%)
    if (reactionTimes.length > 0) {
      const avgRT = reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length
      const rtScore = this.normalizeReactionTime(avgRT)
      score += rtScore * 0.4
      weights += 0.4
    }

    // Pressure variance score (20%)
    if (pressures.length > 0) {
      const avgPressure = pressures.reduce((a, b) => a + b, 0) / pressures.length
      const pressureScore = Math.min(1, avgPressure * 10)
      score += pressureScore * 0.2
      weights += 0.2
    }

    // Regularity score (20%)
    if (regularities.length > 0) {
      const avgReg = regularities.reduce((a, b) => a + b, 0) / regularities.length
      const regScore = avgReg >= 0.1 && avgReg <= 0.4 ? 1 : avgReg < 0.1 ? avgReg * 10 : 0.5
      score += regScore * 0.2
      weights += 0.2
    }

    // Stroop effect score (20%)
    if (stroopEffects.length > 0) {
      const avgStroop = stroopEffects.reduce((a, b) => a + b, 0) / stroopEffects.length
      const stroopScore = avgStroop >= SHIELD_CONFIG.STROOP_MIN_EFFECT ? 1 : avgStroop / SHIELD_CONFIG.STROOP_MIN_EFFECT
      score += stroopScore * 0.2
      weights += 0.2
    }

    return weights > 0 ? score / weights : 0.5
  }

  private normalizeReactionTime(rt: number): number {
    const { REACTION_MIN_HUMAN, REACTION_MAX_HUMAN, REACTION_SUSPICIOUS_FAST, REACTION_SUSPICIOUS_SLOW } = SHIELD_CONFIG

    if (rt < REACTION_SUSPICIOUS_FAST) return 0.1
    if (rt > REACTION_SUSPICIOUS_SLOW) return 0.3
    if (rt >= REACTION_MIN_HUMAN && rt <= REACTION_MAX_HUMAN) return 1
    if (rt < REACTION_MIN_HUMAN) return 0.5 + (rt - REACTION_SUSPICIOUS_FAST) / (REACTION_MIN_HUMAN - REACTION_SUSPICIOUS_FAST) * 0.5
    return 0.5 + (REACTION_SUSPICIOUS_SLOW - rt) / (REACTION_SUSPICIOUS_SLOW - REACTION_MAX_HUMAN) * 0.5
  }

  private calculatePressureVariance(touches: { pressure: number }[]): number {
    if (touches.length < 2) return 0.1

    const pressures = touches.map((t) => t.pressure).filter((p) => p > 0)
    if (pressures.length < 2) return 0.1

    const mean = pressures.reduce((a, b) => a + b, 0) / pressures.length
    const variance = pressures.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / pressures.length

    return Math.sqrt(variance)
  }

  private calculateRegularity(touches: { deltaTime: number }[]): number {
    if (touches.length < 2) return 0.2

    const deltas = touches.map((t) => t.deltaTime).filter((d) => d > 0)
    if (deltas.length < 2) return 0.2

    const mean = deltas.reduce((a, b) => a + b, 0) / deltas.length
    const variance = deltas.reduce((sum, d) => sum + Math.pow(d - mean, 2), 0) / deltas.length
    const std = Math.sqrt(variance)

    return std / mean // Coefficient of variation
  }

  private calculateConsistency(session: ShieldSession): number {
    if (session.testCount < 2) return 0.7

    const scores = session.aggregatedMetrics.reactionTimes.map((rt) => this.normalizeReactionTime(rt))
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length
    const variance = scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length
    const std = Math.sqrt(variance)

    return Math.max(0.5, 1 - std)
  }

  clearSession(sessionId: string): void {
    this.sessions.delete(sessionId)
  }

  getSession(sessionId: string): ShieldSession | undefined {
    return this.sessions.get(sessionId)
  }
}

export const shieldDetector = new ShieldDetector()

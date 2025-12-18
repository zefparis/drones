/**
 * Quick Stroop Test - Biometric Re-Challenge
 * Test cognitif 15s pour proof-of-presence
 */

export interface StroopTrial {
  word: string;
  color: string;
  correctAnswer: string;
  isCongruent: boolean;
}

export interface StroopTrialResult {
  trial: StroopTrial;
  userAnswer: string;
  reactionTime: number;
  correct: boolean;
}

export interface StroopResult {
  trials: StroopTrialResult[];
  avgReactionTime: number;
  stroopEffect: number;
  accuracy: number;
  humanScore: number;
}

export class QuickStroopTest {
  readonly COLORS = [
    { name: 'ROUGE', hex: '#EF4444' },
    { name: 'BLEU', hex: '#3B82F6' },
    { name: 'VERT', hex: '#10B981' },
    { name: 'JAUNE', hex: '#F59E0B' }
  ];

  private readonly TRIAL_COUNT = 10;

  /**
   * Génère séquence de tests
   */
  generateTrials(): StroopTrial[] {
    const trials: StroopTrial[] = [];
    
    for (let i = 0; i < this.TRIAL_COUNT; i++) {
      const isCongruent = Math.random() > 0.5;
      
      const wordColor = this.COLORS[Math.floor(Math.random() * this.COLORS.length)];
      const textColor = isCongruent
        ? wordColor
        : this.COLORS.filter(c => c.name !== wordColor.name)[
            Math.floor(Math.random() * (this.COLORS.length - 1))
          ];
      
      trials.push({
        word: wordColor.name,
        color: textColor.hex,
        correctAnswer: textColor.name,
        isCongruent
      });
    }
    
    return trials;
  }

  /**
   * Analyse résultats et détecte humain vs bot
   */
  analyzeResults(trials: StroopTrialResult[]): StroopResult {
    
    const avgReactionTime = trials.reduce((sum, t) => sum + t.reactionTime, 0) / trials.length;
    
    const correctCount = trials.filter(t => t.correct).length;
    const accuracy = correctCount / trials.length;
    
    const congruentTrials = trials.filter(t => t.trial.isCongruent);
    const incongruentTrials = trials.filter(t => !t.trial.isCongruent);
    
    const avgCongruent = congruentTrials.length > 0 
      ? congruentTrials.reduce((sum, t) => sum + t.reactionTime, 0) / congruentTrials.length
      : 0;
      
    const avgIncongruent = incongruentTrials.length > 0
      ? incongruentTrials.reduce((sum, t) => sum + t.reactionTime, 0) / incongruentTrials.length
      : 0;
    
    const stroopEffect = (congruentTrials.length > 0 && incongruentTrials.length > 0)
      ? avgIncongruent - avgCongruent
      : 0;
    
    const humanScore = this.computeHumanScore({
      avgReactionTime,
      stroopEffect,
      accuracy,
      trials
    });
    
    return {
      trials,
      avgReactionTime,
      stroopEffect,
      accuracy,
      humanScore
    };
  }

  /**
   * Calcule score confiance humain (0-1)
   */
  private computeHumanScore(data: {
    avgReactionTime: number;
    stroopEffect: number;
    accuracy: number;
    trials: StroopTrialResult[];
  }): number {
    let score = 0.3;
    
    // Critère 1: Temps réaction humain (150-1500ms)
    if (data.avgReactionTime >= 150 && data.avgReactionTime <= 1500) {
      score += 0.25;
    } else if (data.avgReactionTime < 80) {
      score -= 0.3;
    } else if (data.avgReactionTime > 2000) {
      score -= 0.1;
    }
    
    // Critère 2: Effet Stroop présent (20-400ms)
    if (data.stroopEffect >= 20 && data.stroopEffect <= 400) {
      score += 0.25;
    } else if (data.stroopEffect < 0) {
      score -= 0.2;
    }
    
    // Critère 3: Accuracy raisonnable
    if (data.accuracy >= 0.6 && data.accuracy <= 1.0) {
      score += 0.15;
    } else if (data.accuracy < 0.4) {
      score -= 0.2;
    }
    
    // Critère 4: Variance temps réaction
    const variance = this.computeVariance(data.trials.map(t => t.reactionTime));
    if (variance > 2000 && variance < 100000) {
      score += 0.1;
    } else if (variance < 500) {
      score -= 0.15;
    }
    
    // Critère 5: Présence de réponses
    if (data.trials.length >= 5) {
      score += 0.05;
    }
    
    return Math.max(0, Math.min(1, score));
  }

  private computeVariance(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    return squaredDiffs.reduce((sum, d) => sum + d, 0) / values.length;
  }

  /**
   * Génère hash résultat (pour proof-of-presence)
   */
  async hashResult(result: StroopResult): Promise<string> {
    const resultJson = JSON.stringify({
      avgReactionTime: result.avgReactionTime,
      stroopEffect: result.stroopEffect,
      accuracy: result.accuracy,
      humanScore: result.humanScore,
      timestamp: Date.now()
    });
    
    const encoder = new TextEncoder();
    const data = encoder.encode(resultJson);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
  }
}

export const quickStroop = new QuickStroopTest();

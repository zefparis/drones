/**
 * HCS Code Generator
 * Génère le code HCS-U7 unique à partir des résultats de tests cognitifs
 */

import { db, type TestResult } from '../storage/db';

interface CognitiveMetrics {
  reactionTime: { mean: number; std: number; best: number };
  precision: { mean: number; std: number };
  memory: { score: number };
  pattern: { accuracy: number };
  scroll: { regularity: number };
  coordination: { speed: number };
  stroop: { effect: number; accuracy: number };
}

interface HcsCodeParams {
  version: string;
  algorithm: string;
  modality: string;
  cogVectors: string;
  qsig: string;
  b3: string;
}

export class HcsCodeGenerator {
  /**
   * Génère le code HCS-U7 complet
   */
  async generateHcsCode(): Promise<string> {
    const results = await db.testResults.toArray();
    
    const completedTypes = new Set(results.map(r => r.testType));

    if (completedTypes.size < 5) {
      throw new Error('Minimum 5 tests requis pour générer un code HCS');
    }

    const metrics = this.extractCognitiveMetrics(results);
    const cogVectors = this.generateCognitiveVectors(metrics);
    const qsig = await this.generateQSIG(cogVectors);
    const b3 = await this.generateB3(cogVectors);

    return this.assembleHcsCode({
      version: '8.0',
      algorithm: 'QS',
      modality: this.calculateModality(metrics),
      cogVectors,
      qsig,
      b3,
    });
  }
  
  /**
   * Extrait les métriques cognitives des résultats de tests
   */
  private extractCognitiveMetrics(results: TestResult[]): CognitiveMetrics {
    const reactionTests = results.filter(r => r.testType === 'reaction');
    const memoryTests = results.filter(r => r.testType === 'memory');
    const tracingTests = results.filter(r => r.testType === 'tracing');
    const patternTests = results.filter(r => r.testType === 'pattern');
    const scrollTests = results.filter(r => r.testType === 'scroll');
    const coordTests = results.filter(r => r.testType === 'coordination');
    const stroopTests = results.filter(r => r.testType === 'color');

    const reactionTimes = reactionTests
      .map(t => t.metadata?.reactionTime as number)
      .filter((t): t is number => typeof t === 'number' && t > 0);

    const tracingScores = tracingTests
      .map(t => t.score)
      .filter((s): s is number => typeof s === 'number' && s >= 0);

    const memoryScores = memoryTests
      .map(t => t.score)
      .filter((s): s is number => typeof s === 'number' && s >= 0);

    const patternScores = patternTests
      .map(t => t.score)
      .filter((s): s is number => typeof s === 'number' && s >= 0);

    const scrollRegularities = scrollTests
      .map(t => (typeof t.score === 'number' ? t.score : ((t.metadata?.regularityScore as number) ?? 0) * 100))
      .filter((s): s is number => typeof s === 'number' && s >= 0);

    const coordinationSpeeds = coordTests
      .map(t => {
        const avgTime = t.metadata?.averageTimeBetweenTaps as number;
        return typeof avgTime === 'number' && avgTime > 0 ? 1000 / avgTime : 0;
      })
      .filter(s => s > 0);

    const stroopEffects = stroopTests
      .map(t => t.metadata?.stroopEffect as number)
      .filter((e): e is number => typeof e === 'number');

    const stroopAccuracies = stroopTests
      .map(t => (typeof t.metadata?.accuracy === 'number' ? t.metadata.accuracy : t.score ?? 0))
      .filter((a): a is number => typeof a === 'number' && a >= 0);

    return {
      reactionTime: {
        mean: this.mean(reactionTimes),
        std: this.std(reactionTimes),
        best: reactionTimes.length > 0 ? Math.min(...reactionTimes) : 0,
      },
      precision: {
        mean: this.mean(tracingScores),
        std: this.std(tracingScores),
      },
      memory: {
        score: this.mean(memoryScores),
      },
      pattern: {
        accuracy: this.mean(patternScores),
      },
      scroll: {
        regularity: this.mean(scrollRegularities),
      },
      coordination: {
        speed: this.mean(coordinationSpeeds),
      },
      stroop: {
        effect: this.mean(stroopEffects),
        accuracy: this.mean(stroopAccuracies),
      },
    };
  }

  /**
   * Génère les vecteurs cognitifs (F, C, V, S, Cr)
   */
  private generateCognitiveVectors(metrics: CognitiveMetrics): string {
    // F (Fine Motor) = précision moyenne
    const F = Math.round(this.clamp01(metrics.precision.mean / 100) * 100);
    
    // C (Cognitive) = précision Stroop
    const C = Math.round(this.clamp01(metrics.stroop.accuracy / 100) * 100);

    // V (Velocity) = vitesse réaction + coordination
    const reactionSpeed = 1 - this.normalize(metrics.reactionTime.mean, 150, 400);
    const coordinationSpeed = this.normalize(metrics.coordination.speed, 0, 10);
    const V = Math.round(this.clamp01(reactionSpeed * 0.6 + coordinationSpeed * 0.4) * 100);

    // S (Stability) = régularité scroll
    const S = Math.round(this.clamp01(metrics.scroll.regularity / 100) * 100);

    // Cr (Creativity/Pattern) = pattern + mémoire + variabilité
    const patternComponent = this.clamp01(metrics.pattern.accuracy / 100);
    const memoryComponent = this.clamp01(metrics.memory.score / 100);
    const variabilityComponent = this.normalize(metrics.reactionTime.std, 0, 100);
    const Cr = Math.round(this.clamp01(patternComponent * 0.5 + memoryComponent * 0.3 + variabilityComponent * 0.2) * 100);

    return `F${F}C${C}V${V}S${S}Cr${Cr}`;
  }

  /**
   * Génère la signature QSIG (HMAC-SHA256)
   */
  private async generateQSIG(cogVectors: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(cogVectors);
    
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode('hcs-u7-mobile-key'),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', keyMaterial, data);
    const signatureArray = Array.from(new Uint8Array(signature));
    const signatureBase64 = btoa(String.fromCharCode(...signatureArray));
    
    return signatureBase64.substring(0, 10).toLowerCase();
  }

  /**
   * Génère le hash B3 (SHA-256)
   */
  private async generateB3(cogVectors: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(cogVectors);
    
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return hashHex.substring(0, 10);
  }
  
  /**
   * Calcule la modalité (poids cognitive/form/motion)
   */
  private calculateModality(_metrics: CognitiveMetrics): string {
    const cognitiveWeight = 0.75;
    const formWeight = 0.25;
    
    const c = Math.round(cognitiveWeight * 100);
    const f = Math.round(formWeight * 100);
    
    return `c${c}f${f}m0`;
  }

  /**
   * Assemble le code HCS final
   */
  private assembleHcsCode(params: HcsCodeParams): string {
    return [
      'HCS-U7',
      `V:${params.version}`,
      `ALG:${params.algorithm}`,
      `E:M`,
      `MOD:${params.modality}`,
      `COG:${params.cogVectors}`,
      `QSIG:${params.qsig}`,
      `B3:${params.b3}`,
    ].join('|');
  }

  // Helpers
  private mean(arr: number[]): number {
    if (arr.length === 0) return 0;
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }

  private std(arr: number[]): number {
    if (arr.length === 0) return 0;
    const avg = this.mean(arr);
    const squareDiffs = arr.map(v => Math.pow(v - avg, 2));
    return Math.sqrt(this.mean(squareDiffs));
  }

  private normalize(value: number, min: number, max: number): number {
    return Math.max(0, Math.min(1, (value - min) / (max - min)));
  }

  private clamp01(value: number): number {
    return Math.max(0, Math.min(1, value));
  }
}

export const hcsGenerator = new HcsCodeGenerator();

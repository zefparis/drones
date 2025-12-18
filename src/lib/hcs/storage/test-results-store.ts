/**
 * Test Results Store - Gestion des résultats de tests cognitifs
 */

import { db, getDeviceInfo, type TestResult } from './db';

export interface SaveTestResultParams {
  testType: TestResult['testType'];
  timestamp: number;
  duration?: number;
  score?: number;
  metadata?: Record<string, unknown>;
}

export class TestResultsStore {
  /**
   * Sauvegarde un résultat de test
   */
  async saveTestResult(params: SaveTestResultParams): Promise<number> {
    const result: TestResult = {
      testType: params.testType,
      timestamp: params.timestamp,
      duration: params.duration,
      score: params.score,
      metadata: params.metadata || {},
      deviceInfo: getDeviceInfo()
    };

    const id = await db.testResults.add(result);
    return id;
  }

  /**
   * Récupère tous les résultats de tests
   */
  async getAllResults(): Promise<TestResult[]> {
    return db.testResults.toArray();
  }

  /**
   * Récupère les résultats par type de test
   */
  async getResultsByType(testType: TestResult['testType']): Promise<TestResult[]> {
    return db.testResults.where('testType').equals(testType).toArray();
  }

  /**
   * Récupère les derniers résultats
   */
  async getRecentResults(limit: number = 10): Promise<TestResult[]> {
    return db.testResults
      .orderBy('timestamp')
      .reverse()
      .limit(limit)
      .toArray();
  }

  /**
   * Compte les tests par type
   */
  async countByType(): Promise<Record<string, number>> {
    const results = await db.testResults.toArray();
    const counts: Record<string, number> = {};
    
    for (const result of results) {
      counts[result.testType] = (counts[result.testType] || 0) + 1;
    }
    
    return counts;
  }

  /**
   * Vérifie si tous les tests requis sont complétés
   */
  async areAllTestsCompleted(): Promise<boolean> {
    const counts = await this.countByType();
    const requiredTests: TestResult['testType'][] = [
      'reaction', 'memory', 'tracing', 'pattern', 'scroll', 'coordination', 'color'
    ];
    
    return requiredTests.every(type => (counts[type] || 0) >= 1);
  }

  /**
   * Compte le nombre de types de tests distincts complétés
   */
  async getCompletedTestTypesCount(): Promise<number> {
    const counts = await this.countByType();
    return Object.keys(counts).length;
  }

  /**
   * Supprime tous les résultats
   */
  async clearAll(): Promise<void> {
    await db.testResults.clear();
  }

  /**
   * Calcule les statistiques pour un type de test
   */
  async getStatsForType(testType: TestResult['testType']): Promise<{
    count: number;
    avgScore: number;
    bestScore: number;
    avgDuration: number;
  }> {
    const results = await this.getResultsByType(testType);
    
    if (results.length === 0) {
      return { count: 0, avgScore: 0, bestScore: 0, avgDuration: 0 };
    }

    const scores = results.map(r => r.score ?? 0);
    const durations = results.map(r => r.duration ?? 0);

    return {
      count: results.length,
      avgScore: scores.reduce((a, b) => a + b, 0) / scores.length,
      bestScore: Math.max(...scores),
      avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length
    };
  }
}

export const testResultsStore = new TestResultsStore();

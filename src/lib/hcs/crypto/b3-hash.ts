/**
 * B3-Hash: Behavioral Biometric Blockchain Hash
 * Custom hash algorithm optimized for cognitive biometric data
 */

export interface BiometricData {
  timing?: number[];
  motion?: Array<{
    timestamp: number;
    acceleration?: { x: number; y: number; z: number };
  }>;
  touch?: Array<{
    pressure?: number;
    velocity?: number;
    accuracy?: number;
  }>;
  pattern?: unknown;
}

export class B3Hash {
  private static instance: B3Hash;
  
  private constructor() {}
  
  public static getInstance(): B3Hash {
    if (!B3Hash.instance) {
      B3Hash.instance = new B3Hash();
    }
    return B3Hash.instance;
  }
  
  /**
   * Static generate method for convenience
   */
  public static async generate(data: unknown): Promise<string> {
    return B3Hash.getInstance().hash(data);
  }
  
  /**
   * Generate B3 hash from cognitive data
   */
  hash(data: BiometricData | unknown): string {
    const preprocessed = this.preprocessBiometricData(data);
    const rounds = 3; // B3 = 3 rounds
    let hash = preprocessed;
    
    for (let i = 0; i < rounds; i++) {
      hash = this.biometricRound(hash, i);
    }
    
    return this.formatHash(hash);
  }
  
  /**
   * Preprocess biometric data for hashing
   */
  private preprocessBiometricData(data: unknown): string {
    const features = this.extractFeatures(data as BiometricData);
    const normalized = this.normalizeFeatures(features);
    return JSON.stringify(normalized);
  }
  
  /**
   * Extract relevant biometric features
   */
  private extractFeatures(data: BiometricData): Record<string, unknown> {
    const features: Record<string, unknown> = {};
    
    // Timing features
    if (data.timing && data.timing.length > 0) {
      features.timing = {
        mean: this.calculateMean(data.timing),
        std: this.calculateStd(data.timing),
        min: Math.min(...data.timing),
        max: Math.max(...data.timing),
      };
    }
    
    // Motion features
    if (data.motion && data.motion.length > 0) {
      features.motion = {
        intensity: this.calculateMotionIntensity(data.motion),
        regularity: this.calculateRegularity(data.motion),
      };
    }
    
    // Touch features
    if (data.touch && data.touch.length > 0) {
      features.touch = {
        pressure: this.calculateMean(data.touch.map(t => t.pressure || 0)),
        velocity: this.calculateMean(data.touch.map(t => t.velocity || 0)),
        accuracy: data.touch[0]?.accuracy || 0,
      };
    }
    
    // Pattern features
    if (data.pattern) {
      features.pattern = {
        complexity: this.calculatePatternComplexity(data.pattern),
        consistency: this.calculateConsistency(data.pattern),
      };
    }
    
    return features;
  }
  
  /**
   * Normalize features to 0-1 range
   */
  private normalizeFeatures(features: Record<string, unknown>): Record<string, unknown> {
    const normalized: Record<string, unknown> = {};
    
    for (const key in features) {
      const value = features[key];
      if (typeof value === 'object' && value !== null) {
        normalized[key] = {};
        for (const subKey in value as Record<string, number>) {
          const subValue = (value as Record<string, number>)[subKey];
          (normalized[key] as Record<string, number>)[subKey] = this.normalize(subValue);
        }
      } else if (typeof value === 'number') {
        normalized[key] = this.normalize(value);
      }
    }
    
    return normalized;
  }
  
  /**
   * Normalize a single value (sigmoid)
   */
  private normalize(value: number): number {
    return 1 / (1 + Math.exp(-value));
  }
  
  /**
   * Perform one round of biometric hashing
   */
  private biometricRound(input: string, round: number): string {
    const salt = this.getRoundSalt(round);
    const mixed = this.mixWithSalt(input, salt);
    const transformed = this.biometricTransform(mixed);
    const compressed = this.compress(transformed);
    
    return compressed;
  }
  
  /**
   * Get round-specific salt
   */
  private getRoundSalt(round: number): string {
    const salts = [
      'COGNITIVE_ALPHA',
      'BEHAVIORAL_BETA',
      'TEMPORAL_GAMMA',
    ];
    return salts[round % salts.length];
  }
  
  /**
   * Mix input with salt
   */
  private mixWithSalt(input: string, salt: string): string {
    let mixed = '';
    for (let i = 0; i < input.length; i++) {
      const inputChar = input.charCodeAt(i);
      const saltChar = salt.charCodeAt(i % salt.length);
      const mixedChar = (inputChar + saltChar) % 256;
      mixed += String.fromCharCode(mixedChar);
    }
    return mixed;
  }
  
  /**
   * Apply biometric-specific transformations
   */
  private biometricTransform(input: string): string {
    let transformed = '';
    let state = 0;
    
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      
      // Non-linear transformation inspired by neural patterns
      state = (state * 33 + char) % 65536;
      const neuralResponse = Math.sin(state / 1000) * 127 + 128;
      
      transformed += String.fromCharCode(Math.floor(neuralResponse));
    }
    
    return transformed;
  }
  
  /**
   * Compress the hash to fixed size
   */
  private compress(input: string): string {
    const targetLength = 32;
    let compressed = '';
    
    // Folding compression
    for (let i = 0; i < targetLength; i++) {
      let value = 0;
      for (let j = i; j < input.length; j += targetLength) {
        value ^= input.charCodeAt(j);
      }
      compressed += String.fromCharCode(value);
    }
    
    return compressed;
  }
  
  /**
   * Format hash for output
   */
  private formatHash(hash: string): string {
    let hex = '';
    for (let i = 0; i < hash.length; i++) {
      hex += hash.charCodeAt(i).toString(16).padStart(2, '0');
    }
    return hex.toUpperCase();
  }
  
  /**
   * Calculate mean of array
   */
  private calculateMean(arr: number[]): number {
    if (!arr || arr.length === 0) return 0;
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }
  
  /**
   * Calculate standard deviation
   */
  private calculateStd(arr: number[]): number {
    if (!arr || arr.length === 0) return 0;
    const mean = this.calculateMean(arr);
    const squaredDiffs = arr.map(x => Math.pow(x - mean, 2));
    return Math.sqrt(this.calculateMean(squaredDiffs));
  }
  
  /**
   * Calculate motion intensity
   */
  private calculateMotionIntensity(motion: BiometricData['motion']): number {
    if (!motion || motion.length === 0) return 0;
    
    let totalIntensity = 0;
    for (const sample of motion) {
      const accel = sample.acceleration || { x: 0, y: 0, z: 0 };
      const intensity = Math.sqrt(
        accel.x * accel.x + accel.y * accel.y + accel.z * accel.z
      );
      totalIntensity += intensity;
    }
    
    return totalIntensity / motion.length;
  }
  
  /**
   * Calculate regularity of data
   */
  private calculateRegularity(data: Array<{ timestamp: number }>): number {
    if (!data || data.length < 2) return 1;
    
    const intervals: number[] = [];
    for (let i = 1; i < data.length; i++) {
      const interval = data[i].timestamp - data[i - 1].timestamp;
      intervals.push(interval);
    }
    
    const meanInterval = this.calculateMean(intervals);
    const stdInterval = this.calculateStd(intervals);
    
    // Regularity is inverse of coefficient of variation
    return meanInterval > 0 ? 1 / (1 + stdInterval / meanInterval) : 0;
  }
  
  /**
   * Calculate pattern complexity
   */
  private calculatePatternComplexity(pattern: unknown): number {
    if (!pattern) return 0;
    
    // Simple entropy calculation
    const str = JSON.stringify(pattern);
    const freq: { [key: string]: number } = {};
    
    for (const char of str) {
      freq[char] = (freq[char] || 0) + 1;
    }
    
    let entropy = 0;
    const len = str.length;
    for (const char in freq) {
      const p = freq[char] / len;
      entropy -= p * Math.log2(p);
    }
    
    return entropy;
  }
  
  /**
   * Calculate consistency
   */
  private calculateConsistency(_pattern: unknown): number {
    return 0.75; // Default consistency score
  }
  
  /**
   * Compare two B3 hashes for similarity
   */
  similarity(hash1: string, hash2: string): number {
    if (hash1.length !== hash2.length) return 0;
    
    let matching = 0;
    for (let i = 0; i < hash1.length; i++) {
      if (hash1[i] === hash2[i]) matching++;
    }
    
    return matching / hash1.length;
  }
}

export const b3Hash = B3Hash.getInstance();

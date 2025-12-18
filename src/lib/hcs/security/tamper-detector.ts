/**
 * Tamper Detector - Device Integrity Monitoring
 * Détecte root, jailbreak, debugging, forensic tools
 */

import { db } from '../storage/db';

export interface TamperCheck {
  name: string;
  detected: boolean;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  details?: string;
}

export interface TamperReport {
  timestamp: number;
  deviceInfo: {
    userAgent: string;
    platform: string;
    language: string;
    screenResolution: string;
  };
  checks: TamperCheck[];
  overallRisk: 'SAFE' | 'SUSPICIOUS' | 'COMPROMISED';
  recommendedAction: 'ALLOW' | 'WARN' | 'LOCK' | 'WIPE';
}

export class TamperDetector {
  
  /**
   * Effectue scan complet intégrité
   */
  async performFullScan(
    onProgress?: (progress: number, checkName: string) => void
  ): Promise<TamperReport> {
    const checks: TamperCheck[] = [];
    const totalChecks = 7;
    let completedChecks = 0;
    
    const reportProgress = (checkName: string) => {
      completedChecks++;
      const progress = Math.round((completedChecks / totalChecks) * 100);
      onProgress?.(progress, checkName);
    };
    
    onProgress?.(0, 'Checking debugger...');
    checks.push(await this.checkDebugger());
    reportProgress('Debugger check complete');
    
    onProgress?.(14, 'Checking DevTools...');
    checks.push(this.checkDevTools());
    reportProgress('DevTools check complete');
    
    onProgress?.(28, 'Checking environment...');
    checks.push(this.checkEnvironment());
    reportProgress('Environment check complete');
    
    onProgress?.(42, 'Checking timing...');
    checks.push(await this.checkTimingAnomalies());
    reportProgress('Timing check complete');
    
    onProgress?.(57, 'Validating user agent...');
    checks.push(this.checkUserAgent());
    reportProgress('User agent validated');
    
    onProgress?.(71, 'Verifying storage integrity...');
    checks.push(await this.checkStorageIntegrity());
    reportProgress('Storage verified');
    
    onProgress?.(85, 'Checking WebAuthn...');
    checks.push(this.checkWebAuthnAvailability());
    reportProgress('WebAuthn verified');
    
    onProgress?.(95, 'Analyzing results...');
    const overallRisk = this.assessOverallRisk(checks);
    const recommendedAction = this.determineAction(overallRisk, checks);
    
    const report: TamperReport = {
      timestamp: Date.now(),
      deviceInfo: this.collectDeviceInfo(),
      checks,
      overallRisk,
      recommendedAction
    };
    
    await this.logTamperReport(report);
    
    onProgress?.(100, 'Complete');
    
    return report;
  }

  private async checkDebugger(): Promise<TamperCheck> {
    let detected = false;
    
    try {
      const start = performance.now();
      // eslint-disable-next-line no-debugger
      debugger;
      const end = performance.now();
      
      if (end - start > 100) {
        detected = true;
      }
    } catch {
      detected = true;
    }
    
    return {
      name: 'Debugger Detection',
      detected,
      severity: detected ? 'CRITICAL' : 'LOW',
      details: detected ? 'Active debugger detected' : 'No debugger'
    };
  }

  private checkDevTools(): TamperCheck {
    let detected = false;
    
    const widthThreshold = window.outerWidth - window.innerWidth > 160;
    const heightThreshold = window.outerHeight - window.innerHeight > 160;
    
    if (widthThreshold || heightThreshold) {
      detected = true;
    }
    
    return {
      name: 'DevTools Detection',
      detected,
      severity: detected ? 'HIGH' : 'LOW',
      details: detected ? 'DevTools may be open' : 'No DevTools detected'
    };
  }

  private checkEnvironment(): TamperCheck {
    const suspicious: string[] = [];
    
    const suspiciousGlobals = [
      '__REACT_DEVTOOLS_GLOBAL_HOOK__',
      '__REDUX_DEVTOOLS_EXTENSION__',
      'Firebug',
      '_phantom',
      'callPhantom'
    ];
    
    suspiciousGlobals.forEach(global => {
      if ((window as unknown as Record<string, unknown>)[global]) {
        suspicious.push(global);
      }
    });
    
    if (navigator.webdriver) {
      suspicious.push('navigator.webdriver (automation)');
    }
    
    return {
      name: 'Environment Check',
      detected: suspicious.length > 0,
      severity: suspicious.length > 0 ? 'MEDIUM' : 'LOW',
      details: suspicious.length > 0 ? `Suspicious: ${suspicious.join(', ')}` : 'Clean'
    };
  }

  private async checkTimingAnomalies(): Promise<TamperCheck> {
    const samples: number[] = [];
    
    for (let i = 0; i < 5; i++) {
      const start = performance.now();
      await new Promise(resolve => setTimeout(resolve, 0));
      const end = performance.now();
      samples.push(end - start);
    }
    
    const variance = this.computeVariance(samples);
    const detected = variance > 150;
    
    return {
      name: 'Timing Anomalies',
      detected,
      severity: detected ? 'MEDIUM' : 'LOW',
      details: detected ? `High variance: ${variance.toFixed(2)}` : 'Normal timing'
    };
  }

  private checkUserAgent(): TamperCheck {
    const ua = navigator.userAgent;
    const platform = navigator.platform;
    
    const isWindows = ua.includes('Windows');
    const isMac = platform.includes('Mac');
    const isLinux = platform.includes('Linux');
    
    const detected = (isWindows && (isMac || isLinux)) ||
                     (isMac && (isWindows || isLinux));
    
    return {
      name: 'User Agent Validation',
      detected,
      severity: detected ? 'MEDIUM' : 'LOW',
      details: detected ? 'UA/Platform mismatch' : 'Consistent'
    };
  }

  private async checkStorageIntegrity(): Promise<TamperCheck> {
    let detected = false;
    let details = 'Integrity verified';
    
    try {
      const timeoutPromise = new Promise<null>((resolve) => {
        setTimeout(() => resolve(null), 2000);
      });
      
      const profilePromise = this.getStoredProfile();
      const profile = await Promise.race([profilePromise, timeoutPromise]);
      
      if (profile === null) {
        details = 'Check timeout - assuming safe';
        return {
          name: 'Storage Integrity',
          detected: false,
          severity: 'LOW',
          details
        };
      }
      
      if (profile) {
        if (profile.integrityHash && profile.encryptedProfile) {
          try {
            const computedHash = await this.computeProfileHash(profile);
            const storedHash = profile.integrityHash;
            
            if (computedHash !== storedHash) {
              detected = true;
              details = 'Storage tampering detected';
            }
          } catch {
            details = 'Hash check skipped';
          }
        } else {
          details = 'No integrity hash (unencrypted profile)';
        }
      }
    } catch {
      details = 'Check failed - assuming safe';
    }
    
    return {
      name: 'Storage Integrity',
      detected,
      severity: detected ? 'CRITICAL' : 'LOW',
      details
    };
  }

  private checkWebAuthnAvailability(): TamperCheck {
    const available = window.PublicKeyCredential !== undefined &&
                      typeof navigator.credentials?.create === 'function';
    
    const detected = !available;
    
    return {
      name: 'WebAuthn Availability',
      detected,
      severity: detected ? 'HIGH' : 'LOW',
      details: detected ? 'WebAuthn not available (spoofed browser?)' : 'Available'
    };
  }

  private assessOverallRisk(checks: TamperCheck[]): 'SAFE' | 'SUSPICIOUS' | 'COMPROMISED' {
    const criticalCount = checks.filter(c => c.detected && c.severity === 'CRITICAL').length;
    const highCount = checks.filter(c => c.detected && c.severity === 'HIGH').length;
    const mediumCount = checks.filter(c => c.detected && c.severity === 'MEDIUM').length;
    
    if (criticalCount > 0) return 'COMPROMISED';
    if (highCount >= 2) return 'COMPROMISED';
    if (highCount >= 1 || mediumCount >= 2) return 'SUSPICIOUS';
    
    return 'SAFE';
  }

  private determineAction(
    risk: 'SAFE' | 'SUSPICIOUS' | 'COMPROMISED',
    checks: TamperCheck[]
  ): 'ALLOW' | 'WARN' | 'LOCK' | 'WIPE' {
    
    if (risk === 'COMPROMISED') {
      const debuggerActive = checks.find(c => c.name === 'Debugger Detection')?.detected;
      const storageCompromised = checks.find(c => c.name === 'Storage Integrity')?.detected;
      
      if (debuggerActive && storageCompromised) {
        return 'WIPE';
      }
      
      return 'LOCK';
    }
    
    if (risk === 'SUSPICIOUS') {
      return 'WARN';
    }
    
    return 'ALLOW';
  }

  private collectDeviceInfo(): TamperReport['deviceInfo'] {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      screenResolution: `${window.screen.width}x${window.screen.height}` 
    };
  }

  private async logTamperReport(report: TamperReport): Promise<void> {
    const logs = JSON.parse(localStorage.getItem('TAMPER_LOGS') || '[]');
    logs.push(report);
    
    if (logs.length > 100) {
      logs.shift();
    }
    
    localStorage.setItem('TAMPER_LOGS', JSON.stringify(logs));
    
    if (report.overallRisk !== 'SAFE') {
      console.warn('[TAMPER] Report logged:', report);
    }
  }

  private computeVariance(values: number[]): number {
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    return squaredDiffs.reduce((sum, d) => sum + d, 0) / values.length;
  }

  private async getStoredProfile(): Promise<Record<string, unknown> | null> {
    try {
      const timeoutPromise = new Promise<null>((resolve) => {
        setTimeout(() => resolve(null), 1000);
      });
      
      const dbPromise = db.userProfiles.toArray();
      const profiles = await Promise.race([dbPromise, timeoutPromise]);
      
      if (profiles === null) {
        console.warn('[TAMPER] IndexedDB timeout');
        return null;
      }
      
      return profiles.length > 0 ? profiles[0] as unknown as Record<string, unknown> : null;
    } catch (e) {
      console.warn('[TAMPER] IndexedDB error:', e);
      return null;
    }
  }

  private async computeProfileHash(profile: Record<string, unknown>): Promise<string> {
    const dataToHash = {
      deviceCredential: profile.deviceCredential,
      encryptedProfile: new Uint8Array(profile.encryptedProfile as ArrayBuffer),
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt
    };
    
    const integrityJson = JSON.stringify(dataToHash, (_key, value) => {
      if (value instanceof Uint8Array || (value && value.buffer instanceof ArrayBuffer)) {
        return Array.from(new Uint8Array(value.buffer || value));
      }
      return value;
    });
    
    const data = new TextEncoder().encode(integrityJson);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
}

export const tamperDetector = new TamperDetector();

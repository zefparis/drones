import { bytesToHex } from '@noble/hashes/utils'
import type {
  CelestialObservation,
  IntegrityResult,
  IntegrityStatus,
  NavigationState,
  ValidatorConfig,
} from '../types/celestial'
import { hammingDistanceBits, hmacSha3_512, normalizeHmacKey, packSignatureMessage, type HmacKey } from './crypto'
import { predictSunObservation } from './ephemeris'

const DEFAULT_REFRACTION: 'normal' | 'jplhor' | false = 'normal'
const DEFAULT_THRESHOLDS = {
  nominalScorePct: 95,
  degradedScorePct: 80,
}

export class CelestialIntegrityValidator {
  private readonly keyBytes: Uint8Array
  private readonly refraction: 'normal' | 'jplhor' | false
  private readonly thresholds: {
    nominalScorePct: number
    degradedScorePct: number
  }

  constructor(key: HmacKey, config: ValidatorConfig = {}) {
    this.keyBytes = normalizeHmacKey(key)
    this.refraction = config.refraction ?? DEFAULT_REFRACTION
    this.thresholds = {
      nominalScorePct: config.thresholds?.nominalScorePct ?? DEFAULT_THRESHOLDS.nominalScorePct,
      degradedScorePct: config.thresholds?.degradedScorePct ?? DEFAULT_THRESHOLDS.degradedScorePct,
    }
  }

  validate(state: NavigationState, observedSun: CelestialObservation): IntegrityResult {
    const totalStart = performance.now()

    const predStart = performance.now()
    const predictedSun = predictSunObservation(state, { refraction: this.refraction })
    const predictionMs = performance.now() - predStart

    const cryptoStart = performance.now()

    const expectedMessage = packSignatureMessage(state, predictedSun)
    const observedMessage = packSignatureMessage(state, observedSun)

    const expectedSigBytes = hmacSha3_512(this.keyBytes, expectedMessage)
    const observedSigBytes = hmacSha3_512(this.keyBytes, observedMessage)

    const expectedSignatureHex = bytesToHex(expectedSigBytes)
    const observedSignatureHex = bytesToHex(observedSigBytes)

    const hammingDistance = hammingDistanceBits(expectedSigBytes, observedSigBytes)

    const totalBits = expectedSigBytes.length * 8
    const integrityScorePct = clamp((1 - hammingDistance / totalBits) * 100, 0, 100)

    const cryptoMs = performance.now() - cryptoStart
    const totalMs = performance.now() - totalStart

    const deltaAzDeg = wrap180(observedSun.azimuthDeg - predictedSun.azimuthDeg)
    const deltaElDeg = observedSun.elevationDeg - predictedSun.elevationDeg
    const deltaAngleDeg = angularSeparationDeg(predictedSun, observedSun)

    const status = scoreToStatus(integrityScorePct, this.thresholds)

    return {
      predictedSun,
      observedSun,
      deltaAzDeg,
      deltaElDeg,
      deltaAngleDeg,
      expectedSignatureHex,
      observedSignatureHex,
      hammingDistanceBits: hammingDistance,
      integrityScorePct,
      status,
      timingsMs: {
        prediction: predictionMs,
        crypto: cryptoMs,
        total: totalMs,
      },
    }
  }
}

export function createDefaultValidator(config: ValidatorConfig = {}): CelestialIntegrityValidator {
  return new CelestialIntegrityValidator('celestial-integrity-demo-key-v1', config)
}

function scoreToStatus(
  scorePct: number,
  thresholds: { nominalScorePct: number; degradedScorePct: number },
): IntegrityStatus {
  if (scorePct >= thresholds.nominalScorePct) return 'nominal'
  if (scorePct >= thresholds.degradedScorePct) return 'degraded'
  return 'anomalous'
}

function wrap180(deg: number): number {
  return ((((deg + 180) % 360) + 360) % 360) - 180
}

function angularSeparationDeg(a: CelestialObservation, b: CelestialObservation): number {
  const va = horizontalToUnitVector(a)
  const vb = horizontalToUnitVector(b)

  const dot = clamp(va.x * vb.x + va.y * vb.y + va.z * vb.z, -1, 1)
  return (Math.acos(dot) * 180) / Math.PI
}

function horizontalToUnitVector(obs: CelestialObservation): { x: number; y: number; z: number } {
  const azRad = (obs.azimuthDeg * Math.PI) / 180
  const elRad = (obs.elevationDeg * Math.PI) / 180
  const cosEl = Math.cos(elRad)

  return {
    x: cosEl * Math.sin(azRad),
    y: cosEl * Math.cos(azRad),
    z: Math.sin(elRad),
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

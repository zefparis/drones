import { bytesToHex } from '@noble/hashes/utils'
import type {
  CelestialObservation,
  IntegrityResult,
  IntegrityStatus,
  MultiSensorFusion,
  MultiSensorObservations,
  MultiSensorSignatureDetail,
  NavigationState,
  ValidatorConfig,
} from '../types/celestial'
import { hammingDistanceBits, hmacSha3_512, normalizeHmacKey, packSignatureMessage, type HmacKey } from './crypto'
import { predictSunObservation } from './ephemeris'
import { computeMagneticField, computeMagneticHeading } from './magnetometer'
import { BRIGHT_STARS, computeStarPosition } from './stars'

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

  async validateMultiSensor(state: NavigationState, observations: MultiSensorObservations): Promise<IntegrityResult> {
    const totalStart = performance.now()

    const predStart = performance.now()
    const predictedSun = predictSunObservation(state, { refraction: this.refraction })
    const observedSun = observations.sun ?? predictedSun
    const time = new Date(state.timestampMs)
    const predictionMs = performance.now() - predStart

    const cryptoStart = performance.now()

    const signatures: MultiSensorSignatureDetail[] = []

    if (observations.sun) {
      const expectedMessage = packSignatureMessage(state, predictedSun)
      const observedMessage = packSignatureMessage(state, observedSun)

      const expectedSigBytes = hmacSha3_512(this.keyBytes, expectedMessage)
      const observedSigBytes = hmacSha3_512(this.keyBytes, observedMessage)

      const hammingDistance = hammingDistanceBits(expectedSigBytes, observedSigBytes)
      const totalBits = expectedSigBytes.length * 8
      const integrityScorePct = clamp((1 - hammingDistance / totalBits) * 100, 0, 100)

      signatures.push({
        sensor: 'sun',
        id: 'sun',
        predicted: { azimuthDeg: predictedSun.azimuthDeg, elevationDeg: predictedSun.elevationDeg },
        observed: { azimuthDeg: observedSun.azimuthDeg, elevationDeg: observedSun.elevationDeg },
        deltaDeg: angularSeparationDeg(predictedSun, observedSun),
        confidence: 1,
        weight: 1,
        expectedSignatureHex: bytesToHex(expectedSigBytes),
        observedSignatureHex: bytesToHex(observedSigBytes),
        hammingDistanceBits: hammingDistance,
        integrityScorePct,
      })
    }

    const stars = observations.stars ?? []
    for (const starObs of stars) {
      const star = BRIGHT_STARS.find((s) => s.id === starObs.id)
      if (!star) continue

      const predicted = computeStarPosition(star, state.latitudeDeg, state.longitudeDeg, state.altitudeM, time)
      const predictedObs: CelestialObservation = { azimuthDeg: predicted.azimuthDeg, elevationDeg: predicted.elevationDeg }
      const observedObs: CelestialObservation = { azimuthDeg: starObs.azimuthDeg, elevationDeg: starObs.elevationDeg }

      const expectedMessage = packSensorSignatureMessage(
        state,
        2,
        fnv1a32(star.id),
        predictedObs.azimuthDeg,
        predictedObs.elevationDeg,
      )
      const observedMessage = packSensorSignatureMessage(
        state,
        2,
        fnv1a32(star.id),
        observedObs.azimuthDeg,
        observedObs.elevationDeg,
      )

      const expectedSigBytes = hmacSha3_512(this.keyBytes, expectedMessage)
      const observedSigBytes = hmacSha3_512(this.keyBytes, observedMessage)

      const hammingDistance = hammingDistanceBits(expectedSigBytes, observedSigBytes)
      const totalBits = expectedSigBytes.length * 8
      const integrityScorePct = clamp((1 - hammingDistance / totalBits) * 100, 0, 100)

      const confidence = clamp(predicted.confidence * starObs.confidence, 0, 1)
      const weight = 0.7 * confidence

      signatures.push({
        sensor: 'star',
        id: star.id,
        name: starObs.name ?? star.name,
        predicted: { azimuthDeg: predictedObs.azimuthDeg, elevationDeg: predictedObs.elevationDeg },
        observed: { azimuthDeg: observedObs.azimuthDeg, elevationDeg: observedObs.elevationDeg },
        deltaDeg: angularSeparationDeg(predictedObs, observedObs),
        confidence,
        weight,
        expectedSignatureHex: bytesToHex(expectedSigBytes),
        observedSignatureHex: bytesToHex(observedSigBytes),
        hammingDistanceBits: hammingDistance,
        integrityScorePct,
      })
    }

    if (observations.magnetometer) {
      const field = computeMagneticField(state.latitudeDeg, state.longitudeDeg, state.altitudeM, time)
      const predictedHeading = computeMagneticHeading(field)

      const expectedMessage = packSensorSignatureMessage(
        state,
        3,
        fnv1a32('magnetometer'),
        predictedHeading.headingDeg,
        0,
      )
      const observedMessage = packSensorSignatureMessage(
        state,
        3,
        fnv1a32('magnetometer'),
        observations.magnetometer.headingDeg,
        0,
      )

      const expectedSigBytes = hmacSha3_512(this.keyBytes, expectedMessage)
      const observedSigBytes = hmacSha3_512(this.keyBytes, observedMessage)

      const hammingDistance = hammingDistanceBits(expectedSigBytes, observedSigBytes)
      const totalBits = expectedSigBytes.length * 8
      const integrityScorePct = clamp((1 - hammingDistance / totalBits) * 100, 0, 100)

      const confidence = clamp(predictedHeading.confidence * observations.magnetometer.confidence, 0, 1)
      const weight = 0.5 * confidence

      signatures.push({
        sensor: 'magnetometer',
        id: 'magnetometer',
        predicted: { headingDeg: predictedHeading.headingDeg },
        observed: { headingDeg: observations.magnetometer.headingDeg },
        deltaDeg: Math.abs(wrap180(observations.magnetometer.headingDeg - predictedHeading.headingDeg)),
        confidence,
        weight,
        expectedSignatureHex: bytesToHex(expectedSigBytes),
        observedSignatureHex: bytesToHex(observedSigBytes),
        hammingDistanceBits: hammingDistance,
        integrityScorePct,
      })
    }

    const fusion = fuseSignatures(signatures)

    const cryptoMs = performance.now() - cryptoStart
    const totalMs = performance.now() - totalStart

    const deltaAzDeg = wrap180(observedSun.azimuthDeg - predictedSun.azimuthDeg)
    const deltaElDeg = observedSun.elevationDeg - predictedSun.elevationDeg
    const deltaAngleDeg = angularSeparationDeg(predictedSun, observedSun)

    const status = scoreToStatus(fusion.consensusScorePct, this.thresholds)

    const primary = selectPrimarySignature(signatures)
    const expectedSignatureHex = primary?.expectedSignatureHex ?? ''
    const observedSignatureHex = primary?.observedSignatureHex ?? ''
    const primaryHammingDistanceBits = primary?.hammingDistanceBits ?? 0

    return {
      predictedSun,
      observedSun,
      deltaAzDeg,
      deltaElDeg,
      deltaAngleDeg,
      expectedSignatureHex,
      observedSignatureHex,
      hammingDistanceBits: primaryHammingDistanceBits,
      integrityScorePct: fusion.consensusScorePct,
      status,
      timingsMs: {
        prediction: predictionMs,
        crypto: cryptoMs,
        total: totalMs,
      },
      multiSensor: fusion,
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

function packSensorSignatureMessage(
  state: NavigationState,
  sensorType: number,
  sensorIdHash: number,
  valueA: number,
  valueB: number,
): Uint8Array {
  const buffer = new ArrayBuffer(56)
  const view = new DataView(buffer)

  view.setBigUint64(0, BigInt(Math.round(state.timestampMs)), true)
  view.setFloat64(8, state.latitudeDeg, true)
  view.setFloat64(16, state.longitudeDeg, true)
  view.setFloat64(24, state.altitudeM, true)
  view.setUint32(32, sensorType >>> 0, true)
  view.setUint32(36, sensorIdHash >>> 0, true)
  view.setFloat64(40, valueA, true)
  view.setFloat64(48, valueB, true)

  return new Uint8Array(buffer)
}

function fnv1a32(input: string): number {
  let hash = 0x811c9dc5
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

function fuseSignatures(signatures: MultiSensorSignatureDetail[]): MultiSensorFusion {
  if (signatures.length === 0) {
    return {
      consensusScorePct: 0,
      sensorCount: 0,
      signatures: [],
    }
  }

  const totalWeight = signatures.reduce((sum, s) => sum + s.weight, 0)
  const consensusScorePct =
    totalWeight > 0
      ? signatures.reduce((sum, s) => sum + s.integrityScorePct * s.weight, 0) / totalWeight
      : signatures.reduce((sum, s) => sum + s.integrityScorePct, 0) / signatures.length

  return {
    consensusScorePct: clamp(consensusScorePct, 0, 100),
    sensorCount: signatures.length,
    signatures,
  }
}

function selectPrimarySignature(signatures: MultiSensorSignatureDetail[]): MultiSensorSignatureDetail | null {
  if (signatures.length === 0) return null
  return signatures.reduce((best, s) => (s.weight > best.weight ? s : best), signatures[0])
}

export type NavigationState = {
  timestampMs: number
  latitudeDeg: number
  longitudeDeg: number
  altitudeM: number
}

export type CelestialObservation = {
  azimuthDeg: number
  elevationDeg: number
}

export type IntegrityStatus = 'nominal' | 'degraded' | 'anomalous'

export type ValidatorConfig = {
  refraction?: 'normal' | 'jplhor' | false
  thresholds?: {
    nominalScorePct?: number
    degradedScorePct?: number
  }
}

export type IntegrityResult = {
  predictedSun: CelestialObservation
  observedSun: CelestialObservation
  deltaAzDeg: number
  deltaElDeg: number
  deltaAngleDeg: number
  expectedSignatureHex: string
  observedSignatureHex: string
  hammingDistanceBits: number
  integrityScorePct: number
  status: IntegrityStatus
  timingsMs: {
    prediction: number
    crypto: number
    total: number
  }
}

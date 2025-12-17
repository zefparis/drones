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

export type StarObservationInput = {
  id: string
  name?: string
  azimuthDeg: number
  elevationDeg: number
  confidence: number
}

export type MagneticHeadingObservation = {
  headingDeg: number
  confidence: number
}

export type MultiSensorObservations = {
  sun?: CelestialObservation
  stars?: StarObservationInput[]
  magnetometer?: MagneticHeadingObservation
}

export type MultiSensorSignatureDetail = {
  sensor: 'sun' | 'star' | 'magnetometer'
  id: string
  name?: string
  predicted: {
    azimuthDeg?: number
    elevationDeg?: number
    headingDeg?: number
  }
  observed: {
    azimuthDeg?: number
    elevationDeg?: number
    headingDeg?: number
  }
  deltaDeg: number
  confidence: number
  weight: number
  expectedSignatureHex: string
  observedSignatureHex: string
  hammingDistanceBits: number
  integrityScorePct: number
}

export type MultiSensorFusion = {
  consensusScorePct: number
  sensorCount: number
  signatures: MultiSensorSignatureDetail[]
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
  multiSensor?: MultiSensorFusion
}

/**
 * Simulates a 3-axis magnetometer using a simplified IGRF-13-inspired model.
 */

export interface MagneticField {
  x: number
  y: number
  z: number
  declinationDeg: number
  inclinationDeg: number
  totalIntensityNt: number
}

export interface MagneticHeading {
  headingDeg: number
  confidence: number
}

export function computeMagneticField(latDeg: number, lonDeg: number, _altM: number, _date: Date): MagneticField {
  const latRad = (latDeg * Math.PI) / 180
  const lonRad = (lonDeg * Math.PI) / 180

  const x = 20000 * Math.cos(latRad)
  const y = 1000 + 500 * Math.sin(lonRad)
  const z = 40000 * Math.sin(latRad)

  const h = Math.sqrt(x * x + y * y)
  const f = Math.sqrt(x * x + y * y + z * z)

  const declinationDeg = (Math.atan2(y, x) * 180) / Math.PI
  const inclinationDeg = (Math.atan2(z, h) * 180) / Math.PI

  return {
    x,
    y,
    z,
    declinationDeg,
    inclinationDeg,
    totalIntensityNt: f,
  }
}

export function computeMagneticHeading(field: MagneticField, rollDeg = 0, pitchDeg = 0): MagneticHeading {
  const rollRad = (rollDeg * Math.PI) / 180
  const pitchRad = (pitchDeg * Math.PI) / 180

  const xc = field.x * Math.cos(pitchRad) + field.z * Math.sin(pitchRad)
  const yc =
    field.x * Math.sin(rollRad) * Math.sin(pitchRad) +
    field.y * Math.cos(rollRad) -
    field.z * Math.sin(rollRad) * Math.cos(pitchRad)

  const headingMagDeg = (Math.atan2(yc, xc) * 180) / Math.PI

  let headingDeg = wrap360(headingMagDeg)
  headingDeg = wrap360(headingDeg + field.declinationDeg)

  const confidence = clamp(field.totalIntensityNt / 50000, 0, 1)

  return { headingDeg, confidence }
}

export function addMagnetometerNoise(heading: MagneticHeading, noiseDeg = 0.5): MagneticHeading {
  const jitter = (Math.random() - 0.5) * noiseDeg * 2
  return {
    headingDeg: wrap360(heading.headingDeg + jitter),
    confidence: clamp(heading.confidence * (0.95 + Math.random() * 0.05), 0, 1),
  }
}

function wrap360(deg: number): number {
  return ((deg % 360) + 360) % 360
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

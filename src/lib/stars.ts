/**
 * Stellar navigation helpers using a bright star catalog.
 */

import { Body, Equator, Horizon, Observer } from 'astronomy-engine'

export interface Star {
  id: string
  name: string
  raHours: number
  decDeg: number
  magnitude: number
}

export interface StarObservation {
  star: Star
  azimuthDeg: number
  elevationDeg: number
  confidence: number
}

export const BRIGHT_STARS: Star[] = [
  { id: 'Sirius', name: 'Sirius (α CMa)', raHours: 6.752, decDeg: -16.716, magnitude: -1.46 },
  { id: 'Canopus', name: 'Canopus (α Car)', raHours: 6.399, decDeg: -52.696, magnitude: -0.72 },
  { id: 'Arcturus', name: 'Arcturus (α Boo)', raHours: 14.261, decDeg: 19.182, magnitude: -0.05 },
  { id: 'Vega', name: 'Vega (α Lyr)', raHours: 18.615, decDeg: 38.783, magnitude: 0.03 },
  { id: 'Capella', name: 'Capella (α Aur)', raHours: 5.278, decDeg: 45.998, magnitude: 0.08 },
  { id: 'Rigel', name: 'Rigel (β Ori)', raHours: 5.242, decDeg: -8.202, magnitude: 0.13 },
  { id: 'Procyon', name: 'Procyon (α CMi)', raHours: 7.655, decDeg: 5.225, magnitude: 0.38 },
  { id: 'Betelgeuse', name: 'Betelgeuse (α Ori)', raHours: 5.919, decDeg: 7.407, magnitude: 0.5 },
  { id: 'Altair', name: 'Altair (α Aql)', raHours: 19.846, decDeg: 8.868, magnitude: 0.77 },
  { id: 'Aldebaran', name: 'Aldebaran (α Tau)', raHours: 4.599, decDeg: 16.509, magnitude: 0.85 },
]

export function computeStarPosition(star: Star, latDeg: number, lonDeg: number, altM: number, date: Date): StarObservation {
  const observer = new Observer(latDeg, lonDeg, altM)
  const hor = Horizon(date, observer, star.raHours, star.decDeg, 'normal')

  const elevationDeg = hor.altitude
  const azimuthDeg = hor.azimuth

  const elevationConfidence = elevationDeg > 15 ? clamp((elevationDeg - 15) / 60, 0, 1) : 0
  const magnitudeConfidence = clamp(1 - star.magnitude / 2, 0.3, 1)

  return {
    star,
    azimuthDeg,
    elevationDeg,
    confidence: clamp(elevationConfidence * magnitudeConfidence, 0, 1),
  }
}

export function findVisibleStars(
  latDeg: number,
  lonDeg: number,
  altM: number,
  date: Date,
  minElevationDeg = 15,
): StarObservation[] {
  return BRIGHT_STARS.map((star) => computeStarPosition(star, latDeg, lonDeg, altM, date))
    .filter((obs) => obs.elevationDeg > minElevationDeg)
    .sort((a, b) => b.confidence - a.confidence)
}

export function isNightTime(latDeg: number, lonDeg: number, altM: number, date: Date): boolean {
  const observer = new Observer(latDeg, lonDeg, altM)
  const eq = Equator(Body.Sun, date, observer, true, true)
  const hor = Horizon(date, observer, eq.ra, eq.dec, 'normal')

  return hor.altitude < -12
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

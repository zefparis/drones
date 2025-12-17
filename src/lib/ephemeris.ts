import { Body, Equator, Horizon, Observer } from 'astronomy-engine'
import type { CelestialObservation, NavigationState } from '../types/celestial'

export type SunPredictionOptions = {
  refraction?: 'normal' | 'jplhor' | false
}

export function predictSunObservation(
  state: NavigationState,
  options: SunPredictionOptions = {},
): CelestialObservation {
  const observer = new Observer(state.latitudeDeg, state.longitudeDeg, state.altitudeM)
  const time = new Date(state.timestampMs)

  const eq = Equator(Body.Sun, time, observer, true, true)

  const refraction = options.refraction === false ? undefined : (options.refraction ?? 'normal')
  const hor = Horizon(time, observer, eq.ra, eq.dec, refraction)

  return {
    azimuthDeg: hor.azimuth,
    elevationDeg: hor.altitude,
  }
}

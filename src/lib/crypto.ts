import { hmac } from '@noble/hashes/hmac'
import { sha3_512 } from '@noble/hashes/sha3'
import { bytesToHex, utf8ToBytes } from '@noble/hashes/utils'
import type { CelestialObservation, NavigationState } from '../types/celestial'

export type HmacKey = Uint8Array | string

export function normalizeHmacKey(key: HmacKey): Uint8Array {
  return typeof key === 'string' ? utf8ToBytes(key) : key
}

export function packSignatureMessage(state: NavigationState, sun: CelestialObservation): Uint8Array {
  const buffer = new ArrayBuffer(48)
  const view = new DataView(buffer)

  view.setBigUint64(0, BigInt(Math.round(state.timestampMs)), true)
  view.setFloat64(8, state.latitudeDeg, true)
  view.setFloat64(16, state.longitudeDeg, true)
  view.setFloat64(24, state.altitudeM, true)
  view.setFloat64(32, sun.azimuthDeg, true)
  view.setFloat64(40, sun.elevationDeg, true)

  return new Uint8Array(buffer)
}

export function hmacSha3_512(key: HmacKey, message: Uint8Array): Uint8Array {
  return hmac(sha3_512, normalizeHmacKey(key), message)
}

export function hmacSha3_512Hex(key: HmacKey, message: Uint8Array): string {
  return bytesToHex(hmacSha3_512(key, message))
}

const POPCOUNT_TABLE = (() => {
  const table = new Uint8Array(256)
  for (let i = 0; i < 256; i += 1) {
    let x = i
    let count = 0
    while (x !== 0) {
      x &= x - 1
      count += 1
    }
    table[i] = count
  }
  return table
})()

export function hammingDistanceBits(a: Uint8Array, b: Uint8Array): number {
  if (a.length !== b.length) {
    throw new Error(
      `Cannot compute hamming distance for buffers of different lengths: ${a.length} vs ${b.length}`,
    )
  }

  let distance = 0
  for (let i = 0; i < a.length; i += 1) {
    distance += POPCOUNT_TABLE[a[i] ^ b[i]]
  }

  return distance
}

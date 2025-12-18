/**
 * CORTEX-U7 Navigation Map Component
 * 
 * Displays drone position, waypoints, and trajectory on an interactive map.
 * Uses Leaflet/OpenStreetMap for map tiles (no API key required).
 */

import { useEffect, useState, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { DronePosition } from '../lib/ros'

// Fix Leaflet default marker icon
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

interface Waypoint {
  lat: number
  lon: number
  alt: number
}

interface NavigationMapProps {
  position: DronePosition
  waypoints?: Waypoint[]
  trajectory?: Array<{ lat: number; lon: number }>
}

// Paris center as default
const DEFAULT_CENTER = { lat: 48.8566, lon: 2.3522 }
const INITIAL_ZOOM = 15

// Component to update map center when drone position changes
function MapUpdater({ position }: { position: DronePosition }) {
  const map = useMap()
  
  useEffect(() => {
    if (position?.lat && position?.lon) {
      map.setView([position.lat, position.lon], map.getZoom(), { animate: true })
    }
  }, [position?.lat, position?.lon, map])
  
  return null
}

// Rotated drone marker component
function RotatedDroneMarker({ position }: { position: DronePosition }) {
  const rotatedIcon = useMemo(() => {
    const heading = position?.heading ?? 0
    return L.divIcon({
      className: 'drone-marker',
      html: `<div style="
        width: 40px; 
        height: 40px; 
        display: flex; 
        align-items: center; 
        justify-content: center;
        transform: rotate(${heading}deg);
        filter: drop-shadow(0 0 10px rgba(6, 182, 212, 0.9));
      ">
        <svg viewBox="0 0 24 24" width="32" height="32" fill="#06b6d4" stroke="#fff" stroke-width="1.5">
          <path d="M12 2L4 20h16L12 2z"/>
        </svg>
      </div>`,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    })
  }, [position?.heading])
  
  const lat = position?.lat ?? DEFAULT_CENTER.lat
  const lon = position?.lon ?? DEFAULT_CENTER.lon
  
  return <Marker position={[lat, lon]} icon={rotatedIcon} />
}

export function NavigationMap({ position, waypoints = [], trajectory = [] }: NavigationMapProps) {
  const [isClient, setIsClient] = useState(false)
  
  useEffect(() => {
    setIsClient(true)
  }, [])
  
  const lat = position?.lat ?? DEFAULT_CENTER.lat
  const lon = position?.lon ?? DEFAULT_CENTER.lon

  if (!isClient) {
    return (
      <div className="relative h-full w-full bg-slate-950 flex items-center justify-center">
        <div className="text-slate-500">Loading map...</div>
      </div>
    )
  }

  return (
    <div className="relative h-full w-full bg-slate-950 overflow-hidden">
      <MapContainer 
        center={[lat, lon]}
        zoom={INITIAL_ZOOM}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
        zoomControl={false}
      >
        <TileLayer 
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='© OSM'
        />
        
        {/* Auto-center on drone */}
        <MapUpdater position={position} />
        
        {/* Drone marker with rotation */}
        <RotatedDroneMarker position={position} />
        
        {/* Waypoint markers */}
        {waypoints.map((wp, idx) => (
          <Marker 
            key={idx} 
            position={[wp.lat, wp.lon]}
            icon={L.divIcon({
              className: 'waypoint-marker',
              html: `<div style="
                width: 24px; height: 24px; 
                background: #06b6d4; 
                border: 2px solid white; 
                border-radius: 50%; 
                display: flex; 
                align-items: center; 
                justify-content: center;
                font-size: 11px;
                font-weight: bold;
                color: white;
              ">${idx + 1}</div>`,
              iconSize: [24, 24],
              iconAnchor: [12, 12],
            })}
          />
        ))}
        
        {/* Trajectory line */}
        {trajectory.length > 1 && (
          <Polyline 
            positions={trajectory.map(p => [p.lat, p.lon] as [number, number])}
            color="#06b6d4"
            weight={3}
            opacity={0.7}
            dashArray="5, 10"
          />
        )}
      </MapContainer>
      
      {/* Position overlay */}
      <div className="absolute bottom-2 left-2 z-[1000] rounded bg-slate-900/90 px-2 py-1 text-xs text-slate-300">
        <div className="font-mono">
          {lat.toFixed(6)}°N
        </div>
        <div className="font-mono">
          {lon.toFixed(6)}°E
        </div>
      </div>

      {/* Altitude overlay */}
      <div className="absolute bottom-2 right-2 z-[1000] rounded bg-slate-900/90 px-2 py-1 text-xs text-slate-300">
        <div className="font-mono">
          ALT: {(position?.alt ?? 0).toFixed(1)}m
        </div>
        <div className="font-mono">
          HDG: {(position?.heading ?? 0).toFixed(0)}°
        </div>
      </div>

      {/* North indicator */}
      <div className="absolute right-2 top-2 z-[1000] flex h-8 w-8 items-center justify-center rounded-full bg-slate-900/90 text-xs font-bold text-cyan-400">
        N
      </div>
    </div>
  )
}

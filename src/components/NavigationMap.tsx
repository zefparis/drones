/**
 * CORTEX-U7 Navigation Map Component
 * 
 * Displays drone position, waypoints, and trajectory on an interactive map.
 * Uses canvas-based rendering for lightweight operation without Leaflet dependency.
 */

import { useEffect, useRef, useState } from 'react'
import type { DronePosition } from '../lib/ros'

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
const TILE_SIZE = 256
const INITIAL_ZOOM = 15

export function NavigationMap({ position, waypoints = [], trajectory = [] }: NavigationMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 400, height: 320 })
  const [zoom] = useState(INITIAL_ZOOM)

  // Update dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setDimensions({ width: rect.width, height: rect.height })
      }
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  // Draw map
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { width, height } = dimensions
    canvas.width = width
    canvas.height = height

    // Clear canvas
    ctx.fillStyle = '#0f172a'
    ctx.fillRect(0, 0, width, height)

    // Center on drone position
    const centerLat = position?.lat ?? DEFAULT_CENTER.lat
    const centerLon = position?.lon ?? DEFAULT_CENTER.lon

    // Draw grid
    drawGrid(ctx, width, height)

    // Draw coordinate labels
    drawCoordinates(ctx, width, height, centerLat, centerLon, zoom)

    // Draw trajectory
    if (trajectory.length > 1) {
      drawTrajectory(ctx, width, height, centerLat, centerLon, zoom, trajectory)
    }

    // Draw waypoints
    waypoints.forEach((wp, idx) => {
      drawWaypoint(ctx, width, height, centerLat, centerLon, zoom, wp, idx)
    })

    // Draw drone position
    drawDrone(ctx, width, height, position?.heading ?? 0)

    // Draw compass
    drawCompass(ctx, width, height, position?.heading ?? 0)

  }, [position, waypoints, trajectory, dimensions, zoom])

  return (
    <div ref={containerRef} className="relative h-full w-full bg-slate-950">
      <canvas
        ref={canvasRef}
        className="h-full w-full"
        style={{ display: 'block' }}
      />
      
      {/* Position overlay */}
      <div className="absolute bottom-2 left-2 rounded bg-slate-900/90 px-2 py-1 text-xs text-slate-300">
        <div className="font-mono">
          {(position?.lat ?? DEFAULT_CENTER.lat).toFixed(6)}°N
        </div>
        <div className="font-mono">
          {(position?.lon ?? DEFAULT_CENTER.lon).toFixed(6)}°E
        </div>
      </div>

      {/* Altitude overlay */}
      <div className="absolute bottom-2 right-2 rounded bg-slate-900/90 px-2 py-1 text-xs text-slate-300">
        <div className="font-mono">
          ALT: {(position?.alt ?? 0).toFixed(1)}m
        </div>
        <div className="font-mono">
          HDG: {(position?.heading ?? 0).toFixed(0)}°
        </div>
      </div>

      {/* North indicator */}
      <div className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-slate-900/90 text-xs font-bold text-cyan-400">
        N
      </div>
    </div>
  )
}

// ============================================================================
// DRAWING FUNCTIONS
// ============================================================================

function drawGrid(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.strokeStyle = '#1e293b'
  ctx.lineWidth = 1

  // Vertical lines
  const gridSpacing = 40
  for (let x = 0; x < width; x += gridSpacing) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, height)
    ctx.stroke()
  }

  // Horizontal lines
  for (let y = 0; y < height; y += gridSpacing) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(width, y)
    ctx.stroke()
  }
}

function drawCoordinates(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  centerLat: number,
  centerLon: number,
  zoom: number
) {
  ctx.fillStyle = '#475569'
  ctx.font = '10px monospace'

  // Scale factor (meters per pixel at this zoom level)
  const metersPerPixel = 156543.03392 * Math.cos((centerLat * Math.PI) / 180) / Math.pow(2, zoom)
  
  // Draw scale bar
  const scaleBarLength = 100 // pixels
  const scaleDistance = scaleBarLength * metersPerPixel

  ctx.fillStyle = '#64748b'
  ctx.fillRect(10, height - 30, scaleBarLength, 3)
  ctx.fillText(`${scaleDistance.toFixed(0)}m`, 10, height - 35)
}

function drawTrajectory(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  centerLat: number,
  centerLon: number,
  zoom: number,
  trajectory: Array<{ lat: number; lon: number }>
) {
  if (trajectory.length < 2) return

  ctx.strokeStyle = '#06b6d4'
  ctx.lineWidth = 2
  ctx.setLineDash([5, 5])
  ctx.beginPath()

  trajectory.forEach((point, idx) => {
    const { x, y } = latLonToPixel(point.lat, point.lon, centerLat, centerLon, width, height, zoom)
    if (idx === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }
  })

  ctx.stroke()
  ctx.setLineDash([])
}

function drawWaypoint(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  centerLat: number,
  centerLon: number,
  zoom: number,
  waypoint: Waypoint,
  index: number
) {
  const { x, y } = latLonToPixel(waypoint.lat, waypoint.lon, centerLat, centerLon, width, height, zoom)

  // Draw circle
  ctx.fillStyle = '#06b6d4'
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(x, y, 10, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  // Draw number
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 10px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(`${index + 1}`, x, y)

  // Draw altitude label
  ctx.fillStyle = '#94a3b8'
  ctx.font = '9px sans-serif'
  ctx.fillText(`${waypoint.alt}m`, x, y + 18)
}

function drawDrone(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  heading: number
) {
  const centerX = width / 2
  const centerY = height / 2
  const size = 16

  ctx.save()
  ctx.translate(centerX, centerY)
  ctx.rotate((heading * Math.PI) / 180)

  // Glow effect
  const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 2)
  gradient.addColorStop(0, 'rgba(6, 182, 212, 0.5)')
  gradient.addColorStop(1, 'rgba(6, 182, 212, 0)')
  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.arc(0, 0, size * 2, 0, Math.PI * 2)
  ctx.fill()

  // Drone triangle (pointing up = forward)
  ctx.fillStyle = '#06b6d4'
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(0, -size)
  ctx.lineTo(-size * 0.7, size * 0.7)
  ctx.lineTo(0, size * 0.3)
  ctx.lineTo(size * 0.7, size * 0.7)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()

  ctx.restore()
}

function drawCompass(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  heading: number
) {
  const compassX = width - 50
  const compassY = 50
  const radius = 30

  // Background
  ctx.fillStyle = 'rgba(15, 23, 42, 0.9)'
  ctx.beginPath()
  ctx.arc(compassX, compassY, radius + 5, 0, Math.PI * 2)
  ctx.fill()

  // Compass ring
  ctx.strokeStyle = '#334155'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(compassX, compassY, radius, 0, Math.PI * 2)
  ctx.stroke()

  // Cardinal directions
  ctx.fillStyle = '#64748b'
  ctx.font = '10px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  const directions = [
    { label: 'N', angle: 0, color: '#f87171' },
    { label: 'E', angle: 90, color: '#64748b' },
    { label: 'S', angle: 180, color: '#64748b' },
    { label: 'W', angle: 270, color: '#64748b' },
  ]

  directions.forEach(({ label, angle, color }) => {
    const rad = ((angle - heading) * Math.PI) / 180
    const x = compassX + Math.sin(rad) * (radius - 10)
    const y = compassY - Math.cos(rad) * (radius - 10)
    ctx.fillStyle = color
    ctx.fillText(label, x, y)
  })

  // Heading indicator
  ctx.fillStyle = '#06b6d4'
  ctx.beginPath()
  ctx.moveTo(compassX, compassY - radius + 5)
  ctx.lineTo(compassX - 5, compassY - radius + 12)
  ctx.lineTo(compassX + 5, compassY - radius + 12)
  ctx.closePath()
  ctx.fill()

  // Heading value
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 11px monospace'
  ctx.fillText(`${heading.toFixed(0)}°`, compassX, compassY)
}

function latLonToPixel(
  lat: number,
  lon: number,
  centerLat: number,
  centerLon: number,
  width: number,
  height: number,
  zoom: number
): { x: number; y: number } {
  // Simplified Mercator projection
  const scale = Math.pow(2, zoom) * TILE_SIZE / (2 * Math.PI)
  
  const centerX = scale * (centerLon * Math.PI / 180 + Math.PI)
  const centerY = scale * (Math.PI - Math.log(Math.tan(Math.PI / 4 + centerLat * Math.PI / 360)))
  
  const pointX = scale * (lon * Math.PI / 180 + Math.PI)
  const pointY = scale * (Math.PI - Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360)))
  
  return {
    x: width / 2 + (pointX - centerX),
    y: height / 2 + (pointY - centerY),
  }
}

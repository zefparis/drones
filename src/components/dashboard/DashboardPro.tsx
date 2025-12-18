/**
 * CORTEX-U7 Dashboard Pro - Military Cockpit Interface
 * Investor Demo - Spectacular 3D Real-time Dashboard
 */

import { useEffect, useState, useRef, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment } from '@react-three/drei';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { DroneModel3D } from './DroneModel3D';
import { TelemetryHUD } from './TelemetryHUD';
import { SensorPanel } from './SensorPanel';
import { ThreatRadar } from './ThreatRadar';
import { FSMVisualizer } from './FSMVisualizer';
import { FPVStream } from './FPVStream';
import { useRosBridge } from '../../lib/ros';
import { Home } from 'lucide-react';

// Fix Leaflet marker icons
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface DashboardProProps {
  onClose?: () => void;
}

export function DashboardPro({ onClose }: DashboardProProps) {
  const { connected, position, state, threat } = useRosBridge();
  
  // Simulated/derived data for demo (would come from ROS in production)
  const orientation = { roll: 2.5, pitch: -1.2, yaw: 45 };
  const battery = { percentage: 85, voltage: 12.4, current: 8.2 };
  const sensors = {
    gps_enabled: true,
    lidar_active: true,
    camera_active: true,
    motors: [true, true, true, true],
  };
  
  const [missionActive, setMissionActive] = useState(false);
  const [flightTime, setFlightTime] = useState(0);
  const alertAudioRef = useRef<HTMLAudioElement>(null);

  // Flight time counter
  useEffect(() => {
    if (!missionActive) return;
    const timer = setInterval(() => setFlightTime((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, [missionActive]);

  // Threat alert sound
  useEffect(() => {
    if (threat?.level === 'HIGH' && alertAudioRef.current) {
      alertAudioRef.current.play().catch(() => {});
    }
  }, [threat?.level]);

  // Simulated trajectory for demo
  const trajectory = [
    { lat: position?.lat || 48.8566, lon: position?.lon || 2.3522 },
    { lat: (position?.lat || 48.8566) + 0.001, lon: (position?.lon || 2.3522) + 0.001 },
    { lat: (position?.lat || 48.8566) + 0.002, lon: (position?.lon || 2.3522) - 0.001 },
  ];

  return (
    <div className="h-screen bg-slate-950 overflow-hidden relative">
      {/* CRT Scanline Effect */}
      <div className="absolute inset-0 pointer-events-none z-50 opacity-5">
        <div className="h-full w-full bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(6,182,212,0.03)_2px,rgba(6,182,212,0.03)_4px)]" />
      </div>

      {/* Header */}
      <header className="h-14 border-b border-cyan-500/30 bg-slate-950/95 backdrop-blur relative z-10">
        <div className="h-full px-4 flex items-center justify-between">
          {/* Logo & Title */}
          <div className="flex items-center gap-4">
            {onClose && (
              <button
                onClick={onClose}
                className="flex items-center gap-2 px-3 py-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <Home className="w-4 h-4" />
                <span className="text-sm hidden sm:inline">Accueil</span>
              </button>
            )}
            <div className="h-8 w-px bg-cyan-500/30" />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                <span className="text-white font-bold text-lg">IA</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 tracking-wider">
                  CORTEX-U7
                </h1>
                <p className="text-[10px] text-cyan-400/60 tracking-widest">AUTONOMOUS TACTICAL INTELLIGENCE</p>
              </div>
            </div>
          </div>

          {/* Status Indicators */}
          <div className="flex items-center gap-4">
            <StatusIndicator label="GPS" value={sensors?.gps_enabled ? 'ON' : 'OFF'} status={sensors?.gps_enabled ? 'active' : 'inactive'} />
            <StatusIndicator label="PWR" value={`${battery?.percentage || 0}%`} status={battery?.percentage && battery.percentage > 20 ? 'active' : 'warning'} />
            <StatusIndicator label="THR" value={threat?.level || 'CLEAR'} status={threat?.level === 'HIGH' ? 'critical' : 'active'} />
            <StatusIndicator label="LINK" value={connected ? 'CONN' : 'DISC'} status={connected ? 'active' : 'inactive'} />
            
            <div className="h-8 w-px bg-slate-700" />
            
            <button
              onClick={() => setMissionActive(!missionActive)}
              className={`px-5 py-2 rounded font-bold text-sm tracking-wider transition-all ${
                missionActive
                  ? 'bg-red-600 text-white animate-pulse shadow-lg shadow-red-600/50'
                  : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-400 hover:to-emerald-500 shadow-lg shadow-green-500/30'
              }`}
            >
              {missionActive ? '⏹ ABORT' : '▶ START'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Dashboard Grid */}
      <div className="h-[calc(100vh-56px)] grid grid-cols-12 grid-rows-6 gap-1 p-1">
        
        {/* 3D Map View - 8 cols x 4 rows */}
        <div className="col-span-8 row-span-4 bg-slate-900 rounded-lg overflow-hidden border border-cyan-500/20 relative">
          <MapView position={position?.lat && position?.lon ? { lat: position.lat, lon: position.lon, alt: position.alt } : undefined} trajectory={trajectory} />
          
          {/* Map HUD Overlay */}
          <div className="absolute top-3 left-3 space-y-2 z-[1000]">
            <div className="bg-slate-950/90 backdrop-blur-sm px-3 py-1.5 rounded border border-cyan-500/30">
              <span className="text-cyan-400 text-xs font-mono">LAT</span>
              <span className="text-white text-sm font-mono ml-2">{(position?.lat || 48.8566).toFixed(6)}°</span>
            </div>
            <div className="bg-slate-950/90 backdrop-blur-sm px-3 py-1.5 rounded border border-cyan-500/30">
              <span className="text-cyan-400 text-xs font-mono">LON</span>
              <span className="text-white text-sm font-mono ml-2">{(position?.lon || 2.3522).toFixed(6)}°</span>
            </div>
            <div className="bg-slate-950/90 backdrop-blur-sm px-3 py-1.5 rounded border border-cyan-500/30">
              <span className="text-cyan-400 text-xs font-mono">ALT</span>
              <span className="text-white text-sm font-mono ml-2">{(position?.alt || 0).toFixed(1)} m</span>
            </div>
          </div>

          {/* Mission Status */}
          {missionActive && (
            <div className="absolute top-3 right-3 z-[1000] bg-green-500/20 border border-green-500/50 rounded px-3 py-1.5 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-green-400 text-xs font-mono tracking-wider">MISSION ACTIVE</span>
            </div>
          )}
        </div>

        {/* 3D Drone Model - 4 cols x 4 rows */}
        <div className="col-span-4 row-span-4 bg-slate-900 rounded-lg overflow-hidden border border-cyan-500/20 relative">
          <div className="absolute top-2 left-2 z-10">
            <h3 className="text-xs font-bold text-cyan-400 tracking-wider">3D MODEL</h3>
          </div>
          
          <Canvas className="bg-gradient-to-b from-slate-900 to-slate-950">
            <Suspense fallback={null}>
              <PerspectiveCamera makeDefault position={[2, 1.5, 2]} />
              <OrbitControls enableZoom={true} autoRotate autoRotateSpeed={0.5} />
              <ambientLight intensity={0.4} />
              <directionalLight position={[5, 10, 5]} intensity={1} castShadow />
              <pointLight position={[-5, 5, -5]} intensity={0.5} color="#06b6d4" />
              <Environment preset="night" />
              
              <DroneModel3D
                rotation={orientation || { roll: 0, pitch: 0, yaw: 0 }}
                sensors={{
                  motors: [true, true, true, true],
                  lidar_active: sensors?.lidar_active ?? true,
                  gps_enabled: sensors?.gps_enabled ?? true,
                  camera_active: true,
                }}
                threats={[]}
              />
              
              {/* Ground Grid */}
              <gridHelper args={[10, 20, '#1e3a5f', '#0f172a']} position={[0, -1, 0]} />
            </Suspense>
          </Canvas>

          {/* Orientation Overlay */}
          <div className="absolute bottom-3 left-3 right-3 bg-slate-950/90 backdrop-blur-sm rounded p-2 border border-cyan-500/30">
            <div className="grid grid-cols-3 gap-2 text-xs font-mono">
              <div className="text-center">
                <span className="text-cyan-400">ROLL</span>
                <div className="text-white">{(orientation?.roll || 0).toFixed(1)}°</div>
              </div>
              <div className="text-center">
                <span className="text-cyan-400">PITCH</span>
                <div className="text-white">{(orientation?.pitch || 0).toFixed(1)}°</div>
              </div>
              <div className="text-center">
                <span className="text-cyan-400">YAW</span>
                <div className="text-white">{(orientation?.yaw || 0).toFixed(1)}°</div>
              </div>
            </div>
          </div>
        </div>

        {/* Telemetry HUD - Full width x 1 row */}
        <div className="col-span-12 row-span-1 bg-slate-900 rounded-lg border border-cyan-500/20 p-3">
          <TelemetryHUD
            altitude={position?.alt || 0}
            speed={5.2}
            heading={orientation?.yaw || 0}
            battery={battery || { percentage: 85, voltage: 12.4, current: 8.2 }}
            temperature={42}
            satellites={12}
            signalStrength={92}
            flightTime={flightTime}
          />
        </div>

        {/* Bottom Panels - 5 panels */}
        
        {/* Sensors */}
        <div className="col-span-2 row-span-1 bg-slate-900 rounded-lg border border-cyan-500/20 p-2 overflow-hidden">
          <SensorPanel
            sensors={{
              gps_enabled: sensors?.gps_enabled ?? true,
              lidar_active: sensors?.lidar_active ?? true,
              camera_active: true,
              imu_status: 'OK',
              barometer: 1013,
              motors: [true, true, true, true],
              cpu_usage: 45,
              memory_usage: 62,
            }}
          />
        </div>

        {/* Threat Radar */}
        <div className="col-span-3 row-span-1 bg-slate-900 rounded-lg border border-cyan-500/20 p-2">
          <ThreatRadar
            threats={[
              { id: '1', bearing: 45, distance: 450, level: 'MEDIUM' as const, type: 'RF' },
              { id: '2', bearing: 180, distance: 800, level: 'LOW' as const, type: 'ACOUSTIC' },
            ]}
            range={1000}
          />
        </div>

        {/* FSM State */}
        <div className="col-span-2 row-span-1 bg-slate-900 rounded-lg border border-cyan-500/20 p-2">
          <FSMVisualizer
            currentState={typeof state === 'string' ? state : state?.state || 'HOVER'}
            availableTransitions={['WAYPOINT', 'RTH', 'LANDING']}
          />
        </div>

        {/* Celestial (placeholder) */}
        <div className="col-span-2 row-span-1 bg-slate-900 rounded-lg border border-cyan-500/20 p-2 flex flex-col">
          <h3 className="text-xs font-bold text-cyan-400 tracking-wider mb-2">CELESTIAL NAV</h3>
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl mb-1">🌙</div>
              <div className="text-xs text-slate-400">GPS-Denied Ready</div>
              <div className="text-xs text-cyan-400 font-mono mt-1">3 STARS LOCKED</div>
            </div>
          </div>
        </div>

        {/* FPV Stream */}
        <div className="col-span-3 row-span-1 bg-slate-900 rounded-lg border border-cyan-500/20 overflow-hidden">
          <FPVStream connected={connected} />
        </div>
      </div>

      {/* Alert Sound */}
      <audio ref={alertAudioRef} src="/sounds/alert-high.mp3" preload="auto" />
    </div>
  );
}

// Status Indicator Component
function StatusIndicator({ 
  label, 
  value, 
  status 
}: { 
  label: string; 
  value: string; 
  status: 'active' | 'warning' | 'critical' | 'inactive';
}) {
  const colors = {
    active: 'text-green-400 border-green-500/50 bg-green-500/10',
    warning: 'text-amber-400 border-amber-500/50 bg-amber-500/10',
    critical: 'text-red-400 border-red-500/50 bg-red-500/10 animate-pulse',
    inactive: 'text-slate-500 border-slate-700 bg-slate-800/50',
  };

  return (
    <div className={`border rounded px-2.5 py-1 ${colors[status]}`}>
      <div className="text-[10px] opacity-70 tracking-wider">{label}</div>
      <div className="text-xs font-mono font-bold">{value}</div>
    </div>
  );
}

// Map View Component
function MapView({ 
  position, 
  trajectory 
}: { 
  position?: { lat: number; lon: number; alt?: number }; 
  trajectory: Array<{ lat: number; lon: number }>;
}) {
  const lat = position?.lat || 48.8566;
  const lon = position?.lon || 2.3522;

  return (
    <MapContainer
      center={[lat, lon]}
      zoom={16}
      style={{ height: '100%', width: '100%' }}
      zoomControl={false}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
      />
      <MapUpdater position={{ lat, lon }} />
      
      {/* Drone Marker */}
      <Marker
        position={[lat, lon]}
        icon={L.divIcon({
          className: 'drone-marker',
          html: `<div style="
            width: 32px; height: 32px;
            display: flex; align-items: center; justify-content: center;
            filter: drop-shadow(0 0 10px rgba(6, 182, 212, 0.8));
          ">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="#06b6d4" stroke="#fff" stroke-width="1">
              <path d="M12 2L4 20h16L12 2z"/>
            </svg>
          </div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        })}
      />

      {/* Trajectory */}
      {trajectory.length > 1 && (
        <Polyline
          positions={trajectory.map((p) => [p.lat, p.lon] as [number, number])}
          color="#06b6d4"
          weight={2}
          opacity={0.6}
          dashArray="5, 10"
        />
      )}
    </MapContainer>
  );
}

function MapUpdater({ position }: { position: { lat: number; lon: number } }) {
  const map = useMap();
  
  useEffect(() => {
    map.setView([position.lat, position.lon], map.getZoom(), { animate: true });
  }, [position.lat, position.lon, map]);
  
  return null;
}

export default DashboardPro;

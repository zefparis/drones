/**
 * CORTEX-U7 Dashboard Pro - Military Cockpit Interface
 * Investor Demo - Spectacular 3D Real-time Dashboard
 * Optimized for 1920x1080 - All panels visible without scroll
 */

import { useEffect, useState, useRef, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment } from '@react-three/drei';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { DroneModel3D } from './DroneModel3D';
import { ThreatRadar } from './ThreatRadar';
import { FPVStream } from './FPVStream';
import { useRosBridge } from '../../lib/ros';
import { Home, Activity, Cpu, Star } from 'lucide-react';

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
  
  // Simulated/derived data for demo
  const orientation = { roll: 2.5, pitch: -1.2, yaw: 45 };
  const battery = { percentage: 85, voltage: 12.4, current: 8.2 };
  const velocity = { speed: 5.2 };
  const sensors = {
    gps_enabled: true,
    lidar_active: true,
    camera_active: true,
    vio_tracking: true,
    satellites: 12,
    signal: 92,
    temperature: 42,
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

  // Simulated trajectory
  const trajectory = [
    { lat: position?.lat || 48.8566, lon: position?.lon || 2.3522 },
    { lat: (position?.lat || 48.8566) + 0.001, lon: (position?.lon || 2.3522) + 0.001 },
    { lat: (position?.lat || 48.8566) + 0.002, lon: (position?.lon || 2.3522) - 0.001 },
  ];

  const formatFlightTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentState = typeof state === 'string' ? state : state?.state || 'HOVER';

  return (
    <div className="h-screen bg-slate-950 flex flex-col overflow-hidden">
      {/* CRT Scanline Effect */}
      <div className="absolute inset-0 pointer-events-none z-50 opacity-10">
        <div className="h-full w-full bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,#0ff1_2px,#0ff1_4px)]" />
      </div>

      {/* Header - 56px fixed */}
      <header className="h-14 flex-shrink-0 border-b border-cyan-500/30 bg-slate-950/90 backdrop-blur relative z-10">
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
          <div className="flex items-center gap-3">
            <StatusIndicator label="GPS" value={sensors.gps_enabled ? 'ON' : 'OFF'} status={sensors.gps_enabled ? 'active' : 'inactive'} />
            <StatusIndicator label="PWR" value={`${battery.percentage}%`} status={battery.percentage > 20 ? 'active' : 'warning'} />
            <StatusIndicator label="THR" value={threat?.level || 'CLEAR'} status={threat?.level === 'HIGH' ? 'critical' : 'active'} />
            <StatusIndicator label="LINK" value={connected ? 'CONN' : 'DISC'} status={connected ? 'active' : 'inactive'} />
            
            <div className="h-8 w-px bg-slate-700" />
            
            <button
              onClick={() => setMissionActive(!missionActive)}
              className={`px-4 py-1.5 rounded font-bold text-sm tracking-wider transition-all ${
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

      {/* Main Content - calculated height */}
      <div className="flex-1 flex flex-col gap-1.5 p-1.5 overflow-hidden min-h-0">
        
        {/* Top Row: Map + 3D Model + Stats - 50% */}
        <div className="flex-[5] grid grid-cols-12 gap-1.5 min-h-0">
          
          {/* 3D Map - 6 columns */}
          <div className="col-span-6 bg-slate-900 rounded-lg overflow-hidden border border-cyan-500/30 relative">
            <MapView 
              position={position?.lat && position?.lon ? { lat: position.lat, lon: position.lon } : undefined}
              trajectory={trajectory}
            />
            
            {/* Mini HUD overlay */}
            <div className="absolute top-3 left-3 space-y-1.5 z-[1000]">
              <div className="bg-slate-950/90 backdrop-blur px-2.5 py-1 rounded text-xs font-mono border border-cyan-500/30">
                <span className="text-cyan-400">LAT</span> <span className="text-white">{(position?.lat || 48.8566).toFixed(6)}</span>
              </div>
              <div className="bg-slate-950/90 backdrop-blur px-2.5 py-1 rounded text-xs font-mono border border-cyan-500/30">
                <span className="text-cyan-400">LON</span> <span className="text-white">{(position?.lon || 2.3522).toFixed(6)}</span>
              </div>
              <div className="bg-slate-950/90 backdrop-blur px-2.5 py-1 rounded text-xs font-mono border border-cyan-500/30">
                <span className="text-cyan-400">ALT</span> <span className="text-white">{(position?.alt || 35).toFixed(1)} m</span>
              </div>
            </div>

            {missionActive && (
              <div className="absolute top-3 right-3 z-[1000] bg-green-500/20 border border-green-500/50 rounded px-2.5 py-1 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-green-400 text-xs font-mono">MISSION ACTIVE</span>
              </div>
            )}
          </div>

          {/* 3D Drone Model - 4 columns */}
          <div className="col-span-4 bg-slate-900 rounded-lg overflow-hidden border border-cyan-500/30 relative">
            <div className="absolute top-2 left-2 bg-cyan-500/20 backdrop-blur px-2 py-0.5 rounded text-xs font-bold text-cyan-400 z-10">
              3D MODEL
            </div>
            
            <Canvas className="bg-gradient-to-b from-slate-900 to-slate-950">
              <Suspense fallback={null}>
                <PerspectiveCamera makeDefault position={[2.5, 1.5, 2.5]} />
                <OrbitControls enableZoom={true} enablePan={false} autoRotate autoRotateSpeed={0.5} />
                <ambientLight intensity={0.5} />
                <directionalLight position={[10, 10, 5]} intensity={1} />
                <Environment preset="night" />
                
                <DroneModel3D 
                  rotation={orientation}
                  sensors={{
                    motors: [true, true, true, true],
                    lidar_active: sensors.lidar_active,
                    gps_enabled: sensors.gps_enabled,
                    camera_active: sensors.camera_active,
                  }}
                  threats={[]}
                />
                
                <gridHelper args={[10, 20, '#1e3a5f', '#0f172a']} position={[0, -1, 0]} />
              </Suspense>
            </Canvas>

            {/* Orientation Overlay */}
            <div className="absolute bottom-2 left-2 right-2 bg-slate-950/90 backdrop-blur rounded p-1.5 border border-cyan-500/30">
              <div className="grid grid-cols-3 gap-1 text-xs">
                <div className="text-center">
                  <span className="text-cyan-400 text-[10px]">ROLL</span>
                  <div className="text-white font-mono">{orientation.roll.toFixed(1)}°</div>
                </div>
                <div className="text-center">
                  <span className="text-cyan-400 text-[10px]">PITCH</span>
                  <div className="text-white font-mono">{orientation.pitch.toFixed(1)}°</div>
                </div>
                <div className="text-center">
                  <span className="text-cyan-400 text-[10px]">YAW</span>
                  <div className="text-white font-mono">{orientation.yaw.toFixed(1)}°</div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats - 2 columns */}
          <div className="col-span-2 grid grid-rows-6 gap-1">
            <QuickStat label="↑ ALT" value={`${(position?.alt || 35).toFixed(1)}`} unit="m" />
            <QuickStat label="→ SPD" value={`${velocity.speed.toFixed(1)}`} unit="m/s" />
            <QuickStat label="⟳ HDG" value={`${orientation.yaw.toFixed(0)}`} unit="°" />
            <QuickStat label="⚡ BATT" value={`${battery.percentage}`} unit="%" color={battery.percentage > 20 ? 'cyan' : 'red'} />
            <QuickStat label="📡 GPS" value={`${sensors.satellites}`} unit="sats" />
            <QuickStat label="📶 LINK" value={`${sensors.signal}`} unit="%" />
          </div>
        </div>

        {/* Middle Row: Telemetry HUD - 12% */}
        <div className="flex-[1.2] bg-slate-900 rounded-lg border border-cyan-500/30 px-4 py-2 flex items-center justify-around min-h-0">
          <TelemetryItem icon="↑" label="ALT" value={`${(position?.alt || 35).toFixed(1)} m`} />
          <TelemetryItem icon="→" label="SPD" value={`${velocity.speed.toFixed(1)} m/s`} />
          <TelemetryItem icon="⟳" label="HDG" value={`${orientation.yaw.toFixed(0)}°`} />
          <TelemetryItem icon="⚡" label="BATT" value={`${battery.percentage}%`} />
          <TelemetryItem icon="🌡" label="TEMP" value={`${sensors.temperature}°C`} />
          <TelemetryItem icon="⏱" label="FLT" value={formatFlightTime(flightTime)} />
          <TelemetryItem icon="🕐" label="UTC" value={new Date().toLocaleTimeString('en-US', { hour12: false })} />
        </div>

        {/* Bottom Row: 5 Panels - 38% */}
        <div className="flex-[3.8] grid grid-cols-5 gap-1.5 min-h-0">
          
          {/* Sensors Panel */}
          <div className="bg-slate-900 rounded-lg border border-cyan-500/30 p-2 overflow-hidden flex flex-col">
            <h3 className="text-xs font-bold text-cyan-400 mb-2 flex items-center gap-1.5 flex-shrink-0">
              <Activity className="w-3.5 h-3.5" />
              SENSORS
            </h3>
            <div className="space-y-1 overflow-auto flex-1 min-h-0">
              <SensorStatus name="GPS" active={sensors.gps_enabled} status="LOCKED" />
              <SensorStatus name="LIDAR" active={sensors.lidar_active} status="SCANNING" />
              <SensorStatus name="VIO" active={sensors.vio_tracking} status="TRACKING" />
              <SensorStatus name="IMU" active={true} status="NOMINAL" />
              <SensorStatus name="COMPASS" active={true} status="CAL" />
              <SensorStatus name="BARO" active={true} status="OK" />
            </div>
          </div>

          {/* Threat Radar */}
          <div className="bg-slate-900 rounded-lg border border-cyan-500/30 p-2 relative overflow-hidden">
            <ThreatRadar 
              threats={[
                { id: '1', bearing: 45, distance: 450, level: 'MEDIUM' as const, type: 'RF' },
                { id: '2', bearing: 180, distance: 800, level: 'LOW' as const, type: 'ACOUSTIC' },
              ]} 
              range={1000}
            />
          </div>

          {/* FSM State */}
          <div className="bg-slate-900 rounded-lg border border-cyan-500/30 p-2 overflow-hidden flex flex-col">
            <h3 className="text-xs font-bold text-cyan-400 mb-2 flex items-center gap-1.5 flex-shrink-0">
              <Cpu className="w-3.5 h-3.5" />
              FSM STATE
            </h3>
            <div className="flex-1 overflow-auto min-h-0">
              <FSMCompact currentState={currentState} />
            </div>
          </div>

          {/* Celestial Nav */}
          <div className="bg-slate-900 rounded-lg border border-cyan-500/30 p-2 relative flex flex-col">
            <h3 className="text-xs font-bold text-cyan-400 mb-1 flex items-center gap-1.5 flex-shrink-0">
              <Star className="w-3.5 h-3.5" />
              CELESTIAL NAV
            </h3>
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="text-3xl mb-1">🌙</div>
                <div className="text-[10px] text-slate-400">GPS-Denied Mode</div>
                <div className="text-xs text-green-400 font-bold mt-1">READY</div>
              </div>
            </div>
            <div className="bg-slate-950/90 rounded p-1.5 text-[10px] border border-cyan-500/30 flex-shrink-0">
              <div className="flex justify-between">
                <span className="text-slate-400">Stars Locked</span>
                <span className="text-cyan-400 font-bold">3</span>
              </div>
            </div>
          </div>

          {/* FPV Camera */}
          <div className="bg-slate-900 rounded-lg border border-cyan-500/30 overflow-hidden relative">
            <div className="absolute top-2 left-2 bg-red-500/20 backdrop-blur px-2 py-0.5 rounded text-[10px] font-bold text-red-400 z-10 flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              FPV CAM
            </div>
            <FPVStream connected={connected} />
          </div>
        </div>
      </div>

      {/* Sound Effects */}
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
    <div className={`border rounded px-2 py-0.5 ${colors[status]}`}>
      <div className="text-[9px] opacity-70 tracking-wider">{label}</div>
      <div className="text-[11px] font-mono font-bold">{value}</div>
    </div>
  );
}

// Quick Stat Component
function QuickStat({ label, value, unit, color = 'cyan' }: { 
  label: string; 
  value: string; 
  unit: string; 
  color?: 'cyan' | 'red' | 'green';
}) {
  const colors = {
    cyan: 'border-cyan-500/30 text-cyan-400',
    red: 'border-red-500/30 text-red-400 animate-pulse',
    green: 'border-green-500/30 text-green-400'
  };

  return (
    <div className={`bg-slate-900 border ${colors[color]} rounded-lg p-1.5 flex flex-col justify-center`}>
      <div className="text-[10px] text-slate-400 mb-0.5">{label}</div>
      <div className="flex items-baseline gap-0.5">
        <span className="text-lg font-bold font-mono leading-none">{value}</span>
        <span className="text-[10px] text-slate-500">{unit}</span>
      </div>
    </div>
  );
}

// Telemetry Item Component
function TelemetryItem({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="text-xl">{icon}</div>
      <div>
        <div className="text-[10px] text-slate-400">{label}</div>
        <div className="text-sm font-mono font-bold text-cyan-400">{value}</div>
      </div>
    </div>
  );
}

// Sensor Status Component
function SensorStatus({ name, active, status }: { name: string; active: boolean; status: string }) {
  return (
    <div className="flex items-center justify-between p-1.5 rounded bg-slate-800/50 border border-slate-700/50">
      <div className="flex items-center gap-1.5">
        <div className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-green-500' : 'bg-slate-600'}`} />
        <span className="text-[10px] font-medium text-slate-300">{name}</span>
      </div>
      <span className={`text-[10px] font-mono ${active ? 'text-green-400' : 'text-slate-500'}`}>
        {active ? status : 'OFF'}
      </span>
    </div>
  );
}

// FSM Compact Visualizer
function FSMCompact({ currentState }: { currentState: string }) {
  const states = [
    { name: 'IDLE', icon: '⏸' },
    { name: 'TAKEOFF', icon: '🛫' },
    { name: 'HOVER', icon: '⏸' },
    { name: 'NAVIGATE', icon: '🧭' },
    { name: 'AVOID', icon: '⚠️' },
    { name: 'RTH', icon: '🏠' },
    { name: 'LAND', icon: '🛬' }
  ];

  return (
    <div className="space-y-0.5">
      {states.map(state => (
        <div 
          key={state.name}
          className={`
            px-1.5 py-1 rounded text-[10px] font-medium transition-all
            flex items-center gap-1.5
            ${currentState === state.name || (currentState === 'HOVER' && state.name === 'HOVER')
              ? 'bg-cyan-500/20 border border-cyan-500 text-cyan-300' 
              : 'bg-slate-800/30 text-slate-500 border border-transparent'
            }
          `}
        >
          <span className="text-sm">{state.icon}</span>
          <span className="flex-1">{state.name}</span>
          {(currentState === state.name || (currentState === 'HOVER' && state.name === 'HOVER')) && (
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          )}
        </div>
      ))}
    </div>
  );
}

// Map View Component
function MapView({ 
  position, 
  trajectory 
}: { 
  position?: { lat: number; lon: number }; 
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

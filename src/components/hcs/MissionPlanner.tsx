/**
 * Mission Planner - Plan mission with waypoints on interactive Leaflet map
 * Click on map to add waypoints, edit altitude and actions
 */

import { useState, useCallback, useEffect } from 'react';
import { MapPin, Trash2, Navigation } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icon issue
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export interface Waypoint {
  id: number;
  lat: number;
  lon: number;
  alt: number;
  action: 'HOVER' | 'SCAN' | 'DROP' | 'RTH';
}

export interface MissionData {
  name: string;
  type: 'RECON' | 'STRIKE' | 'ESCORT' | 'TRAINING';
  priority: 'STEALTH' | 'SPEED' | 'NONE';
  waypoints: Waypoint[];
  maxDuration: number;
  gpsAllowed: boolean;
}

interface MissionPlannerProps {
  onComplete: (mission: MissionData) => void;
  defaultCenter?: { lat: number; lon: number };
}

const MISSION_TYPES = [
  { value: 'RECON', label: 'Reconnaissance', icon: '🔍' },
  { value: 'STRIKE', label: 'Strike', icon: '🎯' },
  { value: 'ESCORT', label: 'Escort', icon: '🛡️' },
  { value: 'TRAINING', label: 'Training', icon: '📚' },
] as const;

const PRIORITIES = [
  { value: 'STEALTH', label: 'Stealth (GPS OFF)', color: 'text-purple-400' },
  { value: 'SPEED', label: 'Speed', color: 'text-orange-400' },
  { value: 'NONE', label: 'None', color: 'text-slate-400' },
] as const;

// Map click handler component
function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lon: number) => void }) {
  useMapEvents({
    click(e: L.LeafletMouseEvent) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
}

export function MissionPlanner({ onComplete, defaultCenter }: MissionPlannerProps) {
  const [mission, setMission] = useState<Partial<MissionData>>({
    name: `Mission-${new Date().toISOString().slice(0, 10)}`,
    type: 'RECON',
    priority: 'STEALTH',
    maxDuration: 30,
    gpsAllowed: false,
  });

  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [nextId, setNextId] = useState(1);
  const [isClient, setIsClient] = useState(false);

  const center = defaultCenter || { lat: 43.83, lon: 4.36 }; // Alès default

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleMapClick = useCallback((lat: number, lon: number) => {
    const newWp: Waypoint = {
      id: nextId,
      lat,
      lon,
      alt: 50,
      action: 'HOVER',
    };
    setWaypoints(prev => [...prev, newWp]);
    setNextId(prev => prev + 1);
  }, [nextId]);

  const updateAltitude = useCallback((id: number, alt: number) => {
    setWaypoints(prev => prev.map(wp => 
      wp.id === id ? { ...wp, alt } : wp
    ));
  }, []);

  const removeWaypoint = useCallback((id: number) => {
    setWaypoints(prev => prev.filter(wp => wp.id !== id));
  }, []);

  const handleSubmit = () => {
    if (waypoints.length < 2) {
      alert('Minimum 2 waypoints required');
      return;
    }

    onComplete({
      ...mission,
      waypoints,
      gpsAllowed: mission.priority !== 'STEALTH',
    } as MissionData);
  };

  const estimatedDuration = Math.round(waypoints.length * 2.5);

  return (
    <div className="bg-slate-900 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <Navigation className="w-6 h-6 text-cyan-400" />
        <h2 className="text-xl font-bold text-white">Mission Planner</h2>
      </div>

      {/* Mission Config */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm text-slate-400 mb-1">Mission Name</label>
          <input
            type="text"
            value={mission.name}
            onChange={(e) => setMission(prev => ({ ...prev, name: e.target.value }))}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm text-slate-400 mb-1">Type</label>
          <select
            value={mission.type}
            onChange={(e) => setMission(prev => ({ ...prev, type: e.target.value as MissionData['type'] }))}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
          >
            {MISSION_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-slate-400 mb-1">Priority</label>
          <select
            value={mission.priority}
            onChange={(e) => {
              const priority = e.target.value as MissionData['priority'];
              setMission(prev => ({ 
                ...prev, 
                priority,
                gpsAllowed: priority !== 'STEALTH'
              }));
            }}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
          >
            {PRIORITIES.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-slate-400 mb-1">Max Duration (min)</label>
          <input
            type="number"
            value={mission.maxDuration}
            onChange={(e) => setMission(prev => ({ ...prev, maxDuration: parseInt(e.target.value) || 30 }))}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
            min={5}
            max={120}
          />
        </div>
      </div>

      {/* GPS Warning */}
      {mission.priority === 'STEALTH' && (
        <div className="bg-amber-500/10 border border-amber-500/50 rounded-lg p-3 mb-6 flex items-center gap-2">
          <span className="text-amber-400">⚠️</span>
          <span className="text-sm text-amber-300">
            STEALTH mode: GPS will be disabled. Navigation via celestial + VIO only.
          </span>
        </div>
      )}

      {/* Interactive Map */}
      <div className="mb-6">
        <label className="block text-sm text-slate-400 mb-2">
          Waypoints ({waypoints.length}) - Click on map to add
        </label>
        <div className="h-80 rounded-lg overflow-hidden border border-slate-700">
          {isClient && (
            <MapContainer 
              center={[center.lat, center.lon]}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
              className="z-0"
            >
              <TileLayer 
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='© OpenStreetMap'
              />
              <MapClickHandler onMapClick={handleMapClick} />
              
              {/* Markers */}
              {waypoints.map((wp) => (
                <Marker 
                  key={wp.id} 
                  position={[wp.lat, wp.lon]}
                />
              ))}
              
              {/* Trajectory line */}
              {waypoints.length > 1 && (
                <Polyline 
                  positions={waypoints.map(wp => [wp.lat, wp.lon] as [number, number])}
                  color="#06b6d4"
                  weight={3}
                  opacity={0.8}
                />
              )}
            </MapContainer>
          )}
        </div>
      </div>

      {/* Waypoints List */}
      <div className="mb-6">
        <h3 className="font-semibold mb-3 text-slate-300">Waypoint Details</h3>
        {waypoints.length === 0 ? (
          <div className="bg-slate-800/50 rounded-lg p-6 text-center">
            <MapPin className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p className="text-slate-500">No waypoints yet</p>
            <p className="text-sm text-slate-600">Click on the map to add waypoints</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {waypoints.map((wp, idx) => (
              <div 
                key={wp.id} 
                className="flex items-center gap-3 bg-slate-800/50 p-3 rounded-lg"
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-500 text-white flex items-center justify-center font-bold text-sm">
                  {idx + 1}
                </div>
                <div className="flex-1 grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500">Lat:</span>
                    <span className="ml-1 font-mono text-white">{wp.lat.toFixed(6)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Lon:</span>
                    <span className="ml-1 font-mono text-white">{wp.lon.toFixed(6)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-slate-500">Alt:</span>
                    <input 
                      type="number" 
                      value={wp.alt}
                      onChange={(e) => updateAltitude(wp.id, parseInt(e.target.value) || 50)}
                      className="h-6 w-14 px-1 text-xs bg-slate-700 border border-slate-600 rounded text-white"
                      min={10}
                      max={500}
                    />
                    <span className="text-slate-500">m</span>
                  </div>
                </div>
                <button 
                  onClick={() => removeWaypoint(wp.id)}
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-2 rounded transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mission Summary */}
      {waypoints.length >= 2 && (
        <div className="bg-slate-800/50 rounded-lg p-4 mb-6">
          <h4 className="text-sm font-semibold text-slate-300 mb-2">Mission Summary</h4>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-slate-500">Waypoints:</span>
              <span className="text-white ml-2">{waypoints.length}</span>
            </div>
            <div>
              <span className="text-slate-500">Est. Duration:</span>
              <span className="text-white ml-2">~{estimatedDuration} min</span>
            </div>
            <div>
              <span className="text-slate-500">GPS:</span>
              <span className={`ml-2 ${mission.gpsAllowed ? 'text-green-400' : 'text-amber-400'}`}>
                {mission.gpsAllowed ? 'ENABLED' : 'DISABLED'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={waypoints.length < 2}
        className="w-full py-3 bg-cyan-500 text-white rounded-lg font-semibold hover:bg-cyan-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {waypoints.length < 2 
          ? `Add ${2 - waypoints.length} more waypoint${2 - waypoints.length > 1 ? 's' : ''}` 
          : 'Generate Mission QR'
        }
      </button>
    </div>
  );
}

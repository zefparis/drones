/**
 * Mission Planner - Plan mission with waypoints
 * Simple grid-based waypoint editor (no external map dependency)
 */

import { useState, useCallback } from 'react';
import { MapPin, Plus, Trash2, Navigation, Target } from 'lucide-react';

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

const ACTIONS = [
  { value: 'HOVER', label: 'Hover' },
  { value: 'SCAN', label: 'Scan' },
  { value: 'DROP', label: 'Drop' },
  { value: 'RTH', label: 'Return Home' },
] as const;

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
  const [editingWp, setEditingWp] = useState<number | null>(null);

  const center = defaultCenter || { lat: 43.83, lon: 4.36 }; // Alès default

  const addWaypoint = useCallback(() => {
    const offset = waypoints.length * 0.001;
    const newWp: Waypoint = {
      id: nextId,
      lat: center.lat + offset,
      lon: center.lon + offset,
      alt: 50,
      action: 'HOVER',
    };
    setWaypoints(prev => [...prev, newWp]);
    setNextId(prev => prev + 1);
    setEditingWp(newWp.id);
  }, [waypoints.length, nextId, center]);

  const updateWaypoint = useCallback((id: number, updates: Partial<Waypoint>) => {
    setWaypoints(prev => prev.map(wp => 
      wp.id === id ? { ...wp, ...updates } : wp
    ));
  }, []);

  const removeWaypoint = useCallback((id: number) => {
    setWaypoints(prev => prev.filter(wp => wp.id !== id));
    if (editingWp === id) setEditingWp(null);
  }, [editingWp]);

  const handleSubmit = () => {
    if (waypoints.length < 2) {
      alert('Minimum 2 waypoints required');
      return;
    }

    onComplete({
      ...mission,
      waypoints,
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
        <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3 mb-6 flex items-center gap-2">
          <span className="text-purple-400">🛡️</span>
          <span className="text-sm text-purple-300">
            STEALTH mode: GPS will be disabled. Navigation via celestial + VIO only.
          </span>
        </div>
      )}

      {/* Waypoints Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-300">
            Waypoints ({waypoints.length})
          </h3>
          <button
            onClick={addWaypoint}
            className="flex items-center gap-1 px-3 py-1.5 bg-cyan-500/20 text-cyan-400 rounded-lg text-sm hover:bg-cyan-500/30 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Waypoint
          </button>
        </div>

        {waypoints.length === 0 ? (
          <div className="bg-slate-800/50 rounded-lg p-8 text-center">
            <MapPin className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-slate-500">No waypoints yet</p>
            <p className="text-sm text-slate-600">Click "Add Waypoint" to start planning</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {waypoints.map((wp, idx) => (
              <div
                key={wp.id}
                className={`bg-slate-800 rounded-lg p-3 border transition-colors ${
                  editingWp === wp.id ? 'border-cyan-500' : 'border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-bold">
                      {idx + 1}
                    </div>
                    <span className="text-sm text-white font-medium">WP{idx + 1}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditingWp(editingWp === wp.id ? null : wp.id)}
                      className="text-slate-400 hover:text-cyan-400 transition-colors"
                    >
                      <Target className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => removeWaypoint(wp.id)}
                      className="text-slate-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {editingWp === wp.id ? (
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Lat</label>
                      <input
                        type="number"
                        value={wp.lat}
                        onChange={(e) => updateWaypoint(wp.id, { lat: parseFloat(e.target.value) || 0 })}
                        step="0.0001"
                        className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Lon</label>
                      <input
                        type="number"
                        value={wp.lon}
                        onChange={(e) => updateWaypoint(wp.id, { lon: parseFloat(e.target.value) || 0 })}
                        step="0.0001"
                        className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Alt (m)</label>
                      <input
                        type="number"
                        value={wp.alt}
                        onChange={(e) => updateWaypoint(wp.id, { alt: parseInt(e.target.value) || 50 })}
                        min={10}
                        max={500}
                        className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Action</label>
                      <select
                        value={wp.action}
                        onChange={(e) => updateWaypoint(wp.id, { action: e.target.value as Waypoint['action'] })}
                        className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm text-white"
                      >
                        {ACTIONS.map(a => (
                          <option key={a.value} value={a.value}>{a.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-400">
                    {wp.lat.toFixed(5)}, {wp.lon.toFixed(5)} @ {wp.alt}m • {wp.action}
                  </div>
                )}
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
              <span className={`ml-2 ${mission.gpsAllowed ? 'text-green-400' : 'text-purple-400'}`}>
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
        Generate Mission QR
      </button>
    </div>
  );
}

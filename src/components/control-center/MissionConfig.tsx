/**
 * Mission Module Configuration
 * 48 functions for mission planning and execution
 */

import { useState } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { ConfigSection, ConfigSwitch, ConfigSlider, ConfigSelect, ConfigAlert } from './ConfigHelpers';

export function MissionConfig() {
  const [config, setConfig] = useState({
    // Mission Planning (18 functions)
    auto_planning: true,
    planning_mode: 'OPTIMAL',
    waypoint_spacing: 50,
    altitude_mode: 'AGL',
    default_altitude: 50,
    terrain_following: true,
    terrain_clearance: 30,
    max_mission_distance: 5000,
    circular_mission: false,
    
    // Execution Control (16 functions)
    auto_start: false,
    pause_on_threat: true,
    resume_after_clear: true,
    waypoint_timeout: 300,
    mission_timeout: 3600,
    abort_on_low_battery: true,
    speed_profile: 'NORMAL',
    hover_at_waypoints: false,
    waypoint_actions_enabled: true,
    
    // Contingency (12 functions)
    lost_link_action: 'RTH',
    low_battery_action: 'RTH',
    geofence_breach_action: 'HOVER',
    emergency_landing_enabled: true,
    rally_point_enabled: true,
    lost_link_timeout: 30,
    
    // Data Collection (10 functions)
    auto_capture: true,
    capture_interval: 5,
    capture_at_waypoints: true,
    store_telemetry: true,
    video_recording: true,
    metadata_logging: true,
  });

  const updateConfig = (key: string, value: unknown) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-4">
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-cyan-400">Mission Module Configuration</h2>
            <p className="text-sm text-slate-400 mt-1">48 functions for mission planning and execution</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-green-400 font-mono">ACTIVE</span>
          </div>
        </div>

        <Accordion type="multiple" className="space-y-2" defaultValue={['planning']}>
          
          {/* Mission Planning */}
          <AccordionItem value="planning" className="border border-slate-700 rounded-lg px-4">
            <AccordionTrigger className="text-cyan-400 hover:text-cyan-300">
              <span className="flex items-center gap-2">
                🗺️ Mission Planning (16 functions)
              </span>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              
              <ConfigSwitch
                label="Auto Planning"
                description="Automatically optimize mission path"
                checked={config.auto_planning}
                onCheckedChange={(val) => updateConfig('auto_planning', val)}
              />

              <ConfigSelect
                label="Planning Mode"
                description="Optimization priority"
                value={config.planning_mode}
                options={['OPTIMAL', 'FASTEST', 'SAFEST', 'STEALTHY', 'EFFICIENT']}
                onChange={(val) => updateConfig('planning_mode', val)}
              />

              <ConfigSlider
                label="Waypoint Spacing"
                description="Default distance between waypoints (m)"
                value={config.waypoint_spacing}
                min={10}
                max={200}
                step={10}
                unit="m"
                onChange={(val) => updateConfig('waypoint_spacing', val)}
              />

              <ConfigSection title="Altitude Settings" description="Flight altitude configuration">
                <ConfigSelect
                  label="Altitude Mode"
                  description="Altitude reference"
                  value={config.altitude_mode}
                  options={['AGL', 'MSL', 'RELATIVE']}
                  onChange={(val) => updateConfig('altitude_mode', val)}
                />

                <ConfigSlider
                  label="Default Altitude"
                  description="Default flight altitude (m)"
                  value={config.default_altitude}
                  min={10}
                  max={200}
                  step={10}
                  unit="m"
                  onChange={(val) => updateConfig('default_altitude', val)}
                />

                <ConfigSwitch
                  label="Terrain Following"
                  description="Maintain constant AGL altitude"
                  checked={config.terrain_following}
                  onCheckedChange={(val) => updateConfig('terrain_following', val)}
                />

                <ConfigSlider
                  label="Terrain Clearance"
                  description="Minimum ground clearance (m)"
                  value={config.terrain_clearance}
                  min={5}
                  max={100}
                  step={5}
                  unit="m"
                  onChange={(val) => updateConfig('terrain_clearance', val)}
                />
              </ConfigSection>
            </AccordionContent>
          </AccordionItem>

          {/* Execution Control */}
          <AccordionItem value="execution" className="border border-slate-700 rounded-lg px-4">
            <AccordionTrigger className="text-cyan-400 hover:text-cyan-300">
              <span className="flex items-center gap-2">
                ▶️ Execution Control (14 functions)
              </span>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              
              <ConfigSwitch
                label="Auto Start"
                description="Start mission automatically when ready"
                checked={config.auto_start}
                onCheckedChange={(val) => updateConfig('auto_start', val)}
              />

              <ConfigSwitch
                label="Pause on Threat"
                description="Pause mission when threat detected"
                checked={config.pause_on_threat}
                onCheckedChange={(val) => updateConfig('pause_on_threat', val)}
              />

              <ConfigSwitch
                label="Resume After Clear"
                description="Auto-resume when threat cleared"
                checked={config.resume_after_clear}
                onCheckedChange={(val) => updateConfig('resume_after_clear', val)}
              />

              <ConfigSlider
                label="Waypoint Timeout"
                description="Max time to reach waypoint (s)"
                value={config.waypoint_timeout}
                min={60}
                max={600}
                step={30}
                unit="s"
                onChange={(val) => updateConfig('waypoint_timeout', val)}
              />

              <ConfigSlider
                label="Mission Timeout"
                description="Max total mission time (s)"
                value={config.mission_timeout}
                min={600}
                max={7200}
                step={300}
                unit="s"
                onChange={(val) => updateConfig('mission_timeout', val)}
              />

              <ConfigSwitch
                label="Abort on Low Battery"
                description="Abort mission when battery critical"
                checked={config.abort_on_low_battery}
                onCheckedChange={(val) => updateConfig('abort_on_low_battery', val)}
              />
            </AccordionContent>
          </AccordionItem>

          {/* Contingency */}
          <AccordionItem value="contingency" className="border border-slate-700 rounded-lg px-4">
            <AccordionTrigger className="text-cyan-400 hover:text-cyan-300">
              <span className="flex items-center gap-2">
                🚨 Contingency Actions (10 functions)
              </span>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              
              <ConfigAlert type="warning">
                These actions trigger automatically in emergency situations
              </ConfigAlert>

              <ConfigSelect
                label="Lost Link Action"
                description="Action when communication lost"
                value={config.lost_link_action}
                options={['RTH', 'HOVER', 'LAND', 'CONTINUE', 'RALLY_POINT']}
                onChange={(val) => updateConfig('lost_link_action', val)}
              />

              <ConfigSelect
                label="Low Battery Action"
                description="Action when battery low"
                value={config.low_battery_action}
                options={['RTH', 'LAND', 'NEAREST_SAFE', 'CONTINUE']}
                onChange={(val) => updateConfig('low_battery_action', val)}
              />

              <ConfigSelect
                label="Geofence Breach Action"
                description="Action when exiting geofence"
                value={config.geofence_breach_action}
                options={['HOVER', 'RTH', 'LAND', 'TURN_BACK']}
                onChange={(val) => updateConfig('geofence_breach_action', val)}
              />

              <ConfigSwitch
                label="Emergency Landing"
                description="Enable emergency landing capability"
                checked={config.emergency_landing_enabled}
                onCheckedChange={(val) => updateConfig('emergency_landing_enabled', val)}
              />
            </AccordionContent>
          </AccordionItem>

          {/* Data Collection */}
          <AccordionItem value="data" className="border border-slate-700 rounded-lg px-4">
            <AccordionTrigger className="text-cyan-400 hover:text-cyan-300">
              <span className="flex items-center gap-2">
                📊 Data Collection (8 functions)
              </span>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              
              <ConfigSwitch
                label="Auto Capture"
                description="Automatically capture images"
                checked={config.auto_capture}
                onCheckedChange={(val) => updateConfig('auto_capture', val)}
              />

              <ConfigSlider
                label="Capture Interval"
                description="Time between captures (s)"
                value={config.capture_interval}
                min={1}
                max={30}
                step={1}
                unit="s"
                onChange={(val) => updateConfig('capture_interval', val)}
              />

              <ConfigSwitch
                label="Capture at Waypoints"
                description="Capture image at each waypoint"
                checked={config.capture_at_waypoints}
                onCheckedChange={(val) => updateConfig('capture_at_waypoints', val)}
              />

              <ConfigSwitch
                label="Store Telemetry"
                description="Log all telemetry data"
                checked={config.store_telemetry}
                onCheckedChange={(val) => updateConfig('store_telemetry', val)}
              />
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Save Button */}
        <div className="mt-6 flex justify-end gap-3">
          <button className="px-4 py-2 border border-slate-600 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors">
            Reset to Defaults
          </button>
          <button className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg text-white font-medium hover:from-cyan-400 hover:to-blue-500 transition-colors">
            Save Mission Config
          </button>
        </div>
      </div>
    </div>
  );
}

export default MissionConfig;

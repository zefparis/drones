/**
 * Brain Module Configuration
 * 78 functions for autonomous decision making
 */

import { useState } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { ConfigSwitch, ConfigSlider, ConfigSelect, ConfigAlert } from './ConfigHelpers';

export function BrainConfig() {
  const [config, setConfig] = useState({
    // Decision Engine (24 functions)
    autonomous_mode: true,
    decision_frequency: 10,
    confidence_threshold: 0.75,
    risk_tolerance: 0.5,
    mission_priority: 'COMPLETE',
    abort_threshold: 0.3,
    
    // State Machine (18 functions)
    fsm_enabled: true,
    state_transition_delay: 100,
    auto_recovery: true,
    emergency_override: true,
    max_state_duration: 300,
    
    // Learning (16 functions)
    adaptive_learning: true,
    learning_rate: 0.01,
    experience_buffer_size: 1000,
    policy_update_interval: 60,
    
    // Coordination (12 functions)
    swarm_coordination: false,
    leader_election: true,
    consensus_threshold: 0.6,
    communication_range: 500,
    
    // Safety (8 functions)
    failsafe_enabled: true,
    battery_reserve: 20,
    geofence_enabled: true,
    max_altitude: 120,
    min_altitude: 2,
  });

  const updateConfig = (key: string, value: unknown) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-4">
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-cyan-400">Brain Module Configuration</h2>
            <p className="text-sm text-slate-400 mt-1">78 functions for autonomous decision making and AI control</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-green-400 font-mono">ACTIVE</span>
          </div>
        </div>

        <Accordion type="multiple" className="space-y-2" defaultValue={['decision']}>
          
          {/* Section 1: Decision Engine */}
          <AccordionItem value="decision" className="border border-slate-700 rounded-lg px-4">
            <AccordionTrigger className="text-cyan-400 hover:text-cyan-300">
              <span className="flex items-center gap-2">
                🧠 Decision Engine (24 functions)
              </span>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              
              <ConfigAlert type="info">
                The decision engine controls all autonomous behaviors
              </ConfigAlert>

              <ConfigSwitch
                label="Autonomous Mode"
                description="Enable fully autonomous decision making"
                checked={config.autonomous_mode}
                onCheckedChange={(val) => updateConfig('autonomous_mode', val)}
              />

              <ConfigSlider
                label="Decision Frequency"
                description="Decision updates per second (Hz)"
                value={config.decision_frequency}
                min={1}
                max={50}
                step={1}
                unit="Hz"
                onChange={(val) => updateConfig('decision_frequency', val)}
              />

              <ConfigSlider
                label="Confidence Threshold"
                description="Minimum confidence to execute decision"
                value={config.confidence_threshold}
                min={0.5}
                max={0.99}
                step={0.05}
                onChange={(val) => updateConfig('confidence_threshold', val)}
              />

              <ConfigSlider
                label="Risk Tolerance"
                description="Willingness to take risks (0=conservative, 1=aggressive)"
                value={config.risk_tolerance}
                min={0}
                max={1}
                step={0.1}
                onChange={(val) => updateConfig('risk_tolerance', val)}
              />

              <ConfigSelect
                label="Mission Priority"
                description="Primary objective when conflicts arise"
                value={config.mission_priority}
                options={['COMPLETE', 'SURVIVE', 'STEALTH', 'SPEED', 'EFFICIENCY']}
                onChange={(val) => updateConfig('mission_priority', val)}
              />

              <ConfigSlider
                label="Abort Threshold"
                description="Success probability below which to abort"
                value={config.abort_threshold}
                min={0.1}
                max={0.5}
                step={0.05}
                onChange={(val) => updateConfig('abort_threshold', val)}
              />
            </AccordionContent>
          </AccordionItem>

          {/* Section 2: State Machine */}
          <AccordionItem value="fsm" className="border border-slate-700 rounded-lg px-4">
            <AccordionTrigger className="text-cyan-400 hover:text-cyan-300">
              <span className="flex items-center gap-2">
                🔄 State Machine (18 functions)
              </span>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              
              <ConfigSwitch
                label="FSM Enabled"
                description="Enable finite state machine control"
                checked={config.fsm_enabled}
                onCheckedChange={(val) => updateConfig('fsm_enabled', val)}
              />

              <ConfigSlider
                label="Transition Delay"
                description="Minimum time between state changes (ms)"
                value={config.state_transition_delay}
                min={50}
                max={500}
                step={50}
                unit="ms"
                onChange={(val) => updateConfig('state_transition_delay', val)}
              />

              <ConfigSwitch
                label="Auto Recovery"
                description="Automatically recover from error states"
                checked={config.auto_recovery}
                onCheckedChange={(val) => updateConfig('auto_recovery', val)}
              />

              <ConfigSwitch
                label="Emergency Override"
                description="Allow manual override during emergencies"
                checked={config.emergency_override}
                onCheckedChange={(val) => updateConfig('emergency_override', val)}
              />

              <ConfigSlider
                label="Max State Duration"
                description="Maximum time in any single state (seconds)"
                value={config.max_state_duration}
                min={60}
                max={600}
                step={60}
                unit="s"
                onChange={(val) => updateConfig('max_state_duration', val)}
              />
            </AccordionContent>
          </AccordionItem>

          {/* Section 3: Learning */}
          <AccordionItem value="learning" className="border border-slate-700 rounded-lg px-4">
            <AccordionTrigger className="text-cyan-400 hover:text-cyan-300">
              <span className="flex items-center gap-2">
                📚 Adaptive Learning (16 functions)
              </span>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              
              <ConfigAlert type="warning">
                Adaptive learning modifies drone behavior over time
              </ConfigAlert>

              <ConfigSwitch
                label="Adaptive Learning"
                description="Enable real-time behavior adaptation"
                checked={config.adaptive_learning}
                onCheckedChange={(val) => updateConfig('adaptive_learning', val)}
              />

              <ConfigSlider
                label="Learning Rate"
                description="Speed of behavior adaptation"
                value={config.learning_rate}
                min={0.001}
                max={0.1}
                step={0.001}
                onChange={(val) => updateConfig('learning_rate', val)}
              />

              <ConfigSlider
                label="Experience Buffer"
                description="Number of experiences to remember"
                value={config.experience_buffer_size}
                min={100}
                max={10000}
                step={100}
                onChange={(val) => updateConfig('experience_buffer_size', val)}
              />

              <ConfigSlider
                label="Policy Update Interval"
                description="Seconds between policy updates"
                value={config.policy_update_interval}
                min={10}
                max={300}
                step={10}
                unit="s"
                onChange={(val) => updateConfig('policy_update_interval', val)}
              />
            </AccordionContent>
          </AccordionItem>

          {/* Section 4: Coordination */}
          <AccordionItem value="coordination" className="border border-slate-700 rounded-lg px-4">
            <AccordionTrigger className="text-cyan-400 hover:text-cyan-300">
              <span className="flex items-center gap-2">
                👥 Swarm Coordination (12 functions)
              </span>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              
              <ConfigSwitch
                label="Swarm Coordination"
                description="Enable multi-drone coordination"
                checked={config.swarm_coordination}
                onCheckedChange={(val) => updateConfig('swarm_coordination', val)}
              />

              <ConfigSwitch
                label="Leader Election"
                description="Participate in swarm leader election"
                checked={config.leader_election}
                onCheckedChange={(val) => updateConfig('leader_election', val)}
              />

              <ConfigSlider
                label="Consensus Threshold"
                description="Agreement needed for swarm decisions"
                value={config.consensus_threshold}
                min={0.5}
                max={1}
                step={0.1}
                onChange={(val) => updateConfig('consensus_threshold', val)}
              />

              <ConfigSlider
                label="Communication Range"
                description="Max swarm communication range (meters)"
                value={config.communication_range}
                min={100}
                max={2000}
                step={100}
                unit="m"
                onChange={(val) => updateConfig('communication_range', val)}
              />
            </AccordionContent>
          </AccordionItem>

          {/* Section 5: Safety */}
          <AccordionItem value="safety" className="border border-slate-700 rounded-lg px-4">
            <AccordionTrigger className="text-cyan-400 hover:text-cyan-300">
              <span className="flex items-center gap-2">
                🛑 Safety Limits (8 functions)
              </span>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              
              <ConfigAlert type="error">
                Safety limits cannot be overridden by autonomous decisions
              </ConfigAlert>

              <ConfigSwitch
                label="Failsafe Enabled"
                description="Enable automatic failsafe behaviors"
                checked={config.failsafe_enabled}
                onCheckedChange={(val) => updateConfig('failsafe_enabled', val)}
              />

              <ConfigSlider
                label="Battery Reserve"
                description="Minimum battery for RTH (%)"
                value={config.battery_reserve}
                min={10}
                max={40}
                step={5}
                unit="%"
                onChange={(val) => updateConfig('battery_reserve', val)}
              />

              <ConfigSwitch
                label="Geofence Enabled"
                description="Enforce geofence boundaries"
                checked={config.geofence_enabled}
                onCheckedChange={(val) => updateConfig('geofence_enabled', val)}
              />

              <ConfigSlider
                label="Max Altitude"
                description="Maximum allowed altitude (meters AGL)"
                value={config.max_altitude}
                min={50}
                max={500}
                step={10}
                unit="m"
                onChange={(val) => updateConfig('max_altitude', val)}
              />

              <ConfigSlider
                label="Min Altitude"
                description="Minimum allowed altitude (meters AGL)"
                value={config.min_altitude}
                min={1}
                max={20}
                step={1}
                unit="m"
                onChange={(val) => updateConfig('min_altitude', val)}
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
            Save Brain Config
          </button>
        </div>
      </div>
    </div>
  );
}

export default BrainConfig;

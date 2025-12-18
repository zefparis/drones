/**
 * Sentinel Module Configuration
 * 86 functions for threat detection and avoidance
 */

import { useState } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { ConfigSection, ConfigSwitch, ConfigSlider, ConfigSelect, ConfigAlert } from './ConfigHelpers';

export function SentinelConfig() {
  const [config, setConfig] = useState({
    // Threat Detection (28 functions)
    rf_detection_enabled: true,
    rf_sensitivity: 0.8,
    rf_frequency_range_min: 100,
    rf_frequency_range_max: 6000,
    acoustic_detection_enabled: true,
    acoustic_threshold: 70,
    radar_detection_enabled: true,
    radar_cross_section_limit: 0.01,
    visual_detection_enabled: true,
    visual_ai_confidence: 0.85,
    thermal_detection_enabled: true,
    
    // Threat Classification (22 functions)
    threat_level_low_threshold: 0.3,
    threat_level_medium_threshold: 0.6,
    threat_level_high_threshold: 0.85,
    auto_classify: true,
    human_detection_enabled: true,
    vehicle_detection_enabled: true,
    weapon_detection_enabled: true,
    
    // Evasion Maneuvers (20 functions)
    evasion_enabled: true,
    evasion_aggressiveness: 0.7,
    max_evasion_velocity: 20,
    terrain_masking_enabled: true,
    noe_altitude: 5,
    pop_up_distance: 100,
    
    // Countermeasures (16 functions)
    gps_jamming_response: 'CELESTIAL_NAV',
    rf_jamming_response: 'FREQUENCY_HOP',
    visual_countermeasures: false,
    decoy_deployment: false,
    ir_suppression: true,
  });

  const updateConfig = (key: string, value: unknown) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-4">
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-cyan-400">Sentinel Module Configuration</h2>
            <p className="text-sm text-slate-400 mt-1">86 functions for threat detection and autonomous evasion</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-green-400 font-mono">ACTIVE</span>
          </div>
        </div>

        <Accordion type="multiple" className="space-y-2" defaultValue={['detection']}>
          
          {/* Section 1: Threat Detection */}
          <AccordionItem value="detection" className="border border-slate-700 rounded-lg px-4">
            <AccordionTrigger className="text-cyan-400 hover:text-cyan-300">
              <span className="flex items-center gap-2">
                🛡️ Threat Detection (28 functions)
              </span>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              
              <ConfigSection title="RF Detection" description="Radio frequency threat detection">
                <ConfigSwitch
                  label="RF Detection"
                  description="Detect hostile RF emissions (radar, comms)"
                  checked={config.rf_detection_enabled}
                  onCheckedChange={(val) => updateConfig('rf_detection_enabled', val)}
                />
                
                <ConfigSlider
                  label="RF Sensitivity"
                  description="Detection sensitivity (0-1)"
                  value={config.rf_sensitivity}
                  min={0}
                  max={1}
                  step={0.05}
                  onChange={(val) => updateConfig('rf_sensitivity', val)}
                />

                <ConfigSlider
                  label="Frequency Range Min"
                  description="Minimum monitored frequency (MHz)"
                  value={config.rf_frequency_range_min}
                  min={30}
                  max={1000}
                  step={10}
                  unit="MHz"
                  onChange={(val) => updateConfig('rf_frequency_range_min', val)}
                />

                <ConfigSlider
                  label="Frequency Range Max"
                  description="Maximum monitored frequency (MHz)"
                  value={config.rf_frequency_range_max}
                  min={1000}
                  max={18000}
                  step={500}
                  unit="MHz"
                  onChange={(val) => updateConfig('rf_frequency_range_max', val)}
                />
              </ConfigSection>

              <ConfigSection title="Acoustic Detection" description="Sound-based threat detection">
                <ConfigSwitch
                  label="Acoustic Detection"
                  description="Detect hostile sounds (gunshots, vehicles)"
                  checked={config.acoustic_detection_enabled}
                  onCheckedChange={(val) => updateConfig('acoustic_detection_enabled', val)}
                />

                <ConfigSlider
                  label="Acoustic Threshold"
                  description="Sound level threshold (dB)"
                  value={config.acoustic_threshold}
                  min={40}
                  max={120}
                  step={5}
                  unit="dB"
                  onChange={(val) => updateConfig('acoustic_threshold', val)}
                />
              </ConfigSection>

              <ConfigSection title="Visual Detection" description="AI-powered visual threat detection">
                <ConfigSwitch
                  label="Visual Detection"
                  description="Enable AI visual threat detection"
                  checked={config.visual_detection_enabled}
                  onCheckedChange={(val) => updateConfig('visual_detection_enabled', val)}
                />

                <ConfigSlider
                  label="AI Confidence"
                  description="Minimum confidence for threat classification"
                  value={config.visual_ai_confidence}
                  min={0.5}
                  max={0.99}
                  step={0.01}
                  onChange={(val) => updateConfig('visual_ai_confidence', val)}
                />
              </ConfigSection>

              <ConfigSection title="Thermal Detection" description="Infrared threat detection">
                <ConfigSwitch
                  label="Thermal Detection"
                  description="Enable thermal signature detection"
                  checked={config.thermal_detection_enabled}
                  onCheckedChange={(val) => updateConfig('thermal_detection_enabled', val)}
                />
              </ConfigSection>
            </AccordionContent>
          </AccordionItem>

          {/* Section 2: Threat Classification */}
          <AccordionItem value="classification" className="border border-slate-700 rounded-lg px-4">
            <AccordionTrigger className="text-cyan-400 hover:text-cyan-300">
              <span className="flex items-center gap-2">
                🎯 Threat Classification (22 functions)
              </span>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              
              <ConfigAlert type="info">
                Threat levels determine response intensity and evasion aggressiveness
              </ConfigAlert>

              <ConfigSlider
                label="LOW Threshold"
                description="Minimum score for LOW threat level"
                value={config.threat_level_low_threshold}
                min={0.1}
                max={0.5}
                step={0.05}
                onChange={(val) => updateConfig('threat_level_low_threshold', val)}
              />

              <ConfigSlider
                label="MEDIUM Threshold"
                description="Minimum score for MEDIUM threat level"
                value={config.threat_level_medium_threshold}
                min={0.4}
                max={0.8}
                step={0.05}
                onChange={(val) => updateConfig('threat_level_medium_threshold', val)}
              />

              <ConfigSlider
                label="HIGH Threshold"
                description="Minimum score for HIGH threat level"
                value={config.threat_level_high_threshold}
                min={0.7}
                max={0.95}
                step={0.05}
                onChange={(val) => updateConfig('threat_level_high_threshold', val)}
              />

              <ConfigSwitch
                label="Auto Classification"
                description="Automatically classify threats by AI"
                checked={config.auto_classify}
                onCheckedChange={(val) => updateConfig('auto_classify', val)}
              />

              <ConfigSection title="Target Types">
                <ConfigSwitch
                  label="Human Detection"
                  description="Detect and track humans"
                  checked={config.human_detection_enabled}
                  onCheckedChange={(val) => updateConfig('human_detection_enabled', val)}
                />

                <ConfigSwitch
                  label="Vehicle Detection"
                  description="Detect and track vehicles"
                  checked={config.vehicle_detection_enabled}
                  onCheckedChange={(val) => updateConfig('vehicle_detection_enabled', val)}
                />

                <ConfigSwitch
                  label="Weapon Detection"
                  description="Detect weapons and hostile equipment"
                  checked={config.weapon_detection_enabled}
                  onCheckedChange={(val) => updateConfig('weapon_detection_enabled', val)}
                />
              </ConfigSection>
            </AccordionContent>
          </AccordionItem>

          {/* Section 3: Evasion Maneuvers */}
          <AccordionItem value="evasion" className="border border-slate-700 rounded-lg px-4">
            <AccordionTrigger className="text-cyan-400 hover:text-cyan-300">
              <span className="flex items-center gap-2">
                🚀 Evasion Maneuvers (20 functions)
              </span>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              
              <ConfigAlert type="warning">
                Aggressive evasion may increase battery consumption and risk of collision
              </ConfigAlert>

              <ConfigSwitch
                label="Evasion Enabled"
                description="Enable autonomous evasive maneuvers"
                checked={config.evasion_enabled}
                onCheckedChange={(val) => updateConfig('evasion_enabled', val)}
              />

              <ConfigSlider
                label="Evasion Aggressiveness"
                description="How aggressively to evade (0-1)"
                value={config.evasion_aggressiveness}
                min={0.1}
                max={1}
                step={0.1}
                onChange={(val) => updateConfig('evasion_aggressiveness', val)}
              />

              <ConfigSlider
                label="Max Evasion Velocity"
                description="Maximum speed during evasion (m/s)"
                value={config.max_evasion_velocity}
                min={5}
                max={35}
                step={5}
                unit="m/s"
                onChange={(val) => updateConfig('max_evasion_velocity', val)}
              />

              <ConfigSwitch
                label="Terrain Masking"
                description="Use terrain to hide from threats"
                checked={config.terrain_masking_enabled}
                onCheckedChange={(val) => updateConfig('terrain_masking_enabled', val)}
              />

              <ConfigSlider
                label="NOE Altitude"
                description="Nap-of-earth flying altitude (meters)"
                value={config.noe_altitude}
                min={2}
                max={20}
                step={1}
                unit="m"
                onChange={(val) => updateConfig('noe_altitude', val)}
              />

              <ConfigSlider
                label="Pop-up Distance"
                description="Distance from target for pop-up maneuver (meters)"
                value={config.pop_up_distance}
                min={50}
                max={500}
                step={50}
                unit="m"
                onChange={(val) => updateConfig('pop_up_distance', val)}
              />
            </AccordionContent>
          </AccordionItem>

          {/* Section 4: Countermeasures */}
          <AccordionItem value="countermeasures" className="border border-slate-700 rounded-lg px-4">
            <AccordionTrigger className="text-cyan-400 hover:text-cyan-300">
              <span className="flex items-center gap-2">
                ⚔️ Countermeasures (16 functions)
              </span>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              
              <ConfigSelect
                label="GPS Jamming Response"
                description="Action when GPS jamming detected"
                value={config.gps_jamming_response}
                options={['CELESTIAL_NAV', 'VIO_ONLY', 'RTH', 'HOVER', 'CONTINUE']}
                onChange={(val) => updateConfig('gps_jamming_response', val)}
              />

              <ConfigSelect
                label="RF Jamming Response"
                description="Action when RF jamming detected"
                value={config.rf_jamming_response}
                options={['FREQUENCY_HOP', 'SILENT_MODE', 'MESH_RELAY', 'AUTONOMOUS']}
                onChange={(val) => updateConfig('rf_jamming_response', val)}
              />

              <ConfigSwitch
                label="Visual Countermeasures"
                description="Deploy visual countermeasures (smoke)"
                checked={config.visual_countermeasures}
                onCheckedChange={(val) => updateConfig('visual_countermeasures', val)}
              />

              <ConfigSwitch
                label="Decoy Deployment"
                description="Deploy decoy signatures"
                checked={config.decoy_deployment}
                onCheckedChange={(val) => updateConfig('decoy_deployment', val)}
              />

              <ConfigSwitch
                label="IR Suppression"
                description="Reduce infrared signature"
                checked={config.ir_suppression}
                onCheckedChange={(val) => updateConfig('ir_suppression', val)}
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
            Save Sentinel Config
          </button>
        </div>
      </div>
    </div>
  );
}

export default SentinelConfig;

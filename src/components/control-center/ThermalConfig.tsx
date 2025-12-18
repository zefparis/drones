/**
 * Thermal Module Configuration
 * 32 functions for thermal management
 */

import { useState } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { ConfigSwitch, ConfigSlider, ConfigSelect, ConfigAlert } from './ConfigHelpers';

export function ThermalConfig() {
  const [config, setConfig] = useState({
    // Temperature Limits (12 functions)
    motor_max_temp: 85,
    esc_max_temp: 80,
    battery_max_temp: 45,
    cpu_max_temp: 75,
    camera_max_temp: 50,
    gpu_max_temp: 80,
    lidar_max_temp: 60,
    
    // Cooling Control (12 functions)
    active_cooling: true,
    fan_mode: 'AUTO',
    fan_min_speed: 20,
    fan_max_speed: 100,
    cooling_threshold: 60,
    fan_curve_enabled: true,
    heat_pipe_active: true,
    
    // Cold Weather (10 functions)
    cold_weather_mode: false,
    preheat_enabled: true,
    min_operating_temp: -10,
    battery_heater_target: 15,
    motor_warmup: true,
    lens_defogging: true,
    
    // Thermal Protection (6 functions)
    thermal_throttling: true,
    emergency_shutdown: true,
    shutdown_temp: 90,
    thermal_imaging: false,
    heat_map_logging: true,
  });

  const updateConfig = (key: string, value: unknown) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-4">
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-cyan-400">Thermal Module Configuration</h2>
            <p className="text-sm text-slate-400 mt-1">32 functions for thermal management and protection</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-green-400 font-mono">ACTIVE</span>
          </div>
        </div>

        <Accordion type="multiple" className="space-y-2" defaultValue={['limits']}>
          
          {/* Temperature Limits */}
          <AccordionItem value="limits" className="border border-slate-700 rounded-lg px-4">
            <AccordionTrigger className="text-cyan-400 hover:text-cyan-300">
              <span className="flex items-center gap-2">
                🌡️ Temperature Limits (10 functions)
              </span>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              
              <ConfigAlert type="warning">
                Exceeding temperature limits triggers thermal throttling or shutdown
              </ConfigAlert>

              <ConfigSlider
                label="Motor Max Temperature"
                description="Maximum motor temperature (°C)"
                value={config.motor_max_temp}
                min={60}
                max={100}
                step={5}
                unit="°C"
                onChange={(val) => updateConfig('motor_max_temp', val)}
              />

              <ConfigSlider
                label="ESC Max Temperature"
                description="Maximum ESC temperature (°C)"
                value={config.esc_max_temp}
                min={60}
                max={100}
                step={5}
                unit="°C"
                onChange={(val) => updateConfig('esc_max_temp', val)}
              />

              <ConfigSlider
                label="Battery Max Temperature"
                description="Maximum battery temperature (°C)"
                value={config.battery_max_temp}
                min={35}
                max={60}
                step={5}
                unit="°C"
                onChange={(val) => updateConfig('battery_max_temp', val)}
              />

              <ConfigSlider
                label="CPU Max Temperature"
                description="Maximum CPU temperature (°C)"
                value={config.cpu_max_temp}
                min={60}
                max={90}
                step={5}
                unit="°C"
                onChange={(val) => updateConfig('cpu_max_temp', val)}
              />

              <ConfigSlider
                label="Camera Max Temperature"
                description="Maximum camera sensor temperature (°C)"
                value={config.camera_max_temp}
                min={40}
                max={70}
                step={5}
                unit="°C"
                onChange={(val) => updateConfig('camera_max_temp', val)}
              />
            </AccordionContent>
          </AccordionItem>

          {/* Cooling Control */}
          <AccordionItem value="cooling" className="border border-slate-700 rounded-lg px-4">
            <AccordionTrigger className="text-cyan-400 hover:text-cyan-300">
              <span className="flex items-center gap-2">
                ❄️ Cooling Control (10 functions)
              </span>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              
              <ConfigSwitch
                label="Active Cooling"
                description="Enable active cooling system"
                checked={config.active_cooling}
                onCheckedChange={(val) => updateConfig('active_cooling', val)}
              />

              <ConfigSelect
                label="Fan Mode"
                description="Cooling fan operation mode"
                value={config.fan_mode}
                options={['OFF', 'LOW', 'MEDIUM', 'HIGH', 'AUTO']}
                onChange={(val) => updateConfig('fan_mode', val)}
              />

              <ConfigSlider
                label="Fan Min Speed"
                description="Minimum fan speed (%)"
                value={config.fan_min_speed}
                min={0}
                max={50}
                step={10}
                unit="%"
                onChange={(val) => updateConfig('fan_min_speed', val)}
              />

              <ConfigSlider
                label="Fan Max Speed"
                description="Maximum fan speed (%)"
                value={config.fan_max_speed}
                min={50}
                max={100}
                step={10}
                unit="%"
                onChange={(val) => updateConfig('fan_max_speed', val)}
              />

              <ConfigSlider
                label="Cooling Threshold"
                description="Temperature to activate cooling (°C)"
                value={config.cooling_threshold}
                min={40}
                max={80}
                step={5}
                unit="°C"
                onChange={(val) => updateConfig('cooling_threshold', val)}
              />
            </AccordionContent>
          </AccordionItem>

          {/* Cold Weather */}
          <AccordionItem value="cold" className="border border-slate-700 rounded-lg px-4">
            <AccordionTrigger className="text-cyan-400 hover:text-cyan-300">
              <span className="flex items-center gap-2">
                🥶 Cold Weather (8 functions)
              </span>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              
              <ConfigSwitch
                label="Cold Weather Mode"
                description="Enable cold weather optimizations"
                checked={config.cold_weather_mode}
                onCheckedChange={(val) => updateConfig('cold_weather_mode', val)}
              />

              <ConfigSwitch
                label="Preheat Enabled"
                description="Preheat battery before flight"
                checked={config.preheat_enabled}
                onCheckedChange={(val) => updateConfig('preheat_enabled', val)}
              />

              <ConfigSlider
                label="Min Operating Temperature"
                description="Minimum safe operating temperature (°C)"
                value={config.min_operating_temp}
                min={-20}
                max={5}
                step={5}
                unit="°C"
                onChange={(val) => updateConfig('min_operating_temp', val)}
              />

              <ConfigSlider
                label="Battery Heater Target"
                description="Target battery temperature for heater (°C)"
                value={config.battery_heater_target}
                min={10}
                max={25}
                step={5}
                unit="°C"
                onChange={(val) => updateConfig('battery_heater_target', val)}
              />
            </AccordionContent>
          </AccordionItem>

          {/* Thermal Protection */}
          <AccordionItem value="protection" className="border border-slate-700 rounded-lg px-4">
            <AccordionTrigger className="text-cyan-400 hover:text-cyan-300">
              <span className="flex items-center gap-2">
                🛑 Thermal Protection (4 functions)
              </span>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              
              <ConfigAlert type="error">
                Emergency shutdown cannot be disabled for safety
              </ConfigAlert>

              <ConfigSwitch
                label="Thermal Throttling"
                description="Reduce performance when hot"
                checked={config.thermal_throttling}
                onCheckedChange={(val) => updateConfig('thermal_throttling', val)}
              />

              <ConfigSwitch
                label="Emergency Shutdown"
                description="Emergency landing on critical temperature"
                checked={config.emergency_shutdown}
                onCheckedChange={(val) => updateConfig('emergency_shutdown', val)}
              />

              <ConfigSlider
                label="Shutdown Temperature"
                description="Emergency shutdown temperature (°C)"
                value={config.shutdown_temp}
                min={80}
                max={100}
                step={5}
                unit="°C"
                onChange={(val) => updateConfig('shutdown_temp', val)}
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
            Save Thermal Config
          </button>
        </div>
      </div>
    </div>
  );
}

export default ThermalConfig;

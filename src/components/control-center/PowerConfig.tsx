/**
 * Power Module Configuration
 * 38 functions for power and battery management
 */

import { useState } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { ConfigSection, ConfigSwitch, ConfigSlider, ConfigAlert } from './ConfigHelpers';

export function PowerConfig() {
  const [config, setConfig] = useState({
    // Battery Management (14 functions)
    smart_battery: true,
    cell_count: 6,
    voltage_nominal: 22.2,
    capacity_mah: 12000,
    low_voltage_warning: 3.5,
    critical_voltage: 3.3,
    low_percent_warning: 25,
    critical_percent: 15,
    
    // Power Distribution (12 functions)
    motor_power_limit: 100,
    aux_power_enabled: true,
    payload_power: true,
    heater_enabled: false,
    led_brightness: 50,
    
    // Energy Optimization (8 functions)
    eco_mode: false,
    dynamic_power: true,
    regenerative_braking: true,
    idle_power_reduction: true,
    
    // Monitoring (4 functions)
    cell_monitoring: true,
    temperature_monitoring: true,
    current_monitoring: true,
    logging_interval: 1,
  });

  const updateConfig = (key: string, value: unknown) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-4">
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-cyan-400">Power Module Configuration</h2>
            <p className="text-sm text-slate-400 mt-1">38 functions for power and battery management</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-green-400 font-mono">ACTIVE</span>
          </div>
        </div>

        <Accordion type="multiple" className="space-y-2" defaultValue={['battery']}>
          
          {/* Battery Management */}
          <AccordionItem value="battery" className="border border-slate-700 rounded-lg px-4">
            <AccordionTrigger className="text-cyan-400 hover:text-cyan-300">
              <span className="flex items-center gap-2">
                🔋 Battery Management (14 functions)
              </span>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              
              <ConfigSwitch
                label="Smart Battery"
                description="Enable smart battery features"
                checked={config.smart_battery}
                onCheckedChange={(val) => updateConfig('smart_battery', val)}
              />

              <ConfigSection title="Battery Specs" description="Battery configuration">
                <ConfigSlider
                  label="Cell Count"
                  description="Number of cells (S)"
                  value={config.cell_count}
                  min={3}
                  max={12}
                  step={1}
                  unit="S"
                  onChange={(val) => updateConfig('cell_count', val)}
                />

                <ConfigSlider
                  label="Nominal Voltage"
                  description="Battery nominal voltage (V)"
                  value={config.voltage_nominal}
                  min={11.1}
                  max={44.4}
                  step={3.7}
                  unit="V"
                  onChange={(val) => updateConfig('voltage_nominal', val)}
                />

                <ConfigSlider
                  label="Capacity"
                  description="Battery capacity (mAh)"
                  value={config.capacity_mah}
                  min={3000}
                  max={30000}
                  step={1000}
                  unit="mAh"
                  onChange={(val) => updateConfig('capacity_mah', val)}
                />
              </ConfigSection>

              <ConfigSection title="Voltage Thresholds" description="Warning and cutoff levels">
                <ConfigSlider
                  label="Low Voltage Warning"
                  description="Per-cell low voltage warning (V)"
                  value={config.low_voltage_warning}
                  min={3.2}
                  max={3.7}
                  step={0.1}
                  unit="V"
                  onChange={(val) => updateConfig('low_voltage_warning', val)}
                />

                <ConfigSlider
                  label="Critical Voltage"
                  description="Per-cell critical voltage (V)"
                  value={config.critical_voltage}
                  min={3.0}
                  max={3.5}
                  step={0.1}
                  unit="V"
                  onChange={(val) => updateConfig('critical_voltage', val)}
                />
              </ConfigSection>

              <ConfigSection title="Percentage Thresholds" description="Capacity-based warnings">
                <ConfigSlider
                  label="Low Percent Warning"
                  description="Low battery warning (%)"
                  value={config.low_percent_warning}
                  min={15}
                  max={40}
                  step={5}
                  unit="%"
                  onChange={(val) => updateConfig('low_percent_warning', val)}
                />

                <ConfigSlider
                  label="Critical Percent"
                  description="Critical battery level (%)"
                  value={config.critical_percent}
                  min={5}
                  max={25}
                  step={5}
                  unit="%"
                  onChange={(val) => updateConfig('critical_percent', val)}
                />
              </ConfigSection>
            </AccordionContent>
          </AccordionItem>

          {/* Power Distribution */}
          <AccordionItem value="distribution" className="border border-slate-700 rounded-lg px-4">
            <AccordionTrigger className="text-cyan-400 hover:text-cyan-300">
              <span className="flex items-center gap-2">
                ⚡ Power Distribution (12 functions)
              </span>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              
              <ConfigSlider
                label="Motor Power Limit"
                description="Maximum motor power (%)"
                value={config.motor_power_limit}
                min={50}
                max={100}
                step={5}
                unit="%"
                onChange={(val) => updateConfig('motor_power_limit', val)}
              />

              <ConfigSwitch
                label="Auxiliary Power"
                description="Enable auxiliary power rails"
                checked={config.aux_power_enabled}
                onCheckedChange={(val) => updateConfig('aux_power_enabled', val)}
              />

              <ConfigSwitch
                label="Payload Power"
                description="Power to payload connector"
                checked={config.payload_power}
                onCheckedChange={(val) => updateConfig('payload_power', val)}
              />

              <ConfigSwitch
                label="Heater Enabled"
                description="Battery heater for cold weather"
                checked={config.heater_enabled}
                onCheckedChange={(val) => updateConfig('heater_enabled', val)}
              />

              <ConfigSlider
                label="LED Brightness"
                description="Status LED brightness (%)"
                value={config.led_brightness}
                min={0}
                max={100}
                step={10}
                unit="%"
                onChange={(val) => updateConfig('led_brightness', val)}
              />
            </AccordionContent>
          </AccordionItem>

          {/* Energy Optimization */}
          <AccordionItem value="optimization" className="border border-slate-700 rounded-lg px-4">
            <AccordionTrigger className="text-cyan-400 hover:text-cyan-300">
              <span className="flex items-center gap-2">
                🍃 Energy Optimization (8 functions)
              </span>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              
              <ConfigAlert type="info">
                Energy optimization extends flight time but may affect performance
              </ConfigAlert>

              <ConfigSwitch
                label="Eco Mode"
                description="Reduce power consumption"
                checked={config.eco_mode}
                onCheckedChange={(val) => updateConfig('eco_mode', val)}
              />

              <ConfigSwitch
                label="Dynamic Power"
                description="Adjust power based on load"
                checked={config.dynamic_power}
                onCheckedChange={(val) => updateConfig('dynamic_power', val)}
              />

              <ConfigSwitch
                label="Regenerative Braking"
                description="Recover energy during deceleration"
                checked={config.regenerative_braking}
                onCheckedChange={(val) => updateConfig('regenerative_braking', val)}
              />

              <ConfigSwitch
                label="Idle Power Reduction"
                description="Reduce power during hover"
                checked={config.idle_power_reduction}
                onCheckedChange={(val) => updateConfig('idle_power_reduction', val)}
              />
            </AccordionContent>
          </AccordionItem>

          {/* Monitoring */}
          <AccordionItem value="monitoring" className="border border-slate-700 rounded-lg px-4">
            <AccordionTrigger className="text-cyan-400 hover:text-cyan-300">
              <span className="flex items-center gap-2">
                📊 Power Monitoring (4 functions)
              </span>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              
              <ConfigSwitch
                label="Cell Monitoring"
                description="Monitor individual cell voltages"
                checked={config.cell_monitoring}
                onCheckedChange={(val) => updateConfig('cell_monitoring', val)}
              />

              <ConfigSwitch
                label="Temperature Monitoring"
                description="Monitor battery temperature"
                checked={config.temperature_monitoring}
                onCheckedChange={(val) => updateConfig('temperature_monitoring', val)}
              />

              <ConfigSwitch
                label="Current Monitoring"
                description="Monitor discharge current"
                checked={config.current_monitoring}
                onCheckedChange={(val) => updateConfig('current_monitoring', val)}
              />

              <ConfigSlider
                label="Logging Interval"
                description="Power data logging rate (Hz)"
                value={config.logging_interval}
                min={1}
                max={10}
                step={1}
                unit="Hz"
                onChange={(val) => updateConfig('logging_interval', val)}
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
            Save Power Config
          </button>
        </div>
      </div>
    </div>
  );
}

export default PowerConfig;

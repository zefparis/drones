/**
 * Payload Module Configuration
 * 44 functions for payload management
 */

import { useState } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { ConfigSection, ConfigSwitch, ConfigSlider, ConfigSelect, ConfigAlert } from './ConfigHelpers';

export function PayloadConfig() {
  const [config, setConfig] = useState({
    // Payload Detection (12 functions)
    auto_detect: true,
    payload_type: 'CAMERA',
    payload_weight: 500,
    weight_limit: 2000,
    cog_compensation: true,
    
    // Payload Control (12 functions)
    payload_power: true,
    power_voltage: 12,
    power_current_limit: 5,
    serial_enabled: true,
    serial_baudrate: 115200,
    mavlink_passthrough: true,
    
    // Release Mechanism (10 functions)
    release_enabled: false,
    release_type: 'SERVO',
    release_altitude_min: 5,
    release_speed_max: 5,
    arm_timeout: 30,
    
    // Custom Payload (10 functions)
    custom_protocol: false,
    protocol_type: 'UART',
    trigger_gpio: 1,
    feedback_gpio: 2,
    trigger_duration: 100,
  });

  const updateConfig = (key: string, value: unknown) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-4">
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-cyan-400">Payload Module Configuration</h2>
            <p className="text-sm text-slate-400 mt-1">44 functions for payload management and control</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-green-400 font-mono">ACTIVE</span>
          </div>
        </div>

        <Accordion type="multiple" className="space-y-2" defaultValue={['detection']}>
          
          {/* Payload Detection */}
          <AccordionItem value="detection" className="border border-slate-700 rounded-lg px-4">
            <AccordionTrigger className="text-cyan-400 hover:text-cyan-300">
              <span className="flex items-center gap-2">
                🔍 Payload Detection (12 functions)
              </span>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              
              <ConfigSwitch
                label="Auto Detect"
                description="Automatically detect payload type"
                checked={config.auto_detect}
                onCheckedChange={(val) => updateConfig('auto_detect', val)}
              />

              <ConfigSelect
                label="Payload Type"
                description="Type of attached payload"
                value={config.payload_type}
                options={['CAMERA', 'LIDAR', 'SENSOR', 'DELIVERY', 'CUSTOM', 'NONE']}
                onChange={(val) => updateConfig('payload_type', val)}
              />

              <ConfigSlider
                label="Payload Weight"
                description="Current payload weight (g)"
                value={config.payload_weight}
                min={0}
                max={5000}
                step={100}
                unit="g"
                onChange={(val) => updateConfig('payload_weight', val)}
              />

              <ConfigSlider
                label="Weight Limit"
                description="Maximum payload weight (g)"
                value={config.weight_limit}
                min={500}
                max={10000}
                step={500}
                unit="g"
                onChange={(val) => updateConfig('weight_limit', val)}
              />

              <ConfigSwitch
                label="CoG Compensation"
                description="Compensate for center of gravity shift"
                checked={config.cog_compensation}
                onCheckedChange={(val) => updateConfig('cog_compensation', val)}
              />
            </AccordionContent>
          </AccordionItem>

          {/* Payload Control */}
          <AccordionItem value="control" className="border border-slate-700 rounded-lg px-4">
            <AccordionTrigger className="text-cyan-400 hover:text-cyan-300">
              <span className="flex items-center gap-2">
                🎛️ Payload Control (12 functions)
              </span>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              
              <ConfigSwitch
                label="Payload Power"
                description="Enable power to payload"
                checked={config.payload_power}
                onCheckedChange={(val) => updateConfig('payload_power', val)}
              />

              <ConfigSection title="Power Settings" description="Payload power configuration">
                <ConfigSlider
                  label="Power Voltage"
                  description="Output voltage (V)"
                  value={config.power_voltage}
                  min={5}
                  max={24}
                  step={1}
                  unit="V"
                  onChange={(val) => updateConfig('power_voltage', val)}
                />

                <ConfigSlider
                  label="Current Limit"
                  description="Maximum current (A)"
                  value={config.power_current_limit}
                  min={1}
                  max={20}
                  step={1}
                  unit="A"
                  onChange={(val) => updateConfig('power_current_limit', val)}
                />
              </ConfigSection>

              <ConfigSection title="Communication" description="Payload data interface">
                <ConfigSwitch
                  label="Serial Enabled"
                  description="Enable serial communication"
                  checked={config.serial_enabled}
                  onCheckedChange={(val) => updateConfig('serial_enabled', val)}
                />

                <ConfigSelect
                  label="Baud Rate"
                  description="Serial communication speed"
                  value={config.serial_baudrate.toString()}
                  options={['9600', '19200', '38400', '57600', '115200', '230400', '921600']}
                  onChange={(val) => updateConfig('serial_baudrate', parseInt(val))}
                />

                <ConfigSwitch
                  label="MAVLink Passthrough"
                  description="Forward MAVLink to payload"
                  checked={config.mavlink_passthrough}
                  onCheckedChange={(val) => updateConfig('mavlink_passthrough', val)}
                />
              </ConfigSection>
            </AccordionContent>
          </AccordionItem>

          {/* Release Mechanism */}
          <AccordionItem value="release" className="border border-slate-700 rounded-lg px-4">
            <AccordionTrigger className="text-cyan-400 hover:text-cyan-300">
              <span className="flex items-center gap-2">
                📦 Release Mechanism (10 functions)
              </span>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              
              <ConfigAlert type="warning">
                Release mechanism requires safety checks before activation
              </ConfigAlert>

              <ConfigSwitch
                label="Release Enabled"
                description="Enable payload release mechanism"
                checked={config.release_enabled}
                onCheckedChange={(val) => updateConfig('release_enabled', val)}
              />

              <ConfigSelect
                label="Release Type"
                description="Type of release mechanism"
                value={config.release_type}
                options={['SERVO', 'ELECTROMAGNET', 'GRIPPER', 'WINCH']}
                onChange={(val) => updateConfig('release_type', val)}
              />

              <ConfigSlider
                label="Min Release Altitude"
                description="Minimum altitude for release (m)"
                value={config.release_altitude_min}
                min={1}
                max={50}
                step={1}
                unit="m"
                onChange={(val) => updateConfig('release_altitude_min', val)}
              />

              <ConfigSlider
                label="Max Release Speed"
                description="Maximum speed for release (m/s)"
                value={config.release_speed_max}
                min={1}
                max={15}
                step={1}
                unit="m/s"
                onChange={(val) => updateConfig('release_speed_max', val)}
              />

              <ConfigSlider
                label="Arm Timeout"
                description="Release arm timeout (s)"
                value={config.arm_timeout}
                min={10}
                max={120}
                step={10}
                unit="s"
                onChange={(val) => updateConfig('arm_timeout', val)}
              />
            </AccordionContent>
          </AccordionItem>

          {/* Custom Payload */}
          <AccordionItem value="custom" className="border border-slate-700 rounded-lg px-4">
            <AccordionTrigger className="text-cyan-400 hover:text-cyan-300">
              <span className="flex items-center gap-2">
                🔧 Custom Payload (10 functions)
              </span>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              
              <ConfigSwitch
                label="Custom Protocol"
                description="Enable custom payload protocol"
                checked={config.custom_protocol}
                onCheckedChange={(val) => updateConfig('custom_protocol', val)}
              />

              <ConfigSelect
                label="Protocol Type"
                description="Communication protocol"
                value={config.protocol_type}
                options={['UART', 'I2C', 'SPI', 'CAN', 'PWM']}
                onChange={(val) => updateConfig('protocol_type', val)}
              />

              <ConfigSlider
                label="Trigger GPIO"
                description="GPIO pin for trigger signal"
                value={config.trigger_gpio}
                min={1}
                max={16}
                step={1}
                onChange={(val) => updateConfig('trigger_gpio', val)}
              />

              <ConfigSlider
                label="Feedback GPIO"
                description="GPIO pin for feedback signal"
                value={config.feedback_gpio}
                min={1}
                max={16}
                step={1}
                onChange={(val) => updateConfig('feedback_gpio', val)}
              />

              <ConfigSlider
                label="Trigger Duration"
                description="Trigger pulse duration (ms)"
                value={config.trigger_duration}
                min={10}
                max={1000}
                step={10}
                unit="ms"
                onChange={(val) => updateConfig('trigger_duration', val)}
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
            Save Payload Config
          </button>
        </div>
      </div>
    </div>
  );
}

export default PayloadConfig;

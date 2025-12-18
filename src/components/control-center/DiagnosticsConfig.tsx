/**
 * Diagnostics Module Configuration
 * 52 functions for system health monitoring
 */

import { useState } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { ConfigSwitch, ConfigSlider, ConfigSelect, ConfigAlert } from './ConfigHelpers';

export function DiagnosticsConfig() {
  const [config, setConfig] = useState({
    // Health Monitoring (18 functions)
    health_check_interval: 1000,
    motor_monitoring: true,
    battery_monitoring: true,
    temperature_monitoring: true,
    vibration_monitoring: true,
    
    // Logging (16 functions)
    logging_enabled: true,
    log_level: 'INFO',
    log_retention_days: 7,
    flight_recorder: true,
    blackbox_enabled: true,
    
    // Alerts (10 functions)
    alert_enabled: true,
    alert_sound: true,
    critical_threshold: 0.9,
    warning_threshold: 0.7,
    
    // Self-Test (8 functions)
    pre_flight_check: true,
    sensor_calibration: true,
    motor_test: true,
    communication_test: true,
  });

  const updateConfig = (key: string, value: unknown) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-4">
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-cyan-400">Diagnostics Module Configuration</h2>
            <p className="text-sm text-slate-400 mt-1">52 functions for system health and diagnostics</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-green-400 font-mono">ACTIVE</span>
          </div>
        </div>

        <Accordion type="multiple" className="space-y-2" defaultValue={['health']}>
          
          {/* Section 1: Health Monitoring */}
          <AccordionItem value="health" className="border border-slate-700 rounded-lg px-4">
            <AccordionTrigger className="text-cyan-400 hover:text-cyan-300">
              <span className="flex items-center gap-2">
                💓 Health Monitoring (18 functions)
              </span>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              
              <ConfigSlider
                label="Health Check Interval"
                description="System health check frequency (ms)"
                value={config.health_check_interval}
                min={100}
                max={5000}
                step={100}
                unit="ms"
                onChange={(val) => updateConfig('health_check_interval', val)}
              />

              <ConfigSwitch
                label="Motor Monitoring"
                description="Monitor motor health and RPM"
                checked={config.motor_monitoring}
                onCheckedChange={(val) => updateConfig('motor_monitoring', val)}
              />

              <ConfigSwitch
                label="Battery Monitoring"
                description="Monitor battery health and discharge"
                checked={config.battery_monitoring}
                onCheckedChange={(val) => updateConfig('battery_monitoring', val)}
              />

              <ConfigSwitch
                label="Temperature Monitoring"
                description="Monitor component temperatures"
                checked={config.temperature_monitoring}
                onCheckedChange={(val) => updateConfig('temperature_monitoring', val)}
              />

              <ConfigSwitch
                label="Vibration Monitoring"
                description="Monitor vibration levels"
                checked={config.vibration_monitoring}
                onCheckedChange={(val) => updateConfig('vibration_monitoring', val)}
              />
            </AccordionContent>
          </AccordionItem>

          {/* Section 2: Logging */}
          <AccordionItem value="logging" className="border border-slate-700 rounded-lg px-4">
            <AccordionTrigger className="text-cyan-400 hover:text-cyan-300">
              <span className="flex items-center gap-2">
                📝 Logging (16 functions)
              </span>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              
              <ConfigSwitch
                label="Logging Enabled"
                description="Enable system logging"
                checked={config.logging_enabled}
                onCheckedChange={(val) => updateConfig('logging_enabled', val)}
              />

              <ConfigSelect
                label="Log Level"
                description="Minimum log level to record"
                value={config.log_level}
                options={['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL']}
                onChange={(val) => updateConfig('log_level', val)}
              />

              <ConfigSlider
                label="Log Retention"
                description="Days to keep logs"
                value={config.log_retention_days}
                min={1}
                max={30}
                step={1}
                unit="days"
                onChange={(val) => updateConfig('log_retention_days', val)}
              />

              <ConfigSwitch
                label="Flight Recorder"
                description="Record all flight data"
                checked={config.flight_recorder}
                onCheckedChange={(val) => updateConfig('flight_recorder', val)}
              />

              <ConfigSwitch
                label="Blackbox Enabled"
                description="Enable crash-proof blackbox recording"
                checked={config.blackbox_enabled}
                onCheckedChange={(val) => updateConfig('blackbox_enabled', val)}
              />
            </AccordionContent>
          </AccordionItem>

          {/* Section 3: Alerts */}
          <AccordionItem value="alerts" className="border border-slate-700 rounded-lg px-4">
            <AccordionTrigger className="text-cyan-400 hover:text-cyan-300">
              <span className="flex items-center gap-2">
                🚨 Alerts (10 functions)
              </span>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              
              <ConfigSwitch
                label="Alerts Enabled"
                description="Enable system alerts"
                checked={config.alert_enabled}
                onCheckedChange={(val) => updateConfig('alert_enabled', val)}
              />

              <ConfigSwitch
                label="Alert Sound"
                description="Play sound on alerts"
                checked={config.alert_sound}
                onCheckedChange={(val) => updateConfig('alert_sound', val)}
              />

              <ConfigSlider
                label="Critical Threshold"
                description="Threshold for critical alerts"
                value={config.critical_threshold}
                min={0.7}
                max={0.99}
                step={0.05}
                onChange={(val) => updateConfig('critical_threshold', val)}
              />

              <ConfigSlider
                label="Warning Threshold"
                description="Threshold for warning alerts"
                value={config.warning_threshold}
                min={0.5}
                max={0.9}
                step={0.05}
                onChange={(val) => updateConfig('warning_threshold', val)}
              />
            </AccordionContent>
          </AccordionItem>

          {/* Section 4: Self-Test */}
          <AccordionItem value="selftest" className="border border-slate-700 rounded-lg px-4">
            <AccordionTrigger className="text-cyan-400 hover:text-cyan-300">
              <span className="flex items-center gap-2">
                🔧 Self-Test (8 functions)
              </span>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              
              <ConfigAlert type="info">
                Self-tests run automatically before each flight
              </ConfigAlert>

              <ConfigSwitch
                label="Pre-Flight Check"
                description="Run pre-flight system check"
                checked={config.pre_flight_check}
                onCheckedChange={(val) => updateConfig('pre_flight_check', val)}
              />

              <ConfigSwitch
                label="Sensor Calibration"
                description="Auto-calibrate sensors on startup"
                checked={config.sensor_calibration}
                onCheckedChange={(val) => updateConfig('sensor_calibration', val)}
              />

              <ConfigSwitch
                label="Motor Test"
                description="Test motors before flight"
                checked={config.motor_test}
                onCheckedChange={(val) => updateConfig('motor_test', val)}
              />

              <ConfigSwitch
                label="Communication Test"
                description="Test communication links"
                checked={config.communication_test}
                onCheckedChange={(val) => updateConfig('communication_test', val)}
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
            Save Diagnostics Config
          </button>
        </div>
      </div>
    </div>
  );
}

export default DiagnosticsConfig;

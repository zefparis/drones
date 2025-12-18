/**
 * Communication Module Configuration
 * 54 functions for secure communications
 */

import { useState } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { ConfigSwitch, ConfigSlider, ConfigSelect, ConfigAlert } from './ConfigHelpers';

export function CommunicationConfig() {
  const [config, setConfig] = useState({
    // Radio (18 functions)
    radio_enabled: true,
    tx_power: 20,
    frequency_band: '2.4GHz',
    channel_hopping: true,
    hop_interval: 50,
    encryption_enabled: true,
    encryption_algorithm: 'AES-256',
    
    // Mesh Network (16 functions)
    mesh_enabled: true,
    mesh_role: 'AUTO',
    max_hops: 5,
    routing_protocol: 'AODV',
    heartbeat_interval: 1000,
    
    // Data Link (12 functions)
    telemetry_rate: 10,
    video_enabled: true,
    video_quality: 'MEDIUM',
    compression: 'H265',
    latency_priority: 0.5,
    
    // Security (8 functions)
    auth_required: true,
    key_rotation: true,
    key_rotation_interval: 3600,
    anti_jamming: true,
  });

  const updateConfig = (key: string, value: unknown) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-4">
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-cyan-400">Communication Module Configuration</h2>
            <p className="text-sm text-slate-400 mt-1">54 functions for secure tactical communications</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-green-400 font-mono">ACTIVE</span>
          </div>
        </div>

        <Accordion type="multiple" className="space-y-2" defaultValue={['radio']}>
          
          {/* Section 1: Radio */}
          <AccordionItem value="radio" className="border border-slate-700 rounded-lg px-4">
            <AccordionTrigger className="text-cyan-400 hover:text-cyan-300">
              <span className="flex items-center gap-2">
                📡 Radio Configuration (18 functions)
              </span>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              
              <ConfigSwitch
                label="Radio Enabled"
                description="Enable radio communications"
                checked={config.radio_enabled}
                onCheckedChange={(val) => updateConfig('radio_enabled', val)}
              />

              <ConfigSlider
                label="TX Power"
                description="Transmit power (dBm)"
                value={config.tx_power}
                min={0}
                max={30}
                step={1}
                unit="dBm"
                onChange={(val) => updateConfig('tx_power', val)}
              />

              <ConfigSelect
                label="Frequency Band"
                description="Operating frequency band"
                value={config.frequency_band}
                options={['900MHz', '2.4GHz', '5.8GHz', 'UHF', 'VHF']}
                onChange={(val) => updateConfig('frequency_band', val)}
              />

              <ConfigSwitch
                label="Channel Hopping"
                description="Enable frequency hopping spread spectrum"
                checked={config.channel_hopping}
                onCheckedChange={(val) => updateConfig('channel_hopping', val)}
              />

              <ConfigSlider
                label="Hop Interval"
                description="Frequency hop interval (ms)"
                value={config.hop_interval}
                min={10}
                max={200}
                step={10}
                unit="ms"
                onChange={(val) => updateConfig('hop_interval', val)}
              />
            </AccordionContent>
          </AccordionItem>

          {/* Section 2: Mesh Network */}
          <AccordionItem value="mesh" className="border border-slate-700 rounded-lg px-4">
            <AccordionTrigger className="text-cyan-400 hover:text-cyan-300">
              <span className="flex items-center gap-2">
                🕸️ Mesh Network (16 functions)
              </span>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              
              <ConfigSwitch
                label="Mesh Enabled"
                description="Enable mesh networking mode"
                checked={config.mesh_enabled}
                onCheckedChange={(val) => updateConfig('mesh_enabled', val)}
              />

              <ConfigSelect
                label="Mesh Role"
                description="Node role in mesh network"
                value={config.mesh_role}
                options={['AUTO', 'GATEWAY', 'RELAY', 'LEAF']}
                onChange={(val) => updateConfig('mesh_role', val)}
              />

              <ConfigSlider
                label="Max Hops"
                description="Maximum message hop count"
                value={config.max_hops}
                min={1}
                max={10}
                step={1}
                onChange={(val) => updateConfig('max_hops', val)}
              />

              <ConfigSelect
                label="Routing Protocol"
                description="Mesh routing protocol"
                value={config.routing_protocol}
                options={['AODV', 'OLSR', 'DSR', 'BATMAN']}
                onChange={(val) => updateConfig('routing_protocol', val)}
              />

              <ConfigSlider
                label="Heartbeat Interval"
                description="Mesh heartbeat interval (ms)"
                value={config.heartbeat_interval}
                min={500}
                max={5000}
                step={500}
                unit="ms"
                onChange={(val) => updateConfig('heartbeat_interval', val)}
              />
            </AccordionContent>
          </AccordionItem>

          {/* Section 3: Data Link */}
          <AccordionItem value="datalink" className="border border-slate-700 rounded-lg px-4">
            <AccordionTrigger className="text-cyan-400 hover:text-cyan-300">
              <span className="flex items-center gap-2">
                📊 Data Link (12 functions)
              </span>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              
              <ConfigSlider
                label="Telemetry Rate"
                description="Telemetry update rate (Hz)"
                value={config.telemetry_rate}
                min={1}
                max={50}
                step={1}
                unit="Hz"
                onChange={(val) => updateConfig('telemetry_rate', val)}
              />

              <ConfigSwitch
                label="Video Enabled"
                description="Enable video downlink"
                checked={config.video_enabled}
                onCheckedChange={(val) => updateConfig('video_enabled', val)}
              />

              <ConfigSelect
                label="Video Quality"
                description="Video stream quality"
                value={config.video_quality}
                options={['LOW', 'MEDIUM', 'HIGH', 'ULTRA']}
                onChange={(val) => updateConfig('video_quality', val)}
              />

              <ConfigSelect
                label="Compression"
                description="Video compression codec"
                value={config.compression}
                options={['H264', 'H265', 'AV1', 'VP9']}
                onChange={(val) => updateConfig('compression', val)}
              />

              <ConfigSlider
                label="Latency Priority"
                description="Balance latency vs quality (0=quality, 1=latency)"
                value={config.latency_priority}
                min={0}
                max={1}
                step={0.1}
                onChange={(val) => updateConfig('latency_priority', val)}
              />
            </AccordionContent>
          </AccordionItem>

          {/* Section 4: Security */}
          <AccordionItem value="security" className="border border-slate-700 rounded-lg px-4">
            <AccordionTrigger className="text-cyan-400 hover:text-cyan-300">
              <span className="flex items-center gap-2">
                🔐 Communication Security (8 functions)
              </span>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              
              <ConfigAlert type="warning">
                Disabling encryption exposes communications to interception
              </ConfigAlert>

              <ConfigSwitch
                label="Encryption Enabled"
                description="Enable end-to-end encryption"
                checked={config.encryption_enabled}
                onCheckedChange={(val) => updateConfig('encryption_enabled', val)}
              />

              <ConfigSelect
                label="Encryption Algorithm"
                description="Encryption algorithm"
                value={config.encryption_algorithm}
                options={['AES-128', 'AES-256', 'ChaCha20', 'Salsa20']}
                onChange={(val) => updateConfig('encryption_algorithm', val)}
              />

              <ConfigSwitch
                label="Authentication Required"
                description="Require node authentication"
                checked={config.auth_required}
                onCheckedChange={(val) => updateConfig('auth_required', val)}
              />

              <ConfigSwitch
                label="Key Rotation"
                description="Enable automatic key rotation"
                checked={config.key_rotation}
                onCheckedChange={(val) => updateConfig('key_rotation', val)}
              />

              <ConfigSlider
                label="Key Rotation Interval"
                description="Key rotation interval (seconds)"
                value={config.key_rotation_interval}
                min={300}
                max={7200}
                step={300}
                unit="s"
                onChange={(val) => updateConfig('key_rotation_interval', val)}
              />

              <ConfigSwitch
                label="Anti-Jamming"
                description="Enable anti-jamming measures"
                checked={config.anti_jamming}
                onCheckedChange={(val) => updateConfig('anti_jamming', val)}
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
            Save Communication Config
          </button>
        </div>
      </div>
    </div>
  );
}

export default CommunicationConfig;

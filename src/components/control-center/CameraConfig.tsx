/**
 * Camera Module Configuration
 * 42 functions for camera and imaging control
 */

import { useState } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { ConfigSection, ConfigSwitch, ConfigSlider, ConfigSelect } from './ConfigHelpers';

export function CameraConfig() {
  const [config, setConfig] = useState({
    // Main Camera (16 functions)
    main_camera_enabled: true,
    resolution: '4K',
    frame_rate: 30,
    auto_exposure: true,
    exposure_compensation: 0,
    white_balance: 'AUTO',
    iso_auto: true,
    iso_value: 400,
    shutter_speed: 'AUTO',
    aperture: 2.8,
    
    // Gimbal Control (14 functions)
    gimbal_enabled: true,
    gimbal_mode: 'FOLLOW',
    pitch_limit_up: 30,
    pitch_limit_down: -90,
    yaw_limit: 180,
    stabilization: true,
    gimbal_speed: 50,
    smooth_follow: true,
    
    // Image Processing (12 functions)
    hdr_enabled: true,
    noise_reduction: true,
    sharpening: 0.5,
    distortion_correction: true,
    color_profile: 'STANDARD',
    histogram_enabled: true,
    
    // Recording (8 functions)
    codec: 'H265',
    bitrate: 100,
    storage_format: 'MP4',
    audio_recording: false,
    gps_tagging: true,
  });

  const updateConfig = (key: string, value: unknown) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-4">
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-cyan-400">Camera Module Configuration</h2>
            <p className="text-sm text-slate-400 mt-1">42 functions for camera and imaging control</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-green-400 font-mono">ACTIVE</span>
          </div>
        </div>

        <Accordion type="multiple" className="space-y-2" defaultValue={['camera']}>
          
          {/* Main Camera */}
          <AccordionItem value="camera" className="border border-slate-700 rounded-lg px-4">
            <AccordionTrigger className="text-cyan-400 hover:text-cyan-300">
              <span className="flex items-center gap-2">
                📷 Main Camera (14 functions)
              </span>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              
              <ConfigSwitch
                label="Main Camera"
                description="Enable main camera"
                checked={config.main_camera_enabled}
                onCheckedChange={(val) => updateConfig('main_camera_enabled', val)}
              />

              <ConfigSelect
                label="Resolution"
                description="Video/Image resolution"
                value={config.resolution}
                options={['720p', '1080p', '2.7K', '4K', '5.4K']}
                onChange={(val) => updateConfig('resolution', val)}
              />

              <ConfigSlider
                label="Frame Rate"
                description="Video frame rate (fps)"
                value={config.frame_rate}
                min={24}
                max={120}
                step={6}
                unit="fps"
                onChange={(val) => updateConfig('frame_rate', val)}
              />

              <ConfigSection title="Exposure" description="Exposure settings">
                <ConfigSwitch
                  label="Auto Exposure"
                  description="Automatic exposure control"
                  checked={config.auto_exposure}
                  onCheckedChange={(val) => updateConfig('auto_exposure', val)}
                />

                <ConfigSlider
                  label="Exposure Compensation"
                  description="EV compensation (-3 to +3)"
                  value={config.exposure_compensation}
                  min={-3}
                  max={3}
                  step={0.5}
                  unit="EV"
                  onChange={(val) => updateConfig('exposure_compensation', val)}
                />
              </ConfigSection>

              <ConfigSelect
                label="White Balance"
                description="Color temperature setting"
                value={config.white_balance}
                options={['AUTO', 'SUNNY', 'CLOUDY', 'TUNGSTEN', 'FLUORESCENT', 'CUSTOM']}
                onChange={(val) => updateConfig('white_balance', val)}
              />

              <ConfigSection title="ISO" description="Sensitivity settings">
                <ConfigSwitch
                  label="Auto ISO"
                  description="Automatic ISO control"
                  checked={config.iso_auto}
                  onCheckedChange={(val) => updateConfig('iso_auto', val)}
                />

                <ConfigSlider
                  label="ISO Value"
                  description="Manual ISO setting"
                  value={config.iso_value}
                  min={100}
                  max={12800}
                  step={100}
                  onChange={(val) => updateConfig('iso_value', val)}
                />
              </ConfigSection>
            </AccordionContent>
          </AccordionItem>

          {/* Gimbal Control */}
          <AccordionItem value="gimbal" className="border border-slate-700 rounded-lg px-4">
            <AccordionTrigger className="text-cyan-400 hover:text-cyan-300">
              <span className="flex items-center gap-2">
                🎯 Gimbal Control (12 functions)
              </span>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              
              <ConfigSwitch
                label="Gimbal Enabled"
                description="Enable gimbal control"
                checked={config.gimbal_enabled}
                onCheckedChange={(val) => updateConfig('gimbal_enabled', val)}
              />

              <ConfigSelect
                label="Gimbal Mode"
                description="Gimbal operation mode"
                value={config.gimbal_mode}
                options={['FOLLOW', 'FPV', 'LOCK', 'POI']}
                onChange={(val) => updateConfig('gimbal_mode', val)}
              />

              <ConfigSlider
                label="Pitch Limit Up"
                description="Maximum upward pitch (degrees)"
                value={config.pitch_limit_up}
                min={0}
                max={90}
                step={5}
                unit="°"
                onChange={(val) => updateConfig('pitch_limit_up', val)}
              />

              <ConfigSlider
                label="Pitch Limit Down"
                description="Maximum downward pitch (degrees)"
                value={config.pitch_limit_down}
                min={-90}
                max={0}
                step={5}
                unit="°"
                onChange={(val) => updateConfig('pitch_limit_down', val)}
              />

              <ConfigSlider
                label="Yaw Limit"
                description="Maximum yaw rotation (degrees)"
                value={config.yaw_limit}
                min={90}
                max={360}
                step={30}
                unit="°"
                onChange={(val) => updateConfig('yaw_limit', val)}
              />

              <ConfigSwitch
                label="Stabilization"
                description="3-axis gimbal stabilization"
                checked={config.stabilization}
                onCheckedChange={(val) => updateConfig('stabilization', val)}
              />
            </AccordionContent>
          </AccordionItem>

          {/* Image Processing */}
          <AccordionItem value="processing" className="border border-slate-700 rounded-lg px-4">
            <AccordionTrigger className="text-cyan-400 hover:text-cyan-300">
              <span className="flex items-center gap-2">
                🖼️ Image Processing (10 functions)
              </span>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              
              <ConfigSwitch
                label="HDR Mode"
                description="High dynamic range capture"
                checked={config.hdr_enabled}
                onCheckedChange={(val) => updateConfig('hdr_enabled', val)}
              />

              <ConfigSwitch
                label="Noise Reduction"
                description="Apply noise reduction filter"
                checked={config.noise_reduction}
                onCheckedChange={(val) => updateConfig('noise_reduction', val)}
              />

              <ConfigSlider
                label="Sharpening"
                description="Image sharpening level"
                value={config.sharpening}
                min={0}
                max={1}
                step={0.1}
                onChange={(val) => updateConfig('sharpening', val)}
              />

              <ConfigSwitch
                label="Distortion Correction"
                description="Lens distortion correction"
                checked={config.distortion_correction}
                onCheckedChange={(val) => updateConfig('distortion_correction', val)}
              />
            </AccordionContent>
          </AccordionItem>

          {/* Recording */}
          <AccordionItem value="recording" className="border border-slate-700 rounded-lg px-4">
            <AccordionTrigger className="text-cyan-400 hover:text-cyan-300">
              <span className="flex items-center gap-2">
                ⏺️ Recording (6 functions)
              </span>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              
              <ConfigSelect
                label="Video Codec"
                description="Video compression codec"
                value={config.codec}
                options={['H264', 'H265', 'ProRes', 'RAW']}
                onChange={(val) => updateConfig('codec', val)}
              />

              <ConfigSlider
                label="Bitrate"
                description="Video bitrate (Mbps)"
                value={config.bitrate}
                min={20}
                max={200}
                step={10}
                unit="Mbps"
                onChange={(val) => updateConfig('bitrate', val)}
              />

              <ConfigSelect
                label="Storage Format"
                description="File container format"
                value={config.storage_format}
                options={['MP4', 'MOV', 'MKV']}
                onChange={(val) => updateConfig('storage_format', val)}
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
            Save Camera Config
          </button>
        </div>
      </div>
    </div>
  );
}

export default CameraConfig;

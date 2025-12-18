/**
 * Navigator Module Configuration
 * 68 functions for multi-source navigation fusion
 */

import { useState } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { ConfigSection, ConfigSwitch, ConfigSlider, ConfigSelect } from './ConfigHelpers';
import { GpsBurstPanel } from './GpsBurstPanel';

export function NavigatorConfig() {
  const [config, setConfig] = useState({
    // Localisation (28 functions)
    gps_enabled: false,
    gps_burst_duration: 10,
    gps_spoofing_detection: true,
    gps_jamming_threshold: -80,
    gps_min_satellites: 6,
    gps_hdop_threshold: 2.0,
    gps_position_timeout: 30,
    vio_tracking_enabled: true,
    vio_drift_threshold: 2.0,
    vio_feature_count: 200,
    vio_keyframe_distance: 0.5,
    vio_exposure_control: true,
    vio_imu_preintegration: true,
    lidar_slam_enabled: true,
    lidar_range: 100,
    lidar_resolution: 0.1,
    lidar_scan_rate: 20,
    lidar_ground_filter: true,
    celestial_backup_enabled: true,
    celestial_min_stars: 3,
    celestial_sun_tracking: true,
    celestial_refraction_correction: true,
    
    // EKF Fusion (16 functions)
    ekf_state_dim: 15,
    ekf_imu_weight: 1.0,
    ekf_vio_weight: 0.8,
    ekf_gps_weight: 0.6,
    ekf_lidar_weight: 0.7,
    ekf_celestial_weight: 0.4,
    ekf_update_rate: 100,
    ekf_covariance_reset: false,
    ekf_outlier_rejection: true,
    ekf_mahalanobis_threshold: 5.991,
    ekf_bias_estimation: true,
    ekf_delay_compensation: true,
    
    // Path Planning (20 functions)
    planning_algorithm: 'A*',
    obstacle_clearance: 2.0,
    max_velocity: 15.0,
    max_acceleration: 3.0,
    path_smoothing: true,
    waypoint_radius: 1.0,
    replan_threshold: 5.0,
    dynamic_obstacles: true,
    terrain_aware_planning: true,
    no_fly_zone_enabled: true,
    wind_compensation: true,
    energy_optimal_path: false,
    
    // Trajectory Control (14 functions)
    pid_p_gain: 1.2,
    pid_i_gain: 0.05,
    pid_d_gain: 0.3,
    trajectory_lookahead: 5.0,
    velocity_smoothing: 0.8,
    yaw_rate_limit: 45,
    altitude_hold_precision: 0.5,
    position_hold_precision: 0.3,
    attitude_rate_limit: 90,
    feedforward_enabled: true,
  });

  const updateConfig = (key: string, value: unknown) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-4">
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-cyan-400">Navigator Module Configuration</h2>
            <p className="text-sm text-slate-400 mt-1">68 functions for multi-source navigation fusion</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-green-400 font-mono">ACTIVE</span>
          </div>
        </div>

        <Accordion type="multiple" className="space-y-2" defaultValue={['localisation']}>
          
          {/* Section 1: Localisation */}
          <AccordionItem value="localisation" className="border border-slate-700 rounded-lg px-4">
            <AccordionTrigger className="text-cyan-400 hover:text-cyan-300">
              <span className="flex items-center gap-2">
                📍 Localisation (24 functions)
              </span>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              
              {/* GPS Management */}
              <ConfigSection title="GPS Management" description="Stealth-mode GPS control">
                <ConfigSwitch
                  label="GPS Enabled"
                  description="Allow GPS activation in safe zones"
                  checked={config.gps_enabled}
                  onCheckedChange={(val) => updateConfig('gps_enabled', val)}
                />
                
                <ConfigSlider
                  label="Burst Duration"
                  description="GPS activation duration (seconds)"
                  value={config.gps_burst_duration}
                  min={5}
                  max={60}
                  step={5}
                  unit="s"
                  onChange={(val) => updateConfig('gps_burst_duration', val)}
                />

                <ConfigSwitch
                  label="Spoofing Detection"
                  description="Detect GPS jamming/spoofing attacks"
                  checked={config.gps_spoofing_detection}
                  onCheckedChange={(val) => updateConfig('gps_spoofing_detection', val)}
                />

                <ConfigSlider
                  label="Jamming Threshold"
                  description="Signal strength threshold for jamming detection (dBm)"
                  value={config.gps_jamming_threshold}
                  min={-120}
                  max={-40}
                  step={5}
                  unit="dBm"
                  onChange={(val) => updateConfig('gps_jamming_threshold', val)}
                />
              </ConfigSection>

              {/* VIO */}
              <ConfigSection title="Visual-Inertial Odometry" description="Camera-based positioning">
                <ConfigSwitch
                  label="VIO Tracking"
                  description="Enable visual-inertial odometry"
                  checked={config.vio_tracking_enabled}
                  onCheckedChange={(val) => updateConfig('vio_tracking_enabled', val)}
                />

                <ConfigSlider
                  label="Drift Threshold"
                  description="Max drift before GPS activation (meters)"
                  value={config.vio_drift_threshold}
                  min={0.5}
                  max={10}
                  step={0.5}
                  unit="m"
                  onChange={(val) => updateConfig('vio_drift_threshold', val)}
                />

                <ConfigSlider
                  label="Feature Count"
                  description="Number of tracked visual features"
                  value={config.vio_feature_count}
                  min={50}
                  max={500}
                  step={50}
                  onChange={(val) => updateConfig('vio_feature_count', val)}
                />

                <ConfigSlider
                  label="Keyframe Distance"
                  description="Distance between keyframes (meters)"
                  value={config.vio_keyframe_distance}
                  min={0.1}
                  max={2}
                  step={0.1}
                  unit="m"
                  onChange={(val: number) => updateConfig('vio_keyframe_distance', val)}
                />
              </ConfigSection>

              {/* LiDAR SLAM */}
              <ConfigSection title="LiDAR SLAM" description="3D mapping and localization">
                <ConfigSwitch
                  label="SLAM Enabled"
                  description="Enable LiDAR SLAM mapping"
                  checked={config.lidar_slam_enabled}
                  onCheckedChange={(val) => updateConfig('lidar_slam_enabled', val)}
                />

                <ConfigSlider
                  label="LiDAR Range"
                  description="Maximum detection range (meters)"
                  value={config.lidar_range}
                  min={20}
                  max={200}
                  step={10}
                  unit="m"
                  onChange={(val) => updateConfig('lidar_range', val)}
                />

                <ConfigSlider
                  label="Resolution"
                  description="Point cloud resolution (meters)"
                  value={config.lidar_resolution}
                  min={0.01}
                  max={0.5}
                  step={0.01}
                  unit="m"
                  onChange={(val) => updateConfig('lidar_resolution', val)}
                />
              </ConfigSection>

              {/* Celestial Navigation */}
              <ConfigSection title="Celestial Navigation" description="GPS-denied backup">
                <ConfigSwitch
                  label="Celestial Backup"
                  description="Use sun/stars for heading correction"
                  checked={config.celestial_backup_enabled}
                  onCheckedChange={(val) => updateConfig('celestial_backup_enabled', val)}
                />

                <ConfigSlider
                  label="Minimum Stars"
                  description="Required stars for celestial fix"
                  value={config.celestial_min_stars}
                  min={2}
                  max={10}
                  step={1}
                  onChange={(val) => updateConfig('celestial_min_stars', val)}
                />
              </ConfigSection>
            </AccordionContent>
          </AccordionItem>

          {/* Section 2: EKF Fusion */}
          <AccordionItem value="ekf" className="border border-slate-700 rounded-lg px-4">
            <AccordionTrigger className="text-cyan-400 hover:text-cyan-300">
              <span className="flex items-center gap-2">
                🔀 EKF Fusion Weights (12 functions)
              </span>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              <div className="bg-amber-500/10 border border-amber-500/30 rounded p-3 text-sm text-amber-400 mb-4">
                ⚠️ Sensor weights affect position estimation accuracy. Higher = more trust.
              </div>

              <ConfigSlider
                label="IMU Weight"
                description="Inertial Measurement Unit confidence"
                value={config.ekf_imu_weight}
                min={0}
                max={1}
                step={0.1}
                onChange={(val) => updateConfig('ekf_imu_weight', val)}
              />

              <ConfigSlider
                label="VIO Weight"
                description="Visual-Inertial Odometry confidence"
                value={config.ekf_vio_weight}
                min={0}
                max={1}
                step={0.1}
                onChange={(val) => updateConfig('ekf_vio_weight', val)}
              />

              <ConfigSlider
                label="GPS Weight"
                description="GPS confidence (when enabled)"
                value={config.ekf_gps_weight}
                min={0}
                max={1}
                step={0.1}
                onChange={(val) => updateConfig('ekf_gps_weight', val)}
              />

              <ConfigSlider
                label="LiDAR Weight"
                description="LiDAR SLAM confidence"
                value={config.ekf_lidar_weight}
                min={0}
                max={1}
                step={0.1}
                onChange={(val) => updateConfig('ekf_lidar_weight', val)}
              />

              <ConfigSlider
                label="Celestial Weight"
                description="Celestial navigation confidence"
                value={config.ekf_celestial_weight}
                min={0}
                max={1}
                step={0.1}
                onChange={(val) => updateConfig('ekf_celestial_weight', val)}
              />

              <ConfigSlider
                label="Update Rate"
                description="EKF update frequency (Hz)"
                value={config.ekf_update_rate}
                min={50}
                max={500}
                step={50}
                unit="Hz"
                onChange={(val) => updateConfig('ekf_update_rate', val)}
              />

              <ConfigSwitch
                label="Covariance Reset"
                description="Reset covariance on large errors"
                checked={config.ekf_covariance_reset}
                onCheckedChange={(val) => updateConfig('ekf_covariance_reset', val)}
              />
            </AccordionContent>
          </AccordionItem>

          {/* Section 3: Path Planning */}
          <AccordionItem value="planning" className="border border-slate-700 rounded-lg px-4">
            <AccordionTrigger className="text-cyan-400 hover:text-cyan-300">
              <span className="flex items-center gap-2">
                🗺️ Path Planning (18 functions)
              </span>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              
              <ConfigSelect
                label="Planning Algorithm"
                description="Path finding algorithm"
                value={config.planning_algorithm}
                options={['A*', 'RRT*', 'Dijkstra', 'D* Lite', 'PRM', 'Hybrid A*']}
                onChange={(val) => updateConfig('planning_algorithm', val)}
              />

              <ConfigSlider
                label="Obstacle Clearance"
                description="Minimum distance from obstacles (meters)"
                value={config.obstacle_clearance}
                min={0.5}
                max={10}
                step={0.5}
                unit="m"
                onChange={(val) => updateConfig('obstacle_clearance', val)}
              />

              <ConfigSlider
                label="Max Velocity"
                description="Maximum flight speed (m/s)"
                value={config.max_velocity}
                min={1}
                max={30}
                step={1}
                unit="m/s"
                onChange={(val) => updateConfig('max_velocity', val)}
              />

              <ConfigSlider
                label="Max Acceleration"
                description="Maximum acceleration (m/s²)"
                value={config.max_acceleration}
                min={1}
                max={10}
                step={0.5}
                unit="m/s²"
                onChange={(val) => updateConfig('max_acceleration', val)}
              />

              <ConfigSwitch
                label="Path Smoothing"
                description="Apply B-spline smoothing to paths"
                checked={config.path_smoothing}
                onCheckedChange={(val) => updateConfig('path_smoothing', val)}
              />

              <ConfigSlider
                label="Waypoint Radius"
                description="Acceptance radius for waypoints (meters)"
                value={config.waypoint_radius}
                min={0.5}
                max={5}
                step={0.5}
                unit="m"
                onChange={(val) => updateConfig('waypoint_radius', val)}
              />

              <ConfigSlider
                label="Replan Threshold"
                description="Distance to obstacle triggering replan (meters)"
                value={config.replan_threshold}
                min={1}
                max={20}
                step={1}
                unit="m"
                onChange={(val) => updateConfig('replan_threshold', val)}
              />

              <ConfigSwitch
                label="Dynamic Obstacles"
                description="Track and avoid moving obstacles"
                checked={config.dynamic_obstacles}
                onCheckedChange={(val) => updateConfig('dynamic_obstacles', val)}
              />
            </AccordionContent>
          </AccordionItem>

          {/* Section 4: Trajectory Control */}
          <AccordionItem value="trajectory" className="border border-slate-700 rounded-lg px-4">
            <AccordionTrigger className="text-cyan-400 hover:text-cyan-300">
              <span className="flex items-center gap-2">
                🎯 Trajectory Control (14 functions)
              </span>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              
              <div className="bg-cyan-500/10 border border-cyan-500/30 rounded p-3 text-sm text-cyan-400 mb-4">
                ℹ️ PID tuning affects flight stability. Modify with caution.
              </div>

              <ConfigSlider
                label="P Gain (Proportional)"
                description="Position error correction strength"
                value={config.pid_p_gain}
                min={0.1}
                max={3}
                step={0.1}
                onChange={(val) => updateConfig('pid_p_gain', val)}
              />

              <ConfigSlider
                label="I Gain (Integral)"
                description="Accumulated error correction"
                value={config.pid_i_gain}
                min={0}
                max={0.5}
                step={0.01}
                onChange={(val) => updateConfig('pid_i_gain', val)}
              />

              <ConfigSlider
                label="D Gain (Derivative)"
                description="Rate of error change dampening"
                value={config.pid_d_gain}
                min={0}
                max={1}
                step={0.05}
                onChange={(val) => updateConfig('pid_d_gain', val)}
              />

              <ConfigSlider
                label="Trajectory Lookahead"
                description="Path preview distance (meters)"
                value={config.trajectory_lookahead}
                min={1}
                max={20}
                step={1}
                unit="m"
                onChange={(val) => updateConfig('trajectory_lookahead', val)}
              />

              <ConfigSlider
                label="Velocity Smoothing"
                description="Velocity filter coefficient (0-1)"
                value={config.velocity_smoothing}
                min={0}
                max={1}
                step={0.1}
                onChange={(val) => updateConfig('velocity_smoothing', val)}
              />

              <ConfigSlider
                label="Yaw Rate Limit"
                description="Maximum rotation speed (deg/s)"
                value={config.yaw_rate_limit}
                min={15}
                max={180}
                step={15}
                unit="°/s"
                onChange={(val) => updateConfig('yaw_rate_limit', val)}
              />

              <ConfigSlider
                label="Altitude Hold Precision"
                description="Altitude holding tolerance (meters)"
                value={config.altitude_hold_precision}
                min={0.1}
                max={2}
                step={0.1}
                unit="m"
                onChange={(val) => updateConfig('altitude_hold_precision', val)}
              />
            </AccordionContent>
          </AccordionItem>

          {/* Section 5: GPS Burst Manager */}
          <AccordionItem value="gpsburst" className="border border-cyan-500/50 rounded-lg px-4 bg-cyan-500/5">
            <AccordionTrigger className="text-cyan-400 hover:text-cyan-300">
              <span className="flex items-center gap-2">
                📡 GPS Burst Manager (Stealth Mode)
              </span>
            </AccordionTrigger>
            <AccordionContent className="pt-4">
              <GpsBurstPanel />
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Save Button */}
        <div className="mt-6 flex justify-end gap-3">
          <button className="px-4 py-2 border border-slate-600 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors">
            Reset to Defaults
          </button>
          <button className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg text-white font-medium hover:from-cyan-400 hover:to-blue-500 transition-colors">
            Save Navigator Config
          </button>
        </div>
      </div>
    </div>
  );
}

export default NavigatorConfig;

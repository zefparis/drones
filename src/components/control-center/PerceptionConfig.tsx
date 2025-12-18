/**
 * Perception Module Configuration
 * 64 functions for environment sensing and understanding
 */

import { useState } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { ConfigSection, ConfigSwitch, ConfigSlider, ConfigSelect, ConfigAlert } from './ConfigHelpers';

export function PerceptionConfig() {
  const [config, setConfig] = useState({
    // Computer Vision (20 functions)
    cv_enabled: true,
    object_detection: true,
    object_detection_model: 'YOLOv8',
    detection_confidence: 0.7,
    tracking_enabled: true,
    max_tracked_objects: 50,
    segmentation_enabled: true,
    depth_estimation: true,
    
    // LiDAR Processing (16 functions)
    lidar_enabled: true,
    point_cloud_filter: true,
    ground_removal: true,
    clustering_enabled: true,
    cluster_min_points: 10,
    cluster_max_distance: 0.5,
    voxel_size: 0.1,
    
    // Sensor Fusion (14 functions)
    fusion_enabled: true,
    fusion_method: 'KALMAN',
    camera_lidar_sync: true,
    temporal_alignment: 50,
    spatial_calibration: true,
    
    // Scene Understanding (14 functions)
    scene_classification: true,
    terrain_analysis: true,
    obstacle_mapping: true,
    semantic_mapping: true,
    dynamic_object_prediction: true,
    prediction_horizon: 2.0,
  });

  const updateConfig = (key: string, value: unknown) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-4">
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-cyan-400">Perception Module Configuration</h2>
            <p className="text-sm text-slate-400 mt-1">64 functions for environment sensing and AI vision</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-green-400 font-mono">ACTIVE</span>
          </div>
        </div>

        <Accordion type="multiple" className="space-y-2" defaultValue={['vision']}>
          
          {/* Computer Vision */}
          <AccordionItem value="vision" className="border border-slate-700 rounded-lg px-4">
            <AccordionTrigger className="text-cyan-400 hover:text-cyan-300">
              <span className="flex items-center gap-2">
                👁️ Computer Vision (20 functions)
              </span>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              
              <ConfigSwitch
                label="Computer Vision Enabled"
                description="Enable AI-powered visual processing"
                checked={config.cv_enabled}
                onCheckedChange={(val) => updateConfig('cv_enabled', val)}
              />

              <ConfigSection title="Object Detection" description="Detect and classify objects">
                <ConfigSwitch
                  label="Object Detection"
                  description="Enable real-time object detection"
                  checked={config.object_detection}
                  onCheckedChange={(val) => updateConfig('object_detection', val)}
                />

                <ConfigSelect
                  label="Detection Model"
                  description="Neural network model for detection"
                  value={config.object_detection_model}
                  options={['YOLOv8', 'YOLOv7', 'EfficientDet', 'SSD', 'Faster-RCNN']}
                  onChange={(val) => updateConfig('object_detection_model', val)}
                />

                <ConfigSlider
                  label="Detection Confidence"
                  description="Minimum confidence threshold"
                  value={config.detection_confidence}
                  min={0.3}
                  max={0.95}
                  step={0.05}
                  onChange={(val) => updateConfig('detection_confidence', val)}
                />
              </ConfigSection>

              <ConfigSection title="Object Tracking" description="Track objects across frames">
                <ConfigSwitch
                  label="Tracking Enabled"
                  description="Track detected objects over time"
                  checked={config.tracking_enabled}
                  onCheckedChange={(val) => updateConfig('tracking_enabled', val)}
                />

                <ConfigSlider
                  label="Max Tracked Objects"
                  description="Maximum simultaneous tracked objects"
                  value={config.max_tracked_objects}
                  min={10}
                  max={200}
                  step={10}
                  onChange={(val) => updateConfig('max_tracked_objects', val)}
                />
              </ConfigSection>

              <ConfigSwitch
                label="Semantic Segmentation"
                description="Pixel-level scene segmentation"
                checked={config.segmentation_enabled}
                onCheckedChange={(val) => updateConfig('segmentation_enabled', val)}
              />

              <ConfigSwitch
                label="Depth Estimation"
                description="Monocular depth estimation from RGB"
                checked={config.depth_estimation}
                onCheckedChange={(val) => updateConfig('depth_estimation', val)}
              />
            </AccordionContent>
          </AccordionItem>

          {/* LiDAR Processing */}
          <AccordionItem value="lidar" className="border border-slate-700 rounded-lg px-4">
            <AccordionTrigger className="text-cyan-400 hover:text-cyan-300">
              <span className="flex items-center gap-2">
                📡 LiDAR Processing (16 functions)
              </span>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              
              <ConfigSwitch
                label="LiDAR Processing"
                description="Enable point cloud processing"
                checked={config.lidar_enabled}
                onCheckedChange={(val) => updateConfig('lidar_enabled', val)}
              />

              <ConfigSwitch
                label="Point Cloud Filter"
                description="Remove noise and outliers"
                checked={config.point_cloud_filter}
                onCheckedChange={(val) => updateConfig('point_cloud_filter', val)}
              />

              <ConfigSwitch
                label="Ground Removal"
                description="Segment and remove ground plane"
                checked={config.ground_removal}
                onCheckedChange={(val) => updateConfig('ground_removal', val)}
              />

              <ConfigSection title="Clustering" description="Group points into objects">
                <ConfigSwitch
                  label="Clustering Enabled"
                  description="Enable point cloud clustering"
                  checked={config.clustering_enabled}
                  onCheckedChange={(val) => updateConfig('clustering_enabled', val)}
                />

                <ConfigSlider
                  label="Min Cluster Points"
                  description="Minimum points per cluster"
                  value={config.cluster_min_points}
                  min={5}
                  max={100}
                  step={5}
                  onChange={(val) => updateConfig('cluster_min_points', val)}
                />

                <ConfigSlider
                  label="Cluster Distance"
                  description="Max distance between cluster points (m)"
                  value={config.cluster_max_distance}
                  min={0.1}
                  max={2}
                  step={0.1}
                  unit="m"
                  onChange={(val) => updateConfig('cluster_max_distance', val)}
                />
              </ConfigSection>

              <ConfigSlider
                label="Voxel Size"
                description="Voxel grid downsampling size (m)"
                value={config.voxel_size}
                min={0.01}
                max={0.5}
                step={0.01}
                unit="m"
                onChange={(val) => updateConfig('voxel_size', val)}
              />
            </AccordionContent>
          </AccordionItem>

          {/* Sensor Fusion */}
          <AccordionItem value="fusion" className="border border-slate-700 rounded-lg px-4">
            <AccordionTrigger className="text-cyan-400 hover:text-cyan-300">
              <span className="flex items-center gap-2">
                🔀 Sensor Fusion (14 functions)
              </span>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              
              <ConfigAlert type="info">
                Sensor fusion combines camera and LiDAR for improved accuracy
              </ConfigAlert>

              <ConfigSwitch
                label="Sensor Fusion"
                description="Enable multi-sensor fusion"
                checked={config.fusion_enabled}
                onCheckedChange={(val) => updateConfig('fusion_enabled', val)}
              />

              <ConfigSelect
                label="Fusion Method"
                description="Algorithm for sensor fusion"
                value={config.fusion_method}
                options={['KALMAN', 'PARTICLE', 'BAYESIAN', 'NEURAL']}
                onChange={(val) => updateConfig('fusion_method', val)}
              />

              <ConfigSwitch
                label="Camera-LiDAR Sync"
                description="Hardware synchronization"
                checked={config.camera_lidar_sync}
                onCheckedChange={(val) => updateConfig('camera_lidar_sync', val)}
              />

              <ConfigSlider
                label="Temporal Alignment"
                description="Max time difference for fusion (ms)"
                value={config.temporal_alignment}
                min={10}
                max={200}
                step={10}
                unit="ms"
                onChange={(val) => updateConfig('temporal_alignment', val)}
              />

              <ConfigSwitch
                label="Spatial Calibration"
                description="Auto-calibrate sensor transforms"
                checked={config.spatial_calibration}
                onCheckedChange={(val) => updateConfig('spatial_calibration', val)}
              />
            </AccordionContent>
          </AccordionItem>

          {/* Scene Understanding */}
          <AccordionItem value="scene" className="border border-slate-700 rounded-lg px-4">
            <AccordionTrigger className="text-cyan-400 hover:text-cyan-300">
              <span className="flex items-center gap-2">
                🌍 Scene Understanding (14 functions)
              </span>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              
              <ConfigSwitch
                label="Scene Classification"
                description="Classify environment type"
                checked={config.scene_classification}
                onCheckedChange={(val) => updateConfig('scene_classification', val)}
              />

              <ConfigSwitch
                label="Terrain Analysis"
                description="Analyze ground traversability"
                checked={config.terrain_analysis}
                onCheckedChange={(val) => updateConfig('terrain_analysis', val)}
              />

              <ConfigSwitch
                label="Obstacle Mapping"
                description="Build obstacle occupancy grid"
                checked={config.obstacle_mapping}
                onCheckedChange={(val) => updateConfig('obstacle_mapping', val)}
              />

              <ConfigSwitch
                label="Semantic Mapping"
                description="Build semantic 3D map"
                checked={config.semantic_mapping}
                onCheckedChange={(val) => updateConfig('semantic_mapping', val)}
              />

              <ConfigSwitch
                label="Dynamic Object Prediction"
                description="Predict moving object trajectories"
                checked={config.dynamic_object_prediction}
                onCheckedChange={(val) => updateConfig('dynamic_object_prediction', val)}
              />

              <ConfigSlider
                label="Prediction Horizon"
                description="How far ahead to predict (seconds)"
                value={config.prediction_horizon}
                min={0.5}
                max={5}
                step={0.5}
                unit="s"
                onChange={(val) => updateConfig('prediction_horizon', val)}
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
            Save Perception Config
          </button>
        </div>
      </div>
    </div>
  );
}

export default PerceptionConfig;

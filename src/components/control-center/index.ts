/**
 * Control Center Module Exports
 * 12 modules - 722 total configurable parameters
 */

export { ControlCenter } from './ControlCenter';

// Module Configurations
export { NavigatorConfig } from './NavigatorConfig';       // 68 functions
export { SentinelConfig } from './SentinelConfig';         // 86 functions
export { BrainConfig } from './BrainConfig';               // 78 functions
export { CommunicationConfig } from './CommunicationConfig'; // 54 functions
export { DiagnosticsConfig } from './DiagnosticsConfig';   // 52 functions
export { PerceptionConfig } from './PerceptionConfig';     // 64 functions
export { MissionConfig } from './MissionConfig';           // 48 functions
export { CameraConfig } from './CameraConfig';             // 42 functions
export { PowerConfig } from './PowerConfig';               // 38 functions
export { ThermalConfig } from './ThermalConfig';           // 32 functions
export { SwarmConfig } from './SwarmConfig';               // 56 functions
export { PayloadConfig } from './PayloadConfig';           // 44 functions

// Intelligence & Communication
export { IntelligenceMonitor } from './IntelligenceMonitor';
export { ROS2Communication } from './ROS2Communication';
export { DecisionLogs } from './DecisionLogs';

// UI Helpers
export * from './ConfigHelpers';

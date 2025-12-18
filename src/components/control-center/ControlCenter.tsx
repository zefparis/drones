/**
 * CORTEX-U7 Control Center
 * Advanced Configuration & Intelligence Monitoring
 * 722 Parameters across 12 modules
 */

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Settings, 
  Brain, 
  Navigation, 
  Shield, 
  Radio,
  Activity,
  Zap,
  Eye,
  AlertTriangle,
  Cpu,
  Camera,
  Battery,
  Thermometer,
  Users,
  Home
} from 'lucide-react';
import { NavigatorConfig } from './NavigatorConfig';
import { SentinelConfig } from './SentinelConfig';
import { BrainConfig } from './BrainConfig';
import { CommunicationConfig } from './CommunicationConfig';
import { DiagnosticsConfig } from './DiagnosticsConfig';
import { IntelligenceMonitor } from './IntelligenceMonitor';
import { ROS2Communication } from './ROS2Communication';
import { DecisionLogs } from './DecisionLogs';

interface ControlCenterProps {
  onClose?: () => void;
}

export function ControlCenter({ onClose }: ControlCenterProps) {
  const [activeModule, setActiveModule] = useState('navigator');

  const modules = [
    { id: 'navigator', icon: <Navigation className="w-5 h-5" />, label: 'Navigator', count: '68 functions' },
    { id: 'sentinel', icon: <Shield className="w-5 h-5" />, label: 'Sentinel', count: '86 functions' },
    { id: 'brain', icon: <Brain className="w-5 h-5" />, label: 'Brain', count: '78 functions' },
    { id: 'communication', icon: <Radio className="w-5 h-5" />, label: 'Communication', count: '54 functions' },
    { id: 'diagnostics', icon: <AlertTriangle className="w-5 h-5" />, label: 'Diagnostics', count: '52 functions' },
    { id: 'perception', icon: <Eye className="w-5 h-5" />, label: 'Perception', count: '64 functions' },
    { id: 'mission', icon: <Zap className="w-5 h-5" />, label: 'Mission', count: '48 functions' },
    { id: 'camera', icon: <Camera className="w-5 h-5" />, label: 'Camera', count: '42 functions' },
    { id: 'power', icon: <Battery className="w-5 h-5" />, label: 'Power', count: '38 functions' },
    { id: 'thermal', icon: <Thermometer className="w-5 h-5" />, label: 'Thermal', count: '32 functions' },
    { id: 'swarm', icon: <Users className="w-5 h-5" />, label: 'Swarm', count: '56 functions' },
    { id: 'payload', icon: <Cpu className="w-5 h-5" />, label: 'Payload', count: '44 functions' },
  ];

  const totalFunctions = modules.reduce((acc, m) => acc + parseInt(m.count), 0);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-16 flex-shrink-0 border-b border-cyan-500/30 bg-slate-950/95 backdrop-blur px-6">
        <div className="h-full flex items-center justify-between">
          <div className="flex items-center gap-4">
            {onClose && (
              <button
                onClick={onClose}
                className="flex items-center gap-2 px-3 py-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <Home className="w-4 h-4" />
                <span className="text-sm">Accueil</span>
              </button>
            )}
            <div className="h-8 w-px bg-cyan-500/30" />
            <div>
              <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
                CORTEX-U7 Control Center
              </h1>
              <p className="text-xs text-slate-400">
                Advanced Configuration & Intelligence Monitoring • {totalFunctions} parameters
              </p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 border border-cyan-500/30 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors">
              <Settings className="w-4 h-4" />
              Save Config
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg text-white font-medium hover:from-cyan-400 hover:to-blue-500 transition-colors shadow-lg shadow-cyan-500/25">
              <Zap className="w-4 h-4" />
              Deploy to Drone
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="modules" className="h-full flex flex-col">
          <div className="px-6 pt-4 flex-shrink-0">
            <TabsList className="grid w-full grid-cols-4 bg-slate-900 h-12">
              <TabsTrigger value="modules" className="flex items-center gap-2">
                <Brain className="w-4 h-4" />
                Modules Config
              </TabsTrigger>
              <TabsTrigger value="intelligence" className="flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Intelligence Monitor
              </TabsTrigger>
              <TabsTrigger value="communication" className="flex items-center gap-2">
                <Radio className="w-4 h-4" />
                ROS2 Communication
              </TabsTrigger>
              <TabsTrigger value="logs" className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Decision Logs
              </TabsTrigger>
            </TabsList>
          </div>

          {/* TAB 1: MODULES CONFIG */}
          <TabsContent value="modules" className="flex-1 overflow-hidden px-6 pb-6">
            <div className="h-full grid grid-cols-5 gap-4 mt-4">
              
              {/* Left Sidebar: Module Selector */}
              <div className="space-y-1.5 overflow-auto pr-2">
                {modules.map((module) => (
                  <ModuleButton
                    key={module.id}
                    icon={module.icon}
                    label={module.label}
                    count={module.count}
                    active={activeModule === module.id}
                    onClick={() => setActiveModule(module.id)}
                  />
                ))}
              </div>

              {/* Right: Module Configuration */}
              <div className="col-span-4 overflow-auto">
                {activeModule === 'navigator' && <NavigatorConfig />}
                {activeModule === 'sentinel' && <SentinelConfig />}
                {activeModule === 'brain' && <BrainConfig />}
                {activeModule === 'communication' && <CommunicationConfig />}
                {activeModule === 'diagnostics' && <DiagnosticsConfig />}
                {activeModule === 'perception' && <PlaceholderConfig name="Perception" count={64} />}
                {activeModule === 'mission' && <PlaceholderConfig name="Mission" count={48} />}
                {activeModule === 'camera' && <PlaceholderConfig name="Camera" count={42} />}
                {activeModule === 'power' && <PlaceholderConfig name="Power" count={38} />}
                {activeModule === 'thermal' && <PlaceholderConfig name="Thermal" count={32} />}
                {activeModule === 'swarm' && <PlaceholderConfig name="Swarm" count={56} />}
                {activeModule === 'payload' && <PlaceholderConfig name="Payload" count={44} />}
              </div>
            </div>
          </TabsContent>

          {/* TAB 2: INTELLIGENCE MONITOR */}
          <TabsContent value="intelligence" className="flex-1 overflow-auto px-6 pb-6">
            <IntelligenceMonitor />
          </TabsContent>

          {/* TAB 3: ROS2 COMMUNICATION */}
          <TabsContent value="communication" className="flex-1 overflow-auto px-6 pb-6">
            <ROS2Communication />
          </TabsContent>

          {/* TAB 4: DECISION LOGS */}
          <TabsContent value="logs" className="flex-1 overflow-auto px-6 pb-6">
            <DecisionLogs />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Module Button Component
function ModuleButton({ 
  icon, 
  label, 
  count, 
  active, 
  onClick 
}: { 
  icon: React.ReactNode;
  label: string;
  count: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full p-3 rounded-lg border text-left transition-all
        ${active 
          ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' 
          : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600 hover:bg-slate-800/50'
        }
      `}
    >
      <div className="flex items-center gap-3">
        <div className={active ? 'text-cyan-400' : 'text-slate-500'}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm truncate">{label}</div>
          <div className="text-xs opacity-60">{count}</div>
        </div>
        {active && (
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse flex-shrink-0" />
        )}
      </div>
    </button>
  );
}

// Placeholder for modules not yet implemented
function PlaceholderConfig({ name, count }: { name: string; count: number }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
      <h2 className="text-xl font-bold text-cyan-400 mb-2">{name} Module</h2>
      <p className="text-slate-400 mb-6">{count} functions available for configuration</p>
      
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-8 text-center">
        <div className="text-4xl mb-4">🔧</div>
        <p className="text-slate-400">Configuration panel coming soon</p>
        <p className="text-xs text-slate-500 mt-2">
          This module contains {count} configurable parameters
        </p>
      </div>
    </div>
  );
}

export default ControlCenter;

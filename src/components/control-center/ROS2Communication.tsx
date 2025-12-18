/**
 * ROS2 Communication Panel
 * Service calls, topic publishing, and parameter management
 */

import { useState } from 'react';
import { Radio, Send, Download, Upload, RefreshCw, Terminal } from 'lucide-react';

interface ServiceResponse {
  success: boolean;
  message: string;
  data?: unknown;
  timestamp: string;
}

export function ROS2Communication() {
  const [response, setResponse] = useState<ServiceResponse | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [topicData, setTopicData] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('/cortex/command');

  // Simulate ROS2 service call
  const callService = async (serviceName: string, _description: string) => {
    setLoading(serviceName);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
    
    const success = Math.random() > 0.1;
    setResponse({
      success,
      message: success 
        ? `Service ${serviceName} executed successfully`
        : `Service ${serviceName} failed: timeout`,
      data: success ? {
        service: serviceName,
        executed_at: new Date().toISOString(),
        parameters: { duration: 10, mode: 'burst' },
      } : undefined,
      timestamp: new Date().toISOString(),
    });
    
    setLoading(null);
  };

  const publishTopic = async () => {
    if (!topicData.trim()) return;
    
    setLoading('publish');
    await new Promise(resolve => setTimeout(resolve, 300));
    
    setResponse({
      success: true,
      message: `Published to ${selectedTopic}`,
      data: { topic: selectedTopic, payload: topicData },
      timestamp: new Date().toISOString(),
    });
    
    setLoading(null);
    setTopicData('');
  };

  const services = [
    { name: '/cortex/navigator/activate_gps', label: 'Activate GPS', description: 'Force GPS activation for 10 seconds', icon: '📡' },
    { name: '/cortex/navigator/relocalize', label: 'Force Relocalize', description: 'Trigger SLAM loop closure', icon: '🎯' },
    { name: '/cortex/brain/emergency_rth', label: 'Emergency RTH', description: 'Return to home immediately', icon: '🏠' },
    { name: '/cortex/auth/scan_qr', label: 'Scan QR Mission', description: 'Trigger HCS-SHIELD QR scan', icon: '📱' },
    { name: '/cortex/sentinel/threat_scan', label: 'Threat Scan', description: 'Perform 360° threat scan', icon: '🛡️' },
    { name: '/cortex/brain/abort_mission', label: 'Abort Mission', description: 'Abort current mission safely', icon: '🛑' },
    { name: '/cortex/diagnostics/self_test', label: 'Run Self-Test', description: 'Execute full system diagnostics', icon: '🔧' },
    { name: '/cortex/communication/mesh_ping', label: 'Mesh Ping', description: 'Ping all mesh network nodes', icon: '🕸️' },
  ];

  const topics = [
    '/cortex/command',
    '/cortex/waypoint',
    '/cortex/mode',
    '/cortex/geofence',
    '/cortex/swarm/broadcast',
  ];

  return (
    <div className="grid grid-cols-2 gap-6 mt-4">
      
      {/* Left: Services */}
      <div className="space-y-4">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-cyan-400 mb-4 flex items-center gap-2">
            <Radio className="w-5 h-5" />
            ROS2 Services
          </h2>

          <div className="space-y-2">
            {services.map((service) => (
              <ServiceButton
                key={service.name}
                icon={service.icon}
                label={service.label}
                description={service.description}
                loading={loading === service.name}
                onClick={() => callService(service.name, service.description)}
              />
            ))}
          </div>
        </div>

        {/* Topic Publisher */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-cyan-400 mb-4 flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Publish to Topic
          </h3>

          <div className="space-y-3">
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200"
            >
              {topics.map((topic) => (
                <option key={topic} value={topic}>{topic}</option>
              ))}
            </select>

            <textarea
              value={topicData}
              onChange={(e) => setTopicData(e.target.value)}
              placeholder='{"command": "hover", "duration": 10}'
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 font-mono h-24 resize-none"
            />

            <button
              onClick={publishTopic}
              disabled={loading === 'publish' || !topicData.trim()}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg text-white font-medium hover:from-cyan-400 hover:to-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading === 'publish' ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Publish
            </button>
          </div>
        </div>
      </div>

      {/* Right: Response + Parameters */}
      <div className="space-y-4">
        
        {/* Service Response */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-cyan-400 mb-4 flex items-center gap-2">
            <Terminal className="w-4 h-4" />
            Service Response
          </h3>
          
          {response ? (
            <div className="space-y-3">
              <div className={`flex items-center gap-2 p-2 rounded ${
                response.success 
                  ? 'bg-green-500/10 text-green-400' 
                  : 'bg-red-500/10 text-red-400'
              }`}>
                <span>{response.success ? '✓' : '✗'}</span>
                <span className="text-sm">{response.message}</span>
              </div>
              
              <pre className="bg-slate-950 p-4 rounded-lg text-xs text-slate-300 font-mono overflow-auto max-h-[300px]">
                {JSON.stringify(response.data || {}, null, 2)}
              </pre>
              
              <div className="text-xs text-slate-500 text-right">
                {new Date(response.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <Terminal className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No response yet</p>
              <p className="text-xs">Call a service to see the response</p>
            </div>
          )}
        </div>

        {/* Active Subscriptions */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-cyan-400 mb-4 flex items-center gap-2">
            <Download className="w-4 h-4" />
            Active Subscriptions
          </h3>
          
          <div className="space-y-2">
            <SubscriptionItem topic="/cortex/telemetry" rate="10 Hz" active={true} />
            <SubscriptionItem topic="/cortex/state" rate="5 Hz" active={true} />
            <SubscriptionItem topic="/cortex/threats" rate="2 Hz" active={true} />
            <SubscriptionItem topic="/cortex/brain/decisions" rate="Event" active={true} />
            <SubscriptionItem topic="/cortex/diagnostics" rate="1 Hz" active={false} />
          </div>
        </div>

        {/* Parameter Server */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-cyan-400 mb-4">
            Parameter Server
          </h3>
          
          <div className="space-y-2 text-sm">
            <ParameterItem name="max_velocity" value="15.0" type="float" />
            <ParameterItem name="gps_enabled" value="false" type="bool" />
            <ParameterItem name="threat_level" value="CLEAR" type="string" />
            <ParameterItem name="battery_reserve" value="20" type="int" />
          </div>
        </div>
      </div>
    </div>
  );
}

function ServiceButton({ 
  icon, 
  label, 
  description, 
  loading, 
  onClick 
}: { 
  icon: string;
  label: string;
  description: string;
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="w-full p-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500/50 rounded-lg text-left transition-all group disabled:opacity-50"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <span className="text-xl">{icon}</span>
          <div className="flex-1">
            <div className="font-semibold text-slate-200 group-hover:text-cyan-400 transition-colors">
              {label}
            </div>
            <div className="text-xs text-slate-500 mt-1">{description}</div>
          </div>
        </div>
        {loading ? (
          <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin" />
        ) : (
          <Send className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 transition-colors" />
        )}
      </div>
    </button>
  );
}

function SubscriptionItem({ topic, rate, active }: { topic: string; rate: string; active: boolean }) {
  return (
    <div className="flex items-center justify-between p-2 bg-slate-800/30 rounded">
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${active ? 'bg-green-400 animate-pulse' : 'bg-slate-600'}`} />
        <span className="text-xs font-mono text-slate-300">{topic}</span>
      </div>
      <span className="text-xs text-slate-500">{rate}</span>
    </div>
  );
}

function ParameterItem({ name, value, type }: { name: string; value: string; type: string }) {
  return (
    <div className="flex items-center justify-between p-2 bg-slate-800/30 rounded">
      <span className="text-slate-400">{name}</span>
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-600">[{type}]</span>
        <span className="font-mono text-cyan-400">{value}</span>
      </div>
    </div>
  );
}

export default ROS2Communication;

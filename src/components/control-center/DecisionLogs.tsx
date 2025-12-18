/**
 * Decision Logs
 * Streaming logs from the CORTEX-U7 brain
 */

import { useEffect, useState, useRef } from 'react';
import { Terminal, Play, Pause, Trash2, Download, Filter } from 'lucide-react';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  module: string;
  message: string;
}

export function DecisionLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [streaming, setStreaming] = useState(true);
  const [filter, setFilter] = useState<string>('ALL');
  const [moduleFilter, setModuleFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Simulate streaming logs
  useEffect(() => {
    if (!streaming) return;

    // Modules and levels used for random log generation
    void ['NAVIGATOR', 'SENTINEL', 'BRAIN', 'COMMUNICATION', 'DIAGNOSTICS'];
    
    const logMessages = [
      { module: 'NAVIGATOR', level: 'INFO', message: 'VIO tracking initialized - 245 features detected' },
      { module: 'NAVIGATOR', level: 'DEBUG', message: 'EKF state updated: position=[48.8566, 2.3522, 35.2]' },
      { module: 'NAVIGATOR', level: 'WARNING', message: 'GPS signal degraded - switching to VIO-only mode' },
      { module: 'SENTINEL', level: 'INFO', message: 'Threat scan completed - area clear' },
      { module: 'SENTINEL', level: 'WARNING', message: 'RF emission detected at 2.4GHz - analyzing signature' },
      { module: 'BRAIN', level: 'INFO', message: 'Decision: CONTINUE_MISSION (confidence: 0.92)' },
      { module: 'BRAIN', level: 'DEBUG', message: 'State transition: NAVIGATE -> HOVER' },
      { module: 'BRAIN', level: 'INFO', message: 'Waypoint WP-003 reached (error: 0.3m)' },
      { module: 'COMMUNICATION', level: 'INFO', message: 'Telemetry packet sent (seq: 1847)' },
      { module: 'COMMUNICATION', level: 'DEBUG', message: 'Mesh network: 3 nodes connected' },
      { module: 'DIAGNOSTICS', level: 'INFO', message: 'System health: ALL GREEN' },
      { module: 'DIAGNOSTICS', level: 'WARNING', message: 'Motor 2 temperature elevated: 68°C' },
      { module: 'NAVIGATOR', level: 'INFO', message: 'Celestial fix acquired: 4 stars locked' },
      { module: 'SENTINEL', level: 'ERROR', message: 'LiDAR data invalid - sensor check required' },
      { module: 'BRAIN', level: 'CRITICAL', message: 'Emergency RTH triggered - battery critical (18%)' },
    ];

    const interval = setInterval(() => {
      const randomLog = logMessages[Math.floor(Math.random() * logMessages.length)];
      const newLog: LogEntry = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString(),
        level: randomLog.level as LogEntry['level'],
        module: randomLog.module,
        message: randomLog.message,
      };

      setLogs(prev => [...prev, newLog].slice(-500)); // Keep last 500 logs
    }, 800);

    return () => clearInterval(interval);
  }, [streaming]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (streaming) {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, streaming]);

  const filteredLogs = logs.filter(log => {
    if (filter !== 'ALL' && log.level !== filter) return false;
    if (moduleFilter !== 'ALL' && log.module !== moduleFilter) return false;
    if (searchTerm && !log.message.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const clearLogs = () => setLogs([]);

  const downloadLogs = () => {
    const content = filteredLogs.map(log => 
      `[${log.timestamp}] [${log.level}] [${log.module}] ${log.message}`
    ).join('\n');
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cortex-logs-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const levelColors: Record<string, string> = {
    DEBUG: 'text-slate-500',
    INFO: 'text-cyan-400',
    WARNING: 'text-amber-400',
    ERROR: 'text-red-400',
    CRITICAL: 'text-red-500 font-bold animate-pulse',
  };

  const moduleColors: Record<string, string> = {
    NAVIGATOR: 'text-blue-400',
    SENTINEL: 'text-orange-400',
    BRAIN: 'text-purple-400',
    COMMUNICATION: 'text-green-400',
    DIAGNOSTICS: 'text-yellow-400',
  };

  return (
    <div className="mt-4 space-y-4">
      
      {/* Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setStreaming(!streaming)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                streaming 
                  ? 'bg-red-500/20 text-red-400 border border-red-500/50' 
                  : 'bg-green-500/20 text-green-400 border border-green-500/50'
              }`}
            >
              {streaming ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {streaming ? 'Pause' : 'Resume'}
            </button>

            <button
              onClick={clearLogs}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-700 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Clear
            </button>

            <button
              onClick={downloadLogs}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-500" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="bg-slate-800 border border-slate-600 rounded px-3 py-1.5 text-sm text-slate-200"
              >
                <option value="ALL">All Levels</option>
                <option value="DEBUG">DEBUG</option>
                <option value="INFO">INFO</option>
                <option value="WARNING">WARNING</option>
                <option value="ERROR">ERROR</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>
            </div>

            <select
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              className="bg-slate-800 border border-slate-600 rounded px-3 py-1.5 text-sm text-slate-200"
            >
              <option value="ALL">All Modules</option>
              <option value="NAVIGATOR">NAVIGATOR</option>
              <option value="SENTINEL">SENTINEL</option>
              <option value="BRAIN">BRAIN</option>
              <option value="COMMUNICATION">COMMUNICATION</option>
              <option value="DIAGNOSTICS">DIAGNOSTICS</option>
            </select>

            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search logs..."
              className="bg-slate-800 border border-slate-600 rounded px-3 py-1.5 text-sm text-slate-200 w-48"
            />
          </div>
        </div>
      </div>

      {/* Log Output */}
      <div className="bg-slate-950 border border-slate-800 rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-medium text-slate-200">CORTEX-U7 Brain Output</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span>{filteredLogs.length} entries</span>
            {streaming && (
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Live
              </span>
            )}
          </div>
        </div>

        <div className="h-[500px] overflow-auto p-4 font-mono text-xs leading-relaxed">
          {filteredLogs.map((log) => (
            <div key={log.id} className="flex gap-2 hover:bg-slate-900/50 px-2 py-0.5 rounded">
              <span className="text-slate-600 shrink-0">
                {new Date(log.timestamp).toLocaleTimeString('en-US', { 
                  hour12: false, 
                  hour: '2-digit', 
                  minute: '2-digit', 
                  second: '2-digit',
                  fractionalSecondDigits: 3 
                })}
              </span>
              <span className={`shrink-0 w-16 ${levelColors[log.level]}`}>
                [{log.level}]
              </span>
              <span className={`shrink-0 w-28 ${moduleColors[log.module]}`}>
                [{log.module}]
              </span>
              <span className="text-slate-300">{log.message}</span>
            </div>
          ))}
          
          {filteredLogs.length === 0 && (
            <div className="flex items-center justify-center h-full text-slate-500">
              <div className="text-center">
                <Terminal className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No logs matching filters</p>
              </div>
            </div>
          )}
          
          <div ref={logsEndRef} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4">
        <LogStatCard label="DEBUG" count={logs.filter(l => l.level === 'DEBUG').length} color="slate" />
        <LogStatCard label="INFO" count={logs.filter(l => l.level === 'INFO').length} color="cyan" />
        <LogStatCard label="WARNING" count={logs.filter(l => l.level === 'WARNING').length} color="amber" />
        <LogStatCard label="ERROR" count={logs.filter(l => l.level === 'ERROR').length} color="red" />
        <LogStatCard label="CRITICAL" count={logs.filter(l => l.level === 'CRITICAL').length} color="red" />
      </div>
    </div>
  );
}

function LogStatCard({ label, count, color }: { label: string; count: number; color: string }) {
  const colorClasses: Record<string, string> = {
    slate: 'bg-slate-500/10 border-slate-500/30 text-slate-400',
    cyan: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400',
    amber: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    red: 'bg-red-500/10 border-red-500/30 text-red-400',
  };

  return (
    <div className={`border rounded-lg p-4 ${colorClasses[color]}`}>
      <div className="text-2xl font-bold font-mono">{count}</div>
      <div className="text-xs opacity-70">{label}</div>
    </div>
  );
}

export default DecisionLogs;

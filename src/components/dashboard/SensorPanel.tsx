/**
 * Sensor Panel - Real-time Sensor Status Display
 * Military-style sensor monitoring with live indicators
 */

interface SensorPanelProps {
  sensors?: {
    gps_enabled?: boolean;
    lidar_active?: boolean;
    camera_active?: boolean;
    imu_status?: 'OK' | 'WARN' | 'FAIL';
    barometer?: number;
    magnetometer?: { x: number; y: number; z: number };
    motors?: boolean[];
    temperature?: number;
    cpu_usage?: number;
    memory_usage?: number;
  };
}

export function SensorPanel({ sensors = {} }: SensorPanelProps) {
  const sensorList: Array<{ id: string; name: string; icon: string; status: string; level: 'ok' | 'warn' | 'error' | 'idle' }> = [
    {
      id: 'gps',
      name: 'GPS',
      icon: '📡',
      status: sensors.gps_enabled ? 'ACTIVE' : 'DISABLED',
      level: sensors.gps_enabled ? 'ok' : 'warn',
    },
    {
      id: 'lidar',
      name: 'LiDAR',
      icon: '🔦',
      status: sensors.lidar_active ? 'SCANNING' : 'STANDBY',
      level: sensors.lidar_active ? 'ok' : 'idle',
    },
    {
      id: 'camera',
      name: 'OAK-D',
      icon: '📷',
      status: sensors.camera_active ? 'STREAMING' : 'STANDBY',
      level: sensors.camera_active ? 'ok' : 'idle',
    },
    {
      id: 'imu',
      name: 'IMU',
      icon: '🧭',
      status: sensors.imu_status || 'OK',
      level: sensors.imu_status === 'FAIL' ? 'error' : sensors.imu_status === 'WARN' ? 'warn' : 'ok',
    },
    {
      id: 'baro',
      name: 'BARO',
      icon: '📊',
      status: sensors.barometer ? `${sensors.barometer.toFixed(0)} hPa` : 'N/A',
      level: sensors.barometer ? 'ok' : 'idle',
    },
  ];

  const motorStatus = sensors.motors || [true, true, true, true];
  const allMotorsOk = motorStatus.every((m) => m);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-cyan-400 tracking-wider">SENSORS</h3>
        <StatusBadge status={allMotorsOk ? 'NOMINAL' : 'DEGRADED'} level={allMotorsOk ? 'ok' : 'warn'} />
      </div>

      {/* Sensor List */}
      <div className="flex-1 space-y-2">
        {sensorList.map((sensor) => (
          <SensorRow key={sensor.id} {...sensor} />
        ))}
      </div>

      {/* Motor Status */}
      <div className="mt-3 pt-3 border-t border-slate-800">
        <div className="text-xs text-slate-500 mb-2">MOTORS</div>
        <div className="flex justify-center gap-4">
          {motorStatus.map((ok, i) => (
            <div key={i} className="flex flex-col items-center">
              <div
                className={`w-4 h-4 rounded-full ${
                  ok ? 'bg-green-500 shadow-lg shadow-green-500/50' : 'bg-red-500 animate-pulse shadow-lg shadow-red-500/50'
                }`}
              />
              <span className="text-xs text-slate-500 mt-1">M{i + 1}</span>
            </div>
          ))}
        </div>
      </div>

      {/* System Resources */}
      {(sensors.cpu_usage !== undefined || sensors.memory_usage !== undefined) && (
        <div className="mt-3 pt-3 border-t border-slate-800">
          <div className="text-xs text-slate-500 mb-2">SYSTEM</div>
          <div className="grid grid-cols-2 gap-2">
            {sensors.cpu_usage !== undefined && (
              <ResourceBar label="CPU" value={sensors.cpu_usage} />
            )}
            {sensors.memory_usage !== undefined && (
              <ResourceBar label="MEM" value={sensors.memory_usage} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SensorRow({
  name,
  icon,
  status,
  level,
}: {
  name: string;
  icon: string;
  status: string;
  level: 'ok' | 'warn' | 'error' | 'idle';
}) {
  const levelColors = {
    ok: 'text-green-400 bg-green-500/20',
    warn: 'text-amber-400 bg-amber-500/20',
    error: 'text-red-400 bg-red-500/20',
    idle: 'text-slate-400 bg-slate-500/20',
  };

  const dotColors = {
    ok: 'bg-green-500',
    warn: 'bg-amber-500 animate-pulse',
    error: 'bg-red-500 animate-pulse',
    idle: 'bg-slate-500',
  };

  return (
    <div className="flex items-center justify-between p-2 rounded bg-slate-800/50">
      <div className="flex items-center gap-2">
        <span className="text-lg">{icon}</span>
        <span className="text-sm font-mono text-slate-300">{name}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className={`text-xs font-mono px-2 py-0.5 rounded ${levelColors[level]}`}>{status}</span>
        <div className={`w-2 h-2 rounded-full ${dotColors[level]}`} />
      </div>
    </div>
  );
}

function StatusBadge({ status, level }: { status: string; level: 'ok' | 'warn' | 'error' }) {
  const colors = {
    ok: 'bg-green-500/20 text-green-400 border-green-500/50',
    warn: 'bg-amber-500/20 text-amber-400 border-amber-500/50',
    error: 'bg-red-500/20 text-red-400 border-red-500/50',
  };

  return (
    <span className={`text-xs font-mono px-2 py-0.5 rounded border ${colors[level]}`}>
      {status}
    </span>
  );
}

function ResourceBar({ label, value }: { label: string; value: number }) {
  const getColor = () => {
    if (value > 80) return 'bg-red-500';
    if (value > 60) return 'bg-amber-500';
    return 'bg-cyan-500';
  };

  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-slate-500">{label}</span>
        <span className="text-slate-400 font-mono">{value.toFixed(0)}%</span>
      </div>
      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${getColor()}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

export default SensorPanel;

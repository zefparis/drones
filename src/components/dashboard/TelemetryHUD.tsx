/**
 * Telemetry HUD - Military Style Head-Up Display
 * Real-time drone telemetry with animated gauges
 */

import { useEffect, useState } from 'react';

interface TelemetryHUDProps {
  altitude?: number;
  speed?: number;
  heading?: number;
  battery?: { percentage: number; voltage: number; current: number };
  temperature?: number;
  satellites?: number;
  signalStrength?: number;
  flightTime?: number;
}

export function TelemetryHUD({
  altitude = 0,
  speed = 0,
  heading = 0,
  battery = { percentage: 100, voltage: 12.6, current: 0 },
  temperature = 25,
  satellites = 0,
  signalStrength = 100,
  flightTime = 0,
}: TelemetryHUDProps) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatFlightTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-full flex items-center justify-between gap-4">
      {/* Left Section - Primary Flight Data */}
      <div className="flex items-center gap-6">
        {/* Altitude */}
        <TelemetryGauge
          label="ALT"
          value={altitude}
          unit="m"
          min={0}
          max={500}
          precision={1}
          color="cyan"
          icon="↕"
        />

        {/* Speed */}
        <TelemetryGauge
          label="SPD"
          value={speed}
          unit="m/s"
          min={0}
          max={30}
          precision={1}
          color="green"
          icon="→"
        />

        {/* Heading */}
        <HeadingIndicator heading={heading} />
      </div>

      {/* Center Section - Status */}
      <div className="flex items-center gap-6">
        {/* Battery */}
        <BatteryIndicator battery={battery} />

        {/* GPS */}
        <div className="flex flex-col items-center">
          <div className="text-xs text-slate-500 font-mono mb-1">GPS</div>
          <div className="flex items-center gap-1">
            <SatelliteIcon active={satellites > 0} />
            <span className={`text-lg font-bold font-mono ${satellites >= 6 ? 'text-green-400' : satellites >= 4 ? 'text-amber-400' : 'text-red-400'}`}>
              {satellites}
            </span>
          </div>
          <div className="text-xs text-slate-600">{satellites >= 6 ? '3D FIX' : satellites >= 4 ? '2D FIX' : 'NO FIX'}</div>
        </div>

        {/* Signal */}
        <SignalIndicator strength={signalStrength} />
      </div>

      {/* Right Section - Secondary Data */}
      <div className="flex items-center gap-6">
        {/* Temperature */}
        <div className="flex flex-col items-center">
          <div className="text-xs text-slate-500 font-mono mb-1">TEMP</div>
          <span className={`text-lg font-bold font-mono ${temperature > 60 ? 'text-red-400' : temperature > 40 ? 'text-amber-400' : 'text-cyan-400'}`}>
            {temperature.toFixed(0)}°C
          </span>
        </div>

        {/* Flight Time */}
        <div className="flex flex-col items-center">
          <div className="text-xs text-slate-500 font-mono mb-1">FLT TIME</div>
          <span className="text-lg font-bold font-mono text-cyan-400">{formatFlightTime(flightTime)}</span>
        </div>

        {/* System Time */}
        <div className="flex flex-col items-center">
          <div className="text-xs text-slate-500 font-mono mb-1">UTC</div>
          <span className="text-lg font-bold font-mono text-slate-300">
            {time.toISOString().slice(11, 19)}
          </span>
        </div>
      </div>
    </div>
  );
}

function TelemetryGauge({
  label,
  value,
  unit,
  min,
  max,
  precision,
  color,
  icon,
}: {
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  precision: number;
  color: string;
  icon: string;
}) {
  const percentage = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
  const colorClasses = {
    cyan: 'text-cyan-400 bg-cyan-400',
    green: 'text-green-400 bg-green-400',
    amber: 'text-amber-400 bg-amber-400',
    red: 'text-red-400 bg-red-400',
  };

  return (
    <div className="flex flex-col items-center min-w-[80px]">
      <div className="text-xs text-slate-500 font-mono mb-1 flex items-center gap-1">
        <span>{icon}</span>
        <span>{label}</span>
      </div>
      <span className={`text-2xl font-bold font-mono ${colorClasses[color as keyof typeof colorClasses]?.split(' ')[0] || 'text-cyan-400'}`}>
        {value.toFixed(precision)}
      </span>
      <span className="text-xs text-slate-500">{unit}</span>
      <div className="w-full h-1 bg-slate-800 rounded-full mt-1 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${colorClasses[color as keyof typeof colorClasses]?.split(' ')[1] || 'bg-cyan-400'}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function HeadingIndicator({ heading }: { heading: number }) {
  const cardinals = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const cardinalIndex = Math.round(heading / 45) % 8;

  return (
    <div className="flex flex-col items-center min-w-[80px]">
      <div className="text-xs text-slate-500 font-mono mb-1">HDG</div>
      <div className="relative w-16 h-16">
        {/* Compass Ring */}
        <svg viewBox="0 0 64 64" className="w-full h-full">
          <circle cx="32" cy="32" r="28" fill="none" stroke="#1e293b" strokeWidth="2" />
          <circle cx="32" cy="32" r="24" fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="2 4" />
          
          {/* Cardinal Marks */}
          {[0, 90, 180, 270].map((angle) => (
            <line
              key={angle}
              x1="32"
              y1="6"
              x2="32"
              y2="10"
              stroke={angle === 0 ? '#ef4444' : '#64748b'}
              strokeWidth="2"
              transform={`rotate(${angle} 32 32)`}
            />
          ))}

          {/* Heading Arrow */}
          <g transform={`rotate(${heading} 32 32)`}>
            <polygon points="32,8 28,20 32,16 36,20" fill="#06b6d4" />
          </g>
        </svg>

        {/* Center Value */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold font-mono text-cyan-400">{heading.toFixed(0)}°</span>
        </div>
      </div>
      <span className="text-xs text-slate-400 font-mono">{cardinals[cardinalIndex]}</span>
    </div>
  );
}

function BatteryIndicator({ battery }: { battery: { percentage: number; voltage: number; current: number } }) {
  const getColor = () => {
    if (battery.percentage > 50) return 'text-green-400';
    if (battery.percentage > 20) return 'text-amber-400';
    return 'text-red-400 animate-pulse';
  };

  const getBgColor = () => {
    if (battery.percentage > 50) return 'bg-green-400';
    if (battery.percentage > 20) return 'bg-amber-400';
    return 'bg-red-400';
  };

  return (
    <div className="flex flex-col items-center">
      <div className="text-xs text-slate-500 font-mono mb-1">BATT</div>
      <div className="relative">
        {/* Battery Shape */}
        <div className="w-12 h-6 border-2 border-slate-600 rounded-sm relative">
          <div className="absolute right-[-4px] top-1/2 -translate-y-1/2 w-1 h-3 bg-slate-600 rounded-r-sm" />
          <div
            className={`h-full rounded-sm transition-all duration-300 ${getBgColor()}`}
            style={{ width: `${battery.percentage}%` }}
          />
        </div>
      </div>
      <span className={`text-lg font-bold font-mono ${getColor()}`}>{battery.percentage.toFixed(0)}%</span>
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <span>{battery.voltage.toFixed(1)}V</span>
        <span>{battery.current.toFixed(1)}A</span>
      </div>
    </div>
  );
}

function SignalIndicator({ strength }: { strength: number }) {
  const bars = 5;
  const activeBars = Math.ceil((strength / 100) * bars);

  return (
    <div className="flex flex-col items-center">
      <div className="text-xs text-slate-500 font-mono mb-1">LINK</div>
      <div className="flex items-end gap-0.5 h-6">
        {Array.from({ length: bars }).map((_, i) => (
          <div
            key={i}
            className={`w-1.5 rounded-sm transition-colors ${
              i < activeBars
                ? strength > 60
                  ? 'bg-green-400'
                  : strength > 30
                  ? 'bg-amber-400'
                  : 'bg-red-400'
                : 'bg-slate-700'
            }`}
            style={{ height: `${((i + 1) / bars) * 100}%` }}
          />
        ))}
      </div>
      <span className={`text-xs font-mono ${strength > 60 ? 'text-green-400' : strength > 30 ? 'text-amber-400' : 'text-red-400'}`}>
        {strength}%
      </span>
    </div>
  );
}

function SatelliteIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={`w-4 h-4 ${active ? 'text-green-400' : 'text-slate-600'}`} fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
    </svg>
  );
}

export default TelemetryHUD;

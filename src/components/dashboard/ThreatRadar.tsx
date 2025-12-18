/**
 * Threat Radar - Military Style Canvas Animation
 * Rotating sweep with threat detection visualization
 */

import { useEffect, useRef } from 'react';

interface Threat {
  id: string;
  bearing: number;
  distance: number;
  level: 'HIGH' | 'MEDIUM' | 'LOW';
  type: string;
}

interface ThreatRadarProps {
  threats: Threat[];
  range?: number;
}

export function ThreatRadar({ threats = [], range = 1000 }: ThreatRadarProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // High DPI support
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    let rotation = 0;

    function animate() {
      if (!ctx || !canvas) return;

      const width = rect.width;
      const height = rect.height;
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(centerX, centerY) - 10;

      // Clear with fade effect
      ctx.fillStyle = 'rgba(15, 23, 42, 0.15)';
      ctx.fillRect(0, 0, width, height);

      // Draw concentric circles
      ctx.strokeStyle = '#1e3a5f';
      ctx.lineWidth = 1;
      for (let i = 1; i <= 4; i++) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, (radius / 4) * i, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Draw cardinal lines
      ctx.strokeStyle = '#1e3a5f';
      ctx.beginPath();
      ctx.moveTo(centerX, centerY - radius);
      ctx.lineTo(centerX, centerY + radius);
      ctx.moveTo(centerX - radius, centerY);
      ctx.lineTo(centerX + radius, centerY);
      ctx.stroke();

      // Draw diagonal lines
      ctx.strokeStyle = '#0f2744';
      const diag = radius * 0.707;
      ctx.beginPath();
      ctx.moveTo(centerX - diag, centerY - diag);
      ctx.lineTo(centerX + diag, centerY + diag);
      ctx.moveTo(centerX + diag, centerY - diag);
      ctx.lineTo(centerX - diag, centerY + diag);
      ctx.stroke();

      // Rotating sweep
      rotation += 0.015;
      const sweepGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
      sweepGradient.addColorStop(0, 'rgba(6, 182, 212, 0.6)');
      sweepGradient.addColorStop(0.5, 'rgba(6, 182, 212, 0.2)');
      sweepGradient.addColorStop(1, 'rgba(6, 182, 212, 0)');

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(rotation);
      ctx.fillStyle = sweepGradient;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, -Math.PI / 6, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Draw sweep line
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(rotation);
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(radius, 0);
      ctx.stroke();
      ctx.restore();

      // Draw threats
      threats.forEach((threat) => {
        const angle = ((threat.bearing - 90) * Math.PI) / 180;
        const normalizedDistance = Math.min(threat.distance / range, 1);
        const dist = normalizedDistance * radius;

        const x = centerX + Math.cos(angle) * dist;
        const y = centerY + Math.sin(angle) * dist;

        // Threat color based on level
        const colors = {
          HIGH: '#ef4444',
          MEDIUM: '#f59e0b',
          LOW: '#22c55e',
        };
        const color = colors[threat.level] || colors.LOW;

        // Glow effect
        const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, 15);
        glowGradient.addColorStop(0, color);
        glowGradient.addColorStop(1, 'transparent');
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(x, y, 15, 0, Math.PI * 2);
        ctx.fill();

        // Threat dot
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();

        // Pulse ring for HIGH threats
        if (threat.level === 'HIGH') {
          const pulseSize = 8 + Math.sin(Date.now() / 150) * 4;
          ctx.strokeStyle = color;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(x, y, pulseSize, 0, Math.PI * 2);
          ctx.stroke();
        }
      });

      // Center dot
      ctx.fillStyle = '#06b6d4';
      ctx.beginPath();
      ctx.arc(centerX, centerY, 4, 0, Math.PI * 2);
      ctx.fill();

      // Cardinal labels
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('N', centerX, centerY - radius + 12);
      ctx.fillText('S', centerX, centerY + radius - 12);
      ctx.fillText('E', centerX + radius - 12, centerY);
      ctx.fillText('W', centerX - radius + 12, centerY);

      // Range labels
      ctx.fillStyle = '#475569';
      ctx.font = '8px monospace';
      for (let i = 1; i <= 4; i++) {
        const rangeValue = Math.round((range / 4) * i);
        ctx.fillText(`${rangeValue}m`, centerX + 5, centerY - (radius / 4) * i + 3);
      }

      animationRef.current = requestAnimationFrame(animate);
    }

    animate();

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [threats, range]);

  return (
    <div className="relative h-full flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-bold text-cyan-400 tracking-wider">THREAT RADAR</h3>
        <span className="text-xs text-slate-500 font-mono">{range}m</span>
      </div>

      <div className="flex-1 relative">
        <canvas ref={canvasRef} className="w-full h-full rounded-lg bg-slate-950" style={{ aspectRatio: '1' }} />

        {/* Threat Count Overlay */}
        {threats.length > 0 && (
          <div className="absolute top-2 right-2 bg-red-500/20 border border-red-500/50 rounded px-2 py-1">
            <span className="text-red-400 text-xs font-bold">{threats.length} THREATS</span>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-2 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <span className="text-slate-400">HIGH</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-amber-500" />
          <span className="text-slate-400">MED</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-slate-400">LOW</span>
        </div>
      </div>
    </div>
  );
}

export default ThreatRadar;

/**
 * FPV Stream - First Person View Video Display
 * Simulated drone camera feed with HUD overlay
 */

import { useEffect, useRef, useState } from 'react';

interface FPVStreamProps {
  connected?: boolean;
  streamUrl?: string;
}

export function FPVStream({ connected = false, streamUrl }: FPVStreamProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [recording, setRecording] = useState(false);

  // Simulate video static/noise when not connected
  useEffect(() => {
    if (connected || streamUrl) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrame: number;

    function drawNoise() {
      if (!ctx || !canvas) return;

      const imageData = ctx.createImageData(canvas.width, canvas.height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const noise = Math.random() * 50;
        data[i] = noise;
        data[i + 1] = noise;
        data[i + 2] = noise + 10;
        data[i + 3] = 255;
      }

      ctx.putImageData(imageData, 0, 0);

      // Add scanlines
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      for (let y = 0; y < canvas.height; y += 4) {
        ctx.fillRect(0, y, canvas.width, 2);
      }

      animationFrame = requestAnimationFrame(drawNoise);
    }

    drawNoise();

    return () => cancelAnimationFrame(animationFrame);
  }, [connected, streamUrl]);

  return (
    <div className="h-full flex flex-col bg-black relative">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-2 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-red-500 animate-pulse' : 'bg-slate-500'}`} />
          <span className="text-xs font-mono text-slate-300">FPV CAM</span>
        </div>
        <div className="flex items-center gap-2">
          {recording && (
            <div className="flex items-center gap-1 bg-red-500/20 px-2 py-0.5 rounded">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs text-red-400 font-mono">REC</span>
            </div>
          )}
          <span className="text-xs text-slate-500 font-mono">1080p</span>
        </div>
      </div>

      {/* Video Area */}
      <div className="flex-1 relative">
        {streamUrl ? (
          <video
            src={streamUrl}
            autoPlay
            muted
            loop
            className="w-full h-full object-cover"
          />
        ) : (
          <canvas
            ref={canvasRef}
            width={320}
            height={240}
            className="w-full h-full object-cover"
          />
        )}

        {/* HUD Overlay */}
        {connected && (
          <div className="absolute inset-0 pointer-events-none">
            {/* Crosshair */}
            <div className="absolute inset-0 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-24 h-24 text-cyan-400/50">
                <circle cx="50" cy="50" r="20" fill="none" stroke="currentColor" strokeWidth="1" />
                <line x1="50" y1="20" x2="50" y2="35" stroke="currentColor" strokeWidth="1" />
                <line x1="50" y1="65" x2="50" y2="80" stroke="currentColor" strokeWidth="1" />
                <line x1="20" y1="50" x2="35" y2="50" stroke="currentColor" strokeWidth="1" />
                <line x1="65" y1="50" x2="80" y2="50" stroke="currentColor" strokeWidth="1" />
                <circle cx="50" cy="50" r="3" fill="currentColor" />
              </svg>
            </div>

            {/* Corner Brackets */}
            <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-cyan-400/50" />
            <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-cyan-400/50" />
            <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-cyan-400/50" />
            <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-cyan-400/50" />

            {/* Horizon Line */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-32">
              <div className="h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
            </div>
          </div>
        )}

        {/* No Signal Overlay */}
        {!connected && !streamUrl && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50">
            <svg viewBox="0 0 24 24" className="w-12 h-12 text-slate-500 mb-2" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18.364 5.636a9 9 0 010 12.728M5.636 18.364a9 9 0 010-12.728" />
              <path d="M15.536 8.464a5 5 0 010 7.072M8.464 15.536a5 5 0 010-7.072" />
              <circle cx="12" cy="12" r="2" />
            </svg>
            <span className="text-slate-500 text-sm font-mono">NO SIGNAL</span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-center gap-2 p-2 bg-gradient-to-t from-black/80 to-transparent">
        <button
          onClick={() => setRecording(!recording)}
          className={`p-2 rounded-full transition-colors ${
            recording ? 'bg-red-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
          }`}
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
            {recording ? (
              <rect x="6" y="6" width="12" height="12" rx="2" />
            ) : (
              <circle cx="12" cy="12" r="6" />
            )}
          </svg>
        </button>
        <button className="p-2 rounded-full bg-slate-800 text-slate-400 hover:bg-slate-700 transition-colors">
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M21 15l-5-5L5 21" />
          </svg>
        </button>
        <button className="p-2 rounded-full bg-slate-800 text-slate-400 hover:bg-slate-700 transition-colors">
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default FPVStream;

/**
 * QR Code Display - Ephemeral Mission QR with countdown
 */

import { useState, useEffect, useCallback } from 'react';
import QRCode from 'qrcode';
import { Shield, Clock, AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';
import type { MissionData } from './MissionPlanner';

interface QRCodeDisplayProps {
  data: string;
  mission: MissionData;
  expiresIn: number; // seconds
  onExpired?: () => void;
  onDestroy?: () => void;
}

export function QRCodeDisplay({ 
  data, 
  mission, 
  expiresIn, 
  onExpired,
  onDestroy 
}: QRCodeDisplayProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState(expiresIn);
  const [isExpired, setIsExpired] = useState(false);
  const [showDestroy, setShowDestroy] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Generate QR code - BLACK/WHITE for maximum scanner compatibility
  useEffect(() => {
    QRCode.toDataURL(data, {
      width: 600,
      margin: 4,
      errorCorrectionLevel: 'H',  // High error correction for drone camera
      color: {
        dark: '#000000',    // BLACK (not cyan)
        light: '#FFFFFF'    // WHITE (not slate)
      }
    }).then(setQrDataUrl).catch(console.error);
  }, [data]);

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) {
      setIsExpired(true);
      onExpired?.();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsExpired(true);
          onExpired?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onExpired]);

  const handleDestroy = useCallback(() => {
    if (!showDestroy) {
      setShowDestroy(true);
      return;
    }
    onDestroy?.();
  }, [showDestroy, onDestroy]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const getTimeColor = () => {
    if (timeLeft < 60) return 'text-red-400';
    if (timeLeft < 300) return 'text-yellow-400';
    return 'text-cyan-400';
  };

  const getProgressWidth = () => {
    return `${(timeLeft / expiresIn) * 100}%`;
  };

  if (isExpired) {
    return (
      <div className="bg-slate-900 rounded-xl p-8 text-center">
        <div className="text-6xl mb-4">⏱️</div>
        <h2 className="text-2xl font-bold text-red-400 mb-4">QR Code Expired</h2>
        <p className="text-slate-400 mb-6">
          This mission QR has expired for security reasons.
          Generate a new one to continue.
        </p>
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-2" />
          <p className="text-sm text-red-300">
            Encryption key destroyed. Data unrecoverable.
          </p>
        </div>
      </div>
    );
  }

  if (isFullscreen) {
    return (
      <div 
        className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center p-4"
        onClick={() => setIsFullscreen(false)}
      >
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-cyan-400" />
            <span className="text-white font-semibold">{mission.name}</span>
          </div>
          <div className={`text-4xl font-mono font-bold ${getTimeColor()}`}>
            {formatTime(timeLeft)}
          </div>
        </div>

        {qrDataUrl && (
          <img 
            src={qrDataUrl} 
            alt="Mission QR" 
            className="max-w-full max-h-[70vh] rounded-lg"
          />
        )}

        <p className="text-slate-500 mt-4 text-sm">
          Tap anywhere to exit fullscreen
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-cyan-400" />
          <h2 className="text-lg font-bold text-white">Mission QR Code</h2>
        </div>
        <div className={`flex items-center gap-2 ${getTimeColor()}`}>
          <Clock className="w-4 h-4" />
          <span className="font-mono font-bold">{formatTime(timeLeft)}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-slate-700 rounded-full h-1 mb-6">
        <div 
          className={`h-1 rounded-full transition-all ${
            timeLeft < 60 ? 'bg-red-500' : timeLeft < 300 ? 'bg-yellow-500' : 'bg-cyan-500'
          }`}
          style={{ width: getProgressWidth() }}
        />
      </div>

      {/* Mission Info */}
      <div className="bg-slate-800/50 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-slate-500">Mission:</span>
            <span className="text-white ml-2">{mission.name}</span>
          </div>
          <div>
            <span className="text-slate-500">Type:</span>
            <span className="text-white ml-2">{mission.type}</span>
          </div>
          <div>
            <span className="text-slate-500">Waypoints:</span>
            <span className="text-white ml-2">{mission.waypoints.length}</span>
          </div>
          <div>
            <span className="text-slate-500">Priority:</span>
            <span className={`ml-2 ${
              mission.priority === 'STEALTH' ? 'text-purple-400' :
              mission.priority === 'SPEED' ? 'text-orange-400' : 'text-slate-400'
            }`}>{mission.priority}</span>
          </div>
        </div>
      </div>

      {/* QR Code */}
      <div 
        className="flex justify-center mb-6 cursor-pointer"
        onClick={() => setIsFullscreen(true)}
      >
        {qrDataUrl ? (
          <div className="relative group">
            <img 
              src={qrDataUrl} 
              alt="Mission QR" 
              className="w-64 h-64 rounded-lg"
            />
            <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
              <span className="text-white text-sm">Click for fullscreen</span>
            </div>
          </div>
        ) : (
          <div className="w-64 h-64 bg-slate-800 rounded-lg flex items-center justify-center">
            <RefreshCw className="w-8 h-8 text-slate-600 animate-spin" />
          </div>
        )}
      </div>

      {/* Security Notice */}
      <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-3 mb-6">
        <div className="flex items-start gap-2">
          <Shield className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-cyan-300">
            <p className="font-semibold mb-1">Ephemeral QR - Single Use</p>
            <p className="text-cyan-400/70">
              This QR can only be scanned once. After scan or expiration, 
              the decryption key is permanently destroyed.
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={() => setIsFullscreen(true)}
          className="flex-1 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
        >
          Fullscreen
        </button>
        
        {showDestroy ? (
          <div className="flex-1 flex gap-2">
            <button
              onClick={handleDestroy}
              className="flex-1 py-2 bg-red-500 text-white rounded-lg hover:bg-red-400"
            >
              Confirm Destroy
            </button>
            <button
              onClick={() => setShowDestroy(false)}
              className="px-4 py-2 bg-slate-700 text-white rounded-lg"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={handleDestroy}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Destroy
          </button>
        )}
      </div>

      {/* Data Size */}
      <p className="text-center text-xs text-slate-600 mt-4">
        Payload: {(data.length / 1024).toFixed(1)} KB • AES-256-GCM Encrypted
      </p>
    </div>
  );
}

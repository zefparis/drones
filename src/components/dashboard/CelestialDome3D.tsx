/**
 * Celestial Dome 3D - Real-time Sky Visualization
 * Shows sun, moon, and star positions for navigation
 */

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

interface CelestialData {
  sun?: { azimuth: number; elevation: number };
  moon?: { azimuth: number; elevation: number; phase: number };
  polaris?: { azimuth: number; elevation: number };
  time?: Date;
}

interface CelestialDome3DProps {
  data?: CelestialData;
}

export function CelestialDome3D({ data }: CelestialDome3DProps) {
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-bold text-cyan-400 tracking-wider">CELESTIAL NAV</h3>
        <span className="text-xs text-slate-500 font-mono">
          {data?.time ? new Date(data.time).toISOString().slice(11, 19) : '--:--:--'}
        </span>
      </div>

      <div className="flex-1 rounded-lg overflow-hidden bg-gradient-to-b from-slate-900 to-slate-950">
        <Canvas camera={{ position: [0, 0.5, 2], fov: 60 }}>
          <ambientLight intensity={0.1} />
          <CelestialScene data={data} />
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            maxPolarAngle={Math.PI / 2}
            minPolarAngle={0}
          />
        </Canvas>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-2 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-yellow-400" />
          <span className="text-slate-400">Sun</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-slate-300" />
          <span className="text-slate-400">Moon</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-cyan-400" />
          <span className="text-slate-400">Polaris</span>
        </div>
      </div>
    </div>
  );
}

function CelestialScene({ data }: { data?: CelestialData }) {
  const starsRef = useRef<THREE.Points>(null);

  // Animate stars twinkling
  useFrame((state) => {
    if (starsRef.current) {
      const positions = starsRef.current.geometry.attributes.position;
      const time = state.clock.elapsedTime;
      
      // Twinkling effect handled by material
      void positions;
      void time;
    }
  });

  // Generate star positions
  const starCount = 200;
  const starPositions = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI * 0.5; // Only upper hemisphere
    const r = 10;
    starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    starPositions[i * 3 + 1] = r * Math.cos(phi);
    starPositions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
  }

  // Convert azimuth/elevation to 3D position
  const celestialToPosition = (azimuth: number, elevation: number, radius: number): [number, number, number] => {
    const az = (azimuth * Math.PI) / 180;
    const el = (elevation * Math.PI) / 180;
    return [
      radius * Math.cos(el) * Math.sin(az),
      radius * Math.sin(el),
      radius * Math.cos(el) * Math.cos(az),
    ];
  };

  const sunPos = data?.sun ? celestialToPosition(data.sun.azimuth, data.sun.elevation, 8) : [5, 3, 5] as [number, number, number];
  const moonPos = data?.moon ? celestialToPosition(data.moon.azimuth, data.moon.elevation, 7) : [-4, 4, -3] as [number, number, number];
  const polarisPos = data?.polaris ? celestialToPosition(data.polaris.azimuth, data.polaris.elevation, 9) : [0, 8, -2] as [number, number, number];

  return (
    <>
      {/* Dome Grid */}
      <mesh rotation={[0, 0, 0]}>
        <sphereGeometry args={[10, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshBasicMaterial color="#1e3a5f" wireframe transparent opacity={0.3} side={THREE.BackSide} />
      </mesh>

      {/* Horizon Ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[9.9, 10, 64]} />
        <meshBasicMaterial color="#06b6d4" transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>

      {/* Cardinal Markers */}
      {[
        { label: 'N', angle: 0, color: '#ef4444' },
        { label: 'E', angle: 90, color: '#64748b' },
        { label: 'S', angle: 180, color: '#64748b' },
        { label: 'W', angle: 270, color: '#64748b' },
      ].map(({ angle, color }) => (
        <mesh
          key={angle}
          position={[
            10 * Math.sin((angle * Math.PI) / 180),
            0.1,
            10 * Math.cos((angle * Math.PI) / 180),
          ]}
        >
          <boxGeometry args={[0.3, 0.1, 0.1]} />
          <meshBasicMaterial color={color} />
        </mesh>
      ))}

      {/* Stars */}
      <points ref={starsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[starPositions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial color="#ffffff" size={0.05} sizeAttenuation />
      </points>

      {/* Sun */}
      <mesh position={sunPos}>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshBasicMaterial color="#fbbf24" />
      </mesh>
      <pointLight position={sunPos} color="#fbbf24" intensity={2} distance={20} />

      {/* Moon */}
      <mesh position={moonPos}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color="#e2e8f0" emissive="#e2e8f0" emissiveIntensity={0.3} />
      </mesh>

      {/* Polaris (North Star) */}
      <mesh position={polarisPos}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshBasicMaterial color="#06b6d4" />
      </mesh>

      {/* Ground Reference */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
        <circleGeometry args={[10, 64]} />
        <meshBasicMaterial color="#0f172a" transparent opacity={0.8} />
      </mesh>
    </>
  );
}

export default CelestialDome3D;

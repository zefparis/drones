/**
 * Drone Model 3D - Three.js Component
 * Realistic quadcopter with animated sensors and threat visualization
 */

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface DroneModel3DProps {
  rotation?: { roll: number; pitch: number; yaw: number };
  sensors?: {
    motors?: boolean[];
    lidar_active?: boolean;
    gps_enabled?: boolean;
    camera_active?: boolean;
  };
  threats?: Array<{ x: number; y: number; z: number; level: string }>;
}

export function DroneModel3D({ rotation, sensors, threats = [] }: DroneModel3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const propellersRef = useRef<THREE.Group[]>([]);

  // Animate rotation and propellers
  useFrame((state) => {
    if (groupRef.current && rotation) {
      groupRef.current.rotation.x = (rotation.pitch * Math.PI) / 180;
      groupRef.current.rotation.y = (rotation.yaw * Math.PI) / 180;
      groupRef.current.rotation.z = (rotation.roll * Math.PI) / 180;
    }

    // Spin propellers
    propellersRef.current.forEach((prop, i) => {
      if (prop && sensors?.motors?.[i] !== false) {
        prop.rotation.y = state.clock.elapsedTime * 50;
      }
    });
  });

  const armPositions = [
    { x: 0.35, z: 0.35, angle: 45 },
    { x: -0.35, z: 0.35, angle: 135 },
    { x: -0.35, z: -0.35, angle: 225 },
    { x: 0.35, z: -0.35, angle: 315 },
  ];

  return (
    <group ref={groupRef}>
      {/* Main Body - Central Hub */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.25, 0.08, 0.25]} />
        <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Top Cover */}
      <mesh position={[0, 0.05, 0]}>
        <boxGeometry args={[0.2, 0.02, 0.2]} />
        <meshStandardMaterial color="#06b6d4" metalness={0.8} roughness={0.2} emissive="#06b6d4" emissiveIntensity={0.2} />
      </mesh>

      {/* Arms and Motors */}
      {armPositions.map((arm, i) => (
        <group key={i}>
          {/* Arm */}
          <mesh position={[arm.x / 2, 0, arm.z / 2]} rotation={[0, (arm.angle * Math.PI) / 180, 0]}>
            <boxGeometry args={[0.5, 0.03, 0.04]} />
            <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
          </mesh>

          {/* Motor Housing */}
          <mesh position={[arm.x, 0.02, arm.z]}>
            <cylinderGeometry args={[0.06, 0.06, 0.04, 16]} />
            <meshStandardMaterial
              color={sensors?.motors?.[i] !== false ? '#22c55e' : '#ef4444'}
              emissive={sensors?.motors?.[i] !== false ? '#22c55e' : '#ef4444'}
              emissiveIntensity={0.5}
              metalness={0.8}
              roughness={0.2}
            />
          </mesh>

          {/* Propeller */}
          <group
            ref={(el) => {
              if (el) propellersRef.current[i] = el;
            }}
            position={[arm.x, 0.06, arm.z]}
          >
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <boxGeometry args={[0.01, 0.25, 0.03]} />
              <meshStandardMaterial color="#64748b" transparent opacity={0.7} />
            </mesh>
            <mesh rotation={[0, Math.PI / 2, Math.PI / 2]}>
              <boxGeometry args={[0.01, 0.25, 0.03]} />
              <meshStandardMaterial color="#64748b" transparent opacity={0.7} />
            </mesh>
          </group>

          {/* LED Indicator */}
          <mesh position={[arm.x, -0.03, arm.z]}>
            <sphereGeometry args={[0.015, 8, 8]} />
            <meshStandardMaterial
              color={i < 2 ? '#22c55e' : '#ef4444'}
              emissive={i < 2 ? '#22c55e' : '#ef4444'}
              emissiveIntensity={1}
            />
          </mesh>
        </group>
      ))}

      {/* Camera (OAK-D Style) */}
      <group position={[0, -0.06, 0.18]}>
        <mesh>
          <boxGeometry args={[0.12, 0.04, 0.03]} />
          <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.1} />
        </mesh>
        {/* Camera Lenses */}
        {[-0.04, 0, 0.04].map((x, i) => (
          <mesh key={i} position={[x, 0, 0.02]}>
            <cylinderGeometry args={[0.012, 0.012, 0.01, 16]} />
            <meshStandardMaterial
              color="#3b82f6"
              emissive={sensors?.camera_active ? '#3b82f6' : '#000'}
              emissiveIntensity={sensors?.camera_active ? 0.8 : 0}
            />
          </mesh>
        ))}
      </group>

      {/* GPS Antenna */}
      {sensors?.gps_enabled && (
        <group position={[0, 0.12, -0.08]}>
          <mesh>
            <cylinderGeometry args={[0.02, 0.025, 0.04, 8]} />
            <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.3} />
          </mesh>
          <mesh position={[0, 0.03, 0]}>
            <sphereGeometry args={[0.015, 8, 8]} />
            <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.8} />
          </mesh>
        </group>
      )}

      {/* LiDAR Scanner */}
      {sensors?.lidar_active && <LiDARScanner />}

      {/* Threat Detection Zones */}
      {threats.map((threat, i) => (
        <ThreatZone key={i} threat={threat} />
      ))}

      {/* Camera FOV Visualization */}
      {sensors?.camera_active && <CameraFOV />}
    </group>
  );
}

function LiDARScanner() {
  const ref = useRef<THREE.Mesh>(null);
  const beamRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * 3;
    }
    if (beamRef.current) {
      beamRef.current.rotation.y = state.clock.elapsedTime * 3;
    }
  });

  return (
    <group position={[0, 0.1, 0]}>
      {/* LiDAR Housing */}
      <mesh ref={ref}>
        <cylinderGeometry args={[0.04, 0.04, 0.025, 16]} />
        <meshStandardMaterial color="#8b5cf6" emissive="#8b5cf6" emissiveIntensity={0.4} metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Scanning Beam */}
      <mesh ref={beamRef} position={[0, 0.5, 0]}>
        <coneGeometry args={[0.3, 1, 4, 1, true]} />
        <meshBasicMaterial color="#8b5cf6" transparent opacity={0.1} side={THREE.DoubleSide} wireframe />
      </mesh>
    </group>
  );
}

function ThreatZone({ threat }: { threat: { x: number; y: number; z: number; level: string } }) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (ref.current) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.1;
      ref.current.scale.set(scale, scale, scale);
    }
  });

  const color = threat.level === 'HIGH' ? '#ef4444' : '#f59e0b';

  return (
    <mesh ref={ref} position={[threat.x, threat.y, threat.z]}>
      <sphereGeometry args={[0.5, 16, 16]} />
      <meshBasicMaterial color={color} transparent opacity={0.15} wireframe />
    </mesh>
  );
}

function CameraFOV() {
  const points = [
    new THREE.Vector3(0, -0.06, 0.18),
    new THREE.Vector3(-0.4, -0.4, 1.2),
    new THREE.Vector3(0.4, -0.4, 1.2),
    new THREE.Vector3(0.4, 0.2, 1.2),
    new THREE.Vector3(-0.4, 0.2, 1.2),
    new THREE.Vector3(-0.4, -0.4, 1.2),
  ];

  return (
    <line>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[new Float32Array(points.flatMap((p) => [p.x, p.y, p.z])), 3]}
        />
      </bufferGeometry>
      <lineBasicMaterial color="#06b6d4" transparent opacity={0.3} />
    </line>
  );
}

export default DroneModel3D;

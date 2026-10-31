// src/components/ParticleBackground.jsx
import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// 1. Antigravity Particles Component
function AntigravityParticles({ theme }) {
  const pointsRef = useRef();
  const particleCount = 5000;
  const { mouse, viewport } = useThree();
  const isDark = theme === 'dark';

  // Data initialization
  const [positions, initialPositions, velocities, colors] = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const initial = new Float32Array(particleCount * 3);
    const vels = new Float32Array(particleCount * 3);
    const cols = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      // Random distribution in space
      const x = (Math.random() - 0.5) * 20;
      const y = (Math.random() - 0.5) * 15;
      const z = (Math.random() - 0.5) * 12;

      pos[i * 3] = initial[i * 3] = x;
      pos[i * 3 + 1] = initial[i * 3 + 1] = y;
      pos[i * 3 + 2] = initial[i * 3 + 2] = z;

      vels[i * 3] = vels[i * 3 + 1] = vels[i * 3 + 2] = 0;

      // Premium Colors: Cyan, Electric Blue, Subtle Magenta
      const rand = Math.random();
      if (rand < 0.6) {
        // Cyan
        cols[i * 3] = 0;
        cols[i * 3 + 1] = 0.95;
        cols[i * 3 + 2] = 1;
      } else if (rand < 0.9) {
        // Neon Blue
        cols[i * 3] = 0.26;
        cols[i * 3 + 1] = 0.44;
        cols[i * 3 + 2] = 1;
      } else {
        // Magenta
        cols[i * 3] = 0.93;
        cols[i * 3 + 1] = 0.28;
        cols[i * 3 + 2] = 0.93;
      }
    }
    return [pos, initial, vels, cols];
  }, [particleCount]);

  useFrame((state) => {
    if (!pointsRef.current) return;

    const posAttr = pointsRef.current.geometry.attributes.position;
    const time = state.clock.getElapsedTime();

    // Mouse to 3D mapping (approximate for screen plane)
    const mx = (mouse.x * viewport.width) / 2;
    const my = (mouse.y * viewport.height) / 2;

    for (let i = 0; i < particleCount; i++) {
      const ix = i * 3;
      const iy = i * 3 + 1;
      const iz = i * 3 + 2;

      let px = posAttr.array[ix];
      let py = posAttr.array[iy];
      let pz = posAttr.array[iz];

      // Antigravity / Repulsion Logic
      const dx = px - mx;
      const dy = py - my;
      const distSq = dx * dx + dy * dy;
      const dist = Math.sqrt(distSq);

      if (dist < 4) {
        const force = (4 - dist) / 4;
        // Push away from mouse
        velocities[ix] += (dx / dist) * force * 0.15;
        velocities[iy] += (dy / dist) * force * 0.15;
        // Add some "anti-gravity" lift
        velocities[iz] += force * 0.1;
      }

      // Return to initial positions (Elastic Force)
      const rx = initialPositions[ix] - px;
      const ry = initialPositions[iy] - py;
      const rz = initialPositions[iz] - pz;

      velocities[ix] += rx * 0.005;
      velocities[iy] += ry * 0.005;
      velocities[iz] += rz * 0.005;

      // Friction for smooth movement
      velocities[ix] *= 0.94;
      velocities[iy] *= 0.94;
      velocities[iz] *= 0.94;

      // Update positions
      posAttr.array[ix] += velocities[ix];
      posAttr.array[iy] += velocities[iy];
      posAttr.array[iz] += velocities[iz];

      // Natural Float Drift
      posAttr.array[iy] += Math.sin(time * 0.3 + initialPositions[ix]) * 0.003;
    }

    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={colors.length / 3}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        vertexColors
        transparent
        opacity={isDark ? 0.7 : 0.5}
        sizeAttenuation={true}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

// 2. Ambient Atmosphere Particles
function AmbientFog({ theme }) {
  const count = 200;
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 40;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 30;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    return pos;
  }, []);

  const ref = useRef();
  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.02;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.02}
        color={theme === 'dark' ? '#ffffff' : '#444444'}
        transparent
        opacity={0.1}
      />
    </points>
  );
}

export default function ParticleBackground({ theme }) {
  const isDark = theme === 'dark';

  const bgStyle = useMemo(
    () => ({
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      zIndex: 0,
      backgroundColor: isDark ? '#020617' : '#f8fafc',
      backgroundImage: isDark
        ? 'radial-gradient(circle at 50% 50%, #0f172a 0%, #020617 100%)'
        : 'radial-gradient(circle at 50% 50%, #eff6ff 0%, #f8fafc 100%)',
    }),
    [isDark]
  );

  return (
    <div style={bgStyle}>
      <Canvas camera={{ position: [0, 0, 10], fov: 45 }}>
        <ambientLight intensity={0.4} />
        <pointLight
          position={[10, 10, 10]}
          intensity={1}
          color={isDark ? '#00f2ff' : '#3b82f6'}
        />
        <pointLight
          position={[-10, -10, -10]}
          intensity={0.5}
          color={isDark ? '#9333ea' : '#8b5cf6'}
        />

        <AntigravityParticles theme={theme} />
        <AmbientFog theme={theme} />

        <fog attach="fog" args={[isDark ? '#020617' : '#f8fafc', 5, 25]} />
      </Canvas>
    </div>
  );
}

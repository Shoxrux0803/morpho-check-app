// src/components/AdvancedMorphoAnimation.js
import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// A Custom ShaderMaterial for points that fades based on depth to simulate DOF
const PointDOFShaderMaterial = {
  uniforms: {
    uTime: { value: 0 },
    uColor: { value: new THREE.Color('#ffffff') },
    uFocus: { value: 5.0 },
    uAperture: { value: 0.1 },
    uMaxDistance: { value: 15.0 },
  },
  vertexShader: `
    uniform float uTime;
    attribute float size;
    varying float vDepth;
    
    void main() {
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vDepth = -mvPosition.z;
      
      // Points closer to the camera are sharper (smaller) and farther are blurrier (larger & faded)
      // Actually real DOF makes out of focus items larger.
      float focusDist = abs(vDepth - 5.0); // Assuming focus at z=5.0
      gl_PointSize = size * (1.0 + focusDist * 0.2) * (10.0 / -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    uniform vec3 uColor;
    varying float vDepth;
    
    void main() {
      // Create a soft circle
      vec2 xy = gl_PointCoord.xy - vec2(0.5);
      float ll = length(xy);
      if (ll > 0.5) discard;
      
      // Calculate opacity based on depth distance from focus
      float focusDist = abs(vDepth - 5.0);
      float opacity = smoothstep(0.0, 0.5, 0.5 - ll) * max(0.0, 1.0 - focusDist * 0.15);
      
      gl_FragColor = vec4(uColor, opacity * 0.8);
    }
  `,
};

// Custom Shader for Lines
const LineDOFShaderMaterial = {
  uniforms: {
    uColor: { value: new THREE.Color('#ffffff') },
    uFocus: { value: 5.0 },
  },
  vertexShader: `
    varying float vDepth;
    void main() {
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vDepth = -mvPosition.z;
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    uniform vec3 uColor;
    varying float vDepth;
    void main() {
      float focusDist = abs(vDepth - 5.0);
      float opacity = max(0.0, 1.0 - focusDist * 0.12);
      gl_FragColor = vec4(uColor, opacity * 0.3); // Lines are more transparent
    }
  `,
};

const DofNetwork = ({ isDark }) => {
  const pointsRef = useRef();
  const linesRef = useRef();
  const { mouse, viewport, camera } = useThree();

  const particleCount = 200;
  const maxDistance = 2.5;

  // Initialize random points
  const [positions, velocities] = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const vel = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      // Spread across screen
      pos[i * 3] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 15;

      vel[i * 3] = (Math.random() - 0.5) * 0.02; // vx
      vel[i * 3 + 1] = (Math.random() - 0.5) * 0.02; // vy
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.02; // vz
    }
    return [pos, vel];
  }, []);

  const sizes = useMemo(() => {
    const arr = new Float32Array(particleCount);
    for (let i = 0; i < particleCount; i++) arr[i] = Math.random() * 2.0 + 1.0;
    return arr;
  }, []);

  // Max lines = N * (N - 1) / 2
  const maxLines = (particleCount * (particleCount - 1)) / 2;
  const linePositions = useMemo(
    () => new Float32Array(maxLines * 6),
    [maxLines]
  );

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const posAttr = pointsRef.current.geometry.attributes.position;
    const lineAttr = linesRef.current.geometry.attributes.position;

    // Mouse coords in 3D world space (approximate projection on Z=0)
    const mx = (mouse.x * viewport.width) / 2;
    const my = (mouse.y * viewport.height) / 2;

    // Update point positions
    let pIdx = 0;
    for (let i = 0; i < particleCount; i++) {
      let x = posAttr.array[pIdx];
      let y = posAttr.array[pIdx + 1];
      let z = posAttr.array[pIdx + 2];

      x += velocities[pIdx];
      y += velocities[pIdx + 1];
      z += velocities[pIdx + 2];

      // Add gentle noise/swirls
      x += Math.sin(time * 0.3 + y) * 0.005;
      y += Math.cos(time * 0.4 + x) * 0.005;

      // Mouse subtle repel
      const dx = x - mx;
      const dy = y - my;
      const distToMouse = Math.sqrt(dx * dx + dy * dy);
      if (distToMouse < 4.0) {
        const force = (4.0 - distToMouse) * 0.01;
        x += dx * force;
        y += dy * force;
      }

      // Wrap around bounds
      if (x > 10) x = -10;
      if (x < -10) x = 10;
      if (y > 10) y = -10;
      if (y < -10) y = 10;
      if (z > 5) z = -10;
      if (z < -10) z = 5;

      posAttr.array[pIdx] = x;
      posAttr.array[pIdx + 1] = y;
      posAttr.array[pIdx + 2] = z;

      pIdx += 3;
    }
    posAttr.needsUpdate = true;

    // Build lines between close points
    let vertexCount = 0;
    for (let i = 0; i < particleCount; i++) {
      for (let j = i + 1; j < particleCount; j++) {
        const dx = posAttr.array[i * 3] - posAttr.array[j * 3];
        const dy = posAttr.array[i * 3 + 1] - posAttr.array[j * 3 + 1];
        const dz = posAttr.array[i * 3 + 2] - posAttr.array[j * 3 + 2];
        const distSq = dx * dx + dy * dy + dz * dz;

        if (distSq < maxDistance * maxDistance) {
          lineAttr.array[vertexCount++] = posAttr.array[i * 3];
          lineAttr.array[vertexCount++] = posAttr.array[i * 3 + 1];
          lineAttr.array[vertexCount++] = posAttr.array[i * 3 + 2];
          lineAttr.array[vertexCount++] = posAttr.array[j * 3];
          lineAttr.array[vertexCount++] = posAttr.array[j * 3 + 1];
          lineAttr.array[vertexCount++] = posAttr.array[j * 3 + 2];
        }
      }
    }

    linesRef.current.geometry.setDrawRange(0, vertexCount / 3);
    lineAttr.needsUpdate = true;

    // Small camera drift
    camera.position.x += (mouse.x * 2 - camera.position.x) * 0.05;
    camera.position.y += (mouse.y * 2 - camera.position.y) * 0.05;
    camera.lookAt(0, 0, 0);
  });

  const materialColor = useMemo(
    () => new THREE.Color(isDark ? '#ffffff' : '#0f172a'),
    [isDark]
  );

  return (
    <group>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={particleCount}
            array={positions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-size"
            count={particleCount}
            array={sizes}
            itemSize={1}
          />
        </bufferGeometry>
        <shaderMaterial
          attach="material"
          args={[PointDOFShaderMaterial]}
          uniforms-uColor-value={materialColor}
          transparent
          depthWrite={false}
          blending={isDark ? THREE.AdditiveBlending : THREE.NormalBlending}
        />
      </points>

      <lineSegments ref={linesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={maxLines * 2}
            array={linePositions}
            itemSize={3}
            usage={THREE.DynamicDrawUsage}
          />
        </bufferGeometry>
        <shaderMaterial
          attach="material"
          args={[LineDOFShaderMaterial]}
          uniforms-uColor-value={materialColor}
          transparent
          depthWrite={false}
          blending={isDark ? THREE.AdditiveBlending : THREE.NormalBlending}
        />
      </lineSegments>
    </group>
  );
};

export default function AdvancedMorphoAnimation({ theme }) {
  const isDark = theme === 'dark';

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
        background: isDark ? '#000000' : '#f1f5f9', // Deep black for max contrast on dark mode
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 8], fov: 60 }}
        gl={{ antialias: true, alpha: true }}
      >
        <DofNetwork isDark={isDark} />
      </Canvas>

      {/* Premium Vignette & Texture */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: `radial-gradient(circle at 50% 50%, transparent 0%, ${
            isDark ? 'rgb(0, 0, 0)' : 'rgba(255, 255, 255, 0.5)'
          } 150%)`,
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* Subtle Noise Grain Overlay */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundImage:
            "url('https://grainy-gradients.vercel.app/noise.svg')",
          opacity: 0.05,
          zIndex: 2,
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}

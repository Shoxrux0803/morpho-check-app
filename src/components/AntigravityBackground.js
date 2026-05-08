// src/components/AntigravityBackground.js
import React, { useRef, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

// --- Configuration ---
const PARTICLE_COUNT = 8000;
const MOUSE_RADIUS = 6;
const MOUSE_STRENGTH = 0.25;
const SPRING_STRENGTH = 0.005;
const DAMPING = 0.93;

// Google Brand Colors + Premium Palette
const PREMIUM_COLORS = [
  "#4285F4", // Google Blue
  "#EA4335", // Google Red
  "#FBBC05", // Google Yellow
  "#34A853", // Google Green
  "#a855f7", // Purple
  "#22d3ee", // Cyan
  "#f472b6", // Pink
];

// --- Simple Noise Helpers ---
const noise = (x, y, z) => {
  return Math.sin(x) * Math.cos(y) * Math.sin(z);
};

// --- Custom Shader ---
const vertexShader = `
  attribute float size;
  attribute float opacity;
  attribute vec3 color;
  varying vec3 vColor;
  varying float vOpacity;
  
  void main() {
    vColor = color;
    vOpacity = opacity;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = `
  varying vec3 vColor;
  varying float vOpacity;
  
  void main() {
    // Distance from center for soft circle
    float r = distance(gl_PointCoord, vec2(0.5));
    if (r > 0.5) discard;
    
    // Soft glow falloff
    float glow = 1.0 - (r * 2.0);
    glow = pow(glow, 1.5);
    
    gl_FragColor = vec4(vColor, vOpacity * glow);
  }
`;

const PremiumParticles = ({ isDark }) => {
  const pointsRef = useRef();
  const { viewport } = useThree();

  // Create geometry and attributes
  const [geometry, initialPos, velocities] = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(PARTICLE_COUNT * 3);
    const initial = new Float32Array(PARTICLE_COUNT * 3);
    const vels = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);
    const sizes = new Float32Array(PARTICLE_COUNT);
    const opacities = new Float32Array(PARTICLE_COUNT);

    const colorObjs = PREMIUM_COLORS.map((c) => new THREE.Color(c));

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Spread particles in a large 3D area
      const x = (Math.random() - 0.5) * 35;
      const y = (Math.random() - 0.5) * 25;
      const z = (Math.random() - 0.5) * 15;

      pos[i * 3] = initial[i * 3] = x;
      pos[i * 3 + 1] = initial[i * 3 + 1] = y;
      pos[i * 3 + 2] = initial[i * 3 + 2] = z;

      vels[i * 3] = vels[i * 3 + 1] = vels[i * 3 + 2] = 0;

      // Color distribution
      const c = colorObjs[Math.floor(Math.random() * colorObjs.length)];
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;

      // Organic variance
      sizes[i] = 0.05 + Math.random() * 0.15;
      opacities[i] = 0.3 + Math.random() * 0.5;
    }

    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geo.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute("opacity", new THREE.BufferAttribute(opacities, 1));

    return [geo, initial, vels];
  }, []);

  const mousePrev = useRef({ x: 0, y: 0 });

  useFrame((state) => {
    if (!pointsRef.current) return;

    const pos = pointsRef.current.geometry.attributes.position.array;
    const time = state.clock.getElapsedTime();

    // Mouse coordinates in 3D scene units
    const mx = (state.mouse.x * viewport.width) / 2;
    const my = (state.mouse.y * viewport.height) / 2;

    // Mouse delta for impact force
    const mdx = mx - mousePrev.current.x;
    const mdy = my - mousePrev.current.y;
    mousePrev.current = { x: mx, y: my };

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const idx = i * 3;

      // 1. Fluid Dynamics (Noise Field)
      // We use a simple sinusoidal field to simulate currents
      const noiseX = noise(pos[idx] * 0.1, pos[idx + 1] * 0.1, time * 0.1);
      const noiseY = noise(pos[idx + 1] * 0.1, pos[idx] * 0.1, time * 0.1);

      velocities[idx] += noiseX * 0.001;
      velocities[idx + 1] += noiseY * 0.001;

      // 2. Mouse Repulsion & Impact
      const dx = pos[idx] - mx;
      const dy = pos[idx + 1] - my;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < MOUSE_RADIUS) {
        const force = (MOUSE_RADIUS - dist) / MOUSE_RADIUS;
        const push = force * MOUSE_STRENGTH;

        // Basic repulsion
        velocities[idx] += (dx / dist) * push;
        velocities[idx + 1] += (dy / dist) * push;

        // Impact from mouse movement (shockwave feel)
        velocities[idx] += mdx * force * 0.4;
        velocities[idx + 1] += mdy * force * 0.4;

        // Z-axis ripple
        velocities[idx + 2] += force * 0.05;
      }

      // 3. Spring Return Force (Keeping them in the general area)
      const rx = initialPos[idx] - pos[idx];
      const ry = initialPos[idx + 1] - pos[idx + 1];
      const rz = initialPos[idx + 2] - pos[idx + 2];

      velocities[idx] += rx * SPRING_STRENGTH;
      velocities[idx + 1] += ry * SPRING_STRENGTH;
      velocities[idx + 2] += rz * SPRING_STRENGTH;

      // 4. Update and Damping
      velocities[idx] *= DAMPING;
      velocities[idx + 1] *= DAMPING;
      velocities[idx + 2] *= DAMPING;

      pos[idx] += velocities[idx];
      pos[idx + 1] += velocities[idx + 1];
      pos[idx + 2] += velocities[idx + 2];
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true;

    // Interactive Camera Drift
    pointsRef.current.rotation.y = THREE.MathUtils.lerp(
      pointsRef.current.rotation.y,
      state.mouse.x * 0.15,
      0.05,
    );
    pointsRef.current.rotation.x = THREE.MathUtils.lerp(
      pointsRef.current.rotation.x,
      -state.mouse.y * 0.15,
      0.05,
    );
  });

  const shaderMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {},
      transparent: true,
      blending: isDark ? THREE.AdditiveBlending : THREE.NormalBlending,
      depthWrite: false,
    });
  }, [isDark]);

  return <points ref={pointsRef} geometry={geometry} material={shaderMaterial} />;
};

export default function AntigravityBackground({ theme }) {
  const isDark = theme === "dark";

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        background: isDark
          ? "radial-gradient(circle at 50% 50%, #0f172a 0%, #020617 100%)"
          : "radial-gradient(circle at 50% 50%, #f0f9ff 0%, #ffffff 100%)",
        transition: "background 0.8s ease-in-out",
      }}
    >
      {/* Animated Vignette Layer */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          boxShadow: isDark
            ? "inset 0 0 180px rgba(59, 130, 246, 0.2)"
            : "inset 0 0 150px rgba(37, 99, 235, 0.1)",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

      <Canvas camera={{ position: [0, 0, 15], fov: 45 }}>
        <PremiumParticles isDark={isDark} />
        <fog attach="fog" args={[isDark ? "#020617" : "#ffffff", 10, 30]} />
      </Canvas>

      {/* Custom styles to prevent scrolling artifacts */}
      <style>{`
        body { margin: 0; overflow: hidden; }
        ::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}

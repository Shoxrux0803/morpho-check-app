// src/components/PremiumLiquidBackground.js
import React, { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform float uTime;
  uniform vec2 uMouse;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec3 uColorC;
  varying vec2 vUv;

  // Simplex Noise 2D
  vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
  float snoise(vec2 v){
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
             -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy) );
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod(i, 289.0);
    vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
    + i.x + vec3(0.0, i1.x, 1.0 ));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
      dot(x12.zw,x12.zw)), 0.0);
    m = m*m ;
    m = m*m ;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  void main() {
    vec2 uv = vUv;
    
    // Dynamic distortion based on noise and mouse
    float noise1 = snoise(uv * 2.0 + uTime * 0.1);
    float noise2 = snoise(uv * 4.0 - uTime * 0.05 + uMouse * 0.5);
    
    vec2 distortedUv = uv + vec2(noise1, noise2) * 0.1;
    distortedUv += (uMouse - 0.5) * 0.05; // Subtle mouse follow
    
    // Create liquid waves
    float wave = snoise(distortedUv * 3.0 + uTime * 0.2);
    
    // Mix colors based on waves and noise
    vec3 color = mix(uColorA, uColorB, wave * 0.5 + 0.5);
    color = mix(color, uColorC, noise1 * 0.5 + 0.5);
    
    // Add glowing highlights
    float highlight = pow(max(0.0, wave), 3.0);
    color += uColorC * highlight * 0.3;
    
    gl_FragColor = vec4(color, 1.0);
  }
`;

const LiquidMesh = ({ isDark }) => {
  const meshRef = useRef();

  // Colors for Light and Dark modes
  // Light: Soft Blues, Pinks, Turquoises
  // Dark: Deep Blues, Purples, Cyans
  const colors = useMemo(() => {
    if (isDark) {
      return {
        a: new THREE.Color("#0f172a"), // Deep Blue
        b: new THREE.Color("#1e1b4b"), // Deep Purple
        c: new THREE.Color("#0ea5e9"), // Sky Blue Cyan
      };
    } else {
      return {
        a: new THREE.Color("#f0f9ff"), // Light Blue
        b: new THREE.Color("#fae8ff"), // Light Pink
        c: new THREE.Color("#60a5fa"), // Primary Blue
      };
    }
  }, [isDark]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uColorA: { value: colors.a },
      uColorB: { value: colors.b },
      uColorC: { value: colors.c },
    }),
    [colors],
  );

  useFrame((state) => {
    if (!meshRef.current) return;
    meshRef.current.material.uniforms.uTime.value = state.clock.getElapsedTime();

    // Lerp mouse for extra smoothness
    meshRef.current.material.uniforms.uMouse.value.x = THREE.MathUtils.lerp(
      meshRef.current.material.uniforms.uMouse.value.x,
      (state.mouse.x + 1) / 2,
      0.05,
    );
    meshRef.current.material.uniforms.uMouse.value.y = THREE.MathUtils.lerp(
      meshRef.current.material.uniforms.uMouse.value.y,
      (state.mouse.y + 1) / 2,
      0.05,
    );
  });

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
      />
    </mesh>
  );
};

export default function PremiumLiquidBackground({ theme }) {
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
        pointerEvents: "none",
      }}
    >
      <Canvas camera={{ position: [0, 0, 1] }} gl={{ antialias: true, alpha: false }}>
        <LiquidMesh isDark={isDark} />
      </Canvas>

      {/* Overlay for depth and texture */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: isDark
            ? "radial-gradient(circle at 50% 50%, transparent 0%, rgba(2, 6, 23, 0.4) 100%)"
            : "radial-gradient(circle at 50% 50%, transparent 0%, rgba(255, 255, 255, 0.3) 100%)",
          backdropFilter: "blur(20px)",
          opacity: 0.6,
          zIndex: 1,
        }}
      />

      {/* Noise Grain Overlay for premium feel */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundImage: "url('https://grainy-gradients.vercel.app/noise.svg')",
          opacity: 0.05,
          zIndex: 2,
          pointerEvents: "none",
        }}
      />

      <style>{`
        body { margin: 0; overflow-x: hidden; }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { 
          background: rgba(128, 128, 128, 0.3); 
          border-radius: 10px; 
        }
        ::-webkit-scrollbar-thumb:hover { background: rgba(128, 128, 128, 0.5); }
      `}</style>
    </div>
  );
}

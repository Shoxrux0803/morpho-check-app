import React, { useMemo, useRef, useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const vertexShader = `
uniform float uTime;
uniform vec2 uMouse;
uniform float uTheme;

attribute float aScale;
attribute vec3 aColorDark;
attribute vec3 aColorLight;

varying vec3 vColor;
varying float vAlpha;

void main() {
  vec3 p = position;
  float t = uTime * 0.2;

  // Silliq yoyiluvchi tabiat (fluid organic flow)
  vec3 flow;
  flow.x = sin(p.y * 0.15 + t) * 2.5 + cos(p.z * 0.12 + t * 0.8) * 2.5;
  flow.y = sin(p.z * 0.16 + t * 1.1) * 2.5 + cos(p.x * 0.14 - t) * 2.5;
  flow.z = sin(p.x * 0.13 - t * 0.9) * 2.5 + cos(p.y * 0.15 + t * 1.2) * 2.5;

  // Sichqonchadan ehtiyotkorona qochish effekti
  vec3 mouseWorld = vec3(uMouse.x * 15.0, uMouse.y * 15.0, 0.0);
  float distToMouse = distance(p.xy, mouseWorld.xy);
  float repulsion = exp(-distToMouse * 0.08) * 8.0; 
  
  p += flow;
  p.xy += normalize(p.xy - mouseWorld.xy + vec2(0.0001)) * repulsion;

  vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mvPosition;

  // Perspektiv uzoqlashish (Depth of Field bokeh effect)
  // Kameraga yaqin bo'lgan nuqtalar kattaroq ko'rinadi.
  gl_PointSize = aScale * (250.0 / -mvPosition.z);

  // Mawzu ranglarini tanlash
  vColor = mix(aColorDark, aColorLight, uTheme);

  // Masofaga ketganlarni xiralashtirish
  float zDepth = -mvPosition.z;
  vAlpha = smoothstep(2.0, 15.0, zDepth) * (1.0 - smoothstep(40.0, 70.0, zDepth));
}
`;

const fragmentShader = `
varying vec3 vColor;
varying float vAlpha;

void main() {
  vec2 uv = gl_PointCoord.xy - 0.5;
  float dist = length(uv);
  
  // Aylanasimon zarracha chetini kesish
  if (dist > 0.5) discard;
  
  // Tiniq markaz va xira chekkalardan iborat yumshoq glow
  float alpha = (0.5 - dist) * 2.0;
  alpha = pow(alpha, 1.4) * vAlpha;

  gl_FragColor = vec4(vColor, alpha);
}
`;

const ParticleField = ({ isDark }) => {
  const pointsRef = useRef();
  const materialRef = useRef();
  const { mouse } = useThree();
  
  const [scroll, setScroll] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScroll(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const { geometry } = useMemo(() => {
    const count = 18000;
    const positions = new Float32Array(count * 3);
    const scales = new Float32Array(count);
    const colorsDark = new Float32Array(count * 3);
    const colorsLight = new Float32Array(count * 3);

    const paletteDark = [
      new THREE.Color("#4f46e5"), // Indigo
      new THREE.Color("#38bdf8"), // Sky
      new THREE.Color("#8b5cf6"), // Violet
      new THREE.Color("#c084fc"), // Fuchsia
      new THREE.Color("#818cf8")  // Indigo light
    ];

    const paletteLight = [
      new THREE.Color("#2563eb"), // Blue
      new THREE.Color("#0ea5e9"), // Sky Blue
      new THREE.Color("#6366f1"), // Indigo variant
      new THREE.Color("#ec4899"), // Pink
      new THREE.Color("#3b82f6")  // Normal Blue
    ];

    for (let i = 0; i < count; i++) {
      // Yoyiq keng miqyosdagi sfera
      const radius = 5 + Math.random() * 45;
      const theta = Math.random() * Math.PI * 2;
      const ySpread = (Math.random() - 0.5) * 35;

      positions[i * 3]     = Math.cos(theta) * radius + (Math.random() - 0.5) * 5;
      positions[i * 3 + 1] = ySpread;
      positions[i * 3 + 2] = Math.sin(theta) * radius + (Math.random() - 0.5) * 5;

      scales[i] = Math.random() * 2.5 + 0.5;

      const cd = paletteDark[Math.floor(Math.random() * paletteDark.length)];
      colorsDark[i * 3]     = cd.r;
      colorsDark[i * 3 + 1] = cd.g;
      colorsDark[i * 3 + 2] = cd.b;

      const cl = paletteLight[Math.floor(Math.random() * paletteLight.length)];
      colorsLight[i * 3]     = cl.r;
      colorsLight[i * 3 + 1] = cl.g;
      colorsLight[i * 3 + 2] = cl.b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aScale", new THREE.BufferAttribute(scales, 1));
    geo.setAttribute("aColorDark", new THREE.BufferAttribute(colorsDark, 3));
    geo.setAttribute("aColorLight", new THREE.BufferAttribute(colorsLight, 3));

    return { geometry: geo };
  }, []);

  // Sichqonchani silliq taqib qilish asbobi
  const mouseTarget = useRef(new THREE.Vector2(0, 0));

  useFrame((state) => {
    if (!materialRef.current) return;
    const now = state.clock.getElapsedTime();
    
    // Interpolation orqali silliq harakat (easing)
    mouseTarget.current.lerp(mouse, 0.05);

    materialRef.current.uniforms.uTime.value = now;
    materialRef.current.uniforms.uMouse.value.copy(mouseTarget.current);
    
    // Tema almashinuvi silliq bo'lishi
    const targetTheme = isDark ? 0.0 : 1.0;
    materialRef.current.uniforms.uTheme.value = THREE.MathUtils.lerp(
      materialRef.current.uniforms.uTheme.value,
      targetTheme,
      0.05
    );

    if (pointsRef.current) {
      // Bulutning sekin aylanib turishi
      pointsRef.current.rotation.y = now * 0.04 + (mouseTarget.current.x * 0.15);
      pointsRef.current.rotation.x = (scroll * 0.001) - (mouseTarget.current.y * 0.15);
    }
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={{
          uTime: { value: 0 },
          uMouse: { value: new THREE.Vector2(0, 0) },
          uTheme: { value: isDark ? 0.0 : 1.0 },
        }}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

export default function DOFLinesAnimation({ theme }) {
  const isDark = theme === "dark";
  const bg = isDark ? "#020617" : "#f1f5f9";
  const overlay = isDark ? "rgba(2, 6, 23, 0.85)" : "rgba(241, 245, 249, 0.8)";
  
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
        background: bg,
        transition: "background 0.5s ease-in-out",
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 30], fov: 45, near: 1, far: 200 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        dpr={[1, 2]}
      >
        <ParticleField isDark={isDark} />
      </Canvas>
      
      {/* Vinyetka effekti markazni ochroq, chetlarni qoramtir qiladi */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: "radial-gradient(circle at 50% 50%, transparent 0%, " + overlay + " 100%)",
          pointerEvents: "none",
          zIndex: 1,
          transition: "background 0.5s ease-in-out",
        }}
      />
    </div>
  );
}

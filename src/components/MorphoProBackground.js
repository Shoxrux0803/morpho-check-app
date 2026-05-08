import React, { Suspense, useMemo, useRef, useEffect } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Outlines, Environment, useTexture } from "@react-three/drei";
import { Physics, useSphere } from "@react-three/cannon";
import { EffectComposer, N8AO, SMAA, Bloom } from "@react-three/postprocessing";

const rfs = THREE.MathUtils.randFloatSpread;

function Clump({ isDark, pathname, mat = new THREE.Matrix4(), vec = new THREE.Vector3() }) {
  // Generate a dynamic "M" texture that changes based on theme
  const mTexture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");

    // Pitch black background in dark mode, white in light mode
    ctx.fillStyle = isDark ? "#000000" : "#ffffff";
    ctx.fillRect(0, 0, 512, 512);

    // White M in dark mode, black M in light mode
    ctx.fillStyle = isDark ? "#ffffff" : "#000000";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    // Reduced font size to make the 'M' smaller
    ctx.font = "900 200px sans-serif";
    ctx.fillText("M", 256, 280);

    const tex = new THREE.CanvasTexture(canvas);
    tex.anisotropy = 16;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }, [isDark]);

  // Create material ONCE to prevent remounting the Physics InstancedMesh
  const baubleMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: "white", // Color stays white, the texture provides the pitch black color
      roughness: 0,
      envMapIntensity: 1,
    });
  }, []);

  // Update reflections dynamically without changing the object reference
  useEffect(() => {
    // 0.05 is almost pitch black, completely eliminating the "silver" look
    baubleMaterial.envMapIntensity = isDark ? 0.05 : 1.0;
  }, [isDark, baubleMaterial]);

  const sphereGeometry = useMemo(() => new THREE.SphereGeometry(1, 32, 32), []);

  const [ref, api] = useSphere(() => ({
    args: [1],
    mass: 1,
    angularDamping: 0.1,
    linearDamping: 0.65,
    sleepSpeedLimit: 1,
    sleepTimeLimit: 1,
    position: [rfs(20), rfs(20), rfs(20)],
  }));

  // Trigger a seamless explosion effect when navigating between pages!
  // We increase the delay slightly to ensure the heavy DOM work is done first.
  useEffect(() => {
    if (pathname) {
      const timer = setTimeout(() => {
        for (let i = 0; i < 35; i++) {
          // Slightly fewer spheres for better performance
          api
            .at(i)
            .applyImpulse(
              [(Math.random() - 0.5) * 35, (Math.random() - 0.5) * 35, (Math.random() - 0.5) * 35],
              [0, 0, 0],
            );
        }
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [pathname, api]);

  useFrame((state) => {
    // Apply center force only to active (non-sleeping) bodies to save CPU
    for (let i = 0; i < 35; i++) {
      ref.current.getMatrixAt(i, mat);
      vec.setFromMatrixPosition(mat);
      if (vec.length() > 0.1) {
        api.at(i).applyForce(vec.normalize().multiplyScalar(-35).toArray(), [0, 0, 0]);
      }
    }
  });

  return (
    <instancedMesh
      ref={ref}
      castShadow
      receiveShadow
      args={[sphereGeometry, baubleMaterial, 35]}
      material-map={mTexture}
    >
      <Outlines thickness={0.0} color={isDark ? "white" : "black"} />
    </instancedMesh>
  );
}

function Pointer({ mouseGlobal, isDark }) {
  const viewport = useThree((state) => state.viewport);
  const [ref, api] = useSphere(() => ({ type: "Kinematic", args: [3], position: [0, 0, 0] }));

  useFrame((state) => {
    api.position.set(
      (mouseGlobal.current.x * viewport.width) / 2,
      (mouseGlobal.current.y * viewport.height) / 2,
      0,
    );
  });

  return (
    <mesh ref={ref} visible={false}>
      <sphereGeometry args={[3]} />
    </mesh>
  );
}

function ProCamera({ mouseGlobal }) {
  useFrame((state) => {
    const scrollY = window.scrollY;
    const targetY = scrollY * -0.015 + mouseGlobal.current.y * 2;
    const targetX = mouseGlobal.current.x * 2;

    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, targetY, 0.05);
    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, targetX, 0.05);
    state.camera.lookAt(0, 0, 0);
  });
  return null;
}

const particleVertexShader = `
uniform float uTime;
attribute float aSize;
attribute float aSpeed;
varying vec3 vColor;
varying float vAlpha;
void main() {
  vec3 p = position;
  float t = uTime * 0.1 * aSpeed;
  p.x += sin(t + position.z) * 2.0;
  p.y += cos(t + position.x) * 2.0;
  p.z += sin(t * 0.5) * 5.0;
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  gl_PointSize = aSize * (150.0 / -mvPosition.z);
  vColor = color;
  vAlpha = smoothstep(100.0, 10.0, -mvPosition.z);
}
`;
const particleFragmentShader = `
varying vec3 vColor;
varying float vAlpha;
void main() {
  if (length(gl_PointCoord - 0.5) > 0.5) discard;
  gl_FragColor = vec4(vColor, vAlpha * 0.3);
}
`;

function BackgroundAtmosphere({ isDark }) {
  const pointsRef = useRef();
  const count = 1000;

  // Create geometry once to prevent remounting
  const geometry = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const speeds = new Float32Array(count);
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 100;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 100;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 100;
      sizes[i] = Math.random() * 2.0 + 0.5;
      speeds[i] = 0.2 + Math.random();
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute("aSpeed", new THREE.BufferAttribute(speeds, 1));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return geo;
  }, []);

  // Safely update colors without replacing the geometry object
  useEffect(() => {
    const colorObj = isDark ? new THREE.Color("#6366f1") : new THREE.Color("#2563eb");
    const colors = geometry.attributes.color.array;
    for (let i = 0; i < count; i++) {
      colors[i * 3] = colorObj.r;
      colors[i * 3 + 1] = colorObj.g;
      colors[i * 3 + 2] = colorObj.b;
    }
    geometry.attributes.color.needsUpdate = true;
  }, [isDark, geometry]);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.getElapsedTime() * 0.02;
      pointsRef.current.material.uniforms.uTime.value = state.clock.getElapsedTime();
    }
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <shaderMaterial
        vertexShader={particleVertexShader}
        fragmentShader={particleFragmentShader}
        uniforms={{ uTime: { value: 0 } }}
        transparent
        depthWrite={false}
        vertexColors
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

export default function MorphoProBackground({ theme, pathname }) {
  const isDark = theme === "dark";
  const bg = isDark ? "#020617" : "#dfdfdf";

  const mouseGlobal = useRef(new THREE.Vector2(0, 0));

  useEffect(() => {
    const handleMouseMove = (e) => {
      mouseGlobal.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseGlobal.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: -1,
        pointerEvents: "none",
        background: bg,
        overflow: "hidden",
        transition: "background 1s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      <Canvas
        shadows
        gl={{ antialias: false, alpha: true }}
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 20], fov: 35, near: 1, far: 100 }}
      >
        <Suspense fallback={null}>
          <ProCamera mouseGlobal={mouseGlobal} />

          <ambientLight intensity={0.5} />
          <spotLight
            intensity={1}
            angle={0.2}
            penumbra={1}
            position={[30, 30, 30]}
            castShadow
            shadow-mapSize={[512, 512]}
          />

          <BackgroundAtmosphere isDark={isDark} />

          <Physics gravity={[0, 2, 0]} iterations={5} allowSleep>
            <Pointer mouseGlobal={mouseGlobal} isDark={isDark} />
            <Clump isDark={isDark} pathname={pathname} />
          </Physics>

          <Environment files="/adamsbridge.hdr" />

          <EffectComposer disableNormalPass multisampling={0}>
            <N8AO
              halfRes
              color="black"
              aoRadius={2}
              intensity={1}
              aoSamples={6}
              denoiseSamples={4}
            />
            <Bloom mipmapBlur levels={7} intensity={isDark ? 1.5 : 1} />
            <SMAA />
          </EffectComposer>
        </Suspense>
      </Canvas>
      {/* Premium Pro Overlays & Glassmorphism Blur */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: isDark
            ? "radial-gradient(circle at 50% 50%, rgba(2, 6, 23, 0.2) 0%, rgba(2, 6, 23, 0.8) 100%)"
            : "radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.2) 0%, rgba(223, 223, 223, 0.8) 100%)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          opacity: isDark ? 0.05 : 0.03,
          mixBlendMode: "overlay",
          pointerEvents: "none",
          zIndex: 2,
        }}
      />
    </div>
  );
}

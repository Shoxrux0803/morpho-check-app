import React, { Suspense, useMemo, useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Outlines } from '@react-three/drei';
import { Physics, useSphere } from '@react-three/cannon';

const rfs = THREE.MathUtils.randFloatSpread;
const CLUMP_COUNT = 24;

function Clump({
  isDark,
  pathname,
  mat = new THREE.Matrix4(),
  vec = new THREE.Vector3(),
}) {
  // Generate a dynamic "M" texture that changes based on theme
  const mTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Pitch black background in dark mode, white in light mode
    ctx.fillStyle = isDark ? '#000000' : '#ffffff';
    ctx.fillRect(0, 0, 512, 512);

    // White M in dark mode, black M in light mode
    ctx.fillStyle = isDark ? '#ffffff' : '#000000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // Reduced font size to make the 'M' smaller
    ctx.font = '900 200px sans-serif';
    ctx.fillText('M', 256, 280);

    const tex = new THREE.CanvasTexture(canvas);
    tex.anisotropy = 4;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }, [isDark]);

  // Create material ONCE to prevent remounting the Physics InstancedMesh
  const baubleMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: 'white', // Color stays white, the texture provides the pitch black color
      roughness: 0,
      envMapIntensity: 1,
    });
  }, []);

  // Update reflections dynamically without changing the object reference
  useEffect(() => {
    // 0.05 is almost pitch black, completely eliminating the "silver" look
    baubleMaterial.envMapIntensity = isDark ? 0.05 : 1.0;
  }, [isDark, baubleMaterial]);

  const sphereGeometry = useMemo(() => new THREE.SphereGeometry(1, 20, 20), []);

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
        for (let i = 0; i < CLUMP_COUNT; i++) {
          // Slightly fewer spheres for better performance
          api
            .at(i)
            .applyImpulse(
              [
                (Math.random() - 0.5) * 35,
                (Math.random() - 0.5) * 35,
                (Math.random() - 0.5) * 35,
              ],
              [0, 0, 0]
            );
        }
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [pathname, api]);

  useFrame((state) => {
    // Apply center force only to active (non-sleeping) bodies to save CPU
    for (let i = 0; i < CLUMP_COUNT; i++) {
      ref.current.getMatrixAt(i, mat);
      vec.setFromMatrixPosition(mat);
      if (vec.length() > 0.1) {
        api
          .at(i)
          .applyForce(vec.normalize().multiplyScalar(-35).toArray(), [0, 0, 0]);
      }
    }
  });

  return (
    <instancedMesh
      ref={ref}
      args={[sphereGeometry, baubleMaterial, CLUMP_COUNT]}
      material-map={mTexture}
    >
      <Outlines thickness={0.0} color={isDark ? 'white' : 'black'} />
    </instancedMesh>
  );
}

function Pointer({ mouseGlobal, isDark }) {
  const viewport = useThree((state) => state.viewport);
  const [ref, api] = useSphere(() => ({
    type: 'Kinematic',
    args: [3],
    position: [0, 0, 0],
  }));

  useFrame((state) => {
    api.position.set(
      (mouseGlobal.current.x * viewport.width) / 2,
      (mouseGlobal.current.y * viewport.height) / 2,
      0
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

    state.camera.position.y = THREE.MathUtils.lerp(
      state.camera.position.y,
      targetY,
      0.05
    );
    state.camera.position.x = THREE.MathUtils.lerp(
      state.camera.position.x,
      targetX,
      0.05
    );
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
  const count = 450;

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
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geo;
  }, []);

  // Safely update colors without replacing the geometry object
  useEffect(() => {
    const colorObj = isDark
      ? new THREE.Color('#6366f1')
      : new THREE.Color('#2563eb');
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
      pointsRef.current.material.uniforms.uTime.value =
        state.clock.getElapsedTime();
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

function WebGLContextGuard({ onContextLost }) {
  const gl = useThree((state) => state.gl);

  useEffect(() => {
    const canvas = gl.domElement;
    const handleContextLost = (event) => {
      event.preventDefault();
      onContextLost();
    };

    canvas.addEventListener('webglcontextlost', handleContextLost, false);
    return () =>
      canvas.removeEventListener('webglcontextlost', handleContextLost, false);
  }, [gl, onContextLost]);

  return null;
}

function SoftMeshGridBackground({ isDark }) {
  const base = isDark
    ? 'linear-gradient(135deg, #020617 0%, #07111f 46%, #0b1726 100%)'
    : 'linear-gradient(135deg, #f8fbff 0%, #eef8fb 45%, #f7fbf8 100%)';

  const gridColor = isDark
    ? 'rgba(148, 163, 184, 0.13)'
    : 'rgba(15, 118, 110, 0.12)';
  const gridAccent = isDark
    ? 'rgba(34, 211, 238, 0.08)'
    : 'rgba(37, 99, 235, 0.06)';

  return (
    <>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: base,
          transition: 'background 800ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: isDark
            ? 'radial-gradient(circle at 12% 18%, rgba(45, 212, 191, 0.30), transparent 31%), radial-gradient(circle at 84% 10%, rgba(59, 130, 246, 0.26), transparent 30%), radial-gradient(circle at 72% 78%, rgba(34, 197, 94, 0.20), transparent 34%), radial-gradient(circle at 38% 64%, rgba(125, 211, 252, 0.14), transparent 28%)'
            : 'radial-gradient(circle at 12% 18%, rgba(14, 165, 233, 0.28), transparent 31%), radial-gradient(circle at 84% 10%, rgba(20, 184, 166, 0.24), transparent 30%), radial-gradient(circle at 72% 78%, rgba(34, 197, 94, 0.20), transparent 34%), radial-gradient(circle at 38% 64%, rgba(59, 130, 246, 0.12), transparent 28%)',
          backgroundSize: '125% 125%',
          filter: 'blur(16px)',
          transform: 'scale(1.1)',
          animation: 'morphoMeshPulse 9s ease-in-out infinite alternate',
          opacity: isDark ? 0.92 : 1,
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `linear-gradient(${gridColor} 1px, transparent 1px), linear-gradient(90deg, ${gridColor} 1px, transparent 1px), linear-gradient(${gridAccent} 1px, transparent 1px), linear-gradient(90deg, ${gridAccent} 1px, transparent 1px)`,
          backgroundSize: '48px 48px, 48px 48px, 192px 192px, 192px 192px',
          maskImage:
            'linear-gradient(to bottom, rgba(0,0,0,0.76), rgba(0,0,0,0.38) 42%, transparent 92%)',
          WebkitMaskImage:
            'linear-gradient(to bottom, rgba(0,0,0,0.76), rgba(0,0,0,0.38) 42%, transparent 92%)',
          opacity: isDark ? 0.58 : 0.68,
          animation: 'morphoGridPan 14s linear infinite',
        }}
      />
      <WaveDotField isDark={isDark} />
      <div
        style={{
          position: 'absolute',
          inset: '-20%',
          background:
            'linear-gradient(115deg, transparent 18%, rgba(255,255,255,0.10) 34%, rgba(255,255,255,0.20) 42%, rgba(255,255,255,0.08) 50%, transparent 66%)',
          mixBlendMode: isDark ? 'screen' : 'soft-light',
          opacity: isDark ? 0.42 : 0.5,
          transform: 'translateX(-34%) rotate(0.001deg)',
          animation: 'morphoLightSweep 7s ease-in-out infinite',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: isDark
            ? 'linear-gradient(180deg, rgba(2, 6, 23, 0.06) 0%, rgba(2, 6, 23, 0.56) 100%)'
            : 'linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.72) 100%)',
        }}
      />
      <style>
        {`
          @keyframes morphoMeshPulse {
            0% {
              transform: scale(1.1) translate3d(-2.5%, -1.8%, 0);
              background-position: 0% 35%;
              opacity: ${isDark ? 0.76 : 0.82};
            }
            50% {
              transform: scale(1.16) translate3d(2.5%, 1.5%, 0);
              background-position: 70% 45%;
              opacity: 1;
            }
            100% {
              transform: scale(1.12) translate3d(0.5%, 2.2%, 0);
              background-position: 100% 75%;
              opacity: ${isDark ? 0.88 : 0.94};
            }
          }

          @keyframes morphoGridPan {
            from { background-position: 0 0, 0 0, 0 0, 0 0; }
            to { background-position: 48px 48px, 48px 48px, 192px 192px, 192px 192px; }
          }

          @keyframes morphoLightSweep {
            0%, 24% { transform: translateX(-42%) rotate(0.001deg); opacity: 0; }
            45% { opacity: ${isDark ? 0.42 : 0.5}; }
            72%, 100% { transform: translateX(42%) rotate(0.001deg); opacity: 0; }
          }

          @media (prefers-reduced-motion: reduce) {
            * {
              animation-duration: 1ms !important;
              animation-iteration-count: 1 !important;
            }
          }
        `}
      </style>
    </>
  );
}

function WaveDotField({ isDark }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d', { alpha: true });

    if (!canvas || !ctx) return undefined;

    const pointer = { x: 0, y: 0 };
    const camera = { x: 0, y: 70, z: 122 };
    const separation = 185;
    const amountX = window.innerWidth < 760 ? 52 : 92;
    const amountY = window.innerWidth < 760 ? 48 : 78;
    const palette = isDark
      ? {
        dot: [103, 232, 249],
        accent: [45, 212, 191],
        line: [59, 130, 246],
      }
      : {
        dot: [14, 116, 144],
        accent: [20, 184, 166],
        line: [37, 99, 235],
      };

    let width = 0;
    let height = 0;
    let dpr = 1;
    let frameId;
    let count = 0;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const handlePointerMove = (event) => {
      pointer.x += ((event.clientX - width / 2) / width - pointer.x) * 0.35;
      pointer.y += ((event.clientY - height / 2) / height - pointer.y) * 0.35;
    };

    const project = (x, y, z) => {
      const tilt = -1.12 + pointer.y * 0.045;
      const yaw = pointer.x * 0.08;
      const cosTilt = Math.cos(tilt);
      const sinTilt = Math.sin(tilt);
      const cosYaw = Math.cos(yaw);
      const sinYaw = Math.sin(yaw);

      const yawX = x * cosYaw - z * sinYaw;
      const yawZ = x * sinYaw + z * cosYaw;
      const tiltY = y * cosTilt - yawZ * sinTilt;
      const tiltZ = y * sinTilt + yawZ * cosTilt;
      const depth = tiltZ + 5200;
      const scale = 980 / depth;

      return {
        x: width / 2 + yawX * scale,
        y: height * 0.56 + (tiltY - camera.y) * scale,
        scale,
        depth,
      };
    };

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      const points = [];
      let index = 0;

      for (let ix = 0; ix < amountX; ix += 1) {
        points[ix] = [];

        for (let iy = 0; iy < amountY; iy += 1) {
          const x = (ix - (amountX - 1) / 2) * separation;
          const z = (iy - (amountY - 1) / 2) * separation;
          const waveY =
            Math.sin((ix + count) * 0.3) * 50 +
            Math.sin((iy + count) * 0.5) * 50 +
            Math.sin((ix + iy + count) * 0.16) * 24;
          const pulse =
            (Math.sin((ix + count) * 0.3) + 1) * 3.1 +
            (Math.sin((iy + count) * 0.5) + 1) * 3.1;
          const projected = project(x, waveY, z);
          const depthFade = Math.max(
            0,
            Math.min(1, 1 - (projected.depth - 3700) / 3600)
          );
          const verticalFade = Math.max(
            0,
            Math.min(1, (projected.y - height * 0.25) / (height * 0.3))
          );
          const edgeFade = Math.max(
            0,
            Math.min(
              1,
              Math.min(
                projected.x / (width * 0.16),
                (width - projected.x) / (width * 0.16)
              )
            )
          );
          const horizonFade = Math.max(
            0.16,
            Math.min(1, (projected.y - height * 0.32) / (height * 0.28))
          );
          const alpha =
            depthFade *
            verticalFade *
            edgeFade *
            horizonFade *
            (isDark ? 0.68 : 0.5);
          const radius = Math.max(0.42, pulse * projected.scale * 2.05);

          points[ix][iy] = { ...projected, alpha, radius };

          if (
            projected.x > -width * 0.18 &&
            projected.x < width * 1.18 &&
            projected.y > -30 &&
            projected.y < height + 30
          ) {
            const color = index % 5 === 0 ? palette.accent : palette.dot;
            ctx.fillStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${alpha})`;
            ctx.beginPath();
            ctx.arc(projected.x, projected.y, radius, 0, Math.PI * 2);
            ctx.fill();
          }

          index += 1;
        }
      }

      ctx.lineWidth = 0.7;

      for (let ix = 0; ix < amountX; ix += 1) {
        for (let iy = 0; iy < amountY; iy += 1) {
          const point = points[ix][iy];
          const right = points[ix + 1]?.[iy];
          const down = points[ix]?.[iy + 1];

          for (const next of [right, down]) {
            if (!next) continue;

            const alpha =
              Math.min(point.alpha, next.alpha) * (isDark ? 0.07 : 0.045);
            ctx.strokeStyle = `rgba(${palette.line[0]}, ${palette.line[1]}, ${palette.line[2]}, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(point.x, point.y);
            ctx.lineTo(next.x, next.y);
            ctx.stroke();
          }
        }
      }

      count += 0.075;
      frameId = window.requestAnimationFrame(animate);
    };

    resize();
    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('pointermove', handlePointerMove, {
      passive: true,
    });
    frameId = window.requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', handlePointerMove);
      window.cancelAnimationFrame(frameId);
    };
  }, [isDark]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        opacity: isDark ? 0.74 : 0.58,
        maskImage:
          'linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%), linear-gradient(to bottom, transparent 0%, transparent 18%, rgba(0,0,0,0.65) 34%, black 100%)',
        WebkitMaskImage:
          'linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%), linear-gradient(to bottom, transparent 0%, transparent 18%, rgba(0,0,0,0.65) 34%, black 100%)',
        maskComposite: 'intersect',
        WebkitMaskComposite: 'source-in',
        mixBlendMode: isDark ? 'screen' : 'multiply',
      }}
    />
  );
}

function SphereBackground({ isDark, pathname }) {
  const bg = isDark ? '#020617' : '#dfdfdf';
  const [contextLost, setContextLost] = useState(false);

  const mouseGlobal = useRef(new THREE.Vector2(0, 0));

  useEffect(() => {
    const handleMouseMove = (e) => {
      mouseGlobal.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseGlobal.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
        pointerEvents: 'none',
        background: bg,
        overflow: 'hidden',
        transition: 'background 1s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {!contextLost && (
        <Canvas
          gl={{
            antialias: false,
            alpha: true,
            stencil: false,
            powerPreference: 'low-power',
          }}
          dpr={1}
          camera={{ position: [0, 0, 20], fov: 35, near: 1, far: 100 }}
        >
          <Suspense fallback={null}>
            <WebGLContextGuard onContextLost={() => setContextLost(true)} />
            <ProCamera mouseGlobal={mouseGlobal} />

            <ambientLight intensity={0.5} />
            <spotLight
              intensity={1}
              angle={0.2}
              penumbra={1}
              position={[30, 30, 30]}
            />

            <BackgroundAtmosphere isDark={isDark} />

            <Physics gravity={[0, 2, 0]} iterations={5} allowSleep>
              <Pointer mouseGlobal={mouseGlobal} isDark={isDark} />
              <Clump isDark={isDark} pathname={pathname} />
            </Physics>

            <Environment files="/adamsbridge.hdr" />
          </Suspense>
        </Canvas>
      )}
      {/* Premium Pro Overlays & Glassmorphism Blur */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: isDark
            ? 'radial-gradient(circle at 50% 50%, rgba(2, 6, 23, 0.2) 0%, rgba(2, 6, 23, 0.8) 100%)'
            : 'radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.2) 0%, rgba(223, 223, 223, 0.8) 100%)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          opacity: isDark ? 0.05 : 0.03,
          mixBlendMode: 'overlay',
          pointerEvents: 'none',
          zIndex: 2,
        }}
      />
    </div>
  );
}

export default function MorphoProBackground({
  theme,
  pathname,
  variant = 'mesh-grid',
}) {
  const isDark = theme === 'dark';

  if (variant === 'sphere') {
    return <SphereBackground isDark={isDark} pathname={pathname} />;
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      <SoftMeshGridBackground isDark={isDark} />
    </div>
  );
}

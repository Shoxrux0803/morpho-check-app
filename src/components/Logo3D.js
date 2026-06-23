import React from 'react';
import { Box, useMediaQuery } from '@mui/material';
import { motion, useMotionValue, useTransform, useSpring, useMotionTemplate } from 'framer-motion';
import logo from '../assets/morphocheck-logo.svg';

export default function Logo3D({ mode, colorPalette }) {
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)');
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 80, damping: 26 });
  const mouseYSpring = useSpring(y, { stiffness: 80, damping: 26 });

  // Greatly decreased tilt range to 6deg for an extremely subtle, premium micro-interaction
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['6deg', '-6deg']);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-6deg', '6deg']);

  // Map mouse positions to percentages for the gradient center
  const px = useTransform(mouseXSpring, (xVal) => 50 + xVal * 60);
  const py = useTransform(mouseYSpring, (yVal) => 50 + yVal * 60);

  // Define templates unconditionally at the top level
  const darkBg = useMotionTemplate`radial-gradient(circle at ${px}% ${py}%, rgba(255, 255, 255, 0.32) 0%, rgba(255, 255, 255, 0.08) 25%, rgba(12, 20, 34, 0.6) 65%, rgba(12, 20, 34, 0.95) 100%)`;
  const lightBg = useMotionTemplate`radial-gradient(circle at ${px}% ${py}%, rgba(255, 255, 255, 0.98) 0%, rgba(255, 255, 255, 0.65) 30%, rgba(255, 255, 255, 0.35) 70%, rgba(255, 255, 255, 0.15) 100%)`;

  const glassBg = mode === 'dark' ? darkBg : lightBg;

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const colors = colorPalette || ['#5eead4', '#7dd3fc', '#ffffff'];
  const layersCount = 24; // Number of layers for logo extrusion

  return (
    <Box
      sx={{
        width: '100%',
        height: { xs: 350, sm: 450, md: 550 },
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        perspective: '1200px',
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <Box
        component={motion.div}
        style={{
          rotateX: reduced ? 0 : rotateX,
          rotateY: reduced ? 0 : rotateY,
          transformStyle: 'preserve-3d',
        }}
        animate={reduced ? undefined : { y: [-6, 6, -6] }} // Reduced float range to 6px
        transition={
          reduced
            ? undefined
            : { duration: 6, repeat: Infinity, ease: 'easeInOut' }
        }
        sx={{
          position: 'relative',
          width: { xs: 220, sm: 280, md: 340 }, // Frame size
          height: { xs: 220, sm: 280, md: 340 },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Base Layer: Backdrop Blur (heavy performance element applied ONLY here) */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            borderRadius: { xs: 5, md: 7 },
            bgcolor: mode === 'dark' ? 'rgba(12,20,34,0.45)' : 'rgba(255,255,255,0.35)',
            backdropFilter: 'blur(40px) saturate(250%)', // Increased blur and saturation
            border: `1px solid ${mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.35)'}`,
            boxShadow: `0 30px 60px ${mode === 'dark' ? 'rgba(0,0,0,0.5)' : 'rgba(15,50,70,0.2)'}`,
            transform: 'translateZ(0px)',
            '&::before': {
              content: '""',
              position: 'absolute',
              inset: '-20%',
              background: `radial-gradient(circle, ${colors[0]}35 0%, transparent 65%)`,
              filter: 'blur(40px)',
              transform: 'translateZ(-40px)',
              borderRadius: '50%',
              pointerEvents: 'none',
            },
          }}
        />

        {/* 3D Glass Slab Thickness Layers (stacked transparent border shells) */}
        {!reduced && Array.from({ length: 6 }).map((_, i) => {
          const zOffset = (i + 1) * 5; // 5px to 30px thickness
          return (
            <Box
              key={i}
              aria-hidden="true"
              sx={{
                position: 'absolute',
                inset: 0,
                borderRadius: { xs: 5, md: 7 },
                // Create solid edge highlights using stacked fine borders
                border: `1.5px solid ${mode === 'dark' ? `rgba(255,255,255,${0.04 + i * 0.02})` : `rgba(255,255,255,${0.12 + i * 0.05})`}`,
                bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.005)' : 'rgba(255,255,255,0.02)',
                transform: `translateZ(${zOffset}px)`,
                pointerEvents: 'none',
              }}
            />
          );
        })}

        {/* Front Glass Face: Specular Refraction & Fluid Flow */}
        <Box
          component={motion.div}
          style={{
            background: glassBg,
            transform: 'translateZ(30px)',
          }}
          sx={{
            position: 'absolute',
            inset: 0,
            borderRadius: { xs: 5, md: 7 },
            border: `1.5px solid ${mode === 'dark' ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.95)'}`, // Sharper outer border
            boxShadow: mode === 'dark'
              ? `inset 0 2px 4px rgba(255,255,255,0.25), inset 0 -2px 4px rgba(0,0,0,0.3)`
              : `inset 0 2px 4px rgba(255,255,255,0.7), inset 0 -2px 4px rgba(0,0,0,0.1)`,
            pointerEvents: 'none',
            overflow: 'hidden',
          }}
        >
          {/* Flowing Liquid Glass Gradient Overlay (Intensified liquid effect) */}
          <Box
            component={motion.div}
            animate={{
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            sx={{
              position: 'absolute',
              inset: 0,
              opacity: mode === 'dark' ? 0.25 : 0.38, // Increased opacity for richer liquid look
              backgroundImage: `linear-gradient(225deg, ${colors[0]} 0%, ${colors[1]} 45%, rgba(255, 255, 255, 0.4) 75%, transparent 100%)`,
              backgroundSize: '200% 200%',
              mixBlendMode: 'overlay',
            }}
          />
        </Box>

        {/* Volumetric 3D Extrusion Logo (hovering above the glass slab) */}
        {Array.from({ length: layersCount }).map((_, i) => {
          const isLast = i === layersCount - 1;
          const zOffset = i * 1.2; // 1.2px step between logo layers
          
          return (
            <Box
              key={i}
              component="img"
              src={logo}
              alt={isLast ? "MorphoCheck Logo" : ""}
              aria-hidden={!isLast}
              sx={{
                position: 'absolute',
                width: { xs: 130, sm: 160, md: 200 }, // Logo size
                height: { xs: 130, sm: 160, md: 200 },
                objectFit: 'contain',
                // Hover the logo layers starting from 75px on top of the 30px thick frame
                transform: `translateZ(${75 + zOffset}px) scale(1.15)`,
                // Darken bottom layers to simulate ambient occlusion / extrusion shadow
                filter: isLast
                  ? `drop-shadow(0px 25px 35px rgba(0,0,0,0.55)) drop-shadow(0px 0px 30px ${colors[1]}80)`
                  : `brightness(${0.15 + (i / layersCount) * 0.85}) contrast(${1 + (i / layersCount) * 0.15})`,
                pointerEvents: isLast ? 'auto' : 'none',
              }}
            />
          );
        })}
      </Box>
    </Box>
  );
}

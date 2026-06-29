import React from 'react';
import { Box, Paper, alpha, useMediaQuery } from '@mui/material';
import { motion } from 'framer-motion';
import logo from '../assets/morphocheck-logo.svg';

const orbitDots = [
  { size: 14, color: '#5eead4', top: '7%', left: '25%' },
  { size: 9, color: '#7dd3fc', top: '77%', left: '88%' },
  { size: 7, color: '#ffffff', top: '42%', left: '-1%' },
];
export default function GrowthGalaxy({ mode, colorPalette }) {
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)');
  const dark = mode === 'dark';

  const defaultColors = ['#5eead4', '#7dd3fc', '#ffffff'];
  const colors = colorPalette || defaultColors;

  const dynamicOrbitDots = [
    { size: 14, color: colors[0] || defaultColors[0], top: '7%', left: '25%' },
    { size: 9, color: colors[1] || defaultColors[1], top: '77%', left: '88%' },
    { size: 7, color: colors[2] || defaultColors[2], top: '42%', left: '-1%' },
  ];

  return (
    <Paper
      elevation={0}
      sx={{
        position: 'relative',
        height: { xs: 510, sm: 590, md: 650 },
        overflow: 'hidden',
        borderRadius: { xs: 4, md: 6 },
        bgcolor: dark ? 'rgba(12,20,34,.78)' : 'rgba(255,255,255,.72)',
        backdropFilter: 'blur(28px) saturate(160%)',
        border: `1px solid ${dark ? 'rgba(255,255,255,.12)' : 'rgba(255,255,255,.82)'}`,
        boxShadow: dark
          ? '0 36px 100px rgba(0,0,0,.42)'
          : '0 36px 100px rgba(15,50,70,.18)',
        p: { xs: 1.25, sm: 1.6 },
      }}
    >
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          borderRadius: { xs: 3.2, md: 5 },
          background: `radial-gradient(circle at 22% 20%, ${colors[0]}40, transparent 28%), radial-gradient(circle at 82% 82%, ${colors[1]}40, transparent 31%), linear-gradient(145deg, ${colors[2]}20 0%, ${colors[0]}30 48%, ${colors[1]}20 100%)`,
          isolation: 'isolate',
        }}
      >
        <Box
          component={motion.div}
          animate={
            reduced ? undefined : { x: [0, 24, -8, 0], y: [0, -18, 12, 0] }
          }
          transition={{ duration: 13, repeat: Infinity, ease: 'easeInOut' }}
          sx={{
            position: 'absolute',
            width: 290,
            height: 290,
            left: -125,
            top: -105,
            borderRadius: '50%',
            bgcolor: `${colors[0]}30`,
            filter: 'blur(7px)',
          }}
        />
        <Box
          component={motion.div}
          animate={
            reduced
              ? undefined
              : { scale: [0.9, 1.16, 0.9], rotate: [0, 35, 0] }
          }
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
          sx={{
            position: 'absolute',
            width: 330,
            height: 330,
            right: -160,
            bottom: -145,
            borderRadius: '42%',
            bgcolor: `${colors[1]}40`,
            filter: 'blur(10px)',
          }}
        />

        {Array.from({ length: 22 }).map((_, index) => (
          <Box
            key={index}
            component={motion.span}
            animate={
              reduced
                ? undefined
                : { opacity: [0.08, 0.62, 0.08], scale: [0.7, 1.3, 0.7] }
            }
            transition={{
              duration: 2.6 + (index % 5),
              delay: index * 0.17,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            sx={{
              position: 'absolute',
              width: index % 5 === 0 ? 3 : 2,
              height: index % 5 === 0 ? 3 : 2,
              borderRadius: '50%',
              bgcolor: '#fff',
              left: `${5 + ((index * 41) % 90)}%`,
              top: `${4 + ((index * 59) % 90)}%`,
            }}
          />
        ))}

        <Box
          sx={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: { xs: 390, sm: 500, md: 530 },
            height: { xs: 390, sm: 500, md: 530 },
            translate: '-50% -50%',
          }}
        >
          {[0, 1, 2].map((ring) => (
            <Box
              key={ring}
              component={motion.div}
              animate={
                reduced ? undefined : { rotate: ring === 1 ? -360 : 360 }
              }
              transition={{
                duration: [34, 25, 18][ring],
                repeat: Infinity,
                ease: 'linear',
              }}
              sx={{
                position: 'absolute',
                inset: ring * 58,
                borderRadius: '50%',
                border: `${ring === 1 ? 1.5 : 1}px ${ring === 2 ? 'dashed' : 'solid'} ${alpha('#fff', [0.2, 0.17, 0.22][ring])}`,
                transform: ring === 1 ? 'rotateX(64deg)' : undefined,
                boxShadow:
                  ring === 0
                    ? `inset 0 0 38px ${alpha(colors[0], 0.15)}`
                    : 'none',
              }}
            >
              {(ring === 0
                ? dynamicOrbitDots
                : dynamicOrbitDots.slice(0, 2)
              ).map((dot, index) => (
                <Box
                  key={dot.color}
                  component={motion.span}
                  animate={reduced ? undefined : { scale: [0.75, 1.3, 0.75] }}
                  transition={{ duration: 2 + index, repeat: Infinity }}
                  sx={{
                    position: 'absolute',
                    width: dot.size - ring * 2,
                    height: dot.size - ring * 2,
                    top: dot.top,
                    left: dot.left,
                    borderRadius: '50%',
                    bgcolor: dot.color,
                    boxShadow: `0 0 24px ${dot.color}`,
                  }}
                />
              ))}
            </Box>
          ))}

          <Box
            component={motion.div}
            animate={
              reduced
                ? undefined
                : { y: [-9, 9, -9], rotate: [-2, 2, -2], scale: [1, 1.035, 1] }
            }
            transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
            sx={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              translate: '-50% -50%',
              width: { xs: 132, sm: 164 },
              height: { xs: 132, sm: 164 },
              display: 'grid',
              placeItems: 'center',
              borderRadius: '36% 64% 58% 42% / 46% 38% 62% 54%',
              bgcolor: 'rgba(255,255,255,.14)',
              backdropFilter: 'blur(22px) saturate(170%)',
              border: '1px solid rgba(255,255,255,.3)',
              boxShadow: `inset 0 1px 1px rgba(255,255,255,.5), 0 30px 70px rgba(0,28,48,.38), 0 0 65px ${colors[0]}40`,
            }}
          >
            <Box
              component={motion.div}
              animate={
                reduced
                  ? undefined
                  : {
                      filter: [
                        `drop-shadow(0 8px 18px ${colors[1]}40)`,
                        `drop-shadow(0 12px 28px ${colors[0]}60)`,
                        `drop-shadow(0 8px 18px ${colors[1]}40)`,
                      ],
                    }
              }
              transition={{ duration: 4, repeat: Infinity }}
              sx={{ width: { xs: 78, sm: 98 } }}
            >
              <Box
                component="img"
                src={logo}
                alt=""
                sx={{ display: 'block', width: '100%' }}
              />
            </Box>
          </Box>
        </Box>

        <Box
          component={motion.div}
          animate={reduced ? undefined : { x: ['-120%', '220%'] }}
          transition={{
            duration: 7,
            repeat: Infinity,
            repeatDelay: 3,
            ease: 'easeInOut',
          }}
          sx={{
            position: 'absolute',
            width: '35%',
            height: '160%',
            top: '-30%',
            background:
              'linear-gradient(90deg,transparent,rgba(255,255,255,.07),transparent)',
            transform: 'rotate(18deg)',
            pointerEvents: 'none',
          }}
        />
      </Box>
    </Paper>
  );
}

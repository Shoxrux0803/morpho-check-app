import React from 'react';
import { Paper } from '@mui/material';

const GlassPaper = ({ children, sx = {} }) => (
  <Paper
    elevation={0}
    sx={{
      background: (theme) =>
        theme.palette.mode === 'dark'
          ? 'rgba(30,30,40,0.7)'
          : 'rgba(255,255,255,0.85)',
      backdropFilter: 'blur(20px)',
      borderRadius: 4,
      border: '1px solid',
      borderColor: (theme) =>
        theme.palette.mode === 'dark'
          ? 'rgba(255,255,255,0.08)'
          : 'rgba(0,0,0,0.05)',
      overflow: 'auto',
      '&::-webkit-scrollbar': {
        height: '6px',
        width: '6px',
      },
      '&::-webkit-scrollbar-track': {
        background: 'transparent',
      },
      '&::-webkit-scrollbar-thumb': {
        background: (theme) =>
          theme.palette.mode === 'dark'
            ? 'rgba(255,255,255,0.1)'
            : 'rgba(0,0,0,0.1)',
        borderRadius: '10px',
      },
      '&::-webkit-scrollbar-thumb:hover': {
        background: (theme) =>
          theme.palette.mode === 'dark'
            ? 'rgba(255,255,255,0.2)'
            : 'rgba(0,0,0,0.2)',
      },
      ...sx,
    }}
  >
    {children}
  </Paper>
);

const scrollableContentSx = {
  width: '100%',
  maxWidth: '100%',
  minWidth: 0,
  overflowX: 'auto',
  overflowY: 'visible',
  WebkitOverflowScrolling: 'touch',
  pb: 1,
  '&::-webkit-scrollbar': {
    height: '8px',
  },
  '&::-webkit-scrollbar-track': {
    background: 'transparent',
  },
  '&::-webkit-scrollbar-thumb': {
    background: (theme) =>
      theme.palette.mode === 'dark'
        ? 'rgba(255,255,255,0.14)'
        : 'rgba(99,102,241,0.22)',
    borderRadius: '10px',
  },
};

const blurActiveElement = () => {
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }
};

export { GlassPaper, scrollableContentSx, blurActiveElement };

// src/components/ui/MCField.jsx
import { styled } from '@mui/material/styles';
import TextField from '@mui/material/TextField';

export const MCTextField = styled(TextField)(({ theme }) => ({
  '& .MuiFormLabel-root': {
    position: 'static',
    transform: 'none',
    marginBottom: 6,
    fontWeight: 600,
    color: theme.palette.text.secondary,
  },
  '& .MuiInputBase-root': {
    borderRadius: 14,
    minHeight: 56,
    background:
      theme.palette.mode === 'light'
        ? 'rgba(255,255,255,0.9)'
        : 'rgba(255,255,255,0.06)',
    backdropFilter: 'saturate(130%) blur(6px)',
    boxShadow:
      theme.palette.mode === 'light'
        ? 'inset 0 0 0 1px rgba(0,0,0,.06)'
        : 'inset 0 0 0 1px rgba(255,255,255,.10)',
    transition: 'box-shadow .25s, border-color .25s',
  },
  '& .MuiOutlinedInput-notchedOutline': {
    border: '1px solid rgba(0,0,0,0.14)',
  },
  '& .Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: theme.palette.primary.main,
    borderWidth: 2,
  },
  // notch (legend) artefaktini to'liq yo'qotish
  '& .MuiOutlinedInput-root legend': {
    width: 0,
  },
  '& .MuiOutlinedInput-input': {
    padding: '16px 16px',
    fontSize: 16,
    lineHeight: 1.25,
  },
  '& .MuiInputAdornment-root': { marginRight: 8 },
}));

export const MCSelect = MCTextField;

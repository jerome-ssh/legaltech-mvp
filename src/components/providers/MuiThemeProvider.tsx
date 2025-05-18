'use client';

import * as React from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { PaletteMode } from '@mui/material';

const getDesignTokens = (mode: PaletteMode) => ({
  palette: {
    mode,
    ...(mode === 'light'
      ? {
          background: {
            default: '#f8fafc',
            paper: '#f0f6ff', // very light sky blue for cards
          },
          text: {
            primary: '#22223b',
            secondary: '#4a4e69',
          },
        }
      : {
          background: {
            default: 'linear-gradient(135deg, #1a2540 0%, #23315c 60%, #5a7bd7 90%, #ffffff 100%)',
            paper: '#f8fafd', // lightest blue for cards
          },
          text: {
            primary: '#22577A', // deep blue for text
            secondary: '#406882',
          },
        }),
  },
  shape: {
    borderRadius: 12,
  },
});

export const ColorModeContext = React.createContext({
  toggleColorMode: () => {},
  mode: 'light' as PaletteMode,
});

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = React.useState<PaletteMode>('light');
  const [mounted, setMounted] = React.useState(false);

  console.log('ThemeProvider render', { mode, mounted });

  React.useEffect(() => {
    console.log('ThemeProvider useEffect (mount)');
    const stored = typeof window !== 'undefined' ? localStorage.getItem('mui-theme-mode') : null;
    if (stored === 'light' || stored === 'dark') setMode(stored);
    else setMode('light'); // Always default to light for new users
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!mounted) return;
    console.log('ThemeProvider useEffect (mode change)', mode);
    localStorage.setItem('mui-theme-mode', mode);
    document.body.style.background = mode === 'dark'
      ? 'linear-gradient(135deg, #1a2540 0%, #23315c 60%, #5a7bd7 90%, #ffffff 100%)'
      : '';
    // Add or remove 'dark' class on <html> for Tailwind dark mode
    if (typeof window !== 'undefined') {
      const html = document.documentElement;
      if (mode === 'dark') {
        html.classList.add('dark');
      } else {
        html.classList.remove('dark');
      }
    }
  }, [mode, mounted]);

  const colorMode = React.useMemo(
    () => ({
      toggleColorMode: () => setMode((prev) => (prev === 'light' ? 'dark' : 'light')),
      mode,
    }),
    [mode]
  );

  const theme = React.useMemo(() => createTheme(getDesignTokens(mode)), [mode]);

  if (!mounted) return null;

  return (
    <ColorModeContext.Provider value={colorMode}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ColorModeContext.Provider>
  );
} 
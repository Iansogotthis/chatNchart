
import { useState, useEffect } from 'react';

type Theme = 'light' | 'dark' | 'grey' | 'almond';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme') as Theme;
      if (saved) return saved;
      
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    }
    return 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark', 'grey', 'almond');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);

    // Apply theme-specific colors
    const styles = {
      light: {
        '--background': '#FFFFFF',
        '--foreground': '#1A1A1A',
      },
      dark: {
        '--background': '#0A0A0A',
        '--foreground': '#D0D0D0',
        '--muted': 'rgba(217, 217, 217, 0.1)',
        '--muted-foreground': '#A0A0A0',
        '--card': '#141414',
        '--card-foreground': '#D0D0D0',
        '--border': '#2A2A2A',
        '--input': '#1A1A1A',
      },
      grey: {
        '--background': '#F5F5F5',
        '--foreground': '#2D2D2D',
      },
      almond: {
        '--background': '#FAF6F1',
        '--foreground': '#2D2D2D',
      }
    };

    Object.entries(styles[theme]).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });
  }, [theme]);

  return { theme, setTheme };
}

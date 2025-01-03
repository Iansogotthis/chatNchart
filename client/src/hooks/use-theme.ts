
import { useState, useEffect } from 'react';

type Theme = 'light' | 'dark';

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
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);

    const styles = {
      light: {
        '--background': '#FFFFFF',
        '--foreground': '#1A1A1A',
        '--muted': '#F5F5F5',
        '--muted-foreground': '#737373',
        '--card': '#FFFFFF',
        '--card-foreground': '#1A1A1A',
        '--border': '#E5E5E5',
        '--input': '#F5F5F5',
      },
      dark: {
        '--background': '#000000',
        '--foreground': '#FFFFFF',
        '--muted': '#111111',
        '--muted-foreground': '#D4D4D4',
        '--card': '#0A0A0A',
        '--card-foreground': '#FFFFFF',
        '--border': '#262626',
        '--input': '#111111',
      }
    };

    Object.entries(styles[theme]).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });
  }, [theme]);

  return { theme, setTheme };
}

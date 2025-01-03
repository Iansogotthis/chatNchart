
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
        '--background': '#FFFFE0',
        '--foreground': '#000000',
      },
      dark: {
        '--background': '#000000',
        '--foreground': '#FFFFFF',
      },
      grey: {
        '--background': '#808080',
        '--foreground': '#FFFFFF',
      },
      almond: {
        '--background': '#EFDECD',
        '--foreground': '#000000',
      }
    };

    Object.entries(styles[theme]).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });
  }, [theme]);

  return { theme, setTheme };
}

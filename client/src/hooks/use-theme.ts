import { useState, useEffect } from 'react';

type Theme = 'light' | 'dark' | 'grey' | 'almond';

type ThemeStyles = {
  [key in Theme]: {
    [key: string]: string;
  };
};

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme') as Theme;
      if (saved && (saved === 'light' || saved === 'dark' || saved === 'grey' || saved === 'almond')) return saved;
      
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

    const styles: ThemeStyles = {
      light: {
        '--background': '#FFFFFF',
        '--foreground': '#1A1A1A',
        '--muted': '#F5F5F5',
        '--muted-foreground': '#737373',
        '--card': '#FFFFFF',
        '--card-foreground': '#1A1A1A',
        '--border': '#E5E5E5',
        '--input': '#F5F5F5',
        '--accent': '#FFE44D', // Yellow accent for light theme
        '--accent-foreground': '#1A1A1A',
      },
      dark: {
        '--background': '0 0% 0%',
        '--foreground': '0 0% 100%',
        '--muted': '0 0% 7%',
        '--muted-foreground': '#D4D4D4',
        '--card': '#0A0A0A',
        '--card-foreground': '#FFFFFF',
        '--border': '#262626',
        '--input': '#111111',
        '--accent': '#9333EA', // Purple accent for dark theme
        '--accent-foreground': '#FFFFFF',
      },
      grey: {
        '--background': '#1E293B',
        '--foreground': '#FFFFFF',
        '--muted': '#334155',
        '--muted-foreground': '#94A3B8',
        '--card': '#1E293B',
        '--card-foreground': '#FFFFFF',
        '--border': '#334155',
        '--input': '#334155',
        '--accent': '#64748B', // Slate accent for grey theme
        '--accent-foreground': '#FFFFFF',
      },
      almond: {
        '--background': '#FFEDD5',
        '--foreground': '#451A03',
        '--muted': '#FED7AA',
        '--muted-foreground': '#9A3412',
        '--card': '#FFEDD5',
        '--card-foreground': '#451A03',
        '--border': '#FED7AA',
        '--input': '#FED7AA',
        '--accent': '#EA580C', // Red-orange accent for almond theme
        '--accent-foreground': '#FFFFFF',
      }
    };

    if (styles[theme]) {
      Object.entries(styles[theme]).forEach(([property, value]) => {
        root.style.setProperty(property, value);
      });
    }
  }, [theme]);

  return { theme, setTheme };
}
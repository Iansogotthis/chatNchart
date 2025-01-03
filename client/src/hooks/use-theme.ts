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
        '--background': '0 0% 3%',
        '--foreground': '#FFFFFF',
        '--muted': '#F5F5F5',
        '--muted-foreground': '#737373',
        '--card': '#0A0A0A',
        '--card-foreground': '#FFFFFF',
        '--border': '#262626',
        '--input': '#111111',
        '--accent': '#EF4444', // Red for light theme
        '--accent-foreground': '#FFFFFF',
      },
      dark: {
        '--background': '0 0% 3%',
        '--foreground': '0 0% 100%',
        '--muted': '0 0% 7%',
        '--muted-foreground': '#D4D4D4',
        '--card': '#0A0A0A',
        '--card-foreground': '#FFFFFF',
        '--border': '#262626',
        '--input': '#111111',
        '--accent': '#3B82F6', // Blue for dark theme
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
        '--accent': '#475569', // Slate blue for grey theme
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
        '--accent': '#F97316', // Bright orange for almond theme
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
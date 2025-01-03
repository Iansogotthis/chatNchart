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
        '--background': '0 0% 0%',
        '--foreground': '#FFFFFF',
        '--muted': '#1A1A1A',
        '--muted-foreground': '#A1A1A1',
        '--card': '#0A0A0A',
        '--card-foreground': '#FFFFFF',
        '--border': '#262626',
        '--input': '#111111',
        '--accent': '#8B4513', // Brown for light theme
        '--accent-foreground': '#FFFFFF',
      },
      dark: {
        '--background': '0 0% 0%',
        '--foreground': '#00FF00',
        '--muted': '0 0% 7%',
        '--muted-foreground': '#00FF00',
        '--card': '#0A0A0A',
        '--card-foreground': '#00FF00',
        '--border': '#262626',
        '--input': '#111111',
        '--accent': '#87CEEB', // Light blue for dark theme
        '--accent-foreground': '#000000',
      },
      grey: {
        '--background': '0 0% 0%',
        '--foreground': '#006400',
        '--muted': '#1A1A1A',
        '--muted-foreground': '#006400',
        '--card': '#0A0A0A',
        '--card-foreground': '#006400',
        '--border': '#262626',
        '--input': '#111111',
        '--accent': '#006400', // Dark green for grey theme
        '--accent-foreground': '#FFFFFF',
        'font-weight': 'bold',
      },
      almond: {
        '--background': '0 0% 0%',
        '--foreground': '#D3D3D3',
        '--muted': '#1A1A1A',
        '--muted-foreground': '#D3D3D3',
        '--card': '#0A0A0A',
        '--card-foreground': '#D3D3D3',
        '--border': '#262626',
        '--input': '#111111',
        '--accent': '#FFD700', // Gold for almond theme
        '--accent-foreground': '#000000',
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
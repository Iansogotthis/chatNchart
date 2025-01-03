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
        '--background': '0 0% 100%',
        '--foreground': '#000000',
        '--muted': '#F5F5F5',
        '--muted-foreground': '#737373',
        '--card': '#FFFFFF',
        '--card-foreground': '#000000',
        '--border': '#000000',
        '--input': '#F5F5F5',
        '--accent': '#EF4444',
        '--accent-foreground': '#FFFFFF',
      },
      dark: {
        '--background': '0 0% 10%',
        '--foreground': '#E4E4E4',
        '--muted': '0 0% 15%',
        '--muted-foreground': '#A0A0A0',
        '--card': '#1A1A1A',
        '--card-foreground': '#E4E4E4',
        '--border': '#404040',
        '--input': '#2A2A2A',
        '--accent': '#60A5FA',
        '--accent-foreground': '#FFFFFF',
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
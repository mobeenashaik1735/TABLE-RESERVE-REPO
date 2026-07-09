/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react';
import { THEMES } from '../utils/themes';

const ThemeContext = createContext();
const STORAGE_KEY = 'theme';
const VALID_THEMES = ['light', 'dark'];

function normalizeTheme(stored) {
  if (VALID_THEMES.includes(stored)) return stored;
  return 'light';
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => normalizeTheme(localStorage.getItem(STORAGE_KEY)));

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, theme);
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const toggleTheme = () => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  const isDark = theme === 'dark';
  const t = THEMES[theme];

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, isDark, t }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

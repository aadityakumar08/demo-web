// utils/theme.js
// Theme management system with dark mode support

import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_KEY = 'app_theme';

export const lightTheme = {
  // Core
  primary: '#6366f1',
  secondary: '#ec4899',
  accent: '#8b5cf6',

  // Backgrounds
  background: '#f5f5f7',
  surface: '#ffffff',
  card: '#ffffff',
  cardAlt: '#f0f0f5',

  // Text
  text: '#1a1a2e',
  textSecondary: '#6b7280',
  textTertiary: '#9ca3af',

  // Borders
  border: '#e5e7eb',
  borderLight: '#f3f4f6',

  // Status
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',

  // Gradients
  primaryGradient: ['#6366f1', '#8b5cf6'],
  successGradient: ['#10b981', '#059669'],
  errorGradient: ['#ef4444', '#dc2626'],

  // Shadows
  shadowColor: '#000000',
  shadowOpacity: 0.08,
  shadowRadius: 8,
  elevation: 4,

  // Glass
  glass: 'rgba(255,255,255,0.85)',
  glassLight: 'rgba(255,255,255,0.6)',

  // Overlay
  overlay: 'rgba(0,0,0,0.4)',

  // Status bar
  statusBar: 'dark',
  statusBarBackground: '#f5f5f7',
};

export const darkTheme = {
  // Core
  primary: '#818cf8',
  secondary: '#f472b6',
  accent: '#a78bfa',

  // Backgrounds
  background: '#0f0f13',
  surface: '#1a1a22',
  card: '#1e1e28',
  cardAlt: '#252532',

  // Text
  text: '#f0f0f5',
  textSecondary: '#9ca3af',
  textTertiary: '#6b7280',

  // Borders
  border: '#2d2d3a',
  borderLight: '#222230',

  // Status
  success: '#34d399',
  warning: '#fbbf24',
  error: '#f87171',
  info: '#60a5fa',

  // Gradients
  primaryGradient: ['#818cf8', '#a78bfa'],
  successGradient: ['#34d399', '#22c55e'],
  errorGradient: ['#f87171', '#ef4444'],

  // Shadows
  shadowColor: '#000000',
  shadowOpacity: 0.5,
  shadowRadius: 12,
  elevation: 8,

  // Glass
  glass: 'rgba(30,30,40,0.85)',
  glassLight: 'rgba(30,30,40,0.6)',

  // Overlay
  overlay: 'rgba(0,0,0,0.6)',

  // Status bar
  statusBar: 'light',
  statusBarBackground: '#0f0f13',
};

// Theme context
export const ThemeContext = createContext({
  theme: lightTheme,
  isDark: false,
  toggleTheme: () => { },
});

// Theme provider component
export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(false);

  const theme = isDark ? darkTheme : lightTheme;

  // Load saved theme preference
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_KEY);
        if (savedTheme !== null) {
          setIsDark(savedTheme === 'dark');
        }
      } catch (error) {
        // Silently fail — use default theme
      }
    };

    loadTheme();
  }, []);

  const toggleTheme = async () => {
    const newTheme = !isDark;
    setIsDark(newTheme);

    try {
      await AsyncStorage.setItem(THEME_KEY, newTheme ? 'dark' : 'light');
    } catch (error) {
      // Silently fail
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Hook to use theme
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

// Color schemes
export const lightTheme = {
  // Main colors
  primary: '#4e7bff',
  background: '#f8f9fd',
  cardBackground: '#fff',
  text: '#333',
  textSecondary: '#666',
  textTertiary: '#999',
  border: '#ddd',

  // Status colors
  success: '#6bdb7d',
  error: '#ff6b6b',
  warning: '#ffb347',
  info: '#4e7bff',

  // UI elements
  inputBackground: '#f5f5f5',
  inputBorder: '#e0e0e0',
  shadowColor: '#000',
  overlay: 'rgba(0, 0, 0, 0.5)',

  // Tab bar
  tabBarBackground: '#fff',
  tabBarActiveTint: '#4e7bff',
  tabBarInactiveTint: '#999',

  // Chart colors
  chartPrimary: '#4e7bff',
  chartSecondary: '#e8eeff',
};

export const darkTheme = {
  // Main colors
  primary: '#5a8cff',
  background: '#121212',
  cardBackground: '#1e1e1e',
  text: '#ffffff',
  textSecondary: '#b0b0b0',
  textTertiary: '#707070',
  border: '#333',

  // Status colors
  success: '#5bc970',
  error: '#ff5252',
  warning: '#ffa726',
  info: '#5a8cff',

  // UI elements
  inputBackground: '#2a2a2a',
  inputBorder: '#404040',
  shadowColor: '#000',
  overlay: 'rgba(0, 0, 0, 0.7)',

  // Tab bar
  tabBarBackground: '#1e1e1e',
  tabBarActiveTint: '#5a8cff',
  tabBarInactiveTint: '#707070',

  // Chart colors
  chartPrimary: '#5a8cff',
  chartSecondary: '#2a3a5a',
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load theme preference on mount
  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme');
      if (savedTheme !== null) {
        setIsDarkMode(savedTheme === 'dark');
      }
    } catch (error) {
      console.log('Error loading theme preference:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTheme = async () => {
    try {
      const newTheme = !isDarkMode;
      setIsDarkMode(newTheme);
      await AsyncStorage.setItem('theme', newTheme ? 'dark' : 'light');
    } catch (error) {
      console.log('Error saving theme preference:', error);
    }
  };

  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, isDarkMode, toggleTheme, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

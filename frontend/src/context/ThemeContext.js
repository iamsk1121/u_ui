import React, { createContext, useContext, useState, useEffect, useMemo } from "react";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const themeVars = useMemo(
    () => ({
      light: {
        "--primary": "#ff8000",
        "--accent-yellow": "#FFB84C",
        "--accent-blue": "#82C9FF",
        "--bg-light": "rgba(255,255,255,0.15)",
        "--white": "#fff",
        "--text-dark": "#222",
        "--card-dark": "#F5F5F5",
        "--card-light": "#e9e9e9",
        "--bg-light": "rgba(255, 255, 255, 0.92)",

        "--shadow-light": "rgba(0,0,0,0.1)",
        "--border-color": "rgba(0, 0, 0, 0.15)",
        "--bg-surface": "rgba(255, 255, 255, 0.15)",
        "--c-back": "#fafcfdff",
        "--b-back": "#faedbdff",
        
      },
      dark: {
        "--primary": "#ff9a3c",
        "--accent-yellow": "#ffcf6c",
        "--accent-blue": "#5e748c",
        "--bg-light": "rgba(25, 25, 42, 0.4)",
        "--white": "#2a2f3a",
        "--text-dark": "#f5eeeeff",
        "--card-dark": "#4d525f",
        "--bg-light": "#4d525f",
        "--card-light": "#777b85",
        "--shadow-dark": "rgba(255,255,255,0.1)",
        "--shadow-light": "rgba(255,255,255,0.06)",
        "--border-color": "#777b85",
        "--bg-surface": "transparent",
        "--c-back": "#353b47",
        "--b-back": "#353b47",
      },
    }),
    [] 
  );

  useEffect(() => {
    const root = document.documentElement;
    const theme = isDarkMode ? themeVars.dark : themeVars.light;

    Object.entries(theme).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });

    document.body.style.background = isDarkMode
      ? "#2e3443ff"
      : "#fff";
  }, [isDarkMode, themeVars]); 

  const toggleTheme = () => setIsDarkMode((prev) => !prev);

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

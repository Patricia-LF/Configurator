// ThemeContext.jsx
import { createContext, useState } from "react";

export const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [isDarkMode, setIsDarkMode] = useState(true);

  function toggleTheme() {
    setIsDarkMode((prev) => !prev);
  }

  const value = { isDarkMode, toggleTheme };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

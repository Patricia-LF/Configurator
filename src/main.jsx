import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { ConfiguratorProvider } from "./config/ConfiguratorContext";
import { ThemeProvider } from "./config/ThemeContext";
import { ZoomProvider } from "./config/ZoomContext.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider>
      <ConfiguratorProvider>
        <ZoomProvider>
          <App />
        </ZoomProvider>
      </ConfiguratorProvider>
    </ThemeProvider>
  </StrictMode>,
);

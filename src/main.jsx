import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { ConfiguratorProvider } from "./config/ConfiguratorContext";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ConfiguratorProvider>
      <App />
    </ConfiguratorProvider>
  </StrictMode>,
);

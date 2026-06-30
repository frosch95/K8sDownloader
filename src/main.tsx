import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { initializeKubeStore } from "./stores/kubeStore";
import { initializeUIStore } from "./stores/uiStore";

// Initialize stores before rendering
initializeUIStore();
initializeKubeStore();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

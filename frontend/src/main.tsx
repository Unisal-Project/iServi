import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerServiceWorker } from "@/utils/pwa/registerServiceWorker";
import "./styles/main.scss";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
void registerServiceWorker();
// src/main.tsx
// ─── Application entry point ────────────────────────────────

import { render } from "preact";
import App from "./app";
import "./styles.css";

// Mount the app.
render(<App />, document.getElementById("app")!);

// Register service worker for offline caching.
// Wrapped in a check so it doesn't break Vite's dev server.
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => console.log("SW registered:", reg.scope))
      .catch((err) => console.warn("SW registration failed:", err));
  });
}


import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ErrorBoundary } from "./components/common/ErrorBoundary";

// Prevent blank screen by catching any top-level unhandled errors
window.addEventListener("error", (event) => {
  console.error("Global window error:", event.error || event.message);
});

window.addEventListener("unhandledrejection", (event) => {
  console.warn("Global unhandled rejection:", event.reason);
});

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);

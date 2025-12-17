import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { preloadUiImages } from "./lib/preloadUiImages"; // ✅ add this

// Handle unhandled promise rejections
window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled promise rejection:", event.reason);
  event.preventDefault();
});

// Handle uncaught errors
window.addEventListener("error", (event) => {
  console.error("Uncaught error:", event.error);
});

// ✅ Preload + decode UI PNGs BEFORE first render (with timeout safety)
const PRELOAD_TIMEOUT_MS = 1200;

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T | null> {
  return new Promise((resolve) => {
    const t = setTimeout(() => resolve(null), ms);
    p.then((v) => {
      clearTimeout(t);
      resolve(v);
    }).catch(() => {
      clearTimeout(t);
      resolve(null);
    });
  });
}

(async () => {
  // Best-effort: don’t block forever
  await withTimeout(preloadUiImages(), PRELOAD_TIMEOUT_MS);

  createRoot(document.getElementById("root")!).render(<App />);
})();

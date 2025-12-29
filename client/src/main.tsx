import { createRoot } from "react-dom/client";
import App from "./App";
import { ErrorBoundary } from "./components/ErrorBoundary";
import "./index.css";

// Fetch environment info and update document title
fetch('/api/environment')
  .then((res) => res.json())
  .then((data) => {
    const envPrefix = data.mode === 'production' 
      ? '[PROD] ' 
      : data.mode === 'test' 
      ? '[TEST] ' 
      : '[DEV] ';
    document.title = `${envPrefix}GHGConnect Maritime Compliance Platform`;
  })
  .catch((err) => {
    console.error('Failed to fetch environment info:', err);
    // Default to dev if fetch fails
    document.title = '[DEV] GHGConnect Maritime Compliance Platform';
  });

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

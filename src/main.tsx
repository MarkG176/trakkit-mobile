import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { AppErrorBoundary } from "./components/AppErrorBoundary";
import { installChunkErrorHandlers } from "./utils/chunkErrorRecovery";

// Install before render so chunk failures that occur before React mounts
// (true white-screen cases) still trigger cache/SW cleanup + reload.
installChunkErrorHandlers();

createRoot(document.getElementById("root")!).render(
  <AppErrorBoundary>
    <App />
  </AppErrorBoundary>,
);

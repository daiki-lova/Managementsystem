import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { AuthProvider } from "./lib/auth-context";
import { QueryProvider } from "./lib/query-client";

createRoot(document.getElementById("root")!).render(
  <QueryProvider>
    <AuthProvider>
      <App />
    </AuthProvider>
  </QueryProvider>
);

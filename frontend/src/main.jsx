import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import axios from "axios";
import "./index.css";
import App from "./App.jsx";
// Add this once anywhere in main.jsx / index.jsx
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem("supabase_session_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

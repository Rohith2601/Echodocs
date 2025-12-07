// src/api/axiosClient.ts
import axios from "axios";

// Vite env: define VITE_BACKEND_URL in Vercel
const envBaseURL =
  (import.meta as any).env?.VITE_BACKEND_URL ||
  (window as any).__BACKEND_URL ||
  "";

// Local dev: if nothing is set, default to localhost:3000
const baseURL = envBaseURL || "http://localhost:3000";

console.log("[axiosClient] baseURL =", baseURL);

const client = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 120000,
});

export default client;

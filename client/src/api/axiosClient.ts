// client/src/api/axiosClient.ts
import axios from "axios";

/**
 * Order of resolution:
 * 1) process.env.REACT_APP_BACKEND_URL (set in Vercel)
 * 2) window.__BACKEND_URL (optional runtime injection)
 * 3) window.location.origin (same origin)
 */
const baseURL =
  (process.env.REACT_APP_BACKEND_URL as string) ||
  (window as any).__BACKEND_URL ||
  window.location.origin;

console.log("[axiosClient] baseURL =", baseURL);

const client = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 120000,
});

export default client;

// src/api/axiosClient.ts
import axios from "axios";

const baseURL =
  process.env.REACT_APP_BACKEND_URL || (window as any).__BACKEND_URL || ""; // e.g. http://localhost:3000

const client = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 120000,
});

export default client;

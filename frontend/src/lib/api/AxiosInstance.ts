import axios from "axios";

const BASE_URL = import.meta.env.VITE_BASE_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: `${BASE_URL}/v1`,
  timeout: 15000,
  headers: {},
  withCredentials: true,
});

export default api;

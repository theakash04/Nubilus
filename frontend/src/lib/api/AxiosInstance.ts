import axios, { AxiosError } from "axios";

const BASE_URL = import.meta.env.VITE_BASE_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: `${BASE_URL}/v1`,
  timeout: 15000,
  headers: {},
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string; success?: boolean }>) => {
    if (error.response) {
      const { status, data } = error.response;

      if (status === 403) {
        error.message =
          data?.message ||
          "Access denied. You don't have permission to perform this action.";
      } else if (data?.message) {
        error.message = data.message;
      }
    }
    return Promise.reject(error);
  }
);

export default api;

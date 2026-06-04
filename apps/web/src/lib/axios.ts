import axios from "axios";
import { getSessionToken } from "./auth";

const baseURL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export const api = axios.create({
  baseURL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = getSessionToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      const path = window.location.pathname;
      if (!path.startsWith("/login") && !path.startsWith("/signup")) {
        document.cookie = "iip_session=; path=/; max-age=0";
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

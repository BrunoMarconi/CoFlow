import axios from "axios";
import { getToken, clearToken } from "@/lib/auth";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = getToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearToken();
    }

    if (
      error.response?.status === 403 &&
      error.response?.data?.detail?.code === "EMAIL_NOT_VERIFIED" &&
      typeof window !== "undefined" &&
      window.location.pathname !== "/verificacion-pendiente"
    ) {
      window.location.href = "/verificacion-pendiente";
    }

    return Promise.reject(error);
  }
);
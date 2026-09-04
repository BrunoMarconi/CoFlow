import axios from "axios";
import { getToken, clearToken } from "@/lib/auth";
import { trackProductEvent, type ProductEventName } from "@/lib/analytics";

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
  (response) => {
    const method = response.config.method?.toUpperCase();
    const url = response.config.url?.split("?", 1)[0] ?? "";
    const event = successfulProductEvent(method, url);
    if (event) trackProductEvent(event, url);
    return response;
  },
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

function successfulProductEvent(method: string | undefined, url: string): ProductEventName | null {
  if (method !== "POST") return null;
  if (url === "/auth/register") return "signup_completed";
  if (url === "/auth/login" || url === "/auth/google") return "login_completed";
  if (url === "/onboarding") return "onboarding_completed";
  if (url === "/communities") return "community_created";
  if (/^\/connections\/users\/[^/]+\/request$/.test(url)) return "connection_requested";
  if (/^\/connections\/[^/]+\/messages(?:\/image)?$/.test(url)) return "message_sent";
  if (/^\/communities\/[^/]+\/applications$/.test(url)) return "application_submitted";
  return null;
}

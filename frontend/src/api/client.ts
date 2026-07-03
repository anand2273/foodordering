import axios, { AxiosError } from "axios";
import type { ApiErrorBody } from "../types";

export function resolveBaseURL(
  raw: string | undefined,
  isDev: boolean,
): string {
  if (!raw && !isDev) {
    throw new Error("VITE_API_BASE_URL must be set in production.");
  }
  return raw ?? "http://localhost:8000/api/v1";
}

const baseURL = resolveBaseURL(
  import.meta.env.VITE_API_BASE_URL as string | undefined,
  import.meta.env.DEV,
);

export const api = axios.create({
  baseURL: baseURL.replace(/\/+$/, ""),
  timeout: 15_000,
  withCredentials: true,
});

function readCookie(name: string): string | undefined {
  return document.cookie
    .split(";")
    .map((value) => value.trim())
    .find((value) => value.startsWith(`${name}=`))
    ?.split("=")
    .slice(1)
    .join("=");
}

api.interceptors.request.use((config) => {
  const method = config.method?.toLowerCase();
  if (method && !["get", "head", "options"].includes(method)) {
    const csrfToken = readCookie("csrftoken");
    if (csrfToken)
      config.headers.set("X-CSRFToken", decodeURIComponent(csrfToken));
  }
  return config;
});

export function apiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof AxiosError) {
    const body = error.response?.data as ApiErrorBody | undefined;
    return body?.error?.message ?? fallback;
  }
  return fallback;
}

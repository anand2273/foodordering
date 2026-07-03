import { AxiosError, type AxiosRequestConfig } from "axios";
import { afterEach, describe, expect, it, vi } from "vitest";
import { api, apiErrorMessage } from "./client";

describe("baseURL guard", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("throws when VITE_API_BASE_URL is missing outside dev mode", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "");
    vi.stubEnv("DEV", false);
    vi.resetModules();
    await expect(import("./client")).rejects.toThrow(
      "VITE_API_BASE_URL must be set in production.",
    );
  });
});

describe("apiErrorMessage", () => {
  it("uses the structured API message when available", () => {
    const error = new AxiosError(
      "request failed",
      "400",
      undefined,
      undefined,
      {
        data: { error: { message: "Invalid cart" } },
        status: 400,
        statusText: "Bad Request",
        headers: {},
        config: { headers: {} } as never,
      },
    );
    expect(apiErrorMessage(error, "Fallback")).toBe("Invalid cart");
  });

  it("falls back for unknown errors", () => {
    expect(apiErrorMessage(new Error("offline"), "Try again")).toBe(
      "Try again",
    );
  });

  it("adds the CSRF cookie to unsafe requests only", async () => {
    document.cookie = "csrftoken=signed%20token";
    let observed: AxiosRequestConfig | undefined;
    api.defaults.adapter = (config) => {
      observed = config;
      return Promise.resolve({
        data: {},
        status: 200,
        statusText: "OK",
        headers: {},
        config,
      });
    };
    await api.post("/test", {});
    expect(observed?.headers?.["X-CSRFToken"]).toBe("signed token");
  });
});

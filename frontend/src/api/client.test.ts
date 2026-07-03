import { AxiosError, type AxiosRequestConfig } from "axios";
import { describe, expect, it } from "vitest";
import { api, apiErrorMessage, resolveBaseURL } from "./client";

describe("resolveBaseURL", () => {
  it("throws when missing outside dev mode", () => {
    expect(() => resolveBaseURL(undefined, false)).toThrow(
      "VITE_API_BASE_URL must be set in production.",
    );
  });

  it("falls back to localhost in dev mode", () => {
    expect(resolveBaseURL(undefined, true)).toBe(
      "http://localhost:8000/api/v1",
    );
  });

  it("uses the provided URL when set", () => {
    expect(resolveBaseURL("https://api.example.com", false)).toBe(
      "https://api.example.com",
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

  it("falls back when the API response has no structured message", () => {
    const error = new AxiosError(
      "request failed",
      "500",
      undefined,
      undefined,
      {
        data: {},
        status: 500,
        statusText: "Server Error",
        headers: {},
        config: { headers: {} } as never,
      },
    );
    expect(apiErrorMessage(error, "Fallback")).toBe("Fallback");
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

  it("does not add the CSRF cookie to safe requests", async () => {
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
    await api.get("/test");
    expect(observed?.headers?.["X-CSRFToken"]).toBeUndefined();
  });
});

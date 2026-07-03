import { AxiosError, type AxiosRequestConfig } from "axios";
import { describe, expect, it } from "vitest";
import { api, apiErrorMessage } from "./client";

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

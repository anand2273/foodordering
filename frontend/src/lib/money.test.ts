import { describe, expect, it } from "vitest";
import { formatMoney } from "./money";

describe("formatMoney", () => {
  it("formats minor units using the requested currency", () => {
    expect(formatMoney(450, "sgd")).toContain("4.50");
  });
});

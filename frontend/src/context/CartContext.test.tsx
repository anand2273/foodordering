import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { CartProvider, useCart } from "./CartContext";
import type { MenuItem } from "../types";

const item: MenuItem = {
  id: 1,
  slug: "milk-tea",
  title: "Milk Tea",
  description: "Tea",
  image_url: "",
  price_amount: 450,
  customization_groups: [],
};

function Harness() {
  const cart = useCart();
  return (
    <div>
      <output data-testid="count">{cart.totalItems}</output>
      <output data-testid="lines">{cart.cart.length}</output>
      <button onClick={() => cart.add(item, [3, 2])}>add</button>
      <button onClick={() => cart.increment("1:2,3")}>increment</button>
      <button onClick={() => cart.decrement("1:2,3")}>decrement</button>
      <button onClick={() => cart.remove("1:2,3")}>remove</button>
      <button onClick={cart.clear}>clear</button>
    </div>
  );
}

describe("CartProvider", () => {
  beforeEach(() => localStorage.clear());

  it("merges matching configurations and updates quantities", async () => {
    const user = userEvent.setup();
    render(
      <CartProvider>
        <Harness />
      </CartProvider>,
    );

    await user.click(screen.getByText("add"));
    await user.click(screen.getByText("add"));
    expect(screen.getByTestId("count")).toHaveTextContent("2");
    expect(screen.getByTestId("lines")).toHaveTextContent("1");

    await user.click(screen.getByText("increment"));
    expect(screen.getByTestId("count")).toHaveTextContent("3");
    await user.click(screen.getByText("decrement"));
    expect(screen.getByTestId("count")).toHaveTextContent("2");
    await user.click(screen.getByText("remove"));
    expect(screen.getByTestId("count")).toHaveTextContent("0");
  });

  it("recovers from corrupt storage and persists changes", async () => {
    localStorage.setItem("foodapp.cart.v1", "{invalid");
    const user = userEvent.setup();
    render(
      <CartProvider>
        <Harness />
      </CartProvider>,
    );
    expect(screen.getByTestId("count")).toHaveTextContent("0");

    await user.click(screen.getByText("add"));
    expect(localStorage.getItem("foodapp.cart.v1")).toContain("Milk Tea");
    await user.click(screen.getByText("clear"));
    expect(localStorage.getItem("foodapp.cart.v1")).toBe("[]");
  });

  it("throws when used outside its provider", () => {
    function InvalidHarness() {
      useCart();
      return null;
    }
    expect(() => render(<InvalidHarness />)).toThrow(
      "useCart must be used within CartProvider",
    );
  });
});

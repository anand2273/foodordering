import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { ErrorMessage, Loading } from "./Feedback";
import { MenuCard } from "./MenuCard";
import { OrderCard } from "./OrderCard";
import type { CustomerOrder, MenuItem } from "../types";

const menuItem: MenuItem = {
  id: 1,
  slug: "milk-tea",
  title: "Milk Tea",
  description: "Fresh tea",
  image_url: "",
  price_amount: 450,
  customization_groups: [],
};

const order: CustomerOrder = {
  id: "12345678-0000-0000-0000-000000000000",
  created_at: "2026-06-30T12:00:00Z",
  location: "Hall 4",
  currency: "sgd",
  amount_total: 450,
  payment_status: "paid",
  fulfillment_status: "ready",
  items: [
    {
      title: "Milk Tea",
      unit_amount: 450,
      quantity: 1,
      customizations: [
        { group_name: "Sugar", option_name: "50%", extra_amount: 0 },
      ],
    },
  ],
};

describe("display components", () => {
  it("renders menu details and navigation", () => {
    render(
      <MemoryRouter>
        <MenuCard item={menuItem} />
      </MemoryRouter>,
    );
    expect(screen.getByRole("link", { name: /Milk Tea/ })).toHaveAttribute(
      "href",
      "/menu/milk-tea",
    );
  });

  it("renders a customer order without merchant PII", () => {
    render(<OrderCard order={order} />);
    expect(screen.getByText(/12345678/)).toBeInTheDocument();
    expect(screen.getByText("Sugar: 50%")).toBeInTheDocument();
    expect(screen.queryByText(/@/)).not.toBeInTheDocument();
  });

  it("renders accessible loading and error feedback", () => {
    const { rerender } = render(<Loading label="Working" />);
    expect(screen.getByRole("status")).toHaveTextContent("Working");
    rerender(<ErrorMessage message="Failed" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Failed");
  });
});

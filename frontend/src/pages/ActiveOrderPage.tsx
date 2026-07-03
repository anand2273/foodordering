import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { getOrderStatus } from "../api/foodapp";
import { ErrorMessage, Loading } from "../components/Feedback";
import { OrderCard } from "../components/OrderCard";
import { useCart } from "../context/CartContext";

const TRACKING_KEY = "foodapp.tracking-token.v1";

export function ActiveOrderPage() {
  const [params] = useSearchParams();
  const { clear } = useCart();
  const tokenFromUrl = params.get("token");
  const token = tokenFromUrl ?? localStorage.getItem(TRACKING_KEY) ?? "";

  useEffect(() => {
    if (tokenFromUrl) localStorage.setItem(TRACKING_KEY, tokenFromUrl);
    if (params.get("redirect_status")) clear();
  }, [clear, params, tokenFromUrl]);

  const order = useQuery({
    queryKey: ["order-status", token],
    queryFn: () => getOrderStatus(token),
    enabled: Boolean(token),
    refetchInterval: (query) =>
      query.state.data?.fulfillment_status === "fulfilled" ? false : 15_000,
  });

  if (!token)
    return (
      <p className="rounded-2xl bg-white p-8 text-center text-slate-600">
        No active order is stored on this device.
      </p>
    );
  if (order.isLoading) return <Loading label="Checking your order…" />;
  if (order.isError || !order.data)
    return (
      <ErrorMessage message="This order link is invalid or has expired." />
    );

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-3xl font-black">Order status</h1>
      {order.data.payment_status !== "paid" && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
          Payment status:{" "}
          <strong className="capitalize">{order.data.payment_status}</strong>
        </div>
      )}
      <OrderCard order={order.data} />
      <p className="mt-4 text-center text-sm text-slate-500">
        This page refreshes automatically.
      </p>
    </div>
  );
}

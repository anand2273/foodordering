import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  fulfillReadyOrders,
  getLocations,
  getMerchantOrders,
  updateOrderStatus,
} from "../api/foodapp";
import { ErrorMessage, Loading } from "../components/Feedback";
import { OrderCard } from "../components/OrderCard";
import { useAuth } from "../context/AuthContext";
import type { FulfillmentStatus } from "../types";

export function MerchantOrdersPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [locationId, setLocationId] = useState<number | undefined>();
  const locations = useQuery({
    queryKey: ["locations"],
    queryFn: getLocations,
  });
  const orders = useQuery({
    queryKey: ["merchant-orders", locationId],
    queryFn: () => getMerchantOrders(locationId),
    refetchInterval: 15_000,
  });
  const refreshOrders = async () => {
    await queryClient.invalidateQueries({ queryKey: ["merchant-orders"] });
  };
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: FulfillmentStatus }) =>
      updateOrderStatus(id, status),
    onSuccess: refreshOrders,
  });
  const bulkMutation = useMutation({
    mutationFn: (id: number) => fulfillReadyOrders(id),
    onSuccess: refreshOrders,
  });

  if (orders.isLoading) return <Loading label="Loading merchant orders…" />;
  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div>
            <strong>Merchant orders</strong>
            <span className="ml-3 text-sm text-slate-500">{auth.username}</span>
          </div>
          <button
            className="text-sm font-semibold text-slate-700 hover:underline"
            onClick={() =>
              void auth.logout().then(() => navigate("/merchant/login"))
            }
            type="button"
          >
            Sign out
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex flex-wrap items-end gap-3">
          <label className="text-sm font-medium">
            Pickup location
            <select
              className="mt-1 block rounded-lg border border-slate-300 bg-white px-3 py-2"
              onChange={(event) =>
                setLocationId(
                  event.target.value ? Number(event.target.value) : undefined,
                )
              }
              value={locationId ?? ""}
            >
              <option value="">All locations</option>
              {locations.data?.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
          </label>
          {locationId && (
            <button
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              disabled={bulkMutation.isPending}
              onClick={() => bulkMutation.mutate(locationId)}
              type="button"
            >
              Fulfill all ready orders
            </button>
          )}
        </div>
        {orders.isError && (
          <ErrorMessage message="Orders could not be loaded." />
        )}
        <div className="grid gap-5 lg:grid-cols-2">
          {orders.data?.map((order) => {
            let actions: React.ReactNode;
            if (order.fulfillment_status === "preparing") {
              actions = (
                <button
                  className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white"
                  onClick={() =>
                    statusMutation.mutate({ id: order.id, status: "ready" })
                  }
                  type="button"
                >
                  Mark ready
                </button>
              );
            } else if (order.fulfillment_status === "ready") {
              actions = (
                <>
                  <button
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold"
                    onClick={() =>
                      statusMutation.mutate({
                        id: order.id,
                        status: "preparing",
                      })
                    }
                    type="button"
                  >
                    Back to preparing
                  </button>
                  <button
                    className="rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white"
                    onClick={() =>
                      statusMutation.mutate({
                        id: order.id,
                        status: "fulfilled",
                      })
                    }
                    type="button"
                  >
                    Mark fulfilled
                  </button>
                </>
              );
            }
            return (
              <OrderCard
                actions={actions}
                key={order.id}
                merchant
                order={order}
              />
            );
          })}
        </div>
        {!orders.data?.length && (
          <p className="rounded-xl bg-white p-8 text-center text-slate-600">
            No paid orders match this filter.
          </p>
        )}
      </main>
    </div>
  );
}

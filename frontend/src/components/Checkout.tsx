import { useMemo, useState } from "react";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { apiErrorMessage } from "../api/client";
import { createCheckout, getLocations } from "../api/foodapp";
import { useCart } from "../context/CartContext";

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as
  string | undefined;
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;
const e2ePaymentMode = import.meta.env.VITE_E2E_PAYMENT_MODE === "true";
const TRACKING_KEY = "foodapp.tracking-token.v1";

function TestPaymentForm({ trackingToken }: { trackingToken: string }) {
  const navigate = useNavigate();
  const { clear } = useCart();

  return (
    <button
      className="w-full rounded-lg bg-amber-600 px-5 py-3 font-semibold text-white"
      onClick={() => {
        clear();
        void navigate(
          `/active-order?token=${encodeURIComponent(trackingToken)}&redirect_status=succeeded`,
        );
      }}
      type="button"
    >
      Complete test payment
    </button>
  );
}

function PaymentForm({
  trackingToken,
  onCancel,
}: {
  trackingToken: string;
  onCancel: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const { clear } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const pay = async () => {
    if (!stripe || !elements) return;
    setSubmitting(true);
    setError("");
    const returnUrl = `${window.location.origin}/active-order?token=${encodeURIComponent(trackingToken)}`;
    const result = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: returnUrl },
      redirect: "if_required",
    });
    if (result.error) {
      setError(result.error.message ?? "Payment could not be completed.");
      setSubmitting(false);
      return;
    }
    clear();
    void navigate(`/active-order?token=${encodeURIComponent(trackingToken)}`);
  };

  return (
    <>
      <PaymentElement />
      {error && (
        <p className="mt-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
      <div className="mt-6 flex justify-end gap-3">
        <button
          className="rounded-lg px-4 py-2 text-slate-700 hover:bg-slate-100"
          onClick={onCancel}
          type="button"
        >
          Back
        </button>
        <button
          className="rounded-lg bg-amber-600 px-5 py-2 font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
          disabled={!stripe || !elements || submitting}
          onClick={() => void pay()}
          type="button"
        >
          {submitting ? "Processing…" : "Pay securely"}
        </button>
      </div>
    </>
  );
}

export function Checkout() {
  const { cart } = useCart();
  const locations = useQuery({
    queryKey: ["locations"],
    queryFn: getLocations,
  });
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [locationId, setLocationId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [trackingToken, setTrackingToken] = useState("");
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const appearance = useMemo(() => ({ theme: "stripe" as const }), []);

  const startCheckout = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!stripePromise && !e2ePaymentMode) {
      setError("Payments are not configured.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const result = await createCheckout(
        {
          customer_name: name,
          customer_email: email,
          location_id: Number(locationId),
          items: cart.map((line) => ({
            menu_item_id: line.item.id,
            quantity: line.quantity,
            option_ids: line.optionIds,
          })),
        },
        idempotencyKey,
      );
      localStorage.setItem(TRACKING_KEY, result.tracking_token);
      setTrackingToken(result.tracking_token);
      setClientSecret(result.client_secret);
    } catch (caught) {
      setError(apiErrorMessage(caught, "Checkout could not be started."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        className="w-full rounded-xl bg-amber-600 px-5 py-3 font-bold text-white shadow-sm hover:bg-amber-700"
        onClick={() => setOpen(true)}
        type="button"
      >
        Continue to checkout
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4"
          role="presentation"
        >
          <section
            aria-labelledby="checkout-title"
            aria-modal="true"
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
            role="dialog"
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold" id="checkout-title">
                Secure checkout
              </h2>
              <button
                aria-label="Close checkout"
                className="rounded p-2 text-xl text-slate-500 hover:bg-slate-100"
                onClick={() => setOpen(false)}
                type="button"
              >
                ×
              </button>
            </div>
            {clientSecret ? (
              e2ePaymentMode ? (
                <TestPaymentForm trackingToken={trackingToken} />
              ) : (
                <Elements
                  options={{ clientSecret, appearance }}
                  stripe={stripePromise}
                >
                  <PaymentForm
                    trackingToken={trackingToken}
                    onCancel={() => setClientSecret("")}
                  />
                </Elements>
              )
            ) : (
              <form
                className="space-y-4"
                onSubmit={(event) => void startCheckout(event)}
              >
                <label className="block text-sm font-medium">
                  Name
                  <input
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                    maxLength={100}
                    onChange={(event) => setName(event.target.value)}
                    required
                    value={name}
                  />
                </label>
                <label className="block text-sm font-medium">
                  Email
                  <input
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    type="email"
                    value={email}
                  />
                </label>
                <label className="block text-sm font-medium">
                  Pickup location
                  <select
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                    onChange={(event) => setLocationId(event.target.value)}
                    required
                    value={locationId}
                  >
                    <option value="">Choose a location</option>
                    {locations.data?.map((location) => (
                      <option key={location.id} value={location.id}>
                        {location.name}
                      </option>
                    ))}
                  </select>
                </label>
                {error && (
                  <p className="text-sm text-red-700" role="alert">
                    {error}
                  </p>
                )}
                <button
                  className="w-full rounded-lg bg-amber-600 px-4 py-2 font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
                  disabled={submitting}
                  type="submit"
                >
                  {submitting ? "Preparing payment…" : "Continue to payment"}
                </button>
              </form>
            )}
          </section>
        </div>
      )}
    </>
  );
}

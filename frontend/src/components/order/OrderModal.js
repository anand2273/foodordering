import { useState, useContext, useEffect } from "react";
import { CartContext } from "../../context/CartContext";
import { createPaymentIntent, getLocations } from "../../services/orderServices";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";
import { useNavigate } from "react-router-dom";
const business_slug = "its-bubblin";

const stripePromise = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY)
  : null;

function PaymentModeInner({ onBack, onCloseAndNavigate, clearCart }) {
  const stripe = useStripe();
  const elements = useElements();
  const [paying, setPaying] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handlePay = async () => {
    setErrorMessage("");
    if (!stripe || !elements) return;

    setPaying(true);
    try {
      const returnUrl = `${window.location.origin}/active-order`;
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: { return_url: returnUrl },
        redirect: "if_required",
      });

      if (result.error) {
        setErrorMessage(result.error.message || "Payment did not go through. Please try again.");
        return;
      }

      // If confirmation completes without redirect, send the user to Active Order.
      clearCart();
      onCloseAndNavigate();
    } finally {
      setPaying(false);
    }
  };

  return (
    <>
      <Modal.Body>
        <div className="mb-3">
          <PaymentElement />
        </div>
        {errorMessage && (
          <div className="text-danger">{errorMessage}</div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onBack} disabled={paying}>
          Back
        </Button>
        <Button
          variant="primary"
          onClick={handlePay}
          disabled={paying || !stripe || !elements}
        >
          {paying ? "Paying..." : "Pay"}
        </Button>
      </Modal.Footer>
    </>
  );
}

export default function ModalForm() {
  const [show, setShow] = useState(false);
  const [name, setName] = useState("");
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState("");
  const { cart, clear } = useContext(CartContext);
  const navigate = useNavigate();

  const [creatingIntent, setCreatingIntent] = useState(false);
  const [clientSecret, setClientSecret] = useState("");
  const [checkoutError, setCheckoutError] = useState("");
  const [idempotencyKey, setIdempotencyKey] = useState("");

  // Check for active orders in localStorage
  const hasActiveOrder = () => {
    const activeOrderId = localStorage.getItem('activeOrderId');
    return activeOrderId !== null;
  };

  useEffect(() => {
    if (show) {
      const fetchLocations = async () => {
        try {
          const res = await getLocations(business_slug);
          setLocations(res.data);
        } catch (err) {
          console.error("Error fetching locations:", err);
        }
      };
      fetchLocations();
    }
  }, [show]);

  const handleOpen = () => {
    if (hasActiveOrder()) {
      alert("You already have an active order. Please wait until it's fulfilled before placing another.");
      return;
    }
    setShow(true);
  };

  const handleClose = () => {
    if (clientSecret) {
      localStorage.removeItem('activeOrderId');
    }
    setShow(false);
    setName("");
    setSelectedLocation("");
    setCreatingIntent(false);
    setClientSecret("");
    setCheckoutError("");
    setIdempotencyKey("");
  };

  const handleStartPayment = async () => {
    if (!name.trim()) {
      alert("Please enter your name");
      return;
    }
    if (!selectedLocation) {
      alert("Please select a location");
      return;
    }

    if (!stripePromise) {
      alert("Payments are not configured (missing REACT_APP_STRIPE_PUBLISHABLE_KEY).");
      return;
    }

    setCheckoutError("");
    setCreatingIntent(true);

    const key = idempotencyKey || (crypto?.randomUUID?.() ?? String(Date.now()));
    setIdempotencyKey(key);

    try {
      const res = await createPaymentIntent(name, cart, selectedLocation, business_slug, key);

      // Store the order ID in localStorage immediately so redirects can recover.
      localStorage.setItem('activeOrderId', res.data.order_id);

      setClientSecret(res.data.client_secret);
    } catch (err) {
      console.error("Error placing order:", err);
      const msg = err?.response?.data?.error || "Failed to start checkout. Please try again.";
      setCheckoutError(msg);
    }
    finally {
      setCreatingIntent(false);
    }
  };

  const handleBackFromPayment = () => {
    // Allow customer to retry checkout from scratch.
    localStorage.removeItem('activeOrderId');
    setClientSecret("");
    setCheckoutError("");
  };

  const handleCloseAndNavigate = () => {
    setShow(false);
    navigate("/active-order");
  }

  return (
    <>
      <Button onClick={handleOpen} disabled={hasActiveOrder()}>
        Place Order
      </Button>
      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Place Your Order</Modal.Title>
        </Modal.Header>
        {clientSecret ? (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <PaymentModeInner
              onBack={handleBackFromPayment}
              onCloseAndNavigate={handleCloseAndNavigate}
              clearCart={clear}
            />
          </Elements>
        ) : (
          <>
            <Modal.Body>
              <Form.Control
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mb-3"
                disabled={creatingIntent}
              />
              <Form.Select
                aria-label="Select location"
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                disabled={creatingIntent}
              >
                <option>Select location</option>
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </Form.Select>
              {checkoutError && (
                <div className="text-danger mt-3">{checkoutError}</div>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={handleClose} disabled={creatingIntent}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleStartPayment} disabled={creatingIntent}>
                {creatingIntent ? "Starting..." : "Submit"}
              </Button>
            </Modal.Footer>
          </>
        )}
      </Modal>
    </>
  );
}

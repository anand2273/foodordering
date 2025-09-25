import { useState, useContext } from "react";
import { CartContext } from "../../context/CartContext";
import { placeOrder } from "../../services/orderServices";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";

const business_slug = "its-bubblin";

export default function ModalForm() {
  const [show, setShow] = useState(false);
  const [name, setName] = useState("");
  const { cart, clear } = useContext(CartContext);

  // Check for active orders in localStorage
  const hasActiveOrder = () => {
    const activeOrderId = localStorage.getItem('activeOrderId');
    return activeOrderId !== null;
  };

  const handleOpen = () => {
    if (hasActiveOrder()) {
      alert("You already have an active order. Please wait until it's fulfilled before placing another.");
      return;
    }
    setShow(true);
  };

  const handleClose = () => {
    setShow(false);
    setName("");
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      alert("Please enter your name");
      return;
    }

    try {
      const res = await placeOrder(name, cart, business_slug);
      
      // Store the order ID in localStorage
      localStorage.setItem('activeOrderId', res.data.order_id);
      
      alert("Order placed successfully!");
      clear(); // Clear cart after successful order
      handleClose();
    } catch (err) {
      console.error("Error placing order:", err);
      alert("Failed to place order. Please try again.");
    }
  };

  return (
    <>
      <Button onClick={handleOpen} disabled={hasActiveOrder()}>
        Place Order
      </Button>
      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Place Your Order</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Control
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit}>
            Submit
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

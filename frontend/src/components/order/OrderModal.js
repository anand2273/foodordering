import { useState, useContext, useEffect } from "react";
import { CartContext } from "../../context/CartContext";
import { placeOrder, getLocations } from "../../services/orderServices";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";
const business_slug = "its-bubblin";

export default function ModalForm() {
  const [show, setShow] = useState(false);
  const [name, setName] = useState("");
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState("");
  const { cart, clear } = useContext(CartContext);

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
    setShow(false);
    setName("");
    setSelectedLocation("");
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      alert("Please enter your name");
      return;
    }
    if (!selectedLocation) {
      alert("Please select a location");
      return;
    }

    try {
      const res = await placeOrder(name, cart, selectedLocation, business_slug);
      
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
            className="mb-3"
          />
          <Form.Select 
            aria-label="Select location"
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
          >
            <option>Select location</option>
            {locations.map(location => (
              <option key={location.id} value={location.id}>{location.name}</option>
            ))}
          </Form.Select>
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

import { useState, useContext } from "react";
import { CartContext } from "../context/CartContext";
import Button from 'react-bootstrap/Button'
import Modal from 'react-bootstrap/Modal'
import Form from 'react-bootstrap/Form'
import { placeOrder } from "../services/orderServices";

export default function ModalForm() {
    const [show, setShow] = useState(false);
    const [name, setName] = useState("");

    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    const { cart } = useContext(CartContext);
    const handleSubmit = async () => {
        if (!name.trim()) {
            alert("Please enter your name");
            return;
        }
        try {
            await placeOrder(name, cart);
            alert("Order placed");
            setName("");
            handleClose();
        } catch (err) {
            console.error(err);
            alert("Failed to place order");
        }
    }

    return (
        <>
        <Button onClick={handleShow}>Place Order</Button>

        <Modal show={show} onHide={handleClose}>
            <Modal.Header closeButton>
                <Modal.Title>Place your Order!</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Enter name"
                />
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>
                    Close
                </Button>
                <Button variant="primary" onClick={handleSubmit}>
                    Submit
                </Button>
            </Modal.Footer>
        </Modal>
        </>
    )

}
import { useEffect, useState } from "react";
import { useUser } from "../../context/UserContext";
import { Modal, Button, Table, Badge, Card } from "react-bootstrap";
import { FaMapMarkerAlt } from "react-icons/fa";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../styles/toggle.css"; // Custom styles for the toggle button

const DeliveryBoyDashboard = () => {
    const [deliveryBoy, setDeliveryBoy] = useState(null);
    const { user } = useUser();
    const [showModal, setShowModal] = useState(false);
    const [mapUrl, setMapUrl] = useState("");

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const response = await fetch(`http://localhost:5000/api/auth/delivery-boy/${user.email}`);
                const data = await response.json();
                setDeliveryBoy(data);
            } catch (error) {
                console.error("Error fetching delivery boy details:", error);
            }
        };
        fetchDetails();
    }, [user.email]);

    const handleAvailabilityToggle = async () => {
        try {
            const response = await fetch(`http://localhost:5000/api/auth/delivery-boy/availability/${user.email}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ available: !deliveryBoy.available }),
            });
            const data = await response.json();
            setDeliveryBoy((prevState) => ({ ...prevState, available: data.deliveryBoy.available }));
        } catch (error) {
            console.error("Error updating availability:", error);
        }
    };

    const handleOrderStatusChange = async (orderId, status) => {
        try {
            const response = await fetch(`http://localhost:5000/api/auth/order/status/${orderId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status }),
            });
            const data = await response.json();
            setDeliveryBoy((prevState) => ({
                ...prevState,
                currentOrders: prevState.currentOrders.map((order) =>
                    order._id === orderId ? { ...order, status: data.updatedOrder.status } : order
                ),
            }));
        } catch (error) {
            console.error("Error updating order status:", error);
        }
    };

    const handleShowDirections = async (deliveryAddress) => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                const { latitude, longitude } = position.coords;
                const directionsUrl = `https://www.google.com/maps/dir/?api=1&origin=${latitude},${longitude}&destination=${encodeURIComponent(deliveryAddress)}`;
                setMapUrl(directionsUrl);
                setShowModal(true);
            });
        } else {
            alert("Geolocation is not supported by this browser.");
        }
    };

    const today = new Date().toISOString().split("T")[0];
    const filteredOrders = deliveryBoy?.currentOrders.filter((order) => {
        const orderDate = new Date(order.createdAt).toISOString().split("T")[0];
        return (order.status === "Packed" || order.status === "Out for Delivery") && orderDate === today;
    }) || [];

    return (
        <div className="container mt-4">
            <h2 className="mb-3">Delivery Boy Dashboard</h2>
            {deliveryBoy ? (
                <Card className="p-3 mb-4">
                    <Card.Body>
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <h4>{deliveryBoy.name}</h4>
                                <p className="mb-1"><strong>Email:</strong> {deliveryBoy.email}</p>
                                <p className="mb-1"><strong>Phone:</strong> {deliveryBoy.phone}</p>
                                <p className="mb-1"><strong>Assigned Regions:</strong> {deliveryBoy.assignedRegions.join(", ")}</p>
                            </div>
                            <div>
                                <Badge bg={deliveryBoy.available ? "success" : "danger"} className="p-2">
                                    {deliveryBoy.available ? "Online" : "Offline"}
                                </Badge>
                                <button 
                                    type="button" 
                                    className={`btn btn-toggle btn-sm ${deliveryBoy.available ? "btn-success" : "btn-secondary"}`} 
                                    onClick={handleAvailabilityToggle}
                                >
                                    {deliveryBoy.available ? "Go Offline" : "Go Online"}
                                </button>
                            </div>
                        </div>
                    </Card.Body>
                </Card>
            ) : (
                <p>Loading...</p>
            )}
            
            <h3>Current Orders</h3>
            <Table striped bordered hover>
                <thead>
                    <tr>
                        <th>Token</th>
                        <th>Item</th>
                        <th>Quantity</th>
                        <th>Total Price</th>
                        <th>Restaurant</th>
                        <th>Delivery Address</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredOrders.map((order) => (
                        <tr key={order._id}>
                            <td>{order._id.slice(-4)}</td>
                            <td>{order.itemName}</td>
                            <td>{order.quantity}</td>
                            <td>₹{order.totalPrice}</td>
                            <td>{order.restaurantAddress}</td>
                            <td>
                                <FaMapMarkerAlt
                                    style={{ cursor: "pointer", color: "red" }}
                                    onClick={() => handleShowDirections(order.location)}
                                />
                            </td>
                            <td><Badge bg="info">{order.status}</Badge></td>
                            <td>
                                {order.status === "Packed" && (
                                    <Button variant="warning" size="sm" onClick={() => handleOrderStatusChange(order._id, "Out for Delivery")}>
                                        Out for Delivery
                                    </Button>
                                )}
                                {order.status === "Out for Delivery" && (
                                    <Button variant="success" size="sm" onClick={() => handleOrderStatusChange(order._id, "Delivered")}>
                                        ✅ Delivered
                                    </Button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>
            <Modal show={showModal} onHide={() => setShowModal(false)}>
                <Modal.Header closeButton><Modal.Title>Directions</Modal.Title></Modal.Header>
                <Modal.Body><a href={mapUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary">Open in Google Maps</a></Modal.Body>
            </Modal>
        </div>
    );
};

export default DeliveryBoyDashboard;

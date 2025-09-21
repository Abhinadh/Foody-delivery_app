import { useEffect, useState } from "react";
import { useUser } from "../../context/UserContext";
import { Modal, Button, Table, Badge, Card, Tabs, Tab, Container, Row, Col } from "react-bootstrap";
import { FaMapMarkerAlt, FaBox, FaUtensils, FaMotorcycle, FaUserCircle } from "react-icons/fa";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../styles/toggle.css"; // Custom styles for the toggle button

const DeliveryBoyDashboard = () => {
    const [deliveryBoy, setDeliveryBoy] = useState(null);
    const [dabbawalaRequests, setDabbawalaRequests] = useState([]);
    const { user } = useUser();
    const [showModal, setShowModal] = useState(false);
    const [mapUrl, setMapUrl] = useState("");
    const [activeTab, setActiveTab] = useState("orders");
    const BACKEND_URI =process.env.BACKEND_URI

    // Fetch DeliveryBoy details and Dabbawala requests
    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const response = await fetch(`${BACKEND_URI}/api/auth/delivery-boy/${user.email}`);
                const data = await response.json();
                setDeliveryBoy(data);
            } catch (error) {
                console.error("Error fetching delivery boy details:", error);
            }
        };

        const fetchDabbawalaRequests = async () => {
            try {
                const response = await fetch(`${BACKEND_URI}/api/auth/dabbawalaRequests/${user.email}`);
                const data = await response.json();
                
                if (Array.isArray(data)) {
                    setDabbawalaRequests(data);
                } else {
                    console.error("Invalid data structure:", data);
                    setDabbawalaRequests([]);
                }
            } catch (error) {
                console.error("Error fetching dabbawala requests:", error);
                setDabbawalaRequests([]);
            }
        };

        fetchDetails();
        fetchDabbawalaRequests();
        
        // Refresh data every 2 minutes
        const intervalId = setInterval(() => {
            fetchDetails();
            fetchDabbawalaRequests();
        }, 120000);
        
        return () => clearInterval(intervalId);
    }, [user.email]);

    const handleAvailabilityToggle = async () => {
        try {
            const response = await fetch(`${BACKEND_URI}/api/auth/delivery-boy/availability/${user.email}`, {
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
            const response = await fetch(`${BACKEND_URI}/api/auth/order/status/${orderId}`, {
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

    // Function to show directions based on the location
    const handleShowDirections = async (latitude, longitude) => {
        const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
        setMapUrl(directionsUrl);
        setShowModal(true);
    };

    const today = new Date().toISOString().split("T")[0];
    const filteredOrders = deliveryBoy?.currentOrders.filter((order) => {
        const orderDate = new Date(order.createdAt).toISOString().split("T")[0];
        return (order.status === "Packed" || order.status === "Out for Delivery") && orderDate === today;
    }) || [];

    const getStatusColor = (status) => {
        switch(status) {
            case "Packed": return "primary";
            case "Out for Delivery": return "warning";
            case "Delivered": return "success";
            default: return "info";
        }
    };

    // Loading state
    if (!deliveryBoy) {
        return (
            <Container className="d-flex justify-content-center align-items-center" style={{ height: "80vh" }}>
                <div className="text-center">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-3">Loading dashboard...</p>
                </div>
            </Container>
        );
    }
    const handledabbastatusChange = async (orderId, status) => {
        try {
            const response = await fetch(`${BACKEND_URI}/api/auth/dabba/status/${orderId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status }),
            });
            const data = await response.json();
            
            // Update the state with the new status
            setDabbawalaRequests(prevRequests => 
                prevRequests.map(request => 
                    request._id === orderId ? { ...request, status: status } : request
                )
            );
        } catch (error) {
            console.error("Error updating order status:", error);
        }
    };

    return (
        <Container fluid className="py-4 px-4 bg-light">
            <Card className="shadow-sm mb-4">
                <Card.Body>
                    <Row className="align-items-center">
                        <Col md={1} className="text-center">
                            <FaUserCircle size={50} className="text-primary mb-2" />
                        </Col>
                        <Col md={8}>
                            <h3 className="mb-0">{deliveryBoy.name}</h3>
                            <div className="d-flex flex-wrap mt-2">
                                <span className="me-3 text-muted"><small>Email: {deliveryBoy.email}</small></span>
                                {/* <span className="me-3 text-muted"><small>Phone: {deliveryBoy.phone}</small></span> */}
                            </div>
                            <div className="mt-1">
                                <small className="text-muted">Assigned Regions: <span className="fw-bold">{deliveryBoy.assignedRegions.join(", ")}</span></small>
                            </div>
                        </Col>
                        <Col md={3} className="text-end">
                            <div className="d-flex flex-column align-items-end">
                                <Badge bg={deliveryBoy.available ? "success" : "danger"} className="mb-2 py-2 px-3">
                                    {deliveryBoy.available ? "ONLINE" : "OFFLINE"}
                                </Badge>
                                <div className="form-check form-switch">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        id="availabilityToggle"
                                        checked={deliveryBoy.available}
                                        onChange={handleAvailabilityToggle}
                                        style={{ width: "3em", height: "1.5em" }}
                                    />
                                    <label className="form-check-label" htmlFor="availabilityToggle">
                                        {deliveryBoy.available ? "Available" : "Unavailable"}
                                    </label>
                                </div>
                            </div>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            <Tabs
                activeKey={activeTab}
                onSelect={(k) => setActiveTab(k)}
                className="mb-3"
                fill
            >
                <Tab eventKey="orders" title={<><FaUtensils className="me-2" />Food Orders</>}>
                    <Card className="shadow-sm">
                        <Card.Header className="bg-white">
                            <div className="d-flex justify-content-between align-items-center">
                                <h5 className="mb-0">Today's Food Orders</h5>
                                <Badge bg="primary" pill>{filteredOrders.length} Orders</Badge>
                            </div>
                        </Card.Header>
                        <Card.Body className="p-0">
                            {filteredOrders.length > 0 ? (
                                <Table responsive hover className="mb-0">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Token</th>
                                            <th>Item</th>
                                            <th>Qty</th>
                                            <th>Price</th>
                                            <th>Restaurant</th>
                                            <th>Address</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredOrders.map((order) => (
                                            <tr key={order._id}>
                                                <td><Badge bg="secondary" pill>#{order._id.slice(-4)}</Badge></td>
                                                <td>{order.itemName}</td>
                                                <td className="text-center">{order.quantity}</td>
                                                <td>₹{order.totalPrice}</td>
                                                <td>{order.restaurantAddress}</td>
                                                <td>
                                                    <Button 
                                                        variant="outline-secondary" 
                                                        size="sm"
                                                        onClick={() => handleShowDirections(order.selectedLocation.lat, order.selectedLocation.lng)}
                                                    >
                                                        <FaMapMarkerAlt className="text-danger me-1" /> Map
                                                    </Button>
                                                </td>
                                                <td>
                                                    <Badge bg={getStatusColor(order.status)} pill className="py-2 px-3">
                                                        {order.status}
                                                    </Badge>
                                                </td>
                                                <td>
                                                    {order.status === "Packed" && (
                                                        <Button variant="warning" size="sm" onClick={() => handleOrderStatusChange(order._id, "Out for Delivery")}>
                                                            <FaMotorcycle className="me-1" /> Out for Delivery
                                                        </Button>
                                                    )}
                                                    {order.status === "Out for Delivery" && (
                                                        <Button variant="success" size="sm" onClick={() => handleOrderStatusChange(order._id, "Delivered")}>
                                                            ✅ Mark Delivered
                                                        </Button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            ) : (
                                <div className="text-center py-5">
                                    <FaUtensils size={40} className="text-muted mb-3" />
                                    <h5>No Food Orders Available</h5>
                                    <p className="text-muted">You don't have any active food orders to deliver today.</p>
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Tab>
                
                <Tab eventKey="dabbawala" title={<><FaBox className="me-2" />Dabbawala Requests</>}>
                    <Card className="shadow-sm">
                        <Card.Header className="bg-white">
                            <div className="d-flex justify-content-between align-items-center">
                                <h5 className="mb-0">Dabbawala Requests</h5>
                                <Badge bg="danger" pill>{dabbawalaRequests.length} Requests</Badge>
                            </div>
                        </Card.Header>
                        <Card.Body className="p-0">
                            {dabbawalaRequests.length > 0 ? (
                                <Table responsive hover className="mb-0">
                                    <thead className="table-danger">
                                        <tr>
                                            <th>ID</th>
                                            <th>Item</th>
                                            <th>Receiver</th>
                                            <th>Contact</th>
                                            <th>Pickup</th>
                                            <th>Delivery</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {dabbawalaRequests.map((request) => (
                                            <tr key={request._id} className="table-light">
                                                <td><Badge bg="danger" pill>#{request._id.slice(-4)}</Badge></td>
                                                <td>{request.item}</td>
                                                <td>{request.receiver}</td>
                                                <td>{request.recei_phone}</td>
                                                <td>
                                                    <Button 
                                                        variant="outline-danger" 
                                                        size="sm"
                                                        onClick={() => handleShowDirections(request.sender.lat, request.sender.lng)}
                                                    >
                                                        <FaMapMarkerAlt className="me-1" /> Pickup
                                                    </Button>
                                                </td>
                                                <td>
                                                    <Button 
                                                        variant="outline-success" 
                                                        size="sm"
                                                        onClick={() => handleShowDirections(request.receiverLocation.lat, request.receiverLocation.lng)}
                                                    >
                                                        <FaMapMarkerAlt className="me-1" /> Deliver
                                                    </Button>
                                                </td>
                                                <td><Badge bg="warning" pill className="py-2 px-3">{request.status}</Badge></td>
                                                <td>
                                                    {request.status === "Pending" && (
                                                        <Button variant="warning" size="sm" onClick={() => handledabbastatusChange(request._id, "Out for Delivery")}>
                                                            <FaMotorcycle className="me-1" /> Out for Delivery
                                                        </Button>
                                                    )}
                                                    {request.status === "Out for Delivery" && (
                                                        <Button variant="success" size="sm" onClick={() => handledabbastatusChange(request._id, "Delivered")}>
                                                            ✅ Mark Delivered
                                                        </Button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            ) : (
                                <div className="text-center py-5">
                                    <FaBox size={40} className="text-muted mb-3" />
                                    <h5>No Dabbawala Requests</h5>
                                    <p className="text-muted">You don't have any pending dabbawala requests at the moment.</p>
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Tab>
            </Tabs>

            <Modal show={showModal} onHide={() => setShowModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Location Directions</Modal.Title>
                </Modal.Header>
                <Modal.Body className="text-center">
                    <p>Click the button below to open Google Maps for directions to the location.</p>
                    <a 
                        href={mapUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="btn btn-primary d-block"
                    >
                        <FaMapMarkerAlt className="me-2" /> Open in Google Maps
                    </a>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModal(false)}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default DeliveryBoyDashboard;
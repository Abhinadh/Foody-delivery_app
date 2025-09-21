import { useState, useEffect } from "react";
import axios from "axios";
import { useUser } from "../context/UserContext";
import "bootstrap/dist/css/bootstrap.min.css";

export default function Orders() {
    const [orders, setOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const { user } = useUser();

    useEffect(() => {
        if (user?.id) {
            fetchOrders();
        }
    }, [user?.id]);

    const fetchOrders = async () => {
        try {
            console.log(user.id);
            const res = await axios.get(`${BACKEND_URI}/api/auth/orders/${user.id}`);
            console.log(res.data);
            setOrders(res.data);
        } catch (error) {
            console.error("Error fetching orders:", error);
        }
    };

    const updateStatus = async (orderId, newStatus) => {
        try {
            await axios.put(`${BACKEND_URI}/api/auth/orders/update-status/${orderId}`, { status: newStatus });
            fetchOrders();
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };

    useEffect(() => {
        const interval = setInterval(() => {
            setOrders((prevOrders) =>
                prevOrders.map((order) => ({
                    ...order,
                    timeRemaining: order.timeRemaining > 0 ? order.timeRemaining - 1 : 0
                }))
            );
        }, 1000);

        return () => clearInterval(interval);
    }, [orders]);

    useEffect(() => {
        const today = new Date().toISOString().split("T")[0];
        const pendingOrders = orders
            .filter((order) => {
                const orderDate = new Date(order.bookingDate).toISOString().split("T")[0];
                return ( order.status === "Prepared" || order.status === "On Order") && orderDate === today;
            })
            .sort((a, b) => new Date(a.bookingDate) - new Date(b.bookingDate));

        setFilteredOrders(pendingOrders);
    }, [orders]);

    return (
        <div className="container mt-4">
            <h2 className="text-center text-primary mb-4">📦 Today's Pending Orders</h2>

            {filteredOrders.length === 0 ? (
                <div className="alert alert-info text-center">No pending orders for today.</div>
            ) : (
                <div className="table-responsive">
                    <table className="table table-striped table-bordered table-hover">
                        <thead className="table-dark text-center">
                            <tr>
                                <th>Product</th>
                                <th>Booking Time</th>
                                <th>Location</th>
                                <th>Status</th>
                                <th>Time Remaining</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody className="text-center align-middle">
                            {filteredOrders.map((order) => (
                                <tr key={order._id}>
                                    <td>
                                        {order.product ? (
                                            <span className="fw-bold">{order.product.name}</span>
                                        ) : (
                                            <span className="text-muted">Product not found</span>
                                        )}
                                    </td>
                                    <td>{new Date(order.bookingDate).toLocaleTimeString()}</td>
                                    <td>{order.location}</td>
                                    <td>
                                        <select
                                            className="form-select"
                                            value={order.status}
                                            onChange={(e) => updateStatus(order._id, e.target.value)}
                                        >
                                            <option value="Pending">Pending</option>
                                            <option value="Prepared">Prepared</option>
                                            <option value="Packed">Packed</option>
                                        </select>
                                    </td>
                                    <td>
                                        <span
                                            className={`badge ${
                                                order.timeRemaining > 0 ? "bg-danger" : "bg-success"
                                            } p-2`}
                                        >
                                            {order.timeRemaining > 0
                                                ? `${Math.floor(order.timeRemaining / 60)}m ${order.timeRemaining % 60}s`
                                                : "00m 00s"}
                                        </span>
                                    </td>
                                    <td>
                                        {order.status !== "Packed" && (
                                            <button
                                                onClick={() => updateStatus(order._id, "Packed")}
                                                className="btn btn-success btn-sm"
                                            >
                                                ✅ Mark as Packed
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

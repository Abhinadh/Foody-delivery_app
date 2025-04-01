import { useState, useEffect } from "react";
import axios from "axios";
//import '../../../styles/Admin.css'

import { useNavigate } from "react-router-dom";
import { useUser } from "../../../context/UserContext";

export default function AdminDashboard() {
    const [restaurants, setRestaurants] = useState([]);
    const [deliveryBoys, setDeliveryBoys] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const { logout } = useUser();
    const navigate = useNavigate();

    useEffect(() => {
        fetchRestaurants();
        fetchDeliveryBoys();
    }, []);

    const fetchRestaurants = async () => {
        try {
            const res = await axios.get("http://localhost:5000/api/auth/admin/restaurants");
            setRestaurants(res.data);
        } catch (error) {
            console.error("Error fetching restaurants:", error);
        }
    };

    const fetchDeliveryBoys = async () => {
        try {
            const res = await axios.get("http://localhost:5000/api/auth/admin/deliveryboys");
            setDeliveryBoys(res.data);
        } catch (error) {
            console.error("Error fetching delivery boys:", error);
        }
    };

    const handleDelete = async (id, role) => {
        try {
            const url = role === "restaurant"
                ? `http://localhost:5000/api/auth/admin/delete/restaurant/${id}`
                : `http://localhost:5000/api/auth/admin/delete/deliveryboy/${id}`;

            await axios.delete(url);
            alert(`${role} deleted successfully`);
            role === "restaurant" ? fetchRestaurants() : fetchDeliveryBoys();
        } catch (error) {
            console.error("Error deleting user:", error);
            alert("Error deleting user");
        }
    };

    const handleApprove = async (id, email) => {
        try {
            await axios.post(`http://localhost:5000/api/auth/admin/approve/restaurant/${id}`);
            alert("Restaurant approved successfully");

            // Send email notification
            await axios.post(`http://localhost:5000/api/auth/admin/send-approval-email`, { email });

            fetchRestaurants();
        } catch (error) {
            console.error("Error approving restaurant:", error.message);
            alert("Error approving restaurant");
        }
    };

    const handleReject = async (id) => {
        try {
            await axios.post(`http://localhost:5000/api/auth/admin/reject/restaurant/${id}`);
            alert("Restaurant rejected successfully");

            fetchRestaurants();
        } catch (error) {
            console.error("Error rejecting restaurant:", error.message);
            alert("Error rejecting restaurant");
        }
    };

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };

    const handleLogout = () => {
        logout();
        navigate("/");
    };

    const extractCoordinates = (address) => {
        const regex = /([-+]?\d{1,3}\.\d+)\s*,\s*([-+]?\d{1,3}\.\d+)/;
        const match = address.match(regex);
        return match ? { latitude: match[1], longitude: match[2] } : null;
    };

    const filteredRestaurants = restaurants.filter((restaurant) =>
        restaurant.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredDeliveryBoys = deliveryBoys.filter((deliveryBoy) =>
        deliveryBoy.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const pendingRestaurants = filteredRestaurants.filter((restaurant) => !restaurant.approved);
    const approvedRestaurants = filteredRestaurants.filter((restaurant) => restaurant.approved);

    return (
        <div>
            <h2 className="heading">Admin Dashboard</h2>

            <div>
                <input
                    type="text"
                    placeholder="Search by name"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    style={{ padding: "5px", marginBottom: "20px" }}
                />
            </div>
            <button onClick={handleLogout} style={{ marginBottom: "20px" }}>
                Logout
            </button>

            <div className="admincontainer">
                <div className="card-container">
                    <h3>Pending Restaurant Approvals</h3>
                    {pendingRestaurants.length === 0 ? <p>No pending restaurants</p> : (
                        pendingRestaurants.map((restaurant) => {
                            const coords = restaurant.location?.lat && restaurant.location?.lng
                                ? { latitude: restaurant.location.lat, longitude: restaurant.location.lng }
                                : extractCoordinates(restaurant.address);

                            return (
                                <div key={restaurant._id}>
                                    <p><strong>Name:</strong> {restaurant.name}</p>
                                    <p><strong>Email:</strong> {restaurant.email}</p>
                                    <p><strong>Address:</strong> {restaurant.address}</p>
                                    <p><strong>Status:</strong> Pending Approval</p>
                                    {coords && (
                                        <p>
                                            <strong>Location:</strong>{" "}
                                            <a 
                                                href={`https://www.google.com/maps?q=${coords.latitude},${coords.longitude}`} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                            >
                                                View on Google Maps
                                            </a>
                                        </p>
                                    )}
                                    <button onClick={() => handleApprove(restaurant._id, restaurant.email)}>Approve</button>
                                    <button onClick={() => handleReject(restaurant._id)}>Reject</button>
                                </div>
                            );
                        })
                    )}
                </div>

                <div className="card-container">
                    <h3>Approved Restaurants</h3>
                    {approvedRestaurants.length === 0 ? <p>No approved restaurants</p> : (
                        approvedRestaurants.map((restaurant) => {
                            const coords = restaurant.location?.lat && restaurant.location?.lng
                                ? { latitude: restaurant.location.lat, longitude: restaurant.location.lng }
                                : extractCoordinates(restaurant.address);

                            return (
                                <div key={restaurant._id}>
                                    <p><strong>Name:</strong> {restaurant.name}</p>
                                    <p><strong>Email:</strong> {restaurant.email}</p>
                                    <p><strong>Address:</strong> {restaurant.address}</p>
                                    <p><strong>Status:</strong> Approved</p>
                                    {coords && (
                                        <p>
                                            <strong>Location:</strong>{" "}
                                            <a 
                                                href={`https://www.google.com/maps?q=${coords.latitude},${coords.longitude}`} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                            >
                                                View on Google Maps
                                            </a>
                                        </p>
                                    )}
                                    <button onClick={() => handleDelete(restaurant._id, "restaurant")}>Delete</button>
                                </div>
                            );
                        })
                    )}
                </div>

                <div className="card-container">
                    <h3>Delivery Boys</h3>
                    {filteredDeliveryBoys.length === 0 ? <p>No delivery boys found</p> : (
                        filteredDeliveryBoys.map((deliveryBoy) => (
                            <div key={deliveryBoy._id}>
                                <p><strong>Name:</strong> {deliveryBoy.name}</p>
                                <p><strong>Email:</strong> {deliveryBoy.email}</p>
                                <p><strong>Assigned Region:</strong> {deliveryBoy.assignedRegion}</p>
                                <button onClick={() => handleDelete(deliveryBoy._id, "deliveryboy")}>Delete</button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

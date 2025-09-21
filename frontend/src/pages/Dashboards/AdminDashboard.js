import { useState, useEffect } from "react";
import axios from "axios";

export default function AdminDashboard() {
    const [restaurants, setRestaurants] = useState([]);
    const [deliveryBoys, setDeliveryBoys] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");  // State for search query

    useEffect(() => {
        fetchRestaurants();
        fetchDeliveryBoys();
    }, []);

    const fetchRestaurants = async () => {
        try {
            const res = await axios.get(`${BACKEND_URI}/api/admin/restaurants`);
            setRestaurants(res.data);
        } catch (error) {
            console.error("Error fetching restaurants:", error);
        }
    };

    const fetchDeliveryBoys = async () => {
        try {
            const res = await axios.get(`${BACKEND_URI}/api/admin/deliveryboys`);
            setDeliveryBoys(res.data);
        } catch (error) {
            console.error("Error fetching delivery boys:", error);
        }
    };

    const handleDelete = async (id, role) => {
        try {
            const url = role === "restaurant"
                ? `${BACKEND_URI}/api/admin/delete/restaurant/${id}`
                : `${BACKEND_URI}/api/admin/delete/deliveryboy/${id}`;

            await axios.delete(url);
            alert(`${role} deleted successfully`);

            // Refresh list after deletion
            role === "restaurant" ? fetchRestaurants() : fetchDeliveryBoys();
        } catch (error) {
            console.error("Error deleting user:", error);
            alert("Error deleting user");
        }
    };

    // Function to handle search input changes
    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };

    // Filtered restaurants based on search query
    const filteredRestaurants = restaurants.filter((restaurant) =>
        restaurant.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Filtered delivery boys based on search query
    const filteredDeliveryBoys = deliveryBoys.filter((deliveryBoy) =>
        deliveryBoy.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div>
            <h2>Admin Dashboard</h2>

            <div>
                <input
                    type="text"
                    placeholder="Search by name"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    style={{ padding: "5px", marginBottom: "20px" }}
                />
            </div>

            <h3>Restaurants</h3>
            {filteredRestaurants.length === 0 ? <p>No restaurants found</p> : (
                filteredRestaurants.map((restaurant) => (
                    <div key={restaurant._id}>
                        <p><strong>Name:</strong> {restaurant.name}</p>
                        <p><strong>Email:</strong> {restaurant.email}</p>
                        <p><strong>Address:</strong> {restaurant.address}</p>
                        <button onClick={() => handleDelete(restaurant._id, "restaurant")}>Delete</button>
                        <hr />
                    </div>
                ))
            )}

            <h3>Delivery Boys</h3>
            {filteredDeliveryBoys.length === 0 ? <p>No delivery boys found</p> : (
                filteredDeliveryBoys.map((deliveryBoy) => (
                    <div key={deliveryBoy._id}>
                        <p><strong>Name:</strong> {deliveryBoy.name}</p>
                        <p><strong>Email:</strong> {deliveryBoy.email}</p>
                        <p><strong>Assigned Region:</strong> {deliveryBoy.assignedRegion}</p>
                        <button onClick={() => handleDelete(deliveryBoy._id, "deliveryboy")}>Delete</button>
                        <hr />
                    </div>
                ))
            )}
        </div>
    );
}

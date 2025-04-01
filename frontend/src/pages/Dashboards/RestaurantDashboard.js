import { useState, useEffect } from "react";
import axios from "axios";
import { useUser } from "../../context/UserContext";
import { useNavigate } from "react-router-dom";
import "../../styles/RestaurantDashboard.css";

export default function RestaurantDashboard() {
    const [menuItems, setMenuItems] = useState([]);
    const [newItem, setNewItem] = useState({
        name: "",
        price: "",
        description: "",
        availability: "",
        image: null,
    });
    const [showModal, setShowModal] = useState(false);

    const { user, logout } = useUser();
    const navigate = useNavigate();

    useEffect(() => {
        if (user?.id) {
            fetchMenuItems();
        }
    }, [user?.id]);

    const fetchMenuItems = async () => {
        try {
            const res = await axios.get(`http://localhost:5000/api/auth/restaurant/${user.id}/menu`);
            if (JSON.stringify(res.data) !== JSON.stringify(menuItems)) {
                setMenuItems(res.data);
            }
        } catch (error) {
            console.error("Error fetching menu items:", error);
        }
    };

    const handleAddMenuItem = async (e) => {
        e.preventDefault();

        if (!user?.id) {
            alert("Error: Missing restaurant ID. Please log in again.");
            return;
        }

        const formData = new FormData();
        formData.append("name", newItem.name);
        formData.append("price", newItem.price);
        formData.append("description", newItem.description);
        formData.append("availability", newItem.availability);
        formData.append("restaurantId", user.id);
        formData.append("image", newItem.image);

        try {
            await axios.post("http://localhost:5000/api/auth/restaurant/menu/add", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            alert("Menu item added successfully!");
            setNewItem({ name: "", price: "", description: "", availability: "", image: null });
            fetchMenuItems();
            setShowModal(false);
        } catch (error) {
            console.error("Error adding menu item:", error.response?.data || error.message);
            alert("Error adding menu item");
        }
    };

    const handleLogout = () => {
        logout();
        navigate("/");
    };

    const handleDeleteMenuItem = async (id) => {
        try {
            await axios.delete(`http://localhost:5000/api/auth/restaurant/menu/delete/${id}`);
            alert("Menu item deleted successfully!");
            fetchMenuItems();
        } catch (error) {
            console.error("Error deleting menu item:", error);
            alert("Error deleting menu item");
        }
    };

    return (
        <div className="abcd-dashboard">
            <h2 className="efgh-title">Restaurant Dashboard</h2>
            <button onClick={handleLogout} className="ijkl-button ijkl-logout">Logout</button>
            <button onClick={() => setShowModal(true)} className="mnop-button mnop-add">Add Menu Item</button>
            <button onClick={() => navigate("/orders")} className="abcd-button abcd-orders">Orders</button>


            {showModal && (
                <div className="qrst-modal">
                    <div className="uvwx-modal-content">
                        <h3>Add Menu Item</h3>
                        <form onSubmit={handleAddMenuItem}>
                            <input type="text" placeholder="Menu Item Name" value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} required className="yzab-input"/>
                            <input type="number" placeholder="Price" value={newItem.price} onChange={(e) => setNewItem({ ...newItem, price: e.target.value })} required className="yzab-input"/>
                            <input type="text" placeholder="Description" value={newItem.description} onChange={(e) => setNewItem({ ...newItem, description: e.target.value })} className="yzab-input"/>
                            <input type="number" placeholder="Availability" value={newItem.availability} onChange={(e) => setNewItem({ ...newItem, availability: parseInt(e.target.value, 10) })} required className="yzab-input"/>
                            <input type="file" onChange={(e) => setNewItem({ ...newItem, image: e.target.files[0] })} className="yzab-input" />
                            <button type="submit" className="cdef-button cdef-submit">Add</button>
                            <button type="button" onClick={() => setShowModal(false)} className="ghij-button ghij-close">Close</button>
                        </form>
                    </div>
                </div>
            )}

            <div className="klmn-menu-grid">
                {menuItems.length === 0 ? (
                    <p className="opqr-message">No menu items available.</p>
                ) : (
                    menuItems.map((item) => (
                        <div key={item._id} className="stuv-menu-item">
                            <p className="wxyz-item-name"><strong>{item.name}</strong></p>
                            <p className="abcd-item-price">Price: ₹{item.price}</p>
                            <p className="efgh-item-desc">{item.description}</p>
                            <p className="ijkl-item-availability">Availability: {item.stockCount}</p>
                            <div className="mnop-menu-image-container">
                                {item._id && <img src={`http://localhost:5000/api/auth/restaurant/menu/image/${item._id}`} alt={item.name} className="qrst-item-img"/>}
                            </div>
                            <button onClick={() => handleDeleteMenuItem(item._id)} className="uvwx-button uvwx-delete">Delete</button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

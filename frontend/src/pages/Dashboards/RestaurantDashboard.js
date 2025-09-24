import { useState, useEffect } from "react";
import axios from "axios";
import { useUser } from "../../context/UserContext";
import { useNavigate } from "react-router-dom";

export default function RestaurantDashboard() {
    const [menuItems, setMenuItems] = useState([]);
    const [newItem, setNewItem] = useState({
        name: "", price: "", description: "", availability: "", image: null,
    });
    const [showModal, setShowModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [currentItem, setCurrentItem] = useState(null);
    const [newAvailability, setNewAvailability] = useState("");
    const [feedback, setFeedback] = useState([]);
    const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);

   
    const { user, logout } = useUser();
    const navigate = useNavigate();

    useEffect(() => {
        if (user?.id) fetchMenuItems();
    }, [user?.id]);

    const fetchMenuItems = async () => {
        try {
            const res = await axios.get(`${process.env.BACKEND_URI}/api/auth/restaurant/${user.id}/menu`);
            if (JSON.stringify(res.data) !== JSON.stringify(menuItems)) {
                setMenuItems(res.data);
            }
        } catch (error) {
            console.error("Error fetching menu items:", error);
        }
    };

    const fetchFeedback = async () => {
        setIsLoadingFeedback(true);
        try {
            const res = await axios.get(`${process.env.BACKEND_URI}/api/auth/restaurant/feedback/fetch/${user.email}`);
            setFeedback(res.data);
            setShowFeedbackModal(true);
        } catch (error) {
            console.error("Error fetching feedback:", error);
            alert("Error loading feedback");
        } finally {
            setIsLoadingFeedback(false);
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
            await axios.post(`${process.env.BACKEND_URI}/api/auth/restaurant/menu/add`, formData, {
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
            await axios.delete(`${process.env.BACKEND_URI}/api/auth/restaurant/menu/delete/${id}`);
            alert("Menu item deleted successfully!");
            fetchMenuItems();
        } catch (error) {
            console.error("Error deleting menu item:", error);
            alert("Error deleting menu item");
        }
    };

    const handleEditAvailability = (item) => {
        setCurrentItem(item);
        setNewAvailability(item.stockCount.toString());
        setShowEditModal(true);
    };

    const handleSaveAvailability = async () => {
        try {
            await axios.put(`${process.env.BACKEND_URI}/api/auth/restaurant/menu/update-availability/${currentItem._id}`, {
                availability: parseInt(newAvailability, 10)
            });
            alert("Availability updated successfully!");
            fetchMenuItems();
            setShowEditModal(false);
        } catch (error) {
            console.error("Error updating availability:", error);
            alert("Error updating availability");
        }
    };

    // Function to render star rating
    const renderStars = (rating) => {
        return "★".repeat(rating) + "☆".repeat(5 - rating);
    };

    const dashboardStyles = {
        container: {
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "30px 20px",
            fontFamily: "'Poppins', sans-serif",
            background: "linear-gradient(to right, #f8f9fa, #e9ecef)",
            borderRadius: "15px",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.1)",
        },
        header: {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "30px",
            borderBottom: "2px solid #dee2e6",
            paddingBottom: "15px"
        },
        title: {
            fontSize: "32px",
            fontWeight: "700",
            color: "#343a40",
            margin: "0",
            background: "linear-gradient(45deg, #343a40, #495057)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
        },
        buttonGroup: {
            display: "flex",
            gap: "15px"
        },
        button: {
            padding: "12px 24px",
            border: "none",
            borderRadius: "8px",
            fontWeight: "600",
            cursor: "pointer",
            transition: "all 0.3s ease"
        },
        primaryBtn: {
            backgroundColor: "#4361ee",
            color: "white",
            boxShadow: "0 4px 6px rgba(67, 97, 238, 0.3)",
        },
        secondaryBtn: {
            backgroundColor: "#3a86ff",
            color: "white",
            boxShadow: "0 4px 6px rgba(58, 134, 255, 0.3)",
        },
        dangerBtn: {
            backgroundColor: "#e63946",
            color: "white",
            boxShadow: "0 4px 6px rgba(230, 57, 70, 0.3)",
        },
        infoBtn: {
            backgroundColor: "#2a9d8f",
            color: "white",
            boxShadow: "0 4px 6px rgba(42, 157, 143, 0.3)",
        },
        menuGrid: {
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "25px",
            marginTop: "30px"
        },
        menuItem: {
            backgroundColor: "white",
            borderRadius: "12px",
            padding: "20px",
            boxShadow: "0 5px 15px rgba(0, 0, 0, 0.05)",
            transition: "transform 0.3s ease, box-shadow 0.3s ease",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column"
        },
        imageContainer: {
            height: "180px",
            overflow: "hidden",
            borderRadius: "8px",
            marginBottom: "15px"
        },
        menuImage: {
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transition: "transform 0.5s ease"
        },
        itemName: {
            fontSize: "20px",
            fontWeight: "700",
            margin: "0 0 10px 0",
            color: "#212529"
        },
        itemPrice: {
            fontSize: "18px",
            fontWeight: "600",
            color: "#4361ee",
            margin: "0 0 8px 0"
        },
        itemDesc: {
            fontSize: "14px",
            color: "#6c757d",
            marginBottom: "10px"
        },
        availability: {
            fontSize: "14px",
            color: "#495057",
            marginBottom: "15px"
        },
        modalOverlay: {
            position: "fixed",
            top: "0",
            left: "0",
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: "1000"
        },
        modal: {
            backgroundColor: "white",
            borderRadius: "15px",
            padding: "30px",
            width: "90%",
            maxWidth: "500px",
            maxHeight: "80vh",
            overflowY: "auto",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.2)",
            animation: "modalFadeIn 0.3s ease"
        },
        modalTitle: {
            fontSize: "24px",
            fontWeight: "700",
            marginBottom: "20px",
            textAlign: "center",
            color: "#343a40"
        },
        form: {
            display: "flex",
            flexDirection: "column",
            gap: "15px"
        },
        input: {
            padding: "14px",
            borderRadius: "8px",
            border: "1px solid #ced4da",
            fontSize: "16px",
            transition: "border-color 0.3s ease",
            outline: "none"
        },
        noItems: {
            textAlign: "center",
            fontSize: "18px",
            color: "#6c757d",
            marginTop: "40px",
            gridColumn: "1 / -1"
        },
        itemActions: {
            display: "flex",
            gap: "10px",
            marginTop: "auto",
            flexWrap: "wrap"
        },
        feedbackItem: {
            backgroundColor: "#f8f9fa",
            borderRadius: "8px",
            padding: "15px",
            marginBottom: "15px",
            borderLeft: "4px solid #4361ee"
        },
        feedbackHeader: {
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "8px"
        },
        stars: {
            color: "#ffc107",
            fontSize: "18px",
            letterSpacing: "2px"
        },
        feedbackDate: {
            fontSize: "12px",
            color: "#6c757d"
        },
        feedbackComment: {
            fontSize: "14px",
            color: "#495057",
            margin: "5px 0"
        },
        noFeedback: {
            textAlign: "center",
            color: "#6c757d",
            margin: "30px 0"
        },
        loadingSpinner: {
            textAlign: "center",
            padding: "30px",
            color: "#4361ee"
        }
    };

    return (
        <div style={dashboardStyles.container}>
            <div style={dashboardStyles.header}>
                <h2 style={dashboardStyles.title}>Restaurant Dashboard</h2>
                <div style={dashboardStyles.buttonGroup}>
                    <button 
                        onClick={() => navigate("/orders")} 
                        style={{...dashboardStyles.button, ...dashboardStyles.secondaryBtn}}
                    >
                        Orders
                    </button>
                    <button 
                        onClick={fetchFeedback} 
                        style={{...dashboardStyles.button, ...dashboardStyles.infoBtn}}
                        disabled={isLoadingFeedback}
                    >
                        {isLoadingFeedback ? "Loading..." : "View Feedback"}
                    </button>
                    <button 
                        onClick={() => setShowModal(true)} 
                        style={{...dashboardStyles.button, ...dashboardStyles.primaryBtn}}
                    >
                        Add Menu Item
                    </button>
                    <button 
                        onClick={handleLogout} 
                        style={{...dashboardStyles.button, ...dashboardStyles.dangerBtn}}
                    >
                        Logout
                    </button>
                </div>
            </div>

            <div style={dashboardStyles.menuGrid}>
                {menuItems.length === 0 ? (
                    <p style={dashboardStyles.noItems}>No menu items available.</p>
                ) : (
                    menuItems.map((item) => (
                        <div key={item._id} style={dashboardStyles.menuItem}>
                            <div style={dashboardStyles.imageContainer}>
                                {item._id && 
                                    <img 
                                        src={`${process.env.BACKEND_URI}/api/auth/restaurant/menu/image/${item._id}`} 
                                        alt={item.name} 
                                        style={dashboardStyles.menuImage}
                                    />
                                }
                            </div>
                            <p style={dashboardStyles.itemName}>{item.name}</p>
                            <p style={dashboardStyles.itemPrice}>₹{item.price}</p>
                            <p style={dashboardStyles.itemDesc}>{item.description}</p>
                            <p style={dashboardStyles.availability}>Availability: {item.stockCount}</p>
                            <div style={dashboardStyles.itemActions}>
                                <button 
                                    onClick={() => handleEditAvailability(item)} 
                                    style={{
                                        ...dashboardStyles.button, 
                                        ...dashboardStyles.secondaryBtn,
                                        flex: "1",
                                        padding: "10px 15px",
                                        fontSize: "14px"
                                    }}
                                >
                                    Edit Availability
                                </button>
                                <button 
                                    onClick={() => handleDeleteMenuItem(item._id)} 
                                    style={{
                                        ...dashboardStyles.button, 
                                        ...dashboardStyles.dangerBtn,
                                        flex: "1",
                                        padding: "10px 15px",
                                        fontSize: "14px"
                                    }}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {showModal && (
                <div style={dashboardStyles.modalOverlay}>
                    <div style={dashboardStyles.modal}>
                        <h3 style={dashboardStyles.modalTitle}>Add Menu Item</h3>
                        <form onSubmit={handleAddMenuItem} style={dashboardStyles.form}>
                            <input 
                                type="text" 
                                placeholder="Menu Item Name" 
                                value={newItem.name} 
                                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} 
                                required 
                                style={dashboardStyles.input}
                            />
                            <input 
                                type="number" 
                                placeholder="Price" 
                                value={newItem.price} 
                                onChange={(e) => setNewItem({ ...newItem, price: e.target.value })} 
                                required 
                                style={dashboardStyles.input}
                            />
                            <input 
                                type="text" 
                                placeholder="Description" 
                                value={newItem.description} 
                                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })} 
                                style={dashboardStyles.input}
                            />
                            <input 
                                type="number" 
                                placeholder="Availability" 
                                value={newItem.availability} 
                                onChange={(e) => setNewItem({ ...newItem, availability: parseInt(e.target.value, 10) })} 
                                required 
                                style={dashboardStyles.input}
                            />
                            <input 
                                type="file" 
                                onChange={(e) => setNewItem({ ...newItem, image: e.target.files[0] })} 
                                style={{...dashboardStyles.input, padding: "10px"}}
                            />
                            <div style={{display: "flex", gap: "10px", marginTop: "10px"}}>
                                <button 
                                    type="submit" 
                                    style={{
                                        ...dashboardStyles.button, 
                                        ...dashboardStyles.primaryBtn,
                                        flex: "1"
                                    }}
                                >
                                    Add
                                </button>
                                <button 
                                    type="button" 
                                    onClick={() => setShowModal(false)} 
                                    style={{
                                        ...dashboardStyles.button, 
                                        backgroundColor: "#ced4da",
                                        color: "#495057",
                                        flex: "1"
                                    }}
                                >
                                    Close
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showEditModal && currentItem && (
                <div style={dashboardStyles.modalOverlay}>
                    <div style={dashboardStyles.modal}>
                        <h3 style={dashboardStyles.modalTitle}>Edit Availability</h3>
                        <div style={dashboardStyles.form}>
                            <p style={{fontWeight: "600", color: "#343a40"}}>
                                {currentItem.name}
                            </p>
                            <p style={{fontSize: "14px", color: "#6c757d", marginBottom: "15px"}}>
                                Current availability: {currentItem.stockCount}
                            </p>
                            <input 
                                type="number" 
                                placeholder="New Availability" 
                                value={newAvailability} 
                                onChange={(e) => setNewAvailability(e.target.value)} 
                                required 
                                style={dashboardStyles.input}
                            />
                            <div style={{display: "flex", gap: "10px", marginTop: "10px"}}>
                                <button 
                                    onClick={handleSaveAvailability} 
                                    style={{
                                        ...dashboardStyles.button, 
                                        ...dashboardStyles.primaryBtn,
                                        flex: "1"
                                    }}
                                >
                                    Save
                                </button>
                                <button 
                                    onClick={() => setShowEditModal(false)} 
                                    style={{
                                        ...dashboardStyles.button, 
                                        backgroundColor: "#ced4da",
                                        color: "#495057",
                                        flex: "1"
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showFeedbackModal && (
                <div style={dashboardStyles.modalOverlay}>
                    <div style={{...dashboardStyles.modal, maxWidth: "600px"}}>
                        <h3 style={dashboardStyles.modalTitle}>Customer Feedback</h3>
                        
                        {isLoadingFeedback ? (
                            <div style={dashboardStyles.loadingSpinner}>
                                Loading feedback...
                            </div>
                        ) : feedback.length === 0 ? (
                            <p style={dashboardStyles.noFeedback}>No feedback received yet.</p>
                        ) : (
                            <div>
                                {feedback.map((item) => (
                                    <div key={item._id} style={dashboardStyles.feedbackItem}>
                                        <div style={dashboardStyles.feedbackHeader}>
                                            <div style={dashboardStyles.stars}>{renderStars(item.rating)}</div>
                                            <div style={dashboardStyles.feedbackDate}>
                                                {new Date(item.createdAt).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric'
                                                })}
                                            </div>
                                        </div>
                                        {item.comment && (
                                            <p style={dashboardStyles.feedbackComment}>"{item.comment}"</p>
                                        )}
                                        {item.orderId && (
                                            <p style={{fontSize: "12px", color: "#6c757d"}}>
                                                Order ID: {item.orderId}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                        
                        <div style={{display: "flex", justifyContent: "center", marginTop: "20px"}}>
                            <button 
                                onClick={() => setShowFeedbackModal(false)} 
                                style={{
                                    ...dashboardStyles.button, 
                                    backgroundColor: "#ced4da",
                                    color: "#495057",
                                    width: "50%"
                                }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
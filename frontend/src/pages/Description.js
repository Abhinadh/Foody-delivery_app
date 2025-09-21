import React, { useEffect, useState } from "react";
import { useUser } from "../context/UserContext";
import axios from "axios";
import { FaStar, FaStarHalfAlt } from "react-icons/fa";
import { GoogleMap, LoadScript, Marker, Autocomplete } from "@react-google-maps/api";
import "../styles/Description.css";
import { IoMdAddCircleOutline } from "react-icons/io";
import OrderModal from "./OrderModal"; 

const GOOGLE_MAPS_API_KEY = "AIzaSyCPfWpbibiw83RQsxELttr0vL9Ic64Sf9s"; // Replace with actual API Key

const DescriptionModal = ({ item, onClose }) => {
    const { user } = useUser();
    const [food, setFood] = useState(item);
    const [restaurantName, setRestaurantName] = useState("Loading...");
    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
    const [buyerName, setBuyerName] = useState("");
    const [restaurantEmail, setRestaurantEmail] = useState("");
    const [showLoginMessage, setShowLoginMessage] = useState(false);
    const BACKEND_URI =process.env.BACKEND_URI

    useEffect(() => {
        if (item && item._id) {
            axios.get(`${BACKEND_URI}/api/auth/menu-items/${item._id}`)
                .then(res => {
                    setFood(res.data);
                    if (res.data.restaurantId) {
                        fetchRestaurantName(res.data.restaurantId);
                    }
                })
                .catch(err => console.error(err));
        }
    }, [item]);

    useEffect(() => {
        if (user?.email) {
            axios.get(`${BACKEND_URI}/api/auth/user/profile?email=${user.email}`)
                .then(response => {
                    setBuyerName(response.data.name);
                })
                .catch(error => {
                    console.error("Error fetching user profile:", error);
                });
        }
    }, [user]);

    const fetchRestaurantName = async (restaurantId) => {
        try {
            const response = await axios.get(`${BACKEND_URI}/api/auth/admin/restaurants/name/${restaurantId}`);
            setRestaurantName(response.data.name || "Unknown");
            setRestaurantEmail(response.data.email || "Unknown");
            console.log(response.data.email)
        } catch (error) {
            console.error("Error fetching restaurant name:", error);
            setRestaurantName("Error fetching name");
        }
    };

    const renderStars = (rating) => {
        const fullStars = Math.floor(rating);
        const halfStar = rating % 1 >= 0.5;
        return (
            <div className="abc-rating">
                {[...Array(fullStars)].map((_, i) => <FaStar key={`full-${i}`} color="red" />)}
                {halfStar && <FaStarHalfAlt key="half" color="red" />}
            </div>
        );
    };

    const handleBuyNow = () => {
        if (!user || !user.id) {
            setShowLoginMessage(true);
            return;
        }
        setIsOrderModalOpen(true);
    };

    const addToCart = () => {
        if (!user || !user.id) {
            setShowLoginMessage(true);
            return;
        }

        if (!food || !food._id) {
            alert("Food ID is missing.");
            return;
        }

        axios.post(`${BACKEND_URI}/api/auth/cart/add`, {
            userId: user.id,
            itemId: food._id,
            quantity: 1
        })
        .then(() => alert(" added to cart!"))
        .catch(err => console.error(err));
    };

    useEffect(() => {
        if (showLoginMessage) {
            // Auto-hide the message after 4 seconds
            const timer = setTimeout(() => {
                setShowLoginMessage(false);
            }, 4000);
            
            return () => clearTimeout(timer);
        }
    }, [showLoginMessage]);

    if (!food) return <p className="lmn-loading">Loading...</p>;

    return (
        <div className="pqr-modal-overlay">
            <div className="stu-modal-content">
                <button className="vwx-close-btn" onClick={onClose}>×</button>
    
                {showLoginMessage ? (
                    <div className="login-message-container">
                        <div className="login-message">
                            <div className="login-doodle">
                                <div className="doodle-character">
                                    <div className="doodle-face">
                                        <div className="doodle-eyes">
                                            <div className="doodle-eye"></div>
                                            <div className="doodle-eye"></div>
                                        </div>
                                        <div className="doodle-mouth"></div>
                                    </div>
                                    <div className="doodle-body">
                                        <div className="doodle-lock"></div>
                                    </div>
                                </div>
                            </div>
                            <h3>Please Login First</h3>
                            <p className="login-message-text">You need to be logged in to purchase or add items to your cart!</p>
                            <div className="login-line-animation"></div>
                        </div>
                    </div>
                ) : isOrderModalOpen ? (
                    <OrderModal
                        itemId={food._id}
                        quantities={food.stockCount}
                        name={food.name}
                        restaurantName={restaurantName}
                        restaurantEmail={restaurantEmail}
                        buyerName={buyerName}
                        userId={user.id}
                        price={food.price}
                        onClose={() => setIsOrderModalOpen(false)}
                    />
                ) : (
                    <>
                        <img className="def-img" src={`${BACKEND_URI}/api/auth/restaurant/menu/image/${food._id}`} alt={food.name} />
                        <div className="ghi-details">
                            <h2>{food.name}</h2>
                            <div className="jkl-stars">{renderStars(food.rating)}</div>
                            <p><strong>Price:</strong> ₹{food.price}</p>
                            <p><strong>Restaurant:</strong> {restaurantName}</p>
                            <p><strong>Description:</strong> {food.description || "No description available."}</p>
                            <button className="mno-buy-btn" onClick={handleBuyNow}>Buy Now</button>
                            <button className="mno-add-btn" onClick={addToCart}>
                                <IoMdAddCircleOutline style={{ marginRight: "5px", verticalAlign: "middle", fontSize: "1.2em" }}/> Add
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default DescriptionModal;
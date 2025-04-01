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



    useEffect(() => {
        if (item && item._id) {
            axios.get(`http://localhost:5000/api/auth/menu-items/${item._id}`)
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
            axios.get(`http://localhost:5000/api/auth/user/profile?email=${user.email}`)
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
            const response = await axios.get(`http://localhost:5000/api/auth/admin/restaurants/name/${restaurantId}`);
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

    const addToCart = () => {
        if (!user || !user.id) {
            alert("User ID is missing.");
            return;
        }
        if (!food || !food._id) {
            alert("Food ID is missing.");
            return;
        }

        axios.post("http://localhost:5000/api/auth/cart/add", {
            userId: user.id,
            itemId: food._id,
            quantity: 1
        })
        .then(() => alert(" added to cart!"))
        .catch(err => console.error(err));
    };

    

    if (!food) return <p className="lmn-loading">Loading...</p>;

    return (
        <div className="pqr-modal-overlay">
            <div className="stu-modal-content">
                <button className="vwx-close-btn" onClick={onClose}>×</button>
    
                {isOrderModalOpen ? (
                    <OrderModal
                        itemId={food._id}
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
                        <img className="def-img" src={`http://localhost:5000/api/auth/restaurant/menu/image/${food._id}`} alt={food.name} />
                        <div className="ghi-details">
                            <h2>{food.name}</h2>
                            <div className="jkl-stars">{renderStars(food.rating)}</div>
                            <p><strong>Price:</strong> ₹{food.price}</p>
                            <p><strong>Restaurant:</strong> {restaurantName}</p>
                            <p><strong>Description:</strong> {food.description || "No description available."}</p>
                            <button className="mno-buy-btn" onClick={() => setIsOrderModalOpen(true)}>Buy Now</button>
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

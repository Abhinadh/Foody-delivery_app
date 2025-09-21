import React, { useEffect, useState } from "react";
import { useUser } from "../context/UserContext";
import axios from "axios";
import "../styles/Cart.css";
import { useNavigate } from "react-router-dom";
import { GoogleMap, LoadScriptNext, Marker, Autocomplete } from "@react-google-maps/api";
import { Plus, Minus, LocateFixed } from "lucide-react";
import Swal from "sweetalert2";
import "../styles/Cartlocation.css"

const GOOGLE_MAPS_API_KEY = "AIzaSyDfnv9HFPrIMlVBMoFSl6LSBQj5G3rbOJo";
const RAZORPAY_KEY = "rzp_test_QK253G04y7gzR4";

const Cart = () => {
    const { user } = useUser();
    const [cartItems, setCartItems] = useState([]);
    const [isOrdering, setIsOrdering] = useState(false);
    const [orderMessage, setOrderMessage] = useState("");
    const navigate = useNavigate();
    
    // Add states for buyer name and restaurant information
    const [buyerName, setBuyerName] = useState("");
    const [restaurantInfoMap, setRestaurantInfoMap] = useState({});
    
    // Location and map states
    const [showLocationModal, setShowLocationModal] = useState(false);
    const [location, setLocation] = useState("");
    const [mapCenter, setMapCenter] = useState({ lat: 20.5937, lng: 78.9629 }); // India's center
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [autocomplete, setAutocomplete] = useState(null);
    const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
    
    useEffect(() => {
        if (user?.id) {
            fetchCartItems();
        }
    }, [user]);

    // Fetch user profile information
    useEffect(() => {
        if (user?.email) {
            axios.get(`${process.env.BACKEND_URI}/api/auth/user/profile?email=${user.email}`)
                .then(response => {
                    setBuyerName(response.data.name);
                })
                .catch(error => {
                    console.error("Error fetching user profile:", error);
                });
        }
    }, [user]);

    useEffect(() => {
        if (window.google) {
            setIsGoogleLoaded(true);
        }
    }, []);

    // Fetch restaurant information for each unique restaurant ID
    useEffect(() => {
        const fetchRestaurantInfo = async () => {
            const restaurantIds = [...new Set(cartItems
                .filter(item => item.item.restaurantId)
                .map(item => item.item.restaurantId))];
            
            const infoMap = {};
            
            for (const restaurantId of restaurantIds) {
                try {
                    const response = await axios.get(`${BACKEND_URI}/api/auth/admin/restaurants/name/${restaurantId}`);
                    infoMap[restaurantId] = {
                        name: response.data.name || "Unknown",
                        email: response.data.email || "Unknown"
                    };
                } catch (error) {
                    console.error(`Error fetching restaurant info for ID ${restaurantId}:`, error);
                    infoMap[restaurantId] = {
                        name: "Error fetching name",
                        email: "Unknown"
                    };
                }
            }
            
            setRestaurantInfoMap(infoMap);
        };
        
        if (cartItems.length > 0) {
            fetchRestaurantInfo();
        }
    }, [cartItems]);

    const fetchCartItems = async () => {
        try {
            const { data } = await axios.get(`${BACKEND_URI}/api/auth/cart/${user.id}`);
            console.log("Cart Data from Backend:", data);
            setCartItems(data);
        } catch (error) {
            console.error("Error fetching cart:", error);
        }
    };

    const removeItem = async (cartId) => {
        try {
            await axios.delete(`${BACKEND_URI}/api/auth/cart/remove/${cartId}`);
            setCartItems(cartItems.filter(item => item._id !== cartId));
        } catch (error) {
            console.error("Error removing item:", error);
        }
    };

    const updateQuantity = async (cartId, newQuantity) => {
        if (newQuantity < 1) return;

        try {
            await axios.put(`${BACKEND_URI}/api/auth/cart/update/${cartId}`, { quantity: newQuantity });
            setCartItems(cartItems.map(item => 
                item._id === cartId ? { ...item, quantity: newQuantity } : item
            ));
        } catch (error) {
            console.error("Error updating quantity:", error);
        }
    };

    const getCurrentLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    setMapCenter({ lat, lng });
                    setSelectedLocation({ lat, lng });
                    const address = await getAddressFromCoordinates(lat, lng);
                    setLocation(address);
                },
                (error) => {
                    console.error("Error getting location:", error);
                    Swal.fire("Error", "Could not fetch location. Please enter manually.", "error");
                }
            );
        } else {
            Swal.fire("Error", "Geolocation is not supported by this browser.", "error");
        }
    };

    const getAddressFromCoordinates = async (lat, lng) => {
        try {
            const response = await axios.get(
                `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`
            );
            return response.data.results[0]?.formatted_address || "Location not found";
        } catch (error) {
            console.error("Error fetching address:", error);
            return "Error fetching address";
        }
    };

    const handlePlaceSelect = () => {
        if (autocomplete !== null) {
            const place = autocomplete.getPlace();
            if (place.geometry && place.geometry.location) {
                const lat = place.geometry.location.lat();
                const lng = place.geometry.location.lng();
                setSelectedLocation({ lat, lng });
                setMapCenter({ lat, lng });
                setLocation(place.formatted_address);
            }
        }
    };

    // Load Razorpay script dynamically
    const loadRazorpayScript = () => {
        return new Promise((resolve) => {
            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const startOrderProcess = () => {
        if (cartItems.length === 0) {
            Swal.fire("Error", "Your cart is empty", "error");
            return;
        }
        setShowLocationModal(true);
    };

    const handlePayment = async () => {
        if (!location || !selectedLocation) {
            Swal.fire("Error", "Please select a delivery location", "error");
            return;
        }

        const isLoaded = await loadRazorpayScript();
        if (!isLoaded) {
            Swal.fire("Error", "Razorpay SDK failed to load. Check your internet connection.", "error");
            return;
        }

        const totalAmount = cartItems.reduce((sum, item) => sum + item.item.price * item.quantity, 0);

        const options = {
            key: RAZORPAY_KEY,
            amount: totalAmount * 100, // Amount in paise
            currency: "INR",
            name: "Food Delivery",
            description: `Payment for ${cartItems.length} items`,
            image: "https://yourlogo.com/logo.png", // Replace with your logo
            handler: function (response) {
                // Payment was successful, now place all orders
                placeAllOrders(response.razorpay_payment_id);
            },
            prefill: {
                name: buyerName || user.name || user.username,
                email: user.email,
                contact: user.phone || "9999999999" // Replace with actual user contact if available
            },
            theme: {
                color: "#F37254"
            }
        };

        const razorpay = new window.Razorpay(options);
        razorpay.open();
    };

    const placeAllOrders = async (paymentId) => {
        setIsOrdering(true);
        setOrderMessage("Processing your order...");
        setShowLocationModal(false);
        
        try {
            // Create an array of promises for each order
            const orderPromises = cartItems.map(async (cartItem) => {
                // Get restaurant info from the map or use fallbacks
                const restaurantInfo = restaurantInfoMap[cartItem.item.restaurantId] || {
                    name: cartItem.item.restaurant || "Unknown Restaurant",
                    email: cartItem.item.restaurantEmail || "restaurant@example.com"
                };
                
                // Make sure we have all required fields from the backend requirement
                const orderData = {
                    userId: user.id,
                    itemId: cartItem.item._id,
                    quantity: cartItem.quantity,
                    totalPrice: cartItem.item.price * cartItem.quantity,
                    restaurantName: restaurantInfo.name,
                    restaurantEmail: restaurantInfo.email,
                    location: location,
                    selectedLocation:selectedLocation,
                    buyerName: buyerName || user.name || user.username,
                  //  paymentId: paymentId // Optional field
                };
    
                // Debug logging to check fields
                console.log("Sending order data:", orderData);
    
                // Verify all required fields are present
                const requiredFields = ["userId", "itemId", "quantity", "totalPrice", "restaurantName", "restaurantEmail", "location", "buyerName"];
                const missingFields = requiredFields.filter(field => !orderData[field]);
                
                if (missingFields.length > 0) {
                    console.error("Missing required fields:", missingFields);
                    throw new Error(`Missing required fields: ${missingFields.join(", ")}`);
                }
    
                // Place the order
                return axios.post(`${BACKEND_URI}/api/auth/place`, orderData);
            });
    
            const results = await Promise.all(orderPromises);
            console.log("All orders placed successfully:", results);
            
            await axios.delete(`${BACKEND_URI}/api/auth/cart/clear/${user.id}`);
            
            Swal.fire("Success!", "All orders placed successfully!", "success");
            setCartItems([]);
            
            setTimeout(() => {
                navigate(-1);
            }, 2000);
            
        } catch (error) {
            console.error("Error placing orders:", error);
            Swal.fire("Error", `Error placing orders: ${error.message}`, "error");
        } finally {
            setIsOrdering(false);
            setOrderMessage("");
        }
    };

    const totalAmount = cartItems.reduce((sum, item) => sum + item.item.price * item.quantity, 0);

    // Helper function to get restaurant name for display
    const getRestaurantName = (cartItem) => {
        if (cartItem.item.restaurantId && restaurantInfoMap[cartItem.item.restaurantId]) {
            return restaurantInfoMap[cartItem.item.restaurantId].name;
        }
        return cartItem.item.restaurant || "Unknown Restaurant";
    };

    return (
        <div className="vwcrz-cart-container">
            <h2>My Cart</h2>
            
            {orderMessage && (
                <div className={`vwcrz-order-message ${isOrdering ? 'loading' : ''}`}>
                    {orderMessage}
                </div>
            )}
            
            <div className="vwcrz-cart-list">
                {cartItems.length === 0 ? (
                    <p className="vwcrz-empty-cart">Your cart is empty</p>
                ) : (
                    cartItems.map((cartItem) => (
                        <div key={cartItem._id} className="vwcrz-cart-item">
                            <img src={`${BACKEND_URI}/api/auth/restaurant/menu/image/${cartItem.item._id}`} 
                                alt={cartItem.item.name} className="vwcrz-item-image" />
                            <div className="vwcrz-item-details">
                                <h3>{cartItem.item.name}</h3>
                                <p>{cartItem.item.description}</p>
                                <p className="vwcrz-restaurant-name">From: {getRestaurantName(cartItem)}</p>
                            </div>
                            <span className="vwcrz-item-price">₹{cartItem.item.price}</span>
                            <div className="vwcrz-actions">
                                <button onClick={() => updateQuantity(cartItem._id, cartItem.quantity - 1)} 
                                    disabled={cartItem.quantity <= 1 || isOrdering}>-</button>
                                <span>{cartItem.quantity}</span>
                                <button onClick={() => updateQuantity(cartItem._id, cartItem.quantity + 1)}
                                    disabled={isOrdering}>+</button>
                                <button onClick={() => removeItem(cartItem._id)} 
                                    className="vwcrz-remove"
                                    disabled={isOrdering}>Remove</button>
                            </div>
                        </div>
                    ))
                )}
            </div>
    
            {/* Fixed Total Price Box */}
            <div className="vwcrz-total-container">
                <span>Total: ₹{totalAmount.toFixed(2)}</span>
            </div>
    
            <button 
                className={`vwcrz-order-button ${isOrdering ? 'loading' : ''}`}
                onClick={startOrderProcess}
                disabled={isOrdering || cartItems.length === 0}>
                {isOrdering ? 'Processing...' : 'Order All'}
            </button>

            {/* Location Modal */}
            {showLocationModal && (
                <div className="vwcrz-location-modal-overlay">
                    <div className="vwcrz-location-modal">
                        <button className="vwcrz-close-btn" onClick={() => setShowLocationModal(false)}>×</button>
                        
                        <div className="vwcrz-location-container">
                            <h3>Delivery Location</h3>
                            
                            <div className="vwcrz-location-input-container">
                                <LoadScriptNext googleMapsApiKey={GOOGLE_MAPS_API_KEY} libraries={["places"]} onLoad={() => setIsGoogleLoaded(true)}>
                                    <Autocomplete onLoad={(auto) => setAutocomplete(auto)} onPlaceChanged={handlePlaceSelect}>
                                        <input 
                                            type="text" 
                                            value={location} 
                                            onChange={(e) => setLocation(e.target.value)} 
                                            className="vwcrz-location-input"
                                            placeholder="Search or enter delivery address" 
                                        />
                                    </Autocomplete>
                                </LoadScriptNext>
                                <button className="vwcrz-gps-btn" onClick={getCurrentLocation}>
                                    <LocateFixed size={18} />
                                </button>
                            </div>
                            
                            <div className="vwcrz-map-container">
                                {isGoogleLoaded && (
                                    <LoadScriptNext googleMapsApiKey={GOOGLE_MAPS_API_KEY} libraries={["places"]}>
                                        <GoogleMap 
                                            mapContainerStyle={{ width: "100%", height: "100%" }} 
                                            center={mapCenter} 
                                            zoom={14}
                                        >
                                            {selectedLocation && <Marker position={selectedLocation} />}
                                        </GoogleMap>
                                    </LoadScriptNext>
                                )}
                            </div>
                            
                            <div className="vwcrz-modal-actions">
                                <button className="vwcrz-cancel-btn" onClick={() => setShowLocationModal(false)}>Cancel</button>
                                <button className="vwcrz-confirm-btn" onClick={handlePayment}>Proceed to Payment</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Cart;
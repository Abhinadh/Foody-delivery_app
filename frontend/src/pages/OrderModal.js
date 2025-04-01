import React, { useState, useEffect } from "react";
import { GoogleMap, LoadScriptNext, Marker, Autocomplete } from "@react-google-maps/api";
import axios from "axios";
import { Plus, Minus, LocateFixed } from "lucide-react"; 
import Swal from "sweetalert2"; // Import SweetAlert2
import "../styles/OrderModal.css";

const GOOGLE_MAPS_API_KEY = "AIzaSyDfnv9HFPrIMlVBMoFSl6LSBQj5G3rbOJo";
const RAZORPAY_KEY = "rzp_test_QK253G04y7gzR4"; // Replace with your Razorpay Key

const OrderModal = ({ itemId, name, restaurantName, restaurantEmail, buyerName, userId, price, onClose }) => {
    const [quantity, setQuantity] = useState(1);
    const [location, setLocation] = useState("");
    const [mapCenter, setMapCenter] = useState({ lat: 20.5937, lng: 78.9629 });
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [autocomplete, setAutocomplete] = useState(null);
    const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);

    useEffect(() => {
        if (window.google) {
            setIsGoogleLoaded(true);
        }
    }, []);

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
                    alert("Could not fetch location. Please enter manually.");
                }
            );
        } else {
            alert("Geolocation is not supported by this browser.");
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

    const updateQuantity = (change) => {
        setQuantity((prevQuantity) => Math.max(1, prevQuantity + change));
    };

    const placeOrder = () => {
        axios.post("http://localhost:5000/api/auth/place", {
            userId,
            itemId,
            quantity,
            totalPrice: price * quantity,
            restaurantName,
            restaurantEmail,
            location,
            buyerName
        })
        .then(() => {
            Swal.fire("Success!", "Order placed successfully!", "success");
            onClose();
        })
        .catch(err => console.error(err));
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

    const handlePayment = async () => {
        const isLoaded = await loadRazorpayScript();
        if (!isLoaded) {
            Swal.fire("Error", "Razorpay SDK failed to load. Check your internet connection.", "error");
            return;
        }

        const options = {
            key: RAZORPAY_KEY,
            amount: price * quantity * 100, // Amount in paise
            currency: "INR",
            name: restaurantName,
            description: `Payment for ${name}`,
            image: "https://yourlogo.com/logo.png", // Replace with your logo
            handler: function (response) {
                Swal.fire("Payment Successful!", "Your order is being processed.", "success");
                placeOrder(); // Place order after successful payment
            },
            prefill: {
                name: buyerName,
                email: restaurantEmail,
                contact: "9999999999" // Replace with actual user contact if available
            },
            theme: {
                color: "#F37254"
            }
        };

        const razorpay = new window.Razorpay(options);
        razorpay.open();
    };

    return (
        <div className="rt-overlay">
            <div className="yu-modal">
                <button className="fg-close-btn" onClick={onClose}>×</button>
                <div className="left-section">
                    <h2 className="hi-header">Confirm Your Order</h2>
                    <p className="jk-info"><strong>Item:</strong> {name}</p>
                    <p className="jk-info"><strong>Restaurant:</strong> {restaurantName}</p>
                    <p className="jk-info"><strong>Buyer Name:</strong> {buyerName}</p>

                    <label className="mn-label">Quantity:</label>
                    <div className="quantity-control">
                        <button className="quantity-btn" onClick={() => updateQuantity(-1)}><Minus size={16} /></button>
                        <span className="quantity-value">{quantity}</span>
                        <button className="quantity-btn" onClick={() => updateQuantity(1)}><Plus size={16} /></button>
                    </div>

                    <label className="op-label">Location:</label>
                    <div className="location-container">
                        <LoadScriptNext googleMapsApiKey={GOOGLE_MAPS_API_KEY} libraries={["places"]} onLoad={() => setIsGoogleLoaded(true)}>
                            <Autocomplete onLoad={(auto) => setAutocomplete(auto)} onPlaceChanged={handlePlaceSelect}>
                                <input 
                                    type="text" 
                                    value={location} 
                                    onChange={(e) => setLocation(e.target.value)} 
                                    className="qr-location-input"
                                    placeholder="Search or enter location" 
                                />
                            </Autocomplete>
                        </LoadScriptNext>
                        <button className="gps-btn" onClick={getCurrentLocation}>
                            <LocateFixed size={18} />
                        </button>
                    </div>

                    <button className="uv-order-btn" onClick={handlePayment}>Confirm Order</button>
                </div>

                <div className="right-section">
                    {isGoogleLoaded && (
                        <LoadScriptNext googleMapsApiKey={GOOGLE_MAPS_API_KEY} libraries={["places"]}>
                            <GoogleMap mapContainerStyle={{ width: "100%", height: "100%" }} center={mapCenter} zoom={14}>
                                {selectedLocation && <Marker position={selectedLocation} />}
                            </GoogleMap>
                        </LoadScriptNext>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OrderModal;

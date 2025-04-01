import { useState, useEffect } from "react";
import axios from "axios";
import "../styles/Modal.css";
import { useUser } from "../context/UserContext";
import { useNavigate } from "react-router-dom";
import image from "../assets/medium-shot-cartoonish-boy-with-burger.jpg";
import { FaUser, FaUtensils, FaMotorcycle } from "react-icons/fa";
import SuccessModal from "./Successmodal"; // Import SuccessModal

const GOOGLE_MAPS_API_KEY = "AIzaSyCPfWpbibiw83RQsxELttr0vL9Ic64Sf9s";

const Modal = ({ modalType, setModalType, setShowModal }) => {
    const [credentials, setCredentials] = useState({});
    const [selectedRole, setSelectedRole] = useState(null);
    const { setUser } = useUser();
    const navigate = useNavigate();
    const [map, setMap] = useState(null);
    const [marker, setMarker] = useState(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false); // State for success modal

    // Handle input change
    const handleChange = (e) => {
        setCredentials({ ...credentials, [e.target.name]: e.target.value });
    };

    // Function to initialize the map
    const initMap = () => {
        const mapInstance = new window.google.maps.Map(document.getElementById("map"), {
            center: { lat: 10.0, lng: 76.0 }, // Default center
            zoom: 12,
        });
        setMap(mapInstance);
    };

    // Load Google Maps API only once
    useEffect(() => {
        if (selectedRole === "restaurant" && !window.google) {
            const script = document.createElement("script");
            script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}`;
            script.async = true;
            script.defer = true;
            script.onload = initMap; // Call initMap when the script loads
            document.head.appendChild(script);
        } else if (selectedRole === "restaurant" && window.google) {
            initMap(); // Initialize map if script is already loaded
        }
    }, [selectedRole]);

    // Reverse Geocoding function to get address from lat/lng
    const getAddressFromCoordinates = (lat, lng) => {
        const geocoder = new window.google.maps.Geocoder();
        const latlng = { lat, lng };

        geocoder.geocode({ location: latlng }, (results, status) => {
            if (status === "OK" && results[0]) {
                setCredentials(prevState => ({
                    ...prevState,
                    address: results[0].formatted_address,
                    latitude: lat,
                    longitude: lng
                }));
            } else {
                console.error("Geocoder failed due to: " + status);
            }
        });
    };

    // Handle map click event to get location
    useEffect(() => {
        if (map) {
            const clickListener = map.addListener("click", (event) => {
                const clickedLat = event.latLng.lat();
                const clickedLng = event.latLng.lng();
                getAddressFromCoordinates(clickedLat, clickedLng);

                if (marker) marker.setMap(null); // Remove old marker
                const newMarker = new window.google.maps.Marker({
                    position: { lat: clickedLat, lng: clickedLng },
                    map: map,
                });
                setMarker(newMarker);
            });

            return () => window.google.maps.event.removeListener(clickListener);
        }
    }, [map]);

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (modalType === "login") {
                const res = await axios.post(`http://localhost:5000/api/auth/login`, credentials);
                setUser({ id: res.data.account._id, email: res.data.account.email, role:res.data.account.role});
                setShowSuccessModal("login"); // Show success modal for login
                setTimeout(() => {
                    setShowModal(false);
                    navigate(`/dashboard/${res.data.account.role}`);
                }, 2000);
            } else {
                await axios.post(`http://localhost:5000/api/auth/register`, { ...credentials, role: selectedRole });
                setShowSuccessModal("signup"); // Show success modal for signup
                setTimeout(() => {
                    setModalType("login");
                    setShowModal(false);
                }, 2000);
            }
        } catch (err) {
            alert("Error: " + (err.response ? err.response.data.message : err.message));
        }
    };

    return (
        <>
            {showSuccessModal && <SuccessModal type={showSuccessModal} onClose={() => setShowSuccessModal(false)} />}
            
            <div className="modal-overlay-xjkl">
                <div className="modal-container-xjkl">
                    {/* Left Image Section */}
                    <div className="modal-image-xjkl">
                        <img src={image} alt="Illustration" />
                    </div>

                    {/* Right Form Section */}
                    <div className="modal-content-xjkl">
                        <span className="close-btn-xjkl" onClick={() => setShowModal(false)}>×</span>
                        <h2>{modalType === "login" ? "Login" : "Sign Up"}</h2>

                        {modalType === "signup" && (
                            <div className="role-selection">
                                <h3>Select Role:</h3>
                                <div className="role-icons">
                                    <div className={`role-icon ${selectedRole === "user" ? "selected" : ""}`} onClick={() => setSelectedRole("user")}>
                                        <FaUser size={40} />
                                        <span>User</span>
                                    </div>
                                    <div className={`role-icon ${selectedRole === "restaurant" ? "selected" : ""}`} onClick={() => setSelectedRole("restaurant")}>
                                        <FaUtensils size={40} />
                                        <span>Restaurant</span>
                                    </div>
                                    <div className={`role-icon ${selectedRole === "deliveryboy" ? "selected" : ""}`} onClick={() => setSelectedRole("deliveryboy")}>
                                        <FaMotorcycle size={40} />
                                        <span>Delivery Boy</span>
                                    </div>
                                </div>-+
                            </div>
                        )}

                        {modalType === "signup" && !selectedRole ? (
                            <p style={{ textAlign: "center", color: "red" }}>Please select a role to continue.</p>
                        ) : (
                            <form onSubmit={handleSubmit}>
                                <input type="email" name="email" placeholder="Email" onChange={handleChange} required />
                                <input type="password" name="password" placeholder="Password" onChange={handleChange} required />

                                {modalType === "signup" && (
                                    <input type="text" name="name" placeholder="Full Name" onChange={handleChange} required />
                                )}

                                {/* Extra fields for Restaurant */}
                                {selectedRole === "restaurant" && (
                                    <div className="map-container">
                                        <h4>Select Your Restaurant Location:</h4>
                                        <div id="map" style={{ width: "100%", height: "300px" }}></div>
                                        {credentials.address && (
                                            <p><strong>Address:</strong> {credentials.address}</p>
                                        )}
                                    </div>
                                )}

                                {/* Extra fields for Delivery Boy */}
                                {selectedRole === "deliveryboy" && (
                                    <input type="text" name="assignedRegion" placeholder="Assigned Region" onChange={handleChange} required />
                                )}

                                <button type="submit" disabled={modalType === "signup" && !selectedRole}>
                                    {modalType === "login" ? "Login" : `Sign Up as ${selectedRole ? selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1) : "?"}`}
                                </button>
                            </form>
                        )}

                        <p>
                            {modalType === "login" ? "New here?" : "Already have an account?"}
                            <span onClick={() => setModalType(modalType === "login" ? "signup" : "login")}>
                                {modalType === "login" ? " Create an account" : " Log in"}
                            </span>
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Modal;

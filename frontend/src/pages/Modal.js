import { useState, useEffect } from "react";
import axios from "axios";
import "../styles/Modal.css";
import { useUser } from "../context/UserContext";
import { useNavigate } from "react-router-dom";
import image from "../assets/medium-shot-cartoonish-boy-with-burger.jpg";
import { FaUser, FaUtensils, FaMotorcycle } from "react-icons/fa";
import SuccessModal from "./Successmodal";

const GOOGLE_MAPS_API_KEY = "AIzaSyCPfWpbibiw83RQsxELttr0vL9Ic64Sf9s";

const Modal = ({ modalType, setModalType, setShowModal }) => {
    const [credentials, setCredentials] = useState({});
    const [selectedRole, setSelectedRole] = useState(null);
    const { setUser } = useUser();
    const navigate = useNavigate();
    const [map, setMap] = useState(null);
    const [marker, setMarker] = useState(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [validationAlert, setValidationAlert] = useState(null);

    // Handle input change
    const handleChange = (e) => {
        const { name, value } = e.target;
        setCredentials({ ...credentials, [name]: value });
    };

    // Reset form
    const resetForm = () => {
        setCredentials({});
        setSelectedRole(null);
        setValidationAlert(null);
        
        // Reset form fields
        const formElements = document.querySelectorAll('input');
        formElements.forEach(element => {
            element.value = '';
        });
        
        // Clear map marker if exists
        if (marker) {
            marker.setMap(null);
            setMarker(null);
        }
    };

    // Validate password - only needed for signup
    const validatePassword = (password) => {
        const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.*[0-9]).{8,}$/;
        return passwordRegex.test(password);
    };
    
    // Validate phone - only needed for signup
    const validatePhone = (phone) => {
        const phoneRegex = /^[0-9]{10}$/;
        return phoneRegex.test(phone);
    };

    // Validate form before submission - only for signup
    const validateForm = () => {
        // Skip validation for login
        if (modalType === "login") {
            return true;
        }
        
        // For signup, perform validation
        if (!credentials.email || !credentials.email.includes('@')) {
            setValidationAlert("Please enter a valid email address");
            return false;
        }
        
        if (!validatePassword(credentials.password)) {
            setValidationAlert("Password must be at least 8 characters with a capital letter, number, and special character");
            return false;
        }
        
        if (!credentials.name || credentials.name.trim() === "") {
            setValidationAlert("Name is required");
            return false;
        }
        
        if (selectedRole === "user" && !validatePhone(credentials.phone)) {
            setValidationAlert("Phone number must be exactly 10 digits");
            return false;
        }
        
        if (selectedRole === "restaurant" && !credentials.address) {
            setValidationAlert("Please select a location for your restaurant");
            return false;
        }
        
        return true;
    };

    // Initialize Google Maps and Autocomplete
    useEffect(() => {
        if (selectedRole === "restaurant") {
            const loadGoogleMapsScript = () => {
                if (!window.google) {
                    const script = document.createElement("script");
                    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
                    script.async = true;
                    script.defer = true;
                    script.onload = initializeMap;
                    document.head.appendChild(script);
                } else {
                    initializeMap();
                }
            };

            const initializeMap = () => {
                const defaultLocation = { lat: 10.0, lng: 76.0 };

                const mapInstance = new window.google.maps.Map(document.getElementById("map"), {
                    center: defaultLocation,
                    zoom: 12,
                });

                const input = document.getElementById("autocomplete");
                const autocomplete = new window.google.maps.places.Autocomplete(input);
                
                autocomplete.addListener("place_changed", () => {
                    const place = autocomplete.getPlace();
                    if (place.geometry) {
                        const lat = place.geometry.location.lat();
                        const lng = place.geometry.location.lng();

                        setCredentials(prev => ({
                            ...prev,
                            address: place.formatted_address,
                            latitude: lat,
                            longitude: lng
                        }));

                        mapInstance.setCenter({ lat, lng });
                        mapInstance.setZoom(15);

                        if (marker) marker.setMap(null); // Remove previous marker

                        const newMarker = new window.google.maps.Marker({
                            position: { lat, lng },
                            map: mapInstance,
                        });

                        setMarker(newMarker);
                    }
                });

                setMap(mapInstance);
            };

            loadGoogleMapsScript();
        }
    }, [selectedRole]);

    // Clear form when modalType changes
    useEffect(() => {
        resetForm();
    }, [modalType]);

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validate form before submission - only for signup
        if (!validateForm()) {
            return;
        }
        
        try {
            if (modalType === "login") {
                const res = await axios.post(`http://localhost:5000/api/auth/login`, credentials);
                setUser({ id: res.data.account._id, email: res.data.account.email, role: res.data.account.role });
                setShowSuccessModal("login");
                setTimeout(() => {
                    setShowModal(false);
                    navigate(`/dashboard/${res.data.account.role}`);
                }, 2000);
            } else {
                await axios.post(`http://localhost:5000/api/auth/register`, { ...credentials, role: selectedRole });
                setShowSuccessModal("signup");
                setTimeout(() => {
                    resetForm();
                    setModalType("login");
                    setShowSuccessModal(false);
                }, 2000);
            }
        } catch (err) {
            alert("Error: " + (err.response ? err.response.data.message : err.message));
        }
    };
    
    // Handle password input change with validation
    const handlePasswordChange = (e) => {
        const value = e.target.value;
        handleChange(e);
        
        // Only validate password during signup
        if (modalType === "signup" && value.length > 0 && !validatePassword(value)) {
            setValidationAlert("Password must be at least 8 characters with a capital letter, number, and special character");
        } else {
            setValidationAlert(null);
        }
    };
    
    // Handle phone input change with validation
    const handlePhoneChange = (e) => {
        // Only allow numeric input
        const value = e.target.value.replace(/\D/g, '');
        
        // Update form state with cleaned value
        setCredentials({ ...credentials, phone: value });
        
        // Update input field with cleaned value
        e.target.value = value;
        
        // Only validate phone during signup
        if (modalType === "signup" && value.length > 0 && value.length !== 10) {
            setValidationAlert("Phone number must be exactly 10 digits");
        } else {
            setValidationAlert(null);
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

                        {/* Validation Alert Popup - only show during signup */}
                        {validationAlert && (
                            <div className="validation-alert">
                                <p>{validationAlert}</p>
                                <button onClick={() => setValidationAlert(null)}>OK</button>
                            </div>
                        )}

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
                                </div>
                            </div>
                        )}

                        {modalType === "signup" && !selectedRole ? (
                            <p style={{ textAlign: "center", color: "red" }}>Please select a role to continue.</p>
                        ) : (
                            <form onSubmit={handleSubmit}>
                                <input 
                                    type="email" 
                                    name="email" 
                                    placeholder="Email" 
                                    onChange={handleChange} 
                                    required 
                                />

                                <input 
                                    type="password" 
                                    name="password" 
                                    placeholder="Password" 
                                    onChange={handlePasswordChange}
                                    onBlur={(e) => {
                                        // Only validate password during signup
                                        if (modalType === "signup" && e.target.value.length > 0 && !validatePassword(e.target.value)) {
                                            setValidationAlert("Password must be at least 8 characters with a capital letter, number, and special character");
                                        }
                                    }}
                                    required 
                                />
                               
                                {modalType === "signup" && (
                                    <input 
                                        type="text" 
                                        name="name" 
                                        placeholder="Full Name" 
                                        onChange={handleChange} 
                                        required 
                                    />
                                )}
                                
                                {modalType === "signup" && selectedRole === "user" && (
                                    <input 
                                        type="text" 
                                        name="phone" 
                                        placeholder="Phone number (10 digits)" 
                                        onChange={handlePhoneChange}
                                        onBlur={(e) => {
                                            if (e.target.value.length > 0 && !validatePhone(e.target.value)) {
                                                setValidationAlert("Phone number must be exactly 10 digits");
                                            }
                                        }}
                                        maxLength="10"
                                        required 
                                    />
                                )}

                                {/* Extra fields for Restaurant */}
                                {modalType === "signup" && selectedRole === "restaurant" && (
                                    <div className="map-container">
                                        <h4>Select Your Restaurant Location:</h4>
                                        <input 
                                            id="autocomplete" 
                                            type="text" 
                                            placeholder="Search for your location..." 
                                        />
                                        <div id="map" style={{ width: "100%", height: "300px", marginTop: "10px" }}></div>
                                        {credentials.address && <p><strong>Address:</strong> {credentials.address}</p>}
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
import { useState, useEffect } from "react";
import axios from "axios";
import { GoogleMap, LoadScript, Marker, Autocomplete } from "@react-google-maps/api";
import { useUser } from "../context/UserContext";

const mapContainerStyle = { width: "100%", height: "350px" }; // Increased map height
const googleMapsApiKey = "AIzaSyDfnv9HFPrIMlVBMoFSl6LSBQj5G3rbOJo"; // Replace with your key
const libraries = ["places"];
const BACKEND_URI =process.env.BACKEND_URI

const DabbawalaForm = () => {
  const { user } = useUser();
  const [formData, setFormData] = useState({
    userId: user?.id || "",
    receiver: "",
    recei_phone: "",
    sender: { lat: null, lng: null },
    receiverLocation: { lat: null, lng: null },
    item: "",
  });

  const [senderAutocomplete, setSenderAutocomplete] = useState(null);
  const [receiverAutocomplete, setReceiverAutocomplete] = useState(null);
  const [deliveryCharge, setDeliveryCharge] = useState(0);
  const [distance, setDistance] = useState(0);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [isDeliveryPossible, setIsDeliveryPossible] = useState(true);

  // Load Razorpay script
  useEffect(() => {
    const loadRazorpay = () => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => {
        setRazorpayLoaded(true);
        console.log("Razorpay script loaded successfully");
      };
      script.onerror = () => {
        console.error("Failed to load Razorpay script");
        alert("Payment gateway failed to load. Please refresh the page or try again later.");
      };
      document.body.appendChild(script);
    };

    // Load Bootstrap for enhanced styling
    const loadBootstrap = () => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/css/bootstrap.min.css';
      document.head.appendChild(link);
      
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/js/bootstrap.bundle.min.js';
      script.async = true;
      document.body.appendChild(script);
    };

    loadRazorpay();
    loadBootstrap();
    
    return () => {
      const razorpayScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
      if (razorpayScript) {
        document.body.removeChild(razorpayScript);
      }
    };
  }, []);

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (point1, point2) => {
    if (!point1.lat || !point2.lat) return 0;
    
    const toRadian = (degree) => degree * Math.PI / 180;
    
    const lat1 = toRadian(point1.lat);
    const lng1 = toRadian(point1.lng);
    const lat2 = toRadian(point2.lat);
    const lng2 = toRadian(point2.lng);
    
    // Haversine formula
    const earthRadius = 6371; // Earth radius in kilometers
    const dLat = lat2 - lat1;
    const dLng = lng2 - lng1;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = earthRadius * c;
    
    return distance;
  };

  // Set Current Location for Sender (Source)
  const setCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newSenderLocation = { 
            lat: position.coords.latitude, 
            lng: position.coords.longitude 
          };
          
          setFormData((prev) => ({
            ...prev,
            sender: newSenderLocation,
          }));
          
          // Update distance and delivery charge if receiver location is set
          if (formData.receiverLocation.lat) {
            updateDistanceAndCharge(newSenderLocation, formData.receiverLocation);
          }
        },
        (error) => {
          console.error("Error getting location", error);
          alert("Unable to fetch location. Please allow location access.");
        }
      );
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  };

  // Update distance and delivery charge when locations change
  const updateDistanceAndCharge = (sender, receiver) => {
    const calculatedDistance = calculateDistance(sender, receiver);
    setDistance(calculatedDistance);
    
    // Check if delivery is possible (distance less than 10 km)
    if (calculatedDistance > 10) {
      setIsDeliveryPossible(false);
      setDeliveryCharge(0);
    } else {
      setIsDeliveryPossible(true);
      // Calculate charge: ₹20 per kilometer, minimum ₹20, rounded to 2 decimal places
      const charge = Math.max(20, Math.round(calculatedDistance * 20 * 100) / 100);
      setDeliveryCharge(charge);
    }
  };

  const handlePlaceSelect = (type) => {
    if (type === "sender" && senderAutocomplete) {
      const place = senderAutocomplete.getPlace();
      const newSenderLocation = { 
        lat: place.geometry.location.lat(), 
        lng: place.geometry.location.lng() 
      };
      
      setFormData((prev) => ({
        ...prev,
        sender: newSenderLocation,
      }));
      
      // Update distance and delivery charge if receiver location is set
      if (formData.receiverLocation.lat) {
        updateDistanceAndCharge(newSenderLocation, formData.receiverLocation);
      }
      
    } else if (type === "receiver" && receiverAutocomplete) {
      const place = receiverAutocomplete.getPlace();
      const newReceiverLocation = { 
        lat: place.geometry.location.lat(), 
        lng: place.geometry.location.lng() 
      };
      
      setFormData((prev) => ({
        ...prev,
        receiverLocation: newReceiverLocation,
      }));
      
      // Update distance and delivery charge if sender location is set
      if (formData.sender.lat) {
        updateDistanceAndCharge(formData.sender, newReceiverLocation);
      }
    }
  };

  const handleMapClick = (type, location) => {
    if (type === "sender") {
      setFormData((prev) => ({
        ...prev,
        sender: location,
      }));
      
      // Update distance and delivery charge if receiver location is set
      if (formData.receiverLocation.lat) {
        updateDistanceAndCharge(location, formData.receiverLocation);
      }
      
    } else if (type === "receiver") {
      setFormData((prev) => ({
        ...prev,
        receiverLocation: location,
      }));
      
      // Update distance and delivery charge if sender location is set
      if (formData.sender.lat) {
        updateDistanceAndCharge(formData.sender, location);
      }
    }
  };

  // Initialize direct Razorpay payment without backend order creation
  const initializeDirectPayment = () => {
    if (!window.Razorpay) {
      console.error("Razorpay not loaded");
      alert("Payment system is not loaded yet. Please refresh the page and try again.");
      setPaymentProcessing(false);
      return;
    }

    // For direct payment without backend order creation
    const options = {
      key: "rzp_test_QK253G04y7gzR4",
      amount: deliveryCharge * 100, // Amount in paisa (smallest currency unit)
      currency: "INR",
      name: "Dabbawala Delivery",
      description: "Delivery Service Fee",
      image: "https://your-logo-url.png", // Optional: your logo URL
      handler: function (response) {
        // This function runs after successful payment
        console.log("Payment successful", response);
        saveOrderWithPaymentDetails(response.razorpay_payment_id);
      },
      prefill: {
        name: formData.receiver || user?.name || "",
        email: user?.email || "",
        contact: formData.recei_phone || user?.phone || "",
      },
      notes: {
        delivery_address: "Delivery service",
        item: formData.item
      },
      theme: {
        color: "#FF6B6B"
      },
      modal: {
        ondismiss: function() {
          console.log("Payment modal closed");
          setPaymentProcessing(false);
        }
      }
    };

    try {
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        console.error("Payment failed", response.error);
        alert(`Payment failed: ${response.error.description}`);
        setPaymentProcessing(false);
      });
      rzp.open();
    } catch (error) {
      console.error("Error opening Razorpay", error);
      alert("Failed to open payment window. Please try again.");
      setPaymentProcessing(false);
    }
  };

  // Save order with payment details after successful payment
  const saveOrderWithPaymentDetails = async (paymentId) => {
    const finalData = {
      userId: user?.id,
      receiver: formData.receiver,
      recei_phone: formData.recei_phone,
      sender: {
        lat: formData.sender.lat,
        lng: formData.sender.lng,
      },
      receiverLocation: {
        lat: formData.receiverLocation.lat,
        lng: formData.receiverLocation.lng,
      },
      item: formData.item,
      distance: distance,
      deliveryCharge: deliveryCharge,
      paymentStatus: "completed",
      paymentId: paymentId
    };
    
    try {
      const response = await axios.post(`${BACKEND_URI}/api/auth/dabbawala/create`, finalData);
      alert("Order placed successfully! Your delivery is confirmed.");
      console.log(response.data);
      // Reset form or redirect
      // window.location.href = "/orders";
    } catch (error) {
      console.error("Error saving order", error);
      alert("Payment was successful, but there was an issue saving your order. Please contact support with your payment ID: " + paymentId);
    } finally {
      setPaymentProcessing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form inputs
    if (!formData.receiver || !formData.recei_phone || !formData.item) {
      alert("Please fill in all required fields.");
      return;
    }
    
    // Validate phone number
    if (!formData.recei_phone || formData.recei_phone.length !== 10 || !/^[6-9]\d{9}$/.test(formData.recei_phone)) {
      alert("Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.");
      return;
    }
    
    // Validate locations
    if (!formData.sender.lat || !formData.receiverLocation.lat) {
      alert("Please select both pickup and delivery locations.");
      return;
    }
    
    // Check if delivery is possible
    if (!isDeliveryPossible) {
      alert("Delivery not possible. Distance must be less than 10 km.");
      return;
    }
    
    // Validate delivery charge
    if (deliveryCharge <= 0) {
      alert("Invalid delivery charge. Please try setting the locations again.");
      return;
    }
    
    // Set processing state
    setPaymentProcessing(true);
    
    // Check if Razorpay is loaded
    if (!razorpayLoaded) {
      console.error("Razorpay not loaded yet");
      alert("Payment system is still loading. Please wait a moment and try again.");
      setPaymentProcessing(false);
      return;
    }
    
    // Initialize direct payment
    initializeDirectPayment();
  };

  return (
    <div className="container-fluid py-5" style={{background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)'}}>
      <div className="container">
        <div className="card shadow-lg border-0 rounded-lg overflow-hidden">
          <div className="card-header bg-gradient-primary text-center p-4" style={{background: 'linear-gradient(to right, #4A00E0, #8E2DE2)'}}>
            <h2 className="text-white mb-0 fw-bold">
              <i className="bi bi-bicycle me-2"></i> Dabbawala Delivery Service
            </h2>
            <p className="text-white-50 mt-2">Fast, reliable & affordable delivery at your fingertips</p>
          </div>
          
          <div className="card-body p-0">
            <div className="row g-0">
              {/* Service Features Banner */}
              <div className="col-12 bg-light py-3 px-4 d-none d-md-block">
                <div className="row text-center">
                  <div className="col-md-4">
                    <i className="bi bi-speedometer2 text-primary"></i> Fast Delivery
                  </div>
                  <div className="col-md-4">
                    <i className="bi bi-shield-check text-success"></i> Safe & Secure
                  </div>
                  <div className="col-md-4">
                    <i className="bi bi-geo-alt text-danger"></i> Real-time Tracking
                  </div>
                </div>
              </div>
            
              <form onSubmit={handleSubmit} className="w-100">
                <div className="row g-0">
                  {/* Left Column - Recipient Information */}
                  <div className="col-lg-5 p-4 border-end">
                    <div className="mb-4 pb-2 border-bottom">
                      <h3 className="h4 text-primary mb-3">
                        <i className="bi bi-person-fill me-2"></i>Recipient Details
                      </h3>
                      
                      <div className="mb-3">
                        <label className="form-label fw-semibold">Recipient Name</label>
                        <div className="input-group">
                          <span className="input-group-text bg-light">
                            <i className="bi bi-person"></i>
                          </span>
                          <input
                            type="text"
                            name="receiver"
                            value={formData.receiver}
                            onChange={(e) => setFormData({ ...formData, receiver: e.target.value })}
                            className="form-control"
                            placeholder="Enter recipient's full name"
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <label className="form-label fw-semibold">Recipient Phone</label>
                        <div className="input-group">
                          <span className="input-group-text bg-light">
                            <i className="bi bi-telephone"></i>
                          </span>
                          <input
                            type="text"
                            name="recei_phone"
                            value={formData.recei_phone}
                            onChange={(e) => {
                              // Only allow numbers
                              const value = e.target.value.replace(/[^0-9]/g, '');
                              
                              // Limit to 10 digits
                              if (value.length <= 10) {
                                setFormData({ ...formData, recei_phone: value });
                              }
                            }}
                            className={`form-control ${formData.recei_phone && (formData.recei_phone.length !== 10 || !/^[6-9]\d{9}$/.test(formData.recei_phone)) ? "is-invalid" : ""}`}
                            placeholder="Enter 10 digit mobile number"
                            required
                          />
                          {formData.recei_phone && formData.recei_phone.length > 0 && formData.recei_phone.length < 10 && (
                            <div className="invalid-feedback">Phone number must be 10 digits</div>
                          )}
                          {formData.recei_phone && formData.recei_phone.length === 10 && !/^[6-9]\d{9}$/.test(formData.recei_phone) && (
                            <div className="invalid-feedback">Phone number must start with 6, 7, 8, or 9</div>
                          )}
                        </div>
                        {formData.recei_phone && formData.recei_phone.length > 0 && (
                          <small className="text-muted mt-1">
                            {formData.recei_phone.length}/10 digits
                            {formData.recei_phone.length === 10 && /^[6-9]\d{9}$/.test(formData.recei_phone) && (
                              <span className="text-success"> ✓ Valid number</span>
                            )}
                          </small>
                        )}
                      </div>
                      
                      <div className="mb-3">
                        <label className="form-label fw-semibold">Item Description</label>
                        <div className="input-group">
                          <span className="input-group-text bg-light">
                            <i className="bi bi-box"></i>
                          </span>
                          <input
                            type="text"
                            name="item"
                            value={formData.item}
                            onChange={(e) => setFormData({ ...formData, item: e.target.value })}
                            className="form-control"
                            placeholder="What are you sending?"
                            required
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Delivery Charge Information */}
                    {formData.sender.lat && formData.receiverLocation.lat && (
                      <div className="bg-light rounded-3 p-4 mb-4">
                        <h4 className="h5 text-primary mb-3">
                          <i className="bi bi-cash-stack me-2"></i>Delivery Information
                        </h4>
                        
                        <div className="row mb-3">
                          <div className="col-sm-6 mb-2">
                            <div className="card bg-white h-100">
                              <div className="card-body p-3 text-center">
                                <div className="text-muted small mb-1">Distance</div>
                                <div className="h5 mb-0">{distance.toFixed(2)} km</div>
                              </div>
                            </div>
                          </div>
                          <div className="col-sm-6 mb-2">
                            <div className="card bg-white h-100">
                              <div className="card-body p-3 text-center">
                                <div className="text-muted small mb-1">Rate</div>
                                <div className="h5 mb-0">₹20/km</div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Distance Warning */}
                        {!isDeliveryPossible && (
                          <div className="alert alert-danger d-flex align-items-center mb-4" role="alert">
                            <i className="bi bi-exclamation-triangle-fill me-2"></i>
                            <div>
                              <strong>Delivery not possible!</strong> Distance must be less than 10 km. Please choose a closer delivery location.
                            </div>
                          </div>
                        )}
                        
                        {isDeliveryPossible && (
                          <div className="card bg-gradient-success text-white">
                            <div className="card-body py-3">
                              <div className="d-flex justify-content-between align-items-center">
                                <span className="fw-semibold" style={{ color: 'black' }}>Total Delivery Charge:</span>
                                <span className="h4 mb-0" style={{ color: 'black' }}>₹{deliveryCharge.toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* Payment Method Selection */}
                        {isDeliveryPossible && (
                          <div className="mt-4">
                            <h5 className="h6 text-dark mb-3">
                              <i className="bi bi-credit-card me-2"></i>Payment Method
                            </h5>
                            <div className="card border-primary mb-3">
                              <div className="card-body p-3">
                                <div className="d-flex align-items-center">
                                  <div className="me-3">
                                    <div className="form-check">
                                      <input className="form-check-input" type="radio" checked readOnly />
                                    </div>
                                  </div>
                                  <div className="flex-grow-1">
                                    <div className="fw-bold">Online Payment</div>
                                    <div className="small text-muted">Pay securely using credit/debit card, UPI, or net banking</div>
                                  </div>
                                  <div>
                                    {razorpayLoaded ? (
                                      <span className="badge bg-success">
                                        <i className="bi bi-check text-white" style={{fontSize: "0.7rem"}}></i>
                                      </span>
                                    ) : (
                                      <div className="spinner-border spinner-border-sm text-primary" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Right Column - Maps and Location */}
                  <div className="col-lg-7 p-4 bg-light">
                    <LoadScript googleMapsApiKey={googleMapsApiKey} libraries={libraries}>
                      <div className="row">
                        {/* Sender Location */}
                        <div className="col-md-6 mb-4">
                          <div className="card h-100 border-0 shadow-sm">
                            <div className="card-header bg-success text-white py-3">
                              <h5 className="card-title mb-0">
                                <i className="bi bi-geo-alt-fill me-2"></i>Pickup Location
                              </h5>
                            </div>
                            <div className="card-body p-3">
                              <div className="input-group mb-3">
                                <Autocomplete 
                                  onLoad={(auto) => setSenderAutocomplete(auto)} 
                                  onPlaceChanged={() => handlePlaceSelect("sender")}
                                  className="w-100"
                                >
                                  <input 
                                    type="text" 
                                    placeholder="Search pickup location..." 
                                    className="form-control" 
                                  />
                                </Autocomplete>
                                <button
                                  type="button"
                                  className="btn btn-success"
                                  onClick={setCurrentLocation}
                                >
                                  <i className="bi bi-cursor-fill me-1"></i> Current
                                </button>
                              </div>
                              
                              <div className="map-container rounded overflow-hidden shadow-sm" style={{height: "250px"}}>
                                <GoogleMap
                                  mapContainerStyle={{ width: "100%", height: "100%" }}
                                  center={formData.sender.lat ? formData.sender : { lat: 20.5937, lng: 78.9629 }}
                                  zoom={14}
                                  onClick={(e) => handleMapClick("sender", { lat: e.latLng.lat(), lng: e.latLng.lng() })}
                                >
                                  {formData.sender.lat && <Marker position={formData.sender} />}
                                </GoogleMap>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Receiver Location */}
                        <div className="col-md-6 mb-4">
                          <div className="card h-100 border-0 shadow-sm">
                            <div className="card-header bg-primary text-white py-3">
                              <h5 className="card-title mb-0">
                                <i className="bi bi-pin-map-fill me-2"></i>Delivery Location
                              </h5>
                            </div>
                            <div className="card-body p-3">
                              <div className="input-group mb-3">
                                <Autocomplete 
                                  onLoad={(auto) => setReceiverAutocomplete(auto)} 
                                  onPlaceChanged={() => handlePlaceSelect("receiver")}
                                  className="w-100"
                                >
                                  <input 
                                    type="text" 
                                    placeholder="Search delivery location..." 
                                    className="form-control" 
                                  />
                                </Autocomplete>
                              </div>
                              
                              <div className="map-container rounded overflow-hidden shadow-sm" style={{height: "250px"}}>
                                <GoogleMap
                                  mapContainerStyle={{ width: "100%", height: "100%" }}
                                  center={formData.receiverLocation.lat ? formData.receiverLocation : { lat: 20.5937, lng: 78.9629 }}
                                  zoom={14}
                                  onClick={(e) => handleMapClick("receiver", { lat: e.latLng.lat(), lng: e.latLng.lng() })}
                                >
                                  {formData.receiverLocation.lat && <Marker position={formData.receiverLocation} />}
                                </GoogleMap>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Direction Information - Animation */}
                      {formData.sender.lat && formData.receiverLocation.lat && (
                        <div className="card border-0 shadow-sm mb-4 bg-white">
                          <div className="card-body p-3">
                            <div className="delivery-animation">
                              <div className="d-flex justify-content-between align-items-center">
                                <div className="text-center">
                                  <i className="bi bi-house-door fs-4 text-success"></i>
                                  <div className="small">Pickup</div>
                                </div>
                                <div className="flex-grow-1 px-3">
                                  <div className="progress" style={{height: "6px"}}>
                                    <div className={`progress-bar progress-bar-striped progress-bar-animated ${!isDeliveryPossible ? 'bg-danger' : 'bg-primary'}`} role="progressbar" style={{width: "100%"}}></div>
                                  </div>
                                  <div className="text-center small mt-1">
                                    {distance.toFixed(2)} km
                                    {!isDeliveryPossible && <span className="text-danger ms-2">(Distance Too Far)</span>}
                                  </div>
                                </div>
                                <div className="text-center">
                                  <i className="bi bi-geo-alt fs-4 text-primary"></i>
                                  <div className="small">Delivery</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </LoadScript>
                  </div>
                </div>
                
                {/* Place Order Button */}
                <div className="card-footer p-4 bg-white border-top">
                  <div className="row align-items-center">
                    <div className="col-md-6 mb-3 mb-md-0">
                      <div className="d-flex align-items-center">
                        <div className="text-center me-3">
                          <span className="badge rounded-pill bg-primary p-2" style={{fontSize: "1.2rem"}}>
                            <i className="bi bi-shield-check"></i>
                          </span>
                        </div>
                        <div>
                          <div className="fw-semibold">Secure payment powered by Razorpay</div>
                          <div className="small text-muted">Your payment details are encrypted and secure</div>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <button 
                        type="submit" 
                        disabled={paymentProcessing || !razorpayLoaded || !isDeliveryPossible || !formData.sender.lat || !formData.receiverLocation.lat}
                        className={`btn ${paymentProcessing || !razorpayLoaded || !isDeliveryPossible || !formData.sender.lat || !formData.receiverLocation.lat ? 'btn-secondary' : 'btn-primary'} btn-lg w-100 position-relative`}
                        style={{
                          background: paymentProcessing || !razorpayLoaded || !isDeliveryPossible || !formData.sender.lat || !formData.receiverLocation.lat ? '#6c757d' : 'linear-gradient(to right, #FF416C, #FF4B2B)',
                          border: 'none',
                          borderRadius: '50px',
                          overflow: 'hidden'
                        }}
                      >
                        {paymentProcessing && (
                          <span className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center">
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Processing Payment...
                          </span>
                        )}
                        {!paymentProcessing && !razorpayLoaded && (
                          <span className="position-absolute top-0 start-0align-items-center justify-content-center">
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Loading Payment System...
                          </span>
                        )}
                        {!paymentProcessing && razorpayLoaded && (
                          <span className="d-flex align-items-center justify-content-center">
                            <i className="bi bi-cart-check me-2" style={{fontSize: "1rem"}}></i>
                            Place Order & Pay ₹{deliveryCharge.toFixed(2)}
                          </span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DabbawalaForm;
import { useState, useEffect } from "react";
import axios from "axios";
import { GoogleMap, LoadScript, Marker, Autocomplete } from "@react-google-maps/api";
import { useUser } from "../context/UserContext";

const mapContainerStyle = { width: "100%", height: "300px" }; // Increased map height
const googleMapsApiKey = "AIzaSyDfnv9HFPrIMlVBMoFSl6LSBQj5G3rbOJo"; // Replace with your key
const libraries = ["places"];

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

    loadRazorpay();
    
    return () => {
      const script = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
      if (script) {
        document.body.removeChild(script);
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
    
    // Calculate charge: ₹20 per kilometer, minimum ₹20, rounded to 2 decimal places
    const charge = Math.max(20, Math.round(calculatedDistance * 20 * 100) / 100);
    setDeliveryCharge(charge);
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
        color: "#3399cc"
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
      const response = await axios.post("http://localhost:5000/api/auth/dabbawala/create", finalData);
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
    
    // Validate locations
    if (!formData.sender.lat || !formData.receiverLocation.lat) {
      alert("Please select both pickup and delivery locations.");
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
    <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-lg">
      <div className="border-b pb-4 mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Dabbawala Delivery Service</h2>
        <p className="text-gray-600 mt-2">Fast and reliable delivery at your fingertips</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column - Recipient Information */}
          <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-xl font-semibold text-blue-800 mb-4">Recipient Details</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Recipient Name</label>
                  <input
                    type="text"
                    name="receiver"
                    value={formData.receiver}
                    onChange={(e) => setFormData({ ...formData, receiver: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    placeholder="Enter recipient's full name"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Recipient Phone</label>
                  <input
                    type="text"
                    name="recei_phone"
                    value={formData.recei_phone}
                    onChange={(e) => setFormData({ ...formData, recei_phone: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    placeholder="Enter recipient's phone number"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Item Description</label>
                  <input
                    type="text"
                    name="item"
                    value={formData.item}
                    onChange={(e) => setFormData({ ...formData, item: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    placeholder="What are you sending?"
                    required
                  />
                </div>

                {/* Delivery Charge Information */}
                {formData.sender.lat && formData.receiverLocation.lat && (
                  <div className="bg-yellow-50 p-4 rounded-lg mt-4">
                    <h4 className="font-semibold text-yellow-800 mb-2">Delivery Information</h4>
                    <div className="space-y-1">
                      <p className="text-gray-700">Distance: <span className="font-medium">{distance.toFixed(2)} km</span></p>
                      <p className="text-gray-700">Rate: <span className="font-medium">₹20 per km</span></p>
                      <p className="text-gray-700">Minimum charge: <span className="font-medium">₹20</span></p>
                      <p className="text-lg font-bold text-green-800">Total Charge: ₹{deliveryCharge.toFixed(2)}</p>
                    </div>
                    
                    {/* Payment Method Selection */}
                    <div className="mt-4 pt-4 border-t border-yellow-200">
                      <h4 className="font-semibold text-yellow-800 mb-2">Payment Method</h4>
                      <div className="flex items-center space-x-2 bg-white p-3 rounded-lg border border-gray-200">
                        <div className="h-6 w-6">
                          <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                            <path d="M2 9h20v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9z"></path>
                            <path d="M2 3h20v6H2z"></path>
                            <line x1="12" y1="16" x2="12" y2="16"></line>
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">Online Payment (Secured by Razorpay)</p>
                          <p className="text-sm text-gray-500">Pay securely using credit/debit card, UPI, or net banking</p>
                        </div>
                        <div className="h-6 w-6">
                          {razorpayLoaded ? (
                            <svg className="h-6 w-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                          ) : (
                            <svg className="animate-spin h-6 w-6 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Right Column - Maps and Location */}
          <div className="space-y-6">
            <LoadScript googleMapsApiKey={googleMapsApiKey} libraries={libraries}>
              {/* Sender Location */}
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="text-xl font-semibold text-green-800 mb-2">Pickup Location</h3>
                
                <div className="flex space-x-2 mb-2">
                  <Autocomplete 
                    onLoad={(auto) => setSenderAutocomplete(auto)} 
                    onPlaceChanged={() => handlePlaceSelect("sender")}
                    className="flex-1"
                  >
                    <input 
                      type="text" 
                      placeholder="Search pickup location..." 
                      className="w-full p-3 border border-gray-300 rounded-lg" 
                    />
                  </Autocomplete>
                  
                  <button
                    type="button"
                    className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition flex items-center"
                    onClick={setCurrentLocation}
                  >
                    <span className="mr-1">📍</span> Current
                  </button>
                </div>
                
                <div className="rounded-lg overflow-hidden border border-gray-300 shadow-md">
                  <GoogleMap
                    mapContainerStyle={mapContainerStyle}
                    center={formData.sender.lat ? formData.sender : { lat: 20.5937, lng: 78.9629 }}
                    zoom={14}
                    onClick={(e) => handleMapClick("sender", { lat: e.latLng.lat(), lng: e.latLng.lng() })}
                  >
                    {formData.sender.lat && <Marker position={formData.sender} />}
                  </GoogleMap>
                </div>
              </div>
              
              {/* Receiver Location */}
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="text-xl font-semibold text-purple-800 mb-2">Delivery Location</h3>
                
                <Autocomplete 
                  onLoad={(auto) => setReceiverAutocomplete(auto)} 
                  onPlaceChanged={() => handlePlaceSelect("receiver")}
                >
                  <input 
                    type="text" 
                    placeholder="Search delivery location..." 
                    className="w-full p-3 border border-gray-300 rounded-lg mb-2" 
                  />
                </Autocomplete>
                
                <div className="rounded-lg overflow-hidden border border-gray-300 shadow-md">
                  <GoogleMap
                    mapContainerStyle={mapContainerStyle}
                    center={formData.receiverLocation.lat ? formData.receiverLocation : { lat: 20.5937, lng: 78.9629 }}
                    zoom={14}
                    onClick={(e) => handleMapClick("receiver", { lat: e.latLng.lat(), lng: e.latLng.lng() })}
                  >
                    {formData.receiverLocation.lat && <Marker position={formData.receiverLocation} />}
                  </GoogleMap>
                </div>
              </div>
            </LoadScript>
          </div>
        </div>
        
        <div className="pt-4 border-t border-gray-200">
          <button 
            type="submit" 
            disabled={paymentProcessing || !razorpayLoaded}
            className={`w-full ${paymentProcessing || !razorpayLoaded ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'} text-white py-3 px-6 rounded-lg text-lg font-semibold transition shadow-md flex items-center justify-center`}
          >
            {paymentProcessing ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing Payment...
              </>
            ) : !razorpayLoaded ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading Payment System...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Place Order & Pay ₹{deliveryCharge.toFixed(2)}
              </>
            )}
          </button>
          
          {/* Secure Payment Badge */}
          <div className="mt-4 flex items-center justify-center text-gray-500 text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Secure payment powered by Razorpay
          </div>
        </div>
      </form>
    </div>
  );
};

export default DabbawalaForm;
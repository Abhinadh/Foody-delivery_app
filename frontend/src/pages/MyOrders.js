import React, { useEffect, useState } from "react";
import axios from "axios";
import { useUser } from "../context/UserContext";
import { motion, AnimatePresence } from "framer-motion";
import FeedbackForm from "./Feedback";
import Modal from "./FeedbackModal";
import 'bootstrap/dist/css/bootstrap.min.css';
import { 
  Loader2, 
  Store, 
  Utensils, 
  Truck, 
  CheckCircle, 
  Clock, 
  Info,
  ChevronDown,
  ChevronUp,
  MapPin,
  DollarSign,
  Timer,
  RotateCw,
  Package,
  Star,
  X,
  AlertTriangle,
  Mail,
  Bike,
  Box,
  Home,
  Phone,
  Navigation
} from "lucide-react";

// Status stages for regular orders
const statusStages = ["Waiting Confirmation", "Order in Process", "Package on Delivery", "Package Delivered"];
const statusIcons = {
  "Waiting Confirmation": <Timer className="w-full h-full p-3 text-white" />,
  "Order in Process": <RotateCw className="w-full h-full p-3 text-white" />,
  "Package on Delivery": <Truck className="w-full h-full p-3 text-white" />,
  "Package Delivered": <CheckCircle className="w-full h-full p-3 text-white" />
};

// Status stages for Dabbawala orders
const dabbawalaStatusStages = ["Pending", "Out for Delivery", "Delivered"];
const dabbawalaStatusIcons = {
  "Pending": <Clock className="w-full h-full p-3 text-white" />,
  "Out for Delivery": <Bike className="w-full h-full p-3 text-white" />,
  "Delivered": <CheckCircle className="w-full h-full p-3 text-white" />
};

// Enhanced status colors by status
const statusColors = {
  "Waiting Confirmation": {
    primary: "#3B82F6", // blue-500
    secondary: "#EFF6FF", // blue-50
    accent: "#93C5FD", // blue-300
    text: "#1E40AF", // blue-800
    border: "#BFDBFE", // blue-200
    gradient: "linear-gradient(135deg, #3B82F6, #60A5FA)"
  },
  "Order in Process": {
    primary: "#F59E0B", // amber-500
    secondary: "#FFFBEB", // amber-50
    accent: "#FCD34D", // amber-300
    text: "#92400E", // amber-800
    border: "#FDE68A", // amber-200
    gradient: "linear-gradient(135deg, #F59E0B, #FBBF24)"
  },
  "Package on Delivery": {
    primary: "#10B981", // emerald-500
    secondary: "#ECFDF5", // emerald-50
    accent: "#6EE7B7", // emerald-300
    text: "#065F46", // emerald-800
    border: "#A7F3D0", // emerald-200
    gradient: "linear-gradient(135deg, #10B981, #34D399)"
  },
  "Package Delivered": {
    primary: "#6366F1", // indigo-500
    secondary: "#EEF2FF", // indigo-50
    accent: "#A5B4FC", // indigo-300
    text: "#3730A3", // indigo-800
    border: "#C7D2FE", // indigo-200
    gradient: "linear-gradient(135deg, #6366F1, #818CF8)"
  },
  // Dabbawala specific status colors
  "Pending": {
    primary: "#6B7280", // gray-500
    secondary: "#F9FAFB", // gray-50
    accent: "#D1D5DB", // gray-300
    text: "#1F2937", // gray-800
    border: "#E5E7EB", // gray-200
    gradient: "linear-gradient(135deg, #6B7280, #9CA3AF)"
  },
  "Picked": {
    primary: "#F59E0B", // amber-500
    secondary: "#FFFBEB", // amber-50
    accent: "#FCD34D", // amber-300
    text: "#92400E", // amber-800
    border: "#FDE68A", // amber-200
    gradient: "linear-gradient(135deg, #F59E0B, #FBBF24)"
  },
  "Out for Delivery": {
    primary: "#10B981", // emerald-500
    secondary: "#ECFDF5", // emerald-50
    accent: "#6EE7B7", // emerald-300
    text: "#065F46", // emerald-800
    border: "#A7F3D0", // emerald-200
    gradient: "linear-gradient(135deg, #10B981, #34D399)"
  },
  "Delivered": {
    primary: "#6366F1", // indigo-500
    secondary: "#EEF2FF", // indigo-50
    accent: "#A5B4FC", // indigo-300
    text: "#3730A3", // indigo-800
    border: "#C7D2FE", // indigo-200
    gradient: "linear-gradient(135deg, #6366F1, #818CF8)"
  }
};

const OrderTracking = () => {
    const { user } = useUser();
    const [orders, setOrders] = useState([]);
    const [dabbawalaOrders, setDabbawalaOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingDabbawala, setLoadingDabbawala] = useState(true);
    const [expandedOrder, setExpandedOrder] = useState(null);
    const [expandedDabbawalaOrder, setExpandedDabbawalaOrder] = useState(null);
    const [itemDetails, setItemDetails] = useState({});
    const [loadingItems, setLoadingItems] = useState({});
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [animatingOrderId, setAnimatingOrderId] = useState(null);
    const [cancellingOrderId, setCancellingOrderId] = useState(null);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
    const [emailSending, setEmailSending] = useState(false);
    const [activeTab, setActiveTab] = useState('food');
    const [debug, setDebug] = useState({ foodCount: 0, dabbawalaCount: 0 });
    const BACKEND_URI =process.env.BACKEND_URI

    const mapStatusToNewFormat = (oldStatus) => {
        switch(oldStatus) {
            case "On Order": return "Waiting Confirmation";
            case "Preparing": return "Order in Process";
            case "Out for Delivery": return "Package on Delivery";
            case "Delivered": return "Package Delivered";
            default: return oldStatus;
        }
    };

    const getStatusTheme = (status) => {
        const normalizedStatus = status?.toString() || '';
        return statusColors[normalizedStatus] || statusColors["Pending"];
    };

    const fetchOrders = () => {
        if (user) {
            setLoading(true);
            axios.get(`${BACKEND_URI}/api/auth/my-orders/${user.id}`)
                .then(res => {
                    const updatedOrders = res.data.map(order => ({
                        ...order,
                        status: mapStatusToNewFormat(order.status)
                    }));
                    setOrders(updatedOrders);
                    setDebug(prev => ({ ...prev, foodCount: updatedOrders.length }));
                    console.log("Food orders:", updatedOrders);
                })
                .catch(err => {
                    console.error("Failed to fetch orders:", err);
                    setOrders([]);
                })
                .finally(() => setLoading(false));
        }
    };

    const fetchDabbawalaOrders = () => {
        if (user) {
            setLoadingDabbawala(true);
            axios.get(`https://foody-backend-l2zy.onrender.com  /api/auth/my-dabbawala-orders/${user.id}`)
                .then(res => {
                    setDabbawalaOrders(res.data);
                    
                    setDebug(prev => ({ ...prev, dabbawalaCount: res.data.length }));
                    console.log("Dabbawala orders:", res.data);
                    console.log("hello",dabbawalaOrders);
                    
                    if (res.data.length > 0 && orders.length === 0) {
                        setActiveTab('dabbawala');
                    }
                })
                .catch(err => {
                    console.error("Failed to fetch dabbawala orders:", err);
                    setDabbawalaOrders([]);
                })
                .finally(() => setLoadingDabbawala(false));
        }
    };
    useEffect(() => {
        if (Array.isArray(dabbawalaOrders)) {
            console.log("Updated dabbawalaOrders:", dabbawalaOrders.length);
        } else {
            console.log("dabbawalaOrders is not an array yet:", dabbawalaOrders);
        }
    }, [dabbawalaOrders]);
    
    useEffect(() => {
        fetchOrders();
        fetchDabbawalaOrders();
    }, [user]);

    const openFeedbackModal = (order) => {
        setSelectedOrder(order);
        setIsModalOpen(true);
    };

    const openCancelConfirmation = (orderId, e) => {
        e.stopPropagation();
        setCancellingOrderId(orderId);
        setShowCancelConfirm(true);
    };

    const sendCancellationEmail = async (order) => {
        setEmailSending(true);
        try {
            const orderDetails = orders.find(o => o._id === order);
            if (!orderDetails) throw new Error("Order details not found");
            
            const itemId = orderDetails.itemId?._id || orderDetails.itemId;
            const item = itemDetails[itemId] || orderDetails.itemId;
            const price = item?.price || 0;
            const quantity = orderDetails.quantity || 1;
            const totalAmount = (price * quantity).toFixed(2);
            
            await axios.post(`${BACKEND_URI}/api/auth/order/send-cancel-email`, {
                to: user.email,
                subject: `Order Cancellation Confirmation - #${orderDetails._id.substring(orderDetails._id.length - 6)}`,
                orderDetails: {
                    orderId: orderDetails._id,
                    restaurantName: orderDetails.restaurantName,
                    orderDate: orderDetails.bookingDate,
                    totalAmount: totalAmount,
                    itemName: item?.name || "Unknown Item"
                }
            });
            
            setEmailSent(true);
            setTimeout(() => setEmailSent(false), 5000);
        } catch (error) {
            console.error("Failed to send cancellation email:", error);
        } finally {
            setEmailSending(false);
        }
    };

    const cancelOrder = async () => {
        if (!cancellingOrderId) return;
        
        try {
            const cancelLoadingId = cancellingOrderId;
            setCancellingOrderId(null);
            setShowCancelConfirm(false);
            
            await axios.delete(`${BACKEND_URI}/api/auth/cancel-order/${cancelLoadingId}`);
            await sendCancellationEmail(cancelLoadingId);
            
            setOrders(prevOrders => prevOrders.filter(order => order._id !== cancelLoadingId));
            
            if (expandedOrder === cancelLoadingId) {
                setExpandedOrder(null);
            }
        } catch (error) {
            console.error("Failed to cancel order:", error);
            alert("Failed to cancel order. Please try again.");
            setCancellingOrderId(null);
        }
    };

    const fetchItemDetails = async (orderId, itemId) => {
        if (!itemId || itemDetails[itemId]) return;
        
        setLoadingItems(prev => ({ ...prev, [itemId]: true }));
        
        try {
            const response = await axios.get(`${BACKEND_URI}/api/auth/menu-items/${itemId}`);
            setItemDetails(prev => ({ ...prev, [itemId]: response.data }));
        } catch (error) {
            console.error("Failed to fetch item details:", error);
        } finally {
            setLoadingItems(prev => ({ ...prev, [itemId]: false }));
        }
    };

    const toggleOrderExpansion = (orderId, itemId) => {
        if (expandedOrder === orderId) {
            setAnimatingOrderId(orderId);
            setTimeout(() => {
                setExpandedOrder(null);
                setAnimatingOrderId(null);
            }, 300);
        } else {
            setExpandedOrder(orderId);
            if (itemId) {
                fetchItemDetails(orderId, itemId);
            }
        }
    };

    const toggleDabbawalaOrderExpansion = (orderId) => {
        if (expandedDabbawalaOrder === orderId) {
            setAnimatingOrderId(orderId);
            setTimeout(() => {
                setExpandedDabbawalaOrder(null);
                setAnimatingOrderId(null);
            }, 300);
        } else {
            setExpandedDabbawalaOrder(orderId);
        }
    };

    const formatDate = (dateString) => {
        const options = { 
            weekday: 'short',
            month: 'short', 
            day: 'numeric',
            hour: '2-digit', 
            minute: '2-digit'
        };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    const getTimeRemaining = (order) => {
        const orderDate = new Date(order.bookingDate || order.createdAt);
        const deliveryDate = new Date(orderDate.getTime() + (90 * 60000));
        const now = new Date();
        
        if (order.status === "Package Delivered" || order.status === "Delivered") {
            return "Delivered";
        }
        
        const diffMs = deliveryDate - now;
        if (diffMs <= 0) {
            return "Any moment now";
        }
        
        const diffMins = Math.ceil(diffMs / 60000);
        return `${diffMins} mins remaining`;
    };

    const renderDabbawalaStatusTimeline = (order) => {
        const currentStageIndex = dabbawalaStatusStages.indexOf(order.status);
        
        return (
            <div className="p-4" style={{ backgroundColor: getStatusTheme(order.status).secondary }}>
                <h4 className="fs-5 fw-semibold text-center mb-4" style={{ color: getStatusTheme(order.status).text }}>
                    Delivery Progress
                </h4>
                
                <div className="position-relative px-4 mb-5">
                    <div className="position-absolute top-50 start-0 end-0 translate-middle-y" 
                        style={{ 
                            height: "6px", 
                            backgroundColor: "#E5E7EB",
                            borderRadius: "3px"
                        }}
                    ></div>
                    
                    <div className="position-absolute top-50 start-0 translate-middle-y" 
                        style={{ 
                            height: "6px", 
                            width: `${((currentStageIndex + 1) / dabbawalaStatusStages.length) * 100}%`,
                            background: getStatusTheme(order.status).gradient,
                            borderRadius: "3px",
                            transition: "width 1s ease"
                        }}
                    ></div>
                    
                    <div className="d-flex justify-content-between">
                        {dabbawalaStatusStages.map((stage, index) => {
                            const stageTheme = statusColors[stage];
                            const isActive = currentStageIndex >= index;
                            const isCurrentStage = currentStageIndex === index;
                            
                            return (
                                <div key={stage} className="d-flex flex-column align-items-center position-relative" style={{ zIndex: 1 }}>
                                    <div className={`rounded-circle d-flex align-items-center justify-content-center ${isCurrentStage ? "animate-pulse" : ""}`}
                                        style={{ 
                                            width: "60px", 
                                            height: "60px", 
                                            backgroundColor: isActive ? stageTheme.primary : "#E5E7EB",
                                            boxShadow: isActive ? `0 0 0 5px ${stageTheme.accent}50` : "none",
                                            transition: "all 0.3s ease"
                                        }}
                                    >
                                        {dabbawalaStatusIcons[stage]}
                                    </div>
                                    <p className="mt-2 small fw-medium text-center" 
                                        style={{ 
                                            color: isActive ? stageTheme.text : "#9CA3AF",
                                            maxWidth: "80px"
                                        }}
                                    >
                                        {stage}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>
                
                <div className="d-flex justify-content-center mt-3">
                    <div className="d-flex align-items-center px-4 py-2 rounded-pill" 
                        style={{ backgroundColor: "white", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}
                    >
                        <Clock style={{ color: getStatusTheme(order.status).primary }} size={16} className="me-2" />
                        <span className="fw-medium" style={{ color: getStatusTheme(order.status).text }}>
                            {getTimeRemaining(order)}
                        </span>
                    </div>
                </div>
            </div>
        );
    };

    const renderDabbawalaOrderDetails = (order) => {
        return (
            <div className="p-4">
                <div className="row">
                    <div className="col-md-6 mb-4">
                        <div className="card h-100 border-0 shadow-sm">
                            <div className="card-header bg-light">
                                <h5 className="mb-0 d-flex align-items-center">
                                    <Home size={18} className="me-2" />
                                    Pickup Details
                                </h5>
                            </div>
                            <div className="card-body">
                                <p className="mb-2"><strong>Address:</strong> {order.pickupAddress}</p>
                                <p className="mb-2"><strong>Item:</strong> {order.item}</p>
                                <div className="mt-3">
                                    <button 
                                        className="btn btn-sm btn-outline-primary d-flex align-items-center"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            window.open(`https://www.google.com/maps?q=${order.sender?.lat || 0},${order.sender?.lng || 0}`, '_blank');
                                        }}
                                    >
                                        <Navigation size={14} className="me-1" />
                                        View on Map
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="col-md-6 mb-4">
                        <div className="card h-100 border-0 shadow-sm">
                            <div className="card-header bg-light">
                                <h5 className="mb-0 d-flex align-items-center">
                                    <MapPin size={18} className="me-2" />
                                    Delivery Details
                                </h5>
                            </div>
                            <div className="card-body">
                                <p className="mb-2"><strong>Receiver:</strong> {order.receiver}</p>
                                <p className="mb-2"><strong>Phone:</strong> {order.recei_phone}</p>
                                <p className="mb-2"><strong>Address:</strong> {order.deliveryAddress}</p>
                                <div className="mt-3">
                                    <button 
                                        className="btn btn-sm btn-outline-primary d-flex align-items-center"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            window.open(`https://www.google.com/maps?q=${order.receiverLocation?.lat || 0},${order.receiverLocation?.lng || 0}`, '_blank');
                                        }}
                                    >
                                        <Navigation size={14} className="me-1" />
                                        View on Map
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* <div className="card border-0 shadow-sm">
                    <div className="card-header bg-light">
                        <h5 className="mb-0 d-flex align-items-center">
                            <DollarSign size={18} className="me-2" />
                            Payment Details
                        </h5>
                    </div>
                    <div className="card-body">
                        <div className="d-flex justify-content-between mb-2">
                            <span>Delivery Charge:</span>
                            <span>₹{order.deliveryCharge?.toFixed(2) || '0.00'}</span>
                        </div>
                        <div className="d-flex justify-content-between mb-2">
                            <span>Distance:</span>
                            <span>{order.distance || '0'} km</span>
                        </div>
                        <hr />
                        <div className="d-flex justify-content-between fw-bold">
                            <span>Total:</span>
                            <span>₹{order.deliveryCharge?.toFixed(2) || '0.00'}</span>
                        </div>
                    </div>
                </div> */}
                
                {/* {order.status !== "Delivered" && (
                    <div className="mt-4">
                        <button 
                            className="btn btn-primary w-100 d-flex align-items-center justify-content-center"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Phone size={18} className="me-2" />
                            Contact Delivery Partner
                        </button>
                    </div>
                )} */}
            </div>
        );
    };

    const hasFoodOrders = orders.length > 0;
    const hasDabbawalaOrders = dabbawalaOrders.length > 0;
    const showDebug = process.env.NODE_ENV === 'development';

    if (loading && loadingDabbawala) {
        return (
            <div className="d-flex flex-column align-items-center justify-content-center min-vh-50 bg-white rounded-lg shadow p-6">
                <div className="position-relative" style={{ width: "80px", height: "80px" }}>
                    <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center">
                        <Loader2 className="animate-spin text-primary" size={40} />
                    </div>
                    <svg className="position-absolute top-0 start-0 w-100 h-100" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="45" fill="none" stroke="#e6e6e6" strokeWidth="8" />
                        <circle cx="50" cy="50" r="45" fill="none" stroke="#3B82F6" strokeWidth="8" strokeDasharray="283" strokeDashoffset="200" className="animate-pulse" />
                    </svg>
                </div>
                <p className="text-secondary fw-medium mt-4 fs-5">Loading your orders...</p>
                <div className="d-flex gap-2 mt-2">
                    <span className="spinner-grow spinner-grow-sm text-primary" role="status"></span>
                    <span className="spinner-grow spinner-grow-sm text-primary" role="status"></span>
                    <span className="spinner-grow spinner-grow-sm text-primary" role="status"></span>
                </div>
            </div>
        );
    }

    if (!hasFoodOrders && !hasDabbawalaOrders) {
        return (
            <div className="p-6 text-center">
                {showDebug && (
                    <div className="alert alert-warning mb-4">
                        <strong>Debug:</strong> Food Orders: {debug.foodCount}, Dabbawala Orders: {debug.dabbawalaCount}
                    </div>
                )}
                <div className="bg-light rounded-lg p-5 max-w-md mx-auto shadow-sm border border-1 border-gray-200">
                    <div className="d-flex justify-content-center mb-4">
                        <div className="position-relative">
                            <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center" style={{ width: "80px", height: "80px" }}>
                                <Store className="text-white" size={40} />
                            </div>
                            <span className="position-absolute bottom-0 end-0 translate-middle badge rounded-pill bg-danger p-2">
                                <X size={14} />
                            </span>
                        </div>
                    </div>
                    <h2 className="fs-2 fw-bold mb-3">No Orders Yet</h2>
                    <p className="text-muted mb-4">You haven't placed any food or dabbawala orders yet.</p>
                    <div className="d-flex gap-3 justify-content-center">
                        <button className="btn btn-primary btn-lg px-4 py-2 fw-medium">
                            <Utensils className="me-2" size={18} />
                            Order Food
                        </button>
                        <button className="btn btn-outline-primary btn-lg px-4 py-2 fw-medium">
                            <Bike className="me-2" size={18} />
                            Dabbawala Service
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container py-4 px-3 px-md-4">
            {emailSent && (
                <div className="position-fixed top-0 end-0 p-3" style={{ zIndex: 1051 }}>
                    <div className="toast show" role="alert" aria-live="assertive" aria-atomic="true">
                        <div className="toast-header bg-success text-white">
                            <Mail size={16} className="me-2" />
                            <strong className="me-auto">Email Sent</strong>
                            <button type="button" className="btn-close btn-close-white" onClick={() => setEmailSent(false)}></button>
                        </div>
                        <div className="toast-body">
                            Cancellation confirmation has been sent to your email.
                        </div>
                    </div>
                </div>
            )}
            
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div className="d-flex align-items-center">
                    <h2 className="fs-2 fw-bold text-primary mb-0">My Orders</h2>
                    <div className="ms-3 badge bg-primary-subtle text-primary rounded-pill px-3 py-2 fs-6">
                        {activeTab === 'food' ? 
                            `${orders.length} food order${orders.length !== 1 ? 's' : ''}` : 
                            `${dabbawalaOrders.length} dabbawala order${dabbawalaOrders.length !== 1 ? 's' : ''}`
                        }
                    </div>
                </div>
                <div className="d-flex align-items-center">
                    <button className="btn btn-outline-primary btn-sm d-flex align-items-center">
                        <Info size={14} className="me-1" />
                        Filter
                    </button>
                </div>
            </div>
            
            <div className="mb-4">
                <ul className="nav nav-tabs">
                    {hasFoodOrders && (
                        <li className="nav-item">
                            <button 
                                className={`nav-link ${activeTab === 'food' ? 'active' : ''}`}
                                onClick={() => setActiveTab('food')}
                            >
                                <Utensils size={16} className="me-1" />
                                Food Orders
                            </button>
                        </li>
                    )}
                    {hasDabbawalaOrders && (
                        <li className="nav-item">
                            <button 
                                className={`nav-link ${activeTab === 'dabbawala' ? 'active' : ''}`}
                                onClick={() => setActiveTab('dabbawala')}
                            >
                                <Bike size={16} className="me-1" />
                                Dabbawala Orders
                            </button>
                        </li>
                    )}
                </ul>
            </div>
            
            {showCancelConfirm && (
                <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" 
                    style={{ backgroundColor: "rgba(0, 0, 0, 0.5)", zIndex: 1050 }}>
                    <div className="bg-white rounded-lg shadow p-4 mx-3" style={{ maxWidth: "400px" }}>
                        <div className="d-flex align-items-center mb-3">
                            <div className="rounded-circle bg-danger-subtle p-3 me-3">
                                <AlertTriangle size={24} className="text-danger" />
                            </div>
                            <h5 className="mb-0 fw-bold">Cancel Order?</h5>
                        </div>
                        <p className="text-secondary mb-4">
                            Are you sure you want to cancel this order? This action cannot be undone.
                            An email confirmation will be sent to your registered email address.
                        </p>
                        <div className="d-flex justify-content-end gap-2">
                            <button 
                                className="btn btn-outline-secondary" 
                                onClick={() => {
                                    setShowCancelConfirm(false);
                                    setCancellingOrderId(null);
                                }}
                            >
                                Keep Order
                            </button>
                            <button 
                                className="btn btn-danger" 
                                onClick={cancelOrder}
                                disabled={emailSending}
                            >
                                {emailSending ? (
                                    <>
                                        <Loader2 size={16} className="me-2 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <X size={16} className="me-2" />
                                        Yes, Cancel
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            <div className="row">
                <div className="col-12">
                    {activeTab === 'food' && orders.map(order => {
                        const currentStageIndex = statusStages.indexOf(order.status);
                        const isExpanded = expandedOrder === order._id;
                        const itemId = order.itemId?._id || order.itemId;
                        const item = itemDetails[itemId] || order.itemId;
                        const isLoadingItem = loadingItems[itemId];
                        const statusTheme = getStatusTheme(order.status);
                        const isAnimating = animatingOrderId === order._id;
                        const timeRemaining = getTimeRemaining(order);
                        const canCancel = order.status === "Waiting Confirmation";

                        return (
                            <motion.div 
                                key={order._id} 
                                className="card mb-4 border-0 shadow-sm overflow-hidden"
                                style={{ 
                                    borderLeft: `5px solid ${statusTheme.primary}`,
                                    borderRadius: "0.75rem"
                                }}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4 }}
                            >
                                <div 
                                    className="card-header py-3 px-4 bg-white cursor-pointer"
                                    onClick={() => toggleOrderExpansion(order._id, itemId)}
                                    style={{ cursor: "pointer" }}
                                >
                                    <div className="d-flex justify-content-between align-items-center">
                                        <div>
                                            <div className="d-flex align-items-center">
                                                <h3 className="mb-0 fs-5 fw-semibold">{order.restaurantName}</h3>
                                                <span className="ms-3 badge bg-light text-dark rounded-pill fs-7">
                                                    #{order._id.substring(order._id.length - 6)}
                                                </span>
                                            </div>
                                            <p className="text-muted mt-1 mb-0 small">
                                                <Clock size={14} className="me-1" />
                                                {formatDate(order.bookingDate)}
                                            </p>
                                        </div>
                                        <div className="d-flex align-items-center">
                                            <span className="px-3 py-1 rounded-pill fs-7 fw-medium text-white"
                                                style={{ 
                                                    background: statusTheme.gradient,
                                                    boxShadow: `0 2px 8px ${statusTheme.accent}60`
                                                }}>
                                                {order.status}
                                            </span>
                                            <div className="ms-3">
                                                <div className="rounded-circle d-flex align-items-center justify-content-center" 
                                                    style={{
                                                        width: "32px", 
                                                        height: "32px", 
                                                        backgroundColor: statusTheme.secondary,
                                                        transition: "transform 0.2s ease"
                                                    }}>
                                                    {isExpanded ? 
                                                        <ChevronUp size={18} style={{ color: statusTheme.primary }} /> : 
                                                        <ChevronDown size={18} style={{ color: statusTheme.primary }} />
                                                    }
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div 
                                            className="card-body p-0 bg-white border-top"
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <div className="p-4" style={{ backgroundColor: statusTheme.secondary }}>
                                                <h4 className="fs-5 fw-semibold text-center mb-4" style={{ color: statusTheme.text }}>
                                                    Order Progress
                                                </h4>
                                                
                                                <div className="position-relative px-4 mb-5">
                                                    <div className="position-absolute top-50 start-0 end-0 translate-middle-y" 
                                                        style={{ 
                                                            height: "6px", 
                                                            backgroundColor: "#E5E7EB",
                                                            borderRadius: "3px"
                                                        }}
                                                    ></div>
                                                    
                                                    <div className="position-absolute top-50 start-0 translate-middle-y" 
                                                        style={{ 
                                                            height: "6px", 
                                                            width: `${((currentStageIndex + 1) / statusStages.length) * 100}%`,
                                                            background: statusTheme.gradient,
                                                            borderRadius: "3px",
                                                            transition: "width 1s ease"
                                                        }}
                                                    ></div>
                                                    
                                                    <div className="d-flex justify-content-between">
                                                        {statusStages.map((stage, index) => {
                                                            const stageTheme = statusColors[stage];
                                                            const isActive = currentStageIndex >= index;
                                                            const isCurrentStage = currentStageIndex === index;
                                                            
                                                            return (
                                                                <div key={stage} className="d-flex flex-column align-items-center position-relative" style={{ zIndex: 1 }}>
                                                                    <div className={`rounded-circle d-flex align-items-center justify-content-center ${isCurrentStage ? "animate-pulse" : ""}`}
                                                                        style={{ 
                                                                            width: "60px", 
                                                                            height: "60px", 
                                                                            backgroundColor: isActive ? stageTheme.primary : "#E5E7EB",
                                                                            boxShadow: isActive ? `0 0 0 5px ${stageTheme.accent}50` : "none",
                                                                            transition: "all 0.3s ease"
                                                                        }}
                                                                    >
                                                                        {statusIcons[stage]}
                                                                    </div>
                                                                    <p className="mt-2 small fw-medium text-center" 
                                                                        style={{ 
                                                                            color: isActive ? stageTheme.text : "#9CA3AF",
                                                                            maxWidth: "80px"
                                                                        }}
                                                                    >
                                                                        {stage}
                                                                    </p>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                                
                                                <div className="d-flex justify-content-center mt-3">
                                                    <div className="d-flex align-items-center px-4 py-2 rounded-pill" 
                                                        style={{ backgroundColor: "white", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}
                                                    >
                                                        <Clock style={{ color: statusTheme.primary }} size={16} className="me-2" />
                                                        <span className="fw-medium" style={{ color: statusTheme.text }}>
                                                            {timeRemaining}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="p-4">
                                                <div className="d-flex align-items-center mb-3">
                                                    <Package style={{ color: statusTheme.primary }} size={18} className="me-2" />
                                                    <h4 className="fs-5 fw-medium mb-0">Order Details</h4>
                                                </div>
                                                
                                                <div className="card border rounded-3 p-3">
                                                    {isLoadingItem ? (
                                                        <div className="d-flex justify-content-center p-4">
                                                            <Loader2 className="animate-spin" style={{ color: statusTheme.primary }} size={24} />
                                                        </div>
                                                    ) : item ? (
                                                        <div className="row align-items-center">
                                                            <div className="col-auto">
                                                                <div className="rounded-3 overflow-hidden" style={{ width: "100px", height: "100px" }}>
                                                                    {item.image ? (
                                                                        <img 
                                                                            className="w-100 h-100 object-fit-cover" 
                                                                            src={`${BACKEND_URI}/api/auth/restaurant/menu/image/${item._id}`} 
                                                                            alt={item.name} 
                                                                        />
                                                                    ) : (
                                                                        <div className="d-flex align-items-center justify-content-center h-100 bg-light">
                                                                            <Utensils style={{ color: "#9CA3AF" }} size={30} />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            
                                                            <div className="col">
                                                                <div className="d-flex justify-content-between align-items-start">
                                                                    <div>
                                                                        <h5 className="fs-5 fw-semibold mb-1">{item.name || "Unknown Item"}</h5>
                                                                        <p className="text-muted small mb-2">{item.description || "No description available"}</p>
                                                                        
                                                                        <div className="d-flex align-items-center mt-2">
                                                                            <span className="badge bg-light text-dark me-2">
                                                                                Qty: {order.quantity}
                                                                            </span>
                                                                            {item.categories && item.categories.length > 0 && (
                                                                                <span className="badge" style={{ 
                                                                                    backgroundColor: statusTheme.secondary, 
                                                                                    color: statusTheme.text
                                                                                }}>
                                                                                    {item.categories[0]}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    
                                                                    <div className="text-end">
                                                                        <div className="badge rounded-pill fs-6 px-3 py-2" style={{ 
                                                                            backgroundColor: statusTheme.secondary, 
                                                                            color: statusTheme.text
                                                                        }}>
                                                                            <DollarSign size={14} className="me-1" />
                                                                            {(item.price || 0).toFixed(2)}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <p className="text-muted p-3 mb-0">Item details unavailable</p>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            <div className="p-4 pt-0">
                                                {canCancel ? (
                                                    <div className="d-flex gap-2">
                                                        <button 
                                                            className="btn w-50 d-flex align-items-center justify-content-center"
                                                            style={{ 
                                                                backgroundColor: "white",
                                                                color: "#EF4444",
                                                                border: "1px solid #EF4444",
                                                                borderRadius: "0.5rem"
                                                            }}
                                                            onClick={(e) => openCancelConfirmation(order._id, e)}
                                                        >
                                                            <X size={18} className="me-2" />
                                                            Cancel Order
                                                        </button>
                                                        <button 
                                                            className="btn w-50 d-flex align-items-center justify-content-center"
                                                            style={{ 
                                                                backgroundColor: "white",
                                                                color: statusTheme.primary,
                                                                border: `1px solid ${statusTheme.primary}`,
                                                                borderRadius: "0.5rem"
                                                            }}
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <MapPin size={18} className="me-2" />
                                                            Track Order
                                                        </button>
                                                    </div>
                                                ) : order.status === "Package Delivered" ? (
                                                    <button 
                                                        className="btn w-100 d-flex align-items-center justify-content-center"
                                                        style={{ 
                                                            backgroundColor: statusTheme.primary,
                                                            color: "white",
                                                            borderRadius: "0.5rem"
                                                        }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            openFeedbackModal(order);
                                                        }}
                                                    >
                                                        <Star size={18} className="me-2" />
                                                        Rate Your Experience
                                                    </button>
                                                ) : (
                                                    <button 
                                                        className="btn w-100 d-flex align-items-center justify-content-center"
                                                        style={{ 
                                                            backgroundColor: "white",
                                                            color: statusTheme.primary,
                                                            border: `1px solid ${statusTheme.primary}`,
                                                            borderRadius: "0.5rem"
                                                        }}
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <MapPin size={18} className="me-2" />
                                                        Track Order
                                                    </button>
                                                )}
                                            </div>
                                            
                                            {isModalOpen && selectedOrder && (
                                                <Modal onClose={() => setIsModalOpen(false)}>
                                                    <FeedbackForm 
                                                        itemId={selectedOrder.itemId}
                                                        orderId={selectedOrder._id} 
                                                        restaurantEmail={selectedOrder.restaurantEmail} 
                                                        userId={selectedOrder.userId} 
                                                    />
                                                </Modal>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}

                    {activeTab === 'dabbawala' && dabbawalaOrders.map(order => {
                        const isExpanded = expandedDabbawalaOrder === order._id;
                        const statusTheme = getStatusTheme(order.status);
                        const isAnimating = animatingOrderId === order._id;
                        const timeRemaining = getTimeRemaining(order);

                        return (
                            <motion.div 
                                key={order._id} 
                                className="card mb-4 border-0 shadow-sm overflow-hidden"
                                style={{ 
                                    borderLeft: `5px solid ${statusTheme.primary}`,
                                    borderRadius: "0.75rem"
                                }}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4 }}
                            >
                                <div 
                                    className="card-header py-3 px-4 bg-white cursor-pointer"
                                    onClick={() => toggleDabbawalaOrderExpansion(order._id)}
                                    style={{ cursor: "pointer" }}
                                >
                                    <div className="d-flex justify-content-between align-items-center">
                                        <div>
                                            <div className="d-flex align-items-center">
                                                <h3 className="mb-0 fs-5 fw-semibold">Dabbawala Delivery</h3>
                                                <span className="ms-3 badge bg-light text-dark rounded-pill fs-7">
                                                    #{order._id.substring(order._id.length - 6)}
                                                </span>
                                            </div>
                                            <p className="text-muted mt-1 mb-0 small">
                                                <Clock size={14} className="me-1" />
                                                {formatDate(order.createdAt)}
                                            </p>
                                        </div>
                                        <div className="d-flex align-items-center">
                                            <span className="px-3 py-1 rounded-pill fs-7 fw-medium text-white"
                                                style={{ 
                                                    background: statusTheme.gradient,
                                                    boxShadow: `0 2px 8px ${statusTheme.accent}60`
                                                }}>
                                                {order.status}
                                            </span>
                                            <div className="ms-3">
                                                <div className="rounded-circle d-flex align-items-center justify-content-center" 
                                                    style={{
                                                        width: "32px", 
                                                        height: "32px", 
                                                        backgroundColor: statusTheme.secondary,
                                                        transition: "transform 0.2s ease"
                                                    }}>
                                                    {isExpanded ? 
                                                        <ChevronUp size={18} style={{ color: statusTheme.primary }} /> : 
                                                        <ChevronDown size={18} style={{ color: statusTheme.primary }} />
                                                    }
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div 
                                            className="card-body p-0 bg-white border-top"
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            {renderDabbawalaStatusTimeline(order)}
                                            {renderDabbawalaOrderDetails(order)}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default OrderTracking;
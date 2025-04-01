import React, { useEffect, useState } from "react";
import axios from "axios";
import { useUser } from "../context/UserContext";
import { motion } from "framer-motion";
import { Loader2, Store, Package, Home } from "lucide-react";

const statusStages = ["On Order", "Preparing", "Out for Delivery", "Delivered"];

const OrderTracking = () => {
    const { user } = useUser();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            axios.get(`http://localhost:5000/api/auth/my-orders/${user.id}`)
                .then(res => setOrders(res.data))
                .catch(err => console.error(err))
                .finally(() => setLoading(false));
        }
    }, [user]);

    const getStatusPosition = (index) => {
        switch(index) {
            case 0: return "0%";
            case 1: return "33%";
            case 2: return "66%";
            default: return "100%";
        }
    };

    return (
        <div className="p-6">
            <h2 className="text-2xl font-semibold mb-4">My Orders</h2>
            {loading ? (
                <div className="flex justify-center">
                    <Loader2 className="animate-spin" size={32} />
                </div>
            ) : (
                orders.map(order => {
                    const currentStageIndex = statusStages.indexOf(order.status);

                    return (
                        <section key={order._id} className="mb-6 p-4 border rounded-lg shadow-md bg-white">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-lg font-semibold">{order.restaurantName}</h3>
                                    <p className="text-sm text-gray-500">Order Date: {new Date(order.bookingDate).toLocaleString()}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-semibold">Order #: {order._id}</p>
                                </div>
                            </div>

                            {/* Order Items */}
                            <div className="mb-6 bg-gray-50 p-3 rounded-lg">
                                <h4 className="text-sm font-semibold mb-2">Ordered Item</h4>
                                <div className="flex items-center bg-white rounded-lg p-2 shadow-sm">
                                    <div className="w-12 h-12 bg-gray-200 rounded-md overflow-hidden flex-shrink-0">
                                        {order.itemId?.image ? (
                                            <img 
                                                src={order.itemId.image} 
                                                alt={order.itemId.name} 
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                                                No img
                                            </div>
                                        )}
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm font-medium">{order.itemId?.name || "Unknown Item"}</p>
                                        <p className="text-xs text-gray-500">Qty: {order.quantity}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Status Track */}
                            <div className="relative mt-8 mb-12">
                                <div className="absolute top-8 left-0 right-0 h-1 bg-gray-200"></div>
                                
                                <div className="absolute top-0 left-0 right-0 flex justify-between">
                                    <div className="flex flex-col items-center">
                                        <div className={`w-16 h-16 rounded-full border-2 ${currentStageIndex >= 0 ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-gray-50"} flex items-center justify-center`}>
                                            <Store className={`w-8 h-8 ${currentStageIndex >= 0 ? "text-blue-500" : "text-gray-400"}`} />
                                        </div>
                                        <p className={`mt-2 text-xs ${currentStageIndex >= 0 ? "text-blue-500 font-semibold" : "text-gray-400"}`}>On Order</p>
                                    </div>
                                    
                                    <div className="flex flex-col items-center">
                                        <div className={`w-16 h-16 rounded-full border-2 ${currentStageIndex >= 1 ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-gray-50"} flex items-center justify-center`}>
                                            <Package className={`w-8 h-8 ${currentStageIndex >= 1 ? "text-blue-500" : "text-gray-400"}`} />
                                        </div>
                                        <p className={`mt-2 text-xs ${currentStageIndex >= 1 ? "text-blue-500 font-semibold" : "text-gray-400"}`}>Preparing</p>
                                    </div>
                                    
                                    <div className="flex flex-col items-center">
                                        <div className={`w-16 h-16 rounded-full border-2 ${currentStageIndex >= 2 ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-gray-50"} flex items-center justify-center`}>
                                            <Home className={`w-8 h-8 ${currentStageIndex >= 2 ? "text-blue-500" : "text-gray-400"}`} />
                                        </div>
                                        <p className={`mt-2 text-xs ${currentStageIndex >= 2 ? "text-blue-500 font-semibold" : "text-gray-400"}`}>Out for Delivery</p>
                                    </div>
                                </div>
                                
                                <motion.div
                                    className="absolute text-2xl"
                                    initial={{ top: "5px", left: "0%" }}
                                    animate={{ left: getStatusPosition(currentStageIndex) }}
                                    transition={{ duration: 0.8 }}
                                    style={{ transform: "translateX(-50%)" }}
                                >
                                    🚴
                                </motion.div>
                            </div>

                            {/* Current Status Display */}
                            <div className="mt-4 py-2 bg-blue-50 rounded text-center">
                                <p className="text-blue-500 font-semibold">Current Status: {order.status}</p>
                            </div>
                        </section>
                    );
                })
            )}
        </div>
    );
};

export default OrderTracking;

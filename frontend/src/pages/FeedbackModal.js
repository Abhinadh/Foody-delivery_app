import React from "react";
import { X, Utensils, MapPin } from "lucide-react";

const FoodDeliveryModal = ({ children, onClose, title, subtitle }) => {
    return (
        <div className="fixed inset-0 flex items-center justify-center bg-orange-500 bg-opacity-50 z-50 p-4">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border-4 border-orange-600 relative overflow-hidden">
                {/* Header */}
                <div className="bg-orange-500 text-white p-6 pt-8 relative">
                    <button 
                        className="absolute top-4 right-4 text-white hover:text-orange-200 transition-colors"
                        onClick={onClose}
                    >
                        <X size={24} />
                    </button>
                    <Utensils size={40} className="absolute left-4 top-4 text-white opacity-50" />
                    <h2 className="text-2xl font-bold text-center">{title || "Delivery Details"}</h2>
                    <p className="text-center text-white text-opacity-80 mt-2">
                        {subtitle || "Complete your order"}
                    </p>
                </div>

                {/* Content Area */}
                <div className="p-6">
                    {children}
                </div>

                {/* Location Indicator */}
                <div className="bg-orange-50 p-4 flex items-center border-t border-orange-100">
                    <MapPin size={24} className="text-orange-500 mr-3" />
                    <div>
                        <p className="text-sm font-semibold text-gray-700">Delivery Location</p>
                        <p className="text-xs text-gray-500">123 Foodie Street, Hungry City</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FoodDeliveryModal;

// Example Usage:
const ExampleOrderModal = () => {
    const [isOpen, setIsOpen] = React.useState(true);

    return (
        <FoodDeliveryModal 
            title="Order Confirmation" 
            subtitle="Almost there!"
            onClose={() => setIsOpen(false)}
        >
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <span className="text-gray-600">Margherita Pizza</span>
                    <span className="font-bold text-orange-600">$12.99</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-gray-600">Coca-Cola</span>
                    <span className="font-bold text-orange-600">$2.50</span>
                </div>
                <div className="border-t pt-4 mt-4">
                    <div className="flex justify-between">
                        <span className="text-gray-600">Total</span>
                        <span className="font-bold text-xl text-orange-600">$15.49</span>
                    </div>
                </div>
                <button 
                    className="w-full bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 transition-colors"
                >
                    Confirm Order
                </button>
            </div>
        </FoodDeliveryModal>
    );
};
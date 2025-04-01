import React, { useEffect, useState } from "react";
import { useUser } from "../context/UserContext"; // Assuming you use context for user
import axios from "axios";
import "../styles/Cart.css";

const Cart = () => {
    const { user } = useUser();
    const [cartItems, setCartItems] = useState([]);
    
    useEffect(() => {
        if (user?.id) {
            fetchCartItems();
        }
    }, [user]);

    const fetchCartItems = async () => {
        try {
            const { data } = await axios.get(`http://localhost:5000/api/auth/cart/${user.id}`);
            console.log("Cart Data from Backend:", data);
            setCartItems(data);
        } catch (error) {
            console.error("Error fetching cart:", error);
        }
    };

    const removeItem = async (cartId) => {
        try {
            await axios.delete(`http://localhost:5000/api/auth/cart/remove/${cartId}`);
            setCartItems(cartItems.filter(item => item._id !== cartId));
        } catch (error) {
            console.error("Error removing item:", error);
        }
    };

    const updateQuantity = async (cartId, newQuantity) => {
        if (newQuantity < 1) return; // Prevents setting quantity to zero or negative

        try {
            await axios.put(`http://localhost:5000/api/auth/cart/update/${cartId}`, { quantity: newQuantity });
            setCartItems(cartItems.map(item => 
                item._id === cartId ? { ...item, quantity: newQuantity } : item
            ));
        } catch (error) {
            console.error("Error updating quantity:", error);
        }
    };

    const totalAmount = cartItems.reduce((sum, item) => sum + item.item.price * item.quantity, 0);

    return (
        <div className="vwcrz-cart-container">
            <h2>My Cart</h2>
            <div className="vwcrz-cart-list">
                {cartItems.map((cartItem) => (
                    <div key={cartItem._id} className="vwcrz-cart-item">
                        <img src={`http://localhost:5000/api/auth/restaurant/menu/image/${cartItem.item._id}`} 
                            alt={cartItem.item.name} className="vwcrz-item-image" />
                        <div className="vwcrz-item-details">
                            <h3>{cartItem.item.name}</h3>
                            <p>{cartItem.item.description}</p>
                        </div>
                        <span className="vwcrz-item-price">₹{cartItem.item.price}</span>
                        <div className="vwcrz-actions">
                            <button onClick={() => updateQuantity(cartItem._id, cartItem.quantity - 1)} 
                                disabled={cartItem.quantity <= 1}>-</button>
                            <span>{cartItem.quantity}</span>
                            <button onClick={() => updateQuantity(cartItem._id, cartItem.quantity + 1)}>+</button>
                            <button onClick={() => removeItem(cartItem._id)} className="vwcrz-remove">Remove</button>
                        </div>
                    </div>
                ))}
            </div>
    
            {/* Fixed Total Price Box */}
            <div className="vwcrz-total-container">
                <span>Total: ₹{totalAmount.toFixed(2)}</span>
            </div>
    
            <button className="vwcrz-order-button">Order All</button>
        </div>
    );
    
    
};

export default Cart;

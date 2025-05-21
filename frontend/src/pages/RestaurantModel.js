import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/RestaurantModal.css";
import { FaMapMarkerAlt, FaPhone, FaTimes } from "react-icons/fa";
import DescriptionModal from "./Description"; // Import DescriptionModal

const RestaurantModal = ({ restaurant, onClose }) => {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null); // State to track selected item for ordering

  useEffect(() => {
    if (restaurant && restaurant.email) {
      fetchMenuItems(restaurant.email);
    } else if (restaurant && restaurant._id) {
      fetchMenuItems(restaurant._id);
    }
  }, [restaurant]);

  const fetchMenuItems = async (identifier) => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5000/api/auth/menu-items/restaurant/${identifier}`);
      console.log("API response:", response);
      
      // Handle the specific response format where data is in menuItems property
      if (response.data && response.data.menuItems && Array.isArray(response.data.menuItems)) {
        setMenuItems(response.data.menuItems);
        console.log("Menu items set:", response.data.menuItems);
      } else {
        console.error("Unexpected response format:", response.data);
        setMenuItems([]);
      }
      
      setLoading(false);
    } catch (error) {
      console.error("Error fetching menu items:", error);
      setMenuItems([]);
      setLoading(false);
    }
  };

  // Handle order button click
  const handleOrderClick = (item) => {
    setSelectedItem(item);
  };

  // Close description modal
  const handleCloseDescription = () => {
    setSelectedItem(null);
  };

  if (!restaurant) return null;

  return (
    <div className="restaurant-modal-overlay">
      <div className="restaurant-modal-content">
        <button className="restaurant-close-btn" onClick={onClose}>
          <FaTimes />
        </button>
        
        <div className="restaurant-modal-header">
          <div className="restaurant-modal-title">
            <h2>{restaurant.name}</h2>
          </div>
        </div>
        
        <div className="restaurant-modal-details">
          <div className="restaurant-detail-item">
            <FaMapMarkerAlt className="restaurant-icon" />
            <p>{restaurant.address || "Address not available"}</p>
          </div>
          
          <div className="restaurant-detail-item">
            <FaPhone className="restaurant-icon" />
            <p>{restaurant.phone || "Phone not available"}</p>
          </div>
        </div>

        {/* Menu Items Section */}
        <div className="restaurant-menu-section">
          <h3>Menu Items</h3>
          {loading ? (
            <p>Loading menu items...</p>
          ) : menuItems && menuItems.length > 0 ? (
            <div className="restaurant-menu-grid">
              {menuItems.map((item, index) => (
                <div key={item._id || index} className="restaurant-menu-item">
                  <img 
                    src={`http://localhost:5000/api/auth/restaurant/menu/image/${item._id}`}
                    alt={item.name}
                    className="restaurant-menu-image"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://via.placeholder.com/150x100?text=Food+Image";
                    }}
                  />
                  <div className="restaurant-menu-details">
                    <h4>{item.name}</h4>
                    <p className="restaurant-menu-price">₹{item.price}</p>
                    <button 
                      className="restaurant-order-btn"
                      onClick={() => handleOrderClick(item)}
                    >
                      Order Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>No menu items available for this restaurant.</p>
          )}
        </div>
      </div>

      {/* Description Modal for selected item */}
      {selectedItem && (
        <DescriptionModal 
          item={selectedItem} 
          onClose={handleCloseDescription} 
        />
      )}
    </div>
  );
};

export default RestaurantModal;
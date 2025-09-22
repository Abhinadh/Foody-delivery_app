import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import "../styles/Homepage.css";
import { useUser } from "../context/UserContext";
import { FaStar, FaStarHalfAlt } from "react-icons/fa";
import DescriptionModal from "./Description";
import RestaurantModal from "./RestaurantModel"; // Import the new component
import { useSearch } from "../context/SearchContext";


const foodCategories = [
    { name: "Pizza", icon: "🍕" },
    { name: "Burger", icon: "🍔" },
    { name: "Sushi", icon: "🍣" },
    { name: "Drinks", icon: "🥤" },
    { name: "Donut", icon: "🍩" },
    { name: "Salads", icon: "🥗" },
    { name: "Steak", icon: "🥩" },
    { name: "Pasta", icon: "🍝" },
    { name: "Ice Cream", icon: "🍦" },
];

const Home = () => {
    const { user } = useUser();
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [menuItems, setMenuItems] = useState([]);
    const [allMenuItems, setAllMenuItems] = useState([]);
    const [selectedItem, setSelectedItem] = useState(null);
    const [foods, setFoods] = useState([]);
    const [restaurantNames, setRestaurantNames] = useState({});//restname
    const URL =process.env.BACKEND_URI


    const [selectedRestaurant, setSelectedRestaurant] = useState(null);
    const [restaurantDetails, setRestaurantDetails] = useState(null); // Add this state for restaurant modal
    const [filters, setFilters] = useState({
        ratingAbove3: false,
        ratingAbove4: false,
        price100to200: false,
        price200to300: false,
        price300to400: false,
        vegetarian: false,
        nonVegetarian: false,
    });

    const scrollRef = useRef(null);
    const [restaurants, setRestaurants] = useState([]);
    const [allRestaurants, setAllRestaurants] = useState([]);
    const { searchQuery } = useSearch(); 
   
    
    //restname
    useEffect(() => {
        const fetchRestaurantNames = async () => {
            const namePromises = menuItems.map(async (item) => {
                try {
                    const response = await axios.get(`https://foody-backend-l2zy.onrender.com/api/auth/menu-items/restaurant/name/${item.restaurantId}`);
                    return { itemId: item._id, name: response.data.name };
                } catch (error) {
                    console.error('Error fetching restaurant name:', error);
                    return { itemId: item._id, name: 'Unknown Restaurant' };
                }
            });
            
            const results = await Promise.all(namePromises);
            
            // Convert array of results to an object with item IDs as keys
            const namesMap = {};
            results.forEach(result => {
                namesMap[result.itemId] = result.name;
            });
            
            setRestaurantNames(namesMap);
        };
    
        if (menuItems.length > 0) {
            fetchRestaurantNames();
        }
    }, [menuItems]);

    useEffect(() => {
        axios.get(`https://foody-backend-l2zy.onrender.com/api/auth/menu-items`)
            .then(res => {
              // make sure it's an array
        setAllMenuItems(Array.isArray(res.data) ? res.data : []);
        setMenuItems(Array.isArray(res.data) ? res.data : []);
            })
            .catch(err => console.error(err));
    }, []);

    useEffect(() => {
        axios.get("https://foody-backend-l2zy.onrender.com/api/auth/admin/restaurants")
            .then(res => {
                    // Inspect this in Vercel or locally
        const restaurantsArray = Array.isArray(res.data) ? res.data : Object.values(res.data);
        const approvedRestaurants = restaurantsArray.filter(restaurant => restaurant.approved);
        setRestaurants(approvedRestaurants);
        setAllRestaurants(approvedRestaurants)
            })
            .catch(err => console.error(err));
    }, []);
    
    useEffect(() => {
        if (selectedRestaurant) {
            setMenuItems(allMenuItems.filter(item => item.restaurantId === selectedRestaurant._id));
        } else {
            setMenuItems(allMenuItems);
        }
    }, [selectedRestaurant, allMenuItems]);
    
    useEffect(() => {
        let filteredItems = allMenuItems;

        if (selectedCategory) {
            filteredItems = filteredItems.filter(item =>
                item.name.toLowerCase().includes(selectedCategory.toLowerCase())
            );
        }

        if (searchQuery) {
            filteredItems = filteredItems.filter(item =>
                item.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        if (filters.ratingAbove3) {
            filteredItems = filteredItems.filter(item => item.rating >= 3);
        }

        if (filters.ratingAbove4) {
            filteredItems = filteredItems.filter(item => item.rating >= 4);
        }

        if (filters.price100to200) {
            filteredItems = filteredItems.filter(item => item.price >= 100 && item.price <= 200);
        }

        if (filters.price200to300) {
            filteredItems = filteredItems.filter(item => item.price >= 200 && item.price <= 300);
        }

        if (filters.price300to400) {
            filteredItems = filteredItems.filter(item => item.price >= 300 && item.price <= 400);
        }

        if (filters.vegetarian) {
            filteredItems = filteredItems.filter(item => item.type === "Vegetarian");
        }

        if (filters.nonVegetarian) {
            filteredItems = filteredItems.filter(item => item.type === "Non-Vegetarian");
        }

        setMenuItems(filteredItems);
    }, [selectedCategory, searchQuery, allMenuItems, filters]);

    useEffect(() => {
        if (searchQuery) {
            const filteredRestaurants = allRestaurants.filter(restaurant =>
                restaurant.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setRestaurants(filteredRestaurants);
        } else {
            setRestaurants(allRestaurants);
        }
    }, [searchQuery, allRestaurants]);


    const handleFilterChange = (filterType) => {
        setFilters(prevFilters => ({
            ...prevFilters,
            [filterType]: !prevFilters[filterType]
        }));
    };

    const renderStars = (rating) => {
        const fullStars = Math.floor(rating);
        const halfStar = rating % 1 >= 0.5;
        return (
            <div className="star-rating">
                {[...Array(fullStars)].map((_, i) => (
                    <FaStar key={`full-${i}`} color="red" />
                ))}
                {halfStar && <FaStarHalfAlt key="half" color="red" />}
            </div>
        );
    };

    const renderResStars = (rating) => {
        const fullStars = Math.floor(rating);
        const halfStar = rating % 1 >= 0.5;
        return (
            <div className="star-rating">
                {[...Array(fullStars)].map((_, i) => (
                    <FaStar key={`full-${i}`} color="gold" />
                ))}
                {halfStar && <FaStarHalfAlt key="half" color="gold" />}
            </div>
        );
    };

    const handleBuyNow = (item) => {
        setSelectedItem(item);
    };

    const scrollLeft = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollBy({ left: -300, behavior: "smooth" });
        }
    };

    const scrollRight = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollBy({ left: 300, behavior: "smooth" });
        }
    };

    useEffect(() => {
        const interval = setInterval(() => {
            if (scrollRef.current) {
                scrollRef.current.scrollBy({ left: 300, behavior: "smooth" });
            }
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    // Function to fetch restaurant details when clicked
    const handleRestaurantClick = async (restaurant) => {
        try {
            // Set the restaurant immediately to show the modal faster
            setRestaurantDetails(restaurant);
            
            // Then fetch additional details if needed
            const response = await axios.get(`https://foody-backend-l2zy.onrender.com/api/auth/restaurants/name/${restaurant._id}`);
            setRestaurantDetails(response.data);
            setSelectedRestaurant(response.data);
        } catch (error) {
            console.error("Error fetching restaurant details:", error);
        }
    };

    return (
        <div className="home-container-kjmn">
            <div className="scroll-container-kjmn">
                <div className="scroll-wrapper-kjmn">
                    {[...foodCategories, ...foodCategories, ...foodCategories].map((item, index) => (
                        <div 
                            key={index} 
                            className="food-icon-kjmn" 
                            onClick={() => setSelectedCategory(item.name)}
                        >
                            {item.icon}
                        </div>
                    ))}
                </div>
            </div>

            {/* Heading */}
            <h2 className="menu-heading" style={{ textAlign: "left", marginLeft: "20px" }}>
                Here you go! Choose your favorite meal 🍽️
            </h2>

            {/* Filter Buttons */}
            <div className="filter-container">
                <button 
                    className={`filter-btn ${filters.ratingAbove3 ? "active" : ""}`} 
                    onClick={() => handleFilterChange("ratingAbove3")}
                >
                    Rating 3 & Above
                </button>

                <button 
                    className={`filter-btn ${filters.ratingAbove4 ? "active" : ""}`} 
                    onClick={() => handleFilterChange("ratingAbove4")}
                >
                    Rating 4 & Above
                </button>

                <button 
                    className={`filter-btn ${filters.price100to200 ? "active" : ""}`} 
                    onClick={() => handleFilterChange("price100to200")}
                >
                    Price ₹100 - ₹200
                </button>

                <button 
                    className={`filter-btn ${filters.price200to300 ? "active" : ""}`} 
                    onClick={() => handleFilterChange("price200to300")}
                >
                    Price ₹200 - ₹300
                </button>

                <button 
                    className={`filter-btn ${filters.price300to400 ? "active" : ""}`} 
                    onClick={() => handleFilterChange("price300to400")}
                >
                    Price ₹300 - ₹400
                </button>

                {/* <button 
                    className={`filter-btn ${filters.vegetarian ? "active" : ""}`} 
                    onClick={() => handleFilterChange("vegetarian")}
                >
                    Vegetarian
                </button> */}

                {/* <button 
                    className={`filter-btn ${filters.nonVegetarian ? "active" : ""}`} 
                    onClick={() => handleFilterChange("nonVegetarian")}
                >
                    Non-Vegetarian
                </button> */}
            </div>

            <div className="menu-scroll-container">
            <button className="scroll-btn left" onClick={scrollLeft}>&lt;</button>
                <div className="menu-scroll-wrapper" ref={scrollRef}>
                    {menuItems.length > 0 ? (
                        menuItems.map(item => (
                            <div key={item._id} className="menu-card-kjmn">
                                <img className="menu-image-kjmn" src={`https://foody-backend-l2zy.onrender.comf/api/auth/restaurant/menu/image/${item._id}`} alt={item.name} />
                                <div className="menu-info-kjmn">
                                    <div className="menu-title">
                                        <h3>{item.name}</h3>
                                        <div style={{
    border: "2px solid #ddd",
    padding: "12px 20px",
    borderRadius: "12px",
    backgroundColor: "#f5f5f5",
    display: "inline-block",
    textAlign: "center",
    width: "200px",  // Increased width to make it stretch a little
    boxShadow: "4px 4px 10px rgba(0, 0, 0, 0.1)",
    transition: "0.3s",
    fontFamily: "Arial, sans-serif"
}}>
                                        <label style={{ 
        color: "#777", 
        fontSize: "12px", 
        fontWeight: "bold", 
        display: "block",
        opacity: "0.7"  // Makes the label dimmer
    }}>
        Restaurant
    </label>
    <h4 style={{ 
        color: "#333", 
        fontSize: "14px", 
        margin: "5px 0",
        fontWeight: "500" 
    }}>
        {restaurantNames[item._id]}
    </h4>
    </div>
                                        <div className="rating-container">
                                            {renderStars(item.rating)}
                                            <button className="buy-now-btn" onClick={() => handleBuyNow(item)}>
                                                Buy Now
                                            </button>
                                        </div>
                                    </div>
                                    <p className="menu-desc-kjmn">{item.description || "No description available."}</p>
                                    <p className="menu-price-kjmn" style={{ color: "green", fontWeight: "bold" }}>₹{item.price} </p>
                                </div>
                                
                            </div>
                        ))
                    ) : (
                        <p className="no-items">No items found in this category</p>
                    )}
                </div>
                <button className="scroll-btn right" onClick={scrollRight}>&gt;</button>
            </div>
            <div className="best-restaurants-container">
                <h2>Best Restaurants 🍽️</h2>
                <div className="restaurant-list">
                    {restaurants.length > 0 ? (
                        restaurants.map(restaurant => (
                            <div 
                                key={restaurant._id} 
                                className="restaurant-box"
                                onClick={() => handleRestaurantClick(restaurant)}
                            >
                                <h3>{restaurant.name}</h3>
                                <div className="rating-container">
                                    {renderResStars(restaurant.rating)}
                                    <span>({restaurant.rating})</span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p>No approved restaurants available</p>
                    )}
                </div>
            </div>

            {selectedItem && (
                <DescriptionModal item={selectedItem} onClose={() => setSelectedItem(null)} />
            )}
            
            {/* Restaurant Modal */}
            {restaurantDetails && (
                <RestaurantModal 
                    restaurant={restaurantDetails} 
                    onClose={() => setRestaurantDetails(null)} 
                />
            )}
        </div>
    );
};

export default Home;
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { useSearch } from "../context/SearchContext";
import axios from "axios";
import "../styles/Navbar.css";
import { PiHamburgerBold } from "react-icons/pi";
import { RiLogoutCircleRLine, RiAccountCircleLine } from "react-icons/ri";
import { IoSettingsOutline, IoCheckmarkCircleOutline } from "react-icons/io5"; 
import { TbShoppingCartSearch } from "react-icons/tb";
import { MdOutlineShoppingBag, MdOutlineFoodBank } from "react-icons/md";
import { FaToolbox, FaRegSmile } from "react-icons/fa";
import { AiOutlineDashboard } from "react-icons/ai";

const Navbar = ({ setShowModal, setModalType }) => {
    const { user, logout } = useUser();
    const { setSearchQuery } = useSearch();
    const [showSidebar, setShowSidebar] = useState(false);
    const [userName, setUserName] = useState("");
    const [userRole, setUserRole] = useState("");
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [query, setQuery] = useState("");
    const navigate = useNavigate();
    const BACKEND_URI =process.env.BACKEND_URI

    // Enhanced icon style with hover effect
    const iconStyle = { 
        color: "#FF4500", 
        fontSize: "24px", 
        minWidth: "36px",
        transition: "transform 0.2s ease"
    };

    useEffect(() => {
        if (user?.email) {
            axios.get(`${BACKEND_URI}/api/auth/user/profile?email=${user.email}`)
                .then(response => {
                    setUserName(response.data.name);
                    setUserRole(response.data.role);
                })
                .catch(error => {
                    console.error("Error fetching user profile:", error);
                });
        }
    }, [user]);

    const handleSearch = (e) => {
        e.preventDefault();
        setSearchQuery(query);
        navigate("/");
    };

    const handleLogout = () => {
        setShowSidebar(false);
        setTimeout(() => {
            setShowLogoutModal(true);
            setTimeout(() => {
                logout();
                window.location.reload();
            }, 1500);
        }, 300);
        navigate('/')
    };

    const isUser = user && user.role === "user";
    const isAdmin = user && user.role === "admin";
    const isDelivery = user && user.role === "delivery";

    // Function to determine the correct home path based on user role
    const getHomePath = () => {
        if (!user) return "/";
        
        switch (user.role) {
            case "admin":
                return "/dashboard/admin";
            case "delivery":
                return "/dashboard/delivery";
            case "user":
                return "/";
            default:
                return "/";
        }
    };

    // Get greeting based on time of day
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good Morning";
        if (hour < 18) return "Good Afternoon";
        return "Good Evening";
    };

    return (
        <>
            <nav style={{
                background: "linear-gradient(135deg,rgb(0, 0, 0),rgb(52, 50, 50))",
                padding: "12px 24px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                position: "sticky",
                top: 0,
                zIndex: 100,
                borderBottom: "1px solid rgba(255,255,255,0.2)"
            }}>
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "24px"
                }}>
                    <Link to={getHomePath()} style={{
                        fontSize: "28px",
                        fontWeight: "700",
                        color: "white",
                        textDecoration: "none",
                        textShadow: "2px 2px 4px rgba(0, 0, 0, 0.2)",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px"
                    }}>
                        <MdOutlineFoodBank style={{ fontSize: "32px" }} />
                        Foodie
                    </Link>
                    
                    {/* Enhanced search bar only for users */}
                    {isUser && (
                        <form onSubmit={handleSearch} style={{
                            display: "flex",
                            alignItems: "center",
                            background: "rgba(255, 255, 255, 0.9)",
                            borderRadius: "50px",
                            padding: "4px 6px",
                            boxShadow: "0 2px 6px rgba(0, 0, 0, 0.1)",
                            transition: "all 0.3s ease",
                            width: "300px"
                        }}>
                            <input
                                type="text"
                                placeholder="Search for food/restaurants..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                style={{
                                    border: "none",
                                    outline: "none",
                                    height:"20px",
                                    background: "transparent",
                                    padding: "8px 16px",
                                    borderRadius: "50px",
                                    width: "100%",
                                    fontSize: "15px"
                                }}
                            />
                            <button type="submit" style={{
                                background: "#FF4500",
                                border: "none",
                                borderRadius: "50%",
                                width: "36px",
                                height: "36px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                                transition: "transform 0.2s ease"
                            }}>
                                <TbShoppingCartSearch style={{ color: "white", fontSize: "18px" }} />
                            </button>
                        </form>
                    )}
                </div>

                <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "16px"
                }}>
                    {/* Enhanced Cart and Dabbawala buttons for users */}
                    {isUser && (
                        <>
                            <Link to="/cart" style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                background: "rgba(255, 255, 255, 0.2)",
                                color: "white",
                                padding: "8px 16px",
                                borderRadius: "50px",
                                textDecoration: "none",
                                fontWeight: "600",
                                transition: "all 0.3s ease",
                                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)"
                            }}>
                                🛒 Cart
                            </Link>
                            
                            <Link to="/dabbawala" style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                background: "rgba(255, 255, 255, 0.2)",
                                color: "white",
                                padding: "8px 16px",
                                borderRadius: "50px",
                                textDecoration: "none",
                                fontWeight: "600",
                                transition: "all 0.3s ease",
                                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)"
                            }}>
                                <FaToolbox style={{ fontSize: "16px" }} /> Dabbawala
                            </Link>
                        </>
                    )}
                    
                    {user ? (
                        <button 
                            style={{
                                background: "rgba(255, 255, 255, 0.25)",
                                border: "none",
                                borderRadius: "50%",
                                width: "44px",
                                height: "44px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
                                transition: "all 0.3s ease"
                            }}
                            onClick={() => setShowSidebar(!showSidebar)}
                        >
                            <PiHamburgerBold style={{ color: "white", fontSize: "22px" }} />
                        </button>
                    ) : (
                        <button 
                            style={{
                                background: "white",
                                color: "#FF4500",
                                border: "none",
                                borderRadius: "50px",
                                padding: "10px 24px",
                                fontWeight: "600",
                                cursor: "pointer",
                                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                                transition: "transform 0.2s ease"
                            }}
                            onClick={() => {
                                setModalType("login");
                                setShowModal(true);
                            }}
                        >
                            Sign In
                        </button>
                    )}
                </div>
            </nav>

            {showSidebar && (
                <>
                    <div 
                        style={{
                            position: "fixed",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: "rgba(0, 0, 0, 0.5)",
                            zIndex: 998,
                            backdropFilter: "blur(3px)",
                            transition: "opacity 0.3s ease",
                            opacity: showSidebar ? 1 : 0
                        }} 
                        onClick={() => setShowSidebar(false)}
                    ></div>
                    
                    <div style={{
                        position: "fixed",
                        top: 0,
                        right: 0,
                        height: "100vh",
                        width: "300px",
                        background: "white",
                        boxShadow: "-4px 0 20px rgba(0, 0, 0, 0.15)",
                        zIndex: 999,
                        transition: "transform 0.3s ease",
                        transform: showSidebar ? "translateX(0)" : "translateX(100%)",
                        display: "flex",
                        flexDirection: "column"
                    }}>
                        <button 
                            style={{
                                position: "absolute",
                                top: "15px",
                                right: "15px",
                                background: "none",
                                border: "none",
                                fontSize: "24px",
                                cursor: "pointer",
                                color: "#555"
                            }} 
                            onClick={() => setShowSidebar(false)}
                        >
                            ×
                        </button>

                        <div style={{
                            padding: "32px 24px 24px",
                            background: "linear-gradient(135deg,rgb(0, 0, 0),rgb(0, 0, 0))",
                            color: "white",
                            borderBottom: "1px solid rgba(255,255,255,0.2)",
                            marginBottom: "8px"
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                                <div style={{
                                    width: "60px",
                                    height: "60px",
                                    borderRadius: "50%",
                                    background: "rgba(255,255,255,0.3)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "24px"
                                }}>
                                    {userName ? userName.charAt(0).toUpperCase() : "U"}
                                </div>
                                <div>
                                    <div style={{ fontSize: "14px" }}>{getGreeting()},</div>
                                    <div style={{ fontSize: "18px", fontWeight: "600" }}>{userName || "User"}</div>
                                    <div style={{ 
                                        fontSize: "12px", 
                                        background: "rgba(255,255,255,0.2)", 
                                        padding: "2px 8px", 
                                        borderRadius: "10px",
                                        display: "inline-block",
                                        marginTop: "4px"
                                    }}>
                                        {userRole?.charAt(0).toUpperCase() + userRole?.slice(1) || "User"}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <ul style={{ 
                            padding: "0", 
                            margin: "0", 
                            listStyle: "none",
                            flexGrow: 1,
                            overflow: "auto"
                        }}>
                            {/* Dashboard for Admin/Delivery */}
                            {(isAdmin || isDelivery) && (
                                <li>
                                    <Link to={getHomePath()} style={{
                                        display: "flex",
                                        alignItems: "center",
                                        padding: "14px 24px",
                                        textDecoration: "none",
                                        color: "#333",
                                        borderLeft: "4px solid transparent",
                                        transition: "all 0.2s ease",
                                        fontSize: "15px"
                                    }}>
                                        <AiOutlineDashboard style={{...iconStyle, marginRight: "12px"}} />
                                        Dashboard
                                    </Link>
                                </li>
                            )}
{/*                             
                            <li>
                                <Link to="/profile" style={{
                                    display: "flex",
                                    alignItems: "center",
                                    padding: "14px 24px",
                                    textDecoration: "none",
                                    color: "#333",
                                    borderLeft: "4px solid transparent",
                                    transition: "all 0.2s ease",
                                    fontSize: "15px"
                                }}>
                                    <RiAccountCircleLine style={{...iconStyle, marginRight: "12px"}} />
                                    My Profile
                                </Link>
                            </li> */}
                            
                            {/* Show My Orders only for users */}
                            {isUser && (
                                <li>
                                    <Link to="/my-orders" style={{
                                        display: "flex",
                                        alignItems: "center",
                                        padding: "14px 24px",
                                        textDecoration: "none",
                                        color: "#333",
                                        borderLeft: "4px solid transparent",
                                        transition: "all 0.2s ease",
                                        fontSize: "15px"
                                    }}>
                                        <MdOutlineShoppingBag style={{...iconStyle, marginRight: "12px"}} />
                                        My Orders
                                    </Link>
                                </li>
                            )}
                            
                            {/* Show Feedback only for admins */}
                            {isAdmin && (
                                <li>
                                    <Link to="/feedback" style={{
                                        display: "flex",
                                        alignItems: "center",
                                        padding: "14px 24px",
                                        textDecoration: "none",
                                        color: "#333",
                                        borderLeft: "4px solid transparent",
                                        transition: "all 0.2s ease",
                                        fontSize: "15px"
                                    }}>
                                        <FaRegSmile style={{...iconStyle, marginRight: "12px"}} />
                                        Customer Feedback
                                    </Link>
                                </li>
                            )}

                            {/* Show Payment History only for admins */}
                            {isAdmin && (
                                <li>
                                    <Link to="/payments" style={{
                                        display: "flex",
                                        alignItems: "center",
                                        padding: "14px 24px",
                                        textDecoration: "none",
                                        color: "#333",
                                        borderLeft: "4px solid transparent",
                                        transition: "all 0.2s ease",
                                        fontSize: "15px"
                                    }}>
                                        <IoSettingsOutline style={{...iconStyle, marginRight: "12px"}} />
                                        Payment History
                                    </Link>
                                </li>
                            )}
                        </ul>
                        
                        <div style={{
                            padding: "16px",
                            borderTop: "1px solid #eee"
                        }}>
                            <button 
                                onClick={handleLogout} 
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "10px",
                                    width: "100%",
                                    padding: "12px",
                                    background: "#f8f8f8",
                                    border: "1px solid #ddd",
                                    borderRadius: "8px",
                                    color: "#FF4500",
                                    fontWeight: "600",
                                    cursor: "pointer",
                                    transition: "all 0.2s ease"
                                }}
                            >
                                <RiLogoutCircleRLine style={{ fontSize: "20px" }} />
                                Logout
                            </button>
                        </div>
                    </div>
                </>
            )}

            {showLogoutModal && (
                <div style={{
                    position: "fixed",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    background: "white",
                    padding: "24px",
                    borderRadius: "12px",
                    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.2)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "16px",
                    zIndex: 1000,
                    animation: "fadeIn 0.3s ease"
                }}>
                    <IoCheckmarkCircleOutline style={{ color: "#4CAF50", fontSize: "64px" }} />
                    <p style={{ fontSize: "18px", margin: 0 }}>Logged Out Successfully</p>
                </div>
            )}
        </>
    );
};

export default Navbar;